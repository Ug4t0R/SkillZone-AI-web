
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Configuration keys for local storage
export const SUPABASE_URL_KEY = 'skillzone_sb_url';
export const SUPABASE_KEY_KEY = 'skillzone_sb_key';
export const SUPABASE_ENVS_KEY = 'skillzone_sb_environments';

export interface SupabaseEnv {
    id: string;
    name: string;
    url: string;
    key: string;
}

const DEFAULT_PROD_ENV: SupabaseEnv = {
    id: 'prod-default',
    name: 'PRODUCTION (Live)',
    url: 'https://snqmuyieibahlluqafbo.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucW11eWllaWJhaGxsdXFhZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDQ1NTgsImV4cCI6MjA4MDk4MDU1OH0.058WiFkALb3phaqpz6ls9pD0AUQ8QoiBBAelRMj35JY'
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) return supabaseInstance;
    let url = localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_PROD_ENV.url;
    let key = localStorage.getItem(SUPABASE_KEY_KEY) || DEFAULT_PROD_ENV.key;
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem(SUPABASE_URL_KEY, url);
    localStorage.setItem(SUPABASE_KEY_KEY, key);
    supabaseInstance = null;
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_KEY_KEY);
    supabaseInstance = null;
};

export const isSupabaseConfigured = (): boolean => {
    return !!localStorage.getItem(SUPABASE_URL_KEY) && !!localStorage.getItem(SUPABASE_KEY_KEY);
};

export const getSupabaseEnvs = (): SupabaseEnv[] => {
    try {
        const data = localStorage.getItem(SUPABASE_ENVS_KEY);
        const envs = data ? JSON.parse(data) : [];
        const hasProd = envs.find((e: any) => e.id === DEFAULT_PROD_ENV.id);
        return hasProd ? envs : [DEFAULT_PROD_ENV, ...envs];
    } catch {
        return [DEFAULT_PROD_ENV];
    }
};

export const saveSupabaseEnv = (env: SupabaseEnv) => {
    const envs = getSupabaseEnvs().filter(e => e.id !== env.id);
    const updated = [...envs, env];
    localStorage.setItem(SUPABASE_ENVS_KEY, JSON.stringify(updated));
};

export const deleteSupabaseEnv = (id: string) => {
    const envs = getSupabaseEnvs();
    const updated = envs.filter(e => e.id !== id);
    localStorage.setItem(SUPABASE_ENVS_KEY, JSON.stringify(updated));
};

export const getActiveEnvId = (): string => {
    const url = localStorage.getItem(SUPABASE_URL_KEY);
    if (!url) return DEFAULT_PROD_ENV.id;
    const envs = getSupabaseEnvs();
    const active = envs.find(e => e.url === url);
    return active ? active.id : 'custom';
};

// --- AUTH HELPERS ---

export const signIn = async (email: string, password: string) => {
    const sb = getSupabase();
    return await sb.auth.signInWithPassword({ email, password });
};

export const signInWithGoogle = async (scopes?: string) => {
    const sb = getSupabase();
    // Use the current URL's origin (e.g. https://new.skillzone.cz or http://localhost:1336)
    const redirectUrl = window.location.origin;
    return await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
            scopes: scopes || undefined,
            queryParams: scopes ? {
                access_type: 'offline',
                prompt: 'consent',
            } : undefined
        }
    });
};

export const signOut = async () => {
    const sb = getSupabase();
    await sb.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    return user;
};

// --- REALTIME HELPERS ---

export const subscribeToFeed = (callback: (payload: any) => void) => {
    const sb = getSupabase();
    return sb
        .channel('public:feed_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_messages' }, callback)
        .subscribe();
};
