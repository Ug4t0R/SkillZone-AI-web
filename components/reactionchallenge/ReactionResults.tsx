import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import {
    type PlayerSlot, type ReactionMode, type ReactionDifficulty,
    type ReactionLeaderboardEntry,
    PLAYER_COLORS, TEAM_COLORS,
    getSkillerPhrase, getReactionComparisons, REACTION_BENCHMARKS,
} from '../../services/reactionChallengeService';

interface ReactionResultsProps {
    players: PlayerSlot[];
    mode: ReactionMode;
    difficulty: ReactionDifficulty;
    leaderboard: ReactionLeaderboardEntry[];
    showLeaderboard: boolean;
    isTouchDevice: boolean;
    cs: boolean;
    submitted: boolean;
    playerName: string;
    onPlayerNameChange: (name: string) => void;
    onSubmit: () => void;
    onSetShowLeaderboard: (show: boolean) => void;
    onRetry: () => void;
    onBackToMenu: () => void;
    lastSkillerMsg?: string | null;
}

const ReactionResults: React.FC<ReactionResultsProps> = ({
    players, mode, difficulty, leaderboard, showLeaderboard,
    isTouchDevice, cs, submitted, playerName,
    onPlayerNameChange, onSubmit, onSetShowLeaderboard, onRetry, onBackToMenu, lastSkillerMsg,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showComparisons, setShowComparisons] = useState(true);

    // Sort players by score
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    const isSolo = mode === 'solo';

    // Team results for team mode
    const teamResults = mode === 'team' ? [0, 1].map(teamId => {
        const team = players.filter(p => p.teamId === teamId);
        const totalScore = team.reduce((s, p) => s + p.score, 0);
        const avgReaction = team.reduce((s, p) => {
            const valid = p.results.filter(r => r.reactionMs > 0);
            return s + (valid.length ? valid.reduce((a, r) => a + r.reactionMs, 0) / valid.length : 0);
        }, 0) / team.length;
        return { teamId, team, totalScore, avgReaction };
    }).sort((a, b) => b.totalScore - a.totalScore) : [];

    const endPhrase = lastSkillerMsg || getSkillerPhrase('gameEnd');

    return (
        <div className="flex flex-col items-center gap-4 px-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-8">
            {/* Winner / Results header */}
            <div className="text-center">
                <div className="text-5xl mb-2">🏆</div>
                {mode === 'team' ? (
                    <>
                        <div className="text-3xl font-black text-white">
                            {cs ? 'Tým' : 'Team'} {cs ? TEAM_COLORS[teamResults[0]?.teamId || 0].nameCs : TEAM_COLORS[teamResults[0]?.teamId || 0].name}
                            <span className="text-yellow-400 ml-2">{cs ? 'VYHRÁVÁ!' : 'WINS!'}</span>
                        </div>
                        <div className="text-white/40 text-sm font-mono mt-1">
                            {teamResults[0]?.totalScore} vs {teamResults[1]?.totalScore} {cs ? 'bodů' : 'points'}
                        </div>
                    </>
                ) : isSolo ? (
                    <>
                        <div className="text-5xl font-black text-yellow-400 font-mono">{winner.score}</div>
                        <div className="text-white/40 text-sm font-mono mt-1">
                            {difficulty.icon} {cs ? difficulty.nameCs : difficulty.name}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-3xl font-black" style={{ color: PLAYER_COLORS[winner.id]?.hex }}>
                            {winner.name} <span className="text-yellow-400">{cs ? 'VYHRÁVÁ!' : 'WINS!'}</span>
                        </div>
                        <div className="text-white/40 text-sm font-mono mt-1">
                            {winner.score} {cs ? 'bodů' : 'points'}
                        </div>
                    </>
                )}
            </div>

            {/* Skiller */}
            <div className="bg-black/40 border border-yellow-500/20 rounded-xl px-4 py-2 text-white/60 text-sm font-mono text-center">
                🤖 {endPhrase}
            </div>

            {/* Scoreboard */}
            <div className="w-full space-y-2">
                {sorted.map((p, i) => {
                    const validResults = p.results.filter(r => r.reactionMs > 0);
                    const avgReaction = validResults.length
                        ? Math.round(validResults.reduce((s, r) => s + r.reactionMs, 0) / validResults.length)
                        : 0;
                    const bestReaction = p.bestReaction < Infinity ? p.bestReaction : 0;

                    return (
                        <div key={p.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                                ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
                            <span className="text-xl w-8 text-center">
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                            </span>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAYER_COLORS[p.id]?.hex }} />
                            <div className="flex-1">
                                <div className="font-bold text-white text-sm">{p.name}</div>
                                <div className="text-white/30 text-xs font-mono">
                                    ⚡ {avgReaction}ms avg · 🏆 {bestReaction}ms best · ❌ {p.falseStarts} false
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-black text-lg font-mono">{p.score}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Comparison stats (solo only) */}
            {isSolo && (() => {
                const validResults = winner.results.filter(r => r.reactionMs > 0);
                const avgReaction = validResults.length
                    ? Math.round(validResults.reduce((s, r) => s + r.reactionMs, 0) / validResults.length)
                    : 0;

                if (avgReaction <= 0) return null;

                const comparisons = getReactionComparisons(avgReaction, cs);

                return (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4">
                        <button onClick={() => setShowComparisons(!showComparisons)}
                            className="w-full flex items-center justify-between text-white/30 text-xs font-mono uppercase">
                            <span>🧠 {cs ? 'TVOJE REAKCE V POROVNÁNÍ' : 'YOUR REACTION COMPARED'}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showComparisons ? 'rotate-180' : ''}`} />
                        </button>

                        {showComparisons && (
                            <div className="mt-3 space-y-3">
                                {/* Closest match */}
                                {comparisons.closestMatch && (
                                    <div className="text-center bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                        <div className="text-white/40 text-[10px] font-mono mb-1">
                                            {cs ? 'NEJPODOBNĚJŠÍ REAKCE' : 'CLOSEST MATCH'}
                                        </div>
                                        <div className="text-3xl mb-1">{comparisons.closestMatch.icon}</div>
                                        <div className="text-yellow-400 font-bold text-sm">{comparisons.closestMatch.label}</div>
                                        <div className="text-white/30 text-xs font-mono">
                                            ⚡ {comparisons.closestMatch.avgMs}ms {cs ? 'průměr' : 'avg'} · {cs ? 'Ty' : 'You'}: {avgReaction}ms
                                        </div>
                                    </div>
                                )}

                                {/* Comparison bars by category */}
                                {REACTION_BENCHMARKS.map((cat, ci) => (
                                    <div key={ci}>
                                        <div className="text-white/20 text-[10px] font-mono mb-1">
                                            {cs ? cat.categoryCs : cat.category}
                                        </div>
                                        <div className="space-y-1">
                                            {cat.items.map((item, ii) => {
                                                const maxMs = 1000;
                                                const itemW = Math.min((item.avgMs / maxMs) * 100, 100);
                                                const playerW = Math.min((avgReaction / maxMs) * 100, 100);
                                                const isFaster = avgReaction < item.avgMs;
                                                return (
                                                    <div key={ii} className="flex items-center gap-2">
                                                        <span className="text-sm w-5">{item.icon}</span>
                                                        <span className={`text-[10px] w-20 truncate ${isFaster ? 'text-green-400' : 'text-white/30'}`}>
                                                            {cs ? item.labelCs : item.label}
                                                        </span>
                                                        <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden">
                                                            {/* Benchmark bar */}
                                                            <div className="absolute inset-y-0 left-0 rounded-full bg-white/10"
                                                                style={{ width: `${itemW}%` }} />
                                                            {/* Player marker */}
                                                            <div className={`absolute top-0 bottom-0 w-0.5 ${isFaster ? 'bg-green-400' : 'bg-red-400'}`}
                                                                style={{ left: `${playerW}%` }} />
                                                        </div>
                                                        <span className="text-white/20 text-[10px] font-mono w-10 text-right">
                                                            {item.avgMs}ms
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Summary */}
                                <div className="text-center text-white/30 text-xs font-mono pt-2 border-t border-white/5">
                                    {cs
                                        ? `Rychlejší než ${comparisons.fasterThan.length} z ${comparisons.fasterThan.length + comparisons.slowerThan.length} benchmarků`
                                        : `Faster than ${comparisons.fasterThan.length} of ${comparisons.fasterThan.length + comparisons.slowerThan.length} benchmarks`}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Per-round chart */}
            <button onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-white/30 hover:text-white/60 text-xs font-mono transition-colors">
                📊 {cs ? 'DETAILY REAKCÍ' : 'REACTION DETAILS'}
                <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>

            {showDetails && (
                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-white/30 text-xs font-mono mb-2">
                        {cs ? 'REAKCE PO KOLECH' : 'PER-ROUND REACTIONS'} (ms)
                    </div>
                    <div className="flex items-end gap-1 h-20">
                        {players[0]?.results.map((_, roundIdx) => {
                            const maxMs = 1000;
                            return (
                                <div key={roundIdx} className="flex-1 flex gap-[1px] items-end h-full">
                                    {players.map(p => {
                                        const result = p.results[roundIdx];
                                        const ms = result?.reactionMs || 0;
                                        const h = ms > 0 ? Math.max(5, Math.min((ms / maxMs) * 100, 100)) : 3;
                                        return (
                                            <div key={p.id}
                                                className="flex-1 rounded-t-sm"
                                                style={{
                                                    height: `${h}%`,
                                                    backgroundColor: ms > 0 ? PLAYER_COLORS[p.id]?.hex : '#333',
                                                    minWidth: 3,
                                                }}
                                                title={`${p.name}: ${ms > 0 ? `${ms}ms` : 'timeout'}`}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-[8px] text-white/20 font-mono mt-1">
                        <span>R1</span>
                        <span>R{players[0]?.results.length}</span>
                    </div>
                </div>
            )}

            {/* Submit score (solo only) */}
            {isSolo && (
                <>
                    {!submitted ? (
                        <div className="w-full flex gap-2">
                            <input
                                type="text"
                                value={playerName}
                                onChange={e => onPlayerNameChange(e.target.value)}
                                placeholder={cs ? 'Tvoje jméno...' : 'Your name...'}
                                maxLength={20}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                                    placeholder:text-white/20 outline-none focus:border-yellow-500/50"
                            />
                            <button onClick={onSubmit} disabled={!playerName.trim()}
                                className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/10 disabled:text-white/20
                                    text-black font-bold text-sm px-4 py-2 rounded-lg transition-all">
                                📤 {cs ? 'ULOŽIT' : 'SUBMIT'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-green-400 text-sm font-mono">
                            ✓ {cs ? 'Skóre uloženo!' : 'Score submitted!'}
                        </div>
                    )}
                </>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
                <button onClick={onRetry}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm py-3 rounded-lg transition-all">
                    🔄 {cs ? 'ZNOVU' : 'RETRY'}
                </button>
                <button onClick={onBackToMenu}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm py-3 rounded-lg transition-all">
                    📋 MENU
                </button>
            </div>

            {/* Leaderboard link */}
            <button onClick={() => onSetShowLeaderboard(!showLeaderboard)}
                className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-mono transition-colors">
                🏆 {cs ? 'ŽEBŘÍČEK' : 'LEADERBOARD'}
            </button>

            {/* LAN promo */}
            <div className="text-center text-white/15 text-xs font-mono max-w-xs mt-2">
                {cs
                    ? '🎮 V partě na LANce je všechno lepší. Zastavte se ve SkillZone a zahrajte si s přáteli ty pravé pecky vedle sebe!'
                    : '🎮 Everything is better with friends. Visit SkillZone to play the real games side-by-side!'}
            </div>
        </div>
    );
};

export default ReactionResults;
