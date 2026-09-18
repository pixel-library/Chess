import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function HeroChessArtwork({ className = "" }: Props) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950 p-4 shadow-2xl backdrop-blur-xl group",
        className,
      )}
    >
      {/* Background Geometric Grid Rays (Image 2 Inspiration) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40 transition-transform duration-700 ease-out group-hover:scale-105"
        viewBox="0 0 300 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="goldRay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="obsidianRay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Checkerboard Rays & Facets */}
        <polygon points="150,0 0,0 0,150" fill="url(#goldRay)" />
        <polygon points="150,0 300,0 300,150" fill="url(#obsidianRay)" />
        <polygon points="0,150 150,200 0,300" fill="url(#goldRay)" opacity="0.5" />
        <polygon points="300,150 150,200 300,300" fill="url(#obsidianRay)" opacity="0.6" />
        <circle cx="150" cy="180" r="90" fill="#FEE685" opacity="0.15" />
      </svg>

      {/* Center Split Queen Artwork (Image 2 Direct Inspiration) */}
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <svg
          viewBox="0 0 200 300"
          className="h-full w-full max-h-[90%] filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.85)] transition-transform duration-500 group-hover:scale-105"
        >
          {/* LEFT HALF (GOLD / AMBER FACTIONS) */}
          <g filter="drop-shadow(0 0 15px rgba(245, 158, 11, 0.4))">
            {/* Crown Spikes Left */}
            <polygon
              points="100,30 70,70 60,40"
              fill="#FEF08A"
              stroke="#451A03"
              strokeWidth="1.5"
            />
            <polygon
              points="100,30 85,85 70,70"
              fill="#FBBF24"
              stroke="#451A03"
              strokeWidth="1.5"
            />

            {/* Queen Head Sphere Left */}
            <path d="M 100 30 A 15 15 0 0 0 85 45 L 100 60 Z" fill="#F59E0B" />

            {/* Neck & Shoulder Left */}
            <polygon
              points="100,85 65,110 80,140 100,140"
              fill="#FBBF24"
              stroke="#451A03"
              strokeWidth="1.5"
            />

            {/* Upper Gown Left */}
            <polygon
              points="100,140 70,190 100,210"
              fill="#D97706"
              stroke="#451A03"
              strokeWidth="1.5"
            />
            <polygon
              points="70,190 55,230 100,245"
              fill="#F59E0B"
              stroke="#451A03"
              strokeWidth="1.5"
            />

            {/* Pedestal Base Left */}
            <polygon
              points="100,245 45,260 100,275"
              fill="#B45309"
              stroke="#451A03"
              strokeWidth="1.5"
            />
          </g>

          {/* RIGHT HALF (OBSIDIAN / SLATE FACTIONS) */}
          <g filter="drop-shadow(0 0 15px rgba(15, 23, 42, 0.6))">
            {/* Crown Spikes Right */}
            <polygon
              points="100,30 130,70 140,40"
              fill="#94A3B8"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            <polygon
              points="100,30 115,85 130,70"
              fill="#475569"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />

            {/* Queen Head Sphere Right */}
            <path d="M 100 30 A 15 15 0 0 1 115 45 L 100 60 Z" fill="#334155" />

            {/* Neck & Shoulder Right */}
            <polygon
              points="100,85 135,110 120,140 100,140"
              fill="#1E293B"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />

            {/* Upper Gown Right */}
            <polygon
              points="100,140 130,190 100,210"
              fill="#0F172A"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            <polygon
              points="130,190 145,230 100,245"
              fill="#1E293B"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />

            {/* Pedestal Base Right */}
            <polygon
              points="100,245 155,260 100,275"
              fill="#020617"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>

      {/* Decorative Gold Accent Badge */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-amber-500/30 bg-slate-900/80 px-3.5 py-2 backdrop-blur-md">
        <span className="font-editorial text-xs font-black uppercase tracking-widest text-amber-400">
          Dual-Tone Art
        </span>
        <span className="font-mono text-[0.65rem] font-bold text-slate-400">Obsidian vs Gold</span>
      </div>
    </div>
  );
}
