import React from "react";

export type PieceType = "k" | "q" | "r" | "b" | "n" | "p";
export type PieceColor = "w" | "b";
export type PieceStyle = "staunton" | "neo" | "glyph";

type PieceProps = {
  type: PieceType;
  color: PieceColor;
  style?: PieceStyle;
  className?: string;
};

const GLYPHS: Record<string, string> = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
};

/**
 * Staunton & Neo Vector SVG Chess Pieces
 */
export function ChessPiece({
  type,
  color,
  style = "staunton",
  className = "w-full h-full",
}: PieceProps) {
  if (style === "glyph") {
    const glyphKey = `${color}${type}`;
    return (
      <span
        className={`pointer-events-none select-none text-[clamp(1.6rem,7.4vw,3.1rem)] leading-none ${
          color === "w"
            ? "text-board-light [text-shadow:0_0_1px_oklch(0.17_0.008_60),0_1px_0_oklch(0.17_0.008_60),1px_0_0_oklch(0.17_0.008_60),-1px_0_0_oklch(0.17_0.008_60),0_-1px_0_oklch(0.17_0.008_60),0_3px_6px_oklch(0.17_0.008_60/0.35)]"
            : "text-ink [text-shadow:0_1px_0_oklch(0.93_0.018_85/0.35),0_3px_6px_oklch(0.17_0.008_60/0.35)]"
        } ${className}`}
      >
        {GLYPHS[glyphKey]}
      </span>
    );
  }

  const isWhite = color === "w";
  const fillColor = isWhite ? "#F9FAFB" : "#1F2937";
  const strokeColor = isWhite ? "#374151" : "#F3F4F6";
  const accentColor = isWhite ? "#D1D5DB" : "#111827";

  if (style === "neo") {
    return (
      <svg
        viewBox="0 0 45 45"
        className={`pointer-events-none select-none drop-shadow-md transition-transform duration-150 ${className}`}
      >
        {renderNeoPiece(type, isWhite)}
      </svg>
    );
  }

  // Default: Staunton style SVGs
  return (
    <svg
      viewBox="0 0 45 45"
      className={`pointer-events-none select-none drop-shadow-md transition-transform duration-150 ${className}`}
    >
      {renderStauntonPiece(type, fillColor, strokeColor, accentColor)}
    </svg>
  );
}

function renderStauntonPiece(type: PieceType, fill: string, stroke: string, accent: string) {
  switch (type) {
    case "p":
      return (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 22.5 9 A 4 4 0 1 1 22.5 17 A 4 4 0 1 1 22.5 9 Z" />
          <path d="M 19 17 L 26 17 L 27 27 L 18 27 Z" />
          <path d="M 14 30 Q 22.5 27 31 30 L 31 33 L 14 33 Z" />
          <path d="M 12 36 L 33 36" strokeWidth="2" />
        </g>
      );
    case "r":
      return (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 9 36 L 36 36 L 36 32 L 9 32 Z" />
          <path d="M 12 32 L 12 25 L 33 25 L 33 32 Z" />
          <path d="M 11 25 L 11 16 L 34 16 L 34 25 Z" />
          <path d="M 11 16 L 11 10 L 15 10 L 15 13 L 20 13 L 20 10 L 25 10 L 25 13 L 30 13 L 30 10 L 34 10 L 34 16 Z" />
        </g>
      );
    case "n":
      return (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 22 10 C 32.5 11 38.5 18 31 32 L 34 36 L 11 36 L 12 30 C 13.5 25.5 17 25 17 25 C 12.5 21.5 13.5 13.5 22 10 Z" />
          <path d="M 24 18 C 24 18 28 20 28 23 C 28 26 23 25 23 25" />
          <circle cx="27" cy="15" r="1.5" fill={stroke} />
        </g>
      );
    case "b":
      return (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 9 36 L 36 36 L 36 32 L 9 32 Z" />
          <path d="M 15 32 C 15 28 17 20 22.5 14 C 28 20 30 28 30 32 Z" />
          <circle cx="22.5" cy="10" r="2.5" />
          <path d="M 20 17 L 25 17 M 22.5 14.5 L 22.5 19.5" />
          <path d="M 24 23 L 29 20" strokeWidth="2" />
        </g>
      );
    case "q":
      return (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 9 36 L 36 36 L 36 32 L 9 32 Z" />
          <path d="M 12 32 L 10 16 L 17 25 L 22.5 12 L 28 25 L 35 16 L 33 32 Z" />
          <circle cx="9" cy="14" r="2" />
          <circle cx="17" cy="22" r="1.5" />
          <circle cx="22.5" cy="9.5" r="2" />
          <circle cx="28" cy="22" r="1.5" />
          <circle cx="36" cy="14" r="2" />
        </g>
      );
    case "k":
      return (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 9 36 L 36 36 L 36 32 L 9 32 Z" />
          <path d="M 13 32 C 12 25 15 16 22.5 16 C 30 16 33 25 32 32 Z" />
          <path d="M 22.5 7 L 22.5 14 M 19 9.5 L 26 9.5" strokeWidth="2" />
          <circle cx="22.5" cy="16" r="3" fill={accent} />
        </g>
      );
  }
}

