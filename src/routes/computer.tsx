import { createFileRoute } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { ChessBoard, type BoardMove } from "@/components/ChessBoard";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES, resultText } from "@/lib/chess-shared";
import { useStockfish } from "@/lib/useStockfish";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/computer")({
  head: () => ({
    meta: [
      { title: "Play the Computer — Chess Room" },
      {
        name: "description",
        content: "Play Stockfish in your browser across six strength levels, from beginner to master. No account needed.",
      },
      { property: "og:title", content: "Play the Computer — Chess Room" },
      { property: "og:description", content: "Six Stockfish strength levels, running entirely in your browser." },
    ],
  }),
  component: ComputerPage,
});

function ComputerPage() {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [myColor, setMyColor] = useState<"w" | "b">("w");
  const [level, setLevel] = useState(2);
  const [status, setStatus] = useState<{ result: string | null; reason: string | null }>({
    result: null,
    reason: null,
  });
  const { ready, thinking, requestMove } = useStockfish();
  const difficulty = DIFFICULTIES[level]!;
  const engineColor = myColor === "w" ? "b" : "w";
  const busyRef = useRef(false);

  const sync = useCallback(() => {
    setFen(chess.fen());
    setHistory(chess.history());
    if (chess.isCheckmate()) {
      setStatus({ result: chess.turn() === "w" ? "0-1" : "1-0", reason: "checkmate" });
    } else if (chess.isDraw() || chess.isStalemate()) {
      setStatus({ result: "1/2-1/2", reason: chess.isStalemate() ? "stalemate" : "draw" });
    }
  }, [chess]);

  const engineTurn = chess.turn() === engineColor && !status.result;

  useEffect(() => {
    if (!ready || !engineTurn || busyRef.current) return;
    busyRef.current = true;
    const timer = setTimeout(() => {
      requestMove({
        fen: chess.fen(),
        depth: difficulty.depth,
        skill: difficulty.skill,
        onBestMove: (uci) => {
          try {
            const move = chess.move({
              from: uci.slice(0, 2),
              to: uci.slice(2, 4),
              promotion: (uci[4] as "q" | undefined) ?? "q",
            });
            if (move) setLastMove({ from: move.from, to: move.to });
          } catch {
            /* ignore */
          }
          busyRef.current = false;
          sync();
        },
      });
    }, 350);
    return () => {
      clearTimeout(timer);
      busyRef.current = false;
    };
  }, [ready, engineTurn, chess, difficulty, requestMove, sync, fen]);

  function handleMove(move: BoardMove) {
    if (status.result) return;
    try {
      const played = chess.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
      if (played) setLastMove({ from: played.from, to: played.to });
    } catch {
      return;
    }
    sync();
  }

  function newGame(color: "w" | "b" = myColor) {
    chess.reset();
    setMyColor(color);
    setLastMove(null);
    setStatus({ result: null, reason: null });
    busyRef.current = false;
    sync();
  }

  function undo() {
    if (thinking) return;
    chess.undo();
    chess.undo();
    setStatus({ result: null, reason: null });
    setLastMove(null);
    sync();
  }

  const pairs = useMemo(() => {
    const list: { no: number; white?: string; black?: string }[] = [];
    history.forEach((san, index) => {
      const no = Math.floor(index / 2) + 1;
      if (index % 2 === 0) list.push({ no, white: san });
      else list[list.length - 1]!.black = san;
    });
    return list;
  }, [history]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-lg font-bold">
              Stockfish · {difficulty.label} <span className="text-muted-foreground">({difficulty.elo})</span>
            </p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {status.result
                ? resultText(status.result, status.reason)
                : !ready
                  ? "Loading engine…"
                  : thinking
                    ? "Thinking…"
                    : chess.turn() === myColor
                      ? "Your move"
                      : "Engine to move"}
            </p>
          </div>
          <ChessBoard
            fen={fen}
            orientation={myColor}
            myColor={myColor}
            lastMove={lastMove}
            interactive={!status.result}
            onMove={handleMove}
          />
        </div>

        <aside className="space-y-4">
          <div className="paper p-5">
            <p className="eyebrow text-muted-foreground">Strength</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DIFFICULTIES.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setLevel(index)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                    index === level
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="paper p-5">
            <p className="eyebrow text-muted-foreground">Game</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => newGame("w")}>
                New as white
              </Button>
              <Button size="sm" variant="outline" onClick={() => newGame("b")}>
                New as black
              </Button>
              <Button size="sm" variant="ghost" onClick={undo} disabled={history.length < 2}>
                Undo
              </Button>
            </div>
          </div>

          <div className="paper p-5">
            <p className="eyebrow text-muted-foreground">Moves</p>
            <div className="mt-3 max-h-72 overflow-y-auto font-mono text-sm">
              {pairs.length === 0 && <p className="text-muted-foreground">No moves yet.</p>}
              {pairs.map((pair) => (
                <div key={pair.no} className="flex gap-3 py-0.5">
                  <span className="w-6 text-muted-foreground">{pair.no}.</span>
                  <span className="w-16">{pair.white}</span>
                  <span className="w-16">{pair.black ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
