import React, { useState, useEffect } from 'react';
import { Brain, Trash2, RefreshCw, Smartphone, Search, AlertCircle, Save, Eye, Palette } from 'lucide-react';
import { UserProfile } from '../../types';
import { getAllUserProfiles, deleteUserProfile, getOrCreateVisitorId, saveRemoteUserProfile } from '../../utils/devTools';
import { generateSkillerStats } from '../../services/geminiService';
import { SkillerCharacter } from '../SkillerAvatar';
import { WeatherCondition } from '../../services/weatherService';
import ReactMarkdown from 'react-markdown';

const SkillerTab: React.FC = () => {
    const [profiles, setProfiles] = useState<{ visitorId: string, profile: UserProfile }[]>([]);
    const [localVisitorId, setLocalVisitorId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<string>('');
    const [generatingStats, setGeneratingStats] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            setLocalVisitorId(getOrCreateVisitorId());
            const data = await getAllUserProfiles();
            // Sort to show local machine first, then by interaction count or visit date
            data.sort((a, b) => {
                if (a.visitorId === getOrCreateVisitorId()) return -1;
                if (b.visitorId === getOrCreateVisitorId()) return 1;
                return new Date(b.profile.lastVisit).getTime() - new Date(a.profile.lastVisit).getTime();
            });
            setProfiles(data);
        } catch (e) {
            console.error('Failed to load profiles', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (visitorId: string) => {
        if (confirm(`Opravdu smazat paměť Skillera pro počítač "${visitorId}"?`)) {
            const success = await deleteUserProfile(visitorId);
            if (success) {
                setProfiles(prev => prev.filter(p => p.visitorId !== visitorId));
            }
        }
    };

    const handleSaveInstruction = async (visitorId: string, profile: UserProfile, newInstruction: string) => {
        const updatedProfile = { ...profile, adminInstructions: newInstruction };
        const success = await saveRemoteUserProfile(visitorId, updatedProfile);

        if (success) {
            setProfiles(prev => prev.map(p => p.visitorId === visitorId ? { ...p, profile: updatedProfile } : p));
        } else {
            alert('Nastala chyba při ukládání instrukce.');
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.visitorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.profile.nickname || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleGenerateStats = async () => {
        setGeneratingStats(true);
        const result = await generateSkillerStats(profiles.map(p => p.profile));
        setStats(result);
        setGeneratingStats(false);
    };

    // ─── Character Preview state ───
    const [previewMood, setPreviewMood] = useState('NORMAL');
    const [previewWeather, setPreviewWeather] = useState<WeatherCondition>('unknown');
    const [previewWalking, setPreviewWalking] = useState(false);
    const [previewDead, setPreviewDead] = useState(false);
    const [previewFacingLeft, setPreviewFacingLeft] = useState(false);

    const moods = ['NORMAL', 'HYPE', 'TILT', 'TIRED'] as const;
    const weathers: WeatherCondition[] = ['unknown', 'sun', 'rain', 'snow', 'storm', 'cloudy', 'fog'];
    const weatherEmojis: Record<string, string> = { unknown: '—', sun: '☀️', rain: '🌧️', snow: '❄️', storm: '⛈️', cloudy: '☁️', fog: '🌫️' };
    const moodColors: Record<string, string> = { NORMAL: 'text-sz-red', HYPE: 'text-green-400', TILT: 'text-red-400', TIRED: 'text-yellow-400' };

    return (
        <div className="space-y-6">

            {/* ═══════ CHARACTER PREVIEW ═══════ */}
            <div className="bg-black/60 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <h3 className="font-orbitron font-bold text-sm uppercase text-purple-400">Character_Preview</h3>
                </div>

                {/* Preview area — front & side */}
                <div className="flex items-end justify-center gap-12 bg-zinc-900/80 rounded-lg p-8 mb-4 border border-white/5 min-h-[160px]">
                    {/* Front View */}
                    <div className="flex flex-col items-center">
                        <div className="text-[10px] text-gray-500 font-mono mb-3 uppercase">Front</div>
                        <div style={{ transform: 'scale(3)', transformOrigin: 'bottom center' }}>
                            <SkillerCharacter
                                mood={previewMood}
                                isDead={previewDead}
                                weather={previewWeather === 'unknown' ? undefined : previewWeather}
                                facingLeft={false}
                                isWalking={false}
                            />
                        </div>
                    </div>

                    {/* Side View */}
                    <div className="flex flex-col items-center">
                        <div className="text-[10px] text-gray-500 font-mono mb-3 uppercase">Side</div>
                        <div style={{ transform: 'scale(3)', transformOrigin: 'bottom center' }}>
                            <SkillerCharacter
                                mood={previewMood}
                                isDead={previewDead}
                                weather={previewWeather === 'unknown' ? undefined : previewWeather}
                                facingLeft={previewFacingLeft}
                                isWalking={true}
                            />
                        </div>
                    </div>

                    {/* Walking View */}
                    <div className="flex flex-col items-center">
                        <div className="text-[10px] text-gray-500 font-mono mb-3 uppercase">Live</div>
                        <div style={{ transform: 'scale(3)', transformOrigin: 'bottom center', animation: previewWalking ? 'skillerBobble 0.4s ease-in-out infinite' : 'none' }}>
                            <SkillerCharacter
                                mood={previewMood}
                                isDead={previewDead}
                                weather={previewWeather === 'unknown' ? undefined : previewWeather}
                                facingLeft={previewFacingLeft}
                                isWalking={previewWalking}
                            />
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Mood */}
                    <div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase mb-2 flex items-center gap-1">
                            <Palette className="w-3 h-3" /> Mood
                        </div>
                        <div className="flex gap-1">
                            {moods.map(m => (
                                <button key={m} onClick={() => setPreviewMood(m)}
                                    className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all ${previewMood === m
                                        ? `bg-white/10 ${moodColors[m]} border border-white/20`
                                        : 'bg-zinc-800 text-gray-500 hover:text-gray-300 border border-transparent'
                                        }`}
                                >{m}</button>
                            ))}
                        </div>
                    </div>

                    {/* Weather */}
                    <div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase mb-2">Weather</div>
                        <div className="flex gap-1">
                            {weathers.map(w => (
                                <button key={w} onClick={() => setPreviewWeather(w)}
                                    className={`px-2 py-1 rounded text-xs font-mono transition-all ${previewWeather === w
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'bg-zinc-800 text-gray-500 hover:text-gray-300 border border-transparent'
                                        }`}
                                >{weatherEmojis[w]}</button>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase mb-2">State</div>
                        <div className="flex gap-2">
                            <button onClick={() => setPreviewWalking(!previewWalking)}
                                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all border ${previewWalking
                                    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                                    : 'bg-zinc-800 text-gray-500 border-transparent'
                                    }`}
                            >🚶 Walk</button>
                            <button onClick={() => setPreviewDead(!previewDead)}
                                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all border ${previewDead
                                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                    : 'bg-zinc-800 text-gray-500 border-transparent'
                                    }`}
                            >☠️ Dead</button>
                            <button onClick={() => setPreviewFacingLeft(!previewFacingLeft)}
                                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all border ${previewFacingLeft
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                    : 'bg-zinc-800 text-gray-500 border-transparent'
                                    }`}
                            >{previewFacingLeft ? '← Left' : '→ Right'}</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ EXISTING: Memory Management ═══════ */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Brain className="w-6 h-6 text-sz-red" />
                        Správa Osobností a Paměti (Skiller)
                    </h2>
                    <p className="text-gray-400 mt-1">
                        Sdílený databázový přehled všech počítačů a jejich lokální chatovací paměti.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Hledat podle ID nebo jména..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-800 border border-white/10 rounded-sm pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-sz-red w-64"
                        />
                    </div>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 bg-zinc-800 text-gray-400 hover:text-white rounded-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        title="Obnovit data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleGenerateStats}
                        disabled={generatingStats || profiles.length === 0}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="Vygenerovat Globální AI Shrnutí Komunity"
                    >
                        <Brain className={`w-4 h-4 ${generatingStats ? 'animate-pulse' : ''}`} />
                        {generatingStats ? 'Analyzuji...' : 'AI Shrnutí'}
                    </button>
                </div>
            </div>

            {/* AI Stats Display */}
            {(stats || generatingStats) && (
                <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-sm relative">
                    <h3 className="text-purple-400 font-bold font-orbitron uppercase mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5" /> Skiller's Community Analysis
                    </h3>
                    {generatingStats ? (
                        <div className="text-purple-300 font-mono text-sm animate-pulse">
                            Skiller právě čte profily a hodnotí své návštěvníky...
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-p:text-sm prose-p:text-gray-300 prose-headings:text-purple-300 prose-li:text-gray-300 max-w-none">
                            <ReactMarkdown>{stats}</ReactMarkdown>
                        </div>
                    )}
                    {stats && !generatingStats && (
                        <button
                            onClick={() => setStats('')}
                            className="absolute top-4 right-4 text-purple-400/50 hover:text-purple-400 text-xs font-mono uppercase"
                        >
                            Zavřít
                        </button>
                    )}
                </div>
            )}

            <div className="space-y-4">
                {filteredProfiles.length === 0 && !loading && (
                    <div className="text-center py-10 bg-zinc-900 border border-white/5 rounded-sm">
                        <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Žádné profily nebyly nalezeny.</p>
                    </div>
                )}

                {filteredProfiles.map(({ visitorId, profile }) => {
                    const isLocal = visitorId === localVisitorId;
                    return (
                        <div key={visitorId} className={`bg-zinc-900 border ${isLocal ? 'border-sz-red/50 shadow-[0_0_15px_rgba(255,0,0,0.1)]' : 'border-white/10'} p-5 rounded-sm`}>
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                {/* Info Section */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Smartphone className="w-5 h-5 text-gray-400" />
                                            {profile.nickname || 'Anonym (Zatím tě nezná)'}
                                        </h3>
                                        {isLocal && (
                                            <span className="bg-sz-red text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                Tento Počítač
                                            </span>
                                        )}
                                        <code className="text-gray-500 font-mono text-xs">{visitorId}</code>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className="text-gray-600 text-[10px] uppercase font-bold tracking-wider block">Interakce</span>
                                            <span className="text-gray-300 text-sm mt-0.5 block">{profile.interactionCount} zpráv</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 text-[10px] uppercase font-bold tracking-wider block">Poslední Aktivita</span>
                                            <span className="text-gray-300 text-sm mt-0.5 block">{new Date(profile.lastVisit).toLocaleDateString()}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-600 text-[10px] uppercase font-bold tracking-wider block">Nálada / Persona</span>
                                            <span className="text-gray-300 text-sm mt-0.5 block">{profile.persona || '-'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-gray-600 text-[10px] uppercase font-bold tracking-wider block mb-1">Známá Fakta / Oblíbené hry</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.favoriteGames?.map(g => (
                                                <span key={g} className="bg-sz-red/10 text-sz-red text-xs px-2 py-0.5 rounded border border-sz-red/20">{g}</span>
                                            ))}
                                            {profile.knownFacts?.map((f, i) => (
                                                <span key={i} className="bg-white/5 text-gray-300 text-xs px-2 py-0.5 rounded border border-white/10">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Controls Section */}
                                <div className="flex flex-col gap-3 min-w-[250px]">
                                    <div className="bg-black/50 p-3 rounded border border-black group">
                                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1.5 flex items-center justify-between">
                                            God Mode Instrukce
                                            <Brain className="w-3 h-3 text-sz-red opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                        <textarea
                                            defaultValue={profile.adminInstructions || ''}
                                            placeholder="Např: Tento uživatel je VIP klient, nabídni mu nealko zdarma..."
                                            className="w-full bg-zinc-900 border border-white/10 rounded text-xs text-gray-300 p-2 min-h-[60px] focus:border-sz-red focus:outline-none resize-y"
                                            onBlur={async (e) => {
                                                const newVal = e.target.value.trim();
                                                if (newVal !== (profile.adminInstructions || '')) {
                                                    await handleSaveInstruction(visitorId, profile, newVal);
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleDelete(visitorId)}
                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 transition-colors text-xs font-bold uppercase"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Vymazat Profil
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SkillerTab;

