/**
 * Language flag utility — uses Flagcdn SVG images for cross-platform support.
 * Windows does NOT render emoji flags, so we use actual images.
 */

export const LANG_FLAG_CODES: Record<string, string> = {
    cs: 'cz',
    sk: 'sk',
    en: 'gb',
    de: 'de',
    pl: 'pl',
    ru: 'ru',
    ua: 'ua',
    vi: 'vn',
};

/**
 * Returns a URL to a flag SVG image for the given language code.
 * Uses flagcdn.com which is a free, fast CDN for country flag SVGs.
 */
export function getFlagUrl(lang: string, size: number = 24): string {
    const code = LANG_FLAG_CODES[lang] || lang;
    return `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${code}.png`;
}

/**
 * Returns a URL to a flag SVG for the given language code.
 */
export function getFlagSvgUrl(lang: string): string {
    const code = LANG_FLAG_CODES[lang] || lang;
    return `https://flagcdn.com/${code}.svg`;
}
