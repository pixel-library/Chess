import { createFileRoute } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { ChevronLeft, ChevronRight, Copy, Lightbulb, RotateCcw, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ChessBoard, type BoardMove } from "@/components/ChessBoard";
import { EvalBar } from "@/components/EvalBar";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getOpeningName } from "@/lib/opening-book";
import { useStockfish } from "@/lib/useStockfish";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Chess Position & PGN Analysis — Stockfish 18 Engine" },
      {
        name: "description",
        content:
          "Analyze chess positions, paste FEN or PGN strings, and study variations with live Stockfish 18 evaluation.",
      },
      { property: "og:title", content: "Chess Analysis Board — Chess Room" },
      {
        property: "og:description",
        content: "Deep Stockfish analysis, PGN importer, and opening book explorer.",
      },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [currentPly, setCurrentPly] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<"w" | "b">("w");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [hintArrow, setHintArrow] = useState<{ from: string; to: string } | null>(null);

  const [inputFen, setInputFen] = useState("");
  const [inputPgn, setInputPgn] = useState("");

  const { thinking, evaluation, evaluatePosition, requestMove } = useStockfish();

  const movesHistory = useMemo(() => chess.history({ verbose: true }), [chess, history]);
  const moveSans = useMemo(() => history, [history]);
  const openingInfo = useMemo(() => getOpeningName(moveSans), [moveSans]);

  const displayFen = useMemo(() => {
    if (currentPly !== null && movesHistory[currentPly]) {
      return movesHistory[currentPly].after;
    }
    return fen;
  }, [currentPly, movesHistory, fen]);

  const displayLastMove = useMemo(() => {
    if (currentPly !== null && movesHistory[currentPly]) {
      const m = movesHistory[currentPly];
      return { from: m.from, to: m.to };
    }
    return lastMove;
  }, [currentPly, movesHistory, lastMove]);

  const sync = useCallback(() => {
    const currentFen = chess.fen();
    setFen(currentFen);
    setHistory(chess.history());
    setHintArrow(null);
    evaluatePosition(currentFen, 14);
  }, [chess, evaluatePosition]);

  // Evaluate position when stepping through moves
  useEffect(() => {
    evaluatePosition(displayFen, 14);
  }, [displayFen, evaluatePosition]);

  function handleMove(move: BoardMove) {
    try {
      // If we're reviewing past moves, reload chess up to currentPly
      if (currentPly !== null && currentPly < movesHistory.length - 1) {
        const fenAtPly = movesHistory[currentPly]?.after ?? chess.fen();
        chess.load(fenAtPly);
      }
      const played = chess.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
      if (played) {
        setLastMove({ from: played.from, to: played.to });
        setCurrentPly(null);
      }
    } catch {
      return;
    }
    sync();
  }

  function handleLoadFen() {
    if (!inputFen.trim()) return;
    try {
      chess.load(inputFen.trim());
      setCurrentPly(null);
      setLastMove(null);
      sync();
      toast.success("FEN loaded successfully");
    } catch {
      toast.error("Invalid FEN string");
    }
  }

  function handleLoadPgn() {
    if (!inputPgn.trim()) return;
    try {
      chess.loadPgn(inputPgn.trim());
      setCurrentPly(null);
      setLastMove(null);
      sync();
      toast.success("PGN loaded successfully");
    } catch {
      toast.error("Invalid PGN text");
    }
  }

  function handleReset() {
    chess.reset();
    setCurrentPly(null);
    setLastMove(null);
    setInputFen("");
    setInputPgn("");
    sync();
  }

  function getHint() {
    if (thinking) return;
    requestMove({
      fen: displayFen,
      depth: 16,
      skill: 20,
      onBestMove: (uci) => {
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        setHintArrow({ from, to });
      },
    });
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        setCurrentPly((p) => {
          const current = p ?? history.length - 1;
          return Math.max(0, current - 1);
        });
      } else if (e.key === "ArrowRight") {
        setCurrentPly((p) => {
          if (p === null || p >= history.length - 1) return null;
          return p + 1 === history.length - 1 ? null : p + 1;
        });
      } else if (e.key === "ArrowUp") {
        if (history.length > 0) setCurrentPly(0);
      } else if (e.key === "ArrowDown" || e.key === "Escape") {
        setCurrentPly(null);
        setHintArrow(null);
      } else if (e.key === "f" || e.key === "F") {
        setOrientation((o) => (o === "w" ? "b" : "w"));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history.length]);

  const pairs = useMemo(() => {
    const list: {
      no: number;
      white?: { san: string; ply: number };
      black?: { san: string; ply: number };
    }[] = [];
    history.forEach((san, index) => {
      const no = Math.floor(index / 2) + 1;
      if (index % 2 === 0) list.push({ no, white: { san, ply: index } });
      else list[list.length - 1]!.black = { san, ply: index };
    });
    return list;
  }, [history]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-4 px-3 py-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-4 lg:items-start">
        <div className="flex flex-col items-center lg:items-stretch">
          <div className="w-full max-w-[min(100%,calc(100vh-165px))] mx-auto">
            {/* Opening Badge */}
            {openingInfo && (
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-2.5 py-1 font-mono text-xs font-bold text-accent">
                  <span className="opacity-75">{openingInfo.eco}</span>
                  <span>{openingInfo.name}</span>
                </span>
                <span className="text-[0.65rem] text-muted-foreground">Press F to flip board</span>
              </div>
            )}

            <div className="my-1.5 flex gap-2.5">
              {/* Stockfish Eval Bar */}
              <EvalBar evaluation={evaluation} turn={chess.turn()} orientation={orientation} />

              {/* Main Chessboard */}
              <div className="flex-1">
                <ChessBoard
                  fen={displayFen}
                  orientation={orientation}
                  lastMove={displayLastMove}
                  customArrows={hintArrow ? [hintArrow] : []}
                  interactive={true}
                  onMove={handleMove}
                />
              </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={history.length === 0}
                  onClick={() => setCurrentPly(0)}
                  title="First move (Up Arrow)"
                >
                  «
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={history.length === 0}
                  onClick={() =>
                    setCurrentPly((p) => {
                      const current = p ?? history.length - 1;
                      return Math.max(0, current - 1);
                    })
                  }
                  title="Previous move (Left Arrow)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={history.length === 0}
                  onClick={() =>
                    setCurrentPly((p) => {
                      if (p === null || p >= history.length - 1) return null;
                      return p + 1 === history.length - 1 ? null : p + 1;
                    })
                  }
                  title="Next move (Right Arrow)"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={history.length === 0}
                  onClick={() => setCurrentPly(null)}
                  title="Live move (Down Arrow)"
                >
                  »
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={getHint}
                  disabled={thinking}
                  className="gap-1 font-bold"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  Best Move
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOrientation((o) => (o === "w" ? "b" : "w"))}
                  title="Flip board (F)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          {/* Move History */}
          <div className="paper p-5">
            <p className="eyebrow text-muted-foreground">Move History</p>
            <div className="mt-3 max-h-48 overflow-y-auto font-mono text-sm">
              {pairs.length === 0 && <p className="text-muted-foreground">No moves played yet.</p>}
              {pairs.map((pair) => (
                <div key={pair.no} className="flex items-center gap-2 py-0.5">
                  <span className="w-6 text-muted-foreground">{pair.no}.</span>
                  {[pair.white, pair.black].map((entry, i) =>
                    entry ? (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setCurrentPly(entry.ply === history.length - 1 ? null : entry.ply)
                        }
                        className={cn(
                          "w-16 rounded px-1 text-left hover:bg-secondary transition-colors",
                          currentPly === entry.ply && "bg-accent text-accent-foreground font-bold",
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
          </div>

          {/* Import / Export Controls */}
          <div className="paper space-y-4 p-5">
            <div>
              <p className="eyebrow text-muted-foreground">Load FEN String</p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={inputFen}
                  placeholder="r1bqk2r/pppp1ppp/2n2n2/..."
                  className="font-mono text-xs"
                  onChange={(e) => setInputFen(e.target.value)}
                />
                <Button size="sm" onClick={handleLoadFen}>
                  <Upload className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div>
              <p className="eyebrow text-muted-foreground">Load PGN Text</p>
              <div className="mt-2 space-y-2">
                <Textarea
                  value={inputPgn}
                  rows={3}
                  placeholder="1. e4 e5 2. Nf3 Nc6..."
                  className="font-mono text-xs"
                  onChange={(e) => setInputPgn(e.target.value)}
                />
                <Button size="sm" onClick={handleLoadPgn} className="w-full font-bold">
                  Import PGN
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border/60">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await navigator.clipboard.writeText(chess.fen());
                  toast.success("FEN copied to clipboard");
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" /> FEN
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await navigator.clipboard.writeText(chess.pgn());
                  toast.success("PGN copied to clipboard");
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" /> PGN
              </Button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
