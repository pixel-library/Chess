export type TimeControl = { label: string; minutes: number; increment: number };

export const TIME_CONTROLS: { group: string; items: TimeControl[] }[] = [
  {
    group: "Bullet",
    items: [
      { label: "1+0", minutes: 1, increment: 0 },
      { label: "2+1", minutes: 2, increment: 1 },
    ],
  },
  {
    group: "Blitz",
    items: [
      { label: "3+0", minutes: 3, increment: 0 },
      { label: "3+2", minutes: 3, increment: 2 },
      { label: "5+0", minutes: 5, increment: 0 },
      { label: "5+3", minutes: 5, increment: 3 },
    ],
  },
  {
    group: "Rapid",
    items: [
      { label: "10+0", minutes: 10, increment: 0 },
      { label: "10+5", minutes: 10, increment: 5 },
      { label: "15+10", minutes: 15, increment: 10 },
    ],
  },
  {
    group: "Classical",
    items: [
      { label: "30+0", minutes: 30, increment: 0 },
      { label: "30+20", minutes: 30, increment: 20 },
    ],
  },
];

export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (clamped < 20000) {
    const tenths = Math.floor((clamped % 1000) / 100);
    return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export const DIFFICULTIES = [
  { label: "Beginner", elo: 800, depth: 1, skill: 0 },
  { label: "Easy", elo: 1100, depth: 3, skill: 3 },
  { label: "Medium", elo: 1400, depth: 6, skill: 7 },
  { label: "Hard", elo: 1700, depth: 9, skill: 12 },
  { label: "Expert", elo: 2100, depth: 13, skill: 17 },
  { label: "Master", elo: 2500, depth: 18, skill: 20 },
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number]["label"];

export function resultText(result: string | null, reason: string | null): string {
  if (!result) return "Game in progress";
  if (result === "1/2-1/2") return "Draw";
  return `${result === "1-0" ? "White" : "Black"} wins${reason ? ` by ${reason}` : ""}`;
}
