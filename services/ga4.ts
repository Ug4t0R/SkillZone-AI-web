/**
 * Google Analytics 4 (gtag.js) loader.
 * Reads the GA4 Measurement ID from settings or uses a placeholder.
 * Call initGA4() once on app startup.
 */

let gaInitialized = false;

export function initGA4(measurementId?: string) {
    if (gaInitialized || !measurementId || measurementId === 'G-XXXXXXXXXX') return;

    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId, {
        send_page_view: true,
        cookie_flags: 'SameSite=None;Secure',
    });

    gaInitialized = true;
    console.log(`[GA4] Initialized with ${measurementId}`);
}

/**
 * Track a custom event via GA4
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
    const gtag = (window as any).gtag;
    if (!gtag) return;
    gtag('event', eventName, params);
}

/**
 * Track a page view (for SPA navigation)
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
    const gtag = (window as any).gtag;
    if (!gtag) return;
    gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle || document.title,
    });
}
