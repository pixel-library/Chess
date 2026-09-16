import { useMemo } from "react";
import { ChessPiece, type PieceType } from "@/components/ChessPieces";
import { useSettings } from "@/lib/settings";

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const STARTING_COUNTS: Record<PieceType, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

type Props = {
  fen: string;
  forColor: "w" | "b";
  className?: string;
};

export function CapturedMaterial({ fen, forColor, className = "" }: Props) {
  const { settings } = useSettings();

  const { capturedPieces, advantage } = useMemo(() => {
    const counts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };

    const boardPart = fen.split(" ")[0] || "";
    for (const char of boardPart) {
      if (char >= "1" && char <= "8") continue;
      if (char === "/") continue;
      const lower = char.toLowerCase() as PieceType;
      const color = char === char.toUpperCase() ? "w" : "b";
      if (counts[color][lower] !== undefined) {
        counts[color][lower]++;
      }
    }

    const whiteValue =
      counts.w.p * 1 + counts.w.n * 3 + counts.w.b * 3 + counts.w.r * 5 + counts.w.q * 9;
    const blackValue =
      counts.b.p * 1 + counts.b.n * 3 + counts.b.b * 3 + counts.b.r * 5 + counts.b.q * 9;

    // Pieces captured BY forColor (which means pieces opponent LOST)
    const opponentColor = forColor === "w" ? "b" : "w";
    const opponentCounts = counts[opponentColor];

    const captured: { type: PieceType; count: number }[] = [];
    const pieceOrder: PieceType[] = ["q", "r", "b", "n", "p"];

    for (const type of pieceOrder) {
      const missing = STARTING_COUNTS[type] - (opponentCounts[type] || 0);
      if (missing > 0) {
        captured.push({ type, count: missing });
      }
    }

    const myVal = forColor === "w" ? whiteValue : blackValue;
    const oppVal = forColor === "w" ? blackValue : whiteValue;
    const diff = myVal - oppVal;

    return { capturedPieces: captured, advantage: diff > 0 ? diff : 0 };
  }, [fen, forColor]);

  return (
    <div className={`flex min-h-[18px] items-center gap-1.5 ${className}`}>
      {capturedPieces.length > 0 && (
        <div className="flex items-center -space-x-1">
          {capturedPieces.map(({ type, count }) => (
            <div key={type} className="flex items-center">
              {Array.from({ length: count }).map((_, i) => (
                <span key={i} className="inline-block h-4 w-4 drop-shadow-sm">
                  <ChessPiece
                    type={type}
                    color={forColor === "w" ? "b" : "w"}
                    style={settings.pieceStyle}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      {advantage > 0 && (
        <span className="rounded bg-accent/20 px-1 py-0.5 font-mono text-[0.65rem] font-bold text-accent">
          +{advantage}
        </span>
      )}
    </div>
  );
}
