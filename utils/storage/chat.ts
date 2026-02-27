/**
 * Chat and Feed — Supabase-backed.
 * Sessions include user metadata for tracking.
 */
import { ChatMessage } from '../../types';
import { LIVE_FEED_MESSAGES } from '../../constants';
import { getSupabase } from '../../services/supabaseClient';
import { fetchAll, upsertRow, deleteAllRows, TABLES } from '../../services/webDataService';
import { getOrCreateVisitorId } from './profiles';
import { hasAnalyticsConsent } from '../../components/CookieBanner';

export interface ChatSession {
    id: string;
    started_at: string;
    updated_at?: string;
    messages: ChatMessage[];
    // User metadata for tracking
    user_nickname?: string;
    user_agent?: string;
    session_fingerprint?: string;
    visitor_id?: string;
    message_count?: number;
    ip_address?: string;
    screen_resolution?: string;
    timezone?: string;
}

// ─── Session Fingerprint ─────────────────────────────────────────────

const generateFingerprint = (): string => {
    const ua = navigator.userAgent;
    const lang = navigator.language;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const raw = `${ua}|${lang}|${tz}|${screen}`;
    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const chr = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(36);
};

// Cached per page load
let _fingerprint: string | null = null;
const getFingerprint = () => {
    if (!_fingerprint) _fingerprint = generateFingerprint();
    return _fingerprint;
};

// ─── IP Detection ────────────────────────────────────────────────────
let _ip: string | null = null;
const getClientIp = async (): Promise<string> => {
    if (_ip) return _ip;
    try {
        const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        _ip = data.ip || 'unknown';
    } catch {
        _ip = 'unknown';
    }
    return _ip!;
};

// ─── CHAT SESSIONS ───────────────────────────────────────────────────

export const saveChatToHistory = async (
    messages: ChatMessage[],
    userNickname?: string
): Promise<void> => {
    try {
        const history = await getChatHistory();
        const now = new Date();
        const lastSession = history[history.length - 1];
        const isRecent = lastSession && (now.getTime() - new Date(lastSession.started_at).getTime() < 30 * 60 * 1000);

        const ip = hasAnalyticsConsent() ? await getClientIp() : 'consent_declined';
        const metadata = {
            user_nickname: userNickname || 'Anonymous',
            user_agent: navigator.userAgent.substring(0, 200),
            session_fingerprint: getFingerprint(),
            visitor_id: getOrCreateVisitorId(),
            message_count: messages.length,
            ip_address: ip,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        if (isRecent) {
            lastSession.messages = messages;
            lastSession.updated_at = now.toISOString();
            Object.assign(lastSession, metadata);
            await upsertRow(TABLES.CHAT_SESSIONS, lastSession);
        } else {
            const session: ChatSession = {
                id: 'sess_' + Math.random().toString(36).substr(2, 9),
                started_at: now.toISOString(),
                updated_at: now.toISOString(),
                messages,
                ...metadata,
            };
            await upsertRow(TABLES.CHAT_SESSIONS, session);
        }
    } catch (e) {
        console.error('[Chat] Failed to save', e);
    }
};

export const getChatHistory = async (): Promise<ChatSession[]> => {
    return fetchAll<ChatSession>(TABLES.CHAT_SESSIONS, [], 'started_at');
};

/**
 * Get recent conversation context for the current visitor.
 * Returns a text summary of past conversations for the AI prompt.
 */
export const getRecentConversationContext = async (): Promise<string> => {
    try {
        const visitorId = getOrCreateVisitorId();
        const sb = getSupabase();
        const { data } = await sb
            .from(TABLES.CHAT_SESSIONS)
            .select('messages, updated_at, user_nickname')
            .eq('visitor_id', visitorId)
            .order('updated_at', { ascending: false })
            .limit(3);

        if (!data || data.length === 0) return '';

        // Format last sessions into context
        const summaries = data.map((session: any) => {
            const msgs = (session.messages || []) as ChatMessage[];
            const userMsgs = msgs.filter((m: ChatMessage) => m.role === 'user').map((m: ChatMessage) => m.text);
            const modelMsgs = msgs.filter((m: ChatMessage) => m.role === 'model').map((m: ChatMessage) => m.text);
            const date = new Date(session.updated_at).toLocaleDateString('cs-CZ');
            return `[${date}] Uživatel psal: ${userMsgs.slice(-3).join(' | ')} / Skiller odpověděl: ${modelMsgs.slice(-2).join(' | ')}`;
        });

        return summaries.join('\n');
    } catch (e) {
        console.error('[Chat] Failed to get conversation context', e);
        return '';
    }
};

// ─── ADMIN MESSAGES ──────────────────────────────────────────────────

export const getAdminMessages = async (): Promise<string[]> => {
    const rows = await fetchAll<{ id: number; message: string }>(TABLES.ADMIN_MESSAGES, [], 'created_at');
    return rows.map(r => r.message);
};

export const addAdminMessage = async (msg: string): Promise<void> => {
    const sb = getSupabase();
    await sb.from(TABLES.ADMIN_MESSAGES).insert({ message: msg });
};

export const clearAdminMessages = async (): Promise<void> => {
    await deleteAllRows(TABLES.ADMIN_MESSAGES);
};

// ─── DAILY AI FEED ───────────────────────────────────────────────────

export const getDailyAiFeed = async (): Promise<{ user: string; msg: string }[]> => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const sb = getSupabase();
        const { data } = await sb.from(TABLES.DAILY_FEED).select('*').eq('feed_date', today);
        if (data && data.length > 0) {
            return data.map((r: any) => ({ user: r.username, msg: r.message }));
        }
    } catch { /* fall through */ }
    return [];
};

export const saveDailyAiFeed = async (messages: { user: string; msg: string }[]): Promise<void> => {
    const sb = getSupabase();
    const today = new Date().toISOString().slice(0, 10);
    // Delete old entries for today
    await sb.from(TABLES.DAILY_FEED).delete().eq('feed_date', today);
    // Insert new
    const rows = messages.map(m => ({ username: m.user, message: m.msg, feed_date: today }));
    if (rows.length > 0) {
        await sb.from(TABLES.DAILY_FEED).insert(rows);
    }
};

// ─── MERGED FEED ─────────────────────────────────────────────────────

const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

export const getMergedFeedMessages = async (): Promise<{ user: string; msg: string }[]> => {
    const adminMsgs = (await getAdminMessages()).map(msg => ({ user: 'ADMIN', msg }));
    const dailyAiMsgs = await getDailyAiFeed();

    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const shuffled = [...LIVE_FEED_MESSAGES].sort(() => 0.5 - seededRandom(seed));
    const fillerMsgs = shuffled.slice(0, 10);

    const mainContent = dailyAiMsgs.length > 0 ? dailyAiMsgs : fillerMsgs;
    return [...adminMsgs, ...mainContent];
};
