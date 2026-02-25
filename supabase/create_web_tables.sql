-- SkillZone Web — Supabase Table Creation
-- Run this in SQL Editor (Supabase Dashboard → SQL Editor → New Query)

-- ─── Settings (key-value store) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Chat Sessions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_chat_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    messages JSONB NOT NULL DEFAULT '[]',
    user_nickname TEXT,
    user_agent TEXT,
    session_fingerprint TEXT,
    visitor_id TEXT,
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '18:00',
    game TEXT NOT NULL DEFAULT 'General',
    type TEXT NOT NULL DEFAULT 'tournament',
    description TEXT DEFAULT '',
    capacity TEXT,
    "registrationLink" TEXT,
    "isCustom" BOOLEAN DEFAULT true,
    hidden BOOLEAN DEFAULT false
);

-- ─── Locations ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    description TEXT,
    image TEXT,
    features JSONB DEFAULT '[]',
    "googleMapsUrl" TEXT,
    "openingHours" TEXT,
    specs JSONB DEFAULT '{}'
);

-- ─── History Timeline ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '🎮'
);

-- ─── Protocol (Server Rules) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_protocol (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '📋',
    sort_order INTEGER DEFAULT 0
);

-- ─── Admin Messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_admin_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Daily Feed ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_daily_feed (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    feed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_name TEXT DEFAULT 'Anonymous',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Owner Profile ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_owner_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT DEFAULT 'Tomáš',
    title TEXT DEFAULT 'Founder & CEO',
    bio TEXT DEFAULT '',
    photo TEXT DEFAULT '',
    stats JSONB DEFAULT '{}',
    social JSONB DEFAULT '{}'
);

-- ─── Gallery ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_gallery (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0
);

-- ─── Editable Content (CMS) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_content (
    key TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'cs',
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (key, lang)
);

CREATE INDEX IF NOT EXISTS idx_content_lang ON web_content (lang);

