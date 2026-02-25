/**
 * WeatherService — fetches current weather for Prague from wttr.in (no API key needed).
 * Caches for 30 minutes to avoid rate limits.
 */

export type WeatherCondition = 'sun' | 'rain' | 'snow' | 'cloudy' | 'storm' | 'fog' | 'unknown';

export interface WeatherData {
    temp: number;          // Celsius
    feelsLike: number;
    condition: WeatherCondition;
    description: string;   // Human-readable: "Slunečno", "Déšť" etc.
    emoji: string;         // ☀️, 🌧️, ❄️ etc.
    humidity: number;
    windKmh: number;
    isNight: boolean;
}

// ─── Cache ───────────────────────────────────────────────────────────
let cached: { data: WeatherData; ts: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ─── Condition Mapping ───────────────────────────────────────────────
// wttr.in WWO codes → our simplified conditions
// https://www.worldweatheronline.com/developer/api/docs/weather-icons.aspx
const mapWwoCode = (code: number, isNight: boolean): { condition: WeatherCondition; emoji: string; description: string } => {
    // Thunderstorm
    if ([200, 386, 389, 392, 395].includes(code)) return { condition: 'storm', emoji: '⛈️', description: 'Bouřka' };
    // Snow
    if ([179, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377].includes(code)) return { condition: 'snow', emoji: '❄️', description: 'Sníh' };
    // Rain / drizzle
    if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359, 362, 365].includes(code)) return { condition: 'rain', emoji: '🌧️', description: 'Déšť' };
    // Fog / mist
    if ([143, 248, 260].includes(code)) return { condition: 'fog', emoji: '🌫️', description: 'Mlha' };
    // Cloudy / overcast
    if ([119, 122].includes(code)) return { condition: 'cloudy', emoji: '☁️', description: 'Zataženo' };
    // Partly cloudy
    if ([116].includes(code)) return { condition: isNight ? 'cloudy' : 'sun', emoji: isNight ? '☁️' : '⛅', description: 'Polojasno' };
    // Clear
    if ([113].includes(code)) return { condition: 'sun', emoji: isNight ? '🌙' : '☀️', description: isNight ? 'Jasná noc' : 'Slunečno' };
    return { condition: 'unknown', emoji: '🌤️', description: 'Proměnlivé' };
};

// ─── Fetch ────────────────────────────────────────────────────────────

export async function getWeather(): Promise<WeatherData> {
    // Return cache if fresh
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

    try {
        const res = await fetch('https://wttr.in/Prague?format=j1', {
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const current = json.current_condition?.[0];
        if (!current) throw new Error('No current_condition in response');

        const tempC = parseInt(current.temp_C || '0');
        const feelsLike = parseInt(current.FeelsLikeC || '0');
        const humidity = parseInt(current.humidity || '0');
        const windKmh = parseInt(current.windspeedKmph || '0');
        const wwoCode = parseInt(current.weatherCode || '113');

        // Determine day/night from astronomy data
        const hour = new Date().getHours();
        const isNight = hour >= 21 || hour < 6;

        const { condition, emoji, description } = mapWwoCode(wwoCode, isNight);

        const data: WeatherData = {
            temp: tempC,
            feelsLike,
            condition,
            description,
            emoji,
            humidity,
            windKmh,
            isNight,
        };

        cached = { data, ts: Date.now() };
        return data;
    } catch (err) {
        console.warn('[Weather] Failed to fetch, using fallback', err);
        // Return a safe fallback
        const fallback: WeatherData = {
            temp: 15,
            feelsLike: 15,
            condition: 'unknown',
            description: 'N/A',
            emoji: '🌤️',
            humidity: 50,
            windKmh: 10,
            isNight: new Date().getHours() >= 21 || new Date().getHours() < 6,
        };
        return fallback;
    }
}
