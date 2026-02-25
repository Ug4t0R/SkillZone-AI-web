import { getSupabase } from '../services/supabaseClient';
import { GoogleReview, PlaceRating } from '../services/googleReviewsService';

// ─── Types ──────────────────────────────────────────────────────────

export interface Review {
    id: string;
    author: string;
    text: string;
    rating: number;
    location: 'žižkov' | 'háje' | 'stodůlky';
    date: string;
    photo_url?: string | null;
    ai_comment?: string | null;
    ai_tag?: 'highlight' | 'honest' | 'genuine_complaint' | 'review_bomb' | 'regular' | null;
    is_featured?: boolean;
    google_url?: string;
}

// ─── Google Maps URLs ───────────────────────────────────────────────

export const GOOGLE_MAPS_URLS = {
    žižkov: 'https://www.google.com/maps/place/SkillZone+Gaming+Club+%C5%BDi%C5%BEkov/@50.0865271,14.4458031,17z/data=!3m1!4b1!4m6!3m5!1s0x470b94983bc9db05:0x63d584f5b81899e7!8m2!3d50.0865271!4d14.4458031!16s%2Fg%2F1hc2mc6kv',
    háje: 'https://www.google.com/maps/place/SkillZone+Gaming+Club+H%C3%A1je/@50.0315001,14.5284873,17z/data=!3m1!4b1!4m6!3m5!1s0x470b930065ba845b:0x5b3847633fdfad34!8m2!3d50.0315001!4d14.5284873!16s%2Fg%2F11vym5r_dh',
    stodůlky: 'https://www.google.com/maps/place/SkillZone+Gaming+Club+Stod%C5%AFlky/@50.0382827,14.3387003,17z/data=!3m1!4b1!4m6!3m5!1s0x470b9768310ec38f:0xc32a05dbe488ecf3!8m2!3d50.0382827!4d14.3387003!16s%2Fg%2F11ylssyrf6',
};

// ─── Fallback Data ──────────────────────────────────────────────────

export const FALLBACK_REVIEWS_CS: Review[] = [
    {
        id: 'fb_1', author: 'Radovan C.',
        text: 'Dobrý výběr her, super prostředí. Chodím sem pravidelně a vždycky je to naprostá pohoda.',
        rating: 5, location: 'žižkov', date: '2024-08',
        ai_tag: 'highlight', ai_comment: 'Pravidelný návštěvník potvrzuje konzistentní kvalitu.',
        google_url: GOOGLE_MAPS_URLS.žižkov,
    },
    {
        id: 'fb_2', author: 'David H.',
        text: 'Funguje nonstop, což je mega. Ve 3 ráno si tam jdeš zahrát a nikdo tě nevyhodí. Kompy skvělý, net brutální.',
        rating: 5, location: 'žižkov', date: '2024-11',
        ai_tag: 'highlight', ai_comment: '24/7 provoz = klíčová výhoda, kterou zákazníci oceňují.',
        google_url: GOOGLE_MAPS_URLS.žižkov,
    },
    {
        id: 'fb_3', author: 'Tereza N.',
        text: 'Bootcamp na Hájích je pecka! Měli jsme tam narozeniny — vlastní pití, pizza, nikdo nás neprudil.',
        rating: 5, location: 'háje', date: '2024-09',
        ai_tag: 'highlight', ai_comment: 'Události a párty — silný komunitní aspekt.',
        google_url: GOOGLE_MAPS_URLS.háje,
    },
    {
        id: 'fb_4', author: 'Petr K.',
        text: 'Nová pobočka Stodůlky přímo v OC. Čistý, moderní, výborná klima.',
        rating: 5, location: 'stodůlky', date: '2025-02',
        ai_tag: 'regular',
        google_url: GOOGLE_MAPS_URLS.stodůlky,
    },
];

export const FALLBACK_REVIEWS_EN: Review[] = [
    {
        id: 'fb_1', author: 'Radovan C.',
        text: 'Great game selection, awesome environment. I come here regularly and it\'s always great vibes.',
        rating: 5, location: 'žižkov', date: '2024-08',
        ai_tag: 'highlight', ai_comment: 'A regular confirms consistent quality.',
        google_url: GOOGLE_MAPS_URLS.žižkov,
    },
    {
        id: 'fb_2', author: 'David H.',
        text: 'Runs 24/7 which is insane. At 3 AM you just walk in and game. PCs are killer, internet is brutal fast.',
        rating: 5, location: 'žižkov', date: '2024-11',
        ai_tag: 'highlight', ai_comment: '24/7 operation = key advantage customers love.',
        google_url: GOOGLE_MAPS_URLS.žižkov,
    },
    {
        id: 'fb_3', author: 'Tereza N.',
        text: 'Bootcamp at Háje is fire! We had a birthday party there — own drinks, pizza, nobody bothered us.',
        rating: 5, location: 'háje', date: '2024-09',
        ai_tag: 'highlight', ai_comment: 'Events and parties — strong community aspect.',
        google_url: GOOGLE_MAPS_URLS.háje,
    },
    {
        id: 'fb_4', author: 'Petr K.',
        text: 'New Stodůlky branch right in the mall. Clean, modern, great AC.',
        rating: 5, location: 'stodůlky', date: '2025-02',
        ai_tag: 'regular',
        google_url: GOOGLE_MAPS_URLS.stodůlky,
    },
];

// ─── Default Location Ratings ───────────────────────────────────────

export const DEFAULT_LOCATION_RATINGS: Record<string, PlaceRating> = {
    žižkov: { rating: 4.5, totalReviews: 280 },
    háje: { rating: 4.7, totalReviews: 95 },
    stodůlky: { rating: 4.8, totalReviews: 25 },
};

// ─── Async Loader — tries Supabase first, falls back to hardcoded ──

let _cachedReviews: Review[] | null = null;
let _cachedRatings: Record<string, PlaceRating> | null = null;

export async function loadReviews(): Promise<Review[]> {
    if (_cachedReviews) return _cachedReviews;

    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('web_reviews')
            .select('*')
            .order('is_featured', { ascending: false });

        if (!error && data && data.length > 0) {
            _cachedReviews = data as Review[];
            return _cachedReviews;
        }
    } catch {
        // Silent — fallback below
    }

    return FALLBACK_REVIEWS_CS;
}

export async function loadLocationRatings(): Promise<Record<string, PlaceRating>> {
    if (_cachedRatings) return _cachedRatings;

    try {
        const sb = getSupabase();
        const { data } = await sb
            .from('web_settings')
            .select('value')
            .eq('key', 'google_location_ratings')
            .single();

        if (data?.value) {
            _cachedRatings = data.value as Record<string, PlaceRating>;
            return _cachedRatings;
        }
    } catch {
        // Silent
    }

    return DEFAULT_LOCATION_RATINGS;
}

export function invalidateReviewsCache() {
    _cachedReviews = null;
    _cachedRatings = null;
}

// ─── Backward compat exports ────────────────────────────────────────

export const REVIEWS_DATA_CS = FALLBACK_REVIEWS_CS;
export const REVIEWS_DATA_EN = FALLBACK_REVIEWS_EN;
export const REVIEWS_DATA = FALLBACK_REVIEWS_CS;
export const LOCATION_RATINGS = DEFAULT_LOCATION_RATINGS;
