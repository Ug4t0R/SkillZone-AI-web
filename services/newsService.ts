/**
 * newsService — Fetches gaming news from RSS feeds.
 * 
 * Sources: IGN, PC Gamer, Rock Paper Shotgun, Eurogamer.cz, Kotaku
 * Uses free CORS proxy (api.allorigins.win) — no API key needed.
 * 30-minute in-memory cache.
 */

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface NewsItem {
    title: string;
    source: string;
    url: string;
    date: string;       // ISO date string
    category?: string;  // optional: review, release, esports, etc.
}

// ═══════════════════════════════════════════════════════
// RSS SOURCES
// ═══════════════════════════════════════════════════════

const RSS_FEEDS: { name: string; url: string }[] = [
    { name: 'IGN', url: 'https://feeds.feedburner.com/ign/games-all' },
    { name: 'PC Gamer', url: 'https://www.pcgamer.com/rss/' },
    { name: 'Rock Paper Shotgun', url: 'https://www.rockpapershotgun.com/feed' },
    { name: 'Eurogamer.cz', url: 'https://www.eurogamer.cz/feed' },
    { name: 'Kotaku', url: 'https://kotaku.com/rss' },
];

// Multiple CORS proxies for fallback
const CORS_PROXIES = [
    {
        name: 'corsproxy.io',
        buildUrl: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        extractContent: (response: Response) => response.text(),
    },
    {
        name: 'allorigins',
        buildUrl: (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        extractContent: async (response: Response) => {
            const data = await response.json();
            return data.contents as string;
        },
    },
];

// ═══════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════

let cachedNews: NewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Track which proxy works
let workingProxyIndex = 0;

// ═══════════════════════════════════════════════════════
// XML PARSER
// ═══════════════════════════════════════════════════════

/**
 * Extracts items from RSS XML string.
 * Works with both RSS 2.0 (<item>) and Atom (<entry>) feeds.
 */
const parseRSSItems = (xml: string, sourceName: string): NewsItem[] => {
    const items: NewsItem[] = [];

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        // Check for parse errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) return [];

        // RSS 2.0 format
        const rssItems = doc.querySelectorAll('item');
        if (rssItems.length > 0) {
            rssItems.forEach((item) => {
                const title = item.querySelector('title')?.textContent?.trim();
                const link = item.querySelector('link')?.textContent?.trim();
                const pubDate = item.querySelector('pubDate')?.textContent?.trim();
                const category = item.querySelector('category')?.textContent?.trim();

                if (title) {
                    items.push({
                        title: cleanTitle(title),
                        source: sourceName,
                        url: link || '',
                        date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                        category: category?.toLowerCase(),
                    });
                }
            });
            return items.slice(0, 10); // Max 10 per source
        }

        // Atom format
        const atomEntries = doc.querySelectorAll('entry');
        atomEntries.forEach((entry) => {
            const title = entry.querySelector('title')?.textContent?.trim();
            const link = entry.querySelector('link')?.getAttribute('href');
            const published = entry.querySelector('published')?.textContent?.trim()
                || entry.querySelector('updated')?.textContent?.trim();
            const category = entry.querySelector('category')?.getAttribute('term');

            if (title) {
                items.push({
                    title: cleanTitle(title),
                    source: sourceName,
                    url: link || '',
                    date: published ? new Date(published).toISOString() : new Date().toISOString(),
                    category: category?.toLowerCase(),
                });
            }
        });

        return items.slice(0, 10);
    } catch {
        return [];
    }
};

/**
 * Clean HTML entities and CDATA from titles.
 */
const cleanTitle = (title: string): string => {
    return title
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
};

// ═══════════════════════════════════════════════════════
// FETCH
// ═══════════════════════════════════════════════════════

/**
 * Fetch a single RSS feed, trying multiple CORS proxies.
 */
const fetchSingleFeed = async (feed: { name: string; url: string }): Promise<NewsItem[]> => {
    // Try the working proxy first, then fallbacks
    const proxyOrder = [
        workingProxyIndex,
        ...Array.from({ length: CORS_PROXIES.length }, (_, i) => i).filter(i => i !== workingProxyIndex)
    ];

    for (const idx of proxyOrder) {
        const proxy = CORS_PROXIES[idx];
        try {
            const proxyUrl = proxy.buildUrl(feed.url);
            const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
            if (!response.ok) continue;

            const xml = await proxy.extractContent(response);
            if (!xml || typeof xml !== 'string') continue;

            const items = parseRSSItems(xml, feed.name);
            if (items.length > 0) {
                workingProxyIndex = idx; // Remember which proxy worked
                return items;
            }
        } catch {
            continue;
        }
    }

    console.warn(`[newsService] All proxies failed for ${feed.name}`);
    return [];
};

/**
 * Fetch gaming news from all RSS sources.
 * Returns up to ~50 headlines, sorted by date (newest first).
 * Results are cached for 30 minutes.
 */
export const fetchGamingNews = async (forceRefresh = false): Promise<NewsItem[]> => {
    // Return cache if fresh
    if (!forceRefresh && cachedNews && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return cachedNews;
    }

    console.log('[newsService] Fetching gaming news from RSS sources...');

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
        RSS_FEEDS.map(feed => fetchSingleFeed(feed))
    );

    const allNews: NewsItem[] = [];
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            allNews.push(...result.value);
        }
    });

    // Sort by date (newest first), deduplicate by title similarity
    const sorted = allNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const unique = deduplicateNews(sorted);

    // Update cache
    cachedNews = unique;
    cacheTimestamp = Date.now();

    console.log(`[newsService] Got ${unique.length} headlines from ${RSS_FEEDS.length} sources`);
    return unique;
};

/**
 * Remove near-duplicate headlines (same story from multiple sources).
 */
const deduplicateNews = (news: NewsItem[]): NewsItem[] => {
    const seen = new Set<string>();
    return news.filter(item => {
        // Normalize title for comparison: lowercase, remove punctuation, first 40 chars
        const key = item.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

/**
 * Get a quick summary of available sources and their status.
 */
export const getNewsSourceStatus = async (): Promise<{ name: string; count: number; error: boolean }[]> => {
    const results = await Promise.allSettled(
        RSS_FEEDS.map(async feed => {
            const items = await fetchSingleFeed(feed);
            return { name: feed.name, count: items.length, error: false };
        })
    );

    return results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : { name: RSS_FEEDS[i].name, count: 0, error: true }
    );
};
