import React from 'react';
import { ChevronDown, Monitor, Smartphone } from 'lucide-react';
import {
    DIFFICULTY_LEVELS, CERTIFIED_CHALLENGES,
    type DifficultyLevel, type InputMode, type CertifiedChallenge,
    fetchLeaderboard,
} from '../../services/aimChallengeService';

interface AimMenuProps {
    difficulty: DifficultyLevel;
    onChangeDifficulty: (d: DifficultyLevel) => void;
    inputMode: InputMode;
    resLabel: string;
    onStart: (cert?: CertifiedChallenge) => void;
    onShowLeaderboard: () => void;
    cs: boolean;
}

const AimMenu: React.FC<AimMenuProps> = ({
    difficulty, onChangeDifficulty, inputMode, resLabel, onStart, onShowLeaderboard, cs,
}) => {
    const [showDifficultyPicker, setShowDifficultyPicker] = React.useState(false);
    const [showCertified, setShowCertified] = React.useState(false);

    const effectiveDiff = difficulty;

    return (
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
                                onClick={() => { onChangeDifficulty(d); setShowDifficultyPicker(false); }}
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
            <button onClick={() => onStart()}
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
                                    onClick={() => onStart(c)}
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
            <button onClick={onShowLeaderboard}
                className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-mono transition-colors">
                🏆 {cs ? 'ŽEBŘÍČEK' : 'LEADERBOARD'}
            </button>
        </div>
    );
};

export default AimMenu;
