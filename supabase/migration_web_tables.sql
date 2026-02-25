-- SkillZone Web Data Migration (v2 — cleaned up)
-- 11 tables prefixed with web_
-- Run in Supabase SQL Editor

-- ============================================
-- WEB_SETTINGS (key-value config store)
-- ============================================
CREATE TABLE IF NOT EXISTS web_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_GALLERY
-- ============================================
CREATE TABLE IF NOT EXISTS web_gallery (
    id TEXT PRIMARY KEY,
    src TEXT NOT NULL,
    alt TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('atmosphere', 'events', 'hardware', 'community')),
    location TEXT,
    date TEXT,
    visible BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_HISTORY (milestones)
-- ============================================
CREATE TABLE IF NOT EXISTS web_history (
    id TEXT PRIMARY KEY,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('business', 'community', 'tech', 'expansion')),
    img_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_PROTOCOL (server rules)
-- ============================================
CREATE TABLE IF NOT EXISTS web_protocol (
    id TEXT PRIMARY KEY,
    icon TEXT,
    title TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_LOCATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS web_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PUBLIC', 'PRIVATE')),
    address TEXT NOT NULL,
    description TEXT NOT NULL,
    specs JSONB NOT NULL DEFAULT '[]',
    img_url TEXT,
    phone TEXT,
    map_link TEXT,
    open_hours TEXT,
    open_year TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS web_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT,
    type TEXT,
    description TEXT,
    capacity INT,
    registered INT DEFAULT 0,
    img_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_CHAT_SESSIONS (with user metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS web_chat_sessions (
    id TEXT PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    messages JSONB NOT NULL DEFAULT '[]',
    user_nickname TEXT DEFAULT 'Anonymous',
    user_agent TEXT,
    session_fingerprint TEXT,
    message_count INT DEFAULT 0
);

-- Index for efficient querying by fingerprint/user
CREATE INDEX IF NOT EXISTS idx_chat_sessions_fingerprint ON web_chat_sessions(session_fingerprint);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_nickname ON web_chat_sessions(user_nickname);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON web_chat_sessions(updated_at DESC);

-- ============================================
-- WEB_ADMIN_MESSAGES (broadcast)
-- ============================================
CREATE TABLE IF NOT EXISTS web_admin_messages (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_DAILY_FEED
-- ============================================
CREATE TABLE IF NOT EXISTS web_daily_feed (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL DEFAULT 'Skiller',
    message TEXT NOT NULL,
    feed_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_OWNER_PROFILE
-- ============================================
CREATE TABLE IF NOT EXISTS web_owner_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL,
    nickname TEXT,
    role TEXT,
    bio TEXT,
    img_url TEXT,
    stats JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEB_SITEMAP
-- ============================================
CREATE TABLE IF NOT EXISTS web_sitemap (
    path TEXT PRIMARY KEY,
    view TEXT NOT NULL,
    label TEXT NOT NULL,
    changefreq TEXT DEFAULT 'monthly',
    priority REAL DEFAULT 0.5,
    visible BOOLEAN DEFAULT TRUE
);

-- ============================================
-- RLS POLICIES (anon access for website)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE web_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_protocol ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_daily_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_owner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_sitemap ENABLE ROW LEVEL SECURITY;

-- Allow anon SELECT on public-facing tables
CREATE POLICY "anon_read" ON web_gallery FOR SELECT USING (true);
CREATE POLICY "anon_read" ON web_history FOR SELECT USING (true);
CREATE POLICY "anon_read" ON web_protocol FOR SELECT USING (true);
CREATE POLICY "anon_read" ON web_locations FOR SELECT USING (true);
CREATE POLICY "anon_read" ON web_events FOR SELECT USING (true);
CREATE POLICY "anon_read" ON web_owner_profile FOR SELECT USING (true);
CREATE POLICY "anon_read" ON web_sitemap FOR SELECT USING (true);
CREATE POLICY "anon_read" ON web_settings FOR SELECT USING (true);

-- Allow anon full access on interactive tables
CREATE POLICY "anon_all" ON web_chat_sessions FOR ALL USING (true);
CREATE POLICY "anon_all" ON web_admin_messages FOR ALL USING (true);
CREATE POLICY "anon_all" ON web_daily_feed FOR ALL USING (true);

-- Allow anon INSERT/UPDATE/DELETE on admin-managed tables (admin auth handled in app)
CREATE POLICY "anon_write" ON web_gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON web_gallery FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON web_gallery FOR DELETE USING (true);

CREATE POLICY "anon_write" ON web_history FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON web_history FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON web_history FOR DELETE USING (true);

CREATE POLICY "anon_write" ON web_protocol FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON web_protocol FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON web_protocol FOR DELETE USING (true);

CREATE POLICY "anon_write" ON web_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON web_locations FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON web_locations FOR DELETE USING (true);

CREATE POLICY "anon_write" ON web_events FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON web_events FOR UPDATE USING (true);
CREATE POLICY "anon_delete" ON web_events FOR DELETE USING (true);

CREATE POLICY "anon_write" ON web_owner_profile FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON web_owner_profile FOR UPDATE USING (true);

CREATE POLICY "anon_write" ON web_sitemap FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON web_sitemap FOR UPDATE USING (true);

CREATE POLICY "anon_write" ON web_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON web_settings FOR UPDATE USING (true);
