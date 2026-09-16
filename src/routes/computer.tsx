import { createFileRoute } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChessBoard, type BoardMove } from "@/components/ChessBoard";
import { EvalBar } from "@/components/EvalBar";
import { PlayerBar } from "@/components/PlayerBar";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES, resultText } from "@/lib/chess-shared";
import { useSettings, type BoardTheme, type PieceStyle } from "@/lib/settings";
import { useStockfish } from "@/lib/useStockfish";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/computer")({
  head: () => ({
    meta: [
      { title: "Play Stockfish AI — Chess Room" },
      {
        name: "description",
        content:
          "Play Stockfish in your browser across six strength levels, from beginner to master. No account needed.",
      },
      { property: "og:title", content: "Play Stockfish AI — Chess Room" },
      {
        property: "og:description",
        content:
          "Six Stockfish strength levels with live evaluation, running entirely in your browser.",
      },
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

  const { settings, update: updateSettings } = useSettings();
  const { ready, thinking, evaluation, requestMove, evaluatePosition, stop } = useStockfish();
  const difficulty = DIFFICULTIES[level]!;
  const engineColor = myColor === "w" ? "b" : "w";
  const busyRef = useRef(false);

  const sync = useCallback(() => {
    const currentFen = chess.fen();
    setFen(currentFen);
    setHistory(chess.history());
    if (chess.isCheckmate()) {
      setStatus({ result: chess.turn() === "w" ? "0-1" : "1-0", reason: "checkmate" });
    } else if (chess.isDraw() || chess.isStalemate()) {
      setStatus({ result: "1/2-1/2", reason: chess.isStalemate() ? "stalemate" : "draw" });
    } else if (chess.turn() === myColor) {
      evaluatePosition(currentFen, difficulty.depth);
    }
  }, [chess, difficulty.depth, evaluatePosition, myColor]);

  const engineTurn = chess.turn() === engineColor && !status.result;

  useEffect(() => {
    if (!ready || !engineTurn || busyRef.current) return;
    busyRef.current = true;

    requestMove({
      fen: chess.fen(),
      depth: difficulty.depth,
      skill: difficulty.skill,
      onBestMove: (uci) => {
        try {
          const from = uci.slice(0, 2);
          const to = uci.slice(2, 4);
          const promoChar = uci[4];
          const promotion = promoChar ? (promoChar.toLowerCase() as "q" | "r" | "b" | "n") : "q";
          const move = chess.move({
            from,
            to,
            promotion,
          });
          if (move) setLastMove({ from: move.from, to: move.to });
        } catch {
          /* ignore invalid moves */
        }
        busyRef.current = false;
        sync();
      },
    });
  }, [ready, engineTurn, chess, difficulty, requestMove, sync, fen]);

  function handleMove(move: BoardMove) {
    if (status.result || chess.turn() !== myColor) return;
    try {
      const played = chess.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
      if (played) setLastMove({ from: played.from, to: played.to });
    } catch {
      return;
    }
    sync();
  }

  function newGame(color: "w" | "b" = myColor) {
    stop();
    chess.reset();
    setMyColor(color);
    setLastMove(null);
    setStatus({ result: null, reason: null });
    busyRef.current = false;
    sync();
  }

  function undo() {
    if (thinking || busyRef.current) return;
    stop();
    chess.undo(); // Undo engine move
    chess.undo(); // Undo user move
    setStatus({ result: null, reason: null });
    setLastMove(null);
    busyRef.current = false;
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
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {/* Top Player (Engine) */}
          <PlayerBar
            name={`Stockfish ${difficulty.label}`}
            color={engineColor}
            ms={0}
            active={chess.turn() === engineColor && !status.result}
            fen={fen}
            rating={difficulty.elo}
            isBot={true}
          />

          <div className="my-3 flex gap-3">
            {/* Live Evaluation Bar */}
            <EvalBar evaluation={evaluation} turn={chess.turn()} orientation={myColor} />

            {/* Main Chessboard */}
            <div className="flex-1">
              <ChessBoard
                fen={fen}
                orientation={myColor}
                myColor={myColor}
                lastMove={lastMove}
                interactive={!status.result && chess.turn() === myColor && !thinking}
                onMove={handleMove}
              />
            </div>
          </div>

          {/* Bottom Player (Human) */}
          <PlayerBar
            name="You"
            color={myColor}
            ms={0}
            active={chess.turn() === myColor && !status.result}
            fen={fen}
          />
        </div>

        <aside className="space-y-4">
          <div className="paper p-5">
            <p className="eyebrow text-muted-foreground">Engine Strength</p>
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
            <p className="eyebrow text-muted-foreground">Appearance</p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Pieces Style</label>
                <div className="mt-1 flex gap-2">
                  {(["staunton", "neo", "glyph"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateSettings({ pieceStyle: st as PieceStyle })}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-1 text-xs font-semibold capitalize",
                        settings.pieceStyle === st
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Board Theme</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(["emerald", "wood", "midnight", "cyberpunk", "slate", "classic"] as const).map(
                    (th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => updateSettings({ boardTheme: th as BoardTheme })}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-semibold capitalize",
                          settings.boardTheme === th
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border hover:bg-secondary",
                        )}
                      >
                        {th}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="paper p-5">
            <p className="eyebrow text-muted-foreground">Game Controls</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => newGame("w")}>
                New as White
              </Button>
              <Button size="sm" variant="outline" onClick={() => newGame("b")}>
                New as Black
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={undo}
                disabled={history.length < 2 || thinking}
              >
                Undo
              </Button>
            </div>
          </div>

          <div className="paper p-5">
            <p className="eyebrow text-muted-foreground">Move History</p>
            <div className="mt-3 max-h-56 overflow-y-auto font-mono text-sm">
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
