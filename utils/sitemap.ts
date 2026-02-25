/**
 * Sitemap utility — Supabase-backed via web_sitemap table.
 */
import { AppView } from '../types';
import { fetchAll, upsertRows, TABLES } from '../services/webDataService';

export interface SitemapEntry {
    path: string;
    view: AppView;
    label: string;
    changefreq: 'daily' | 'weekly' | 'monthly';
    priority: number;
    visible: boolean;
}

export const DEFAULT_SITEMAP: SitemapEntry[] = [
    { path: '/', view: 'home', label: 'Homepage', changefreq: 'weekly', priority: 1.0, visible: true },
    { path: '/pobocky', view: 'locations', label: 'Locations', changefreq: 'weekly', priority: 0.9, visible: true },
    { path: '/cenik', view: 'pricing', label: 'Pricing', changefreq: 'weekly', priority: 0.9, visible: true },
    { path: '/historie', view: 'history', label: 'History', changefreq: 'monthly', priority: 0.6, visible: true },
    { path: '/sluzby', view: 'services', label: 'Services', changefreq: 'monthly', priority: 0.7, visible: true },
    { path: '/rezervace', view: 'booking', label: 'Booking', changefreq: 'monthly', priority: 0.8, visible: true },
    { path: '/gift', view: 'gift', label: 'Gift Vouchers', changefreq: 'monthly', priority: 0.7, visible: true },
    { path: '/poukaz', view: 'poukaz', label: 'Redeem Voucher', changefreq: 'monthly', priority: 0.5, visible: false },
    { path: '/galerie', view: 'gallery', label: 'Gallery', changefreq: 'weekly', priority: 0.7, visible: true },
];

export async function getSitemapConfig(): Promise<SitemapEntry[]> {
    return fetchAll<SitemapEntry>(TABLES.SITEMAP, DEFAULT_SITEMAP, 'priority');
}

export async function saveSitemapConfig(entries: SitemapEntry[]): Promise<void> {
    await upsertRows(TABLES.SITEMAP, entries.map(e => ({ ...e, id: e.path })));
}

export function generateSitemapXML(entries: SitemapEntry[], baseUrl: string = 'https://skillzone.cz'): string {
    const visibleEntries = entries.filter(e => e.visible);
    const urls = visibleEntries.map(entry => `  <url>
    <loc>${baseUrl}${entry.path}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
