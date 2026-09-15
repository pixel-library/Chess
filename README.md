# ♞ Chess Room

An anonymous real-time chess platform featuring instant online room creation, quick matchmaking, and Stockfish 18 WASM computer play.

Live Demo: [chess-rose-five.vercel.app](https://chess-rose-five.vercel.app)

---

## Features

- **No Sign-Up Needed**: Play instantly with temporary session ratings stored on your device.
- **Real-Time Multiplayer**: Create custom rooms or join with a 6-character code using Supabase Realtime WebSockets.
- **Play vs Computer**: Offline-capable Stockfish 18 WASM engine running in a Web Worker with 6 difficulty levels (Beginner to Master).
- **Full Chess Rules**: En passant, castling, pawn promotion, checkmate, stalemate, draw offers, and timeout clock enforcement.
- **PGN & FEN Export**: Replay completed games or export PGN files and FEN board states.

---

## Tech Stack

- **Framework**: TanStack Start (SSR + React 19)
- **Routing & State**: TanStack Router & TanStack Query
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Backend & Database**: Supabase (PostgreSQL, Realtime WebSockets, Row Level Security)
- **Engine**: Stockfish 18 WASM (Single-threaded Web Worker)
- **Hosting**: Vercel (Frontend & Server Functions) + Supabase (Database)

---

## Local Development

### Requirements

- Node.js (v20+)
- npm

### Setup

```sh
# Clone repository
git clone https://github.com/pixel-library/Chess.git
cd Chess

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Project Scripts

| Script           | Command              | Description                       |
| ---------------- | -------------------- | --------------------------------- |
| `npm run dev`    | `vite dev`           | Start development server          |
| `npm run build`  | `vite build`         | Build production SSR app & assets |
| `npm run lint`   | `eslint .`           | Run ESLint checks                 |
| `npm run format` | `prettier --write .` | Format codebase with Prettier     |

---

## Deployment Setup

### 1. Supabase Backend

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migrations from `drizzle/migrations/0000_create_chess_platform.sql` and `drizzle/migrations/0001_add_stats_tournaments_cleanup.sql` in the **SQL Editor**.
3. Under **Database** ➔ **Publications**, enable `supabase_realtime` for tables: `games`, `game_moves`, `chat_messages`.

### 2. Vercel Frontend

1. Import your repository into [Vercel](https://vercel.com).
2. Set **Framework Preset** to `TanStack Start` (or `Other`).
3. Set **Output Directory** to `.vercel/output`.
4. Add the following **Environment Variables**:

| Variable Name                   | Description                      |
| ------------------------------- | -------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase Project URL             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Anon Key                |
| `SUPABASE_URL`                  | Supabase Project URL             |
| `SUPABASE_PUBLISHABLE_KEY`      | Supabase Anon Key                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Service Role Secret Key |
| `DATABASE_URL`                  | PostgreSQL Connection String     |
