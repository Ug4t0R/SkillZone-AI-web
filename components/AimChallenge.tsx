import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Volume2, VolumeX, ChevronDown, Monitor, Smartphone, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
    ARENA_W, ARENA_H,
    DIFFICULTY_LEVELS, CERTIFIED_CHALLENGES,
    type DifficultyLevel, type TargetState, type TargetHitRecord, type MisclickRecord,
    type GhostFrame, type GameStats, type InputMode, type LeaderboardEntry, type CertifiedChallenge,
    type PrecomputedTarget,
    generateTargetSequence, calculateStats, validateAntiCheat,
    detectInputMode, getResolutionLabel, getResolutionString,
    loadGhost, saveGhost, getRank, getTouchAdjustedDifficulty,
    submitScore, fetchLeaderboard, createSoundSystem,
} from '../services/aimChallengeService';

// ─── Singleton sound system ──────────────────────────────────────────
const sfx = createSoundSystem();

// ─── Game Phase ──────────────────────────────────────────────────────
type GamePhase = 'menu' | 'countdown' | 'playing' | 'results';

// ─── Component ───────────────────────────────────────────────────────

const AimChallenge: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { language } = useAppContext();
    const cs = language === 'cs';

    // ─── Input mode ─────────────────────────────────────────────────
    const inputMode = useMemo<InputMode>(() => detectInputMode(), []);
    const resLabel = useMemo(() => getResolutionLabel(), []);
    const resString = useMemo(() => getResolutionString(), []);

    // ─── State ──────────────────────────────────────────────────────
    const [phase, setPhase] = useState<GamePhase>('menu');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>(DIFFICULTY_LEVELS[1]);
    const [activeCertified, setActiveCertified] = useState<CertifiedChallenge | null>(null);
    const [countdown, setCountdown] = useState(3);
    const [target, setTarget] = useState<TargetState | null>(null);
    const [score, setScore] = useState(0);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    const [missclicks, setMissclicks] = useState(0);
    const [targetsShown, setTargetsShown] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [headshots, setHeadshots] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
    const [showCertified, setShowCertified] = useState(false);
    const [gameStats, setGameStats] = useState<GameStats | null>(null);
    const [gameStartTime, setGameStartTime] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardTab, setLeaderboardTab] = useState<InputMode>(inputMode);
    const [showStats, setShowStats] = useState(false);
    const [ghostFrames, setGhostFrames] = useState<GhostFrame[]>([]);
    const [currentGhostPos, setCurrentGhostPos] = useState<{ x: number; y: number } | null>(null);
    const [floatingScores, setFloatingScores] = useState<Array<{ id: number; x: number; y: number; points: number; ring: string; ts: number }>>([]);
    const floatIdRef = useRef(0);

    // ─── Refs ───────────────────────────────────────────────────────
    const arenaRef = useRef<HTMLDivElement>(null);
    const targetRef = useRef<TargetState | null>(null);
    const phaseRef = useRef<GamePhase>('menu');
    const targetsShownRef = useRef(0);
    const difficultyRef = useRef(difficulty);
    const scoreRef = useRef(0);
    const hitsRef = useRef(0);
    const missesRef = useRef(0);
    const comboRef = useRef(0);
    const maxComboRef = useRef(0);
    const headshotsRef = useRef(0);
    const animFrameRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hitRecordsRef = useRef<TargetHitRecord[]>([]);
    const misclickLogRef = useRef<MisclickRecord[]>([]);
    const mouseLogRef = useRef<Array<{ t: number; x: number; y: number }>>([]);
    const ghostInputRef = useRef<GhostFrame[]>([]);
    const gameStartRef = useRef(0);
    const lastTargetPosRef = useRef<{ x: number; y: number } | null>(null);
    const lastTargetTimeRef = useRef(0);
    const sequenceRef = useRef<PrecomputedTarget[]>([]);
    const seqIndexRef = useRef(0);

    // ─── Sync state → refs ──────────────────────────────────────────
    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
    useEffect(() => { targetRef.current = target; }, [target]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { hitsRef.current = hits; }, [hits]);
    useEffect(() => { missesRef.current = misses; }, [misses]);
    useEffect(() => { targetsShownRef.current = targetsShown; }, [targetsShown]);
    useEffect(() => { comboRef.current = combo; }, [combo]);
    useEffect(() => { maxComboRef.current = maxCombo; }, [maxCombo]);
    useEffect(() => { headshotsRef.current = headshots; }, [headshots]);

    // ─── Lock body scroll ───────────────────────────────────────────
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // ─── Log mouse movement for anti-cheat ──────────────────────────
    useEffect(() => {
        if (phase !== 'playing') return;
        const handler = (e: MouseEvent) => {
            mouseLogRef.current.push({
                t: Date.now() - gameStartRef.current,
                x: e.clientX,
                y: e.clientY,
            });
            // Keep max 2000 samples
            if (mouseLogRef.current.length > 2000) {
                mouseLogRef.current = mouseLogRef.current.slice(-1000);
            }
        };
        window.addEventListener('mousemove', handler, { passive: true });
        return () => window.removeEventListener('mousemove', handler);
    }, [phase]);

    // ─── Tab visibility — pause when hidden ─────────────────────────
    useEffect(() => {
        if (phase !== 'playing') return;
        const handler = () => {
            if (document.hidden && phaseRef.current === 'playing') {
                // Don't pause, but flag it for anti-cheat awareness
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [phase]);

    // ─── Moving target animation ────────────────────────────────────
    useEffect(() => {
        if (phase !== 'playing' || !difficulty.movingTargets) return;

        const animate = () => {
            setTarget(prev => {
                if (!prev) return prev;
                let { x, y, vx, vy, size } = prev;

                x += vx;
                y += vy;

                // Bounce off walls (logical arena coords)
                if (x <= 10 || x + size >= ARENA_W - 10) vx = -vx;
                if (y <= 10 || y + size >= ARENA_H - 10) vy = -vy;

                x = Math.max(10, Math.min(x, ARENA_W - size - 10));
                y = Math.max(10, Math.min(y, ARENA_H - size - 10));

                return { ...prev, x, y, vx, vy };
            });
            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [phase, difficulty.movingTargets]);

    // ─── Ghost playback ─────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'playing' || ghostFrames.length === 0) return;

        let frameIdx = 0;
        const interval = setInterval(() => {
            const elapsed = Date.now() - gameStartRef.current;
            while (frameIdx < ghostFrames.length && ghostFrames[frameIdx].t <= elapsed) {
                frameIdx++;
            }
            if (frameIdx > 0 && frameIdx <= ghostFrames.length) {
                const f = ghostFrames[frameIdx - 1];
                setCurrentGhostPos({ x: f.x, y: f.y });
            }
            if (frameIdx >= ghostFrames.length) {
                clearInterval(interval);
                setCurrentGhostPos(null);
            }
        }, 50);

        return () => { clearInterval(interval); setCurrentGhostPos(null); };
    }, [phase, ghostFrames]);

    // ─── End game ───────────────────────────────────────────────────
    const endGame = useCallback(() => {
        const totalTimeMs = Date.now() - gameStartRef.current;
        setPhase('results');

        const stats = calculateStats(
            hitRecordsRef.current,
            misclickLogRef.current,
            difficultyRef.current.targetCount,
            totalTimeMs,
            maxComboRef.current,
            scoreRef.current,
        );

        // Anti-cheat
        const antiCheat = validateAntiCheat(stats, difficultyRef.current, mouseLogRef.current);
        if (antiCheat.suspicious) {
            (stats as any)._antiCheat = antiCheat;
        }

        setGameStats(stats);
        sfx.rankReveal();

        // Save ghost for certified challenge
        if (activeCertified) {
            saveGhost(activeCertified.id, ghostInputRef.current, scoreRef.current);
        }

        // Load leaderboard
        fetchLeaderboard(inputMode, difficultyRef.current.id, activeCertified?.id || null)
            .then(setLeaderboard)
            .catch(() => { });
    }, [inputMode, activeCertified]);

    // ─── Spawn Target ───────────────────────────────────────────────
    const spawnTarget = useCallback(() => {
        const d = difficultyRef.current;
        const idx = seqIndexRef.current;

        if (idx >= d.targetCount) {
            endGame();
            return;
        }

        const seq = sequenceRef.current;
        const precomputed = seq[idx];
        if (!precomputed) {
            endGame();
            return;
        }

        const newTarget: TargetState = {
            x: precomputed.x,
            y: precomputed.y,
            size: precomputed.size,
            vx: precomputed.vx,
            vy: precomputed.vy,
            spawnTime: Date.now(),
            id: idx,
            seqIndex: idx,
        };

        setTarget(newTarget);
        targetRef.current = newTarget;
        seqIndexRef.current = idx + 1;
        setTargetsShown(idx + 1);
        targetsShownRef.current = idx + 1;

        // Auto-miss timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (phaseRef.current !== 'playing') return;

            sfx.miss();
            setMisses(prev => prev + 1);
            missesRef.current += 1;
            setCombo(0);
            comboRef.current = 0;
            setScore(prev => Math.max(0, prev - d.missPenalty));
            scoreRef.current = Math.max(0, scoreRef.current - d.missPenalty);

            // Record miss
            const now = Date.now();
            hitRecordsRef.current.push({
                seqIndex: idx,
                targetX: precomputed.x,
                targetY: precomputed.y,
                targetSize: precomputed.size,
                clickX: -1,
                clickY: -1,
                reactionMs: d.targetLifetimeMs,
                distanceFromPrev: lastTargetPosRef.current
                    ? Math.hypot(precomputed.x - lastTargetPosRef.current.x, precomputed.y - lastTargetPosRef.current.y)
                    : 0,
                timeSincePrevMs: lastTargetTimeRef.current ? now - lastTargetTimeRef.current : 0,
                result: 'miss_timeout',
                comboAt: 0,
                timestamp: now,
            });

            lastTargetPosRef.current = { x: precomputed.x, y: precomputed.y };
            lastTargetTimeRef.current = now;

            setTarget(null);
            targetRef.current = null;

            if (seqIndexRef.current >= d.targetCount) {
                endGame();
            } else {
                setTimeout(() => spawnTarget(), 150);
            }
        }, d.targetLifetimeMs);
    }, [endGame]);

    // ─── Start Game ─────────────────────────────────────────────────
    const startGame = useCallback((cert?: CertifiedChallenge) => {
        let diff = difficulty;
        let seed: number | null = null;

        if (cert) {
            setActiveCertified(cert);
            const certDiff = DIFFICULTY_LEVELS.find(d => d.id === cert.difficulty) || DIFFICULTY_LEVELS[1];
            diff = certDiff;
            setDifficulty(certDiff);
            difficultyRef.current = certDiff;
            seed = cert.seed;

            // Load ghost for this challenge
            const ghost = loadGhost(cert.id);
            setGhostFrames(ghost);
        } else {
            setActiveCertified(null);
            setGhostFrames([]);
        }

        // Apply touch adjustments
        const actualDiff = inputMode === 'touch' ? getTouchAdjustedDifficulty(diff) : diff;
        setDifficulty(actualDiff);
        difficultyRef.current = actualDiff;

        // Generate target sequence
        const seq = generateTargetSequence(actualDiff, seed);
        sequenceRef.current = seq;
        seqIndexRef.current = 0;

        // Reset all state
        setPhase('countdown');
        setScore(0); scoreRef.current = 0;
        setHits(0); hitsRef.current = 0;
        setMisses(0); missesRef.current = 0;
        setMissclicks(0);
        setHeadshots(0); headshotsRef.current = 0;
        setTargetsShown(0); targetsShownRef.current = 0;
        setSubmitted(false);
        setCombo(0); comboRef.current = 0;
        setMaxCombo(0); maxComboRef.current = 0;
        setCountdown(3);
        setTarget(null); targetRef.current = null;
        setGameStats(null);
        setShowLeaderboard(false);
        setShowStats(false);
        hitRecordsRef.current = [];
        misclickLogRef.current = [];
        mouseLogRef.current = [];
        ghostInputRef.current = [];
        lastTargetPosRef.current = null;
        lastTargetTimeRef.current = 0;
    }, [difficulty, inputMode]);

    // ─── Countdown ──────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'countdown') return;
        if (countdown <= 0) {
            sfx.countdownGo();
            setPhase('playing');
            const now = Date.now();
            setGameStartTime(now);
            gameStartRef.current = now;
            return;
        }
        sfx.countdown();
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, countdown]);

    // Spawn first target AFTER arena is rendered
    useEffect(() => {
        if (phase !== 'playing') return;
        const t = setTimeout(() => spawnTarget(), 50);
        return () => clearTimeout(t);
    }, [phase, spawnTarget]);

    // ─── Handle Hit ─────────────────────────────────────────────────
    const handleHit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const t = targetRef.current;
        if (!t || phaseRef.current !== 'playing') return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const now = Date.now();
        const reaction = now - t.spawnTime;
        const d = difficultyRef.current;

        // Distance from center for ring-based scoring
        const arenaEl = arenaRef.current;
        let clickArenaX = 0, clickArenaY = 0;
        if (arenaEl) {
            const rect = arenaEl.getBoundingClientRect();
            const scaleX = ARENA_W / rect.width;
            const scaleY = ARENA_H / rect.height;
            clickArenaX = (e.clientX - rect.left) * scaleX;
            clickArenaY = (e.clientY - rect.top) * scaleY;
        }
        const currentSize = d.shrinkTargets ? t.size * (1 - ((now - t.spawnTime) / d.targetLifetimeMs) * 0.6) : t.size;
        const centerX = t.x + currentSize / 2;
        const centerY = t.y + currentSize / 2;
        const distFromCenter = Math.hypot(clickArenaX - centerX, clickArenaY - centerY);
        const radius = currentSize / 2;
        const normalizedDist = Math.min(distFromCenter / radius, 1);

        // Ring scoring: bullseye (<30%) = 2×, middle (30-70%) = 1.5×, outer = 1×
        let accuracyMultiplier = 1.0;
        let ringLabel = 'OUTER';
        const isHeadshot = normalizedDist < 0.3;
        if (isHeadshot) { accuracyMultiplier = 2.0; ringLabel = '💀 BULLSEYE'; }
        else if (normalizedDist < 0.7) { accuracyMultiplier = 1.5; ringLabel = 'INNER'; }

        // Score calculation
        const timeFactor = Math.max(0, 1 - reaction / d.targetLifetimeMs);
        const sizeFactor = 1 - (t.size - d.targetSizeMin) / (d.targetSizeMax - d.targetSizeMin + 1);
        const basePoints = Math.round((100 * timeFactor + 50 * sizeFactor) * accuracyMultiplier);
        const newCombo = comboRef.current + 1;
        const comboBonus = Math.min(newCombo * 5, 50);
        const totalPoints = basePoints + comboBonus;

        if (isHeadshot) { sfx.headshot(); setHeadshots(prev => prev + 1); headshotsRef.current += 1; }
        else sfx.hit();

        // Floating score popup
        const fid = ++floatIdRef.current;
        setFloatingScores(prev => [...prev, { id: fid, x: clickArenaX, y: clickArenaY, points: totalPoints, ring: ringLabel, ts: Date.now() }]);
        setTimeout(() => setFloatingScores(prev => prev.filter(f => f.id !== fid)), 900);

        setScore(prev => prev + totalPoints);
        scoreRef.current += totalPoints;
        setHits(prev => prev + 1);
        hitsRef.current += 1;
        setCombo(newCombo);
        comboRef.current = newCombo;
        if (newCombo > maxComboRef.current) {
            setMaxCombo(newCombo);
            maxComboRef.current = newCombo;
        }

        // Reuse click coordinates already computed above
        const clickX = Math.round(clickArenaX);
        const clickY = Math.round(clickArenaY);

        // Record hit
        hitRecordsRef.current.push({
            seqIndex: t.seqIndex,
            targetX: t.x,
            targetY: t.y,
            targetSize: t.size,
            clickX,
            clickY,
            reactionMs: reaction,
            distanceFromPrev: lastTargetPosRef.current
                ? Math.hypot(t.x - lastTargetPosRef.current.x, t.y - lastTargetPosRef.current.y)
                : 0,
            timeSincePrevMs: lastTargetTimeRef.current ? now - lastTargetTimeRef.current : 0,
            result: isHeadshot ? 'headshot' : 'hit',
            comboAt: newCombo,
            timestamp: now,
        });

        // Ghost recording
        ghostInputRef.current.push({
            t: now - gameStartRef.current,
            x: clickX,
            y: clickY,
            hit: true,
        });

        lastTargetPosRef.current = { x: t.x, y: t.y };
        lastTargetTimeRef.current = now;

        setTarget(null);
        targetRef.current = null;

        if (seqIndexRef.current >= d.targetCount) {
            endGame();
        } else {
            setTimeout(() => spawnTarget(), 150);
        }
    }, [spawnTarget, endGame]);

    // ─── Handle Misclick ────────────────────────────────────────────
    const handleMisclick = useCallback((e: React.MouseEvent) => {
        if (phaseRef.current !== 'playing' || !targetRef.current) return;
        sfx.misclick();
        setMissclicks(prev => prev + 1);

        const arenaEl = arenaRef.current;
        if (arenaEl) {
            const rect = arenaEl.getBoundingClientRect();
            const scaleX = ARENA_W / rect.width;
            const scaleY = ARENA_H / rect.height;
            const x = Math.round((e.clientX - rect.left) * scaleX);
            const y = Math.round((e.clientY - rect.top) * scaleY);
            const t = targetRef.current;
            const dist = t ? Math.hypot(x - (t.x + t.size / 2), y - (t.y + t.size / 2)) : 999;
            misclickLogRef.current.push({ x, y, timestamp: Date.now(), nearestTargetDist: dist });
        }
    }, []);

    // ─── Submit Score ───────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (!gameStats || submitted || !playerName.trim()) return;

        const antiCheat = (gameStats as any)._antiCheat;
        const isSuspicious = antiCheat?.severity === 'flagged';

        const entry: LeaderboardEntry = {
            player_name: playerName.trim(),
            score: gameStats.score,
            accuracy: gameStats.accuracy,
            avg_reaction: gameStats.avgReactionMs,
            best_reaction: gameStats.bestReactionMs,
            worst_reaction: gameStats.worstReactionMs,
            total_time: Math.round(gameStats.totalTimeMs / 100) / 10,
            max_combo: gameStats.maxCombo,
            consistency: gameStats.consistency,
            misclicks: gameStats.misclicks,
            headshots: gameStats.headshots,
            difficulty: difficulty.id,
            input_mode: inputMode,
            resolution: resString,
            challenge_id: activeCertified?.id || null,
            is_suspicious: isSuspicious,
        };

        const ok = await submitScore(entry);
        if (ok) {
            setSubmitted(true);
            sfx.levelUp();
            fetchLeaderboard(inputMode, difficulty.id, activeCertified?.id || null)
                .then(setLeaderboard)
                .catch(() => { });
        }
    }, [gameStats, submitted, playerName, difficulty, inputMode, resString, activeCertified]);

    // ─── Load leaderboard on tab change ─────────────────────────────
    useEffect(() => {
        if (!showLeaderboard) return;
        fetchLeaderboard(leaderboardTab, undefined, undefined, 15)
            .then(setLeaderboard)
            .catch(() => { });
    }, [showLeaderboard, leaderboardTab]);

    // ─── Arena Scale ────────────────────────────────────────────────
    const [arenaScale, setArenaScale] = useState(1);
    useEffect(() => {
        const calc = () => {
            const padX = 20, padY = 80; // padding for HUD
            const maxW = window.innerWidth - padX * 2;
            const maxH = window.innerHeight - padY * 2;
            setArenaScale(Math.min(maxW / ARENA_W, maxH / ARENA_H, 1.5));
        };
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    // ─── Shrink animation ───────────────────────────────────────────
    const [shrinkProgress, setShrinkProgress] = useState(0);
    useEffect(() => {
        if (phase !== 'playing' || !target || !difficulty.shrinkTargets) {
            setShrinkProgress(0);
            return;
        }
        const start = target.spawnTime;
        const dur = difficulty.targetLifetimeMs;
        const tick = () => {
            const elapsed = Date.now() - start;
            setShrinkProgress(Math.min(elapsed / dur, 1));
            if (elapsed < dur && phaseRef.current === 'playing') {
                requestAnimationFrame(tick);
            }
        };
        const frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [phase, target, difficulty.shrinkTargets, difficulty.targetLifetimeMs]);

    // ─── Rank ───────────────────────────────────────────────────────
    const rank = gameStats ? getRank(gameStats.score, difficulty.id) : null;
    const effectiveDiff = inputMode === 'touch' ? getTouchAdjustedDifficulty(difficulty) : difficulty;

    // ─── RENDER ─────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
            style={{ cursor: phase === 'playing' ? 'crosshair' : 'default' }}>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => { const en = sfx.toggle(); setSoundEnabled(en); }}
                        className="text-white/50 hover:text-white transition-colors p-1">
                        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    {phase === 'playing' && (
                        <div className="flex items-center gap-4 text-sm font-mono">
                            <span className="text-white/80">🎯 <span className="text-white font-bold">{targetsShown}/{difficulty.targetCount}</span></span>
                            <span className="text-green-400">✓ {hits}</span>
                            <span className="text-red-400">✗ {misses}</span>
                            {combo > 1 && (
                                <span className="text-yellow-400 animate-pulse">
                                    🔥 {combo}x
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {phase === 'playing' && (
                        <div className="flex items-center gap-2 text-sm font-mono">
                            <span className={`${difficulty.color}`}>{difficulty.icon} {difficulty.name}</span>
                            {inputMode === 'touch' && <span className="text-blue-300 text-xs">📱 Touch</span>}
                            {activeCertified && <span className="text-amber-400 text-xs">🏆 {activeCertified.name}</span>}
                        </div>
                    )}
                    <button onClick={onClose}
                        className="text-white/50 hover:text-red-400 transition-colors p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Score HUD */}
            {phase === 'playing' && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50">
                    <div className="text-3xl font-bold text-white font-mono tracking-wider">
                        {score}
                        {headshots > 0 && <span className="text-sm text-yellow-400 ml-2">💀{headshots}</span>}
                    </div>
                </div>
            )}

            {/* ─── MENU ──────────────────────────────────────────── */}
            {phase === 'menu' && (
                <div className="flex flex-col items-center gap-6 px-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    {/* Title */}
                    <div className="text-center">
                        <div className="text-6xl mb-2">🎯</div>
                        <h1 className="text-4xl font-black tracking-tight">
                            <span className="text-white">AIM </span>
                            <span className="text-red-500">CHALLENGE</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-1 font-mono">
                            {cs ? 'Vyber obtížnost podle CS2 ranku' : 'Choose difficulty matching your CS2 rank'}
                        </p>
                        {/* Input mode badge */}
                        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-white/30 font-mono">
                            {inputMode === 'touch'
                                ? <><Smartphone className="w-3 h-3" /> Touch Edition</>
                                : <><Monitor className="w-3 h-3" /> Desktop</>
                            }
                            <span>·</span>
                            <span>{resLabel}</span>
                            <span>·</span>
                            <span>{ARENA_W}×{ARENA_H}</span>
                        </div>
                    </div>

                    {/* Difficulty picker */}
                    <div className="w-full">
                        <button onClick={() => setShowDifficultyPicker(!showDifficultyPicker)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${difficulty.borderColor} ${difficulty.bgColor} transition-all`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{difficulty.icon}</span>
                                <div className="text-left">
                                    <div className={`font-bold ${difficulty.color}`}>{cs ? difficulty.nameCs : difficulty.name}</div>
                                    <div className="text-white/40 text-xs">{cs ? difficulty.descriptionCs : difficulty.description}</div>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${showDifficultyPicker ? 'rotate-180' : ''}`} />
                        </button>

                        {showDifficultyPicker && (
                            <div className="mt-2 space-y-1">
                                {DIFFICULTY_LEVELS.map(d => (
                                    <button key={d.id}
                                        onClick={() => { setDifficulty(d); setShowDifficultyPicker(false); }}
                                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg border transition-all hover:bg-white/5
                                                ${difficulty.id === d.id ? `${d.borderColor} ${d.bgColor}` : 'border-white/10'}`}>
                                        <span className="text-xl">{d.icon}</span>
                                        <div className="text-left">
                                            <div className={`font-semibold text-sm ${d.color}`}>{cs ? d.nameCs : d.name}</div>
                                            <div className="text-white/30 text-xs">{cs ? d.descriptionCs : d.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Difficulty stats */}
                    <div className="grid grid-cols-4 gap-2 w-full text-center">
                        {[
                            { label: cs ? 'TERČE' : 'TARGETS', value: effectiveDiff.targetCount },
                            { label: cs ? 'ČAS' : 'TIME', value: `${(effectiveDiff.targetLifetimeMs / 1000).toFixed(1)}s` },
                            { label: cs ? 'VEL.' : 'SIZE', value: `${effectiveDiff.targetSizeMin}px` },
                            { label: cs ? 'POHYB' : 'MOVE', value: effectiveDiff.movingTargets ? (cs ? 'ANO' : 'YES') : 'NO' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/10">
                                <div className="text-white/30 text-[10px] font-mono">{s.label}</div>
                                <div className="text-white font-bold text-sm">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* START button */}
                    <button onClick={() => startGame()}
                        className="w-full max-w-xs bg-red-600 hover:bg-red-500 text-white font-black text-xl py-4 rounded-xl
                                       transition-all hover:scale-105 hover:shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2">
                        ⚡ START <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                    </button>

                    {/* Certified Challenges */}
                    <div className="w-full">
                        <button onClick={() => setShowCertified(!showCertified)}
                            className="flex items-center gap-2 text-amber-400/70 hover:text-amber-400 text-sm font-mono transition-colors">
                            🏆 {cs ? 'CERTIFIKOVANÉ VÝZVY' : 'CERTIFIED CHALLENGES'}
                            <ChevronDown className={`w-4 h-4 transition-transform ${showCertified ? 'rotate-180' : ''}`} />
                        </button>

                        {showCertified && (
                            <div className="mt-2 space-y-2">
                                <p className="text-white/30 text-xs font-mono">
                                    {cs
                                        ? 'Fixní vzor terčů — soupeř se svým ghostem!'
                                        : 'Fixed target pattern — compete against your ghost!'}
                                </p>
                                {CERTIFIED_CHALLENGES.map(c => {
                                    const cDiff = DIFFICULTY_LEVELS.find(d => d.id === c.difficulty);
                                    const ghostScore = (() => {
                                        try { return localStorage.getItem(`aim_ghost_score_${c.id}`) || null; } catch { return null; }
                                    })();
                                    return (
                                        <button key={c.id}
                                            onClick={() => startGame(c)}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-amber-500/20 bg-amber-500/5
                                                           hover:bg-amber-500/10 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{c.icon}</span>
                                                <div className="text-left">
                                                    <div className="font-bold text-amber-400 text-sm">{cs ? c.nameCs : c.name}</div>
                                                    <div className="text-white/30 text-xs">{cs ? c.descriptionCs : c.description}</div>
                                                    {cDiff && <div className="text-white/20 text-xs mt-0.5">{cDiff.icon} {cDiff.name}</div>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {ghostScore && (
                                                    <div className="text-white/30 text-xs font-mono">
                                                        👻 {ghostScore}
                                                    </div>
                                                )}
                                                <div className="text-amber-400/50 group-hover:text-amber-400 text-xs">
                                                    ▶ PLAY
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Leaderboard link */}
                    <button onClick={() => {
                        setShowLeaderboard(true);
                        fetchLeaderboard(leaderboardTab, undefined, undefined, 15).then(setLeaderboard).catch(() => { });
                    }}
                        className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-mono transition-colors">
                        🏆 {cs ? 'ŽEBŘÍČEK' : 'LEADERBOARD'}
                    </button>
                </div>
            )}

            {/* ─── COUNTDOWN ─────────────────────────────────────── */}
            {phase === 'countdown' && (
                <div className="flex flex-col items-center gap-4">
                    {activeCertified && (
                        <div className="text-amber-400 text-sm font-mono">
                            🏆 {cs ? activeCertified.nameCs : activeCertified.name}
                            {ghostFrames.length > 0 && <span className="text-white/30 ml-2">👻 Ghost active</span>}
                        </div>
                    )}
                    <div className="text-8xl font-black text-white animate-pulse" key={countdown}>
                        {countdown === 0 ? 'GO!' : countdown}
                    </div>
                    <div className={`text-lg font-mono ${difficulty.color}`}>
                        {difficulty.icon} {cs ? difficulty.nameCs : difficulty.name}
                    </div>
                </div>
            )}

            {/* ─── PLAYING: Arena ──────────────────────────────── */}
            {phase === 'playing' && (
                <div
                    ref={arenaRef}
                    onClick={handleMisclick}
                    className="relative border-2 border-blue-500/30 rounded-lg overflow-hidden"
                    style={{
                        width: ARENA_W,
                        height: ARENA_H,
                        transform: `scale(${arenaScale})`,
                        transformOrigin: 'center center',
                        background: `
                            radial-gradient(circle at 50% 50%, rgba(20,30,60,0.8) 0%, rgba(5,5,15,1) 100%),
                            repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.02) 79px, rgba(255,255,255,0.02) 80px),
                            repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.02) 79px, rgba(255,255,255,0.02) 80px)
                        `,
                    }}
                >
                    {/* Ghost dot */}
                    {currentGhostPos && (
                        <div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                left: currentGhostPos.x - 8,
                                top: currentGhostPos.y - 8,
                                width: 16,
                                height: 16,
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 0 8px rgba(255,255,255,0.1)',
                                transition: 'left 0.05s linear, top 0.05s linear',
                            }}
                        />
                    )}

                    {/* Target */}
                    {target && (() => {
                        const sz = difficulty.shrinkTargets
                            ? target.size * (1 - shrinkProgress * 0.6)
                            : target.size;
                        return (
                            <div
                                onClick={handleHit}
                                className="absolute rounded-full cursor-crosshair"
                                style={{
                                    left: target.x,
                                    top: target.y,
                                    width: sz,
                                    height: sz,
                                    background: 'radial-gradient(circle, #ff4444 0%, #cc2222 28%, #881111 30%, #cc2222 32%, #993333 68%, #661111 70%, #993333 72%, #552222 100%)',
                                    boxShadow: `0 0 ${20 + (1 - shrinkProgress) * 10}px rgba(255,0,0,0.6), inset 0 0 8px rgba(255,100,100,0.4)`,
                                    transition: 'width 0.1s linear, height 0.1s linear',
                                    zIndex: 10,
                                }}
                            >
                                {/* Outer ring border */}
                                <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                                {/* Middle ring */}
                                <div className="absolute rounded-full border border-white/30" style={{ left: '15%', top: '15%', right: '15%', bottom: '15%' }} />
                                {/* Inner ring (bullseye zone) */}
                                <div className="absolute rounded-full border-2 border-yellow-400/60" style={{ left: '35%', top: '35%', right: '35%', bottom: '35%' }} />
                                {/* Center dot */}
                                <div className="absolute rounded-full bg-yellow-300/80" style={{ left: '43%', top: '43%', right: '43%', bottom: '43%' }} />
                            </div>
                        );
                    })()
                    }

                    {/* Floating score popups */}
                    {floatingScores.map(f => (
                        <div
                            key={f.id}
                            className="absolute pointer-events-none font-mono font-black text-center"
                            style={{
                                left: f.x - 40,
                                top: f.y - 20,
                                width: 80,
                                zIndex: 50,
                                animation: 'floatUp 0.85s ease-out forwards',
                                fontSize: f.ring.includes('BULLSEYE') ? 18 : f.ring === 'INNER' ? 15 : 13,
                                color: f.ring.includes('BULLSEYE') ? '#facc15' : f.ring === 'INNER' ? '#60a5fa' : '#a3a3a3',
                                textShadow: '0 0 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)',
                            }}
                        >
                            <div>+{f.points}</div>
                            {f.ring.includes('BULLSEYE') && <div style={{ fontSize: 10 }}>💀 BULLSEYE</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* ─── RESULTS ───────────────────────────────────────── */}
            {phase === 'results' && gameStats && rank && (
                <div className="flex flex-col items-center gap-4 px-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-8">
                    {/* Rank */}
                    <div className={`text-center ${rank.glow ? `drop-shadow-lg` : ''}`}>
                        <div className="text-5xl mb-1">{rank.icon}</div>
                        <div className={`text-3xl font-black ${rank.color}`}>{rank.title}</div>
                        {activeCertified && (
                            <div className="text-amber-400 text-xs font-mono mt-1">
                                🏆 {cs ? activeCertified.nameCs : activeCertified.name}
                            </div>
                        )}
                    </div>

                    {/* Score */}
                    <div className="text-5xl font-black text-white font-mono">{gameStats.score}</div>
                    <div className="text-white/30 text-xs font-mono flex gap-2">
                        <span>{difficulty.icon} {difficulty.name}</span>
                        <span>·</span>
                        <span>{inputMode === 'touch' ? '📱 Touch' : '🖱️ Desktop'}</span>
                        <span>·</span>
                        <span>{resLabel}</span>
                    </div>

                    {/* Anti-cheat warning */}
                    {(gameStats as any)._antiCheat?.severity === 'flagged' && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-xs font-mono">
                            ⚠️ {cs ? 'Podezřelý výkon detekován' : 'Suspicious performance detected'}
                        </div>
                    )}

                    {/* Quick stats grid */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                        {[
                            { label: cs ? 'PŘESNOST' : 'ACCURACY', value: `${gameStats.accuracy}%`, color: gameStats.accuracy >= 80 ? 'text-green-400' : gameStats.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400' },
                            { label: cs ? 'PRŮMĚR REAKCE' : 'AVG REACTION', value: `${gameStats.avgReactionMs}ms`, color: 'text-blue-400' },
                            { label: cs ? 'NEJLEPŠÍ' : 'BEST', value: `${gameStats.bestReactionMs}ms`, color: 'text-cyan-400' },
                            { label: cs ? 'NEJPOMALEJŠÍ' : 'WORST', value: `${gameStats.worstReactionMs}ms`, color: 'text-orange-400' },
                            { label: 'MAX COMBO', value: `${gameStats.maxCombo}x`, color: 'text-yellow-400' },
                            { label: cs ? 'KONZISTENCE' : 'CONSISTENCY', value: `±${gameStats.consistency}ms`, color: gameStats.consistency < 100 ? 'text-green-400' : 'text-orange-400' },
                            { label: 'HEADSHOTS', value: `${gameStats.headshots}`, color: 'text-purple-400' },
                            { label: cs ? 'MISKLIKY' : 'MISCLICKS', value: `${gameStats.misclicks}`, color: 'text-red-400' },
                            { label: cs ? 'CELKOVÝ ČAS' : 'TOTAL TIME', value: `${(gameStats.totalTimeMs / 1000).toFixed(1)}s`, color: 'text-white/60' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/10 text-center">
                                <div className="text-white/30 text-[9px] font-mono uppercase">{s.label}</div>
                                <div className={`font-bold text-sm font-mono ${s.color}`}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Fastest flicks */}
                    {gameStats.fastestFlicks.length > 0 && (
                        <div className="w-full bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-white/30 text-xs font-mono mb-1">
                                ⚡ {cs ? 'NEJRYCHLEJŠÍ PŘESUNY' : 'FASTEST FLICKS'}
                            </div>
                            <div className="flex gap-3">
                                {gameStats.fastestFlicks.map((t, i) => (
                                    <span key={i} className={`font-mono font-bold text-sm ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {t}ms
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed stats toggle */}
                    <button onClick={() => setShowStats(!showStats)}
                        className="flex items-center gap-1 text-white/30 hover:text-white/60 text-xs font-mono transition-colors">
                        <Info className="w-3 h-3" />
                        {cs ? 'DETAILNÍ STATISTIKY' : 'DETAILED STATS'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${showStats ? 'rotate-180' : ''}`} />
                    </button>

                    {showStats && (
                        <div className="w-full bg-white/5 rounded-lg p-3 border border-white/10 space-y-3">
                            {/* Accuracy breakdown */}
                            <div>
                                <div className="text-white/30 text-xs font-mono mb-1">
                                    {cs ? 'ROZPAD PŘESNOSTI' : 'ACCURACY BREAKDOWN'}
                                </div>
                                <div className="flex gap-4 text-xs font-mono">
                                    <span className="text-green-400">✓ {gameStats.hits} hits</span>
                                    <span className="text-red-400">✗ {gameStats.misses} timeouts</span>
                                    <span className="text-orange-400">⊘ {gameStats.misclicks} misclicks</span>
                                    <span className="text-purple-400">💀 {gameStats.headshots} headshots</span>
                                </div>
                            </div>

                            {/* Per-target reaction chart */}
                            <div>
                                <div className="text-white/30 text-xs font-mono mb-1">
                                    {cs ? 'REAKCE PO TERČÍCH' : 'PER-TARGET REACTIONS'}
                                </div>
                                <div className="flex items-end gap-[2px] h-16">
                                    {gameStats.targetsHit.map((r, i) => {
                                        const maxR = gameStats.worstReactionMs || 1000;
                                        const h = r.result === 'miss_timeout' ? 100 : Math.max(5, (r.reactionMs / maxR) * 100);
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-t-sm"
                                                style={{
                                                    height: `${h}%`,
                                                    background: r.result === 'miss_timeout'
                                                        ? '#ef4444'
                                                        : r.result === 'headshot'
                                                            ? '#a855f7'
                                                            : r.reactionMs < 300
                                                                ? '#22c55e'
                                                                : r.reactionMs < 600
                                                                    ? '#eab308'
                                                                    : '#f97316',
                                                    minWidth: 4,
                                                }}
                                                title={`#${i + 1}: ${r.result === 'miss_timeout' ? 'MISS' : `${r.reactionMs}ms`}`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-[8px] text-white/20 font-mono mt-0.5">
                                    <span>#1</span>
                                    <span>#{gameStats.targetsHit.length}</span>
                                </div>
                                <div className="flex gap-3 mt-1 text-[8px] text-white/20 font-mono">
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-green-500 mr-1" />&lt;300ms</span>
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-yellow-500 mr-1" />&lt;600ms</span>
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1" />600ms+</span>
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-purple-500 mr-1" />Headshot</span>
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-red-500 mr-1" />Miss</span>
                                </div>
                            </div>

                            {/* Combo progression */}
                            <div>
                                <div className="text-white/30 text-xs font-mono mb-1">
                                    {cs ? 'COMBO PRŮBĚH' : 'COMBO PROGRESSION'}
                                </div>
                                <div className="flex items-end gap-[2px] h-10">
                                    {gameStats.targetsHit.map((r, i) => {
                                        const maxC = gameStats.maxCombo || 1;
                                        const h = Math.max(3, (r.comboAt / maxC) * 100);
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-t-sm"
                                                style={{
                                                    height: r.comboAt > 0 ? `${h}%` : '3%',
                                                    background: r.comboAt > 0
                                                        ? `hsl(${40 + (r.comboAt / maxC) * 20}, 90%, 50%)`
                                                        : '#333',
                                                    minWidth: 4,
                                                }}
                                                title={`#${i + 1}: combo ${r.comboAt}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Avg combo length */}
                            <div className="flex gap-6 text-xs font-mono text-white/40">
                                <span>{cs ? 'Prům. combo:' : 'Avg combo:'} <span className="text-yellow-400">{gameStats.avgComboLength}</span></span>
                                <span>{cs ? 'Prům. vzdálenost:' : 'Avg distance:'} <span className="text-blue-400">
                                    {Math.round(gameStats.targetsHit.filter(r => r.distanceFromPrev > 0).reduce((a, r) => a + r.distanceFromPrev, 0) / (gameStats.targetsHit.filter(r => r.distanceFromPrev > 0).length || 1))}px
                                </span></span>
                            </div>
                        </div>
                    )}

                    {/* Submit score */}
                    {!submitted ? (
                        <div className="w-full flex gap-2">
                            <input
                                type="text"
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                placeholder={cs ? 'Tvoje jméno...' : 'Your name...'}
                                maxLength={20}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                                           placeholder:text-white/20 outline-none focus:border-red-500/50"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={!playerName.trim()}
                                className="bg-red-600 hover:bg-red-500 disabled:bg-white/10 disabled:text-white/20
                                           text-white font-bold text-sm px-4 py-2 rounded-lg transition-all">
                                {cs ? '📤 ULOŽIT' : '📤 SUBMIT'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-green-400 text-sm font-mono">
                            ✓ {cs ? 'Skóre uloženo!' : 'Score submitted!'}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 w-full">
                        <button onClick={() => startGame(activeCertified || undefined)}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm py-3 rounded-lg transition-all">
                            🔄 {cs ? 'ZNOVU' : 'RETRY'}
                        </button>
                        <button onClick={() => {
                            setPhase('menu');
                            setShowCertified(false);
                            setShowDifficultyPicker(false);
                        }}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm py-3 rounded-lg transition-all">
                            📋 MENU
                        </button>
                    </div>
                </div>
            )}

            {/* ─── LEADERBOARD MODAL ─────────────────────────────── */}
            {showLeaderboard && (
                <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h2 className="text-white font-bold">🏆 {cs ? 'Žebříček' : 'Leaderboard'}</h2>
                            <button onClick={() => setShowLeaderboard(false)}
                                className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            {(['mouse', 'touch'] as InputMode[]).map(mode => (
                                <button key={mode}
                                    onClick={() => setLeaderboardTab(mode)}
                                    className={`flex-1 py-2 text-sm font-mono flex items-center justify-center gap-1 transition-colors
                                            ${leaderboardTab === mode ? 'text-white border-b-2 border-red-500' : 'text-white/30 hover:text-white/60'}`}>
                                    {mode === 'mouse' ? <><Monitor className="w-3 h-3" /> Desktop</> : <><Smartphone className="w-3 h-3" /> Touch</>}
                                </button>
                            ))}
                        </div>

                        {/* Entries */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {leaderboard.length === 0 ? (
                                <div className="text-center text-white/20 py-8 text-sm font-mono">
                                    {cs ? 'Žádné záznamy' : 'No entries yet'}
                                </div>
                            ) : leaderboard.map((e, i) => (
                                <div key={e.id || i}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i < 3 ? 'bg-white/5' : ''}`}>
                                    <span className="text-lg w-8 text-center">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-white/20 text-sm">{i + 1}</span>}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-semibold truncate">{e.player_name}</div>
                                        <div className="text-white/20 text-xs font-mono">
                                            {e.accuracy}% · {e.avg_reaction}ms · {e.difficulty || '?'}
                                            {e.challenge_id && <span className="text-amber-400 ml-1">🏆</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-sm font-mono">{e.score}</div>
                                        <div className="text-white/15 text-[10px] font-mono">{e.resolution || ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AimChallenge;
