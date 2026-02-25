import React, { useState, useEffect } from 'react';
import { Brain, Trash2, RefreshCw, Smartphone, Search, AlertCircle, Save, Eye, Palette, Gamepad2, Zap, TrendingUp, FileText, MessageSquare, ChevronDown, ChevronRight, Cloud, HelpCircle } from 'lucide-react';
import { UserProfile, ChatMessage } from '../../types';
import { getAllUserProfiles, deleteUserProfile, getOrCreateVisitorId, saveRemoteUserProfile } from '../../utils/devTools';
import { generateSkillerStats } from '../../services/geminiService';
import { SkillerCharacter } from '../SkillerAvatar';
import { WeatherCondition, WeatherData, getWeather } from '../../services/weatherService';
import ReactMarkdown from 'react-markdown';
import { getSkillerState } from '../../utils/storage/aiSettings';
import { getAiSettings, saveAiSettings, DEFAULT_AI_SETTINGS } from '../../utils/storage/aiSettings';
import { SYSTEM_PROMPT } from '../../data/aiPrompt';
import { getChatHistory, ChatSession } from '../../utils/storage/chat';

const SkillerTab: React.FC = () => {
    const [profiles, setProfiles] = useState<{ visitorId: string, profile: UserProfile }[]>([]);
    const [localVisitorId, setLocalVisitorId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<string>('');
    const [generatingStats, setGeneratingStats] = useState(false);

    // ─── Skiller Live State ───
    const [skillerState] = useState(() => getSkillerState());

    // ─── Weather ───
    const [weather, setWeather] = useState<WeatherData | null>(null);
    useEffect(() => {
        getWeather().then(setWeather).catch(() => { });
    }, []);

    // ─── Chat Sessions ───
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
    const [topQuestions, setTopQuestions] = useState<string[]>([]);
    const [showTopQ, setShowTopQ] = useState(false);

    // ─── System Prompt Editor ───
    const [promptText, setPromptText] = useState(SYSTEM_PROMPT);
    const [promptSaving, setPromptSaving] = useState(false);
    const [promptSaved, setPromptSaved] = useState(false);
    const [promptDirty, setPromptDirty] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        getAiSettings().then(s => {
            setPromptText(s.systemPrompt || SYSTEM_PROMPT);
        });
    }, []);

    const handleSavePrompt = async () => {
        setPromptSaving(true);
        try {
            const current = await getAiSettings();
            await saveAiSettings({ ...current, systemPrompt: promptText });
            setPromptSaved(true);
            setPromptDirty(false);
            setTimeout(() => setPromptSaved(false), 3000);
        } finally {
            setPromptSaving(false);
        }
    };

    const handleResetPrompt = async () => {
        if (!confirm('Resetovat prompt na výchozí?')) return;
        setPromptText(DEFAULT_AI_SETTINGS.systemPrompt);
        setPromptDirty(true);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            setLocalVisitorId(getOrCreateVisitorId());
            const [data, sessions] = await Promise.all([
                getAllUserProfiles(),
                getChatHistory(),
            ]);
            // Sort to show local machine first, then by last visit
            data.sort((a, b) => {
                if (a.visitorId === getOrCreateVisitorId()) return -1;
                if (b.visitorId === getOrCreateVisitorId()) return 1;
                return new Date(b.profile.lastVisit).getTime() - new Date(a.profile.lastVisit).getTime();
            });
            setProfiles(data);
            setChatSessions(sessions);

            // Extract top user questions across all sessions
            const allUserMsgs: string[] = sessions.flatMap(s =>
                (s.messages as ChatMessage[]).filter(m => m.role === 'user').map(m => m.text)
            );
            // Pick unique messages, sort by length (longer = more specific), deduplicate similar
            const unique = [...new Set(allUserMsgs)]
                .filter(m => m.length > 8)
                .sort((a, b) => b.length - a.length)
                .slice(0, 12);
            setTopQuestions(unique);
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

            {/* ═══════ SKILLER LIVE STATUS ═══════ */}
            {(() => {
                const moodEmoji: Record<string, string> = { HYPE: '🔥', TILT: '😤', CHILL: '😎', FOCUS: '🎯', TIRED: '😴' };
                const moodColor: Record<string, string> = {
                    HYPE: 'text-green-400 border-green-500/30',
                    TILT: 'text-red-400 border-red-500/30',
                    CHILL: 'text-cyan-400 border-cyan-500/30',
                    FOCUS: 'text-blue-400 border-blue-500/30',
                    TIRED: 'text-yellow-400 border-yellow-500/30',
                };
                const history = skillerState.matchHistory.split('-');
                const wins = history.filter(r => r === 'W').length;
                const winrate = history.length > 0 ? Math.round((wins / history.length) * 100) : 0;
                const [mcText, mcBorder] = (moodColor[skillerState.currentMood] || 'text-gray-400 border-white/10').split(' ');
                return (
                    <div className="bg-black/60 border border-white/10 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Gamepad2 className="w-5 h-5 text-sz-red" />
                            <h3 className="font-orbitron font-bold text-sm uppercase text-sz-red">Skiller_Status</h3>
                            <span className="ml-auto text-[10px] text-gray-600 font-mono">today · seed-based</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-zinc-900 border border-white/5 rounded-md p-3">
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                                    <Gamepad2 className="w-3 h-3" /> Hraje
                                </div>
                                <div className="text-white font-bold text-sm">{skillerState.currentGame}</div>
                            </div>
                            <div className={`bg-zinc-900 border rounded-md p-3 ${mcBorder}`}>
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                                    <Zap className="w-3 h-3" /> Mood
                                </div>
                                <div className={`font-bold text-sm ${mcText}`}>
                                    {moodEmoji[skillerState.currentMood] || '🎮'} {skillerState.currentMood}
                                </div>
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-md p-3">
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                                    <TrendingUp className="w-3 h-3" /> Winrate
                                </div>
                                <div className={`font-bold text-sm ${winrate >= 60 ? 'text-green-400' : winrate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {winrate}%
                                </div>
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-md p-3">
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5">Last 5</div>
                                <div className="flex gap-1">
                                    {history.map((r, i) => (
                                        <span key={i} className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${r === 'W' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 flex-wrap">
                            {/* Battery */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 font-mono">Battery:</span>
                                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${skillerState.batteryLevel > 50 ? 'bg-green-500' : skillerState.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${skillerState.batteryLevel}%` }} />
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono">{skillerState.batteryLevel}%</span>
                            </div>
                            {/* Weather Praha */}
                            {weather && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <Cloud className="w-3.5 h-3.5 text-sky-400" />
                                    <span className="text-[10px] text-sky-300 font-mono font-bold">
                                        Praha: {weather.emoji} {weather.temp}°C
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                        {weather.description} · 💨{weather.windKmh}km/h · 💧{weather.humidity}%
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${weather.isNight ? 'bg-indigo-900/50 text-indigo-300' : 'bg-yellow-900/30 text-yellow-300'
                                        }`}>{weather.isNight ? 'NIGHT' : 'DAY'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* ═══════ SYSTEM PROMPT EDITOR ═══════ */}
            <div className="bg-black/60 border border-white/10 rounded-lg overflow-hidden">
                <button
                    onClick={() => setShowPrompt(p => !p)}
                    className="w-full flex items-center gap-2 p-5 hover:bg-white/5 transition-colors text-left"
                >
                    <FileText className="w-5 h-5 text-amber-400" />
                    <h3 className="font-orbitron font-bold text-sm uppercase text-amber-400">System_Prompt</h3>
                    {promptDirty && <span className="ml-1 text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded">upraveno</span>}
                    {promptSaved && <span className="ml-1 text-[10px] text-green-400 font-mono bg-green-400/10 px-2 py-0.5 rounded">✓ uloženo</span>}
                    <span className="ml-auto text-gray-600 text-xs font-mono">{showPrompt ? '▲' : '▼'} {promptText.length} znaků</span>
                </button>
                {showPrompt && (
                    <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                        <div className="text-[11px] text-gray-500 font-mono leading-relaxed">
                            Instrukce, kterou Skiller dostane před každou konverzací. Změny se uloží do Supabase a přepíší výchozí prompt.
                        </div>
                        <textarea
                            value={promptText}
                            onChange={e => { setPromptText(e.target.value); setPromptDirty(true); }}
                            className="w-full bg-zinc-900 border border-white/10 rounded-md text-xs text-gray-200 font-mono p-3 min-h-[360px] focus:border-amber-400/50 focus:outline-none resize-y leading-relaxed"
                            spellCheck={false}
                        />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSavePrompt}
                                disabled={promptSaving || !promptDirty}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${promptDirty ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                                    }`}
                            >
                                <Save className="w-3.5 h-3.5" />
                                {promptSaving ? 'Ukládám...' : 'Uložit prompt'}
                            </button>
                            <button
                                onClick={handleResetPrompt}
                                className="px-4 py-2 rounded-md text-xs font-bold uppercase bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white transition-colors"
                            >
                                Reset na default
                            </button>
                            <span className="ml-auto text-[10px] text-gray-600 font-mono">{promptText.split('\n').length} řádků</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════ TOP QUESTIONS EXTRACTOR ═══════ */}
            {topQuestions.length > 0 && (
                <div className="bg-black/60 border border-white/10 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setShowTopQ(p => !p)}
                        className="w-full flex items-center gap-2 p-5 hover:bg-white/5 transition-colors text-left"
                    >
                        <HelpCircle className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-orbitron font-bold text-sm uppercase text-emerald-400">Top_Questions</h3>
                        <span className="ml-1 text-[10px] text-emerald-400/60 font-mono bg-emerald-400/10 px-2 py-0.5 rounded">{topQuestions.length} dotazů</span>
                        <span className="ml-auto text-gray-600 text-xs font-mono">{showTopQ ? '▲' : '▼'} z {chatSessions.length} sessions</span>
                    </button>
                    {showTopQ && (
                        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-2">
                            <div className="text-[11px] text-gray-500 font-mono mb-3">
                                Nejčastější dotazy uživatelů — použij je ke zlepšení promptu Skillera.
                            </div>
                            {topQuestions.map((q, i) => (
                                <div key={i} className="flex items-start gap-2 group">
                                    <span className="text-[9px] text-gray-600 font-mono mt-0.5 w-4 shrink-0">{i + 1}.</span>
                                    <span className="text-[11px] text-gray-300 font-mono flex-1 leading-relaxed">{q}</span>
                                    <button
                                        onClick={() => navigator.clipboard?.writeText(q)}
                                        className="opacity-0 group-hover:opacity-100 text-[9px] text-gray-600 hover:text-white font-mono px-1.5 py-0.5 rounded bg-white/5 transition-all"
                                    >
                                        copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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

                                    {/* ─── Chat Sessions Accordion ─── */}
                                    {(() => {
                                        const userSessions = chatSessions
                                            .filter(s => s.visitor_id === visitorId)
                                            .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
                                        if (userSessions.length === 0) return null;
                                        const isExpanded = expandedProfile === visitorId;
                                        return (
                                            <div className="border border-white/5 rounded-md overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedProfile(isExpanded ? null : visitorId)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="text-[10px] text-blue-400 font-mono font-bold uppercase">Chat Sessions</span>
                                                    <span className="text-[9px] text-gray-600 font-mono bg-white/5 px-1.5 py-0.5 rounded">{userSessions.length}</span>
                                                    {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-600 ml-auto" /> : <ChevronRight className="w-3 h-3 text-gray-600 ml-auto" />}
                                                </button>
                                                {isExpanded && (
                                                    <div className="divide-y divide-white/5">
                                                        {userSessions.slice(0, 5).map((session, si) => {
                                                            const msgs = (session.messages as ChatMessage[]) || [];
                                                            const userMsgs = msgs.filter(m => m.role === 'user');
                                                            const lastUser = userMsgs[userMsgs.length - 1]?.text || '';
                                                            return (
                                                                <div key={session.id} className="p-3 bg-black/30 space-y-2">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-[9px] text-gray-600 font-mono">#{si + 1}</span>
                                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                                            {new Date(session.started_at).toLocaleString('cs-CZ')}
                                                                        </span>
                                                                        <span className="text-[9px] text-gray-600 font-mono">{msgs.length} zpráv</span>
                                                                        {session.ip_address && session.ip_address !== 'unknown' && (
                                                                            <span className="text-[9px] font-mono bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                                                🌐 {session.ip_address}
                                                                            </span>
                                                                        )}
                                                                        {session.timezone && (
                                                                            <span className="text-[9px] text-gray-600 font-mono">{session.timezone}</span>
                                                                        )}
                                                                        {session.screen_resolution && (
                                                                            <span className="text-[9px] text-gray-600 font-mono">🖥 {session.screen_resolution}</span>
                                                                        )}
                                                                    </div>
                                                                    {session.user_agent && (
                                                                        <div className="text-[9px] text-gray-600 font-mono truncate" title={session.user_agent}>
                                                                            {session.user_agent.substring(0, 80)}…
                                                                        </div>
                                                                    )}
                                                                    {lastUser && (
                                                                        <div className="text-[10px] text-gray-400 bg-white/5 rounded px-2 py-1 border-l-2 border-blue-500/40">
                                                                            <span className="text-blue-400 font-mono text-[9px]">last: </span>
                                                                            {lastUser.substring(0, 120)}{lastUser.length > 120 ? '…' : ''}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        {userSessions.length > 5 && (
                                                            <div className="px-3 py-2 text-[9px] text-gray-600 font-mono text-center">
                                                                + {userSessions.length - 5} starších sessions
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
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

