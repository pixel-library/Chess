const PIECES: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function parsePlacement(fen: string) {
  const board: Record<string, string> = {};
  const rows = (fen.split(" ")[0] ?? "").split("/");
  rows.forEach((row, rowIndex) => {
    let fileIndex = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        fileIndex += Number(char);
        continue;
      }
      board[`${FILES[fileIndex]}${8 - rowIndex}`] = char;
      fileIndex += 1;
    }
  });
  return board;
}

export type DiagramProps = {
  /** Piece placement, standard FEN (only the first field is used). */
  fen: string;
  /** Squares marked with a move dot, e.g. ["e4", "d5"]. */
  moves?: string[];
  /** Squares outlined, e.g. the piece being explained. */
  highlight?: string[];
  /** Squares marked with a capture ring. */
  captures?: string[];
  caption?: string;
  flipped?: boolean;
  size?: "sm" | "md";
};

export function ChessDiagram({
  fen,
  moves = [],
  highlight = [],
  captures = [],
  caption,
  flipped = false,
  size = "md",
}: DiagramProps) {
  const board = parsePlacement(fen);
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <figure className="w-full">
      <div
        className={
          size === "sm"
            ? "mx-auto grid w-full max-w-[220px] grid-cols-8 overflow-hidden rounded-lg border border-border shadow-sm"
            : "mx-auto grid w-full max-w-[340px] grid-cols-8 overflow-hidden rounded-lg border border-border shadow-sm"
        }
        role="img"
        aria-label={caption ?? "Chess position diagram"}
      >
        {ranks.map((rank) =>
          files.map((file) => {
            const square = `${file}${rank}`;
            const dark = (FILES.indexOf(file) + rank) % 2 !== 0;
            const piece = board[square];
            const isMove = moves.includes(square);
            const isCapture = captures.includes(square);
            const isHighlight = highlight.includes(square);
            return (
              <div
                key={square}
                className="relative flex aspect-square items-center justify-center"
                style={{ background: dark ? "hsl(35 25% 62%)" : "hsl(40 45% 92%)" }}
              >
                {isHighlight && <span className="absolute inset-0 bg-amber-400/45" />}
                {isCapture && (
                  <span className="absolute inset-[8%] rounded-full border-[3px] border-red-600/80" />
                )}
                {isMove && !piece && (
                  <span className="absolute h-[26%] w-[26%] rounded-full bg-emerald-700/70" />
                )}
                {piece && (
                  <span
                    className="relative leading-none"
                    style={{
                      fontSize: size === "sm" ? "1.35rem" : "2rem",
                      color: piece === piece.toUpperCase() ? "#fdfdfb" : "#17181c",
                      textShadow:
                        piece === piece.toUpperCase()
                          ? "0 0 1px #17181c, 0 0 2px #17181c"
                          : "0 0 1px rgba(255,255,255,.35)",
                    }}
                  >
                    {PIECES[piece]}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
