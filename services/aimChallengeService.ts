/**
 * aimChallengeService.ts
 * 
 * Game logic service for Aim Challenge V2:
 * - Seeded PRNG for certified challenges
 * - Deterministic target sequence generation
 * - Per-target stats tracking
 * - Anti-cheat validation
 * - Ghost replay serialization
 * - Supabase persistence
 */

import { getSupabase } from './supabaseClient';

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────

export function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ─── Constants ────────────────────────────────────────────────────────

/** Logical arena size — all coordinates are in this space */
export const ARENA_W = 1280;
export const ARENA_H = 720;

// ─── Types ────────────────────────────────────────────────────────────

export interface DifficultyLevel {
    id: string;
    name: string;
    nameCs: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    targetCount: number;
    targetLifetimeMs: number;
    targetSizeMin: number;
    targetSizeMax: number;
    missPenalty: number;
    description: string;
    descriptionCs: string;
    movingTargets: boolean;
    moveSpeed: number;
    shrinkTargets: boolean;
}

export interface TargetState {
    x: number;
    y: number;
    size: number;
    spawnTime: number;
    id: number;
    vx: number;
    vy: number;
    /** Index in the sequence (0-based) */
    seqIndex: number;
}

export interface TargetHitRecord {
    seqIndex: number;
    targetX: number;
    targetY: number;
    targetSize: number;
    clickX: number;
    clickY: number;
    reactionMs: number;
    distanceFromPrev: number;
    timeSincePrevMs: number;
    result: 'hit' | 'miss_timeout' | 'headshot';
    comboAt: number;
    timestamp: number;
}

export interface MisclickRecord {
    x: number;
    y: number;
    timestamp: number;
    nearestTargetDist: number;
}

export interface GhostFrame {
    t: number;   // ms since game start
    x: number;
    y: number;
    hit: boolean;
}

export interface GameStats {
    score: number;
    hits: number;
    misses: number;
    misclicks: number;
    headshots: number;
    accuracy: number;
    totalTimeMs: number;
    avgReactionMs: number;
    bestReactionMs: number;
    worstReactionMs: number;
    fastestFlicks: number[];  // top 3 fastest reactions
    maxCombo: number;
    avgComboLength: number;
    consistency: number;  // std dev of reaction times (lower = better)
    targetsHit: TargetHitRecord[];
    misclickLog: MisclickRecord[];
}

export interface CertifiedChallenge {
    id: string;
    name: string;
    nameCs: string;
    seed: number;
    difficulty: string;
    icon: string;
    description: string;
    descriptionCs: string;
}

export type InputMode = 'mouse' | 'touch';

export interface LeaderboardEntry {
    id?: number;
    player_name: string;
    score: number;
    accuracy: number;
    avg_reaction: number;
    best_reaction: number;
    worst_reaction: number;
    total_time: number;
    max_combo: number;
    consistency: number;
    misclicks: number;
    headshots: number;
    difficulty: string;
    input_mode: InputMode;
    resolution: string;
    challenge_id: string | null;
    is_suspicious: boolean;
    created_at?: string;
}

