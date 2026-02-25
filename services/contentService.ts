/**
 * Content Override Service — loads editable text from Supabase web_content table.
 * Falls back to hardcoded translations.ts when no override exists.
 */
import { getSupabase } from './supabaseClient';

// In-memory cache of overrides per language
const overrides: Record<string, Record<string, string>> = {};
let loaded = false;
let loading: Promise<void> | null = null;

/**
 * Load all content overrides from Supabase (all languages at once).
 * Call once on app startup.
 */
export async function loadContentOverrides(): Promise<void> {
    if (loaded) return;
    if (loading) return loading;

    loading = (async () => {
        try {
            const sb = getSupabase();
            const { data, error } = await sb
                .from('web_content')
                .select('key, lang, value');

            if (error) {
                console.debug('[Content] Load error:', error.message);
                return;
            }

            if (data) {
                for (const row of data) {
                    if (!overrides[row.lang]) overrides[row.lang] = {};
                    overrides[row.lang][row.key] = row.value;
                }
                console.debug(`[Content] Loaded ${data.length} overrides`);
            }
        } catch (err) {
            console.debug('[Content] Failed to load:', err);
        } finally {
            loaded = true;
            loading = null;
        }
    })();

    return loading;
}

/**
 * Get a content override for a given key and language.
 * Returns undefined if no override exists (caller should use default).
 */
export function getContentOverride(key: string, lang: string): string | undefined {
    return overrides[lang]?.[key];
}

/**
 * Check if overrides have been loaded.
 */
export function isContentLoaded(): boolean {
    return loaded;
}

/**
 * Save a content override to Supabase and update local cache.
 */
export async function saveContentOverride(key: string, lang: string, value: string): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb
            .from('web_content')
            .upsert({ key, lang, value, updated_at: new Date().toISOString() });

        if (error) {
            console.error('[Content] Save error:', error.message);
            return false;
        }

        // Update local cache
        if (!overrides[lang]) overrides[lang] = {};
        overrides[lang][key] = value;
        return true;
    } catch (err) {
        console.error('[Content] Save failed:', err);
        return false;
    }
}

/**
 * Delete a content override (reverts to default translation).
 */
export async function deleteContentOverride(key: string, lang: string): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb
            .from('web_content')
            .delete()
            .eq('key', key)
            .eq('lang', lang);

        if (error) return false;

        // Remove from cache
        if (overrides[lang]) {
            delete overrides[lang][key];
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Get all overrides for a language.
 */
export function getAllOverrides(lang: string): Record<string, string> {
    return { ...(overrides[lang] || {}) };
}

/**
 * Force reload overrides from Supabase.
 */
export async function reloadContentOverrides(): Promise<void> {
    loaded = false;
    // Clear cache
    for (const lang in overrides) {
        delete overrides[lang];
    }
    return loadContentOverrides();
}
