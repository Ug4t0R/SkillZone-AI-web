import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes directly assuming standard format.
// We can't easily import TS files into this JS build script without ts-node,
// so we'll define the core routes here to ensure they match what's in routeConfig.ts.

const BASE_URL = 'https://skillzone.cz';

const ROUTES = [
    { canonical: '/', priority: 1.0, changefreq: 'daily' },
    { canonical: '/pobocky', priority: 0.9, changefreq: 'weekly' },
    { canonical: '/cenik', priority: 0.8, changefreq: 'monthly' },
    { canonical: '/historie', priority: 0.6, changefreq: 'monthly' },
    { canonical: '/sluzby', priority: 0.7, changefreq: 'monthly' },
    { canonical: '/rezervace', priority: 0.9, changefreq: 'weekly' },
    { canonical: '/mapa', priority: 0.7, changefreq: 'monthly' },
    { canonical: '/galerie', priority: 0.8, changefreq: 'weekly' },
    // Stealth SEO Landing Pages
    { canonical: '/arena', priority: 0.8, changefreq: 'monthly' },
    { canonical: '/mvp', priority: 0.8, changefreq: 'monthly' },
    { canonical: '/cybersport', priority: 0.8, changefreq: 'monthly' }
];

// Locations specific anchors (we add them to sitemap for deeper indexing if possible,
// although standard XML sitemaps technically ignore fragments, it's good practice for some crawlers)
const LOCATION_ANCHORS = [
    '/pobocky#zizkov',
    '/pobocky#haje',
    '/pobocky#stodulky'
];

function generateSitemap() {
    console.log('🗺️  Generating sitemap.xml...');

    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add main routes
    for (const route of ROUTES) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}${route.canonical}</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
        xml += `    <priority>${route.priority.toFixed(1)}</priority>\n`;
        xml += `  </url>\n`;
    }

    // Add location anchors (optional, some strict validators might complain about # tags,
    // but Google handles them as entry points to the page).
    // To be safe and compliant with standard sitemap protocol, we'll keep it strictly to paths.
    // If we wanted to include them:
    // for (const anchor of LOCATION_ANCHORS) {
    //     xml += `  <url>\n`;
    //     xml += `    <loc>${BASE_URL}${anchor}</loc>\n`;
    //     xml += `    <lastmod>${now}</lastmod>\n`;
    //     xml += `    <changefreq>weekly</changefreq>\n`;
    //     xml += `    <priority>0.8</priority>\n`;
    //     xml += `  </url>\n`;
    // }

    xml += `</urlset>`;

    const publicPath = path.resolve(__dirname, '../public');

    // Ensure public dir exists
    if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
    }

    fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), xml, 'utf8');

    console.log('✅ sitemap.xml successfully generated at /public/sitemap.xml');
}

generateSitemap();
