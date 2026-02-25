/**
 * Animations toggle — client-only preference, stays in localStorage.
 */
const ANIM_KEY = 'skillzone_animations_enabled';

export const getAnimationsEnabled = (): boolean => {
    try {
        const val = localStorage.getItem(ANIM_KEY);
        return val === null ? true : val === 'true';
    } catch { return true; }
};

export const setAnimationsEnabled = (enabled: boolean): void => {
    try { localStorage.setItem(ANIM_KEY, String(enabled)); } catch { }
};
