import { createFileRoute, Link } from "@tanstack/react-router";

import { ChessDiagram } from "@/components/ChessDiagram";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-to-play")({
  head: () => ({
    meta: [
      { title: "How to Play — Chess Room" },
      {
        name: "description",
        content:
          "A visual walkthrough of Chess Room: create a room, share the code, move pieces, read the clock and finish the game.",
      },
      { property: "og:title", content: "How to Play — Chess Room" },
      {
        property: "og:description",
        content: "Rooms, codes, clocks and moves — explained step by step with diagrams.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowToPlay,
});

const STEPS = [
  {
    step: "01",
    title: "Enter a name",
    text: "No sign-up and no email. Your name is kept on this device for the session, together with a temporary rating.",
  },
  {
    step: "02",
    title: "Create a room or join one",
    text: "Pick a time control and a colour and create a room, or type a friend's six-character code. You can also play the computer at six strengths.",
  },
  {
    step: "03",
    title: "Share the code",
    text: "Send the room code or the invite link. The clocks start the moment your opponent sits down.",
  },
  {
    step: "04",
    title: "Play, then review",
    text: "Chat, offer a draw, resign or rematch. Afterwards step back through the moves and save the game as a PGN file.",
  },
];

const BOARD_LESSONS = [
  {
    title: "This is the starting position",
    text: "White always moves first. A light square belongs in your bottom-right corner, and the queen starts next to the king on her own colour.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
    caption: "Both armies ready — sixteen pieces each.",
  },
  {
    title: "Tap a piece to see where it can go",
    text: "Green dots mark every legal move. Tap one of them to play it — dragging the piece works just as well.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
    highlight: ["e2"],
    moves: ["e3", "e4"],
    caption: "The e2 pawn may step one square or jump two.",
  },
  {
    title: "A good first move",
    text: "Playing a centre pawn opens lines for your bishop and queen. Knights come out next, towards the middle of the board.",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR",
    highlight: ["e4"],
    caption: "After 1. e4 the centre is claimed.",
  },
  {
    title: "Captures are shown with a red ring",
    text: "Move onto an enemy piece to take it. Pawns are the exception: they capture diagonally, never straight ahead.",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR",
    highlight: ["e4"],
    captures: ["d5"],
    caption: "The e4 pawn can take the pawn on d5.",
  },
  {
    title: "Watch out for check",
    text: "When your king is attacked you must respond at once — move it, block the line, or capture the attacker. No escape at all means checkmate and the game is over.",
    fen: "rnbqk1nr/pppp1ppp/8/2b1p3/4P3/2P5/PP3PPP/RNBQKBNR",
    highlight: ["c5", "f2"],
    caption: "The bishop on c5 is aiming straight at f2, next to White's king.",
  },
  {
    title: "The clock is part of the game",
    text: "Each side has a set time plus an increment added after every move. Run out and you lose, so glance at the clock as you play. Timing is kept on the server, so a refresh never costs you the game.",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R",
    caption: "A normal opening after a few moves each — 5+3 is a good starting time control.",
  },
];

const FAQ = [
  {
    q: "Do I need an account?",
    a: "No. Names and ratings live on your device for the session only.",
  },
  {
    q: "Can someone watch my game?",
    a: "Yes, by sharing your room link or room code with a friend.",
  },
  {
    q: "What if my opponent disappears?",
    a: "Their clock keeps running, and you can claim the win on time once it hits zero.",
  },
  {
    q: "Can I keep the game?",
    a: "Copy or download the PGN, or copy the final position as FEN, from the finished game screen.",
  },
];

function HowToPlay() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="eyebrow text-muted-foreground">Guide</p>
        <h1 className="display-xl mt-3 text-[clamp(2rem,5vw,3rem)]">How to play here</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Four steps to your first game, then a short visual tour of the board. Brand new to chess?
          The{" "}
          <Link to="/rules" className="underline decoration-accent underline-offset-4">
            rules page
          </Link>{" "}
          covers every piece and rule with diagrams.
        </p>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {STEPS.map((item) => (
            <article key={item.step} className="paper p-6">
              <p className="font-display text-3xl font-extrabold text-accent">{item.step}</p>
              <h2 className="mt-2 text-xl font-bold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">A tour of the board</h2>
          <div className="mt-6 space-y-6">
            {BOARD_LESSONS.map((lesson) => (
              <article
                key={lesson.title}
                className="paper grid items-center gap-8 p-6 md:grid-cols-2"
              >
                <div>
                  <h3 className="font-display text-xl font-bold">{lesson.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{lesson.text}</p>
                </div>
                <ChessDiagram
                  fen={lesson.fen}
                  moves={lesson.moves ?? []}
                  highlight={lesson.highlight ?? []}
                  captures={lesson.captures ?? []}
                  caption={lesson.caption}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Common questions</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FAQ.map((item) => (
              <article key={item.q} className="paper p-6">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/play">Create a room</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/rules">Read the rules</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
