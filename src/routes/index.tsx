import { Link, createFileRoute } from "@tanstack/react-router";

import heroImage from "@/assets/hero-chess.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chess Room — Play Chess Online, No Account Required" },
      {
        name: "description",
        content:
          "Create a room, share the code and play real-time chess in your browser. No signup, no login — or take on Stockfish instantly.",
      },
      { property: "og:title", content: "Chess Room — Play Chess Online, No Account Required" },
      {
        property: "og:description",
        content:
          "Real-time multiplayer chess with friends in one click. No account, no email, no password.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    n: "01",
    title: "Real-time multiplayer",
    body: "Moves appear instantly on both devices, validated on the server.",
  },
  {
    n: "02",
    title: "No account required",
    body: "A name is all you need. Your identity lives in this session only.",
  },
  {
    n: "03",
    title: "Play with friends",
    body: "Share a six-character room code or an invite link and start.",
  },
  {
    n: "04",
    title: "Stockfish opponent",
    body: "The real engine runs in your browser across six strength levels.",
  },
  {
    n: "05",
    title: "Full chess rules",
    body: "Castling, en passant, promotion, repetition, fifty-move, timeouts.",
  },
  {
    n: "06",
    title: "Clocks and PGN",
    body: "Bullet to classical time controls, replay and export every game.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <p className="eyebrow text-muted-foreground">Anonymous chess rooms</p>
            <h1 className="display-xl mt-4 text-[clamp(2.6rem,7vw,4.6rem)]">
              Play chess.
              <br />
              No account
              <br />
              <span className="relative inline-block">
                required.
                <span className="absolute -bottom-1 left-0 h-2 w-full bg-accent/70" />
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
              Create a room, invite a friend, and start playing. No email, no password, nothing to
              install.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/play">Play online</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/computer">Play computer</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
              Bullet · Blitz · Rapid · Classical
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-secondary/60" aria-hidden />
            <img
              src={heroImage}
              alt="A black chess king beside a white knight on a bone-white background"
              width={1600}
              height={1200}
              className="relative w-full rounded-2xl object-cover shadow-plate"
            />
          </div>
        </section>

        <section className="border-y border-border bg-ink py-14 text-ink-foreground sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="display-xl max-w-2xl text-[clamp(1.8rem,4vw,2.8rem)]">
              Chess is beautiful enough to spend an evening on.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.n} className="rounded-2xl border border-ink-foreground/15 p-5">
                  <span className="eyebrow text-accent">{f.n}</span>
                  <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-ink-foreground/70">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-muted-foreground">How a game starts</p>
              <h2 className="display-xl mt-3 text-[clamp(1.7rem,3.6vw,2.4rem)]">
                Four steps, zero forms.
              </h2>
            </div>
            <ol className="space-y-3">
              {[
                "Enter a display name — it stays on your device.",
                "Create a room or join with a code.",
                "Send the invite link to your opponent.",
                "Play, chat, and export the PGN afterwards.",
              ].map((step, i) => (
                <li key={step} className="paper flex items-start gap-4 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground sm:text-base">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="ink-panel flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <div>
              <h2 className="display-xl text-[clamp(1.6rem,3.4vw,2.2rem)]">Ready for a game?</h2>
              <p className="mt-2 text-sm text-ink-foreground/70">
                Open a room now and share the code.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link to="/play">Start a room</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <span>Chess Room — anonymous play, session-only identities.</span>
          <span>Ratings shown in-app are temporary and stored on your device.</span>
        </div>
      </footer>
    </div>
  );
}
