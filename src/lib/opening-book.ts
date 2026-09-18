// ECO Opening Book mapping for chess opening recognition

type Opening = {
  name: string;
  eco: string;
  moves: string[]; // SAN sequence
};

export const OPENINGS: Opening[] = [
  // King's Pawn Openings (1. e4)
  { name: "Ruy Lopez", eco: "C60", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
  { name: "Italian Game", eco: "C50", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"] },
  { name: "Giuoco Piano", eco: "C53", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"] },
  { name: "Two Knights Defense", eco: "C55", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"] },
  { name: "Scotch Game", eco: "C44", moves: ["e4", "e5", "Nf3", "Nc6", "d4"] },
  { name: "Four Knights Game", eco: "C47", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"] },
  { name: "King's Gambit", eco: "C30", moves: ["e4", "e5", "f4"] },
  { name: "Vienna Game", eco: "C23", moves: ["e4", "e5", "Nc3"] },
  { name: "Center Game", eco: "C20", moves: ["e4", "e5", "d4"] },

  // Sicilian Defense (1. e4 c5)
  { name: "Sicilian Defense", eco: "B20", moves: ["e4", "c5"] },
  { name: "Sicilian Defense: Open", eco: "B30", moves: ["e4", "c5", "Nf3", "Nc6", "d4"] },
  {
    name: "Sicilian Defense: Najdorf",
    eco: "B90",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
  },
  {
    name: "Sicilian Defense: Dragon",
    eco: "B70",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"],
  },
  { name: "Sicilian Defense: Closed", eco: "B23", moves: ["e4", "c5", "Nc3"] },
  { name: "Sicilian Defense: Alapin", eco: "B22", moves: ["e4", "c5", "c3"] },

  // French Defense (1. e4 e6)
  { name: "French Defense", eco: "C00", moves: ["e4", "e6"] },
  { name: "French Defense: Advance", eco: "C02", moves: ["e4", "e6", "d4", "d5", "e5"] },
  { name: "French Defense: Exchange", eco: "C01", moves: ["e4", "e6", "d4", "d5", "exd5"] },
  { name: "French Defense: Winawer", eco: "C15", moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"] },

  // Caro-Kann Defense (1. e4 c6)
  { name: "Caro-Kann Defense", eco: "B10", moves: ["e4", "c6"] },
  { name: "Caro-Kann: Advance", eco: "B12", moves: ["e4", "c6", "d4", "d5", "e5"] },
  {
    name: "Caro-Kann: Classical",
    eco: "B18",
    moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"],
  },

  // Scandinavian & Others (1. e4)
  { name: "Scandinavian Defense", eco: "B01", moves: ["e4", "d5"] },
  { name: "Alekhine's Defense", eco: "B02", moves: ["e4", "Nf6"] },
  { name: "Pirc Defense", eco: "B07", moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6"] },

  // Queen's Pawn Openings (1. d4)
  { name: "Queen's Gambit", eco: "D06", moves: ["d4", "d5", "c4"] },
  { name: "Queen's Gambit Accepted", eco: "D20", moves: ["d4", "d5", "c4", "dxc4"] },
  { name: "Queen's Gambit Declined", eco: "D30", moves: ["d4", "d5", "c4", "e6"] },
  { name: "Slav Defense", eco: "D10", moves: ["d4", "d5", "c4", "c6"] },
  { name: "London System", eco: "D02", moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"] },
  { name: "Trompowsky Attack", eco: "A45", moves: ["d4", "Nf6", "Bg5"] },

  // Indian Defenses (1. d4 Nf6)
  { name: "King's Indian Defense", eco: "E60", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"] },
  { name: "Nimzo-Indian Defense", eco: "E20", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"] },
  { name: "Queen's Indian Defense", eco: "E12", moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"] },
  { name: "Grünfeld Defense", eco: "D70", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"] },

  // Flank Openings
  { name: "English Opening", eco: "A10", moves: ["c4"] },
  { name: "Réti Opening", eco: "A04", moves: ["Nf3"] },
  { name: "King's Indian Attack", eco: "A07", moves: ["Nf3", "d5", "g3"] },
  { name: "Bird's Opening", eco: "A02", moves: ["f4"] },
];

/**
 * Finds the longest matching opening for a given move history (array of SAN moves).
 */
export function getOpeningName(history: string[]): { name: string; eco: string } | null {
  if (!history || history.length === 0) return null;

  let bestMatch: Opening | null = null;
  let maxMatchedMoves = 0;

  for (const op of OPENINGS) {
    if (op.moves.length > history.length) continue;

    let matches = true;
    for (let i = 0; i < op.moves.length; i++) {
      if (history[i] !== op.moves[i]) {
        matches = false;
        break;
      }
    }

    if (matches && op.moves.length > maxMatchedMoves) {
      bestMatch = op;
      maxMatchedMoves = op.moves.length;
    }
  }

  return bestMatch ? { name: bestMatch.name, eco: bestMatch.eco } : null;
}
