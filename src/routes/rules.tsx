import { createFileRoute, Link } from "@tanstack/react-router";

import { ChessDiagram } from "@/components/ChessDiagram";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules of Chess — Chess Room" },
      {
        name: "description",
        content:
          "The complete rules of chess with board diagrams: how every piece moves, castling, en passant, promotion, check, checkmate, stalemate and draws.",
      },
      { property: "og:title", content: "Rules of Chess — Chess Room" },
      {
        property: "og:description",
        content:
          "Every rule of chess explained with clear board diagrams — pieces, castling, en passant, draws.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RulesPage,
});

const PIECES = [
  {
    name: "King",
    glyph: "♔",
    value: "—",
    text: "One square in any direction. The king can never move onto a square attacked by an enemy piece, and losing it ends the game.",
    fen: "8/8/8/8/3K4/8/8/8",
    highlight: ["d4"],
    moves: ["c5", "d5", "e5", "c4", "e4", "c3", "d3", "e3"],
  },
  {
    name: "Queen",
    glyph: "♕",
    value: "9 points",
    text: "Any number of squares in a straight line: up, down, sideways or diagonally. The strongest piece on the board.",
    fen: "8/8/8/8/3Q4/8/8/8",
    highlight: ["d4"],
    moves: [
      "d5",
      "d6",
      "d7",
      "d8",
      "d3",
      "d2",
      "d1",
      "a4",
      "b4",
      "c4",
      "e4",
      "f4",
      "g4",
      "h4",
      "c5",
      "b6",
      "a7",
      "e5",
      "f6",
      "g7",
      "h8",
      "c3",
      "b2",
      "a1",
      "e3",
      "f2",
      "g1",
    ],
  },
  {
    name: "Rook",
    glyph: "♖",
    value: "5 points",
    text: "Straight lines only — along its file or its rank. Rooks are also the piece used for castling.",
    fen: "8/8/8/8/3R4/8/8/8",
    highlight: ["d4"],
    moves: ["d5", "d6", "d7", "d8", "d3", "d2", "d1", "a4", "b4", "c4", "e4", "f4", "g4", "h4"],
  },
  {
    name: "Bishop",
    glyph: "♗",
    value: "3 points",
    text: "Diagonals only, so a bishop stays on its starting colour for the whole game.",
    fen: "8/8/8/8/3B4/8/8/8",
    highlight: ["d4"],
    moves: ["c5", "b6", "a7", "e5", "f6", "g7", "h8", "c3", "b2", "a1", "e3", "f2", "g1"],
  },
  {
    name: "Knight",
    glyph: "♘",
    value: "3 points",
    text: "An L-shape: two squares one way, then one square across. It is the only piece that jumps over others.",
    fen: "8/8/8/8/3N4/8/8/8",
    highlight: ["d4"],
    moves: ["b5", "c6", "e6", "f5", "f3", "e2", "c2", "b3"],
  },
  {
    name: "Pawn",
    glyph: "♙",
    value: "1 point",
    text: "Forward one square, or two from its starting square. It captures diagonally only — never straight ahead.",
    fen: "8/8/8/8/8/3p1p2/4P3/8",
    highlight: ["e2"],
    moves: ["e3", "e4"],
    captures: ["d3", "f3"],
  },
];

const SPECIAL = [
  {
    title: "Castling",
    text: "Once per game the king moves two squares towards a rook and the rook hops over to its other side. Allowed only if neither piece has moved, the squares between them are empty, and the king is not in check nor passing through an attacked square.",
    fen: "4k3/8/8/8/8/8/8/4K2R",
    highlight: ["e1", "h1"],
    moves: ["g1", "f1"],
    caption: "White castles short: king e1→g1, rook h1→f1.",
  },
  {
    title: "En passant",
    text: "If a pawn advances two squares and lands beside an enemy pawn, that pawn may capture it as if it had only moved one square — but only on the very next move.",
    fen: "4k3/8/8/3pP3/8/8/8/4K3",
    highlight: ["e5"],
    moves: ["d6"],
    captures: ["d5"],
    caption: "Black just played d7–d5; White answers exd6 and the d5 pawn comes off.",
  },
  {
    title: "Promotion",
    text: "A pawn that reaches the far rank must become a queen, rook, bishop or knight. Almost everyone picks the queen.",
    fen: "4k3/1P6/8/8/8/8/8/4K3",
    highlight: ["b7"],
    moves: ["b8"],
    caption: "b7–b8 and the pawn turns into a new queen.",
  },
];

