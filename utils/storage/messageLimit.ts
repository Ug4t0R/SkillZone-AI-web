/**
 * Message rate limiting — Supabase-backed.
 */
import { getSetting, setSetting } from '../../services/webDataService';

interface MessageCount {
    count: number;
    date: string;
}

const LIMIT_KEY = 'daily_message_count';
const MAX_DAILY = 50;

export const checkMessageLimit = async (): Promise<{ allowed: boolean; remaining: number }> => {
    const data = await getSetting<MessageCount | null>(LIMIT_KEY, null);
    const today = new Date().toDateString();

    if (!data || data.date !== today) {
        return { allowed: true, remaining: MAX_DAILY };
    }
    return { allowed: data.count < MAX_DAILY, remaining: Math.max(0, MAX_DAILY - data.count) };
};

export const incrementMessageCount = async (): Promise<void> => {
    const today = new Date().toDateString();
    const data = await getSetting<MessageCount | null>(LIMIT_KEY, null);

    if (!data || data.date !== today) {
        await setSetting(LIMIT_KEY, { count: 1, date: today });
    } else {
        await setSetting(LIMIT_KEY, { count: data.count + 1, date: today });
    }
};

// Sync compatibility wrappers for components that render inline
// These use a cached local count, refreshed on each call cycle
let _cachedCount = 0;
let _cachedDate = '';

export const refreshMessageCount = async (): Promise<number> => {
    const today = new Date().toDateString();
    const data = await getSetting<MessageCount | null>(LIMIT_KEY, null);
    if (!data || data.date !== today) {
        _cachedCount = 0;
    } else {
        _cachedCount = data.count;
    }
    _cachedDate = today;
    return _cachedCount;
};

export const getDailyMessageCount = (): number => _cachedCount;
export const isAiLimitReached = (): boolean => _cachedCount >= MAX_DAILY;

export const incrementDailyMessageCount = async (): Promise<void> => {
    _cachedCount += 1;
    await incrementMessageCount();
};

const TIRED_MESSAGES = [
    'Dneska už mám dost... Zkus to zítra, hráči!',
    'Limit reached, bro. Zítra jedu dál.',
    'Vypnul jsem na dnešek. Mám přetíženej procesor.',
    'GG, dneska jsem dosáhl limitu zpráv.',
    'Server overload — vrátím se zítra!',
];

export const getTiredSkillerMessage = (): string => {
    return TIRED_MESSAGES[Math.floor(Math.random() * TIRED_MESSAGES.length)];
};
