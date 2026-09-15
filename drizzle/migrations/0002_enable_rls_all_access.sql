-- Grant full table access to anon and authenticated roles
GRANT ALL ON public.games TO anon, authenticated;
GRANT ALL ON public.game_tokens TO anon, authenticated;
GRANT ALL ON public.game_moves TO anon, authenticated;
GRANT ALL ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.matchmaking_queue TO anon, authenticated;

-- Ensure RLS policies allow INSERT, UPDATE, DELETE for everyone
DROP POLICY IF EXISTS "games writeable by everyone" ON public.games;
CREATE POLICY "games writeable by everyone" ON public.games FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "game_tokens writeable by everyone" ON public.game_tokens;
CREATE POLICY "game_tokens writeable by everyone" ON public.game_tokens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "game_moves writeable by everyone" ON public.game_moves;
CREATE POLICY "game_moves writeable by everyone" ON public.game_moves FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages writeable by everyone" ON public.chat_messages;
CREATE POLICY "chat_messages writeable by everyone" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "matchmaking_queue writeable by everyone" ON public.matchmaking_queue;
CREATE POLICY "matchmaking_queue writeable by everyone" ON public.matchmaking_queue FOR ALL USING (true) WITH CHECK (true);
