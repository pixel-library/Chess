import { useMemo } from "react";
import type { EngineEvaluation } from "@/lib/useStockfish";
import { cn } from "@/lib/utils";

type Props = {
  evaluation: EngineEvaluation | null;
  turn?: "w" | "b";
  orientation?: "w" | "b";
  className?: string;
};

export function EvalBar({ evaluation, turn = "w", orientation = "w", className = "" }: Props) {
  const { whitePercentage, label } = useMemo(() => {
    if (!evaluation) {
      return { whitePercentage: 50, label: "0.0" };
    }

    // Convert score relative to turn into score relative to White
    let cp = evaluation.type === "cp" ? evaluation.value : 0;
    let mate = evaluation.type === "mate" ? evaluation.value : null;

    if (turn === "b") {
      cp = -cp;
      if (mate !== null) mate = -mate;
    }

    if (mate !== null) {
      const isWhiteWinning = mate > 0;
      const labelStr = isWhiteWinning ? `M${Math.abs(mate)}` : `-M${Math.abs(mate)}`;
      return {
        whitePercentage: isWhiteWinning ? 100 : 0,
        label: labelStr,
      };
    }

    // Sigmoid curve for centipawns (0 = 50%, +300 cp = ~85%, +1000 cp = ~98%)
    const advantage = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * cp)) - 1);
    const clampedPct = Math.max(2, Math.min(98, advantage));
    const formattedScore = (cp / 100).toFixed(1);
    const displayLabel = cp > 0 ? `+${formattedScore}` : formattedScore;

    return {
      whitePercentage: clampedPct,
      label: displayLabel,
    };
  }, [evaluation, turn]);

  // Flip the visual bar fill depending on board orientation
  const isFlipped = orientation === "b";
  const whiteBarHeight = `${whitePercentage}%`;

  return (
    <div
      className={cn(
        "relative flex h-full w-7 flex-col overflow-hidden rounded-xl border border-border bg-slate-900 shadow-sm transition-all select-none",
        className,
      )}
      aria-label={`Evaluation: ${label}`}
      title={`Evaluation: ${label}`}
    >
      {/* Black Section */}
      <div className="w-full flex-1 bg-slate-950 transition-all duration-300" />

      {/* White Section */}
      <div
        className="w-full bg-slate-100 transition-all duration-300"
        style={{
          height: isFlipped ? `${100 - whitePercentage}%` : whiteBarHeight,
        }}
      />

      {/* Numerical Label Badge */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 rounded px-1 text-[0.65rem] font-bold tracking-tight shadow-sm transition-all",
          whitePercentage > 50
            ? isFlipped
              ? "top-1 bg-slate-100 text-slate-900"
              : "bottom-1 bg-slate-100 text-slate-900"
            : isFlipped
              ? "bottom-1 bg-slate-900 text-slate-100"
              : "top-1 bg-slate-900 text-slate-100",
        )}
      >
        {label}
      </div>
    </div>
  );
}
