/**
 * generate-robots.js — Build-time robots.txt generator.
 *
 * Reads route definitions and generates robots.txt that:
 *  - Allows all public routes
 *  - Disallows hidden/secret routes (illuminati, prisnetajne, etc.)
 *  - References sitemap.xml
 *
 * Run: node scripts/generate-robots.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Route configuration (mirrors routeConfig.ts) ──────────────────
// We duplicate the essential data here since we can't easily import TS.

const ROUTES = [
    { canonical: '/', hidden: false },
    { canonical: '/provozovny', hidden: false },
    { canonical: '/provozovny/zizkov', hidden: true },
    { canonical: '/provozovny/haje', hidden: true },
    { canonical: '/provozovny/stodulky', hidden: true },
    { canonical: '/provozovny/bootcamp', hidden: true },
    { canonical: '/cenik', hidden: false },
    { canonical: '/historie', hidden: false },
    { canonical: '/sluzby', hidden: false },
    { canonical: '/rezervace', hidden: false },
    { canonical: '/pronajem', hidden: true },
    { canonical: '/mapa', hidden: false },
    { canonical: '/galerie', hidden: false },
    { canonical: '/poukaz-darky', hidden: true },
    { canonical: '/poukaz', hidden: true },
    { canonical: '/arena', hidden: true },
    { canonical: '/mvp', hidden: true },
    { canonical: '/cybersport', hidden: true },
    { canonical: '/prisnetajne', hidden: true },
    { canonical: '/kontakt', hidden: false },
    { canonical: '/illuminati', hidden: true },
];

// Additional paths that should always be disallowed
const ALWAYS_DISALLOW = [
    '/api/',
    '/test',
    '/debug',
    '/admin',
    '/_',
];

function generateRobots() {
    console.log('🤖 Generating robots.txt...');

    const disallowed = [
        ...ROUTES.filter(r => r.hidden).map(r => r.canonical),
        ...ALWAYS_DISALLOW,
    ];

    // Also disallow common aliases for hidden routes
    const hiddenAliases = [
        '/secret-pages',
        '/hidden',
        '/triangle',
        '/all-seeing-eye',
        '/oko',
        '/redeem',
        '/gift',
        '/voucher',
    ];

    const allDisallowed = [...new Set([...disallowed, ...hiddenAliases])];

    let txt = '';
    txt += '# SkillZone Gaming Club — robots.txt\n';
    txt += '# Generated automatically from route configuration.\n';
    txt += `# Last generated: ${new Date().toISOString()}\n`;
    txt += '#\n';
    txt += '# https://skillzone.cz\n\n';

    txt += 'User-agent: *\n';
    txt += 'Allow: /\n\n';

    txt += '# Hidden & internal routes\n';
    for (const path of allDisallowed.sort()) {
        txt += `Disallow: ${path}\n`;
    }

    txt += '\n# Sitemap\n';
    txt += 'Sitemap: https://skillzone.cz/sitemap.xml\n';

    const publicPath = path.resolve(__dirname, '../public');
    if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
    }

    fs.writeFileSync(path.join(publicPath, 'robots.txt'), txt, 'utf8');
    console.log(`✅ robots.txt generated (${allDisallowed.length} disallowed paths)`);
}

generateRobots();
