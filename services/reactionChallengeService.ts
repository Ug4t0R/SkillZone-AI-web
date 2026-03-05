/**
 * reactionChallengeService.ts
 *
 * Reaction Challenge game service:
 * - Solo / Duel / Party (3-4P) / Team (2v2) modes
 * - Multiple difficulty levels
 * - Skiller commentary phrases
 * - Round generation + scoring
 * - Supabase persistence
 */

import { getSupabase } from './supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────

export type ReactionMode = 'solo' | 'duel' | 'party' | 'team';
export type DifficultyId = 'noob' | 'casual' | 'pro' | 'elite';

export interface ReactionDifficulty {
    id: DifficultyId;
    name: string;
    nameCs: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    descriptionCs: string;
    minDelay: number;      // minimum wait before signal (ms)
    maxDelay: number;      // maximum wait before signal
    rounds: number;        // rounds per game
    hasFakeouts: boolean;  // fake signals that penalize early taps
    hasPatterns: boolean;  // must match specific pattern/zone
    hasSequences: boolean; // rapid-fire combo chains
    fakeoutChance: number; // 0-1 probability of fakeout round
}

export interface PlayerSlot {
    id: number;            // 0-3
    name: string;
    key: string;           // keyboard key or 'touch-0' .. 'touch-3'
    color: string;
    teamId?: number;       // 0 or 1 for team mode
    results: RoundResult[];
    totalReaction: number;
    bestReaction: number;
    falseStarts: number;
    score: number;
}

export interface RoundConfig {
    index: number;
    delay: number;         // wait before GO signal (ms)
    isFakeout: boolean;    // false = real signal, true = trap
    targetZone?: number;   // for 'pro' difficulty — which zone to tap
    color: string;         // signal color
    sequence?: number[];   // for 'elite' — sequence of zones to tap
}

export interface RoundResult {
    playerId: number;
    roundIndex: number;
    reactionMs: number;    // -1 = false start, 0 = timeout
    correct: boolean;      // hit the right zone?
    timestamp: number;
}

export interface ReactionGameStats {
    mode: ReactionMode;
    difficulty: DifficultyId;
    players: PlayerSlot[];
    rounds: RoundConfig[];
    totalRounds: number;
    winnerId: number | null;  // player id or null for tie
    winnerTeam: number | null;
}

export interface ReactionLeaderboardEntry {
    id?: number;
    player_name: string;
    score: number;
    avg_reaction: number;
    best_reaction: number;
    false_starts: number;
    rounds_played: number;
    difficulty: string;
    mode: string;
    players_count: number;
    input_type: 'keyboard' | 'touch';
    created_at?: string;
}

// ─── Constants ────────────────────────────────────────────────────────

