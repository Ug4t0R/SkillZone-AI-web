import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snqmuyieibahlluqafbo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucW11eWllaWJhaGxsdXFhZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDQ1NTgsImV4cCI6MjA4MDk4MDU1OH0.058WiFkALb3phaqpz6ls9pD0AUQ8QoiBBAelRMj35JY';

const sb = createClient(supabaseUrl, supabaseKey);

const EXPECTED_TABLES = [
    'web_settings',
    'web_gallery',
    'web_history',
    'web_protocol',
    'web_locations',
    'web_events',
    'web_press',
    'web_chat_sessions',
    'web_admin_messages',
    'web_daily_feed',
    'web_owner_profile',
    'web_sitemap',
    'web_user_profiles',
    'web_whatsapp_conversations',
    'web_whatsapp_messages',
    'web_leaderboard',
    'web_reaction_leaderboard'
];

async function checkTables() {
    console.log("Checking tables...");
    const missing = [];
    const found = [];
    const noAccess = [];

    for (const table of EXPECTED_TABLES) {
        // limit(1) to avoid downloading whole table, just checking if it exists
        const { error } = await sb.from(table).select('*').limit(1);

        if (error) {
            // 42P01: relation does not exist
            if (error.code === '42P01') {
                missing.push(table);
            } else {
                noAccess.push(table);
            }
        } else {
            found.push(table);
        }
    }

    console.log("\n--- RESULTS ---");
    console.log("Found tables (with access):", found.length);
    found.forEach(t => console.log(`  ✅ ${t}`));

    console.log("\nFound tables (no access/RLS restricted):", noAccess.length);
    noAccess.forEach(t => console.log(`  🔒 ${t}`));

    console.log("\nMissing tables:", missing.length);
    missing.forEach(t => console.log(`  ❌ ${t}`));
}

checkTables();
