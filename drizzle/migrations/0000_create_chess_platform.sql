-- Games
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'waiting',
  fen text NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn text NOT NULL DEFAULT 'w',
  white_name text,
  black_name text,
  white_session text,
  black_session text,
  minutes integer NOT NULL DEFAULT 5,
  increment integer NOT NULL DEFAULT 3,
  rated boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  white_ms integer NOT NULL DEFAULT 300000,
  black_ms integer NOT NULL DEFAULT 300000,
  last_move_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  result text,
  result_reason text,
  draw_offer_by text,
  rematch_offer_by text,
  rematch_game_code text,
  pgn text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.games TO anon, authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games readable by everyone" ON public.games FOR SELECT USING (true);

-- Secret per-game player tokens (never exposed to clients)
CREATE TABLE public.game_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  color text NOT NULL,
  token text NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, color)
);
GRANT ALL ON public.game_tokens TO service_role;
ALTER TABLE public.game_tokens ENABLE ROW LEVEL SECURITY;

-- Moves
CREATE TABLE public.game_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  ply integer NOT NULL,
  color text NOT NULL,
  san text NOT NULL,
  uci text NOT NULL,
  fen_after text NOT NULL,
  ms_left integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, ply)
);
GRANT SELECT ON public.game_moves TO anon, authenticated;
GRANT ALL ON public.game_moves TO service_role;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moves readable by everyone" ON public.game_moves FOR SELECT USING (true);
CREATE INDEX game_moves_game_idx ON public.game_moves (game_id, ply);

-- Chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_color text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat readable by everyone" ON public.chat_messages FOR SELECT USING (true);
CREATE INDEX chat_messages_game_idx ON public.chat_messages (game_id, created_at);

-- Matchmaking queue (no client access at all)
CREATE TABLE public.matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  player_name text NOT NULL,
  minutes integer NOT NULL,
  increment integer NOT NULL,
  rated boolean NOT NULL DEFAULT false,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.matchmaking_queue TO service_role;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Realtime
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER TABLE public.game_moves REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_moves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;