// ─── Difficulty Levels ────────────────────────────────────────────────

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
    {
        id: 'silver',
        name: 'Silver',
        nameCs: 'Silver',
        icon: '⭐',
        color: 'text-gray-300',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        targetCount: 15,
        targetLifetimeMs: 3000,
        targetSizeMin: 50,
        targetSizeMax: 70,
        missPenalty: 10,
        description: 'Easy warm-up. Big targets, plenty of time.',
        descriptionCs: 'Zahřátí. Velké terče, hodně času.',
        movingTargets: false,
        moveSpeed: 0,
        shrinkTargets: false,
    },
    {
        id: 'gold_nova',
        name: 'Gold Nova',
        nameCs: 'Gold Nova',
        icon: '🏅',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        targetCount: 20,
        targetLifetimeMs: 2200,
        targetSizeMin: 40,
        targetSizeMax: 60,
        missPenalty: 20,
        description: 'Standard aim practice. This is where it gets real.',
        descriptionCs: 'Standardní trénink. Tady to začíná.',
        movingTargets: false,
        moveSpeed: 0,
        shrinkTargets: false,
    },
    {
        id: 'master_guardian',
        name: 'Master Guardian',
        nameCs: 'Master Guardian',
        icon: '🎖️',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        targetCount: 25,
        targetLifetimeMs: 1800,
        targetSizeMin: 34,
        targetSizeMax: 52,
        missPenalty: 25,
        description: 'Smaller targets that shrink. Prove your skill.',
        descriptionCs: 'Menší zmenšující se terče. Dokaž co umíš.',
        movingTargets: false,
        moveSpeed: 0,
        shrinkTargets: true,
    },
    {
        id: 'legendary_eagle',
        name: 'Legendary Eagle',
        nameCs: 'Legendary Eagle',
        icon: '🦅',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        targetCount: 25,
        targetLifetimeMs: 1500,
        targetSizeMin: 28,
        targetSizeMax: 46,
        missPenalty: 30,
        description: 'Moving targets! Track and click to earn your wings.',
        descriptionCs: 'Pohyblivé terče! Sleduj a klikej.',
        movingTargets: true,
        moveSpeed: 1.5,
        shrinkTargets: true,
    },
    {
        id: 'global_elite',
        name: 'Global Elite',
        nameCs: 'Global Elite',
        icon: '🌍',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        targetCount: 30,
        targetLifetimeMs: 1200,
        targetSizeMin: 22,
        targetSizeMax: 38,
        missPenalty: 40,
        description: 'Tiny, fast, moving targets. Only the elite survive.',
        descriptionCs: 'Maličké, rychlé, pohyblivé. Přežijí jen elitní.',
        movingTargets: true,
        moveSpeed: 2.5,
        shrinkTargets: true,
    },
];

// ─── Certified Challenges ────────────────────────────────────────────

export const CERTIFIED_CHALLENGES: CertifiedChallenge[] = [
    {
        id: 'cert_precision',
        name: 'Precision Protocol',
        nameCs: 'Protokol přesnosti',
        seed: 42_420_69,
        difficulty: 'gold_nova',
        icon: '🎯',
        description: '20 targets, same every time. Beat your ghost!',
        descriptionCs: '20 terčů, vždy stejné. Překonej svůj stín!',
    },
    {
        id: 'cert_blitz',
        name: 'Blitz Rush',
        nameCs: 'Bleskový útok',
        seed: 13_37_007,
        difficulty: 'master_guardian',
        icon: '⚡',
        description: 'Shrinking targets, fixed pattern. Speed is key!',
        descriptionCs: 'Zmenšující se terče, fixní vzor. Rychlost je klíč!',
    },
    {
        id: 'cert_eagle_eye',
        name: 'Eagle Eye',
        nameCs: 'Orlí zrak',
        seed: 99_887_766,
        difficulty: 'legendary_eagle',
        icon: '🦅',
        description: 'Moving targets, same trajectory. Master the pattern!',
        descriptionCs: 'Pohyblivé terče, stejná dráha. Ovládni vzor!',
    },
];

// ─── Target Sequence Generator ───────────────────────────────────────

export interface PrecomputedTarget {
    x: number;
    y: number;
    size: number;
    vx: number;
    vy: number;
}

/**
 * Generate a deterministic sequence of target positions for a given seed + difficulty.
 * Uses the normalized arena coordinates (ARENA_W × ARENA_H).
 */
export function generateTargetSequence(
    difficulty: DifficultyLevel,
    seed: number | null
): PrecomputedTarget[] {
    const rng = seed !== null ? mulberry32(seed) : () => Math.random();
    const targets: PrecomputedTarget[] = [];
    const padding = 40; // keep away from edges

    for (let i = 0; i < difficulty.targetCount; i++) {
        const size = Math.round(
            difficulty.targetSizeMin + rng() * (difficulty.targetSizeMax - difficulty.targetSizeMin)
        );
        const x = Math.round(padding + rng() * (ARENA_W - size - padding * 2));
        const y = Math.round(padding + rng() * (ARENA_H - size - padding * 2));

        let vx = 0, vy = 0;
        if (difficulty.movingTargets) {
            const angle = rng() * Math.PI * 2;
            vx = Math.cos(angle) * difficulty.moveSpeed;
            vy = Math.sin(angle) * difficulty.moveSpeed;
        }

        targets.push({ x, y, size, vx, vy });
    }

    return targets;
}

