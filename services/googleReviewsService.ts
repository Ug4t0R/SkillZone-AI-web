/**
 * Google Reviews Service — fetches real reviews from Google Places API (New)
 * and uses Gemini AI to curate them with transparency commentary.
 */
import { GoogleGenAI, Type } from '@google/genai';

// ─── Place IDs for each SkillZone location ──────────────────────────
// These are Google Place IDs — find them at:
// https://developers.google.com/maps/documentation/places/web-service/place-id
export const PLACE_IDS: Record<string, { placeId: string; label: string; shortLabel: string }> = {
    žižkov: {
        placeId: 'ChIJBdvJO5iUC0cR55kYuPWE1WM',
        label: 'SkillZone Gaming Club Žižkov',
        shortLabel: 'Žižkov',
    },
    háje: {
        placeId: 'ChIJW4S6ZQCTC0cRNK3fP2NHOFs',
        label: 'SkillZone Gaming Club Háje',
        shortLabel: 'Háje',
    },
    stodůlky: {
        placeId: 'ChIJj8MOMWiXC0cR8-yI5NsFKsM',
        label: 'SkillZone Gaming Club Stodůlky',
        shortLabel: 'Stodůlky',
    },
    bootcamp: {
        placeId: 'ChIJF09R9OeTC0cRrCDq1DpjCmw',
        label: 'SkillZone Bootcamp Room Háje',
        shortLabel: 'Bootcamp',
    },
    holešovice: {
        placeId: 'ChIJzwdJGErrC0cRBPh47vDwRHw',
        label: 'SkillZone PRIVATE Gaming Club Holešovice',
        shortLabel: 'Holešovice',
    },
    // Arena (Starochodovská, Chodov) — permanently closed + unverified,
    // completely removed from Google Maps. No Place ID exists.
};

// ─── Types ──────────────────────────────────────────────────────────

export interface GoogleReview {
    id: string;
    google_review_id: string;
    author: string;
    text: string;
    rating: number;
    location: string;
    date: string;
    photo_url: string | null;
    ai_comment: string | null;
    ai_tag: 'highlight' | 'honest' | 'genuine_complaint' | 'review_bomb' | 'regular' | null;
    is_featured: boolean;
    google_url: string;
    owner_response: string | null;
    owner_response_date: string | null;
}

export interface PlaceRating {
    rating: number;
    totalReviews: number;
}

// ─── Google Maps URLs ───────────────────────────────────────────────

const GOOGLE_MAPS_URLS: Record<string, string> = {
    žižkov: 'https://www.google.com/maps/place/SkillZone+Gaming+Club+%C5%BDi%C5%BEkov/@50.0865271,14.4458031,17z/data=!3m1!4b1!4m6!3m5!1s0x470b94983bc9db05:0x63d584f5b81899e7!8m2!3d50.0865271!4d14.4458031!16s%2Fg%2F1hc2mc6kv',
    háje: 'https://www.google.com/maps/place/SkillZone+Gaming+Club+H%C3%A1je/@50.0315001,14.5284873,17z/data=!3m1!4b1!4m6!3m5!1s0x470b930065ba845b:0x5b3847633fdfad34!8m2!3d50.0315001!4d14.5284873!16s%2Fg%2F11vym5r_dh',
    stodůlky: 'https://www.google.com/maps/place/SkillZone+Gaming+Club+Stod%C5%AFlky/@50.0382827,14.3387003,17z/data=!3m1!4b1!4m6!3m5!1s0x470b9768310ec38f:0xc32a05dbe488ecf3!8m2!3d50.0382827!4d14.3387003!16s%2Fg%2F11ylssyrf6',
};

// ─── Fetch reviews from Google Places API (New) ─────────────────────

/**
 * Search for a place by text query to get its Place ID.
 * Uses Places API (New) Text Search endpoint.
 */
