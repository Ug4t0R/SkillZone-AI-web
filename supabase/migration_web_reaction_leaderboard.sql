-- Migration: Create web_reaction_leaderboard table for Reaction Challenge

CREATE TABLE IF NOT EXISTS public.web_reaction_leaderboard (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    avg_reaction INTEGER NOT NULL DEFAULT 0,
    best_reaction INTEGER NOT NULL DEFAULT 0,
    false_starts INTEGER NOT NULL DEFAULT 0,
    rounds_played INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'solo',
    players_count INTEGER NOT NULL DEFAULT 1,
    input_type TEXT NOT NULL DEFAULT 'keyboard',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reaction_leaderboard_score ON public.web_reaction_leaderboard (score DESC);
CREATE INDEX IF NOT EXISTS idx_reaction_leaderboard_difficulty ON public.web_reaction_leaderboard (difficulty);
CREATE INDEX IF NOT EXISTS idx_reaction_leaderboard_mode ON public.web_reaction_leaderboard (mode);

-- Enable RLS
ALTER TABLE public.web_reaction_leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow public to READ the leaderboard
DROP POLICY IF EXISTS "public_read_web_reaction_leaderboard" ON public.web_reaction_leaderboard;
CREATE POLICY "public_read_web_reaction_leaderboard" ON public.web_reaction_leaderboard FOR SELECT USING (true);

-- Allow authenticated admins to do EVERYTHING (delete, update, etc)
DROP POLICY IF EXISTS "auth_write_web_reaction_leaderboard" ON public.web_reaction_leaderboard;
CREATE POLICY "auth_write_web_reaction_leaderboard" ON public.web_reaction_leaderboard FOR ALL USING (auth.role() = 'authenticated');

-- Allow visitors (anonymous users) to strictly INSERT scores, but not modify them!
DROP POLICY IF EXISTS "anon_insert_web_reaction_leaderboard" ON public.web_reaction_leaderboard;
CREATE POLICY "anon_insert_web_reaction_leaderboard" ON public.web_reaction_leaderboard FOR INSERT WITH CHECK (true);
