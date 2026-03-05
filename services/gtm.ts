/**
 * Google Tag Manager (GTM) loader.
 * Reads the GTM Container ID from settings.
 * Call initGTM() once on app startup.
 */

let gtmInitialized = false;

export function initGTM(containerId: string) {
    if (gtmInitialized || !containerId || containerId === 'GTM-XXXXXXXX') return;

    // SECURITY: Validate containerId format to prevent XSS via settings injection.
    // GTM IDs are always GTM-[A-Z0-9]+
    if (!/^GTM-[A-Z0-9]{1,10}$/.test(containerId)) {
        console.warn(`[GTM] Invalid container ID format: "${containerId}" — skipping`);
        return;
    }

    // GTM head script
    const script = document.createElement('script');
    script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`;
    document.head.insertBefore(script, document.head.firstChild);

    // GTM noscript iframe (body fallback)
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    gtmInitialized = true;
    console.log(`[GTM] Initialized with ${containerId}`);
}
