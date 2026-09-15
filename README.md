# Chess Room

An anonymous real-time chess platform featuring online room creation, quick matchmaking, spectator mode, and Stockfish WASM computer play.

## Development

You need Node.js (v20+) and npm.

```sh
git clone https://github.com/pixel-library/Chess.git
cd Chess
npm install
npm run dev
```

## Features

- **Anonymous session identity**: Play without signing up or creating an account.
- **Real-time multiplayer**: Play over Supabase realtime sockets with server-authoritative move validation.
- **Play vs Computer**: Built-in Stockfish 18 WASM worker with 6 difficulty levels.
- **Full Chess Rules**: Castling, en passant, promotion, checkmate, stalemate, and timeout clock enforcement.
- **PGN / FEN Export**: Copy and export PGN and FEN for finished games.

## Built with

- TanStack Start (SSR + React 19)
- TanStack Router & TanStack Query
- TypeScript & Tailwind CSS v4
- Supabase JS Client & Stockfish WASM
