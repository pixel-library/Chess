import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type BoardTheme = "classic" | "wood" | "emerald" | "midnight" | "cyberpunk" | "slate";
export type PieceStyle = "staunton" | "neo" | "glyph";

export type Settings = {
  boardTheme: BoardTheme;
  pieceStyle: PieceStyle;
  coordinates: boolean;
  sounds: boolean;
  volume: number;
  premoves: boolean;
  annotations: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  boardTheme: "emerald",
  pieceStyle: "staunton",
  coordinates: true,
  sounds: true,
  volume: 0.5,
  premoves: true,
  annotations: true,
};

const STORAGE_KEY = "chess.settings";

const SettingsContext = createContext<{
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  loaded: boolean;
}>({ settings: DEFAULT_SETTINGS, update: () => {}, loaded: false });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      /* ignore corrupt settings */
    }
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update, loaded }), [settings, update, loaded]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
