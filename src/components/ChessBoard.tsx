import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChessPiece, type PieceType, type PieceColor } from "@/components/ChessPieces";
import { useSettings } from "@/lib/settings";
import { playMoveSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

export type BoardMove = { from: string; to: string; promotion?: "q" | "r" | "b" | "n" };

type Arrow = { from: string; to: string };

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
  const [premove, setPremove] = useState<BoardMove | null>(null);
  const [pending, setPending] = useState<BoardMove | null>(null);

  // Board Annotations (Right-click highlights & arrows)
  const [highlightedSquares, setHighlightedSquares] = useState<Set<string>>(new Set());
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const rightClickStartRef = useRef<string | null>(null);

  const { settings } = useSettings();
  const prevFenRef = useRef(fen);

  const chess = useMemo(() => {
    const game = new Chess();
    try {
      game.load(fen);
    } catch {
      /* invalid FEN */
    }
    return game;
  }, [fen]);

  const turn = chess.turn();
  const canMoveNow = interactive && (myColor === null || myColor === turn);
  const isOpponentTurn = interactive && myColor !== null && myColor !== turn;

  // Sound triggers & Premove Execution on FEN change
  useEffect(() => {
    if (prevFenRef.current && prevFenRef.current !== fen) {
      if (settings.sounds) {
        const last = chess.history({ verbose: true }).pop();
        if (chess.isCheckmate()) {
          playMoveSound(settings.volume, myColor === turn ? "defeat" : "victory");
        } else if (chess.inCheck()) {
          playMoveSound(settings.volume, "check");
        } else if (last?.san === "O-O" || last?.san === "O-O-O") {
          playMoveSound(settings.volume, "castle");
        } else if (last?.captured) {
          playMoveSound(settings.volume, "capture");
        } else {
          playMoveSound(settings.volume, "move");
        }
      }
      // Execute queued premove if it's now our turn
      if (premove && myColor === turn) {
        const pMove = premove;
        setPremove(null);
        try {
          const testChess = new Chess(fen);
          const legal = testChess.move({
            from: pMove.from,
            to: pMove.to,
            promotion: pMove.promotion ?? "q",
          });
          if (legal) {
            onMove?.(pMove);
          }
        } catch {
          /* invalid premove after opponent move */
        }
      }
    }
    prevFenRef.current = fen;
  }, [fen, settings.sounds, settings.volume, premove, myColor, turn, chess, onMove]);

  const board = chess.board();

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

  function clearAnnotations() {
    if (highlightedSquares.size > 0 || arrows.length > 0) {
      setHighlightedSquares(new Set());
      setArrows([]);
    }
  }

  function attemptMove(from: string, to: string) {
    clearAnnotations();
    const piece = chess.get(from as Square);
    const isPromotion =
      piece?.type === "p" &&
      ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));

    if (isPromotion) {
      setPending({ from, to });
      setSelected(null);
      return;
    }
    setSelected(null);
    onMove?.({ from, to });
  }

  function handleSquareClick(square: string) {
    clearAnnotations();

    if (canMoveNow) {
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
      return;
    }

    // Premove logic when opponent is thinking
    if (isOpponentTurn && settings.premoves) {
      if (selected && selected !== square) {
        setPremove({ from: selected, to: square });
        setSelected(null);
      } else {
        const piece = chess.get(square as Square);
        if (piece && piece.color === myColor) {
          setSelected(square);
        } else {
          setSelected(null);
          setPremove(null);
        }
      }
    }
  }

  // Right click square annotation handlers
  function handleMouseDown(event: React.MouseEvent, square: string) {
    if (event.button === 2) {
      // Right click
      rightClickStartRef.current = square;
    }
  }

  function handleMouseUp(event: React.MouseEvent, square: string) {
    if (event.button === 2) {
      const start = rightClickStartRef.current;
      rightClickStartRef.current = null;
      if (!start) return;

      if (start === square) {
        // Toggle square highlight
        setHighlightedSquares((prev) => {
          const next = new Set(prev);
          if (next.has(square)) next.delete(square);
          else next.add(square);
          return next;
        });
      } else {
        // Toggle arrow
        setArrows((prev) => {
          const exists = prev.some((a) => a.from === start && a.to === square);
          if (exists) return prev.filter((a) => !(a.from === start && a.to === square));
          return [...prev, { from: start, to: square }];
        });
      }
    }
  }

  // Coordinates helper for rendering SVG arrows
  function getSquareCenter(sq: string) {
    const file = sq[0]!;
    const rank = sq[1]!;
    const colIndex = fileLabels.indexOf(file as (typeof FILES)[number]);
    const rowIndex = rankLabels.indexOf(rank as (typeof RANKS)[number]);
    const x = (colIndex + 0.5) * (100 / 8);
    const y = (rowIndex + 0.5) * (100 / 8);
    return { x, y };
  }

  return (
    <div className="relative w-full aspect-square" data-board-theme={settings.boardTheme}>
      <div className="h-full w-full rounded-2xl bg-board-frame p-2 shadow-plate sm:p-3">
        <div
          className="relative grid grid-cols-8 aspect-square h-full w-full overflow-hidden rounded-lg"
          onContextMenu={(e) => e.preventDefault()}
        >
          {rows.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const file = fileLabels[colIndex]!;
              const rank = rankLabels[rowIndex]!;
              const square = `${file}${rank}`;
              const isDark = (FILES.indexOf(file) + Number(rank)) % 2 !== 0;
              const isSelected = selected === square;
              const target = legalTargets.get(square);
              const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
              const isHighlighted = highlightedSquares.has(square);
              const isPremoveFrom = premove?.from === square;
              const isPremoveTo = premove?.to === square;

              return (
                <button
                  key={square}
                  type="button"
                  onClick={() => handleSquareClick(square)}
                  onMouseDown={(e) => handleMouseDown(e, square)}
                  onMouseUp={(e) => handleMouseUp(e, square)}
                  onDragStart={(event) => {
                    if (!canMoveNow || !cell || cell.color !== turn) {
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
                  draggable={Boolean(cell) && canMoveNow && cell?.color === turn}
                  aria-label={`${square}${cell ? ` ${cell.color === "w" ? "white" : "black"} ${cell.type}` : " empty"}`}
                  className={cn(
                    "relative flex aspect-square touch-manipulation items-center justify-center transition-colors select-none overflow-hidden p-1",
                    isDark ? "bg-board-dark" : "bg-board-light",
                    isLast && "outline outline-2 -outline-offset-2 outline-accent/80",
                    (isPremoveFrom || isPremoveTo) && "bg-amber-500/40",
                  )}
                >
                  {isSelected && <span className="absolute inset-0 bg-highlight" />}
                  {isHighlighted && <span className="absolute inset-0 bg-amber-400/45" />}
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
                    <ChessPiece
                      type={cell.type as PieceType}
                      color={cell.color as PieceColor}
                      style={settings.pieceStyle}
                      className="p-1"
                    />
                  )}
                  {showCoordinates && colIndex === 0 && (
                    <span
                      className={cn(
                        "absolute left-0.5 top-0.5 text-[0.55rem] font-semibold select-none",
                        isDark ? "text-board-light/70" : "text-board-dark/70",
                      )}
                    >
                      {rank}
                    </span>
                  )}
                  {showCoordinates && rowIndex === 7 && (
                    <span
                      className={cn(
                        "absolute bottom-0.5 right-1 text-[0.55rem] font-semibold select-none",
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

          {/* SVG Arrow Annotations Overlay */}
          {arrows.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="4"
                  markerHeight="4"
                  refX="2"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 4 2, 0 4" fill="oklch(0.79 0.13 78 / 0.85)" />
                </marker>
              </defs>
              {arrows.map((arr, i) => {
                const p1 = getSquareCenter(arr.from);
                const p2 = getSquareCenter(arr.to);
                return (
                  <line
                    key={i}
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke="oklch(0.79 0.13 78 / 0.85)"
                    strokeWidth="2.2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Pawn Promotion Modal */}
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
                  className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-secondary p-1 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ChessPiece type={piece} color={turn} style={settings.pieceStyle} />
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
