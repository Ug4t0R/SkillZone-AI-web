import React from 'react';
import { X, ChevronDown, Monitor, Smartphone, Info } from 'lucide-react';
import {
    type DifficultyLevel, type InputMode, type LeaderboardEntry, type GameStats,
    type CertifiedChallenge, getRank,
} from '../../services/aimChallengeService';

interface AimResultsProps {
    gameStats: GameStats;
    difficulty: DifficultyLevel;
    inputMode: InputMode;
    resLabel: string;
    activeCertified: CertifiedChallenge | null;
    leaderboard: LeaderboardEntry[];
    showLeaderboard: boolean;
    leaderboardTab: InputMode;
    playerName: string;
    submitted: boolean;
    cs: boolean;
    onSetLeaderboardTab: (tab: InputMode) => void;
    onSetShowLeaderboard: (show: boolean) => void;
    onPlayerNameChange: (name: string) => void;
    onSubmit: () => void;
    onRetry: () => void;
    onBackToMenu: () => void;
}

const AimResults: React.FC<AimResultsProps> = ({
    gameStats, difficulty, inputMode, resLabel, activeCertified,
    leaderboard, showLeaderboard, leaderboardTab,
    playerName, submitted, cs,
    onSetLeaderboardTab, onSetShowLeaderboard, onPlayerNameChange,
    onSubmit, onRetry, onBackToMenu,
}) => {
    const [showStats, setShowStats] = React.useState(false);
    const rank = getRank(gameStats.score, difficulty.id);

    if (!rank) return null;

    return (
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
                        onChange={e => onPlayerNameChange(e.target.value)}
                        placeholder={cs ? 'Tvoje jméno...' : 'Your name...'}
                        maxLength={20}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                                   placeholder:text-white/20 outline-none focus:border-red-500/50"
                    />
                    <button
                        onClick={onSubmit}
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
                <button onClick={onRetry}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm py-3 rounded-lg transition-all">
                    🔄 {cs ? 'ZNOVU' : 'RETRY'}
                </button>
                <button onClick={onBackToMenu}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm py-3 rounded-lg transition-all">
                    📋 MENU
                </button>
            </div>

            {/* Leaderboard modal */}
            {showLeaderboard && (
                <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h2 className="text-white font-bold">🏆 {cs ? 'Žebříček' : 'Leaderboard'}</h2>
                            <button onClick={() => onSetShowLeaderboard(false)}
                                className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            {(['mouse', 'touch'] as InputMode[]).map(mode => (
                                <button key={mode}
                                    onClick={() => onSetLeaderboardTab(mode)}
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

export default AimResults;