export const PLAYER_COLORS = [
    { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-400', hex: '#3b82f6', label: 'Modrý' },
    { bg: 'bg-red-500', border: 'border-red-400', text: 'text-red-400', hex: '#ef4444', label: 'Červený' },
    { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-400', hex: '#22c55e', label: 'Zelený' },
    { bg: 'bg-yellow-500', border: 'border-yellow-400', text: 'text-yellow-400', hex: '#eab308', label: 'Žlutý' },
];

export const TEAM_COLORS = [
    { name: 'Alpha', nameCs: 'Alfa', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    { name: 'Bravo', nameCs: 'Bravo', color: 'text-orange-400', bg: 'bg-orange-500/20' },
];

export const REACTION_DIFFICULTIES: ReactionDifficulty[] = [
    {
        id: 'noob', name: 'Noob', nameCs: 'Noob',
        icon: '🟢', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30',
        description: 'Screen turns green → tap! Simple reactions.',
        descriptionCs: 'Obrazovka zezelená → klikni! Čisté reakce.',
        minDelay: 2000, maxDelay: 5000, rounds: 5,
        hasFakeouts: false, hasPatterns: false, hasSequences: false, fakeoutChance: 0,
    },
    {
        id: 'casual', name: 'Casual', nameCs: 'Casual',
        icon: '🟡', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30',
        description: 'Wait for GREEN only — don\'t tap on red or blue!',
        descriptionCs: 'Čekej na ZELENOU — neklikej na červenou nebo modrou!',
        minDelay: 2000, maxDelay: 6000, rounds: 8,
        hasFakeouts: true, hasPatterns: false, hasSequences: false, fakeoutChance: 0.3,
    },
    {
        id: 'pro', name: 'Pro', nameCs: 'Pro',
        icon: '🔴', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30',
        description: 'Number appears → tap the matching zone!',
        descriptionCs: 'Číslo se objeví → klikni na správnou zónu!',
        minDelay: 1500, maxDelay: 5000, rounds: 10,
        hasFakeouts: true, hasPatterns: true, hasSequences: false, fakeoutChance: 0.25,
    },
    {
        id: 'elite', name: 'Elite', nameCs: 'Elite',
        icon: '💀', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30',
        description: 'Rapid sequences, fakeouts, combo chains. Only the elite survive.',
        descriptionCs: 'Rychlé sekvence, fakeouty, combo chainy. Přežijí jen elitní.',
        minDelay: 1000, maxDelay: 4000, rounds: 12,
        hasFakeouts: true, hasPatterns: true, hasSequences: true, fakeoutChance: 0.35,
    },
];

export const MODE_INFO: Record<ReactionMode, { name: string; nameCs: string; icon: string; minPlayers: number; maxPlayers: number; description: string; descriptionCs: string }> = {
    solo: {
        name: 'Solo', nameCs: 'Solo', icon: '👤', minPlayers: 1, maxPlayers: 1,
        description: 'Test your reaction time', descriptionCs: 'Otestuj svůj reakční čas',
    },
    duel: {
        name: 'Duel', nameCs: 'Duel', icon: '⚔️', minPlayers: 2, maxPlayers: 2,
        description: 'Head-to-head — who reacts faster?', descriptionCs: 'Jeden na jednoho — kdo reaguje rychleji?',
    },
    party: {
        name: 'Party', nameCs: 'Párty', icon: '🎉', minPlayers: 2, maxPlayers: 4,
        description: 'Free-for-all up to 4 players!', descriptionCs: 'Všichni proti všem až pro 4 hráče!',
    },
    team: {
        name: 'Team', nameCs: 'Tým', icon: '🤝', minPlayers: 4, maxPlayers: 4,
        description: '2v2 — both teammates must react!', descriptionCs: '2v2 — oba z týmu musí reagovat!',
    },
};

// ─── Skiller Phrases ──────────────────────────────────────────────────

export const SKILLER_PHRASES = {
    gameStart: [
        'Jdeme na to! 🔥', 'Připravte prsty! 👆', 'Kdo bude nejrychlejší? 🤔',
        'Ready... steady... 👀', '3... 2... 1... FOKUS! 🎯',
    ],
    superFast: [ // < 200ms
        'WOOOOW! Pod 200ms! 🔥🔥🔥', 'Jsi STROJ! ⚡', 'To je legit? 😱',
        'Reflexy jako kočka! 🐱', 'Speedrunner detected! 🏎️',
    ],
    fast: [ // 200-350ms
        'Slušný! 💪', 'Solidní reflex! 👍', 'To sednul pěkně! ✨',
        'Tak to je dobrý! 🎯', 'Respekt! 🫡',
    ],
    average: [ // 350-500ms
        'Ujde to 🤷', 'Průměr... ale mohlo bejt hůř 😅', 'Ještě trénuj! 💪',
        'No, aspoň jsi to trefil 😄', 'Čas na kafe? ☕',
    ],
    slow: [ // > 500ms
        'Spaaal jsi? 😴', 'To nebyl internet lag, to jsi ty 😂', 'Pomalejší než moje babička 👵',
        'F v chatu 💀', 'Uf... asi jsi mrknul? 😬',
    ],
    falseStart: [
        'PŘÍLIŠ BRZO! Počkej na signál! 🚨', 'False start! Klid, klid... 😤',
        'Nebuď zbrklej! ⚡', 'Chytrej, ale NE! 🙅', 'Počkej na zelenou, bro! 🔴',
    ],
    fakeoutCaught: [
        'HAHA! Nachytal jsem tě! 😈', 'To byl fakeout, kámo! 🎭',
        'Trpělivost, mladý padawane! 🧘', 'Trap card activated! 🃏',
    ],
    fakeoutAvoided: [
        'Dobrý, nepodlehl jsi! 💎', 'Železné nervy! 🧊', 'Smart! 🧠',
    ],
    roundWin: [
        'BOOM! Nejrychlejší! 🥇', 'Ez clap! 👏', 'Dominance! 💪',
    ],
    roundLose: [
        'Příště budeš rychlejší! 💨', 'Ten druhej měl turbo 🏎️', 'Neva, hoď to za hlavu 🤙',
    ],
    teamModeSync: [
        'Team sync! Oba zmáčkli! 🤝', 'Dobrá spolupráce! 👊', 'Jako jeden muž! 💯',
    ],
    teamModeSlow: [
        'Jeden čeká na druhého... 🐌', 'Komunikujte! 📢', 'Někdo brzdí tým! 😅',
    ],
    lanPromo: [
        'V partě na LANce je všechno lepší. Stavte se s kámošema zahrát si u nás např. CSko! 🎮',
        'Zábava s přáteli na jednom PC? Na našich mašinách si zahrajete ty pravé pecky! 🖥️',
        'Mini-hry jsou fajn, ale ten pravý gaming na vás čeká ve SkillZone. Zastavte se! 🔥',
        'Online je to fajn, ale sedět u nás s partou vedle sebe je prostě jinej level! 💪',
    ],
    gameEnd: [
        'GG! 🎉', 'Skvělá hra! 🏆', 'Ještě jednou? 🔄',
        'To bylo napínavý! 😮', 'Kdo prohrál, platí pivo! 🍺',
    ],
};

// ─── Round Generation ─────────────────────────────────────────────────

const SIGNAL_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#a855f7'];
const GO_COLOR = '#22c55e'; // green = tap!

export function generateRounds(difficulty: ReactionDifficulty, playerCount: number): RoundConfig[] {
    const rounds: RoundConfig[] = [];
    for (let i = 0; i < difficulty.rounds; i++) {
        const delay = difficulty.minDelay + Math.random() * (difficulty.maxDelay - difficulty.minDelay);
        const isFakeout = difficulty.hasFakeouts && Math.random() < difficulty.fakeoutChance;

        let color = GO_COLOR;
        let targetZone: number | undefined;
        let sequence: number[] | undefined;

        if (isFakeout) {
            // Pick a non-green color for the fake signal
            const fakeColors = SIGNAL_COLORS.filter(c => c !== GO_COLOR);
            color = fakeColors[Math.floor(Math.random() * fakeColors.length)];
        }

        if (difficulty.hasPatterns && !isFakeout) {
            targetZone = Math.floor(Math.random() * Math.max(2, playerCount));
        }

        if (difficulty.hasSequences && !isFakeout && Math.random() < 0.3) {
            const seqLen = 2 + Math.floor(Math.random() * 2); // 2-3 taps
            sequence = Array.from({ length: seqLen }, () => Math.floor(Math.random() * Math.max(2, playerCount)));
        }

        rounds.push({
            index: i,
            delay: Math.round(delay),
            isFakeout,
            targetZone,
            color,
            sequence,
        });
    }
    return rounds;
}

// ─── Scoring ──────────────────────────────────────────────────────────

const TIMEOUT_MS = 2000; // max allowed reaction time

export function calculateReactionScore(reactionMs: number, _difficulty: ReactionDifficulty): number {
    if (reactionMs <= 0 || reactionMs > TIMEOUT_MS) return 0;
    // Score: faster = more points, exponential curve
    const normalized = 1 - (reactionMs / TIMEOUT_MS);
    return Math.round(normalized * normalized * 1000);
}

export function getReactionRating(reactionMs: number): 'superFast' | 'fast' | 'average' | 'slow' | 'timeout' {
    if (reactionMs <= 0 || reactionMs > TIMEOUT_MS) return 'timeout';
    if (reactionMs < 200) return 'superFast';
    if (reactionMs < 350) return 'fast';
    if (reactionMs < 500) return 'average';
    return 'slow';
}

export function getSkillerPhrase(event: keyof typeof SKILLER_PHRASES): string {
    const pool = SKILLER_PHRASES[event];
    return pool[Math.floor(Math.random() * pool.length)];
}

export function getReactionSkillerComment(reactionMs: number): string {
    const rating = getReactionRating(reactionMs);
    if (rating === 'timeout') return getSkillerPhrase('slow');
    return getSkillerPhrase(rating);
}

// Should we show a LAN promo? ~15% chance after each round
export function shouldShowLanPromo(): boolean {
    return Math.random() < 0.15;
}

// ─── Fun Comparison Stats ─────────────────────────────────────────────

export interface ReactionBenchmark {
    label: string;
    labelCs: string;
    avgMs: number;
    icon: string;
}

export const REACTION_BENCHMARKS: { category: string; categoryCs: string; items: ReactionBenchmark[] }[] = [
    {
        category: 'Age Groups', categoryCs: 'Věk',
        items: [
            { label: 'Children (6-12)', labelCs: 'Děti (6-12)', avgMs: 320, icon: '👶' },
            { label: 'Teens (13-19)', labelCs: 'Teenageři (13-19)', avgMs: 250, icon: '🧑' },
            { label: 'Adults (20-35)', labelCs: 'Dospělí (20-35)', avgMs: 270, icon: '👨' },
            { label: 'Adults (36-50)', labelCs: 'Dospělí (36-50)', avgMs: 310, icon: '🧔' },
            { label: 'Seniors (50+)', labelCs: 'Senioři (50+)', avgMs: 380, icon: '👴' },
        ],
    },
    {
        category: 'Professions', categoryCs: 'Povolání',
        items: [
            { label: 'Pro gamers', labelCs: 'Pro hráči', avgMs: 170, icon: '🎮' },
            { label: 'Fighter pilots', labelCs: 'Stíhací piloti', avgMs: 180, icon: '✈️' },
            { label: 'F1 drivers', labelCs: 'F1 jezdci', avgMs: 190, icon: '🏎️' },
            { label: 'Athletes', labelCs: 'Sportovci', avgMs: 220, icon: '⚽' },
            { label: 'Surgeons', labelCs: 'Chirurgové', avgMs: 250, icon: '🩺' },
            { label: 'Office workers', labelCs: 'Kancelář', avgMs: 300, icon: '💼' },
            { label: 'Teachers', labelCs: 'Učitelé', avgMs: 290, icon: '📚' },
        ],
    },
    {
        category: 'Animals', categoryCs: 'Zvířata',
        items: [
            { label: 'Fly', labelCs: 'Moucha', avgMs: 25, icon: '🪰' },
            { label: 'Cat', labelCs: 'Kočka', avgMs: 60, icon: '🐱' },
            { label: 'Dog', labelCs: 'Pes', avgMs: 80, icon: '🐕' },
            { label: 'Cheetah', labelCs: 'Gepard', avgMs: 70, icon: '🐆' },
            { label: 'Snake', labelCs: 'Had', avgMs: 50, icon: '🐍' },
            { label: 'Sloth', labelCs: 'Lenochod', avgMs: 700, icon: '🦥' },
            { label: 'Turtle', labelCs: 'Želva', avgMs: 900, icon: '🐢' },
        ],
    },
    {
        category: 'CS2 Ranks', categoryCs: 'CS2 Ranky',
        items: [
            { label: 'Global Elite', labelCs: 'Global Elite', avgMs: 175, icon: '🏆' },
            { label: 'Legendary Eagle', labelCs: 'Legendary Eagle', avgMs: 210, icon: '🦅' },
            { label: 'Gold Nova', labelCs: 'Gold Nova', avgMs: 260, icon: '⭐' },
            { label: 'Silver', labelCs: 'Silver', avgMs: 330, icon: '🥈' },
        ],
    },
];

/**
 * Get comparisons for a given reaction time
 * Returns which benchmarks the player is faster/slower than
 */
export function getReactionComparisons(avgMs: number, cs: boolean): {
    fasterThan: { label: string; icon: string; avgMs: number }[];
    slowerThan: { label: string; icon: string; avgMs: number }[];
    closestMatch: { label: string; icon: string; avgMs: number } | null;
} {
    const all = REACTION_BENCHMARKS.flatMap(cat =>
        cat.items.map(item => ({
            label: cs ? item.labelCs : item.label,
            icon: item.icon,
            avgMs: item.avgMs,
        }))
    );

    const fasterThan = all.filter(b => avgMs < b.avgMs).sort((a, b) => a.avgMs - b.avgMs);
    const slowerThan = all.filter(b => avgMs >= b.avgMs).sort((a, b) => b.avgMs - a.avgMs);

    // Find closest match
    let closestMatch = all[0];
    let closestDiff = Math.abs(avgMs - all[0].avgMs);
    for (const b of all) {
        const diff = Math.abs(avgMs - b.avgMs);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestMatch = b;
        }
    }

    return { fasterThan, slowerThan, closestMatch };
}

// ─── Player Helpers ───────────────────────────────────────────────────

export function createPlayerSlots(mode: ReactionMode, playerCount: number): PlayerSlot[] {
    const count = mode === 'solo' ? 1
        : mode === 'duel' ? 2
            : mode === 'team' ? 4
                : Math.min(Math.max(playerCount, 2), 4);

    return Array.from({ length: count }, (_, i) => ({
        id: i,
        name: `P${i + 1}`,
        key: '',
        color: PLAYER_COLORS[i].hex,
        teamId: mode === 'team' ? (i < 2 ? 0 : 1) : undefined,
        results: [],
        totalReaction: 0,
        bestReaction: Infinity,
        falseStarts: 0,
        score: 0,
    }));
}

// ─── Default Touch Keys ───────────────────────────────────────────────

export const DEFAULT_DESKTOP_KEYS: Record<number, string> = {
    0: ' ',      // Space
    1: 'f',
    2: 'j',
    3: 'k',
};

export function getKeyLabel(key: string): string {
    if (key === ' ') return 'SPACE';
    if (key === 'Enter') return 'ENTER';
    return key.toUpperCase();
}

// ─── Supabase Persistence ─────────────────────────────────────────────

export async function submitReactionScore(entry: ReactionLeaderboardEntry): Promise<boolean> {
    try {
        const sb = getSupabase();
        if (!sb) return false;

        // SECURITY: validate numeric ranges to prevent spoofed entries
        if (entry.score < 0 || entry.score > 50000) return false;
        if (entry.avg_reaction < 10 || entry.avg_reaction > 10000) return false; // <10ms is inhuman
        if (entry.best_reaction < 10 || entry.best_reaction > 10000) return false;
        if (entry.false_starts < 0 || entry.false_starts > 100) return false;
        if (entry.rounds_played < 1 || entry.rounds_played > 50) return false;

        const { error } = await sb.from('web_reaction_leaderboard').insert([{
            player_name: (entry.player_name || 'Anon').trim().slice(0, 20),
            score: entry.score,
            avg_reaction: entry.avg_reaction,
            best_reaction: entry.best_reaction,
            false_starts: entry.false_starts,
            rounds_played: entry.rounds_played,
            difficulty: entry.difficulty,
            mode: entry.mode,
            players_count: entry.players_count,
            input_type: entry.input_type,
        }]);
        return !error;
    } catch (err) {
        console.debug('[Reaction] submitScore failed:', err);
        return false;
    }
}

export async function fetchReactionLeaderboard(
    difficulty?: string,
    mode?: string,
    limit = 15
): Promise<ReactionLeaderboardEntry[]> {
    try {
        const sb = getSupabase();
        if (!sb) return [];
        let query = sb
            .from('web_reaction_leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(limit);

        if (difficulty) query = query.eq('difficulty', difficulty);
        if (mode) query = query.eq('mode', mode);

        const { data } = await query;
        return (data as ReactionLeaderboardEntry[]) || [];
    } catch (err) {
        console.debug('[Reaction] fetchLeaderboard failed:', err);
        return [];
    }
}

// ─── Sound System ─────────────────────────────────────────────────────

const AudioCtx = typeof window !== 'undefined'
    ? (window.AudioContext || (window as any).webkitAudioContext)
    : null;

export function createReactionSoundSystem() {
    let ctx: AudioContext | null = null;
    let enabled = true;

    const getCtx = (): AudioContext | null => {
        if (!enabled) return null;
        if (!ctx && AudioCtx) ctx = new AudioCtx();
        return ctx;
    };

    const playTone = (freq: number, duration: number, type: OscillatorType = 'square', volume = 0.12) => {
        const c = getCtx();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        osc.connect(gain).connect(c.destination);
        osc.start(); osc.stop(c.currentTime + duration);
    };

    return {
        countdown: () => playTone(440, 0.15, 'square', 0.1),
        go: () => { playTone(880, 0.1, 'square', 0.15); playTone(1100, 0.15, 'sine', 0.1); },
        tap: () => playTone(660, 0.08, 'sine', 0.12),
        falseStart: () => { playTone(200, 0.3, 'sawtooth', 0.15); },
        fakeout: () => playTone(300, 0.2, 'triangle', 0.1),
        win: () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.1), 100); setTimeout(() => playTone(784, 0.2), 200); },
        roundEnd: () => playTone(500, 0.15, 'triangle', 0.08),
        toggle: () => { enabled = !enabled; return enabled; },
        isEnabled: () => enabled,
    };
}
