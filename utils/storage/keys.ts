/**
 * Storage keys — legacy constants kept for reference.
 * All data now lives in Supabase web_* tables via webDataService.
 * Only theme/lang/animations remain in localStorage (client-only prefs).
 */

// Client-only preferences (stay in localStorage)
export const CLIENT_PREFS = {
    THEME: 'theme',
    LANGUAGE: 'lang',
    ANIMATIONS: 'sz_animations_enabled',
} as const;

// Helper for client-side preferences only
export const getClientPref = (key: string, fallback: string): string => {
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
};

export const setClientPref = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch { /* quota exceeded or private mode */ }
};
