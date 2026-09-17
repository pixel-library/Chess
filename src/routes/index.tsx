import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Bot, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";

import { ChessBoard } from "@/components/ChessBoard";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chess Room — Pro Web Chess Experience" },
      {
        name: "description",
        content:
          "Play real-time multiplayer chess with friends or challenge Stockfish AI. No registration required.",
      },
      { property: "og:title", content: "Chess Room — Pro Web Chess Experience" },
      {
        property: "og:description",
        content:
          "Instant multiplayer chess, live engine evaluation, customizable board themes and crisp sound effects.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time Sync",
    body: "Sub-millisecond WebSocket updates via Supabase Realtime for seamless multiplayer.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Friction",
    body: "No registration, no password, no email. Enter your handle and start playing instantly.",
  },
  {
    icon: Users,
    title: "Private Rooms",
    body: "Share a 6-character room code or direct invite URL to match with any friend.",
  },
  {
    icon: Bot,
    title: "Stockfish 16 Engine",
    body: "Browser-native engine evaluation with 6 difficulty tiers from 800 to 2500 ELO.",
  },
  {
    icon: Sparkles,
    title: "Pro Themes & Audio",
    body: "6 wooden & neon board themes, Staunton/Neo piece styles, and crisp Web Audio sound cues.",
  },
  {
    icon: ShieldCheck,
    title: "Full FIDE Rules",
    body: "Complete support for castling, en passant, promotion, repetition, and clock increments.",
  },
];

const INITIAL_DEMO_FEN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 5 5";

function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-accent shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Web Chess UI</span>
            </div>

            <h1 className="display-xl mt-5 text-[clamp(2.1rem,7.5vw,4.8rem)] font-extrabold tracking-tight">
              Master the board.
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-200 bg-clip-text text-transparent">
                No accounts.
              </span>
              <br />
              Instant play.
            </h1>

            <p className="mt-5 max-w-lg text-sm text-muted-foreground sm:text-lg leading-relaxed">
              Experience browser chess engineered for clarity and performance. Play live matches
              with friends, train against Stockfish, and analyze positions in real-time.
            </p>

            {/* Quick Action Cards */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto gap-2 font-bold shadow-lg shadow-amber-500/20"
              >
                <Link to="/play">
                  <Users className="h-4 w-4" /> Play Online Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto gap-2 font-bold"
              >
                <Link to="/computer">
                  <Bot className="h-4 w-4" /> Vs Stockfish AI
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>Bullet</span>
              <span className="opacity-40">·</span>
              <span>Blitz</span>
              <span className="opacity-40">·</span>
              <span>Rapid</span>
              <span className="opacity-40">·</span>
              <span>Classical</span>
            </div>
          </div>

          {/* Interactive Demo Board Widget */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/10 to-transparent blur-2xl"
              aria-hidden
            />
            <div className="relative glass-card overflow-hidden p-2.5 sm:p-3 shadow-2xl">
              <div className="mb-2.5 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Interactive Preview
                  </span>
                </div>
                <span className="text-[0.65rem] font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                  Giuoco Piano
                </span>
              </div>
              <ChessBoard fen={INITIAL_DEMO_FEN} interactive={true} showCoordinates={true} />
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-y border-border/80 bg-ink py-12 text-ink-foreground sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="eyebrow text-accent">Crafted for Excellence</p>
              <h2 className="display-xl mt-3 text-[clamp(1.75rem,4.5vw,3.2rem)] font-extrabold">
                Everything a serious chess enthusiast needs.
              </h2>
            </div>

            <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="group rounded-2xl border border-ink-foreground/15 bg-ink-foreground/5 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-ink-foreground/10"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-sm transition-transform group-hover:scale-110">
                      <Icon className="h-5.5 w-5.5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm text-ink-foreground/75 leading-relaxed">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4 Steps Section */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-24">
          <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow text-muted-foreground">Quick Setup</p>
              <h2 className="display-xl mt-3 text-[clamp(1.6rem,4vw,2.8rem)]">
                Start a room in under 5 seconds.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                No accounts to register, no verification emails. Simply pick a nickname and generate
                a unique room code.
              </p>
            </div>
            <div className="space-y-3.5 sm:space-y-4">
              {[
                {
                  step: "1",
                  title: "Choose your display handle",
                  desc: "Stored in session memory only.",
                },
                {
                  step: "2",
                  title: "Configure game time control",
                  desc: "Select Bullet, Blitz, Rapid or custom clock.",
                },
                {
                  step: "3",
                  title: "Share room link or code",
                  desc: "Opponent lands straight into the match.",
                },
                {
                  step: "4",
                  title: "Play & Analyze",
                  desc: "Real-time move history, evaluation, and PGN export.",
                },
              ].map((s) => (
                <div key={s.step} className="glass-card flex items-start gap-4 p-4 sm:p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent font-display font-extrabold text-accent-foreground shadow-sm">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-foreground text-sm sm:text-base">
                      {s.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-24 sm:px-6">
          <div className="ink-panel relative overflow-hidden flex flex-col items-start gap-6 p-6 sm:p-14 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative z-10 max-w-lg">
              <h2 className="display-xl text-[clamp(1.6rem,3.8vw,2.6rem)]">
                Ready to make your move?
              </h2>
              <p className="mt-2 text-sm text-ink-foreground/80">
                Launch a live private room now or challenge Stockfish.
              </p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto font-bold justify-center"
              >
                <Link to="/play">Create Room</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200 font-bold justify-center shadow-sm"
              >
                <Link to="/computer" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Play Stockfish
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80 py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-center sm:text-left sm:flex-row sm:justify-between sm:px-6">
          <span>Chess Room — High Performance Web Chess Engine & Multiplayer.</span>
          <span>Powered by Stockfish 16 & Supabase Realtime.</span>
        </div>
      </footer>
    </div>
  );
}
