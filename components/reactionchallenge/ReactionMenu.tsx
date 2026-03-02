import React from 'react';
import { ChevronDown, Users, Zap } from 'lucide-react';
import {
    REACTION_DIFFICULTIES, MODE_INFO,
    type ReactionMode, type ReactionDifficulty, type DifficultyId,
} from '../../services/reactionChallengeService';

const isTouchDevice = typeof navigator !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

interface ReactionMenuProps {
    mode: ReactionMode;
    difficulty: ReactionDifficulty;
    onChangeMode: (m: ReactionMode) => void;
    onChangeDifficulty: (d: ReactionDifficulty) => void;
    onStart: () => void;
    onShowLeaderboard: () => void;
    cs: boolean;
}

const ReactionMenu: React.FC<ReactionMenuProps> = ({
    mode, difficulty, onChangeMode, onChangeDifficulty, onStart, onShowLeaderboard, cs,
}) => {
    const [showDiffPicker, setShowDiffPicker] = React.useState(false);

    const modeEntries = Object.entries(MODE_INFO) as [ReactionMode, typeof MODE_INFO[ReactionMode]][];

    return (
        <div className="flex flex-col items-center gap-5 px-4 max-w-lg w-full max-h-[90vh] overflow-y-auto pb-8">
            {/* Title */}
            <div className="text-center">
                <div className="text-5xl mb-2">⚡</div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                    <span className="text-white">REACTION </span>
                    <span className="text-yellow-400">CHALLENGE</span>
                </h1>
                <p className="text-white/40 text-sm mt-1 font-mono">
                    {cs ? 'Jak rychlé máš reflexy?' : 'How fast are your reflexes?'}
                </p>
            </div>

            {/* Mode selector */}
            <div className="w-full">
                <div className="text-white/30 text-xs font-mono mb-2 uppercase">
                    {cs ? 'Režim hry' : 'Game Mode'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {modeEntries.map(([id, info]) => (
                        <button key={id}
                            onClick={() => onChangeMode(id)}
                            className={`flex items-center gap-2 px-3 py-3 rounded-lg border transition-all text-left
                                ${mode === id
                                    ? 'border-yellow-500/50 bg-yellow-500/10 ring-1 ring-yellow-500/30'
                                    : 'border-white/10 hover:bg-white/5'}`}>
                            <span className="text-xl">{info.icon}</span>
                            <div>
                                <div className={`font-bold text-sm ${mode === id ? 'text-yellow-400' : 'text-white/70'}`}>
                                    {cs ? info.nameCs : info.name}
                                </div>
                                <div className="text-white/30 text-[10px] leading-tight">
                                    {cs ? info.descriptionCs : info.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty picker */}
            <div className="w-full">
                <div className="text-white/30 text-xs font-mono mb-2 uppercase">
                    {cs ? 'Obtížnost' : 'Difficulty'}
                </div>
                <button onClick={() => setShowDiffPicker(!showDiffPicker)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${difficulty.borderColor} ${difficulty.bgColor} transition-all`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{difficulty.icon}</span>
                        <div className="text-left">
                            <div className={`font-bold ${difficulty.color}`}>{cs ? difficulty.nameCs : difficulty.name}</div>
                            <div className="text-white/40 text-xs">{cs ? difficulty.descriptionCs : difficulty.description}</div>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${showDiffPicker ? 'rotate-180' : ''}`} />
                </button>

                {showDiffPicker && (
                    <div className="mt-2 space-y-1">
                        {REACTION_DIFFICULTIES.map(d => (
                            <button key={d.id}
                                onClick={() => { onChangeDifficulty(d); setShowDiffPicker(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg border transition-all hover:bg-white/5
                                    ${difficulty.id === d.id ? `${d.borderColor} ${d.bgColor}` : 'border-white/10'}`}>
                                <span className="text-xl">{d.icon}</span>
                                <div className="text-left">
                                    <div className={`font-semibold text-sm ${d.color}`}>{cs ? d.nameCs : d.name}</div>
                                    <div className="text-white/30 text-xs">{cs ? d.descriptionCs : d.description}</div>
                                </div>
                                <div className="ml-auto text-white/20 text-xs font-mono">{d.rounds}R</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Game info */}
            <div className="grid grid-cols-3 gap-2 w-full text-center">
                {[
                    { label: cs ? 'KOLA' : 'ROUNDS', value: difficulty.rounds, icon: '🔄' },
                    { label: cs ? 'HRÁČI' : 'PLAYERS', value: `${MODE_INFO[mode].minPlayers}${MODE_INFO[mode].maxPlayers > MODE_INFO[mode].minPlayers ? `-${MODE_INFO[mode].maxPlayers}` : ''}`, icon: '👥' },
                    { label: 'FAKEOUTS', value: difficulty.hasFakeouts ? (cs ? 'ANO' : 'YES') : 'NO', icon: '🎭' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/30 text-[10px] font-mono">{s.icon} {s.label}</div>
                        <div className="text-white font-bold text-sm">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* How to play */}
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white/30 text-xs font-mono mb-2 uppercase">📖 {cs ? 'JAK HRÁT' : 'HOW TO PLAY'}</div>
                <div className="space-y-2 text-sm text-white/60">
                    {/* Step 1 — Controls */}
                    <div className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold text-xs mt-0.5">1.</span>
                        <span>
                            {mode === 'solo'
                                ? (isTouchDevice
                                    ? (cs ? 'Klepni kamkoliv na obrazovku, jakmile uvidíš ZELENÝ signál.' : 'Tap anywhere when you see the GREEN signal.')
                                    : (cs ? 'Čekej a zmáčkni MEZERNÍK, jakmile uvidíš ZELENÝ signál.' : 'Wait and hit SPACE when you see the GREEN signal.'))
                                : (isTouchDevice
                                    ? (cs ? 'Každý hráč má svou zónu na obrazovce. Klepněte co nejrychleji!' : 'Each player has a screen zone. Tap as fast as you can!')
                                    : (cs ? 'Každý hráč si vybere klávesu. Zmáčkněte ji co nejrychleji!' : 'Each player picks a key. Press it as fast as you can!'))}
                        </span>
                    </div>
                    {/* Step 2 — Don't jump early */}
                    <div className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold text-xs mt-0.5">2.</span>
                        <span>{cs ? 'Nemačkej příliš brzy! Falešný start = penalizace bodů.' : "Don't press too early! False start = point penalty."}</span>
                    </div>
                    {/* Step 3 — Difficulty-specific */}
                    {difficulty.hasFakeouts && (
                        <div className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold text-xs mt-0.5">3.</span>
                            <span>{cs ? '🎭 Pozor na FAKEOUTY! Reaguj jen na ZELENOU, ne na jiné barvy.' : '🎭 Watch for FAKEOUTS! Only react to GREEN, not other colors.'}</span>
                        </div>
                    )}
                    {/* Control hint */}
                    {!isTouchDevice && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-white/30 text-xs font-mono">
                            ⌨️ {mode === 'solo'
                                ? (cs ? 'Ovládání: MEZERNÍK' : 'Control: SPACE')
                                : (cs ? 'Klávesy si nastavíte v dalším kroku' : 'You\'ll set keys in the next step')}
                        </div>
                    )}
                </div>
            </div>

            {/* Start */}
            <button onClick={onStart}
                className="w-full max-w-xs bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl py-4 rounded-xl
                    transition-all hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/30 flex items-center justify-center gap-2">
                <Zap className="w-6 h-6" /> START
            </button>

            {/* Leaderboard link */}
            <button onClick={onShowLeaderboard}
                className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-mono transition-colors">
                🏆 {cs ? 'ŽEBŘÍČEK' : 'LEADERBOARD'}
            </button>

            {/* Skiller vibe */}
            <div className="text-center text-white/15 text-xs font-mono mt-2 max-w-xs">
                {cs
                    ? '💡 Tip: Přijďte si to zahrát naživo do SkillZone — vedle sebe je to úplně jiný zážitek!'
                    : '💡 Tip: Come play at SkillZone — side by side it hits different!'}
            </div>
        </div>
    );
};

export default ReactionMenu;
