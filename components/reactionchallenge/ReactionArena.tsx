import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    type PlayerSlot, type RoundConfig, type ReactionMode, type ReactionDifficulty,
    type RoundResult,
    PLAYER_COLORS, getKeyLabel,
    calculateReactionScore, getReactionSkillerComment, getSkillerPhrase, shouldShowLanPromo,
} from '../../services/reactionChallengeService';

type ArenaPhase = 'waiting' | 'ready' | 'go' | 'result' | 'fakeout';

interface ReactionArenaProps {
    players: PlayerSlot[];
    rounds: RoundConfig[];
    mode: ReactionMode;
    difficulty: ReactionDifficulty;
    isTouchDevice: boolean;
    cs: boolean;
    onSfx: {
        countdown: () => void;
        go: () => void;
        tap: () => void;
        falseStart: () => void;
        fakeout: () => void;
        roundEnd: () => void;
    };
    onGameEnd: (players: PlayerSlot[], lastMessage: string | null) => void;
}

const ReactionArena: React.FC<ReactionArenaProps> = ({
    players: initialPlayers, rounds, mode, difficulty, isTouchDevice, cs, onSfx, onGameEnd,
}) => {
    const [currentRound, setCurrentRound] = useState(0);
    const [phase, setPhase] = useState<ArenaPhase>('waiting');
    const [players, setPlayers] = useState<PlayerSlot[]>(initialPlayers);
    const [roundReactions, setRoundReactions] = useState<Map<number, number>>(new Map());
    const [skillerMsg, setSkillerMsg] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(3);
    const [signalColor, setSignalColor] = useState('#000');
    const [roundWinner, setRoundWinner] = useState<number | null>(null);
    const [showZoneHint, setShowZoneHint] = useState(true);

    const goTimeRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const phaseRef = useRef<ArenaPhase>('waiting');
    const roundRef = useRef(0);
    const reactionsRef = useRef<Map<number, number>>(new Map());
    const processedRef = useRef(false);
    const playersRef = useRef<PlayerSlot[]>(initialPlayers);
    const lastSkillerMsgRef = useRef<string | null>(null);

    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { roundRef.current = currentRound; }, [currentRound]);
    useEffect(() => { playersRef.current = players; }, [players]);

    // ─── Countdown then start first round ─────────────────────────
    useEffect(() => {
        if (countdown <= 0) {
            startRound(0);
            return;
        }
        onSfx.countdown();
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    // ─── Start a round ────────────────────────────────────────────
    const startRound = useCallback((roundIdx: number) => {
        if (roundIdx >= rounds.length) {
            onGameEnd(playersRef.current, lastSkillerMsgRef.current);
            return;
        }
        const round = rounds[roundIdx];
        setCurrentRound(roundIdx);
        setPhase('ready');
        setSignalColor('#000');
        setRoundReactions(new Map());
        reactionsRef.current = new Map();
        setRoundWinner(null);
        processedRef.current = false;
        setSkillerMsg(null);
        setShowZoneHint(false);

        // After delay, show signal
        delayRef.current = setTimeout(() => {
            if (round.isFakeout) {
                setPhase('fakeout');
                setSignalColor(round.color);
                onSfx.fakeout();
                // Hold fakeout for 1.5s then proceed
                timeoutRef.current = setTimeout(() => {
                    setSkillerMsg(getSkillerPhrase('fakeoutAvoided'));
                    setTimeout(() => startRound(roundIdx + 1), 1500);
                }, 1500);
            } else {
                setPhase('go');
                setSignalColor(round.color);
                onSfx.go();
                goTimeRef.current = performance.now();
                // Timeout after 2s
                timeoutRef.current = setTimeout(() => {
                    processRoundEnd(roundIdx);
                }, 2000);
            }
        }, round.delay);

        return () => {
            if (delayRef.current) clearTimeout(delayRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rounds, players]);

    // ─── Process round end ────────────────────────────────────────
    const processRoundEnd = useCallback((roundIdx: number) => {
        if (processedRef.current) return;
        processedRef.current = true;
        setPhase('result');
        onSfx.roundEnd();

        const reactions = reactionsRef.current;
        const round = rounds[roundIdx];

        // Update player stats
        setPlayers(prev => {
            const updated = prev.map(p => {
                const reactionMs = reactions.get(p.id) ?? 0; // 0 = timeout
                const score = calculateReactionScore(reactionMs, difficulty);
                const result: RoundResult = {
                    playerId: p.id,
                    roundIndex: roundIdx,
                    reactionMs,
                    correct: !round.isFakeout && reactionMs > 0,
                    timestamp: Date.now(),
                };
                return {
                    ...p,
                    results: [...p.results, result],
                    totalReaction: p.totalReaction + (reactionMs > 0 ? reactionMs : 0),
                    bestReaction: reactionMs > 0 ? Math.min(p.bestReaction, reactionMs) : p.bestReaction,
                    score: p.score + score,
                };
            });

            // Determine round winner
            const validReactions = updated
                .filter(p => (reactions.get(p.id) ?? 0) > 0)
                .sort((a, b) => {
                    const ra = reactions.get(a.id) ?? Infinity;
                    const rb = reactions.get(b.id) ?? Infinity;
                    return ra - rb;
                });

            if (validReactions.length > 0 && mode !== 'solo') {
                setRoundWinner(validReactions[0].id);
            }

            return updated;
        });

        // Skiller commentary
        const bestReactionThisRound = Math.min(...Array.from(reactions.values()).filter(v => v > 0));
        if (bestReactionThisRound < Infinity) {
            const comment = getReactionSkillerComment(bestReactionThisRound);
            setSkillerMsg(comment);
            lastSkillerMsgRef.current = comment;
        } else {
            const comment = getSkillerPhrase('slow');
            setSkillerMsg(comment);
            lastSkillerMsgRef.current = comment;
        }

        // LAN promo chance
        if (shouldShowLanPromo()) {
            setTimeout(() => setSkillerMsg(getSkillerPhrase('lanPromo')), 2000);
        }

        // Next round after delay
        setTimeout(() => startRound(roundIdx + 1), 2500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rounds, difficulty, mode]);

    // ─── Handle player input ──────────────────────────────────────
    const handlePlayerInput = useCallback((playerId: number) => {
        const p = phaseRef.current;

        if (p === 'ready') {
            // False start!
            onSfx.falseStart();
            setPlayers(prev => prev.map(pl =>
                pl.id === playerId ? { ...pl, falseStarts: pl.falseStarts + 1, score: Math.max(0, pl.score - 50) } : pl
            ));
            setSkillerMsg(getSkillerPhrase('falseStart'));
            return;
        }

        if (p === 'fakeout') {
            // Caught by fakeout!
            onSfx.falseStart();
            setPlayers(prev => prev.map(pl =>
                pl.id === playerId ? { ...pl, falseStarts: pl.falseStarts + 1, score: Math.max(0, pl.score - 30) } : pl
            ));
            setSkillerMsg(getSkillerPhrase('fakeoutCaught'));
            return;
        }

        if (p !== 'go') return;

        // Already reacted?
        if (reactionsRef.current.has(playerId)) return;

        const reactionMs = Math.round(performance.now() - goTimeRef.current);
        onSfx.tap();
        reactionsRef.current.set(playerId, reactionMs);
        setRoundReactions(new Map(reactionsRef.current));

        // In team mode, need both teammates; in solo/duel/party, first tap wins
        if (mode === 'team') {
            const playerTeamId = players.find(pl => pl.id === playerId)?.teamId;
            const teammates = players.filter(pl => pl.teamId === playerTeamId);
            const allReacted = teammates.every(tm => reactionsRef.current.has(tm.id));
            if (allReacted) {
                // Check if other team also done
                const otherTeam = players.filter(pl => pl.teamId !== playerTeamId);
                const otherDone = otherTeam.every(tm => reactionsRef.current.has(tm.id));
                if (otherDone || reactionsRef.current.size === players.length) {
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    processRoundEnd(roundRef.current);
                }
            }
        } else if (mode === 'solo') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            processRoundEnd(roundRef.current);
        } else {
            // Duel/Party: end when all have reacted or let timeout handle stragglers
            if (reactionsRef.current.size === players.length) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                processRoundEnd(roundRef.current);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, players, processRoundEnd]);

    // ─── Keyboard listener ────────────────────────────────────────
    useEffect(() => {
        if (isTouchDevice) return;

        const handler = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const player = players.find(p => p.key === key);
            if (player) {
                e.preventDefault();
                handlePlayerInput(player.id);
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isTouchDevice, players, handlePlayerInput]);

    // ─── Touch zone layout ────────────────────────────────────────
    const getZoneStyle = (idx: number, total: number): React.CSSProperties => {
        if (total === 1) return { inset: 0 };
        if (total === 2) {
            return idx === 0
                ? { top: 0, left: 0, right: '50%', bottom: 0 }
                : { top: 0, left: '50%', right: 0, bottom: 0 };
        }
        if (total === 3) {
            if (idx === 0) return { top: 0, left: 0, right: '50%', bottom: '50%' };
            if (idx === 1) return { top: 0, left: '50%', right: 0, bottom: '50%' };
            return { top: '50%', left: '25%', right: '25%', bottom: 0 };
        }
        // 4 players: quadrants
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        return {
            top: row === 0 ? 0 : '50%',
            left: col === 0 ? 0 : '50%',
            right: col === 0 ? '50%' : 0,
            bottom: row === 0 ? '50%' : 0,
        };
    };

    const bgColor = phase === 'ready' ? '#ef4444' // Red waiting screen
        : phase === 'go' ? signalColor
            : phase === 'fakeout' ? signalColor
                : phase === 'result' ? '#111'
                    : '#000';

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: bgColor, transition: 'background 0.15s' }}>
            {/* Top HUD */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-4 text-sm font-mono">
                    <span className="text-white/60">
                        {cs ? 'KOLO' : 'ROUND'} {currentRound + 1}/{rounds.length}
                    </span>
                    {mode !== 'solo' && players.map(p => (
                        <span key={p.id} style={{ color: PLAYER_COLORS[p.id]?.hex }}>
                            {p.name}: {p.score}
                        </span>
                    ))}
                    {mode === 'solo' && (
                        <span className="text-yellow-400">{players[0]?.score || 0} {cs ? 'bodů' : 'pts'}</span>
                    )}
                </div>
            </div>

            {/* Countdown overlay */}
            {countdown > 0 && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="text-center">
                        <div className="text-8xl font-black text-white animate-pulse" key={countdown}>
                            {countdown}
                        </div>
                        <div className="text-white/40 text-sm font-mono mt-4">
                            {cs ? 'Připravte se...' : 'Get ready...'}
                        </div>
                        {/* Control hint during countdown */}
                        <div className="mt-6 text-white/20 text-xs font-mono">
                            {isTouchDevice
                                ? (cs ? '👆 Klepni na obrazovku, až bude ZELENÁ' : '👆 Tap screen when it turns GREEN')
                                : mode === 'solo'
                                    ? (cs ? '⌨️ Zmáčkni MEZERNÍK, až bude ZELENÁ' : '⌨️ Press SPACE when it turns GREEN')
                                    : (cs ? '⌨️ Zmáčkni svou klávesu, až bude ZELENÁ' : '⌨️ Press your key when it turns GREEN')}
                        </div>
                        {!isTouchDevice && players.length > 1 && (
                            <div className="mt-3 flex gap-2 justify-center">
                                {players.map((p, i) => (
                                    <div key={i} className="text-center">
                                        <div className={`${PLAYER_COLORS[i].bg} text-black font-black text-sm px-2 py-0.5 rounded`}>
                                            {getKeyLabel(p.key)}
                                        </div>
                                        <div className="text-white/20 text-[10px] mt-0.5">{p.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main arena — touch zones or full screen */}
            {countdown <= 0 && (
                <>
                    {isTouchDevice && players.length > 1 ? (
                        // Touch zones for multiplayer
                        <div className="absolute inset-0">
                            {players.map((player, idx) => {
                                const reacted = roundReactions.has(player.id);
                                const reaction = roundReactions.get(player.id);
                                const isWinner = roundWinner === player.id;
                                const pColor = PLAYER_COLORS[idx];

                                return (
                                    <div key={idx}
                                        className="absolute flex flex-col items-center justify-center select-none"
                                        style={{
                                            ...getZoneStyle(idx, players.length),
                                            borderWidth: 2,
                                            borderColor: pColor.hex + '40',
                                            userSelect: 'none',
                                            WebkitUserSelect: 'none',
                                            touchAction: 'none',
                                        }}
                                        onTouchStart={e => { e.preventDefault(); handlePlayerInput(player.id); }}
                                        onMouseDown={() => handlePlayerInput(player.id)}>

                                        {/* Player label */}
                                        <div className="text-xs font-mono mb-2" style={{ color: pColor.hex }}>
                                            {player.name}
                                        </div>

                                        {/* Signal indicator */}
                                        {phase === 'go' && !reacted && (
                                            <div className="text-6xl animate-pulse">👆</div>
                                        )}
                                        {phase === 'ready' && (
                                            <div className="text-4xl text-white/20">⏳</div>
                                        )}
                                        {reacted && reaction && (
                                            <div className="text-center">
                                                <div className="text-3xl font-black text-white">{reaction}ms</div>
                                                {isWinner && <div className="text-yellow-400 text-sm">🥇 {cs ? 'NEJRYCHLEJŠÍ' : 'FASTEST'}</div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Full-screen single zone (solo touch or desktop)
                        <div className="absolute inset-0 flex items-center justify-center select-none"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                            onTouchStart={e => { if (isTouchDevice) { e.preventDefault(); handlePlayerInput(0); } }}
                            onMouseDown={() => { if (isTouchDevice && players.length === 1) handlePlayerInput(0); }}>

                            {phase === 'ready' && (
                                <div className="text-center">
                                    <div className="text-6xl mb-4">⏳</div>
                                    <div className="text-2xl font-bold text-white/40 font-mono animate-pulse">
                                        {cs ? 'ČEKEJ...' : 'WAIT...'}
                                    </div>
                                    {/* Solo key hint */}
                                    {!isTouchDevice && mode === 'solo' && (
                                        <div className="mt-4 text-white/15 text-xs font-mono">
                                            ⌨️ {cs ? 'Zmáčkni MEZERNÍK, až zezelená' : 'Press SPACE when green'}
                                        </div>
                                    )}
                                    {!isTouchDevice && showZoneHint && players.length > 1 && (
                                        <div className="mt-6 flex gap-3">
                                            {players.map((p, i) => (
                                                <div key={i} className="text-center">
                                                    <div className={`${PLAYER_COLORS[i].bg} text-black font-black text-lg px-3 py-1 rounded-lg`}>
                                                        {getKeyLabel(p.key)}
                                                    </div>
                                                    <div className="text-white/30 text-xs mt-1">{p.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {phase === 'go' && (
                                <div className="text-center">
                                    <div className="text-8xl font-black text-black animate-bounce">
                                        {isTouchDevice ? '👆' : '⚡'}
                                    </div>
                                    <div className="text-4xl font-black text-black mt-4">
                                        {isTouchDevice ? 'TAP!' : (mode === 'solo' ? (cs ? 'TEĎKA!' : 'NOW!') : (cs ? 'ZMÁČKNI!' : 'PRESS!'))}
                                    </div>
                                </div>
                            )}

                            {phase === 'fakeout' && (
                                <div className="text-center">
                                    <div className="text-6xl">🚫</div>
                                    <div className="text-2xl font-bold text-white mt-4">
                                        {cs ? 'NEMAČKEJ!' : 'DON\'T PRESS!'}
                                    </div>
                                </div>
                            )}

                            {phase === 'result' && (
                                <div className="text-center space-y-4">
                                    {players.map((p, i) => {
                                        const reaction = roundReactions.get(p.id);
                                        const isWinner = roundWinner === p.id;
                                        return (
                                            <div key={i} className={`flex items-center gap-4 ${isWinner ? 'scale-110' : 'opacity-60'} transition-all`}>
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAYER_COLORS[i]?.hex }} />
                                                <span className="text-white font-bold">{p.name}</span>
                                                <span className="text-3xl font-black font-mono text-white">
                                                    {reaction ? `${reaction}ms` : (cs ? 'TIMEOUT' : 'TIMEOUT')}
                                                </span>
                                                {isWinner && <span className="text-yellow-400 text-xl">🥇</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Skiller commentary */}
            {skillerMsg && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-xl px-5 py-3 text-white text-sm font-mono max-w-sm text-center">
                        🤖 {skillerMsg}
                    </div>
                </div>
            )}

            {/* Score bar at bottom */}
            {countdown <= 0 && mode !== 'solo' && (
                <div className="absolute bottom-0 left-0 right-0 z-40">
                    <div className="flex h-2">
                        {players.map((p, i) => {
                            const totalScore = players.reduce((s, pl) => s + pl.score, 0) || 1;
                            const pct = (p.score / totalScore) * 100;
                            return (
                                <div key={i} style={{
                                    width: `${Math.max(pct, 5)}%`,
                                    backgroundColor: PLAYER_COLORS[i]?.hex,
                                    transition: 'width 0.5s ease',
                                }} />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReactionArena;
