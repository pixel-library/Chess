import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/watch")({
  head: () => ({
    meta: [
      { title: "Watch Live Games — Chess Room" },
      {
        name: "description",
        content: "Browse public chess games in progress and follow the moves live as spectator.",
      },
      { property: "og:title", content: "Watch Live Games — Chess Room" },
      { property: "og:description", content: "Follow public games live, move by move." },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-games"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("games")
        .select("code, white_name, black_name, minutes, increment, status, updated_at")
        .eq("is_public", true)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return rows ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="eyebrow text-muted-foreground">Spectate</p>
        <h1 className="display-xl mt-3 text-3xl sm:text-4xl">Live games</h1>

        <div className="mt-8 space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading games…</p>}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="paper p-8 text-center">
              <p className="font-display text-xl font-bold">No public games right now</p>
              <p className="mt-2 text-sm text-muted-foreground">Start one and it will show up here.</p>
              <Button asChild className="mt-4">
                <Link to="/play">Create a room</Link>
              </Button>
            </div>
          )}
          {data?.map((game) => (
            <div key={game.code} className="paper flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">
                  {game.white_name ?? "White"} <span className="text-muted-foreground">vs</span>{" "}
                  {game.black_name ?? "Black"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {game.minutes}+{game.increment} · room {game.code}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/game/$code" params={{ code: game.code }}>
                  Watch
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
