import { GoogleReview } from './googleReviewsService';

// Convert STAR_RATING enum to number
function parseStarRating(ratingStr: string): number {
    switch (ratingStr) {
        case 'FIVE': return 5;
        case 'FOUR': return 4;
        case 'THREE': return 3;
        case 'TWO': return 2;
        case 'ONE': return 1;
        default: return 0;
    }
}

/** Fetch with automatic retry on 429 (rate limit) errors */
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void,
    maxRetries = 5
): Promise<Response> {
    const delays = [5, 15, 30, 60, 120]; // seconds between retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, options);
        if (res.status === 429 && attempt < maxRetries) {
            const waitSec = delays[attempt] || 120;
            addLog(`⏳ Rate limited (429). Waiting ${waitSec}s before retry ${attempt + 1}/${maxRetries}...`, 'info');
            await new Promise(r => setTimeout(r, waitSec * 1000));
            continue;
        }
        return res;
    }
    return fetch(url, options);
}

/**
 * Fetch all historical reviews from Google Business Profile API using a provider token.
 */
export async function fetchAllGmbReviews(
    providerToken: string,
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void
): Promise<GoogleReview[]> {
    addLog('🔑 GMB Sync started. Fetching accounts...', 'info');

    // 1. Get Accounts
    const headers = { Authorization: `Bearer ${providerToken}` };
    const accRes = await fetchWithRetry(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        { headers },
        addLog
    );

    if (!accRes.ok) {
        const errText = await accRes.text();
        addLog(`❌ ACCOUNTS fetch failed (${accRes.status}): ${errText.substring(0, 200)}`, 'error');
        return [];
    }

    const accData = await accRes.json();
    const accounts = accData.accounts || [];

    if (accounts.length === 0) {
        addLog('❌ No Google Business Profile accounts found for this user.', 'error');
        return [];
    }

    addLog(`✅ Found ${accounts.length} account(s). Fetching locations...`, 'success');
    let allReviews: GoogleReview[] = [];

    for (const account of accounts) {
        const accountName = account.name; // "accounts/123..."

        // 2. Get Locations
        const locRes = await fetchWithRetry(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title`,
            { headers },
            addLog
        );

        if (!locRes.ok) {
            const errText = await locRes.text();
            addLog(`❌ LOCATIONS fetch failed (${locRes.status}): ${errText.substring(0, 200)}`, 'error');
            continue;
        }

        const locData = await locRes.json();
        const locations = locData.locations || [];

        if (locations.length === 0) {
            addLog(`ℹ️ No locations found in ${accountName}`, 'info');
            continue;
        }

        addLog(`✅ Found ${locations.length} location(s). Scanning for SkillZone branches...`, 'success');

        for (const loc of locations) {
            const locName = loc.name; // "locations/456..."

            // Filter strictly to SkillZone locations
            let skillzoneLocation: 'žižkov' | 'háje' | 'stodůlky' | null = null;
            const lowerTitle = (loc.title || '').toLowerCase();
            if (lowerTitle.includes('žižkov') || lowerTitle.includes('zizkov')) skillzoneLocation = 'žižkov';
            else if (lowerTitle.includes('háje') || lowerTitle.includes('haje')) skillzoneLocation = 'háje';
            else if (lowerTitle.includes('stodůlky') || lowerTitle.includes('stodulky')) skillzoneLocation = 'stodůlky';

            if (!skillzoneLocation) {
                addLog(`⏭️ Skipped non-SkillZone location: "${loc.title}"`, 'info');
                continue;
            }

            addLog(`📥 Fetching reviews for "${loc.title}" (${skillzoneLocation})...`, 'info');

            // 3. Get Reviews (Pagination)
            let pageToken = '';
            let locationReviewCount = 0;

            while (true) {
                const url = new URL(`https://mybusiness.googleapis.com/v4/${accountName}/${locName}/reviews`);
                if (pageToken) url.searchParams.append('pageToken', pageToken);
                url.searchParams.append('pageSize', '50');

                const revRes = await fetchWithRetry(url.toString(), { headers }, addLog);

                if (!revRes.ok) {
                    const errText = await revRes.text();
                    addLog(`❌ REVIEWS fetch failed for ${loc.title} (${revRes.status}): ${errText.substring(0, 200)}`, 'error');
                    break;
                }

                const revData = await revRes.json();
                const reviews = revData.reviews || [];

                if (reviews.length === 0) break;

                for (const r of reviews) {
                    allReviews.push({
                        id: `gmb_${r.reviewId}`,
                        google_review_id: r.reviewId,
                        author: r.reviewer?.displayName || 'Anonym',
                        text: r.comment || '',
                        rating: parseStarRating(r.starRating),
                        location: skillzoneLocation,
                        date: r.createTime?.split('T')[0] || '',
                        photo_url: r.reviewer?.profilePhotoUrl || null,
                        ai_comment: null,
                        ai_tag: null,
                        is_featured: false,
                        google_url: '',
                    });
                }

                locationReviewCount += reviews.length;
                pageToken = revData.nextPageToken;

                if (!pageToken) break;
            }

            addLog(`✅ ${locationReviewCount} reviews from "${loc.title}"`, 'success');
        }
    }

    addLog(`🏁 GMB Sync complete! Total reviews: ${allReviews.length}`, 'success');
    return allReviews;
}
