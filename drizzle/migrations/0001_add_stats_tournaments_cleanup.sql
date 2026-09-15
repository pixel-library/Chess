CREATE TABLE public.session_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  name text NOT NULL,
  rating integer NOT NULL DEFAULT 1200,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  games integer NOT NULL DEFAULT 0,
  last_active timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  max_players integer NOT NULL DEFAULT 4,
  rounds integer NOT NULL DEFAULT 3,
  minutes integer NOT NULL DEFAULT 5,
  increment integer NOT NULL DEFAULT 3,
  created_by_session text,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.tournament_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  name text NOT NULL,
  seed integer,
  UNIQUE (tournament_id, session_id)
);

CREATE TABLE public.tournament_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round integer NOT NULL,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  white_session text,
  black_session text,
  status text NOT NULL DEFAULT 'pending',
  result text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.tournament_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  name text NOT NULL,
  points numeric(4,1) NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  buchholz numeric NOT NULL DEFAULT 0,
  UNIQUE (tournament_id, session_id)
);

GRANT SELECT ON public.session_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_stats TO service_role;
GRANT SELECT ON public.tournaments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments TO service_role;
GRANT SELECT ON public.tournament_players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_players TO service_role;
GRANT SELECT ON public.tournament_games TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_games TO service_role;
GRANT SELECT ON public.tournament_standings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_standings TO service_role;

ALTER TABLE public.session_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session stats are public read" ON public.session_stats FOR SELECT TO anon USING (true);
CREATE POLICY "Tournaments are public read" ON public.tournaments FOR SELECT TO anon USING (true);
CREATE POLICY "Tournament players are public read" ON public.tournament_players FOR SELECT TO anon USING (true);
CREATE POLICY "Tournament games are public read" ON public.tournament_games FOR SELECT TO anon USING (true);
CREATE POLICY "Tournament standings are public read" ON public.tournament_standings FOR SELECT TO anon USING (true);

ALTER TABLE public.game_tokens DROP CONSTRAINT IF EXISTS game_tokens_game_id_fkey;
ALTER TABLE public.game_tokens ADD CONSTRAINT game_tokens_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;
ALTER TABLE public.game_moves DROP CONSTRAINT IF EXISTS game_moves_game_id_fkey;
ALTER TABLE public.game_moves ADD CONSTRAINT game_moves_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_game_id_fkey;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.chat_messages WHERE created_at < now() - interval '7 days';
  DELETE FROM public.game_moves WHERE created_at < now() - interval '7 days';
  DELETE FROM public.games WHERE status = 'finished' AND ended_at < now() - interval '7 days';
  DELETE FROM public.games WHERE status = 'waiting' AND created_at < now() - interval '15 minutes';
  DELETE FROM public.matchmaking_queue WHERE game_id IS NULL AND created_at < now() - interval '2 minutes';
  DELETE FROM public.session_stats WHERE last_active < now() - interval '30 days';
  DELETE FROM public.tournaments WHERE status = 'finished' AND ended_at < now() - interval '30 days';
  DELETE FROM public.game_tokens WHERE NOT EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_tokens.game_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO service_role;