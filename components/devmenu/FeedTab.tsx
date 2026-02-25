// DevMenu Feed (Broadcast) Tab Component — with News Scanner + Press Releases
import React, { useState, useEffect } from 'react';
import { CloudLightning, Play, List, Brain, RefreshCw, Newspaper, Globe, Zap, ExternalLink, FileEdit, Plus, Eye, EyeOff, Trash2, Wand2, ChevronDown, ChevronRight } from 'lucide-react';
import { addAdminMessage, getAdminMessages, clearAdminMessages, saveDailyAiFeed } from '../../utils/devTools';
import { getSupabase } from '../../services/supabaseClient';
import { generateDailyFeed, FeedMessage, generatePressRelease } from '../../services/geminiService';
import { fetchGamingNews, getNewsSourceStatus, NewsItem } from '../../services/newsService';
import { getWeather } from '../../services/weatherService';
import { useAppContext } from '../../context/AppContext';
import RichTextEditor from './RichTextEditor';
import { PressRelease } from '../../types';
import { fetchAll, upsertRow, deleteRow, TABLES } from '../../services/webDataService';

interface FeedTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
    adminMessages: string[];
    setAdminMessages: React.Dispatch<React.SetStateAction<string[]>>;
    dailyFeed: { user: string; msg: string }[];
    setDailyFeed: React.Dispatch<React.SetStateAction<{ user: string; msg: string }[]>>;
}

const TYPE_COLORS: Record<string, string> = {
    news: 'text-yellow-400',
    chat: 'text-gray-400',
    promo: 'text-sz-red',
    weather: 'text-blue-400',
};

const TYPE_LABELS: Record<string, string> = {
    news: '🎮 NEWS',
    chat: '💬 CHAT',
    promo: '📢 PROMO',
    weather: '🌤️ WEATHER',
};