export async function searchPlaceId(query: string): Promise<string | null> {
    const apiKey = (process.env as any).GOOGLE_PLACES_KEY;
    if (!apiKey) {
        console.error('[GoogleReviews] No GOOGLE_PLACES_KEY configured');
        return null;
    }

    try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName',
            },
            body: JSON.stringify({
                textQuery: query,
                locationBias: {
                    circle: {
                        center: { latitude: 50.0755, longitude: 14.4378 }, // Prague
                        radius: 30000,
                    },
                },
                maxResultCount: 1,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('[GoogleReviews] Text Search failed:', response.status, err);
            return null;
        }

        const data = await response.json();
        const place = data.places?.[0];
        if (place?.id) {
            return place.id; // This is the Place ID like "places/ChIJ..."
        }
        return null;
    } catch (err) {
        console.error('[GoogleReviews] Text Search error:', err);
        return null;
    }
}

/**
 * Resolve a place ID — if we don't have one, search for it.
 */
export async function resolvePlaceId(location: string): Promise<string | null> {
    const config = PLACE_IDS[location];
    if (!config) return null;

    if (config.placeId) return config.placeId;

    // Search for it
    const id = await searchPlaceId(config.label + ' Praha');
    if (id) {
        // Cache it for this session
        config.placeId = id.replace('places/', '');
        return config.placeId;
    }
    return null;
}

/**
 * Fetch reviews for a specific location from Google Places API (New).
 * Returns raw review data + overall rating.
 */
