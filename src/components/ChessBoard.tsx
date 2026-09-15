import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSettings } from "@/lib/settings";
import { playMoveSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const GLYPHS: Record<string, string> = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

export type BoardMove = { from: string; to: string; promotion?: "q" | "r" | "b" | "n" };

type Props = {
  fen: string;
  orientation?: "w" | "b";
  interactive?: boolean;
  myColor?: "w" | "b" | null;
  lastMove?: { from: string; to: string } | null;
  showCoordinates?: boolean;
  onMove?: (move: BoardMove) => void;
};

export function ChessBoard({
  fen,
  orientation = "w",
  interactive = true,
  myColor = null,
  lastMove = null,
  showCoordinates = true,
  onMove,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<BoardMove | null>(null);
  const { settings } = useSettings();
  const prevFenRef = useRef(fen);

  useEffect(() => {
    if (prevFenRef.current && prevFenRef.current !== fen) {
      if (settings.sounds) {
        playMoveSound(settings.volume);
      }
    }
    prevFenRef.current = fen;
  }, [fen, settings.sounds, settings.volume]);

  const chess = useMemo(() => {
    const game = new Chess();
    try {
      game.load(fen);
    } catch {
      /* invalid fen — render empty */
    }
    return game;
  }, [fen]);

  const board = chess.board();
  const turn = chess.turn();
  const canMove = interactive && (myColor === null || myColor === turn);

  const legalTargets = useMemo(() => {
    if (!selected) return new Map<string, boolean>();
    const map = new Map<string, boolean>();
    for (const move of chess.moves({ square: selected as Square, verbose: true })) {
      map.set(move.to, Boolean(move.captured));
    }
    return map;
  }, [chess, selected]);

  const kingInCheck = useMemo(() => {
    if (!chess.inCheck()) return null;
    for (const row of chess.board()) {
      for (const cell of row) {
        if (cell && cell.type === "k" && cell.color === turn) return cell.square as string;
      }
    }
    return null;
  }, [chess, turn]);

  const rows = orientation === "w" ? board : [...board].reverse().map((r) => [...r].reverse());
  const fileLabels = orientation === "w" ? FILES : [...FILES].reverse();
  const rankLabels = orientation === "w" ? RANKS : [...RANKS].reverse();

  function attemptMove(from: string, to: string) {
    const piece = chess.get(from as Square);
    const isPromotion =
      piece?.type === "p" && ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));
    if (isPromotion) {
      setPending({ from, to });
      setSelected(null);
      return;
    }
    setSelected(null);
    onMove?.({ from, to });
  }

  function handleSquare(square: string) {
    if (!canMove) return;
    if (selected && legalTargets.has(square)) {
      attemptMove(selected, square);
      return;
    }
    const piece = chess.get(square as Square);
    if (piece && piece.color === turn) {
      setSelected(square === selected ? null : square);
    } else {
      setSelected(null);
    }
  }

  return (
    <div className="relative w-full">
      <div className="rounded-2xl bg-board-frame p-2 shadow-plate sm:p-3">
        <div className="grid grid-cols-8 overflow-hidden rounded-lg">
          {rows.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const file = fileLabels[colIndex]!;
              const rank = rankLabels[rowIndex]!;
              const square = `${file}${rank}`;
              const isDark = (FILES.indexOf(file) + Number(rank)) % 2 !== 0;
              const isSelected = selected === square;
              const target = legalTargets.get(square);
              const isLast = lastMove && (lastMove.from === square || lastMove.to === square);

              return (
                <button
                  key={square}
                  type="button"
                  onClick={() => handleSquare(square)}
                  onDragStart={(event) => {
                    if (!canMove || !cell || cell.color !== turn) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.setData("text/plain", square);
                    setSelected(square);
                  }}
                  onDragOver={(event) => {
                    if (selected && legalTargets.has(square)) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = event.dataTransfer.getData("text/plain");
                    if (from && legalTargets.has(square)) attemptMove(from, square);
                  }}
                  draggable={Boolean(cell) && canMove && cell?.color === turn}
                  aria-label={`${square}${cell ? ` ${cell.color === "w" ? "white" : "black"} ${cell.type}` : " empty"}`}
                  className={cn(
                    "relative flex aspect-square touch-manipulation items-center justify-center transition-colors",
                    isDark ? "bg-board-dark" : "bg-board-light",
                    isLast && "outline outline-2 -outline-offset-2 outline-accent/70",
                  )}
                >
                  {isSelected && <span className="absolute inset-0 bg-highlight" />}
                  {kingInCheck === square && (
                    <span className="absolute inset-0 bg-check [mask-image:radial-gradient(circle,black,transparent_72%)]" />
                  )}
                  {target !== undefined && !cell && (
                    <span className="absolute h-[22%] w-[22%] rounded-full bg-accent/70" />
                  )}
                  {target !== undefined && cell && (
                    <span className="absolute inset-[6%] rounded-full border-4 border-accent/80" />
                  )}
                  {cell && (
                    <span
                      className={cn(
                        "pointer-events-none relative z-10 select-none text-[clamp(1.6rem,7.4vw,3.1rem)] leading-none",
                        cell.color === "w"
                          ? "text-board-light [text-shadow:0_0_1px_oklch(0.17_0.008_60),0_1px_0_oklch(0.17_0.008_60),1px_0_0_oklch(0.17_0.008_60),-1px_0_0_oklch(0.17_0.008_60),0_-1px_0_oklch(0.17_0.008_60),0_3px_6px_oklch(0.17_0.008_60/0.35)]"
                          : "text-ink [text-shadow:0_1px_0_oklch(0.93_0.018_85/0.35),0_3px_6px_oklch(0.17_0.008_60/0.35)]",
                      )}
                    >
                      {GLYPHS[cell.type]}
                    </span>
                  )}
                  {showCoordinates && colIndex === 0 && (
                    <span
                      className={cn(
                        "absolute left-0.5 top-0.5 text-[0.55rem] font-semibold",
                        isDark ? "text-board-light/70" : "text-board-dark/70",
                      )}
                    >
                      {rank}
                    </span>
                  )}
                  {showCoordinates && rowIndex === 7 && (
                    <span
                      className={cn(
                        "absolute bottom-0.5 right-1 text-[0.55rem] font-semibold",
                        isDark ? "text-board-light/70" : "text-board-dark/70",
                      )}
                    >
                      {file}
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {pending && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-ink/70 p-4">
          <div className="paper w-full max-w-xs p-5 text-center">
            <p className="eyebrow text-muted-foreground">Promote to</p>
            <div className="mt-4 flex justify-center gap-2">
              {(["q", "r", "b", "n"] as const).map((piece) => (
                <button
                  key={piece}
                  type="button"
                  onClick={() => {
                    onMove?.({ ...pending, promotion: piece });
                    setPending(null);
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-secondary text-3xl transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {GLYPHS[piece]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="mt-4 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
