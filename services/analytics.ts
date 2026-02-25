/**
 * SkillZone Analytics — lightweight custom analytics tracker.
 * Tracks: page views, clicks, sections viewed, language, live visitors, sessions.
 * Data is stored in Supabase `web_analytics` table.
 */
import { getSupabase } from './supabaseClient';
import { trackEvent } from './ga4';

// ─── Session ─────────────────────────────────────────────────────────
const SESSION_KEY = 'sz_session_id';
const SESSION_START_KEY = 'sz_session_start';

function getSessionId(): string {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, id);
        sessionStorage.setItem(SESSION_START_KEY, new Date().toISOString());
    }
    return id;
}

function getSessionDuration(): number {
    const start = sessionStorage.getItem(SESSION_START_KEY);
    if (!start) return 0;
    return Math.floor((Date.now() - new Date(start).getTime()) / 1000);
}

// ─── Device & Browser Info ───────────────────────────────────────────
function getDeviceInfo() {
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua);
    return {
        device: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
        browser: /Chrome/i.test(ua) ? 'Chrome' :
            /Firefox/i.test(ua) ? 'Firefox' :
                /Safari/i.test(ua) ? 'Safari' :
                    /Edge/i.test(ua) ? 'Edge' : 'Other',
        language: navigator.language || 'unknown',
        screen: `${screen.width}x${screen.height}`,
        referrer: document.referrer || 'direct',
    };
}

// ─── Event Queue ─────────────────────────────────────────────────────
interface AnalyticsEvent {
    session_id: string;
    event_type: string;
    event_data: Record<string, any>;
    page_path: string;
    timestamp: string;
    device: string;
    browser: string;
    language: string;
    screen_size: string;
    referrer: string;
}

let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueEvent(type: string, data: Record<string, any> = {}) {
    const info = getDeviceInfo();
    eventQueue.push({
        session_id: getSessionId(),
        event_type: type,
        event_data: data,
        page_path: window.location.pathname + window.location.hash,
        timestamp: new Date().toISOString(),
        device: info.device,
        browser: info.browser,
        language: info.language,
        screen_size: info.screen,
        referrer: info.referrer,
    });

    // Also forward to GA4
    trackEvent(type, data);

    // Flush every 10 seconds or when queue hits 10
    if (eventQueue.length >= 10) {
        flushEvents();
    } else if (!flushTimer) {
        flushTimer = setTimeout(flushEvents, 10000);
    }
}

async function flushEvents() {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    if (eventQueue.length === 0) return;

    const batch = [...eventQueue];
    eventQueue = [];

    try {
        const sb = getSupabase();
        await sb.from('web_analytics').insert(batch);
    } catch (err) {
        // Silently fail — analytics should never break the app
        console.debug('[Analytics] Flush failed:', err);
    }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Track a page view
 */
export function trackView(viewName: string) {
    queueEvent('page_view', { view: viewName });
}

/**
 * Track a section becoming visible (scroll into view)
 */
export function trackSectionView(sectionId: string) {
    queueEvent('section_view', { section: sectionId });
}

/**
 * Track a click on a specific element
 */
export function trackClick(elementId: string, metadata?: Record<string, any>) {
    queueEvent('click', { element: elementId, ...metadata });
}

/**
 * Track when user opens chat
 */
export function trackChatOpen() {
    queueEvent('chat_open', {});
}

/**
 * Track booking/voucher interaction
 */
export function trackConversion(type: string, details?: Record<string, any>) {
    queueEvent('conversion', { type, ...details });
}

/**
 * Track language change
 */
export function trackLanguageChange(from: string, to: string) {
    queueEvent('language_change', { from, to });
}

/**
 * Track theme change
 */
export function trackThemeChange(theme: string) {
    queueEvent('theme_change', { theme });
}

/**
 * Heartbeat — updates "last seen" for live visitor counting
 */
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat() {
    // Immediate first heartbeat
    sendHeartbeat();
    // Then every 30 seconds
    heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
        queueEvent('session_end', { duration: getSessionDuration() });
        flushEvents();
        sendHeartbeat(true);
    });
}

async function sendHeartbeat(isLeaving = false) {
    try {
        const sb = getSupabase();
        const info = getDeviceInfo();
        await sb.from('web_visitors').upsert({
            session_id: getSessionId(),
            last_seen: new Date().toISOString(),
            page_path: window.location.pathname + window.location.hash,
            device: info.device,
            language: info.language,
            is_active: !isLeaving,
        });
    } catch {
        // Silent
    }
}

export function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

/**
 * Initialize analytics — call once on app mount
 */
export function initAnalytics() {
    startHeartbeat();
    trackView('home');

    // Track Section Visibility via IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.id) {
                trackSectionView(entry.target.id);
            }
        });
    }, { threshold: 0.3 });

    // Observe all sections after DOM is ready
    requestAnimationFrame(() => {
        document.querySelectorAll('section[id]').forEach(el => observer.observe(el));
    });
}