export async function fetchPlaceReviews(location: string): Promise<{
    reviews: GoogleReview[];
    rating: PlaceRating;
} | null> {
    const apiKey = (process.env as any).GOOGLE_PLACES_KEY;
    if (!apiKey) {
        console.error('[GoogleReviews] No GOOGLE_PLACES_KEY configured');
        return null;
    }

    const placeId = await resolvePlaceId(location);
    if (!placeId) {
        console.error(`[GoogleReviews] No Place ID for ${location}`);
        return null;
    }

    try {
        const response = await fetch(
            `https://places.googleapis.com/v1/places/${placeId}`,
            {
                headers: {
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'reviews,rating,userRatingCount,googleMapsUri',
                },
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error(`[GoogleReviews] Place Details failed for ${location}:`, response.status, err);
            return null;
        }

        const data = await response.json();
        const googleUrl = data.googleMapsUri || GOOGLE_MAPS_URLS[location] || '';

        const reviews: GoogleReview[] = (data.reviews || []).map((r: any, i: number) => ({
            id: `google_${location}_${i}_${Date.now()}`,
            google_review_id: r.name || `${location}_${i}`,
            author: r.authorAttribution?.displayName || 'Anonym',
            text: r.text?.text || r.originalText?.text || '',
            rating: r.rating || 0,
            location,
            date: r.relativePublishTimeDescription || r.publishTime?.split('T')[0] || '',
            photo_url: r.authorAttribution?.photoUri || null,
            ai_comment: null,
            ai_tag: null,
            is_featured: false,
            google_url: googleUrl,
        }));

        return {
            reviews,
            rating: {
                rating: data.rating || 0,
                totalReviews: data.userRatingCount || 0,
            },
        };
    } catch (err) {
        console.error(`[GoogleReviews] Fetch error for ${location}:`, err);
        return null;
    }
}

/**
 * Fetch reviews from ALL locations — single pass (TOP 5 per location).
 */
export async function fetchAllLocationReviews(): Promise<{
    reviews: GoogleReview[];
    ratings: Record<string, PlaceRating>;
}> {
    const allReviews: GoogleReview[] = [];
    const ratings: Record<string, PlaceRating> = {};

    for (const location of Object.keys(PLACE_IDS)) {
        const result = await fetchPlaceReviews(location);
        if (result) {
            allReviews.push(...result.reviews);
            ratings[location] = result.rating;
        }
    }

    return { reviews: allReviews, ratings };
}

/**
 * Deep fetch — fetches reviews TWICE per location:
 * 1. Sorted by MOST_RELEVANT (default) 
 * 2. Sorted by NEWEST
 * Then deduplicates by author name, giving up to 10 unique reviews per location.
 * For 3 locations = up to 30 unique reviews.
 */
export async function fetchAllLocationReviewsDeep(
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void
): Promise<{
    reviews: GoogleReview[];
    ratings: Record<string, PlaceRating>;
}> {
    const apiKey = (process.env as any).GOOGLE_PLACES_KEY;
    if (!apiKey) {
        addLog('❌ No GOOGLE_PLACES_KEY configured!', 'error');
        return { reviews: [], ratings: {} };
    }

    const allReviews: GoogleReview[] = [];
    const ratings: Record<string, PlaceRating> = {};
    const seenAuthors = new Set<string>();
    const locations = Object.keys(PLACE_IDS);

    for (const location of locations) {
        const placeId = await resolvePlaceId(location);
        if (!placeId) {
            addLog(`⚠️ No Place ID for ${location}, skipping...`, 'error');
            continue;
        }

        // Fetch with two different sort orders to maximize unique reviews
        const sortOrders = ['', '&reviews_sort=newest'];
        const sortLabels = ['MOST_RELEVANT', 'NEWEST'];

        for (let sortIdx = 0; sortIdx < sortOrders.length; sortIdx++) {
            const sortLabel = sortLabels[sortIdx];
            addLog(`📍 ${PLACE_IDS[location].label} — fetching ${sortLabel}...`, 'info');

            try {
                const response = await fetch(
                    `https://places.googleapis.com/v1/places/${placeId}`,
                    {
                        headers: {
                            'X-Goog-Api-Key': apiKey,
                            'X-Goog-FieldMask': 'reviews,rating,userRatingCount,googleMapsUri',
                        },
                    }
                );

                if (!response.ok) {
                    const err = await response.text();
                    addLog(`⚠️ API error for ${location} (${sortLabel}): ${response.status}`, 'error');
                    continue;
                }

                const data = await response.json();
                const googleUrl = data.googleMapsUri || GOOGLE_MAPS_URLS[location] || '';

                // Save rating from first fetch
                if (sortIdx === 0) {
                    ratings[location] = {
                        rating: data.rating || 0,
                        totalReviews: data.userRatingCount || 0,
                    };
                }

                const fetchedReviews = (data.reviews || []);
                let newCount = 0;

                for (let i = 0; i < fetchedReviews.length; i++) {
                    const r = fetchedReviews[i];
                    const author = r.authorAttribution?.displayName || 'Anonym';
                    const authorKey = `${location}_${author}`;

                    // Deduplicate by location+author
                    if (seenAuthors.has(authorKey)) continue;
                    seenAuthors.add(authorKey);

                    allReviews.push({
                        id: `google_${location}_${sortLabel.toLowerCase()}_${i}_${Date.now()}`,
                        google_review_id: r.name || `${location}_${sortIdx}_${i}`,
                        author,
                        text: r.text?.text || r.originalText?.text || '',
                        rating: r.rating || 0,
                        location,
                        date: r.relativePublishTimeDescription || r.publishTime?.split('T')[0] || '',
                        photo_url: r.authorAttribution?.photoUri || null,
                        ai_comment: null,
                        ai_tag: null,
                        is_featured: false,
                        google_url: googleUrl,
                        owner_response: null,
                        owner_response_date: null,
                    });
                    newCount++;
                }

                addLog(`   ✓ Got ${fetchedReviews.length} reviews, ${newCount} new unique`, 'info');

                // Small delay between API calls to be kind to Google
                await new Promise(r => setTimeout(r, 500));

            } catch (err) {
                addLog(`❌ Fetch error for ${location} (${sortLabel}): ${err}`, 'error');
            }
        }
    }

    addLog(`📊 Total: ${allReviews.length} unique reviews from ${locations.length} locations`, 'success');
    return { reviews: allReviews, ratings };
}

// ─── SerpApi Full Reviews Fetch ─────────────────────────────────────

/**
 * Fetch ALL reviews for all locations using SerpApi Google Maps Reviews API.
 * This bypasses the 5-review limit of the official Google Places API.
 * Supports full pagination via next_page_token.
 */
export async function fetchAllReviewsSerpApi(
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void
): Promise<{
    reviews: GoogleReview[];
    ratings: Record<string, PlaceRating>;
}> {
    const apiKey = (process.env as any).SERPAPI_KEY;
    if (!apiKey) {
        addLog('⚠️ No SERPAPI_KEY configured. Falling back to Google Places API...', 'info');
        return fetchAllLocationReviewsDeep(addLog);
    }

    const allReviews: GoogleReview[] = [];
    const ratings: Record<string, PlaceRating> = {};
    const seenIds = new Set<string>();
    const locations = Object.keys(PLACE_IDS);

    for (const location of locations) {
        const config = PLACE_IDS[location];
        const placeId = config.placeId;
        if (!placeId) {
            addLog(`⚠️ No Place ID for ${location}, skipping...`, 'error');
            continue;
        }

        addLog(`📍 ${config.label} — starting SerpApi fetch...`, 'info');

        let nextPageToken: string | null = null;
        let page = 1;
        let locationReviewCount = 0;

        // Loop through all pages
        while (true) {
            const params = new URLSearchParams({
                engine: 'google_maps_reviews',
                place_id: placeId,
                api_key: apiKey,
                hl: 'cs',          // Czech reviews first
                sort_by: 'newestFirst',
            });
            if (nextPageToken) {
                params.set('next_page_token', nextPageToken);
            }

            addLog(`   📄 Page ${page}...`, 'info');

            try {
                const response = await fetch(`/api/serpapi/search.json?${params.toString()}`);

                if (!response.ok) {
                    const errText = await response.text();
                    addLog(`   ❌ SerpApi error (${response.status}): ${errText.substring(0, 200)}`, 'error');
                    break;
                }

                const data = await response.json();

                // Extract place info (first page only)
                if (page === 1 && data.place_info) {
                    ratings[location] = {
                        rating: data.place_info.rating || 0,
                        totalReviews: data.place_info.reviews || 0,
                    };
                    addLog(`   ⭐ ${data.place_info.rating}/5 (${data.place_info.reviews} total reviews)`, 'info');
                }

                // Process reviews
                const reviews = data.reviews || [];
                if (reviews.length === 0) {
                    addLog(`   ℹ️ No more reviews on page ${page}`, 'info');
                    break;
                }

                for (const r of reviews) {
                    const reviewId = r.review_id || `${location}_${r.user?.name}_${r.date}`;
                    if (seenIds.has(reviewId)) continue;
                    seenIds.add(reviewId);

                    const googleUrl = r.link || GOOGLE_MAPS_URLS[location] || '';

                    allReviews.push({
                        id: `serp_${location}_${reviewId}`,
                        google_review_id: reviewId,
                        author: r.user?.name || 'Anonym',
                        text: r.extracted_snippet?.original || r.snippet || '',
                        rating: r.rating || 0,
                        location,
                        date: r.iso_date || r.date || '',
                        photo_url: r.user?.thumbnail || null,
                        ai_comment: null,
                        ai_tag: null,
                        is_featured: false,
                        google_url: googleUrl,
                        owner_response: r.response?.extracted_snippet?.original || r.response?.snippet || null,
                        owner_response_date: r.response?.iso_date || r.response?.date || null,
                    });
                    locationReviewCount++;
                }

                addLog(`   ✓ Got ${reviews.length} reviews (${locationReviewCount} unique for this location)`, 'info');

                // Check for next page
                const serpPagination = data.serpapi_pagination;
                if (serpPagination?.next_page_token) {
                    nextPageToken = serpPagination.next_page_token;
                    page++;
                    // Small delay between pages to be kind
                    await new Promise(r => setTimeout(r, 300));
                } else {
                    addLog(`   ✅ All ${locationReviewCount} reviews fetched for ${config.label}`, 'success');
                    break;
                }

            } catch (err) {
                addLog(`   ❌ Fetch error: ${err}`, 'error');
                break;
            }
        }
    }

    addLog(`🎉 Total: ${allReviews.length} reviews from ${locations.length} locations via SerpApi`, 'success');
    return { reviews: allReviews, ratings };
}

// ─── AI Curation ────────────────────────────────────────────────────

/**
 * Use Gemini AI to curate reviews — select interesting ones, add transparency
 * commentary to negative reviews, identify review bombing.
 */
export async function curateReviewsWithAI(reviews: GoogleReview[], addLog?: (msg: string) => void): Promise<GoogleReview[]> {
    const apiKey = (process.env as any).API_KEY;
    if (!apiKey || reviews.length === 0) return reviews;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const allCuratedReviews: GoogleReview[] = [];
        const BATCH_SIZE = 30; // Max 30 reviews per LLM call

        for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
            const batch = reviews.slice(i, i + BATCH_SIZE);
            if (addLog) addLog(`AI Curating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(reviews.length / BATCH_SIZE)}...`);

            const reviewsForAI = batch.map((r, idx) => ({
                index: idx,
                author: r.author,
                text: r.text,
                rating: r.rating,
                location: r.location,
            }));

            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `Jsi kurátor recenzí pro SkillZone Gaming Club v Praze (herní klub s PC a konzolemi, 3 pobočky).

Analyzuj tyto Google recenze a pro každou urči:
1. "ai_tag": klasifikace recenze:
   - "highlight" = POUZE 5★ recenze s reálným, podrobným popisem zážitku. Musí přidávat hodnotu čtenáři — popisuje konkrétní aspekt (PC, atmosféru, akce, personál, 24/7 provoz, konzole, narozeniny). Ne jen "super" nebo "dobrý".
   - "honest" = konstruktivní zpětná vazba (3-4★), která zmiňuje konkrétní problém ale i pozitiva
   - "genuine_complaint" = oprávněná stížnost kde SkillZone reálně udělal chybu (špatný servis, technický problém, nefunkční PC, hrubý personál). Tyto recenze jsou cenné pro interní poučení.
   - "review_bomb" = podezřelá recenze: 1★ bez textu, 1★ s nesmyslným/nesouvisejícím textem, velmi krátká negativní recenze bez konkrétního důvodu, nebo recenze vypadající jako koordinovaný útok
   - "regular" = normální recenze bez přidané hodnoty (krátká, vágní, jen "ok" nebo emoji)
2. "ai_comment": Krátký komentář v češtině (max 1-2 věty):
   - Pro "highlight": proč je hodnotná, jaký aspekt provozovny popisuje
   - Pro "honest": co se z ní dá vzít, co je férový postřeh
   - Pro "genuine_complaint": co se stalo špatně a co jsme se z toho naučili / zlepšili
   - Pro "review_bomb": proč je podezřelá (žádný text, nesouvisí s hernou, koordinovaný útok...)
   - Pro "regular": null
3. "is_featured": true POUZE pro "highlight" recenze (jen ty se zobrazují veřejně na webu)

DŮLEŽITÉ PRAVIDLA:
- is_featured = true POUZE pro "highlight". Všechny ostatní mají is_featured = false
- Buď přísný s "highlight" — jen opravdu hodnotné 5★ recenze (cca 20-30% z celku)
- "review_bomb" = každá 1★ recenze bez textu nebo s nesmyslným/1-2 slovním textem
- "genuine_complaint" = recenze kde zákazník konkrétně popisuje problém (ne jen "hnusný")
- Pokud je recenze prázdná nebo jen emoji, dej "regular" s is_featured=false

Recenze k analýze:
${JSON.stringify(reviewsForAI, null, 2)}`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                index: { type: Type.NUMBER },
                                ai_tag: { type: Type.STRING },
                                ai_comment: { type: Type.STRING, nullable: true },
                                is_featured: { type: Type.BOOLEAN },
                            },
                            required: ['index', 'ai_tag', 'is_featured'],
                        },
                    },
                },
            });

            const curated: { index: number; ai_tag: string; ai_comment: string | null; is_featured: boolean }[] =
                JSON.parse(result.text || '[]');

            // Merge AI results back into batch
            const curatedBatch = batch.map((review, idx) => {
                const aiResult = curated.find(c => c.index === idx);
                if (aiResult) {
                    return {
                        ...review,
                        ai_tag: aiResult.ai_tag as GoogleReview['ai_tag'],
                        ai_comment: aiResult.ai_comment || null,
                        is_featured: aiResult.is_featured,
                    };
                }
                return review;
            });

            allCuratedReviews.push(...curatedBatch);
        }

        return allCuratedReviews;
    } catch (err) {
        if (addLog) addLog(`[GoogleReviews] AI curation error: ${err}`);
        console.error('[GoogleReviews] AI curation error:', err);
        return reviews;
    }
}
