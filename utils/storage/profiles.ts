/**
 * User and Owner profiles — Supabase-backed.
 * Includes persistent visitor identity and AI-powered memory.
 */
import { UserProfile, OwnerProfileData } from '../../types';
import { DEFAULT_OWNER_PROFILE_CS, DEFAULT_OWNER_PROFILE_EN } from '../../constants';
import { getSetting, setSetting, deleteSetting, getSettingsByPrefix, fetchById, upsertRow, TABLES } from '../../services/webDataService';

const VISITOR_ID_KEY = 'sz_visitor_id';

// ─── PERSISTENT VISITOR ID ──────────────────────────────────────────

export const getOrCreateVisitorId = (): string => {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
        id = 'viz_' + crypto.randomUUID().slice(0, 8);
        localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
};

const USER_PROFILE_KEY = 'sz_skiller_profile';

export const getUserProfile = async (): Promise<UserProfile> => {
    const visitorId = getOrCreateVisitorId();
    const profileKey = `skiller_profile_${visitorId}`;

    // Load from Supabase using the isolated visitor key
    const data = await getSetting<UserProfile | null>(profileKey, null);
    const profile = data || { interactionCount: 0, lastVisit: new Date().toISOString(), visitorId };

    // Always ensure the persistent visitor ID matches the one generated for this device
    if (!profile.visitorId || profile.visitorId !== visitorId) {
        profile.visitorId = visitorId;
    }
    return profile;
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
    const visitorId = getOrCreateVisitorId();
    const profileKey = `skiller_profile_${visitorId}`;
    await setSetting(profileKey, profile);
};

export const saveRemoteUserProfile = async (visitorId: string, profile: UserProfile): Promise<boolean> => {
    if (!visitorId || !profile) return false;
    const profileKey = `skiller_profile_${visitorId}`;
    return await setSetting(profileKey, profile);
};

export const getAllUserProfiles = async (): Promise<{ visitorId: string, profile: UserProfile }[]> => {
    const settings = await getSettingsByPrefix<UserProfile>('skiller_profile_');
    return settings.map(s => ({
        visitorId: s.key.replace('skiller_profile_', ''),
        profile: s.value
    }));
};

export const deleteUserProfile = async (visitorId: string): Promise<boolean> => {
    return await deleteSetting(`skiller_profile_${visitorId}`);
};

/**
 * Update user memory after a conversation using AI extraction.
 * Called asynchronously after chat closes or periodically.
 */
export const updateUserMemory = async (
    profile: UserProfile,
    conversationText: string
): Promise<UserProfile> => {
    try {
        const { extractMemoryFromConversation } = await import('../../services/geminiService');
        const memory = await extractMemoryFromConversation(conversationText, profile);

        const updated: UserProfile = {
            ...profile,
            nickname: memory.nickname || profile.nickname,
            persona: memory.persona || profile.persona,
            conversationSummary: memory.summary || profile.conversationSummary,
            favoriteGames: mergeLists(profile.favoriteGames, memory.games),
            knownFacts: mergeLists(profile.knownFacts, memory.facts),
            lastVisit: new Date().toISOString(),
        };

        await saveUserProfile(updated);
        return updated;
    } catch (e) {
        console.error('[Memory] Failed to update user memory', e);
        return profile;
    }
};

const mergeLists = (existing?: string[], newItems?: string[]): string[] | undefined => {
    if (!newItems?.length) return existing;
    const merged = [...new Set([...(existing || []), ...newItems])];
    return merged.slice(-10); // Keep last 10 items max
};

// ─── IDENTITY DETECTION (regex-based, runs locally) ──────────────────

export const detectUserIdentity = (message: string, currentProfile: UserProfile): UserProfile | null => {
    let changed = false;
    const updated = { ...currentProfile };

    // Name detection
    const namePatterns = [
        /(?:jmenuj[uio] se|jsem|říkej mi|moje jméno je|mě říkaj)\s+([a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9_]{2,15})/i,
        /(?:call me|i am|name is|i'm)\s+([a-zA-Z0-9_]{2,15})/i
    ];
    for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match?.[1] && match[1].toLowerCase() !== 'skiller' && match[1].length > 1) {
            updated.nickname = match[1];
            changed = true;
            break;
        }
    }

    // Game detection
    const gamePatterns: Record<string, RegExp> = {
        'CS2': /\b(?:cs2|cs:?go|counter[\s-]?strike|csecko)\b/i,
        'League of Legends': /\b(?:lol|league|legina)\b/i,
        'Valorant': /\b(?:valo|valorant)\b/i,
        'Dota 2': /\b(?:dota|dotka)\b/i,
        'Fortnite': /\b(?:fortnite|fortna)\b/i,
        'Minecraft': /\b(?:minecraft|mcraft|craft)\b/i,
        'FIFA': /\b(?:fifa|fc\s?2[45]|eafc)\b/i,
        'Overwatch': /\b(?:overwatch|ow2?)\b/i,
        'Apex Legends': /\b(?:apex)\b/i,
        'Rocket League': /\b(?:rocket\s?league|rl)\b/i,
    };

    for (const [game, regex] of Object.entries(gamePatterns)) {
        if (regex.test(message)) {
            if (!updated.favoriteGames) updated.favoriteGames = [];
            if (!updated.favoriteGames.includes(game)) {
                updated.favoriteGames.push(game);
                changed = true;
            }
        }
    }

    return changed ? updated : null;
};

// ─── OWNER PROFILE ───────────────────────────────────────────────────

/**
 * DB schema: id, name, title, bio, photo, social (jsonb), stats (jsonb)
 * Frontend model: name, nickname, role, bio, imgUrl, stats {xp, class, ulti}
 * We map between these two representations.
 */
interface OwnerProfileDbRow {
    id: string;
    name: string;
    title: string;
    bio: string;
    photo: string;
    social: Record<string, string>;
    stats: Record<string, string>;
}

const toDbRow = (profile: OwnerProfileData): OwnerProfileDbRow => ({
    id: 'default',
    name: profile.nickname ? `${profile.name}` : profile.name,
    title: profile.role || '',
    bio: profile.bio || '',
    photo: profile.imgUrl || '',
    social: { nickname: profile.nickname || '' },
    stats: profile.stats || {},
});

const fromDbRow = (row: OwnerProfileDbRow): OwnerProfileData => ({
    name: row.name || '',
    nickname: row.social?.nickname || '',
    role: row.title || '',
    bio: row.bio || '',
    imgUrl: row.photo || '',
    stats: {
        xp: row.stats?.xp || '',
        class: row.stats?.class || '',
        ulti: row.stats?.ulti || '',
    },
});

export const getOwnerProfile = async (lang: 'cs' | 'en'): Promise<OwnerProfileData> => {
    const data = await fetchById<OwnerProfileDbRow>(TABLES.OWNER_PROFILE, 'default');
    if (data) return fromDbRow(data);
    return lang === 'cs' ? DEFAULT_OWNER_PROFILE_CS : DEFAULT_OWNER_PROFILE_EN;
};

export const saveOwnerProfile = async (profile: OwnerProfileData): Promise<void> => {
    await upsertRow(TABLES.OWNER_PROFILE, toDbRow(profile));
};

export const resetOwnerProfile = async (): Promise<void> => {
    await upsertRow(TABLES.OWNER_PROFILE, toDbRow(DEFAULT_OWNER_PROFILE_CS));
};

