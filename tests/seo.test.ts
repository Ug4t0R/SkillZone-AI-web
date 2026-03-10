/**
 * seo.test.ts — SEO & Robot Visibility Tests
 *
 * Verifies that search engine crawlers see essential content
 * when JavaScript is not available (noscript fallback).
 * Also validates JSON-LD, meta tags, robots.txt, and sitemap.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// ─── Load index.html once ──────────────────────────────────────────
let html: string;
let noscriptContent: string;

beforeAll(() => {
    const indexPath = path.resolve(__dirname, '../index.html');
    html = fs.readFileSync(indexPath, 'utf8');

    // Extract content between <noscript> and </noscript>
    const noscriptMatch = html.match(/<noscript>([\s\S]*?)<\/noscript>/);
    noscriptContent = noscriptMatch?.[1] || '';
});

// ═══════════════════════════════════════════════════════════════════
// NOSCRIPT CONTENT TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Noscript SEO Content', () => {
    it('should contain noscript block', () => {
        expect(noscriptContent.length).toBeGreaterThan(100);
    });

    // ─── Brand & Hero ──────────────────────────────────────────
    it('should contain the brand name in h1', () => {
        expect(noscriptContent).toContain('<h1');
        expect(noscriptContent).toContain('SkillZone Gaming Club');
    });

    it('should contain key selling points', () => {
        expect(noscriptContent).toContain('RTX 4070 Ti Super');
        expect(noscriptContent).toContain('240Hz');
        expect(noscriptContent).toContain('10Gbps');
    });

    it('should contain player count stat', () => {
        expect(noscriptContent).toContain('18 000');
    });

    it('should contain years on market', () => {
        expect(noscriptContent).toContain('21 let');
    });

    // ─── Locations ─────────────────────────────────────────────
    describe('Locations', () => {
        it('should contain all 3 branch names', () => {
            expect(noscriptContent).toContain('Žižkov');
            expect(noscriptContent).toContain('Háje');
            expect(noscriptContent).toContain('Stodůlky');
        });

        it('should contain all 3 branch addresses', () => {
            expect(noscriptContent).toContain('Orebitská 630/4');
            expect(noscriptContent).toContain('Arkalycká 877/4');
            expect(noscriptContent).toContain('Prusíkova 2577/16');
        });

        it('should contain all 3 phone numbers', () => {
            expect(noscriptContent).toContain('777 766 113');
            expect(noscriptContent).toContain('777 766 114');
            expect(noscriptContent).toContain('777 766 115');
        });

        it('should mention NONSTOP 24/7 for Žižkov', () => {
            expect(noscriptContent).toContain('NONSTOP 24/7');
        });

        it('should mention Bootcamp', () => {
            expect(noscriptContent).toContain('Bootcamp');
        });

        it('should contain links to branch detail pages', () => {
            expect(noscriptContent).toContain('href="/provozovny/zizkov"');
            expect(noscriptContent).toContain('href="/provozovny/haje"');
            expect(noscriptContent).toContain('href="/provozovny/stodulky"');
        });
    });

    // ─── Navigation ────────────────────────────────────────────
    describe('Navigation', () => {
        it('should contain <nav> element', () => {
            expect(noscriptContent).toContain('<nav');
        });

        it('should link to all major public routes', () => {
            const publicRoutes = [
                '/provozovny',
                '/cenik',
                '/historie',
                '/sluzby',
                '/galerie',
                '/mapa',
                '/kontakt',
                '/rezervace',
            ];
            for (const route of publicRoutes) {
                expect(noscriptContent).toContain(`href="${route}"`);
            }
        });
    });

    // ─── Pricing ───────────────────────────────────────────────
    it('should contain pricing info', () => {
        expect(noscriptContent).toContain('29 Kč');
        expect(noscriptContent).toContain('nepropadá');
    });

    // ─── FAQ ───────────────────────────────────────────────────
    describe('FAQ', () => {
        it('should contain FAQ questions', () => {
            expect(noscriptContent).toContain('Kolik stojí hodina hraní');
            expect(noscriptContent).toContain('otevřený nonstop');
            expect(noscriptContent).toContain('hardware mají PC');
            expect(noscriptContent).toContain('pronajmout soukromý prostor');
        });

        it('should use <details> elements for FAQ', () => {
            expect(noscriptContent).toContain('<details');
            expect(noscriptContent).toContain('<summary');
        });
    });

    // ─── Semantic HTML ─────────────────────────────────────────
    describe('Semantic HTML', () => {
        it('should use semantic elements', () => {
            expect(noscriptContent).toContain('<main');
            expect(noscriptContent).toContain('<section');
            expect(noscriptContent).toContain('<article');
            expect(noscriptContent).toContain('<footer');
            expect(noscriptContent).toContain('<header');
        });

        it('should have proper heading hierarchy (h1 > h2 > h3)', () => {
            const h1Count = (noscriptContent.match(/<h1/g) || []).length;
            const h2Count = (noscriptContent.match(/<h2/g) || []).length;
            const h3Count = (noscriptContent.match(/<h3/g) || []).length;

            expect(h1Count).toBe(1); // Only one h1
            expect(h2Count).toBeGreaterThan(3); // Multiple sections
            expect(h3Count).toBeGreaterThan(0); // Sub-sections (branches)
        });
    });

    // ─── Services ──────────────────────────────────────────────
    it('should contain services info', () => {
        expect(noscriptContent).toContain('Teambuilding');
        expect(noscriptContent).toContain('LAN party');
        expect(noscriptContent).toContain('Stream produkce');
    });

    // ─── History ───────────────────────────────────────────────
    it('should contain founding story', () => {
        expect(noscriptContent).toContain('2005');
        expect(noscriptContent).toContain('Ug4t0R');
        expect(noscriptContent).toContain('PLAYER');
    });

    // ─── Footer ────────────────────────────────────────────────
    it('should contain social links', () => {
        expect(noscriptContent).toContain('instagram.com/skillzone');
        expect(noscriptContent).toContain('facebook.com/SkillZone');
    });
});

// ═══════════════════════════════════════════════════════════════════
// HEAD / META TAG TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Meta Tags', () => {
    it('should have a <title> tag', () => {
        expect(html).toMatch(/<title>.*SkillZone.*<\/title>/);
    });

    it('should have meta description', () => {
        expect(html).toMatch(/name="description"/);
    });

    it('should have OG title', () => {
        expect(html).toMatch(/property="og:title"/);
    });

    it('should have OG description', () => {
        expect(html).toMatch(/property="og:description"/);
    });

    it('should have OG image', () => {
        expect(html).toMatch(/property="og:image"/);
    });

    it('should have Twitter card', () => {
        expect(html).toMatch(/name="twitter:card"/);
    });

    it('should have canonical URL', () => {
        expect(html).toMatch(/rel="canonical"/);
    });

    it('should have robots meta', () => {
        expect(html).toContain('name="robots"');
        expect(html).toContain('index, follow');
    });

    it('should have hreflang tags for all languages', () => {
        expect(html).toContain('hreflang="cs"');
        expect(html).toContain('hreflang="en"');
        expect(html).toContain('hreflang="ru"');
        expect(html).toContain('hreflang="uk"');
        expect(html).toContain('hreflang="x-default"');
    });
});

// ═══════════════════════════════════════════════════════════════════
// JSON-LD STRUCTURED DATA TESTS
// ═══════════════════════════════════════════════════════════════════

describe('JSON-LD Structured Data', () => {
    let jsonLdBlocks: string[];

    beforeAll(() => {
        const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
        jsonLdBlocks = [];
        let match;
        while ((match = regex.exec(html)) !== null) {
            jsonLdBlocks.push(match[1]);
        }
    });

    it('should have multiple JSON-LD blocks', () => {
        expect(jsonLdBlocks.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid JSON in each block', () => {
        for (const block of jsonLdBlocks) {
            expect(() => JSON.parse(block)).not.toThrow();
        }
    });

    it('should have Organization schema', () => {
        const org = jsonLdBlocks.find(b => b.includes('"Organization"'));
        expect(org).toBeDefined();
        const parsed = JSON.parse(org!);
        expect(parsed.name).toContain('SkillZone');
        expect(parsed.foundingDate).toBe('2005');
    });

    it('should have EntertainmentBusiness for each location', () => {
        const businesses = jsonLdBlocks.filter(b => b.includes('"EntertainmentBusiness"'));
        expect(businesses.length).toBe(3); // Žižkov, Háje, Stodůlky
    });

    it('should have FAQPage schema', () => {
        const faq = jsonLdBlocks.find(b => b.includes('"FAQPage"'));
        expect(faq).toBeDefined();
        const parsed = JSON.parse(faq!);
        expect(parsed.mainEntity.length).toBeGreaterThanOrEqual(3);
    });

    it('should have BreadcrumbList schema', () => {
        const breadcrumb = jsonLdBlocks.find(b => b.includes('"BreadcrumbList"'));
        expect(breadcrumb).toBeDefined();
    });

    it('should have WebSite schema', () => {
        const website = jsonLdBlocks.find(b => b.includes('"WebSite"'));
        expect(website).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════
// ROBOTS.TXT TESTS
// ═══════════════════════════════════════════════════════════════════

describe('robots.txt', () => {
    let robotsTxt: string;

    beforeAll(() => {
        const robotsPath = path.resolve(__dirname, '../public/robots.txt');
        robotsTxt = fs.readFileSync(robotsPath, 'utf8');
    });

    it('should exist and not be empty', () => {
        expect(robotsTxt.length).toBeGreaterThan(10);
    });

    it('should allow root', () => {
        expect(robotsTxt).toContain('Allow: /');
    });

    it('should reference sitemap', () => {
        expect(robotsTxt).toContain('Sitemap: https://skillzone.cz/sitemap.xml');
    });

    it('should disallow secret pages', () => {
        expect(robotsTxt).toContain('Disallow: /illuminati');
        expect(robotsTxt).toContain('Disallow: /prisnetajne');
    });

    it('should disallow internal paths', () => {
        expect(robotsTxt).toContain('Disallow: /api/');
    });

    it('should NOT disallow public routes', () => {
        const publicRoutes = ['/provozovny', '/cenik', '/historie', '/sluzby', '/galerie', '/kontakt'];
        for (const route of publicRoutes) {
            expect(robotsTxt).not.toContain(`Disallow: ${route}\n`);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// SITEMAP TESTS
// ═══════════════════════════════════════════════════════════════════

describe('sitemap.xml', () => {
    let sitemap: string;
    let sitemapExists: boolean;

    beforeAll(() => {
        const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
        sitemapExists = fs.existsSync(sitemapPath);
        if (sitemapExists) {
            sitemap = fs.readFileSync(sitemapPath, 'utf8');
        }
    });

    it('should exist', () => {
        expect(sitemapExists).toBe(true);
    });

    it('should contain main routes', () => {
        if (!sitemapExists) return;
        expect(sitemap).toContain('https://skillzone.cz/');
        expect(sitemap).toContain('https://skillzone.cz/pobocky');
        expect(sitemap).toContain('https://skillzone.cz/cenik');
    });

    it('should be valid XML', () => {
        if (!sitemapExists) return;
        expect(sitemap).toContain('<?xml');
        expect(sitemap).toContain('<urlset');
        expect(sitemap).toContain('</urlset>');
    });
});
