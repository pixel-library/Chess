import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Palette, Sparkles, Volume2, VolumeX } from "lucide-react";

import { ChessPiece, type PieceType, type PieceColor } from "@/components/ChessPieces";
import { BOARD_THEMES, PIECE_STYLES, type PieceStyle, useSettings } from "@/lib/settings";
import { playMoveSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

export type BoardMove = { from: string; to: string; promotion?: "q" | "r" | "b" | "n" };

type Arrow = { from: string; to: string };

type CapturedEffect = {
  square: string;
  type: PieceType;
  color: PieceColor;
};

type TrackedPiece = {
  id: string;
  square: string;
  type: PieceType;
  color: PieceColor;
  col: number;
  row: number;
};

type Props = {
  fen: string;
  orientation?: "w" | "b";
  interactive?: boolean;
  myColor?: "w" | "b" | null;
  lastMove?: { from: string; to: string } | null;
  customArrows?: { from: string; to: string; color?: string }[];
  showCoordinates?: boolean;
  onMove?: (move: BoardMove) => void;
  mode?: "3d" | "2d";
};

export function ChessBoard({
  fen,
  orientation = "w",
  interactive = true,
  myColor = null,
  lastMove = null,
  customArrows = [],
  showCoordinates = true,
  onMove,
  mode = "2d",
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [premove, setPremove] = useState<BoardMove | null>(null);
  const [pending, setPending] = useState<BoardMove | null>(null);
  const is3D = mode === "3d";
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 26, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!is3D || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateX = 26 - ((e.clientY - centerY) / (rect.height / 2)) * 10;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 10;
    setTilt({
      x: Math.max(12, Math.min(40, rotateX)),
      y: Math.max(-18, Math.min(18, rotateY)),
    });
  }

  function handleMouseLeave() {
    if (is3D) setTilt({ x: 26, y: 0 });
  }

  // Board Annotations (Right-click highlights & arrows)
  const [highlightedSquares, setHighlightedSquares] = useState<Set<string>>(new Set());
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const rightClickStartRef = useRef<string | null>(null);

  // Animation & Impact Effect States
  const [capturedEffect, setCapturedEffect] = useState<CapturedEffect | null>(null);
  const [isShuddering, setIsShuddering] = useState(false);
  const pieceIdMapRef = useRef<Map<string, string>>(new Map());
  const nextPieceIdRef = useRef<number>(1);

  const { settings, update: updateSettings } = useSettings();
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

  const board = chess.board();

  // Coordinates mapping based on orientation
  const fileLabels = useMemo(
    () => (orientation === "w" ? FILES : [...FILES].reverse()),
    [orientation],
  );
  const rankLabels = useMemo(
    () => (orientation === "w" ? RANKS : [...RANKS].reverse()),
    [orientation],
  );

  // Track piece IDs across board updates to maintain DOM node continuity for CSS transitions
  const trackedPieces = useMemo<TrackedPiece[]>(() => {
    const newIdMap = new Map<string, string>();
    const oldIdMap = pieceIdMapRef.current;
    const result: TrackedPiece[] = [];

    // Helper to get or assign piece ID
    const assignPieceId = (square: string, type: PieceType, color: PieceColor, fromSq?: string) => {
      let pieceId = fromSq ? oldIdMap.get(fromSq) : oldIdMap.get(square);
      if (!pieceId) {
        pieceId = `${color}-${type}-${nextPieceIdRef.current++}`;
      }
      newIdMap.set(square, pieceId);
      return pieceId;
    };

    // If lastMove exists, check for castling or standard moves to map IDs smoothly
    const moveFrom = lastMove?.from;
    const moveTo = lastMove?.to;
    let castleRookFrom: string | undefined;
    let castleRookTo: string | undefined;

    if (moveFrom && moveTo) {
      if (moveFrom === "e1" && moveTo === "g1") {
        castleRookFrom = "h1";
        castleRookTo = "f1";
      } else if (moveFrom === "e1" && moveTo === "c1") {
        castleRookFrom = "a1";
        castleRookTo = "d1";
      } else if (moveFrom === "e8" && moveTo === "g8") {
        castleRookFrom = "h8";
        castleRookTo = "f8";
      } else if (moveFrom === "e8" && moveTo === "c8") {
        castleRookFrom = "a8";
        castleRookTo = "d8";
      }
    }

    board.forEach((rowCells, rIdx) => {
      rowCells.forEach((cell, cIdx) => {
        if (!cell) return;
        const file = FILES[cIdx]!;
        const rank = RANKS[rIdx]!;
        const square = `${file}${rank}`;
        const color = cell.color as PieceColor;
        const type = cell.type as PieceType;

        let fromSquare: string | undefined;
        if (square === moveTo) {
          fromSquare = moveFrom;
        } else if (castleRookTo && square === castleRookTo) {
          fromSquare = castleRookFrom;
        }

        const id = assignPieceId(square, type, color, fromSquare);
        const col = fileLabels.indexOf(file as (typeof FILES)[number]);
        const row = rankLabels.indexOf(rank as (typeof RANKS)[number]);

        result.push({ id, square, type, color, col, row });
      });
    });

    pieceIdMapRef.current = newIdMap;
    return result;
  }, [board, lastMove, fileLabels, rankLabels]);

  // Sound triggers, capture animation, & Premove Execution on FEN change
  useEffect(() => {
    if (prevFenRef.current && prevFenRef.current !== fen) {
      const history = chess.history({ verbose: true });
      const last = history[history.length - 1];

      if (last?.captured) {
        setCapturedEffect({
          square: last.to,
          type: last.captured as PieceType,
          color: last.color === "w" ? "b" : "w",
        });
        setIsShuddering(true);

        const timer1 = setTimeout(() => setIsShuddering(false), 180);
        const timer2 = setTimeout(() => setCapturedEffect(null), 350);

        // Sound handling for capture
        if (settings.sounds) {
          if (chess.isCheckmate()) {
            playMoveSound(settings.volume, myColor === turn ? "defeat" : "victory");
          } else if (chess.inCheck()) {
            playMoveSound(settings.volume, "check");
          } else {
            playMoveSound(settings.volume, "capture");
          }
        }

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      } else if (settings.sounds) {
        if (chess.isCheckmate()) {
          playMoveSound(settings.volume, myColor === turn ? "defeat" : "victory");
        } else if (chess.inCheck()) {
          playMoveSound(settings.volume, "check");
        } else if (last?.san === "O-O" || last?.san === "O-O-O") {
          playMoveSound(settings.volume, "castle");
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
      rightClickStartRef.current = square;
    }
  }

  function handleMouseUp(event: React.MouseEvent, square: string) {
    if (event.button === 2) {
      const start = rightClickStartRef.current;
      rightClickStartRef.current = null;
      if (!start) return;

      if (start === square) {
        setHighlightedSquares((prev) => {
          const next = new Set(prev);
          if (next.has(square)) next.delete(square);
          else next.add(square);
          return next;
        });
      } else {
        setArrows((prev) => {
          const exists = prev.some((a) => a.from === start && a.to === square);
          if (exists) return prev.filter((a) => !(a.from === start && a.to === square));
          return [...prev, { from: start, to: square }];
        });
      }
    }
  }

  function getSquareCenter(sq: string) {
    const file = sq[0]!;
    const rank = sq[1]!;
    const colIndex = fileLabels.indexOf(file as (typeof FILES)[number]);
    const rowIndex = rankLabels.indexOf(rank as (typeof RANKS)[number]);
    const x = (colIndex + 0.5) * (100 / 8);
    const y = (rowIndex + 0.5) * (100 / 8);
    return { x, y };
  }

  const animDurationMs = settings.pieceAnimations
    ? settings.animationSpeed === "fast"
      ? 140
      : settings.animationSpeed === "slow"
        ? 300
        : 200
    : 0;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        ref={boardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative w-full aspect-square transition-all duration-500 board-container-3d-perspective cursor-pointer",
          isShuddering && "animate-board-shudder",
        )}
        data-board-theme={settings.boardTheme}
      >
        {/* Reflective Dark Stage Floor Layer (Image 1 Inspiration) */}
        {is3D && <div className="stage-reflective-floor" aria-hidden />}

        {kingInCheck && !chess.isCheckmate() && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-rose-500/50 bg-rose-500/20 text-rose-300 font-display text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-lg shadow-rose-500/30 animate-bounce">
              ⚠️ Check!
            </span>
          </div>
        )}

        {chess.isCheckmate() && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <span className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border border-amber-300 bg-amber-500 text-amber-950 font-editorial text-xs font-black uppercase tracking-widest shadow-2xl shadow-amber-500/50 animate-pulse">
              👑 Checkmate
            </span>
          </div>
        )}

        <div
          className={cn(
            "h-full w-full rounded-2xl bg-board-frame p-2 shadow-plate sm:p-3 transition-transform duration-150 ease-out",
            is3D && "board-3d-tilt",
          )}
          style={{
            transform: is3D ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(0.92)` : "none",
          }}
        >
          <div
            className="relative grid grid-cols-8 aspect-square h-full w-full overflow-hidden rounded-lg"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Image 1 Inspired Stage Spotlight Overlay */}
            <div className="absolute inset-0 stage-spotlight pointer-events-none z-10" />

            {/* Base Grid Layer: Squares, Highlights, Coordinates & Click Handlers */}
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
                      "relative flex aspect-square touch-manipulation items-center justify-center transition-colors select-none overflow-hidden p-1 board-3d-tile",
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
                      <span className="absolute h-[22%] w-[22%] rounded-full bg-accent/70 animate-pulse" />
                    )}
                    {target !== undefined && cell && (
                      <span className="absolute inset-[6%] rounded-full border-4 border-accent/80" />
                    )}
                    {showCoordinates && colIndex === 0 && (
                      <span
                        className={cn(
                          "absolute left-0.5 top-0.5 text-[0.55rem] font-semibold select-none pointer-events-none z-10",
                          isDark ? "text-board-light/70" : "text-board-dark/70",
                        )}
                      >
                        {rank}
                      </span>
                    )}
                    {showCoordinates && rowIndex === 7 && (
                      <span
                        className={cn(
                          "absolute bottom-0.5 right-1 text-[0.55rem] font-semibold select-none pointer-events-none z-10",
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

            {/* Absolute Animated Piece & Capture Layer */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {/* Capture Shockwave & Particle Dissolve Overlay */}
              {capturedEffect &&
                (() => {
                  const file = capturedEffect.square[0]!;
                  const rank = capturedEffect.square[1]!;
                  const capCol = fileLabels.indexOf(file as (typeof FILES)[number]);
                  const capRow = rankLabels.indexOf(rank as (typeof RANKS)[number]);

                  if (capCol === -1 || capRow === -1) return null;

                  return (
                    <div
                      key={`cap-${capturedEffect.square}`}
                      className="absolute pointer-events-none flex items-center justify-center p-1"
                      style={{
                        left: `${capCol * 12.5}%`,
                        top: `${capRow * 12.5}%`,
                        width: "12.5%",
                        height: "12.5%",
                      }}
                    >
                      <span className="absolute inset-0 rounded-full border-2 border-amber-400 bg-amber-400/25 animate-shockwave" />
                      <div className="h-full w-full animate-capture">
                        <ChessPiece
                          type={capturedEffect.type}
                          color={capturedEffect.color}
                          style={settings.pieceStyle}
                        />
                      </div>
                    </div>
                  );
                })()}

              {/* Smooth Sliding Active Pieces Layer */}
              {trackedPieces.map((p) => {
                const isSelected = selected === p.square;

                return (
                  <div
                    key={p.id}
                    className="absolute p-1 pointer-events-none transition-all ease-out will-change-transform flex items-center justify-center"
                    style={{
                      left: `${p.col * 12.5}%`,
                      top: `${p.row * 12.5}%`,
                      width: "12.5%",
                      height: "12.5%",
                      transitionDuration: `${animDurationMs}ms`,
                      transitionProperty: animDurationMs > 0 ? "top, left, transform" : "none",
                    }}
                  >
                    <ChessPiece
                      type={p.type}
                      color={p.color}
                      style={settings.pieceStyle}
                      className={cn(
                        "transition-transform duration-150",
                        isSelected &&
                          "scale-110 -translate-y-1 drop-shadow-[0_0_15px_oklch(0.79_0.14_78/0.85)]",
                      )}
                    />
                  </div>
                );
              })}
            </div>

            {/* SVG Arrow Annotations Overlay */}
            {(arrows.length > 0 || customArrows.length > 0) && (
              <svg
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
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
                  <marker
                    id="arrowhead-hint"
                    markerWidth="4"
                    markerHeight="4"
                    refX="2"
                    refY="2"
                    orient="auto"
                  >
                    <polygon points="0 0, 4 2, 0 4" fill="rgb(34 197 94)" />
                  </marker>
                </defs>
                {customArrows.map((arr, i) => {
                  const p1 = getSquareCenter(arr.from);
                  const p2 = getSquareCenter(arr.to);
                  const strokeColor = arr.color || "rgb(34 197 94)";
                  return (
                    <line
                      key={`custom-${i}`}
                      x1={`${p1.x}%`}
                      y1={`${p1.y}%`}
                      x2={`${p2.x}%`}
                      y2={`${p2.y}%`}
                      stroke={strokeColor}
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      markerEnd="url(#arrowhead-hint)"
                    />
                  );
                })}
                {arrows.map((arr, i) => {
                  const p1 = getSquareCenter(arr.from);
                  const p2 = getSquareCenter(arr.to);
                  return (
                    <line
                      key={`user-${i}`}
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
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-ink/70 p-4">
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

      {/* Integrated Board Quick Controls Bar */}
      <div className="flex items-center justify-between w-full max-w-full px-3 py-1.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md text-xs text-muted-foreground shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const currentIdx = PIECE_STYLES.findIndex((p) => p.id === settings.pieceStyle);
              const nextStyle = PIECE_STYLES[(currentIdx + 1) % PIECE_STYLES.length]!;
              updateSettings({ pieceStyle: nextStyle.id });
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-accent hover:text-foreground font-medium transition-all"
            title="Switch Piece Style (Geometric, Staunton, Neo, Glyph)"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="capitalize">{settings.pieceStyle}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const currentIdx = BOARD_THEMES.findIndex((t) => t.id === settings.boardTheme);
              const nextTheme = BOARD_THEMES[(currentIdx + 1) % BOARD_THEMES.length]!;
              updateSettings({ boardTheme: nextTheme.id });
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-accent hover:text-foreground font-medium transition-all"
            title="Cycle Board Theme"
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline capitalize">{settings.boardTheme}</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ sounds: !settings.sounds })}
            className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-accent hover:text-foreground transition-all"
            title="Toggle Sound"
          >
            {settings.sounds ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
