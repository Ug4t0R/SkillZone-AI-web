// DevMenu Feed (Broadcast) Tab Component — with News Scanner
import React, { useState } from 'react';
import { CloudLightning, Play, List, Brain, RefreshCw, Newspaper, Globe, Zap, ExternalLink } from 'lucide-react';
import { addAdminMessage, getAdminMessages, clearAdminMessages, saveDailyAiFeed } from '../../utils/devTools';
import { getSupabase } from '../../services/supabaseClient';
import { generateDailyFeed, FeedMessage } from '../../services/geminiService';
import { fetchGamingNews, getNewsSourceStatus, NewsItem } from '../../services/newsService';
import { getWeather } from '../../services/weatherService';
import { useAppContext } from '../../context/AppContext';
import RichTextEditor from './RichTextEditor';

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
        </div>
    );
};

export default FeedTab;