const ENDINGS = [
  {
    title: "Checkmate — the game is won",
    text: "The king is attacked and there is no legal way out: no escape square, no block, no capture of the attacker.",
    fen: "R5k1/5ppp/8/8/8/8/8/6K1",
    highlight: ["a8", "g8"],
    caption:
      "Back-rank mate: the rook checks along the eighth rank and the pawns block the king's escape.",
  },
  {
    title: "Stalemate — the game is drawn",
    text: "The player to move is not in check but has no legal move at all. The game is a draw, however far ahead the other side is.",
    fen: "7k/5Q2/6K1/8/8/8/8/8",
    highlight: ["h8"],
    caption: "Black is not in check, yet every square is covered — a draw.",
  },
];

const DRAWS = [
  "Both players agree to a draw.",
  "Stalemate — no legal move while not in check.",
  "The same position appears three times.",
  "Fifty moves by each side with no capture and no pawn move.",
  "Neither side has enough material to force checkmate, e.g. king versus king and bishop.",
];

function RulesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="eyebrow text-muted-foreground">Reference</p>
        <h1 className="display-xl mt-3 text-[clamp(2rem,5vw,3rem)]">The rules of chess</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Everything you need to sit down and play a correct game, with a diagram for each rule.
          Green dots are squares a piece can move to, red rings are captures.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Setting up the board</h2>
          <div className="paper mt-4 grid items-center gap-8 p-6 md:grid-cols-2">
            <ChessDiagram
              fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
              caption="The starting position, seen from White's side."
            />
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>A light square sits in each player's bottom-right corner.</li>
              <li>Pawns fill the second row in front of the pieces.</li>
              <li>
                Back row, corner inwards: rook, knight, bishop, then queen and king — the queen
                always starts on her own colour.
              </li>
              <li>White moves first, then players alternate. Every turn is one move.</li>
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">How each piece moves</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {PIECES.map((piece) => (
              <article key={piece.name} className="paper p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-bold">
                    <span className="mr-2 text-2xl">{piece.glyph}</span>
                    {piece.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">{piece.value}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{piece.text}</p>
                <div className="mt-5">
                  <ChessDiagram
                    fen={piece.fen}
                    moves={piece.moves}
                    highlight={piece.highlight}
                    captures={piece.captures ?? []}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Three special moves</h2>
          <div className="mt-6 space-y-6">
            {SPECIAL.map((item) => (
              <article
                key={item.title}
                className="paper grid items-center gap-8 p-6 md:grid-cols-2"
              >
                <div>
                  <h3 className="font-display text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
                </div>
                <ChessDiagram
                  fen={item.fen}
                  moves={item.moves}
                  highlight={item.highlight}
                  captures={item.captures ?? []}
                  caption={item.caption}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Check, checkmate and stalemate</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            When your king is attacked you are in check and must answer it immediately — move the
            king, block the line, or capture the attacker. You may never leave your own king in
            check.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {ENDINGS.map((item) => (
              <article key={item.title} className="paper p-6">
                <h3 className="font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
                <div className="mt-5">
                  <ChessDiagram fen={item.fen} highlight={item.highlight} caption={item.caption} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Ways a game is drawn</h2>
          <ul className="paper mt-4 space-y-2 p-6">
            {DRAWS.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-accent">♟</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Reading the squares</h2>
          <div className="paper mt-4 grid items-center gap-8 p-6 md:grid-cols-2">
            <ChessDiagram
              fen="8/8/8/8/4P3/5N2/8/8"
              highlight={["e4", "f3"]}
              caption="Files are letters a–h, rows are numbers 1–8, so these squares are e4 and f3."
            />
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                A move is written as the piece letter plus the square: Nf3, Bb5, e4 for a pawn.
              </li>
              <li>An x means a capture (Nxe5), + means check, # means checkmate.</li>
              <li>Castling is written 0-0 short or 0-0-0 long.</li>
              <li>Every game here can be exported in this notation as a PGN file.</li>
            </ul>
          </div>
        </section>

        <div className="mt-16 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/computer">Practise against the computer</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/how-to-play">How this site works</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