-- ─── Analytics Events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_analytics (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_path TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    device TEXT,
    browser TEXT,
    language TEXT,
    screen_size TEXT,
    referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_ts ON web_analytics (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON web_analytics (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON web_analytics (event_type);

-- ─── Live Visitors (heartbeat) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_visitors (
    session_id TEXT PRIMARY KEY,
    last_seen TIMESTAMPTZ DEFAULT now(),
    page_path TEXT,
    device TEXT,
    language TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_visitors_active ON web_visitors (last_seen DESC) WHERE is_active = true;

-- ─── Leaderboard (Aim Challenge V2) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS web_leaderboard (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    accuracy INTEGER DEFAULT 0,
    avg_reaction INTEGER DEFAULT 0,
    best_reaction INTEGER DEFAULT 0,
    worst_reaction INTEGER DEFAULT 0,
    total_time REAL DEFAULT 0,
    max_combo INTEGER DEFAULT 0,
    consistency REAL DEFAULT 0,
    misclicks INTEGER DEFAULT 0,
    headshots INTEGER DEFAULT 0,
    difficulty TEXT DEFAULT 'gold_nova',
    input_mode TEXT DEFAULT 'mouse',
    resolution TEXT DEFAULT '',
    challenge_id TEXT,
    is_suspicious BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON web_leaderboard (score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode ON web_leaderboard (input_mode);
CREATE INDEX IF NOT EXISTS idx_leaderboard_challenge ON web_leaderboard (challenge_id);

-- ─── Enable Row Level Security (RLS) ──────────────────────────────────
-- Per-table RLS: public SELECT, authenticated ALL

ALTER TABLE web_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_settings" ON web_settings;
CREATE POLICY "public_read_web_settings" ON web_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_settings" ON web_settings;
CREATE POLICY "auth_write_web_settings" ON web_settings FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_chat_sessions" ON web_chat_sessions;
CREATE POLICY "public_read_web_chat_sessions" ON web_chat_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_chat_sessions" ON web_chat_sessions;
CREATE POLICY "auth_write_web_chat_sessions" ON web_chat_sessions FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "anon_insert_web_chat_sessions" ON web_chat_sessions;
CREATE POLICY "anon_insert_web_chat_sessions" ON web_chat_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_web_chat_sessions" ON web_chat_sessions;
CREATE POLICY "anon_update_web_chat_sessions" ON web_chat_sessions FOR UPDATE USING (true);

ALTER TABLE web_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_events" ON web_events;
CREATE POLICY "public_read_web_events" ON web_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_events" ON web_events;
CREATE POLICY "auth_write_web_events" ON web_events FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_locations" ON web_locations;
CREATE POLICY "public_read_web_locations" ON web_locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_locations" ON web_locations;
CREATE POLICY "auth_write_web_locations" ON web_locations FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_history" ON web_history;
CREATE POLICY "public_read_web_history" ON web_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_history" ON web_history;
CREATE POLICY "auth_write_web_history" ON web_history FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_protocol ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_protocol" ON web_protocol;
CREATE POLICY "public_read_web_protocol" ON web_protocol FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_protocol" ON web_protocol;
CREATE POLICY "auth_write_web_protocol" ON web_protocol FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_admin_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_admin_messages" ON web_admin_messages;
CREATE POLICY "public_read_web_admin_messages" ON web_admin_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_admin_messages" ON web_admin_messages;
CREATE POLICY "auth_write_web_admin_messages" ON web_admin_messages FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_daily_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_daily_feed" ON web_daily_feed;
CREATE POLICY "public_read_web_daily_feed" ON web_daily_feed FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_daily_feed" ON web_daily_feed;
CREATE POLICY "auth_write_web_daily_feed" ON web_daily_feed FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_owner_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_owner_profile" ON web_owner_profile;
CREATE POLICY "public_read_web_owner_profile" ON web_owner_profile FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_owner_profile" ON web_owner_profile;
CREATE POLICY "auth_write_web_owner_profile" ON web_owner_profile FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_gallery" ON web_gallery;
CREATE POLICY "public_read_web_gallery" ON web_gallery FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_gallery" ON web_gallery;
CREATE POLICY "auth_write_web_gallery" ON web_gallery FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE web_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_content" ON web_content;
CREATE POLICY "public_read_web_content" ON web_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_content" ON web_content;
CREATE POLICY "auth_write_web_content" ON web_content FOR ALL USING (auth.role() = 'authenticated');

-- Analytics + Visitors + Leaderboard: public READ + anonymous INSERT
ALTER TABLE web_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_analytics" ON web_analytics;
CREATE POLICY "public_read_web_analytics" ON web_analytics FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_analytics" ON web_analytics;
CREATE POLICY "auth_write_web_analytics" ON web_analytics FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "anon_insert_web_analytics" ON web_analytics;
CREATE POLICY "anon_insert_web_analytics" ON web_analytics FOR INSERT WITH CHECK (true);

ALTER TABLE web_visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_visitors" ON web_visitors;
CREATE POLICY "public_read_web_visitors" ON web_visitors FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_visitors" ON web_visitors;
CREATE POLICY "auth_write_web_visitors" ON web_visitors FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "anon_insert_web_visitors" ON web_visitors;
CREATE POLICY "anon_insert_web_visitors" ON web_visitors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_web_visitors" ON web_visitors;
CREATE POLICY "anon_update_web_visitors" ON web_visitors FOR UPDATE USING (true);

ALTER TABLE web_leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_leaderboard" ON web_leaderboard;
CREATE POLICY "public_read_web_leaderboard" ON web_leaderboard FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_web_leaderboard" ON web_leaderboard;
CREATE POLICY "auth_write_web_leaderboard" ON web_leaderboard FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "anon_insert_web_leaderboard" ON web_leaderboard;
CREATE POLICY "anon_insert_web_leaderboard" ON web_leaderboard FOR INSERT WITH CHECK (true);

-- ─── Google Reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_reviews (
    id TEXT PRIMARY KEY,
    google_review_id TEXT,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    location TEXT NOT NULL,
    date TEXT,
    photo_url TEXT,
    ai_comment TEXT,
    ai_tag TEXT CHECK (ai_tag IN ('highlight', 'honest', 'review_bomb', 'regular')),
    is_featured BOOLEAN DEFAULT false,
    google_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE web_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_web_reviews" ON web_reviews;
CREATE POLICY "public_read_web_reviews" ON web_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon_write_web_reviews" ON web_reviews;
CREATE POLICY "anon_write_web_reviews" ON web_reviews FOR ALL USING (true);

-- ─── Travel Time Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_travel_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL,
    travel_mode TEXT,
    duration_minutes REAL,
    distance_km REAL,
    taxi_provider TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE web_travel_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_web_travel_logs" ON web_travel_logs;
CREATE POLICY "anon_insert_web_travel_logs" ON web_travel_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public_read_web_travel_logs" ON web_travel_logs;
CREATE POLICY "public_read_web_travel_logs" ON web_travel_logs FOR SELECT USING (true);

-- Done! All web_* tables are ready.
