/**
 * routeConfig.ts — Central route registry.
 *
 * Each view has a canonical URL (shown in the address bar) and optional
 * aliases (alternative paths that also resolve to the same view).
 * Czech paths are canonical; English paths are aliases.
 */
import { AppView } from '../types';

export interface RouteEntry {
    view: AppView;
    canonical: string;       // Primary URL path shown in address bar
    aliases: string[];       // Other paths that resolve to this view
    titleKey?: string;       // i18n translation key for nav label
    hidden?: boolean;        // If true, not listed in sitemap/public nav
}

// ─── ROUTE REGISTRY ──────────────────────────────────────────────────

const ROUTES: RouteEntry[] = [
    {
        view: 'home',
        canonical: '/',
        aliases: [],
        titleKey: 'nav_home',
    },
    {
        view: 'locations',
        canonical: '/pobocky',
        aliases: ['/locations', '/branches'],
        titleKey: 'nav_locations',
    },
    {
        view: 'pricing',
        canonical: '/cenik',
        aliases: ['/pricing', '/price-list'],
        titleKey: 'nav_pricing',
    },
    {
        view: 'history',
        canonical: '/historie',
        aliases: ['/history', '/story'],
        titleKey: 'nav_story',
    },
    {
        view: 'services',
        canonical: '/sluzby',
        aliases: ['/services', '/b2b'],
        titleKey: 'nav_services',
    },
    {
        view: 'booking',
        canonical: '/rezervace',
        aliases: ['/booking'],
        titleKey: 'nav_booking',
    },
    {
        view: 'map',
        canonical: '/mapa',
        aliases: ['/map'],
        titleKey: 'nav_map',
    },
    {
        view: 'gallery',
        canonical: '/galerie',
        aliases: ['/gallery'],
        titleKey: 'nav_gallery',
    },
    {
        view: 'gift',
        canonical: '/poukaz-darky',
        aliases: ['/gift', '/voucher'],
        titleKey: 'nav_gift',
        hidden: true,
    },
    {
        view: 'poukaz',
        canonical: '/poukaz',
        aliases: ['/redeem'],
        titleKey: 'nav_redeem',
        hidden: true,
    },
    {
        view: 'arena',
        canonical: '/arena',
        aliases: [],
        titleKey: 'nav_home', // Reuses home title optionally
        hidden: true,
    },
    {
        view: 'mvp',
        canonical: '/mvp',
        aliases: [],
        titleKey: 'nav_home',
        hidden: true,
    },
    {
        view: 'cybersport',
        canonical: '/cybersport',
        aliases: [],
        titleKey: 'nav_home',
        hidden: true,
    },
];

// ─── LOOKUP MAPS (built once) ────────────────────────────────────────

/** path → AppView  (includes canonical + all aliases) */
const pathToViewMap: Record<string, AppView> = {};

/** AppView → canonical path */
const viewToCanonicalMap: Record<string, string> = {};

for (const route of ROUTES) {
    pathToViewMap[route.canonical] = route.view;
    viewToCanonicalMap[route.view] = route.canonical;
    for (const alias of route.aliases) {
        pathToViewMap[alias] = route.view;
    }
}

// ─── PUBLIC API ──────────────────────────────────────────────────────

/** Resolve a URL path to an AppView. Returns undefined if no match. */
export function getViewForPath(path: string): AppView | undefined {
    return pathToViewMap[path.toLowerCase()];
}

/** Get the canonical URL for a given view. Falls back to '/' */
export function getCanonicalPath(view: AppView): string {
    return viewToCanonicalMap[view] || '/';
}

/** Get all registered routes. */
export function getAllRoutes(): RouteEntry[] {
    return ROUTES;
}

/** Get a single route entry by view. */
export function getRouteByView(view: AppView): RouteEntry | undefined {
    return ROUTES.find(r => r.view === view);
}

/**
 * Navigate to a view: updates React state + browser URL.
 * Call this instead of raw setCurrentView.
 */
export function pushRoute(view: AppView): void {
    const canonical = getCanonicalPath(view);
    // Only pushState if the path actually changed (avoid duplicate history entries)
    if (window.location.pathname !== canonical) {
        window.history.pushState({ view }, '', canonical);
    }
}