// ─── Stats Calculator ─────────────────────────────────────────────────

export function calculateStats(
    hitRecords: TargetHitRecord[],
    misclickLog: MisclickRecord[],
    totalTargets: number,
    totalTimeMs: number,
    maxCombo: number,
    score: number
): GameStats {
    const hits = hitRecords.filter(r => r.result === 'hit' || r.result === 'headshot');
    const headshots = hitRecords.filter(r => r.result === 'headshot');
    const misses = hitRecords.filter(r => r.result === 'miss_timeout');
    const reactionTimes = hits.map(h => h.reactionMs);

    const avgReaction = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

    const bestReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
    const worstReaction = reactionTimes.length > 0 ? Math.max(...reactionTimes) : 0;

    // Fastest 3 flicks
    const fastestFlicks = [...reactionTimes].sort((a, b) => a - b).slice(0, 3);

    // Consistency (standard deviation)
    let consistency = 0;
    if (reactionTimes.length > 1) {
        const mean = avgReaction;
        const variance = reactionTimes.reduce((sum, t) => sum + (t - mean) ** 2, 0) / reactionTimes.length;
        consistency = Math.round(Math.sqrt(variance));
    }

    // Average combo length — calculate streaks
    let comboLengths: number[] = [];
    let currentStreak = 0;
    for (const r of hitRecords) {
        if (r.result === 'hit' || r.result === 'headshot') {
            currentStreak++;
        } else {
            if (currentStreak > 0) comboLengths.push(currentStreak);
            currentStreak = 0;
        }
    }
    if (currentStreak > 0) comboLengths.push(currentStreak);
    const avgComboLength = comboLengths.length > 0
        ? Math.round((comboLengths.reduce((a, b) => a + b, 0) / comboLengths.length) * 10) / 10
        : 0;

    return {
        score,
        hits: hits.length,
        misses: misses.length,
        misclicks: misclickLog.length,
        headshots: headshots.length,
        accuracy: totalTargets > 0 ? Math.round((hits.length / totalTargets) * 100) : 0,
        totalTimeMs,
        avgReactionMs: avgReaction,
        bestReactionMs: bestReaction,
        worstReactionMs: worstReaction,
        fastestFlicks,
        maxCombo,
        avgComboLength,
        consistency,
        targetsHit: hitRecords,
        misclickLog,
    };
}

// ─── Anti-Cheat Validator ─────────────────────────────────────────────

export interface AntiCheatResult {
    suspicious: boolean;
    flags: string[];
    severity: 'clean' | 'warn' | 'flagged';
}

export function validateAntiCheat(
    stats: GameStats,
    difficulty: DifficultyLevel,
    mouseMovements: Array<{ t: number; x: number; y: number }>,
): AntiCheatResult {
    const flags: string[] = [];

    const hitReactions = stats.targetsHit
        .filter(r => r.result === 'hit' || r.result === 'headshot')
        .map(r => r.reactionMs);

    // 1. Inhuman reaction times
    if (hitReactions.length > 3) {
        const median = hitReactions.sort((a, b) => a - b)[Math.floor(hitReactions.length / 2)];
        if (median < 80) {
            flags.push('INHUMAN_REACTIONS');
        }
    }

    // 2. Perfect accuracy + speed on hard difficulties
    const hardDifficulties = ['legendary_eagle', 'global_elite'];
    if (hardDifficulties.includes(difficulty.id) && stats.accuracy === 100 && stats.avgReactionMs < 150) {
        flags.push('PERFECT_HARD_RUN');
    }

    // 3. Click timing variance too low (robotic)
    if (hitReactions.length > 5) {
        const mean = hitReactions.reduce((a, b) => a + b, 0) / hitReactions.length;
        const variance = hitReactions.reduce((s, t) => s + (t - mean) ** 2, 0) / hitReactions.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev < 15 && mean < 200) {
            flags.push('ROBOTIC_TIMING');
        }
    }

    // 4. Mouse movement analysis — check for unnaturally linear paths
    if (mouseMovements.length > 20) {
        let linearSegments = 0;
        let totalSegments = 0;
        for (let i = 2; i < mouseMovements.length; i++) {
            const p0 = mouseMovements[i - 2];
            const p1 = mouseMovements[i - 1];
            const p2 = mouseMovements[i];
            const dt = p2.t - p0.t;
            if (dt < 5) continue; // skip same-frame

            // Cross product = 0 means perfectly collinear
            const cross = Math.abs(
                (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x)
            );
            totalSegments++;
            if (cross < 2) linearSegments++;
        }
        if (totalSegments > 10 && linearSegments / totalSegments > 0.85) {
            flags.push('LINEAR_MOUSE');
        }
    }

    // 5. Zero misclicks on hard difficulty with high speed
    if (hardDifficulties.includes(difficulty.id) && stats.misclicks === 0 && stats.accuracy === 100 && stats.avgReactionMs < 200) {
        flags.push('ZERO_MISCLICK_HARD');
    }

    const severity: AntiCheatResult['severity'] =
        flags.length >= 3 ? 'flagged' :
            flags.length >= 1 ? 'warn' :
                'clean';

    return {
        suspicious: flags.length > 0,
        flags,
        severity,
    };
}

