import React, { useState, useCallback, useMemo } from 'react';
import { Volume2, VolumeX, X, Monitor, Smartphone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
    REACTION_DIFFICULTIES,
    type ReactionMode, type ReactionDifficulty, type PlayerSlot,
    type RoundConfig, type ReactionLeaderboardEntry,
    createPlayerSlots, generateRounds,
    submitReactionScore, fetchReactionLeaderboard,
    createReactionSoundSystem, MODE_INFO,
} from '../services/reactionChallengeService';
import ReactionMenu from './reactionchallenge/ReactionMenu';
import PlayerSetup from './reactionchallenge/PlayerSetup';
import ReactionArena from './reactionchallenge/ReactionArena';
import ReactionResults from './reactionchallenge/ReactionResults';

// ─── Singleton sound system ──────────────────────────────────────────
const sfx = createReactionSoundSystem();

// ─── Game Phase ──────────────────────────────────────────────────────
type GamePhase = 'menu' | 'setup' | 'playing' | 'results';

// ─── Component ───────────────────────────────────────────────────────

const ReactionChallenge: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { language } = useAppContext();
    const cs = language === 'cs';

    // ─── Input detection ─────────────────────────────────────────
    const isTouchDevice = useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }, []);

    // ─── State ───────────────────────────────────────────────────
    const [phase, setPhase] = useState<GamePhase>('menu');
    const [mode, setMode] = useState<ReactionMode>('solo');
    const [difficulty, setDifficulty] = useState<ReactionDifficulty>(REACTION_DIFFICULTIES[0]);
    const [players, setPlayers] = useState<PlayerSlot[]>([]);
    const [rounds, setRounds] = useState<RoundConfig[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [leaderboard, setLeaderboard] = useState<ReactionLeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [lastSkillerMsg, setLastSkillerMsg] = useState<string | null>(null);

    // ─── Start: go to setup phase ────────────────────────────────
    const handleStart = useCallback(() => {
        const playerSlots = createPlayerSlots(mode, MODE_INFO[mode].maxPlayers);
        setPlayers(playerSlots);
        if (mode === 'solo' && isTouchDevice) {
            // Skip setup for solo touch — auto-assign
            const soloPlayers = playerSlots.map(p => ({ ...p, key: 'touch-0' }));
            setPlayers(soloPlayers);
            const gameRounds = generateRounds(difficulty, 1);
            setRounds(gameRounds);
            setSubmitted(false);
            setPhase('playing');
        } else if (mode === 'solo' && !isTouchDevice) {
            // Skip setup for solo desktop — auto-assign space
            const soloPlayers = playerSlots.map(p => ({ ...p, key: ' ' }));
            setPlayers(soloPlayers);
            const gameRounds = generateRounds(difficulty, 1);
            setRounds(gameRounds);
            setSubmitted(false);
            setPhase('playing');
        } else {
            setPhase('setup');
        }
    }, [mode, difficulty, isTouchDevice]);

    // ─── Players ready ───────────────────────────────────────────
    const handlePlayersReady = useCallback((readyPlayers: PlayerSlot[]) => {
        setPlayers(readyPlayers);
        const gameRounds = generateRounds(difficulty, readyPlayers.length);
        setRounds(gameRounds);
        setSubmitted(false);
        setPhase('playing');
    }, [difficulty]);

    // ─── Game end ────────────────────────────────────────────────
    const handleGameEnd = useCallback((finalPlayers: PlayerSlot[], lastMessage: string | null) => {
        setPlayers(finalPlayers);
        setLastSkillerMsg(lastMessage);
        setPhase('results');
        sfx.win();
        // Fetch leaderboard
        fetchReactionLeaderboard(difficulty.id, mode)
            .then(setLeaderboard).catch(() => { });
    }, [difficulty, mode]);

    // ─── Submit score ────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (submitted || !playerName.trim() || !players[0]) return;
        const p = players[0];
        const validResults = p.results.filter(r => r.reactionMs > 0);
        const avgReaction = validResults.length
            ? Math.round(validResults.reduce((s, r) => s + r.reactionMs, 0) / validResults.length)
            : 0;

        const entry: ReactionLeaderboardEntry = {
            player_name: playerName.trim(),
            score: p.score,
            avg_reaction: avgReaction,
            best_reaction: p.bestReaction < Infinity ? p.bestReaction : 0,
            false_starts: p.falseStarts,
            rounds_played: difficulty.rounds,
            difficulty: difficulty.id,
            mode,
            players_count: players.length,
            input_type: isTouchDevice ? 'touch' : 'keyboard',
        };

        const ok = await submitReactionScore(entry);
        if (ok) {
            setSubmitted(true);
            sfx.win();
            fetchReactionLeaderboard(difficulty.id, mode)
                .then(setLeaderboard).catch(() => { });
        }
    }, [submitted, playerName, players, difficulty, mode, isTouchDevice]);

    // ─── Retry ───────────────────────────────────────────────────
    const handleRetry = useCallback(() => {
        const resetPlayers = players.map(p => ({
            ...p, results: [], totalReaction: 0, bestReaction: Infinity, falseStarts: 0, score: 0,
        }));
        setPlayers(resetPlayers);
        const gameRounds = generateRounds(difficulty, resetPlayers.length);
        setRounds(gameRounds);
        setSubmitted(false);
        setPhase('playing');
    }, [players, difficulty]);

    // ─── Leaderboard from menu ───────────────────────────────────
    const handleShowLeaderboard = useCallback(() => {
        setShowLeaderboard(true);
        fetchReactionLeaderboard(undefined, undefined, 15)
            .then(setLeaderboard).catch(() => { });
    }, []);

    // ─── Leaderboard fetch on tab/filter change ──────────────────
    const [lbDiffFilter, setLbDiffFilter] = useState<string>('');

    // ─── RENDER ──────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
            style={{ cursor: phase === 'playing' ? 'default' : 'default' }}>

            {/* Top bar */}
            {phase !== 'playing' && (
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 z-50">
                    <button onClick={() => { const en = sfx.toggle(); setSoundEnabled(en); }}
                        className="text-white/50 hover:text-white transition-colors p-1">
                        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <button onClick={onClose} className="text-white/50 hover:text-red-400 transition-colors p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* ─── MENU ──────────────────────────────────── */}
            {phase === 'menu' && (
                <ReactionMenu
                    mode={mode}
                    difficulty={difficulty}
                    onChangeMode={setMode}
                    onChangeDifficulty={setDifficulty}
                    onStart={handleStart}
                    onShowLeaderboard={handleShowLeaderboard}
                    cs={cs}
                />
            )}

            {/* ─── SETUP ─────────────────────────────────── */}
            {phase === 'setup' && (
                <PlayerSetup
                    players={players}
                    mode={mode}
                    isTouchDevice={isTouchDevice}
                    cs={cs}
                    onPlayersReady={handlePlayersReady}
                    onBack={() => setPhase('menu')}
                />
            )}

            {/* ─── PLAYING ────────────────────────────────── */}
            {phase === 'playing' && (
                <ReactionArena
                    players={players}
                    rounds={rounds}
                    mode={mode}
                    difficulty={difficulty}
                    isTouchDevice={isTouchDevice}
                    cs={cs}
                    onSfx={{
                        countdown: sfx.countdown,
                        go: sfx.go,
                        tap: sfx.tap,
                        falseStart: sfx.falseStart,
                        fakeout: sfx.fakeout,
                        roundEnd: sfx.roundEnd,
                    }}
                    onGameEnd={handleGameEnd}
                />
            )}

            {/* ─── RESULTS ────────────────────────────────── */}
            {phase === 'results' && (
                <ReactionResults
                    players={players}
                    mode={mode}
                    difficulty={difficulty}
                    leaderboard={leaderboard}
                    showLeaderboard={showLeaderboard}
                    isTouchDevice={isTouchDevice}
                    cs={cs}
                    submitted={submitted}
                    playerName={playerName}
                    lastSkillerMsg={lastSkillerMsg}
                    onPlayerNameChange={setPlayerName}
                    onSubmit={handleSubmit}
                    onSetShowLeaderboard={setShowLeaderboard}
                    onRetry={handleRetry}
                    onBackToMenu={() => setPhase('menu')}
                />
            )}

            {/* ─── LEADERBOARD MODAL ──────────────────────── */}
            {showLeaderboard && phase !== 'playing' && (
                <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h2 className="text-white font-bold">🏆 {cs ? 'Žebříček reakcí' : 'Reaction Leaderboard'}</h2>
                            <button onClick={() => setShowLeaderboard(false)}
                                className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Difficulty filter */}
                        <div className="flex border-b border-white/10 overflow-x-auto">
                            {[{ id: '', label: cs ? 'Vše' : 'All' }, ...REACTION_DIFFICULTIES.map(d => ({
                                id: d.id, label: `${d.icon} ${d.name}`,
                            }))].map(f => (
                                <button key={f.id}
                                    onClick={() => {
                                        setLbDiffFilter(f.id);
                                        fetchReactionLeaderboard(f.id || undefined, undefined, 15)
                                            .then(setLeaderboard).catch(() => { });
                                    }}
                                    className={`flex-shrink-0 px-3 py-2 text-xs font-mono transition-colors
                                        ${lbDiffFilter === f.id
                                            ? 'text-white border-b-2 border-yellow-500'
                                            : 'text-white/30 hover:text-white/60'}`}>
                                    {f.label}
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
                                            ⚡ {e.avg_reaction}ms · {e.difficulty} · {e.mode}
                                            {e.input_type === 'touch' && <span className="ml-1">📱</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-sm font-mono">{e.score}</div>
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

export default ReactionChallenge;
