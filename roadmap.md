# Chess Platform Roadmap

## Done

- Anonymous session identity (name + temporary player id in localStorage)
- Landing page, how-to-play page, rules page
- Create room / join by code / quick match (server-side matchmaking queue)
- Real-time multiplayer over Supabase Realtime, server-authoritative moves (`chess.js` on the server)
- Server clocks with increment + timeout, resign, draw offers, rematch
- Board: click + drag, legal move indicators, last move highlight, check indicator, pawn promotion, board flips, coordinates
- Move list, live chat, PGN/FEN export, result screen, replay of finished games
- Play vs computer with real Stockfish 18 (WASM worker), 6 difficulty levels
- Deployed on Vercel (SSR + Server Functions) with Supabase (PostgreSQL + Realtime WebSockets)
