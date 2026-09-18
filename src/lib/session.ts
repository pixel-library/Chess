// Anonymous, session-only player identity. No accounts, no auth.
const NAME_KEY = "chess.player.name";
const SESSION_KEY = "chess.player.session";
const RECENT_KEY = "chess.recent.games";
const RATING_KEY = "chess.temp.rating";

function randomId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `player_${randomId()}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getPlayerName(): string {
  if (typeof window === "undefined") return "Player";
  let name = localStorage.getItem(NAME_KEY);
  if (!name || !name.trim()) {
    name = `Player_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(NAME_KEY, name);
  }
  return name;
}

export function setPlayerName(name: string) {
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 24));
}

export type GameCredentials = { code: string; color: "w" | "b"; token: string };

export function saveCredentials(creds: GameCredentials) {
  localStorage.setItem(`chess.game.${creds.code}`, JSON.stringify(creds));
}

export function loadCredentials(code: string): GameCredentials | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`chess.game.${code}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameCredentials;
  } catch {
    return null;
  }
}

export type RecentGame = {
  code: string;
  opponent: string;
  outcome: "Won" | "Lost" | "Draw" | "Unfinished";
  timeControl: string;
  at: number;
};

export function addRecentGame(game: RecentGame) {
  const list = getRecentGames().filter((g) => g.code !== game.code);
  list.unshift(game);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 12)));
}

export function getRecentGames(): RecentGame[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as RecentGame[];
  } catch {
    return [];
  }
}

export function getTempRating(): number {
  if (typeof window === "undefined") return 1200;
  return Number(localStorage.getItem(RATING_KEY) ?? 1200);
}

export function applyRatingChange(score: 1 | 0 | 0.5) {
  const current = getTempRating();
  const expected = 0.5;
  const next = Math.round(current + 32 * (score - expected));
  localStorage.setItem(RATING_KEY, String(next));
  return next;
}
