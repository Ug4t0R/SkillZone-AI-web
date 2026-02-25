/**
 * WebDataService — centralized Supabase CRUD for all web_* tables.
 * In-memory cache for performance, falls back to defaults when offline.
 */
import { getSupabase } from './supabaseClient';

// ─── Cache ───────────────────────────────────────────────────────────
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
    return null;
}

function setCache(key: string, data: any) {
    cache.set(key, { data, ts: Date.now() });
}

export function invalidateCache(table?: string) {
    if (table) {
        cache.delete(table);
    } else {
        cache.clear();
    }
}

// ─── DB Health ───────────────────────────────────────────────────────

let _dbHealthy = true;
let _healthListeners: Array<(healthy: boolean) => void> = [];

export function isDbHealthy(): boolean { return _dbHealthy; }

export function onHealthChange(cb: (healthy: boolean) => void): () => void {
    _healthListeners.push(cb);
    return () => { _healthListeners = _healthListeners.filter(l => l !== cb); };
}

function setDbHealth(healthy: boolean) {
    if (_dbHealthy !== healthy) {
        _dbHealthy = healthy;
        _healthListeners.forEach(cb => cb(healthy));
        console.log(`%c[DB] Health: ${healthy ? '✅ ONLINE' : '❌ OFFLINE'}`, healthy ? 'color:#22c55e' : 'color:#ef4444;font-weight:bold');
    }
}

/** Quick ping — tries to read one row from web_settings */
export async function checkSupabaseHealth(): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.from('web_settings').select('key').limit(1);
        const ok = !error;
        setDbHealth(ok);
        return ok;
    } catch {
        setDbHealth(false);
        return false;
    }
}

// ─── Generic CRUD ────────────────────────────────────────────────────

export async function fetchAll<T>(table: string, defaults: T[], orderBy?: string): Promise<T[]> {
    const cached = getCached<T[]>(table);
    if (cached) return cached;

    try {
        const sb = getSupabase();
        let query = sb.from(table).select('*');
        if (orderBy) query = query.order(orderBy);
        const { data, error } = await query;
        if (error) throw error;
        setDbHealth(true);
        if (data && data.length > 0) {
            setCache(table, data);
            return data as T[];
        }
    } catch (err) {
        console.warn(`[WebData] Failed to fetch ${table}, using defaults`, err);
        setDbHealth(false);
    }
    return defaults;
}

export async function fetchById<T>(table: string, id: string, fallback: T | null = null): Promise<T | null> {
    try {
        const sb = getSupabase();
        const { data, error } = await sb.from(table).select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data as T;
    } catch {
        return fallback;
    }
}

export async function upsertRow<T extends Record<string, any>>(table: string, row: T): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.from(table).upsert(row);
        if (error) throw error;
        invalidateCache(table);
        return true;
    } catch (err) {
        console.error(`[WebData] Failed to upsert into ${table}`, err);
        return false;
    }
}

export async function upsertRows<T extends Record<string, any>>(table: string, rows: T[]): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.from(table).upsert(rows);
        if (error) throw error;
        invalidateCache(table);
        return true;
    } catch (err) {
        console.error(`[WebData] Failed to bulk upsert into ${table}`, err);
        return false;
    }
}

export async function deleteRow(table: string, id: string | number): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.from(table).delete().eq('id', id);
        if (error) throw error;
        invalidateCache(table);
        return true;
    } catch (err) {
        console.error(`[WebData] Failed to delete from ${table}`, err);
        return false;
    }
}

export async function deleteAllRows(table: string): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.from(table).delete().neq('id', '___never___');
        if (error) throw error;
        invalidateCache(table);
        return true;
    } catch (err) {
        console.error(`[WebData] Failed to clear ${table}`, err);
        return false;
    }
}

// ─── Key-Value Settings ──────────────────────────────────────────────

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
    const cacheKey = `web_settings:${key}`;
    const cached = getCached<T>(cacheKey);
    if (cached !== null) return cached;

    try {
        const sb = getSupabase();
        const { data, error } = await sb.from('web_settings').select('value').eq('key', key).maybeSingle();
        if (error) throw error;
        const val = data?.value as T;
        setCache(cacheKey, val);
        return val;
    } catch {
        return fallback;
    }
}

export async function getSettingsByPrefix<T>(prefix: string): Promise<{ key: string, value: T }[]> {
    try {
        const sb = getSupabase();
        const { data, error } = await sb.from('web_settings').select('key, value').like('key', `${prefix}%`);
        if (error) throw error;
        return (data || []).map(row => ({
            key: row.key,
            value: row.value as T
        }));
    } catch {
        return [];
    }
}

export async function setSetting<T>(key: string, value: T): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.from('web_settings').upsert({
            key,
            value,
            updated_at: new Date().toISOString()
        });
        if (error) throw error;
        invalidateCache(`web_settings:${key}`);
        return true;
    } catch (err) {
        console.error(`[WebData] Failed to set setting ${key}`, err);
        return false;
    }
}

export async function deleteSetting(key: string): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.from('web_settings').delete().eq('key', key);
        if (error) throw error;
        invalidateCache(`web_settings:${key}`);
        return true;
    } catch (err) {
        console.error(`[WebData] Failed to delete setting ${key}`, err);
        return false;
    }
}

// ─── Table Names ─────────────────────────────────────────────────────

export const TABLES = {
    SETTINGS: 'web_settings',
    GALLERY: 'web_gallery',
    HISTORY: 'web_history',
    PROTOCOL: 'web_protocol',
    LOCATIONS: 'web_locations',
    EVENTS: 'web_events',
    PRESS: 'web_press',
    CHAT_SESSIONS: 'web_chat_sessions',
    ADMIN_MESSAGES: 'web_admin_messages',
    DAILY_FEED: 'web_daily_feed',
    OWNER_PROFILE: 'web_owner_profile',
    SITEMAP: 'web_sitemap',
} as const;