// ─── Input Mode Detection ─────────────────────────────────────────────

export function detectInputMode(): InputMode {
    if (typeof window === 'undefined') return 'mouse';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Also check if it's a real mobile device (not just a laptop with touch screen)
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return (isTouch && isMobileUA) ? 'touch' : 'mouse';
}

export function getResolutionLabel(): string {
    const w = window.screen.width;
    const h = window.screen.height;
    if (w >= 3840) return '4K';
    if (w >= 2560) return '2K';
    if (w >= 1920) return 'FHD';
    if (w >= 1366) return 'HD+';
    return `${w}×${h}`;
}

export function getResolutionString(): string {
    return `${window.screen.width}x${window.screen.height}`;
}

// ─── Ghost Replay ─────────────────────────────────────────────────────

export function serializeGhost(frames: GhostFrame[]): string {
    // Compact format: downsample to every 50ms
    const sampled: GhostFrame[] = [];
    let lastT = -100;
    for (const f of frames) {
        if (f.t - lastT >= 50 || f.hit) {
            sampled.push(f);
            lastT = f.t;
        }
    }
    return JSON.stringify(sampled);
}

export function deserializeGhost(data: string | null): GhostFrame[] {
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

/** Load the player's best ghost for a specific challenge from localStorage */
export function loadGhost(challengeId: string): GhostFrame[] {
    try {
        const raw = localStorage.getItem(`aim_ghost_${challengeId}`);
        return deserializeGhost(raw);
    } catch {
        return [];
    }
}

/** Save ghost if this run improved the player's score */
export function saveGhost(challengeId: string, frames: GhostFrame[], score: number): void {
    try {
        const prevScore = parseInt(localStorage.getItem(`aim_ghost_score_${challengeId}`) || '0', 10);
        if (score > prevScore) {
            localStorage.setItem(`aim_ghost_${challengeId}`, serializeGhost(frames));
            localStorage.setItem(`aim_ghost_score_${challengeId}`, String(score));
        }
    } catch {
        // localStorage full or unavailable
    }
}

// ─── Rank Evaluation ──────────────────────────────────────────────────

export function getRank(score: number, diffId: string) {
    const multiplier = diffId === 'silver' ? 0.6
        : diffId === 'gold_nova' ? 0.8
            : diffId === 'master_guardian' ? 1
                : diffId === 'legendary_eagle' ? 1.2
                    : 1.5;
    const s = score / multiplier;
    if (s >= 2800) return { title: 'GLOBAL ELITE', titleCs: 'GLOBAL ELITE', color: 'text-yellow-400', glow: 'shadow-yellow-500/50', icon: '👑' };
    if (s >= 2200) return { title: 'SUPREME', titleCs: 'SUPREME', color: 'text-purple-400', glow: 'shadow-purple-500/50', icon: '🏅' };
    if (s >= 1600) return { title: 'EAGLE', titleCs: 'OREL', color: 'text-blue-400', glow: 'shadow-blue-500/50', icon: '🎖️' };
    if (s >= 1000) return { title: 'AK MASTER', titleCs: 'AK MASTER', color: 'text-green-400', glow: 'shadow-green-500/50', icon: '🎯' };
    if (s >= 500) return { title: 'SILVER', titleCs: 'SILVER', color: 'text-gray-400', glow: 'shadow-gray-500/50', icon: '🎯' };
    return { title: 'RECRUIT', titleCs: 'REKRUT', color: 'text-gray-600', glow: '', icon: '🎯' };
}

// ─── Touch Mode Difficulty Adjustment ─────────────────────────────────

export function getTouchAdjustedDifficulty(d: DifficultyLevel): DifficultyLevel {
    return {
        ...d,
        targetSizeMin: Math.round(d.targetSizeMin * 1.15),
        targetSizeMax: Math.round(d.targetSizeMax * 1.15),
        targetLifetimeMs: d.targetLifetimeMs + 200,
    };
}

// ─── Supabase Persistence ─────────────────────────────────────────────

export async function submitScore(entry: LeaderboardEntry): Promise<boolean> {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        const { error } = await sb.from('web_leaderboard').insert([{
            player_name: entry.player_name,
            score: entry.score,
            accuracy: entry.accuracy,
            avg_reaction: entry.avg_reaction,
            best_reaction: entry.best_reaction,
            worst_reaction: entry.worst_reaction,
            total_time: entry.total_time,
            max_combo: entry.max_combo,
            consistency: entry.consistency,
            misclicks: entry.misclicks,
            headshots: entry.headshots,
            difficulty: entry.difficulty,
            input_mode: entry.input_mode,
            resolution: entry.resolution,
            challenge_id: entry.challenge_id,
            is_suspicious: entry.is_suspicious,
        }]);
        return !error;
    } catch {
        return false;
    }
}

