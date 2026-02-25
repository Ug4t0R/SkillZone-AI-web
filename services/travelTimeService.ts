/**
 * Travel Time Service — fetches real-time travel estimates via Google Routes API
 * and provides deep-links for Bolt/Uber/Google Maps.
 */

import { getSupabase } from './supabaseClient';

// ─── Types ──────────────────────────────────────────────────────────

export interface LatLng {
    lat: number;
    lng: number;
}

export interface TravelEstimate {
    mode: 'walking' | 'transit' | 'driving';
    durationMinutes: number;
    durationText: string;
    distanceKm: number;
    distanceText: string;
    transitDetails?: string; // e.g. "Metro C → bus 177"
}

export interface TravelResult {
    locationId: string;
    origin: LatLng;
    estimates: TravelEstimate[];
    deepLinks: {
        googleMaps: string;
        bolt: string;
        uber: string;
    };
    timestamp: number;
}

// ─── Location Coordinates ───────────────────────────────────────────

export const LOCATION_COORDS: Record<string, { lat: number; lng: number; address: string; label: string }> = {
    zizkov: { lat: 50.085536, lng: 14.454236, address: 'Orebitská 630/4, Praha 3', label: 'SkillZone Žižkov' },
    haje: { lat: 50.031670, lng: 14.527940, address: 'Arkalycká 877/4, Praha 4', label: 'SkillZone Háje' },
    stodulky: { lat: 50.0382827, lng: 14.3387003, address: 'Mukařovského 1986/7, Praha 5', label: 'SkillZone Stodůlky' },
};

// ─── Cache ──────────────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { result: TravelResult; expires: number }>();

function getCacheKey(origin: LatLng, locationId: string): string {
    // Round to ~100m precision to improve cache hits
    const latRound = Math.round(origin.lat * 1000) / 1000;
    const lngRound = Math.round(origin.lng * 1000) / 1000;
    return `${latRound},${lngRound}→${locationId}`;
}

function getCached(origin: LatLng, locationId: string): TravelResult | null {
    const key = getCacheKey(origin, locationId);
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expires) return entry.result;
    if (entry) cache.delete(key);
    return null;
}

function setCache(result: TravelResult): void {
    const key = getCacheKey(result.origin, result.locationId);
    cache.set(key, { result, expires: Date.now() + CACHE_TTL });
}

// ─── Rate Limiter ───────────────────────────────────────────────────

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 300; // ms between requests

async function waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed));
    }
    lastRequestTime = Date.now();
}

// ─── Deep Link Generators ───────────────────────────────────────────

export function generateDeepLinks(origin: LatLng, locationId: string) {
    const dest = LOCATION_COORDS[locationId];
    if (!dest) return { googleMaps: '', bolt: '', uber: '' };

    const destStr = `${dest.lat},${dest.lng}`;
    const originStr = `${origin.lat},${origin.lng}`;
    const destEncoded = encodeURIComponent(dest.address);

    return {
        googleMaps: `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destEncoded}&travelmode=transit`,
        bolt: `https://m.bolt.eu/cs-CZ/?pickup_lat=${origin.lat}&pickup_lng=${origin.lng}&dropoff_lat=${dest.lat}&dropoff_lng=${dest.lng}&dropoff_name=${encodeURIComponent(dest.label)}`,
        uber: `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${origin.lat}&pickup[longitude]=${origin.lng}&dropoff[latitude]=${dest.lat}&dropoff[longitude]=${dest.lng}&dropoff[nickname]=${encodeURIComponent(dest.label)}`,
    };
}

// ─── Geocoding (Address → Coordinates) ──────────────────────────────

