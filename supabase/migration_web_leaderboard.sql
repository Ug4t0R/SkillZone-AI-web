-- Migration: Update web_leaderboard table for Aim Challenge
-- This script safely creates missing columns if the legacy table already exists!

CREATE TABLE IF NOT EXISTS public.web_leaderboard (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add all new columns needed for V2
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS accuracy INTEGER DEFAULT 0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS avg_reaction INTEGER DEFAULT 0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS best_reaction INTEGER DEFAULT 0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS worst_reaction INTEGER DEFAULT 0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS total_time REAL DEFAULT 0.0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS max_combo INTEGER DEFAULT 0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS consistency REAL DEFAULT 0.0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS misclicks INTEGER DEFAULT 0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS headshots INTEGER DEFAULT 0;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'gold_nova';
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS input_mode TEXT DEFAULT 'mouse';
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS resolution TEXT DEFAULT '';
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS challenge_id TEXT;
ALTER TABLE public.web_leaderboard ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.web_leaderboard (score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode ON public.web_leaderboard (input_mode);
CREATE INDEX IF NOT EXISTS idx_leaderboard_challenge ON public.web_leaderboard (challenge_id);

-- Enable RLS
ALTER TABLE public.web_leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow public to READ the leaderboard
DROP POLICY IF EXISTS "public_read_web_leaderboard" ON public.web_leaderboard;
CREATE POLICY "public_read_web_leaderboard" ON public.web_leaderboard FOR SELECT USING (true);

-- Allow authenticated admins to do EVERYTHING (delete, update, etc)
DROP POLICY IF EXISTS "auth_write_web_leaderboard" ON public.web_leaderboard;
CREATE POLICY "auth_write_web_leaderboard" ON public.web_leaderboard FOR ALL USING (auth.role() = 'authenticated');

-- Allow visitors (anonymous users) to strictly INSERT scores, but not modifiy them!
DROP POLICY IF EXISTS "anon_insert_web_leaderboard" ON public.web_leaderboard;
CREATE POLICY "anon_insert_web_leaderboard" ON public.web_leaderboard FOR INSERT WITH CHECK (true);