export async function fetchLeaderboard(
    inputMode: InputMode,
    difficulty?: string,
    challengeId?: string | null,
    limit = 10
): Promise<LeaderboardEntry[]> {
    try {
        const sb = getSupabase();
        if (!sb) return [];
        let query = sb
            .from('web_leaderboard')
            .select('*')
            .eq('input_mode', inputMode)
            .eq('is_suspicious', false)
            .order('score', { ascending: false })
            .limit(limit);

        if (difficulty) query = query.eq('difficulty', difficulty);
        if (challengeId) query = query.eq('challenge_id', challengeId);

        const { data } = await query;
        return (data as LeaderboardEntry[]) || [];
    } catch {
        return [];
    }
}

// ─── Sound System ─────────────────────────────────────────────────────

const AudioCtx = typeof window !== 'undefined'
    ? (window.AudioContext || (window as any).webkitAudioContext)
    : null;

export function createSoundSystem() {
    let ctx: AudioContext | null = null;
    let enabled = true;

    const getCtx = () => {
        if (!ctx && AudioCtx) ctx = new AudioCtx();
        return ctx;
    };

    const playTone = (freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) => {
        if (!enabled) return;
        const c = getCtx();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        osc.connect(gain).connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    };

    return {
        hit: () => {
            playTone(880, 0.08, 'square', 0.12);
            setTimeout(() => playTone(1320, 0.06, 'square', 0.08), 40);
        },
        miss: () => playTone(200, 0.15, 'sawtooth', 0.1),
        misclick: () => playTone(150, 0.1, 'triangle', 0.06),
        countdown: () => playTone(440, 0.12, 'sine', 0.1),
        countdownGo: () => {
            playTone(880, 0.1, 'square', 0.15);
            setTimeout(() => playTone(1760, 0.15, 'square', 0.12), 80);
        },
        levelUp: () => {
            [0, 80, 160, 240].forEach((d, i) =>
                setTimeout(() => playTone(440 + i * 220, 0.12, 'square', 0.1), d)
            );
        },
        rankReveal: () => {
            [0, 100, 200, 300, 400].forEach((d, i) =>
                setTimeout(() => playTone(330 + i * 110, 0.15, 'sine', 0.12), d)
            );
        },
        headshot: () => {
            playTone(1200, 0.05, 'square', 0.18);
            setTimeout(() => playTone(1800, 0.08, 'square', 0.12), 30);
            setTimeout(() => playTone(2400, 0.06, 'sine', 0.06), 60);
        },
        toggle: () => { enabled = !enabled; return enabled; },
        isEnabled: () => enabled,
    };
}
