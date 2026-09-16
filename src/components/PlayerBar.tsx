import { CapturedMaterial } from "@/components/CapturedMaterial";
import { formatClock } from "@/lib/chess-shared";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  color: "w" | "b";
  ms: number;
  active: boolean;
  fen?: string;
  rating?: number;
  subtitle?: string;
  isBot?: boolean;
};

export function PlayerBar({
  name,
  color,
  ms,
  active,
  fen,
  rating,
  subtitle,
  isBot = false,
}: Props) {
  const isLowTime = active && ms < 20000 && ms > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-2 transition-all duration-300",
        active
          ? "border-accent/80 bg-card shadow-md pulse-turn"
          : "border-border/60 bg-card/60 text-muted-foreground",
        isLowTime && "border-destructive bg-destructive/10 animate-pulse",
      )}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        {/* Avatar Badge */}
        <div className="relative shrink-0">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border font-display text-base font-bold shadow-sm transition-colors",
              color === "w"
                ? "border-amber-200/40 bg-gradient-to-br from-amber-50 to-stone-200 text-stone-900"
                : "border-stone-700 bg-gradient-to-br from-stone-800 to-stone-950 text-stone-100",
            )}
          >
            {isBot ? "🤖" : color === "w" ? "♔" : "♚"}
          </span>
          {active && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>

        {/* Player Name & Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-foreground">{name}</span>
            {rating && (
              <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-muted-foreground">
                {rating}
              </span>
            )}
          </div>
          {fen ? (
            <CapturedMaterial fen={fen} forColor={color} className="mt-0.5" />
          ) : (
            subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Clock Display */}
      <div
        className={cn(
          "clock-digits rounded-lg px-3 py-1 text-xl font-bold tracking-tight shadow-inner transition-colors",
          active
            ? isLowTime
              ? "bg-destructive text-destructive-foreground"
              : "bg-ink text-ink-foreground dark:bg-accent dark:text-accent-foreground"
            : "bg-muted/80 text-muted-foreground",
        )}
      >
        {formatClock(ms)}
      </div>
    </div>
  );
}
