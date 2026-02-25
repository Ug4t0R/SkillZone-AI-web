
export const getSqlSchema = (): string => {
    return `
-- 1. CLEANUP (Reset tables if they exist)
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS history_milestones CASCADE;
DROP TABLE IF EXISTS protocol_rules CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS feed_messages CASCADE;
DROP TABLE IF EXISTS owner_profile CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS web_press CASCADE;
DROP TABLE IF EXISTS web_analytics CASCADE;
DROP TABLE IF EXISTS web_visitors CASCADE;

-- 2. CREATE TABLES

-- Locations
CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    address TEXT,
    description TEXT,
    specs TEXT[],
    img_url TEXT,
    phone TEXT,
    map_link TEXT,
    open_hours TEXT,
    open_year TEXT,
    coordinates JSONB,
    is_custom BOOLEAN DEFAULT false
);

-- History
CREATE TABLE history_milestones (
    id TEXT PRIMARY KEY,
    year TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    img_url TEXT,
    is_custom BOOLEAN DEFAULT false
);

-- Protocol (Rules)
CREATE TABLE protocol_rules (
    id TEXT PRIMARY KEY,
    title TEXT,
    category TEXT,
    icon TEXT,
    content TEXT[],
    is_custom BOOLEAN DEFAULT false
);

-- Events (Calendar)
CREATE TABLE calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT,
    date TEXT,
    time TEXT,
    game TEXT,
    type TEXT,
    description TEXT,
    capacity TEXT,
    registration_link TEXT,
    is_custom BOOLEAN DEFAULT false
);

-- AI Settings
CREATE TABLE ai_settings (
    id INT PRIMARY KEY DEFAULT 1,
    system_prompt TEXT,
    temperature FLOAT,
    model TEXT
);

-- Feed Messages
CREATE TABLE feed_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_ai BOOLEAN DEFAULT false
);

-- Owner Profile
CREATE TABLE owner_profile (
    id INT PRIMARY KEY DEFAULT 1,
    name TEXT,
    nickname TEXT,
    role TEXT,
    bio TEXT,
    img_url TEXT,
    stats JSONB
);

-- Chat Sessions
CREATE TABLE chat_sessions (
    id TEXT PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    messages JSONB
);

-- Press & Media Articles
CREATE TABLE web_press (
    id TEXT PRIMARY KEY,
    source TEXT,
    title TEXT,
    "titleEn" TEXT,
    description TEXT,
    "descriptionEn" TEXT,
    url TEXT,
    date TEXT,
    year INT,
    category TEXT,
    logo TEXT,
    highlight BOOLEAN DEFAULT false,
    "isCustom" BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Web Analytics Events
CREATE TABLE web_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    event_type TEXT,
    event_data JSONB,
    page_path TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device TEXT,
    browser TEXT,
    language TEXT,
    screen_size TEXT,
    referrer TEXT
);

-- Live Visitors Heartbeat
CREATE TABLE web_visitors (
    session_id TEXT PRIMARY KEY,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page_path TEXT,
    device TEXT,
    language TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_press ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_visitors ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SECURITY POLICIES
-- Define Master Admin Email: tomas@skillzone.cz

-- policy: Everyone can SELECT (Read Only)
CREATE POLICY "Public Read Access" ON locations FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON history_milestones FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON protocol_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON ai_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON feed_messages FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON owner_profile FOR SELECT USING (true);

-- policy: Only tomas@skillzone.cz can do EVERYTHING (Write/Update/Delete)
CREATE POLICY "Master Admin Full Access" ON locations 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Master Admin Full Access" ON history_milestones 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Master Admin Full Access" ON protocol_rules 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Master Admin Full Access" ON calendar_events 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Master Admin Full Access" ON ai_settings 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Master Admin Full Access" ON feed_messages 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Master Admin Full Access" ON owner_profile 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Master Admin Full Access" ON chat_sessions 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Public Read Access" ON web_press FOR SELECT USING (true);
CREATE POLICY "Master Admin Full Access" ON web_press 
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

-- Analytics: everyone can INSERT (write their own events), admin reads all
CREATE POLICY "Public Insert Analytics" ON web_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Master Admin Read Analytics" ON web_analytics 
    FOR SELECT USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

CREATE POLICY "Public Upsert Visitors" ON web_visitors FOR ALL USING (true);

`;
};
