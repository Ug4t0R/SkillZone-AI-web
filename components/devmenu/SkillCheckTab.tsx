// DevMenu Skill Check Quiz Management Tab
import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Hash, Copy, Check, RefreshCw, Trash2, Plus, Save } from 'lucide-react';
import { getSetting, setSetting } from '../../services/webDataService';

interface SkillCheckTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

interface PromoCode {
    code: string;
    reward: string;
    minScore: number;
    used: number;
    active: boolean;
}

const DEFAULT_PROMOS: PromoCode[] = [
    { code: 'SKILLZONE-PRO-30', reward: '30 min zdarma', minScore: 7, used: 0, active: true },
    { code: 'SKILLZONE-GG-15', reward: '15 min zdarma', minScore: 4, used: 0, active: true },
    { code: 'SKILLZONE-NOOB-5', reward: '5 min zdarma', minScore: 0, used: 0, active: true },
];

const PROMOS_KEY = 'skillcheck_promos';
const STATS_KEY = 'quiz_stats';

interface QuizStats {
    plays: number;
    totalScore: number;
    topScore: number;
}

const SkillCheckTab: React.FC<SkillCheckTabProps> = ({ addLog }) => {
    const [promos, setPromos] = useState<PromoCode[]>(DEFAULT_PROMOS);
    const [copied, setCopied] = useState<string | null>(null);
    const [stats, setStats] = useState({ totalPlays: 0, avgScore: 0, topRank: 'N/A' });

    useEffect(() => {
        // Load promos from Supabase
        getSetting<PromoCode[] | null>(PROMOS_KEY, null).then(data => {
            if (data) setPromos(data);
        });
        // Load quiz stats from Supabase
        getSetting<QuizStats | null>(STATS_KEY, null).then(data => {
            if (data) {
                const avg = data.plays > 0 ? Math.round(data.totalScore / data.plays * 10) / 10 : 0;
                const rank = data.topScore === 10 ? 'LEGENDARY' : data.topScore >= 8 ? 'DIAMOND' : data.topScore >= 6 ? 'GOLD' : data.topScore >= 4 ? 'SILVER' : data.topScore > 0 ? 'BRONZE' : 'N/A';
                setStats({ totalPlays: data.plays, avgScore: avg, topRank: rank });
            }
        });
    }, []);

    const handleToggle = async (index: number) => {
        const updated = [...promos];
        updated[index].active = !updated[index].active;
        setPromos(updated);
        await setSetting(PROMOS_KEY, updated);
        addLog(`Promo ${updated[index].code} ${updated[index].active ? 'aktivován' : 'deaktivován'}.`, updated[index].active ? 'success' : 'info');
    };

    const handleCodeChange = (index: number, code: string) => {
        const updated = [...promos];
        updated[index].code = code.toUpperCase();
        setPromos(updated);
    };

    const handleRewardChange = (index: number, reward: string) => {
        const updated = [...promos];
        updated[index].reward = reward;
        setPromos(updated);
    };

    const handleScoreChange = (index: number, minScore: number) => {
        const updated = [...promos];
        updated[index].minScore = minScore;
        setPromos(updated);
    };

    const handleSave = async () => {
        await setSetting(PROMOS_KEY, promos);
        addLog('Promo kódy uloženy.', 'success');
    };

    const handleReset = async () => {
        setPromos(DEFAULT_PROMOS);
        await setSetting(PROMOS_KEY, DEFAULT_PROMOS);
        addLog('Promo kódy resetovány na výchozí.', 'info');
    };

    const handleDelete = async (index: number) => {
        const code = promos[index].code;
        const updated = promos.filter((_, i) => i !== index);
        setPromos(updated);
        await setSetting(PROMOS_KEY, updated);
        addLog(`Promo ${code} smazán.`, 'info');
    };

    const handleAdd = async () => {
        const newPromo: PromoCode = {
            code: 'SKILLZONE-NEW',
            reward: '10 min zdarma',
            minScore: 5,
            used: 0,
            active: true,
        };
        const updated = [...promos, newPromo];
        setPromos(updated);
        await setSetting(PROMOS_KEY, updated);
        addLog('Nový promo kód přidán.', 'success');
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 1500);
    };

    const resetStats = async () => {
        await setSetting(STATS_KEY, { plays: 0, totalScore: 0, topScore: 0 });
        setStats({ totalPlays: 0, avgScore: 0, topRank: 'N/A' });
        addLog('Statistiky kvízu resetovány.', 'info');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Quiz Stats */}
            <div className="bg-zinc-800/50 p-6 border border-sz-red/20 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center gap-2 uppercase">
                    <Trophy className="text-sz-red w-5 h-5" /> Quiz_Stats
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/50 p-4 rounded border border-white/10 text-center">
                        <div className="text-2xl font-orbitron font-bold text-white">{stats.totalPlays}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">Celkem her</div>
                    </div>
                    <div className="bg-black/50 p-4 rounded border border-white/10 text-center">
                        <div className="text-2xl font-orbitron font-bold text-sz-red">{stats.avgScore}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">Průměr skóre</div>
                    </div>
                    <div className="bg-black/50 p-4 rounded border border-white/10 text-center">
                        <div className={`text-2xl font-orbitron font-bold ${stats.topRank === 'LEGENDARY' ? 'text-yellow-400' :
                            stats.topRank === 'DIAMOND' ? 'text-blue-400' :
                                stats.topRank === 'GOLD' ? 'text-yellow-500' :
                                    'text-gray-400'
                            }`}>{stats.topRank}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">Top rank</div>
                    </div>
                </div>
                <button
                    onClick={resetStats}
                    className="mt-4 text-gray-600 hover:text-red-400 text-xs font-mono uppercase flex items-center gap-1 transition-colors"
                >
                    <RefreshCw className="w-3 h-3" /> Reset statistik
                </button>
            </div>

            {/* Promo Codes Management */}
            <div className="bg-zinc-800/50 p-6 border border-sz-red/20 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2 uppercase">
                        <Hash className="text-sz-red w-5 h-5" /> Promo_Codes
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            className="px-3 py-1.5 bg-sz-red/10 border border-sz-red/30 text-sz-red text-xs font-bold uppercase rounded hover:bg-sz-red/20 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Přidat
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold uppercase rounded hover:bg-green-500/20 transition-colors flex items-center gap-1"
                        >
                            <Save className="w-3 h-3" /> Uložit
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-3 py-1.5 bg-black border border-white/10 text-gray-500 text-xs font-bold uppercase rounded hover:border-white/30 transition-colors flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" /> Reset
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {promos.map((promo, i) => (
                        <div
                            key={i}
                            className={`bg-black/50 p-4 rounded border transition-all ${promo.active ? 'border-white/10 hover:border-sz-red/30' : 'border-white/5 opacity-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Code */}
                                <input
                                    type="text"
                                    value={promo.code}
                                    onChange={e => handleCodeChange(i, e.target.value)}
                                    className="bg-zinc-900 border border-white/10 px-3 py-2 text-white font-mono text-sm rounded w-48 focus:border-sz-red outline-none"
                                />

                                {/* Reward */}
                                <input
                                    type="text"
                                    value={promo.reward}
                                    onChange={e => handleRewardChange(i, e.target.value)}
                                    className="bg-zinc-900 border border-white/10 px-3 py-2 text-gray-300 text-sm rounded flex-1 focus:border-sz-red outline-none"
                                    placeholder="Odměna..."
                                />

                                {/* Min Score */}
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-600 uppercase font-mono">Min:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={promo.minScore}
                                        onChange={e => handleScoreChange(i, parseInt(e.target.value) || 0)}
                                        className="bg-zinc-900 border border-white/10 px-2 py-2 text-white font-mono text-sm rounded w-14 text-center focus:border-sz-red outline-none"
                                    />
                                </div>

                                {/* Actions */}
                                <button
                                    onClick={() => copyCode(promo.code)}
                                    className="p-2 text-gray-500 hover:text-white transition-colors"
                                    title="Kopírovat kód"
                                >
                                    {copied === promo.code ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleToggle(i)}
                                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-all ${promo.active
                                        ? 'border-green-500/50 text-green-400'
                                        : 'border-red-500/50 text-red-400'
                                        }`}
                                >
                                    {promo.active ? 'ON' : 'OFF'}
                                </button>
                                <button
                                    onClick={() => handleDelete(i)}
                                    className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                    title="Smazat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Launch */}
            <div className="bg-zinc-800/50 p-6 border border-sz-red/20 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center gap-2 uppercase">
                    <Gamepad2 className="text-sz-red w-5 h-5" /> Quick_Launch
                </h3>
                <button
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('skillcheck:open'));
                        addLog('Skill Check quiz spuštěn.', 'success');
                    }}
                    className="w-full py-3 bg-sz-red hover:bg-sz-red-dark text-white font-bold font-orbitron uppercase rounded flex items-center justify-center gap-2 transition-colors"
                >
                    <Gamepad2 className="w-5 h-5" /> Spustit Skill Check
                </button>
                <p className="mt-3 text-gray-600 text-xs font-mono text-center">
                    Nebo použij Konami kód: ↑↑↓↓←→←→BA
                </p>
            </div>
        </div>
    );
};

export default SkillCheckTab;