const FeedTab: React.FC<FeedTabProps> = ({ addLog, adminMessages, setAdminMessages, dailyFeed, setDailyFeed }) => {
    const { language } = useAppContext();
    const cs = language === 'cs';
    const [newAdminMsg, setNewAdminMsg] = useState('');
    const [isGeneratingFeed, setIsGeneratingFeed] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedNews, setScannedNews] = useState<NewsItem[]>([]);
    const [sourceStatus, setSourceStatus] = useState<{ name: string; count: number; error: boolean }[]>([]);

    // ─── Press Releases ───
    const [pressItems, setPressItems] = useState<PressRelease[]>([]);
    const [pressLoading, setPressLoading] = useState(false);
    const [showPressForm, setShowPressForm] = useState(false);
    const [pressForm, setPressForm] = useState({ title: '', perex: '', content: '', category: 'announcement', author: 'SkillZone', notes: '' });
    const [pressEnhancing, setPressEnhancing] = useState(false);
    const [pressSaving, setPressSaving] = useState(false);
    const [expandedPress, setExpandedPress] = useState<string | null>(null);
    const CATEGORY_LABELS: Record<string, string> = { announcement: '📢 Oznámení', event: '🎮 Akce', partnership: '🤝 Partnerství', update: '🔄 Update', other: '📄 Ostatní' };
    const CATEGORY_COLORS: Record<string, string> = { announcement: 'text-amber-400 border-amber-500/30', event: 'text-green-400 border-green-500/30', partnership: 'text-blue-400 border-blue-500/30', update: 'text-purple-400 border-purple-500/30', other: 'text-gray-400 border-white/10' };

    const loadPress = async () => {
        setPressLoading(true);
        try {
            const data = await fetchAll<PressRelease>(TABLES.PRESS, [], 'date');
            setPressItems(data.reverse());
        } catch { } finally { setPressLoading(false); }
    };
    useEffect(() => { loadPress(); }, []);

    const handleEnhanceWithAI = async () => {
        setPressEnhancing(true);
        addLog('AI doplňuje press zprávu...', 'info');
        try {
            const result = await generatePressRelease(pressForm);
            if (result) {
                setPressForm(prev => ({ ...prev, ...result }));
                addLog('AI press zpráva doplněna!', 'success');
            } else { addLog('AI nevrátilo výsledek.', 'error'); }
        } catch { addLog('AI chyba.', 'error'); } finally { setPressEnhancing(false); }
    };

    const handleSavePress = async () => {
        if (!pressForm.title.trim()) return;
        setPressSaving(true);
        const item: PressRelease = {
            id: 'press_' + Date.now().toString(36),
            title: pressForm.title,
            perex: pressForm.perex,
            content: pressForm.content,
            category: pressForm.category as PressRelease['category'],
            author: pressForm.author || 'SkillZone',
            date: new Date().toISOString(),
            hidden: false,
            isCustom: true,
        };
        const ok = await upsertRow(TABLES.PRESS, item);
        if (ok) {
            setPressItems(prev => [item, ...prev]);
            setPressForm({ title: '', perex: '', content: '', category: 'announcement', author: 'SkillZone', notes: '' });
            setShowPressForm(false);
            addLog('Press zpráva uložena!', 'success');
        } else { addLog('Uložení selhalo.', 'error'); }
        setPressSaving(false);
    };

    const handleToggleHidden = async (item: PressRelease) => {
        const updated = { ...item, hidden: !item.hidden };
        const ok = await upsertRow(TABLES.PRESS, updated);
        if (ok) setPressItems(prev => prev.map(p => p.id === item.id ? updated : p));
    };

    const handleDeletePress = async (id: string) => {
        if (!confirm('Opravdu smazat press zprávu?')) return;
        const ok = await deleteRow(TABLES.PRESS, id);
        if (ok) setPressItems(prev => prev.filter(p => p.id !== id));
    };

    const handleAddMsg = async () => {
        if (newAdminMsg.trim()) {
            await addAdminMessage(newAdminMsg);
            const msgs = await getAdminMessages();
            setAdminMessages(msgs);
            setNewAdminMsg('');
            const sb = getSupabase();
            sb.from('feed_messages').insert({
                user_name: 'ADMIN',
                message: newAdminMsg,
                is_ai: false
            }).then(() => {
                addLog("Broadcast sent via Realtime.", 'success');
            });
        }
    };

    const handleScanNews = async () => {
        setIsScanning(true);
        addLog("Scanning gaming RSS feeds...", 'info');
        try {
            const [news, status] = await Promise.all([
                fetchGamingNews(true),
                getNewsSourceStatus(),
            ]);
            setScannedNews(news);
            setSourceStatus(status);
            const totalItems = status.reduce((sum, s) => sum + s.count, 0);
            const activeSources = status.filter(s => !s.error).length;
            addLog(`Scan complete: ${totalItems} headlines from ${activeSources}/${status.length} sources.`, 'success');
        } catch (err) {
            addLog("News scan failed: " + String(err), 'error');
        }
        setIsScanning(false);
    };

    const handleGenerateFeed = async () => {
        setIsGeneratingFeed(true);
        addLog("Gathering context for AI feed generation...", 'info');

        try {
            // Get news headlines (use cached if available)
            let headlines: { title: string; source: string }[] = [];
            if (scannedNews.length > 0) {
                headlines = scannedNews.map(n => ({ title: n.title, source: n.source }));
            } else {
                const news = await fetchGamingNews();
                headlines = news.map(n => ({ title: n.title, source: n.source }));
            }

            // Get weather
            let weatherInfo: { temp: number; description: string; emoji: string } | undefined;
            try {
                const w = await getWeather();
                weatherInfo = { temp: w.temp, description: w.description, emoji: w.emoji };
            } catch { /* skip weather */ }

            addLog(`Sending ${headlines.length} headlines + weather to Gemini...`, 'info');

            const newFeed = await generateDailyFeed(headlines, weatherInfo);
            if (newFeed.length > 0) {
                // Save to DB (saveDailyAiFeed expects {user, msg}[])
                await saveDailyAiFeed(newFeed.map(f => ({ user: f.user, msg: f.msg })));
                setDailyFeed(newFeed);
                addLog(`AI Feed generated: ${newFeed.length} messages (${newFeed.filter(f => f.type === 'news').length} news, ${newFeed.filter(f => f.type === 'chat').length} chat, ${newFeed.filter(f => f.type === 'promo').length} promo, ${newFeed.filter(f => f.type === 'weather').length} weather)`, 'success');
            } else {
                addLog("AI returned empty feed. Check API key.", 'error');
            }
        } catch (err) {
            addLog("Feed generation failed: " + String(err), 'error');
        }
        setIsGeneratingFeed(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Admin Broadcast */}
            <div className="bg-zinc-800/50 p-8 border border-sz-red/20 rounded-lg shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sz-red/5 rounded-bl-full pointer-events-none"></div>
                <h3 className="text-xl font-bold text-white mb-6 font-orbitron flex items-center gap-2 uppercase">
                    <CloudLightning className="text-sz-red w-6 h-6" /> {cs ? 'Živé_Vysílání' : 'Live_Broadcast_Protocol'}
                </h3>
                <div className="space-y-4">
                    <RichTextEditor
                        value={newAdminMsg}
                        onChange={setNewAdminMsg}
                        placeholder={cs ? 'Zadej zprávu pro broadcast...' : 'Enter broadcast payload...'}
                        minHeight="120px"
                    />
                    <button
                        onClick={handleAddMsg}
                        className="w-full py-4 bg-sz-red hover:bg-sz-red-dark text-white font-black uppercase tracking-[0.2em] rounded shadow-lg shadow-sz-red/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5" /> {cs ? 'Odeslat_Broadcast' : 'Execute_Broadcast'}
                    </button>
                </div>
            </div>

            {/* News Scanner */}
            <div className="bg-zinc-800/50 p-6 border border-yellow-500/20 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full pointer-events-none"></div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2 uppercase">
                        <Newspaper className="text-yellow-400 w-5 h-5" /> {cs ? 'Herní_News_Skener' : 'Gaming_News_Scanner'}
                    </h3>
                    <button
                        onClick={handleScanNews}
                        disabled={isScanning}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider rounded border border-yellow-500/30 transition-all flex items-center gap-2"
                    >
                        <Globe className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                        {isScanning ? (cs ? 'Skenuji...' : 'Scanning...') : (cs ? 'Skenovat RSS' : 'Scan RSS Feeds')}
                    </button>
                </div>

                {/* Source Status */}
                {sourceStatus.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {sourceStatus.map(s => (
                            <div key={s.name} className={`text-[10px] font-mono px-2 py-1 rounded border ${s.error ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                                {s.error ? '✕' : '✓'} {s.name} ({s.count})
                            </div>
                        ))}
                    </div>
                )}

                {/* Scanned Headlines */}
                {scannedNews.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar bg-black/40 rounded p-2">
                        {scannedNews.slice(0, 20).map((n, i) => (
                            <div key={i} className="text-[11px] font-mono p-1.5 hover:bg-white/5 rounded flex items-start gap-2 group">
                                <span className="text-yellow-400/70 flex-shrink-0">[{n.source}]</span>
                                <span className="text-zinc-300 flex-1">{n.title}</span>
                                {n.url && (
                                    <a href={n.url} target="_blank" rel="noopener noreferrer"
                                        className="text-zinc-600 hover:text-yellow-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={cs ? 'Otevřít zdroj' : 'Open source'}
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        ))}
                        {scannedNews.length > 20 && (
                            <div className="text-[10px] text-zinc-600 text-center py-1">+{scannedNews.length - 20} {cs ? 'dalších' : 'more'}</div>
                        )}
                    </div>
                )}

                {scannedNews.length === 0 && sourceStatus.length === 0 && (
                    <div className="text-zinc-700 text-center py-6 text-xs font-mono italic">
                        {cs ? 'Klikni "Skenovat RSS" pro načtení herních novinek...' : 'Click "Scan RSS Feeds" to fetch latest gaming headlines...'}
                    </div>
                )}
            </div>

            {/* Feed Generation + Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Broadcasts */}
                <div className="bg-black/60 p-6 border border-white/5 rounded-lg h-96 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <List className="w-3 h-3" /> {cs ? 'Poslední_Vysílání' : 'Recent_Broadcasts'}
                        </h4>
                        <button onClick={async () => { await clearAdminMessages(); setAdminMessages([]); }} className="text-[10px] text-zinc-700 hover:text-sz-red">{cs ? 'Vymazat' : 'Flush'}</button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs custom-scrollbar bg-black">
                        {adminMessages.length === 0 && <div className="text-zinc-800 text-center py-10 italic">{cs ? 'Buffer prázdný...' : 'Buffer empty...'}</div>}
                        {adminMessages.map((m, i) => (
                            <div key={i} className="p-2 bg-white/5 border border-white/5 rounded flex gap-3">
                                <span className="text-sz-red font-bold">ADMIN:</span>
                                <span className="text-zinc-300">{m}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Daily Feed */}
                <div className="bg-black/60 p-6 border border-white/5 rounded-lg h-96 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Brain className="w-3 h-3" /> AI_Daily_Feed
                        </h4>
                        <button
                            onClick={handleGenerateFeed}
                            disabled={isGeneratingFeed}
                            className="px-3 py-1.5 bg-sz-red/20 hover:bg-sz-red/30 text-sz-red text-[10px] font-bold uppercase tracking-wider rounded border border-sz-red/30 transition-all flex items-center gap-1.5"
                        >
                            <Zap className={`w-3 h-3 ${isGeneratingFeed ? 'animate-spin' : ''}`} />
                            {isGeneratingFeed ? (cs ? 'Generuji...' : 'Generating...') : (cs ? 'Generovat Feed' : 'Generate Feed')}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs custom-scrollbar bg-black">
                        {dailyFeed.length === 0 && (
                            <div className="text-zinc-800 text-center py-10 italic">{cs ? 'Žádný AI feed. Klikni Generovat.' : 'No AI feed today. Click Generate.'}</div>
                        )}
                        {dailyFeed.map((f: any, i: number) => (
                            <div key={i} className="p-2 bg-white/5 border border-white/5 rounded">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[9px] font-bold uppercase ${TYPE_COLORS[f.type] || 'text-gray-500'}`}>
                                        {TYPE_LABELS[f.type] || '💬 CHAT'}
                                    </span>
                                    <span className="text-sz-red font-bold text-[11px]">@{f.user}</span>
                                </div>
                                <div className="text-zinc-400 text-[11px]">{f.msg}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══════ PRESS ZPRÁVY ═══════ */}
            <div className="bg-zinc-800/50 p-6 border border-purple-500/20 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2 uppercase">
                        <FileEdit className="text-purple-400 w-5 h-5" /> Press_Zprávy
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={loadPress} disabled={pressLoading}
                            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded border border-white/10 transition-all">
                            <RefreshCw className={`w-3.5 h-3.5 ${pressLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setShowPressForm(p => !p)}
                            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider rounded border border-purple-500/30 transition-all flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Přidat zprávu
                        </button>
                    </div>
                </div>

                {/* Add Form */}
                {showPressForm && (
                    <div className="mb-5 p-4 bg-black/40 rounded-lg border border-purple-500/20 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Název *</label>
                                <input value={pressForm.title} onChange={e => setPressForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-400/50 focus:outline-none"
                                    placeholder="Název tiskové zprávy..." />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Autor</label>
                                <input value={pressForm.author} onChange={e => setPressForm(p => ({ ...p, author: e.target.value }))}
                                    className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-400/50 focus:outline-none"
                                    placeholder="SkillZone" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Kategorie</label>
                            <div className="flex gap-1 flex-wrap">
                                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                    <button key={k} onClick={() => setPressForm(p => ({ ...p, category: k }))}
                                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${pressForm.category === k ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-zinc-800 text-gray-500 border-transparent hover:text-gray-300'}`}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Poznámky pro AI (volitelné)</label>
                            <input value={pressForm.notes} onChange={e => setPressForm(p => ({ ...p, notes: e.target.value }))}
                                className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-400/50 focus:outline-none"
                                placeholder="Např. 'Otevíráme novou pobočku v Brně, 15. 3. 2026'..." />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Perex (krátký popis)</label>
                            <input value={pressForm.perex} onChange={e => setPressForm(p => ({ ...p, perex: e.target.value }))}
                                className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-400/50 focus:outline-none"
                                placeholder="Krátký titulek / podnadpis..." />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Obsah</label>
                            <textarea value={pressForm.content} onChange={e => setPressForm(p => ({ ...p, content: e.target.value }))}
                                className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-400/50 focus:outline-none min-h-[80px] resize-y font-mono text-xs"
                                placeholder="Celý text tiskové zprávy (nebo nechej prázdné a nech AI vygenrovat)..." />
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleEnhanceWithAI} disabled={pressEnhancing}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold uppercase rounded border border-amber-500/30 transition-all disabled:opacity-50">
                                <Wand2 className={`w-3.5 h-3.5 ${pressEnhancing ? 'animate-spin' : ''}`} />
                                {pressEnhancing ? 'AI generuje...' : '✨ Vylepšit AI'}
                            </button>
                            <button onClick={handleSavePress} disabled={pressSaving || !pressForm.title.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold uppercase rounded transition-all disabled:opacity-50">
                                {pressSaving ? 'Ukládám...' : 'Uložit'}
                            </button>
                            <button onClick={() => setShowPressForm(false)}
                                className="text-xs text-gray-500 hover:text-white font-mono ml-auto">
                                Zrušit
                            </button>
                        </div>
                    </div>
                )}

                {/* Press List */}
                <div className="space-y-2">
                    {pressLoading && <div className="text-center py-6 text-gray-600 font-mono text-xs animate-pulse">Načítám press zprávy...</div>}
                    {!pressLoading && pressItems.length === 0 && (
                        <div className="text-center py-8 text-gray-700 font-mono text-xs italic">Žádné press zprávy. Přidej první!</div>
                    )}
                    {pressItems.map(item => {
                        const isExpanded = expandedPress === item.id;
                        const [catText, catBorder] = (CATEGORY_COLORS[item.category] || 'text-gray-400 border-white/10').split(' ');
                        return (
                            <div key={item.id} className={`border rounded-lg overflow-hidden transition-all ${item.hidden ? 'opacity-50 border-white/5' : catBorder}`}>
                                <div className="flex items-center gap-3 px-4 py-3 bg-black/30">
                                    <button onClick={() => setExpandedPress(isExpanded ? null : item.id)} className="flex-1 flex items-center gap-3 text-left">
                                        {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />}
                                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 border rounded ${catText} ${catBorder} bg-black/30`}>{CATEGORY_LABELS[item.category]}</span>
                                        <span className="text-sm text-white font-semibold truncate">{item.title}</span>
                                        {item.hidden && <span className="text-[9px] text-gray-600 font-mono bg-white/5 px-1.5 py-0.5 rounded">skryto</span>}
                                    </button>
                                    <span className="text-[9px] text-gray-600 font-mono shrink-0">{new Date(item.date).toLocaleDateString('cs-CZ')}</span>
                                    <button onClick={() => handleToggleHidden(item)} title={item.hidden ? 'Zobrazit' : 'Skrýt'}
                                        className="p-1.5 text-gray-600 hover:text-white rounded hover:bg-white/10 transition-colors">
                                        {item.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    </button>
                                    <button onClick={() => handleDeletePress(item.id)}
                                        className="p-1.5 text-gray-600 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {isExpanded && (
                                    <div className="px-4 py-3 bg-black/20 space-y-2 border-t border-white/5">
                                        {item.perex && <p className="text-[11px] text-gray-400 font-semibold italic">{item.perex}</p>}
                                        {item.content && <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{item.content}</p>}
                                        <div className="text-[9px] text-gray-700 font-mono">Autor: {item.author} · ID: {item.id}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FeedTab;
