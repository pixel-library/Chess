import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIME_CONTROLS } from "@/lib/chess-shared";
import { createGame, joinGame } from "@/lib/chess.functions";
import {
  getPlayerName,
  getRecentGames,
  getSessionId,
  getTempRating,
  saveCredentials,
  setPlayerName,
  type RecentGame,
} from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play Online — Chess Room" },
      {
        name: "description",
        content: "Enter a name, create a private room or join with a code, and play real-time chess instantly.",
      },
      { property: "og:title", content: "Play Online — Chess Room" },
      { property: "og:description", content: "Private rooms or join by code. No account needed." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [recent, setRecent] = useState<RecentGame[]>([]);
  const [rating, setRating] = useState(1200);
  const [nameLocked, setNameLocked] = useState(false);

  const [minutes, setMinutes] = useState(5);
  const [increment, setIncrement] = useState(3);
  const [colorPref, setColorPref] = useState<"white" | "black" | "random">("random");
  const [rated, setRated] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  const create = useServerFn(createGame);
  const join = useServerFn(joinGame);

  useEffect(() => {
    const stored = getPlayerName();
    setSessionId(getSessionId());
    setRecent(getRecentGames());
    setRating(getTempRating());
    if (stored) {
      setName(stored);
      setNameLocked(true);
    }
  }, []);

  function enterGame(creds: { code: string; color: "w" | "b"; token: string }) {
    saveCredentials(creds);
    router.invalidate();
    navigate({ to: "/game/$code", params: { code: creds.code } });
  }

  async function handleCreate() {
    setBusy(true);
    try {
      const result = await create({
        data: { name, sessionId, minutes, increment, color: colorPref, rated, isPublic },
      });
      enterGame(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the room");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    setBusy(true);
    try {
      const result = await join({ data: { code: joinCode.trim().toUpperCase(), name, sessionId } });
      enterGame(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join that room");
    } finally {
      setBusy(false);
    }
  }


  if (!nameLocked) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
          <p className="eyebrow text-muted-foreground">Step one</p>
          <h1 className="display-xl mt-3 text-4xl">Enter your name</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Used for this session only. Nothing is registered and nothing is emailed.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              setPlayerName(name);
              setNameLocked(true);
            }}
          >
            <Input
              autoFocus
              value={name}
              maxLength={24}
              placeholder="e.g. Rudra"
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" size="lg" className="w-full" disabled={!name.trim()}>
              Continue
            </Button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted-foreground">Player</p>
            <h1 className="display-xl mt-2 text-3xl sm:text-4xl">{name}</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Session {sessionId} · Temporary rating {rating}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNameLocked(false);
            }}
          >
            Change name
          </Button>
        </div>

        <Tabs defaultValue="create" className="mt-8">
            <TabsList>
              <TabsTrigger value="create">Create room</TabsTrigger>
              <TabsTrigger value="join">Join with code</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="paper mt-4 p-6">
              <TimeControlPicker
                minutes={minutes}
                increment={increment}
                onPick={(m, i) => {
                  setMinutes(m);
                  setIncrement(i);
                }}
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="eyebrow text-muted-foreground">Custom</p>
                  <div className="mt-2 flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={minutes}
                      onChange={(event) => setMinutes(Number(event.target.value) || 1)}
                      aria-label="Minutes"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      value={increment}
                      onChange={(event) => setIncrement(Number(event.target.value) || 0)}
                      aria-label="Increment seconds"
                    />
                  </div>
                </div>
                <div>
                  <p className="eyebrow text-muted-foreground">Your colour</p>
                  <div className="mt-2 flex gap-2">
                    {(["white", "black", "random"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setColorPref(option)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors",
                          colorPref === option
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border hover:bg-secondary",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <Switch id="create-rated" checked={rated} onCheckedChange={setRated} />
                    <Label htmlFor="create-rated">Rated (session only)</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="create-public" checked={isPublic} onCheckedChange={setIsPublic} />
                    <Label htmlFor="create-public">Listed for spectators</Label>
                  </div>
                </div>
                <Button size="lg" disabled={busy} onClick={handleCreate}>
                  Create room
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="join" className="paper mt-4 p-6">
              <Label htmlFor="join-code">Room code</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="join-code"
                  value={joinCode}
                  maxLength={8}
                  placeholder="A7K9P2"
                  className="font-display text-lg uppercase tracking-[0.3em]"
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                />
                <Button disabled={busy || joinCode.trim().length < 4} onClick={handleJoin}>
                  Join
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                An invite link works too — open it and you will be seated automatically.
              </p>
            </TabsContent>
        </Tabs>

        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="eyebrow text-muted-foreground">Recent games (this device)</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recent.map((game) => (
                <div key={game.code} className="paper flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">vs {game.opponent}</p>
                    <p className="text-xs text-muted-foreground">
                      {game.timeControl} · {game.outcome}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate({ to: "/game/$code", params: { code: game.code } })}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function TimeControlPicker({
  minutes,
  increment,
  onPick,
}: {
  minutes: number;
  increment: number;
  onPick: (minutes: number, increment: number) => void;
}) {
  return (
    <div className="space-y-4">
      {TIME_CONTROLS.map((group) => (
        <div key={group.group}>
          <p className="eyebrow text-muted-foreground">{group.group}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {group.items.map((item) => {
              const active = item.minutes === minutes && item.increment === increment;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onPick(item.minutes, item.increment)}
                  className={cn(
                    "rounded-lg border px-4 py-2 font-display text-sm font-bold transition-colors",
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} copied`);
      }}
    >
      <Copy className="mr-2 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