function renderNeoPiece(type: PieceType, isWhite: boolean) {
  const mainColor = isWhite ? "#3B82F6" : "#EF4444";
  const glowColor = isWhite ? "#93C5FD" : "#FCA5A5";
  const stroke = isWhite ? "#1E40AF" : "#991B1B";

  switch (type) {
    case "p":
      return (
        <g fill={mainColor} stroke={stroke} strokeWidth="1.5">
          <circle cx="22.5" cy="14" r="6" fill={glowColor} />
          <path d="M 16 34 L 29 34 L 26 22 L 19 22 Z" />
          <rect x="14" y="34" width="17" height="4" rx="2" />
        </g>
      );
    case "r":
      return (
        <g fill={mainColor} stroke={stroke} strokeWidth="1.5">
          <rect x="13" y="12" width="19" height="6" rx="1" fill={glowColor} />
          <path d="M 15 18 L 30 18 L 28 32 L 17 32 Z" />
          <rect x="12" y="32" width="21" height="5" rx="2" />
        </g>
      );
    case "n":
      return (
        <g fill={mainColor} stroke={stroke} strokeWidth="1.5">
          <path
            d="M 22 10 C 30 12 34 20 28 32 L 14 32 L 14 26 C 14 22 18 18 18 18 Z"
            fill={glowColor}
          />
          <rect x="12" y="32" width="21" height="5" rx="2" />
          <circle cx="24" cy="16" r="2" fill={stroke} />
        </g>
      );
    case "b":
      return (
        <g fill={mainColor} stroke={stroke} strokeWidth="1.5">
          <path d="M 22.5 10 L 29 24 L 16 24 Z" fill={glowColor} />
          <path d="M 16 24 L 29 24 L 27 32 L 18 32 Z" />
          <circle cx="22.5" cy="8" r="2" />
          <rect x="13" y="32" width="19" height="5" rx="2" />
        </g>
      );
    case "q":
      return (
        <g fill={mainColor} stroke={stroke} strokeWidth="1.5">
          <path d="M 11 16 L 16 26 L 22.5 12 L 29 26 L 34 16 L 31 32 L 14 32 Z" fill={glowColor} />
          <circle cx="22.5" cy="9" r="2.5" />
          <rect x="12" y="32" width="21" height="5" rx="2" />
        </g>
      );
    case "k":
      return (
        <g fill={mainColor} stroke={stroke} strokeWidth="1.5">
          <path
            d="M 14 20 C 14 15 18 13 22.5 13 C 27 13 31 15 31 20 L 29 32 L 16 32 Z"
            fill={glowColor}
          />
          <path
            d="M 22.5 6 L 22.5 12 M 19.5 9 L 25.5 9"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <rect x="12" y="32" width="21" height="5" rx="2" />
        </g>
      );
  }
}
