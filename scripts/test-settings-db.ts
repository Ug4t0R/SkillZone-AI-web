import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing config!");
    process.exit(1);
}

const sb = createClient(url, key);

async function check() {
    const { data, error } = await sb.from('web_settings').select('*').limit(1);
    if (error) {
        console.error("ERROR from web_settings:", error);
    } else {
        console.log("DATA from web_settings:", data);
    }

    const { error: insertError } = await sb.from('web_settings').upsert({ key: "test", value: { msg: "hello" } });
    if (insertError) {
        console.error("INSERT ERROR:", insertError);
    } else {
        console.log("INSERT SUCCESS");
    }
}

check();