export async function geocodeAddress(address: string): Promise<LatLng | null> {
    const apiKey = (process.env as any).GOOGLE_PLACES_KEY;
    if (!apiKey) return null;

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', Praha')}&key=${apiKey}&region=cz`
        );
        if (!response.ok) return null;

        const data = await response.json();
        const loc = data.results?.[0]?.geometry?.location;
        if (loc) return { lat: loc.lat, lng: loc.lng };
        return null;
    } catch {
        return null;
    }
}

// ─── Google Routes API ──────────────────────────────────────────────

function formatDuration(seconds: number): string {
    if (seconds < 60) return '< 1 min';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

async function fetchRouteEstimate(
    origin: LatLng,
    destination: LatLng,
    mode: 'WALK' | 'TRANSIT' | 'DRIVE'
): Promise<TravelEstimate | null> {
    const apiKey = (process.env as any).GOOGLE_PLACES_KEY;
    if (!apiKey) return null;

    const modeMap: Record<string, TravelEstimate['mode']> = {
        WALK: 'walking',
        TRANSIT: 'transit',
        DRIVE: 'driving',
    };

    try {
        await waitForRateLimit();

        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs.steps.transitDetails',
            },
            body: JSON.stringify({
                origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
                destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
                travelMode: mode,
                computeAlternativeRoutes: false,
                languageCode: 'cs',
                regionCode: 'CZ',
            }),
        });

        if (!response.ok) {
            console.error(`[TravelTime] Routes API error (${mode}):`, response.status, await response.text());
            return null;
        }

        const data = await response.json();
        const route = data.routes?.[0];
        if (!route) return null;

        const durationSeconds = parseInt(route.duration?.replace('s', '') || '0');
        const distanceMeters = route.distanceMeters || 0;

        // Extract transit details
        let transitDetails: string | undefined;
        if (mode === 'TRANSIT' && route.legs) {
            const transitSteps = route.legs
                .flatMap((leg: any) => leg.steps || [])
                .filter((step: any) => step.transitDetails)
                .map((step: any) => {
                    const td = step.transitDetails;
                    const line = td.transitLine;
                    const vehicle = line?.vehicle?.type || '';
                    const name = line?.nameShort || line?.name || '';
                    const vehicleLabel = vehicle === 'SUBWAY' ? 'Metro' :
                        vehicle === 'TRAM' ? 'Tram' :
                            vehicle === 'BUS' ? 'Bus' : vehicle;
                    return `${vehicleLabel} ${name}`.trim();
                });
            if (transitSteps.length > 0) {
                transitDetails = transitSteps.join(' → ');
            }
        }

        return {
            mode: modeMap[mode],
            durationMinutes: Math.round(durationSeconds / 60),
            durationText: formatDuration(durationSeconds),
            distanceKm: Math.round(distanceMeters / 100) / 10,
            distanceText: formatDistance(distanceMeters),
            transitDetails,
        };
    } catch (err) {
        console.error(`[TravelTime] Fetch error (${mode}):`, err);
        return null;
    }
}

// ─── Main API ───────────────────────────────────────────────────────

/**
 * Get travel time estimates for all modes to a specific location.
 * Returns cached result if available, otherwise fetches from API.
 */
export async function getTravelEstimates(
    origin: LatLng,
    locationId: string
): Promise<TravelResult | null> {
    const dest = LOCATION_COORDS[locationId];
    if (!dest) return null;

    // Check cache
    const cached = getCached(origin, locationId);
    if (cached) return cached;

    // Fetch all modes in parallel
    const [walking, transit, driving] = await Promise.all([
        fetchRouteEstimate(origin, dest, 'WALK'),
        fetchRouteEstimate(origin, dest, 'TRANSIT'),
        fetchRouteEstimate(origin, dest, 'DRIVE'),
    ]);

    const estimates = [walking, transit, driving].filter((e): e is TravelEstimate => e !== null);

    if (estimates.length === 0) return null;

    const result: TravelResult = {
        locationId,
        origin,
        estimates,
        deepLinks: generateDeepLinks(origin, locationId),
        timestamp: Date.now(),
    };

    setCache(result);
    return result;
}

/**
 * Get travel estimates for ALL locations at once.
 */
export async function getAllTravelEstimates(origin: LatLng): Promise<Record<string, TravelResult>> {
    const results: Record<string, TravelResult> = {};

    // Process sequentially to respect rate limits
    for (const locationId of Object.keys(LOCATION_COORDS)) {
        const result = await getTravelEstimates(origin, locationId);
        if (result) results[locationId] = result;
    }

    return results;
}

// ─── Usage Logging ──────────────────────────────────────────────────

/**
 * Log a travel time lookup to Supabase for analytics.
 * Only logs approximate area, never exact coordinates.
 */
export async function logTravelLookup(
    locationId: string,
    mode: string,
    durationMinutes?: number,
    distanceKm?: number,
    taxiProvider?: string
): Promise<void> {
    try {
        const sb = getSupabase();
        await sb.from('web_travel_logs').insert({
            location_id: locationId,
            travel_mode: mode,
            duration_minutes: durationMinutes ?? null,
            distance_km: distanceKm ?? null,
            taxi_provider: taxiProvider ?? null,
        });
    } catch (err) {
        // Silent fail — logging should never break the UX
        console.warn('[TravelTime] Log error:', err);
    }
}

// ─── Fallback Estimates (when API unavailable) ──────────────────────

/**
 * Rough estimates based on straight-line distance (Haversine).
 * Used when the Routes API isn't enabled or fails.
 */
export function getFallbackEstimates(origin: LatLng, locationId: string): TravelResult | null {
    const dest = LOCATION_COORDS[locationId];
    if (!dest) return null;

    // Haversine distance
    const R = 6371;
    const dLat = (dest.lat - origin.lat) * Math.PI / 180;
    const dLng = (dest.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(origin.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Rough estimates: walking 5km/h, transit 25km/h, driving 35km/h
    const walkMins = Math.round(distance / 5 * 60);
    const transitMins = Math.round(distance / 25 * 60 + 5); // +5 min for waiting
    const driveMins = Math.round(distance / 35 * 60 + 3); // +3 min for parking

    return {
        locationId,
        origin,
        estimates: [
            { mode: 'walking', durationMinutes: walkMins, durationText: formatDuration(walkMins * 60), distanceKm: Math.round(distance * 12) / 10, distanceText: formatDistance(Math.round(distance * 1200)), },
            { mode: 'transit', durationMinutes: transitMins, durationText: formatDuration(transitMins * 60), distanceKm: Math.round(distance * 10) / 10, distanceText: formatDistance(Math.round(distance * 1000)), },
            { mode: 'driving', durationMinutes: driveMins, durationText: formatDuration(driveMins * 60), distanceKm: Math.round(distance * 13) / 10, distanceText: formatDistance(Math.round(distance * 1300)), },
        ],
        deepLinks: generateDeepLinks(origin, locationId),
        timestamp: Date.now(),
    };
}
