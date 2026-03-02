import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, VolumeX, Monitor, Smartphone } from 'lucide-react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
    ARENA_W, ARENA_H,
    DIFFICULTY_LEVELS,
    type DifficultyLevel, type TargetState, type TargetHitRecord, type MisclickRecord,
    type GhostFrame, type GameStats, type InputMode, type LeaderboardEntry, type CertifiedChallenge,
    type PrecomputedTarget,
    generateTargetSequence, calculateStats, validateAntiCheat,
    detectInputMode, getResolutionLabel, getResolutionString,
    loadGhost, saveGhost, getRank, getTouchAdjustedDifficulty,
    submitScore, fetchLeaderboard, createSoundSystem,
} from '../services/aimChallengeService';
import AimMenu from './aimchallenge/AimMenu';
import AimArena from './aimchallenge/AimArena';
import AimResults from './aimchallenge/AimResults';

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
    const [gameStats, setGameStats] = useState<GameStats | null>(null);
    const [gameStartTime, setGameStartTime] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardTab, setLeaderboardTab] = useState<InputMode>(inputMode);
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
            while (frameIdx < ghostFrames.length && ghostFrames[frameIdx].t <= elapsed) frameIdx++;
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

        const antiCheat = validateAntiCheat(stats, difficultyRef.current, mouseLogRef.current);
        if (antiCheat.suspicious) {
            (stats as any)._antiCheat = antiCheat;
        }

        setGameStats(stats);
        sfx.rankReveal();

        if (activeCertified) {
            saveGhost(activeCertified.id, ghostInputRef.current, scoreRef.current);
        }

        fetchLeaderboard(inputMode, difficultyRef.current.id, activeCertified?.id || null)
            .then(setLeaderboard)
            .catch(() => { });
    }, [inputMode, activeCertified]);

    // ─── Spawn Target ───────────────────────────────────────────────
    const spawnTarget = useCallback(() => {
        const d = difficultyRef.current;
        const idx = seqIndexRef.current;

        if (idx >= d.targetCount) { endGame(); return; }

        const seq = sequenceRef.current;
        const precomputed = seq[idx];
        if (!precomputed) { endGame(); return; }

        const fallbackTime = performance.now();
        const newTarget: TargetState & { perfSpawnTime?: number } = {
            x: precomputed.x, y: precomputed.y, size: precomputed.size,
            vx: precomputed.vx, vy: precomputed.vy, spawnTime: Date.now(),
            id: idx, seqIndex: idx,
        };

        setTarget(newTarget);
        targetRef.current = newTarget;
        seqIndexRef.current = idx + 1;
        setTargetsShown(idx + 1);
        targetsShownRef.current = idx + 1;

        // Stamp exact time of trigger. We remove the double-rAF delay here 
        // to record time closer to when JS issues the command, reflecting 
        // full browser/monitor latency, identical to standard Human Benchmark logic.
        (targetRef.current as any).perfSpawnTime = performance.now();

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (phaseRef.current !== 'playing') return;
            sfx.miss();
            setMisses(prev => prev + 1);
            missesRef.current += 1;
            setCombo(0); comboRef.current = 0;
            setScore(prev => Math.max(0, prev - d.missPenalty));
            scoreRef.current = Math.max(0, scoreRef.current - d.missPenalty);

            const now = Date.now();
            hitRecordsRef.current.push({
                seqIndex: idx, targetX: precomputed.x, targetY: precomputed.y,
                targetSize: precomputed.size, clickX: -1, clickY: -1,
                reactionMs: d.targetLifetimeMs,
                distanceFromPrev: lastTargetPosRef.current
                    ? Math.hypot(precomputed.x - lastTargetPosRef.current.x, precomputed.y - lastTargetPosRef.current.y)
                    : 0,
                timeSincePrevMs: lastTargetTimeRef.current ? now - lastTargetTimeRef.current : 0,
                result: 'miss_timeout', comboAt: 0, timestamp: now,
            });

            lastTargetPosRef.current = { x: precomputed.x, y: precomputed.y };
            lastTargetTimeRef.current = now;
            setTarget(null); targetRef.current = null;

            if (seqIndexRef.current >= d.targetCount) { endGame(); }
            else { setTimeout(() => spawnTarget(), 150); }
        }, d.targetLifetimeMs);
    }, [endGame]);

    // ─── Start Game ─────────────────────────────────────────────────
    const startGame = useCallback((cert?: CertifiedChallenge) => {
        let diff = difficulty;
        let seed: number | null = null;

        if (cert) {
            setActiveCertified(cert);
            const certDiff = DIFFICULTY_LEVELS.find(d => d.id === cert.difficulty) || DIFFICULTY_LEVELS[1];
            diff = certDiff; setDifficulty(certDiff); difficultyRef.current = certDiff;
            seed = cert.seed;
            const ghost = loadGhost(cert.id);
            setGhostFrames(ghost);
        } else {
            setActiveCertified(null); setGhostFrames([]);
        }

        const actualDiff = inputMode === 'touch' ? getTouchAdjustedDifficulty(diff) : diff;
        setDifficulty(actualDiff); difficultyRef.current = actualDiff;

        const seq = generateTargetSequence(actualDiff, seed);
        sequenceRef.current = seq; seqIndexRef.current = 0;

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
        setGameStats(null); setShowLeaderboard(false);
        hitRecordsRef.current = []; misclickLogRef.current = [];
        mouseLogRef.current = []; ghostInputRef.current = [];
        lastTargetPosRef.current = null; lastTargetTimeRef.current = 0;
    }, [difficulty, inputMode]);

    // ─── Countdown ──────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'countdown') return;
        if (countdown <= 0) {
            sfx.countdownGo(); setPhase('playing');
            const now = Date.now(); setGameStartTime(now); gameStartRef.current = now;
            return;
        }
        sfx.countdown();
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, countdown]);

    useEffect(() => {
        if (phase !== 'playing') return;
        const t = setTimeout(() => spawnTarget(), 50);
        return () => clearTimeout(t);
    }, [phase, spawnTarget]);

    // ─── Handle Hit (Native or Synthetic) ───────────────────────────
    const handleHit = useCallback((e: React.MouseEvent | MouseEvent | TouchEvent) => {
        const t = targetRef.current;
        if (!t || phaseRef.current !== 'playing') return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const now = Date.now();
        const perfNow = performance.now();
        const exactSpawnTime = (t as any).perfSpawnTime || perfNow;
        const reaction = Math.round(perfNow - exactSpawnTime);
        const d = difficultyRef.current;

        const arenaEl = arenaRef.current;
        let clickArenaX = 0, clickArenaY = 0;
        let clientX = 0, clientY = 0;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent | React.MouseEvent).clientX;
            clientY = (e as MouseEvent | React.MouseEvent).clientY;
        }

        if (arenaEl) {
            const rect = arenaEl.getBoundingClientRect();
            const scaleX = ARENA_W / rect.width;
            const scaleY = ARENA_H / rect.height;
            clickArenaX = (clientX - rect.left) * scaleX;
            clickArenaY = (clientY - rect.top) * scaleY;
        }
        const currentSize = d.shrinkTargets ? t.size * (1 - ((now - t.spawnTime) / d.targetLifetimeMs) * 0.6) : t.size;
        const centerX = t.x + currentSize / 2;
        const centerY = t.y + currentSize / 2;
        const distFromCenter = Math.hypot(clickArenaX - centerX, clickArenaY - centerY);
        const radius = currentSize / 2;
        const normalizedDist = Math.min(distFromCenter / radius, 1);

        let accuracyMultiplier = 1.0;
        let ringLabel = 'OUTER';
        const isHeadshot = normalizedDist < 0.3;
        if (isHeadshot) { accuracyMultiplier = 2.0; ringLabel = '💀 BULLSEYE'; }
        else if (normalizedDist < 0.7) { accuracyMultiplier = 1.5; ringLabel = 'INNER'; }

        const timeFactor = Math.max(0, 1 - reaction / d.targetLifetimeMs);
        const sizeFactor = 1 - (t.size - d.targetSizeMin) / (d.targetSizeMax - d.targetSizeMin + 1);
        const basePoints = Math.round((100 * timeFactor + 50 * sizeFactor) * accuracyMultiplier);
        const newCombo = comboRef.current + 1;
        const comboBonus = Math.min(newCombo * 5, 50);
        const totalPoints = basePoints + comboBonus;

        if (isHeadshot) { sfx.headshot(); setHeadshots(prev => prev + 1); headshotsRef.current += 1; }
        else sfx.hit();

        const fid = ++floatIdRef.current;
        setFloatingScores(prev => [...prev, { id: fid, x: clickArenaX, y: clickArenaY, points: totalPoints, ring: ringLabel, ts: Date.now() }]);
        setTimeout(() => setFloatingScores(prev => prev.filter(f => f.id !== fid)), 900);

        setScore(prev => prev + totalPoints); scoreRef.current += totalPoints;
        setHits(prev => prev + 1); hitsRef.current += 1;
        setCombo(newCombo); comboRef.current = newCombo;
        if (newCombo > maxComboRef.current) { setMaxCombo(newCombo); maxComboRef.current = newCombo; }

        const clickX = Math.round(clickArenaX);
        const clickY = Math.round(clickArenaY);

        hitRecordsRef.current.push({
            seqIndex: t.seqIndex, targetX: t.x, targetY: t.y, targetSize: t.size,
            clickX, clickY, reactionMs: reaction,
            distanceFromPrev: lastTargetPosRef.current
                ? Math.hypot(t.x - lastTargetPosRef.current.x, t.y - lastTargetPosRef.current.y)
                : 0,
            timeSincePrevMs: lastTargetTimeRef.current ? now - lastTargetTimeRef.current : 0,
            result: isHeadshot ? 'headshot' : 'hit', comboAt: newCombo, timestamp: now,
        });

        ghostInputRef.current.push({ t: now - gameStartRef.current, x: clickX, y: clickY, hit: true });
        lastTargetPosRef.current = { x: t.x, y: t.y };
        lastTargetTimeRef.current = now;
        setTarget(null); targetRef.current = null;

        if (seqIndexRef.current >= d.targetCount) { endGame(); }
        else { setTimeout(() => spawnTarget(), 150); }
    }, [spawnTarget, endGame]);

    // ─── Handle Misclick (Native or Synthetic) ──────────────────────
    const handleMisclick = useCallback((e: React.MouseEvent | MouseEvent | TouchEvent) => {
        if (phaseRef.current !== 'playing' || !targetRef.current) return;
        sfx.misclick();
        setMissclicks(prev => prev + 1);
        const arenaEl = arenaRef.current;
        if (arenaEl) {
            const rect = arenaEl.getBoundingClientRect();
            const scaleX = ARENA_W / rect.width;
            const scaleY = ARENA_H / rect.height;

            let clientX = 0, clientY = 0;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as MouseEvent | React.MouseEvent).clientX;
                clientY = (e as MouseEvent | React.MouseEvent).clientY;
            }

            const x = Math.round((clientX - rect.left) * scaleX);
            const y = Math.round((clientY - rect.top) * scaleY);
            const t = targetRef.current;
            const dist = t ? Math.hypot(x - (t.x + t.size / 2), y - (t.y + t.size / 2)) : 999;
            misclickLogRef.current.push({ x, y, timestamp: Date.now(), nearestTargetDist: dist });
        }
    }, []);

    // ─── Native input listeners for raw speed ────────────────────────
    useEffect(() => {
        if (phase !== 'playing') return;

        const handleNativeDown = (e: MouseEvent | TouchEvent) => {
            const targetEl = e.target as HTMLElement;
            // Intercept clicks on the target or the arena directly
            if (targetEl.closest('.aim-target-btn')) {
                e.preventDefault();
                e.stopPropagation();
                handleHit(e);
            } else if (targetEl.closest('.aim-arena-bg')) {
                // It's a misclick on the background
                handleMisclick(e);
            }
        };

        const arenaEl = arenaRef.current;
        if (arenaEl) {
            arenaEl.addEventListener('mousedown', handleNativeDown, { capture: true });
            arenaEl.addEventListener('touchstart', handleNativeDown, { capture: true, passive: false });
        }

        return () => {
            if (arenaEl) {
                arenaEl.removeEventListener('mousedown', handleNativeDown, { capture: true });
                arenaEl.removeEventListener('touchstart', handleNativeDown, { capture: true });
            }
        };
    }, [phase, handleHit, handleMisclick]);

    // ─── Submit Score ───────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (!gameStats || submitted || !playerName.trim()) return;
        const antiCheat = (gameStats as any)._antiCheat;
        const isSuspicious = antiCheat?.severity === 'flagged';
        const entry: LeaderboardEntry = {
            player_name: playerName.trim(), score: gameStats.score, accuracy: gameStats.accuracy,
            avg_reaction: gameStats.avgReactionMs, best_reaction: gameStats.bestReactionMs,
            worst_reaction: gameStats.worstReactionMs,
            total_time: Math.round(gameStats.totalTimeMs / 100) / 10,
            max_combo: gameStats.maxCombo, consistency: gameStats.consistency,
            misclicks: gameStats.misclicks, headshots: gameStats.headshots,
            difficulty: difficulty.id, input_mode: inputMode, resolution: resString,
            challenge_id: activeCertified?.id || null, is_suspicious: isSuspicious,
        };
        const ok = await submitScore(entry);
        if (ok) {
            setSubmitted(true); sfx.levelUp();
            fetchLeaderboard(inputMode, difficulty.id, activeCertified?.id || null)
                .then(setLeaderboard).catch(() => { });
        }
    }, [gameStats, submitted, playerName, difficulty, inputMode, resString, activeCertified]);

    // ─── Load leaderboard on tab change ─────────────────────────────
    useEffect(() => {
        if (!showLeaderboard) return;
        fetchLeaderboard(leaderboardTab, undefined, undefined, 15)
            .then(setLeaderboard).catch(() => { });
    }, [showLeaderboard, leaderboardTab]);

    // ─── Arena Scale ────────────────────────────────────────────────
    const [arenaScale, setArenaScale] = useState(1);
    useEffect(() => {
        const calc = () => {
            const padX = 20, padY = 80;
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
            setShrinkProgress(0); return;
        }
        const start = target.spawnTime;
        const dur = difficulty.targetLifetimeMs;
        const tick = () => {
            const elapsed = Date.now() - start;
            setShrinkProgress(Math.min(elapsed / dur, 1));
            if (elapsed < dur && phaseRef.current === 'playing') requestAnimationFrame(tick);
        };
        const frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [phase, target, difficulty.shrinkTargets, difficulty.targetLifetimeMs]);

    const effectiveDiff = inputMode === 'touch' ? getTouchAdjustedDifficulty(difficulty) : difficulty;

    // ─── Handle show leaderboard from menu ──────────────────────────
    const handleShowLeaderboard = useCallback(() => {
        setShowLeaderboard(true);
        fetchLeaderboard(leaderboardTab, undefined, undefined, 15).then(setLeaderboard).catch(() => { });
    }, [leaderboardTab]);

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
                            {combo > 1 && <span className="text-yellow-400 animate-pulse">🔥 {combo}x</span>}
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
                    <button onClick={onClose} className="text-white/50 hover:text-red-400 transition-colors p-1">
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
                <AimMenu
                    difficulty={difficulty}
                    onChangeDifficulty={setDifficulty}
                    inputMode={inputMode}
                    resLabel={resLabel}
                    onStart={startGame}
                    onShowLeaderboard={handleShowLeaderboard}
                    cs={cs}
                />
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
                <AimArena
                    arenaRef={arenaRef}
                    target={target}
                    difficulty={difficulty}
                    arenaScale={arenaScale}
                    shrinkProgress={shrinkProgress}
                    currentGhostPos={currentGhostPos}
                    floatingScores={floatingScores}
                    onHit={handleHit}
                    onMisclick={handleMisclick}
                />
            )}

            {/* ─── RESULTS ───────────────────────────────────────── */}
            {phase === 'results' && gameStats && (
                <AimResults
                    gameStats={gameStats}
                    difficulty={difficulty}
                    inputMode={inputMode}
                    resLabel={resLabel}
                    activeCertified={activeCertified}
                    leaderboard={leaderboard}
                    showLeaderboard={showLeaderboard}
                    leaderboardTab={leaderboardTab}
                    playerName={playerName}
                    submitted={submitted}
                    cs={cs}
                    onSetLeaderboardTab={setLeaderboardTab}
                    onSetShowLeaderboard={setShowLeaderboard}
                    onPlayerNameChange={setPlayerName}
                    onSubmit={handleSubmit}
                    onRetry={() => startGame(activeCertified || undefined)}
                    onBackToMenu={() => { setPhase('menu'); }}
                />
            )}
            {/* ─── LEADERBOARD MODAL (renders in any phase) ───── */}
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
            <div
                className="aim-arena-bg absolute inset-0 rounded-[30px] shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, #1a1a24 0%, #0a0a0f 100%)',
                    cursor: 'crosshair',
                }}
            ></div>
        </div>
    );
};

export default AimChallenge;
