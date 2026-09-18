import { Link } from "@tanstack/react-router";
import { Menu, Moon, Palette, Sun, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BOARD_THEMES, useSettings, type BoardTheme } from "@/lib/settings";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/play", label: "Play online" },
  { to: "/computer", label: "Play computer" },
  { to: "/analysis", label: "Analysis" },
  { to: "/how-to-play", label: "How to play" },
  { to: "/rules", label: "Rules" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { settings, update } = useSettings();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDarkMode() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-lg font-bold text-stone-950 shadow-md transition-transform group-hover:scale-105">
            ♞
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
              Chess Room
            </span>
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-accent">
              Pro Edition
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-bold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => update({ sounds: !settings.sounds })}
            title={settings.sounds ? "Mute sounds" : "Unmute sounds"}
            aria-label="Toggle Sound"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            {settings.sounds ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          {/* Board Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Change board theme"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {BOARD_THEMES.map((theme) => (
                <DropdownMenuItem
                  key={theme.id}
                  onClick={() => update({ boardTheme: theme.id as BoardTheme })}
                  className={cn(
                    "capitalize cursor-pointer",
                    settings.boardTheme === theme.id && "font-bold text-accent",
                  )}
                >
                  {theme.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle Theme"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button asChild size="sm" className="hidden sm:inline-flex font-bold">
            <Link to="/play">Play Now</Link>
          </Button>

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-border p-2 md:hidden text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background/95 p-4 backdrop-blur-lg md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-1 text-base font-semibold text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
