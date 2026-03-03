-- Migration: Create missing web_* tables
-- Tables: web_press, web_sitemap, web_whatsapp_conversations, web_whatsapp_messages
-- Date: 2026-03-03

-- ============================================
-- 1. web_press (Press & Media Articles)
-- ============================================
CREATE TABLE IF NOT EXISTS web_press (
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

ALTER TABLE web_press ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON web_press FOR SELECT USING (true);
CREATE POLICY "Master Admin Full Access" ON web_press
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

-- ============================================
-- 2. web_sitemap (SEO Sitemap Config)
-- ============================================
CREATE TABLE IF NOT EXISTS web_sitemap (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    view TEXT NOT NULL,
    label TEXT,
    changefreq TEXT DEFAULT 'weekly',
    priority FLOAT DEFAULT 0.5,
    visible BOOLEAN DEFAULT true
);

ALTER TABLE web_sitemap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON web_sitemap FOR SELECT USING (true);
CREATE POLICY "Master Admin Full Access" ON web_sitemap
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

-- ============================================
-- 3. web_whatsapp_conversations
-- ============================================
CREATE TABLE IF NOT EXISTS web_whatsapp_conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    phone TEXT NOT NULL,
    name TEXT,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE web_whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth Read Conversations" ON web_whatsapp_conversations
    FOR SELECT USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');
CREATE POLICY "Auth Write Conversations" ON web_whatsapp_conversations
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

-- ============================================
-- 4. web_whatsapp_messages
-- ============================================
CREATE TABLE IF NOT EXISTS web_whatsapp_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    conversation_id TEXT REFERENCES web_whatsapp_conversations(id) ON DELETE CASCADE,
    direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
);

ALTER TABLE web_whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth Read Messages" ON web_whatsapp_messages
    FOR SELECT USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');
CREATE POLICY "Auth Write Messages" ON web_whatsapp_messages
    FOR ALL USING (auth.jwt() ->> 'email' = 'tomas@skillzone.cz');

-- Index for faster message lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation
    ON web_whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created
    ON web_whatsapp_messages(created_at DESC);
