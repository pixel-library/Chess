import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Globe, Lock, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIME_CONTROLS } from "@/lib/chess-shared";
import { createGame, getPublicRooms, joinGame } from "@/lib/chess.functions";
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
      { title: "Play Online — Public & Private Chess Rooms" },
      {
        name: "description",
        content:
          "Create a public or private room, join open matches in the lobby, or play with friends via code.",
      },
      { property: "og:title", content: "Play Online — Public & Private Chess Rooms" },
      {
        property: "og:description",
        content: "Public lobby matches or private rooms by code. No signup required.",
      },
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
  const fetchPublic = useServerFn(getPublicRooms);

  const publicRoomsQuery = useQuery({
    queryKey: ["public-rooms"],
    queryFn: () => fetchPublic(),
    refetchInterval: 5000,
  });

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

  async function handleJoin(codeToJoin?: string) {
    const code = codeToJoin || joinCode;
    if (!code.trim()) return;
    setBusy(true);
    try {
      const result = await join({ data: { code: code.trim().toUpperCase(), name, sessionId } });
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
            <Button type="submit" size="lg" className="w-full font-bold" disabled={!name.trim()}>
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
            <p className="eyebrow text-muted-foreground">Player Profile</p>
            <h1 className="display-xl mt-2 text-3xl sm:text-4xl">{name}</h1>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              Session ID: {sessionId.slice(0, 8)}... · Temporary Rating: {rating}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNameLocked(false);
            }}
          >
            Change Handle
          </Button>
        </div>

        <Tabs defaultValue="create" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="font-bold">
              Create Room
            </TabsTrigger>
            <TabsTrigger value="lobby" className="font-bold">
              Public Lobby
            </TabsTrigger>
            <TabsTrigger value="join" className="font-bold">
              Join Code
            </TabsTrigger>
          </TabsList>

          {/* Create Room Tab */}
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
                <p className="eyebrow text-muted-foreground">Room Access</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                      isPublic
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border hover:bg-secondary text-muted-foreground",
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                      !isPublic
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border hover:bg-secondary text-muted-foreground",
                    )}
                  >
                    <Lock className="h-4 w-4" />
                    Private
                  </button>
                </div>
              </div>
              <div>
                <p className="eyebrow text-muted-foreground">Your Side</p>
                <div className="mt-2 flex gap-2">
                  {(["white", "black", "random"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setColorPref(option)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition-colors",
                        colorPref === option
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:bg-secondary text-muted-foreground",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
              <div className="flex items-center gap-3">
                <Switch id="create-rated" checked={rated} onCheckedChange={setRated} />
                <Label htmlFor="create-rated" className="font-semibold">
                  Rated (session rating)
                </Label>
              </div>
              <Button size="lg" disabled={busy} onClick={handleCreate} className="font-bold">
                {isPublic ? "Create Public Room" : "Create Private Room"}
              </Button>
            </div>
          </TabsContent>

          {/* Public Lobby Tab */}
          <TabsContent value="lobby" className="paper mt-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">Public Open Rooms</h3>
                <p className="text-xs text-muted-foreground">
                  Live matches waiting for an opponent. Click join to play.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => publicRoomsQuery.refetch()}
                disabled={publicRoomsQuery.isFetching}
              >
                <RefreshCw
                  className={cn("mr-2 h-3.5 w-3.5", publicRoomsQuery.isFetching && "animate-spin")}
                />
                Refresh
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {publicRoomsQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Loading public games...</p>
              )}
              {publicRoomsQuery.data && publicRoomsQuery.data.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Globe className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    No public rooms waiting right now
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create a public room above and others will see it here!
                  </p>
                </div>
              )}
              {publicRoomsQuery.data?.map((room) => {
                const hostName = room.white_name || room.black_name || "Host";
                const hostSide = room.white_name ? "White" : "Black";
                return (
                  <div key={room.code} className="glass-card flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 font-display text-base font-bold text-accent">
                        {hostSide === "White" ? "♔" : "♚"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{hostName}</span>
                          <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                            {room.minutes}+{room.increment}
                          </span>
                          {room.rated && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[0.65rem] font-bold text-amber-400">
                              Rated
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Room Code: <span className="font-mono font-semibold">{room.code}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => handleJoin(room.code)}
                      className="font-bold"
                    >
                      Join Game
                    </Button>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Join Code Tab */}
          <TabsContent value="join" className="paper mt-4 p-6">
            <Label htmlFor="join-code" className="font-semibold">
              Room Code
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="join-code"
                value={joinCode}
                maxLength={8}
                placeholder="A7K9P2"
                className="font-display text-lg uppercase tracking-[0.3em]"
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              />
              <Button
                disabled={busy || joinCode.trim().length < 4}
                onClick={() => handleJoin()}
                className="font-bold"
              >
                Join Match
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Have an invite URL? Open it in your browser and you'll join automatically.
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
