import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  Handshake,
  RefreshCw,
  RotateCcw,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Chess } from "chess.js";
import { ChessBoard, type BoardMove } from "@/components/ChessBoard";
import { PlayerBar } from "@/components/PlayerBar";
import { notifyTurn, requestNotificationPermission, resetTitle } from "@/lib/notifications";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatClock, resultText } from "@/lib/chess-shared";
import {
  claimTimeout,
  drawAction,
  joinGame,
  makeMove,
  requestRematch,
  resignGame,
  sendChatMessage,
} from "@/lib/chess.functions";
import {
  addRecentGame,
  applyRatingChange,
  getPlayerName,
  getSessionId,
  loadCredentials,
  saveCredentials,
} from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/game/$code")({
  head: () => ({
    meta: [
      { title: "Game Room — Chess Room" },
      {
        name: "description",
        content: "A live chess room. Share the code to invite your opponent and play.",
      },
      { property: "og:title", content: "Game Room — Chess Room" },
      {
        property: "og:description",
        content: "A live chess room with clocks, chat and PGN export.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GamePage,
});

type GameRow = {
  id: string;
  code: string;
  status: string;
  fen: string;
  pgn: string;
  turn: string;
  minutes: number;
  increment: number;
  rated: boolean;
  white_ms: number;
  black_ms: number;
  white_name: string | null;
  black_name: string | null;
  last_move_at: string;
  draw_offer_by: string | null;
  rematch_offer_by: string | null;
  rematch_game_code: string | null;
  result: string | null;
  result_reason: string | null;
};

type MoveRow = { ply: number; color: string; san: string; uci: string; fen_after: string };
type ChatRow = {
  id: string;
  sender_name: string;
  sender_color: string;
  body: string;
  created_at: string;
};

function GamePage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [creds, setCreds] = useState<{ color: "w" | "b"; token: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reviewPly, setReviewPly] = useState<number | null>(null);
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);
  const [broadcastLastMove, setBroadcastLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const recordedRef = useRef(false);
  const timeoutRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const move = useServerFn(makeMove);
  const resign = useServerFn(resignGame);
  const draw = useServerFn(drawAction);
  const chat = useServerFn(sendChatMessage);
  const rematch = useServerFn(requestRematch);
  const timeout = useServerFn(claimTimeout);
  const join = useServerFn(joinGame);

  const gameQuery = useQuery({
    queryKey: ["game", code],
    refetchInterval: (query) => (query.state.data?.status === "active" ? 2000 : 10000),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select(
          "id, code, status, fen, pgn, turn, minutes, increment, rated, white_ms, black_ms, white_name, black_name, last_move_at, draw_offer_by, rematch_offer_by, rematch_game_code, result, result_reason",
        )
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      return (data as GameRow | null) ?? null;
    },
  });
  const game = gameQuery.data ?? null;

  useEffect(() => {
    setOptimisticFen(null);
    setBroadcastLastMove(null);
  }, [game?.fen]);

  const movesQuery = useQuery({
    queryKey: ["game-moves", game?.id],
    enabled: Boolean(game?.id),
    refetchInterval: (query) => (game?.status === "active" ? 2000 : 10000),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_moves")
        .select("ply, color, san, uci, fen_after")
        .eq("game_id", game!.id)
        .order("ply", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MoveRow[];
    },
  });
  const moves = movesQuery.data ?? [];

  const chatQuery = useQuery({
    queryKey: ["game-chat", game?.id],
    enabled: Boolean(game?.id),
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, sender_name, sender_color, body, created_at")
        .eq("game_id", game!.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ChatRow[];
    },
  });
  const messages = chatQuery.data ?? [];

  // Seat: stored credentials, or auto-join when a seat is free (invite links).
  useEffect(() => {
    const stored = loadCredentials(code);
    if (stored) {
      setCreds({ color: stored.color, token: stored.token });
      return;
    }
    const name = getPlayerName();
    if (!name) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await join({ data: { code, name, sessionId: getSessionId() } });
        if (cancelled) return;
        saveCredentials(result);
        setCreds({ color: result.color, token: result.token });
        void queryClient.invalidateQueries({ queryKey: ["game", code] });
      } catch {
        /* spectator */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, join, queryClient]);

  // Realtime updates with instant WebSocket Broadcast & Postgres CDC listeners
  useEffect(() => {
    if (!game?.id) return;
    const gameId = game.id;
    const channel = supabase.channel(`room-${gameId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "move" }, (payload) => {
        const data = payload["payload"] as { fen?: string; from?: string; to?: string };
        if (data.fen) setOptimisticFen(data.fen);
        if (data.from && data.to) setBroadcastLastMove({ from: data.from, to: data.to });
        void queryClient.invalidateQueries({ queryKey: ["game", code] });
        void queryClient.invalidateQueries({ queryKey: ["game-moves", gameId] });
      })
      .on("broadcast", { event: "chat" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["game-chat", gameId] });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["game", code] });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_moves", filter: `game_id=eq.${gameId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["game-moves", gameId] });
          void queryClient.invalidateQueries({ queryKey: ["game", code] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["game-chat", gameId] });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [game?.id, code, queryClient]);

  // Notification permission request on room join
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Notification trigger on turn change
  useEffect(() => {
    if (game?.status === "active" && creds && game.turn === creds.color) {
      notifyTurn(game.code);
    } else {
      resetTitle();
    }
    return () => resetTitle();
  }, [game?.status, game?.turn, game?.code, creds]);

  const clocks = useMemo(() => {
    if (!game) return { w: 0, b: 0 };
    if (game.status !== "active") return { w: game.white_ms, b: game.black_ms };
    const elapsed = now - new Date(game.last_move_at).getTime();
    return game.turn === "w"
      ? { w: Math.max(0, game.white_ms - elapsed), b: game.black_ms }
      : { w: game.white_ms, b: Math.max(0, game.black_ms - elapsed) };
  }, [game, now]);

  // Flag fall — anyone in the room can claim it; the server re-verifies.
  useEffect(() => {
    if (!game || game.status !== "active" || timeoutRef.current) return;
    const mover = game.turn === "w" ? clocks.w : clocks.b;
    if (mover > 0) return;
    timeoutRef.current = true;
    void timeout({ data: { code } })
      .then(() => queryClient.invalidateQueries({ queryKey: ["game", code] }))
      .finally(() => {
        timeoutRef.current = false;
      });
  }, [game, clocks, timeout, code, queryClient]);

  // Record result locally once.
  useEffect(() => {
    if (!game || game.status !== "finished" || !game.result || recordedRef.current) return;
    recordedRef.current = true;
    const myColor = creds?.color ?? null;
    addRecentGame({
      code: game.code,
      opponent: (myColor === "w" ? game.black_name : game.white_name) ?? "Opponent",
      timeControl: `${game.minutes}+${game.increment}`,
      outcome:
        game.result === "1/2-1/2"
          ? "Draw"
          : !myColor
            ? "Unfinished"
            : (game.result === "1-0") === (myColor === "w")
              ? "Won"
              : "Lost",
      at: Date.now(),
    });
    if (myColor && game.rated) {
      const score =
        game.result === "1/2-1/2" ? 0.5 : (game.result === "1-0") === (myColor === "w") ? 1 : 0;
      applyRatingChange(score as 1 | 0 | 0.5);
    }
  }, [game, creds]);

  const displayFen = useMemo(() => {
    if (reviewPly !== null) {
      const entry = moves[reviewPly];
      return entry ? entry.fen_after : (game?.fen ?? "");
    }
    return optimisticFen ?? game?.fen ?? "";
  }, [reviewPly, moves, game?.fen, optimisticFen]);

  const lastMoveSquares = useMemo(() => {
    if (reviewPly !== null) {
      const entry = moves[reviewPly];
      if (!entry) return null;
      return { from: entry.uci.slice(0, 2), to: entry.uci.slice(2, 4) };
    }
    if (broadcastLastMove) return broadcastLastMove;
    const entry = moves[moves.length - 1];
    if (!entry) return null;
    return { from: entry.uci.slice(0, 2), to: entry.uci.slice(2, 4) };
  }, [moves, reviewPly, broadcastLastMove]);

  const orientation: "w" | "b" = flipped
    ? creds?.color === "b"
      ? "w"
      : "b"
    : (creds?.color ?? "w");
  const reviewing = reviewPly !== null && reviewPly < moves.length - 1;

  const pairs = useMemo(() => {
    const list: {
      no: number;
      white?: { san: string; ply: number };
      black?: { san: string; ply: number };
    }[] = [];
    moves.forEach((m, index) => {
      const no = Math.floor(index / 2) + 1;
      if (index % 2 === 0) list.push({ no, white: { san: m.san, ply: index } });
      else list[list.length - 1]!.black = { san: m.san, ply: index };
    });
    return list;
  }, [moves]);

  async function handleMove(m: BoardMove) {
    if (!game || !creds || game.status !== "active") return;

    let nextFen: string | null = null;
    try {
      const chess = new Chess();
      if (game.pgn && game.pgn.trim().length > 0) {
        try {
          chess.loadPgn(game.pgn);
        } catch {
          chess.load(game.fen);
        }
      } else {
        chess.load(game.fen);
      }
      const played = chess.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
      if (played) {
        nextFen = chess.fen();
        setOptimisticFen(nextFen);
        setBroadcastLastMove({ from: m.from, to: m.to });

        // Instant WebSocket Broadcast to opponent (<20ms latency)
        channelRef.current?.send({
          type: "broadcast",
          event: "move",
          payload: {
            fen: nextFen,
            from: m.from,
            to: m.to,
            promotion: m.promotion,
            san: played.san,
          },
        });
      }
    } catch {
      /* ignore preview error */
    }

    try {
      await move({
        data: { code, token: creds.token, from: m.from, to: m.to, promotion: m.promotion },
      });
      void queryClient.invalidateQueries({ queryKey: ["game", code] });
      void queryClient.invalidateQueries({ queryKey: ["game-moves", game.id] });
    } catch (error) {
      setOptimisticFen(null);
      setBroadcastLastMove(null);
      toast.error(error instanceof Error ? error.message : "Move rejected");
      void queryClient.invalidateQueries({ queryKey: ["game", code] });
    }
  }

  async function act(fn: () => Promise<unknown>, failure: string) {
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["game", code] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : failure);
    }
  }

  async function handleRematch() {
    if (!creds) return;
    try {
      const result = await rematch({ data: { code, token: creds.token } });
      if (result.code && result.token) {
        saveCredentials({ code: result.code, color: result.color, token: result.token });
        navigate({ to: "/game/$code", params: { code: result.code } });
        return;
      }
      toast.success("Rematch offered");
      await queryClient.invalidateQueries({ queryKey: ["game", code] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rematch failed");
    }
  }

  // Follow the opponent into a rematch automatically.
  useEffect(() => {
    if (!game?.rematch_game_code || !creds) return;
    void (async () => {
      try {
        const result = await rematch({ data: { code, token: creds.token } });
        if (result.code && result.token) {
          saveCredentials({ code: result.code, color: result.color, token: result.token });
          navigate({ to: "/game/$code", params: { code: result.code } });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [game?.rematch_game_code, creds, code, rematch, navigate]);

  if (gameQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Loading room…</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="display-xl text-3xl">Room not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The code <span className="font-mono">{code}</span> does not match a game.
          </p>
          <Button asChild className="mt-6">
            <Link to="/play">Back to lobby</Link>
          </Button>
        </main>
      </div>
    );
  }

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/game/${game.code}` : "";
  const topColor: "w" | "b" = orientation === "w" ? "b" : "w";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-4 px-3 py-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-3 lg:items-start">
        <div className="flex flex-col items-center lg:items-stretch">
          <div className="w-full max-w-[min(100%,calc(100vh-165px))] mx-auto">
            <PlayerBar
              name={(topColor === "w" ? game.white_name : game.black_name) ?? "Waiting…"}
              color={topColor}
              ms={topColor === "w" ? clocks.w : clocks.b}
              active={game.status === "active" && game.turn === topColor}
              fen={displayFen}
            />
            <div className="my-1.5">
              <ChessBoard
                fen={displayFen}
                orientation={orientation}
                myColor={creds?.color ?? null}
                lastMove={lastMoveSquares}
                interactive={Boolean(creds) && game.status === "active" && !reviewing}
                onMove={handleMove}
              />
            </div>
            <PlayerBar
              name={(orientation === "w" ? game.white_name : game.black_name) ?? "Waiting…"}
              color={orientation}
              ms={orientation === "w" ? clocks.w : clocks.b}
              active={game.status === "active" && game.turn === orientation}
              fen={displayFen}
            />
          </div>

          {game.status === "waiting" && (
            <div className="paper mt-4 p-5 text-center">
              <p className="font-display text-xl font-bold">Waiting for an opponent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share this code or link to start the game.
              </p>
              <p className="mt-4 font-display text-4xl font-extrabold tracking-[0.3em]">
                {game.code}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(game.code);
                    toast.success("Code copied");
                  }}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" /> Copy code
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteLink);
                    toast.success("Invite link copied");
                  }}
                >
                  Copy invite link
                </Button>
              </div>
            </div>
          )}

          {game.status === "finished" && (
            <div className="ink-panel mt-4 p-6 text-center">
              <p className="eyebrow text-accent">Game over</p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {resultText(game.result, game.result_reason)}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {creds && (
                  <Button size="sm" variant="secondary" onClick={handleRematch}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Rematch
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(game.pgn);
                    toast.success("PGN copied");
                  }}
                >
                  Copy PGN
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(game.fen);
                    toast.success("FEN copied");
                  }}
                >
                  Copy FEN
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/play">New game</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="paper p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow text-muted-foreground">Room {game.code}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {game.minutes}+{game.increment} · {game.rated ? "Rated (session)" : "Casual"}
                  {creds
                    ? ` · you play ${creds.color === "w" ? "white" : "black"}`
                    : " · spectating"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setFlipped((f) => !f)}
                aria-label="Flip board"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {creds && game.status === "active" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    act(() => resign({ data: { code, token: creds.token } }), "Could not resign")
                  }
                >
                  <Flag className="mr-2 h-3.5 w-3.5" /> Resign
                </Button>
                {game.draw_offer_by && game.draw_offer_by !== creds.color ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        act(
                          () => draw({ data: { code, token: creds.token, action: "accept" } }),
                          "Could not accept",
                        )
                      }
                    >
                      Accept draw
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        act(
                          () => draw({ data: { code, token: creds.token, action: "decline" } }),
                          "Could not decline",
                        )
                      }
                    >
                      Decline
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={game.draw_offer_by === creds.color}
                    onClick={() =>
                      act(
                        () => draw({ data: { code, token: creds.token, action: "offer" } }),
                        "Could not offer",
                      )
                    }
                  >
                    <Handshake className="mr-2 h-3.5 w-3.5" />
                    {game.draw_offer_by === creds.color ? "Draw offered" : "Offer draw"}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="paper p-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-muted-foreground">Moves</p>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Previous move"
                  disabled={moves.length === 0}
                  onClick={() =>
                    setReviewPly((p) => {
                      const current = p ?? moves.length - 1;
                      return Math.max(0, current - 1);
                    })
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Next move"
                  disabled={moves.length === 0}
                  onClick={() =>
                    setReviewPly((p) => {
                      if (p === null || p >= moves.length - 1) return null;
                      return p + 1;
                    })
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 max-h-56 overflow-y-auto font-mono text-sm">
              {pairs.length === 0 && <p className="text-muted-foreground">No moves yet.</p>}
              {pairs.map((pair) => (
                <div key={pair.no} className="flex items-center gap-2 py-0.5">
                  <span className="w-6 text-muted-foreground">{pair.no}.</span>
                  {[pair.white, pair.black].map((entry, i) =>
                    entry ? (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setReviewPly(entry.ply === moves.length - 1 ? null : entry.ply)
                        }
                        className={cn(
                          "w-16 rounded px-1 text-left hover:bg-secondary",
                          reviewPly === entry.ply && "bg-accent text-accent-foreground",
                        )}
                      >
                        {entry.san}
                      </button>
                    ) : (
                      <span key={i} className="w-16" />
                    ),
                  )}
                </div>
              ))}
            </div>
            {reviewing && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setReviewPly(null)}>
                Back to live position
              </Button>
            )}
          </div>

          <div className="paper flex flex-col p-4">
            <p className="eyebrow text-muted-foreground">Chat</p>
            <div className="mt-3 max-h-52 min-h-24 flex-1 space-y-2 overflow-y-auto text-sm">
              {messages.length === 0 && (
                <p className="text-muted-foreground">Say hello. Keep it friendly.</p>
              )}
              {messages.map((message) => (
                <p key={message.id}>
                  <span className="font-semibold">{message.sender_name}: </span>
                  <span className="text-muted-foreground">{message.body}</span>
                </p>
              ))}
            </div>
            {creds && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const body = draft.trim();
                  if (!body) return;
                  setDraft("");
                  try {
                    channelRef.current?.send({
                      type: "broadcast",
                      event: "chat",
                      payload: { body },
                    });
                    await chat({ data: { code, token: creds.token, body } });
                    await queryClient.invalidateQueries({ queryKey: ["game-chat", game.id] });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Message not sent");
                  }
                }}
              >
                <Input
                  value={draft}
                  maxLength={280}
                  placeholder="Message"
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Button type="submit" size="icon" aria-label="Send message">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
