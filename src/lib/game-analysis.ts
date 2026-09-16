export type MoveQuality = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";

export type MoveAnalysis = {
  ply: number;
  san: string;
  color: "w" | "b";
  evalBefore: number;
  evalAfter: number;
  quality: MoveQuality;
  cpLoss: number;
};

export type GameAccuracyReport = {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteStats: Record<MoveQuality, number>;
  blackStats: Record<MoveQuality, number>;
  analyzedMoves: MoveAnalysis[];
};

/**
 * Classifies a move based on centipawn drop (cpLoss).
 */
export function classifyMove(cpLoss: number): MoveQuality {
  if (cpLoss <= 15) return "best";
  if (cpLoss <= 45) return "excellent";
  if (cpLoss <= 90) return "good";
  if (cpLoss <= 180) return "inaccuracy";
  if (cpLoss <= 320) return "mistake";
  return "blunder";
}

/**
 * Calculates accuracy percentage from average centipawn loss (ACL).
 * Uses exponential scaling formula matching standard chess engines.
 */
export function calculateAccuracy(avgCpLoss: number): number {
  if (isNaN(avgCpLoss) || avgCpLoss < 0) return 100;
  const accuracy = 100 * Math.exp(-0.004 * avgCpLoss);
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
}

/**
 * Helper to produce badge styles for move qualities.
 */
export function getQualityBadge(quality: MoveQuality) {
  switch (quality) {
    case "best":
      return { label: "Best", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    case "excellent":
      return { label: "Excellent", bg: "bg-teal-500/20 text-teal-400 border-teal-500/30" };
    case "good":
      return { label: "Good", bg: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    case "inaccuracy":
      return { label: "Inaccuracy", bg: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    case "mistake":
      return { label: "Mistake", bg: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
    case "blunder":
      return { label: "Blunder", bg: "bg-red-500/20 text-red-400 border-red-500/30" };
  }
}
