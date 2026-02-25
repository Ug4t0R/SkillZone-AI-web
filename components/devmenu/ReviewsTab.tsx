// DevMenu Reviews Tab — Full Review Browser with Search, Filters, AI Replies
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, Edit3, X, Save, Star, MessageSquare, CloudDownload, Sparkles, Eye, EyeOff, Search, Filter, ChevronDown, ChevronUp, Copy, Send, Wand2, MessageCircle, ExternalLink, Check, AlertTriangle, Shield } from 'lucide-react';
import { Review, FALLBACK_REVIEWS_CS, invalidateReviewsCache } from '../../data/reviews';
import { fetchAllLocationReviews, curateReviewsWithAI, GoogleReview, PLACE_IDS } from '../../services/googleReviewsService';
import { getSupabase, signInWithGoogle } from '../../services/supabaseClient';
import { setSetting } from '../../services/webDataService';

interface ReviewsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const TAG_COLORS: Record<string, string> = {
    highlight: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    honest: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    genuine_complaint: 'bg-red-500/20 text-red-400 border-red-500/30',
    review_bomb: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    regular: 'bg-white/5 text-gray-500 border-white/10',
};

const LOCATION_COLORS: Record<string, string> = {
    'žižkov': 'bg-green-500/20 text-green-400 border-green-500/30',
    'háje': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'stodůlky': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bootcamp': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'holešovice': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'arena': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const RATING_OPTIONS = [
    { value: 0, label: 'Vše' },
    { value: 5, label: '⭐⭐⭐⭐⭐' },
    { value: 4, label: '⭐⭐⭐⭐' },
    { value: 3, label: '⭐⭐⭐' },
    { value: 2, label: '⭐⭐' },
    { value: 1, label: '⭐' },
];

const getLocationLabel = (loc: string) => PLACE_IDS[loc]?.shortLabel || loc;
const getLocationColor = (loc: string) => LOCATION_COLORS[loc] || 'bg-white/5 text-gray-400 border-white/10';

const ReviewsTab: React.FC<ReviewsTabProps> = ({ addLog }) => {
    const [items, setItems] = useState<GoogleReview[]>([]);
    const [loading, setLoading] = useState(false);
    const [curating, setCurating] = useState(false);
    const [syncLog, setSyncLog] = useState<{ msg: string, type: string, time: string }[]>([]);

    // ─── Search & Filter state ──────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLocation, setFilterLocation] = useState<string>('all');
    const [filterRating, setFilterRating] = useState<number>(0);
    const [filterTag, setFilterTag] = useState<string>('all');
    const [filterResponse, setFilterResponse] = useState<'all' | 'replied' | 'unreplied'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'rating_high' | 'rating_low'>('date');

    // ─── Expanded review & AI reply state ───────────────────────────
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<GoogleReview>>({});
    const [replyDraft, setReplyDraft] = useState<string>('');
    const [generatingReply, setGeneratingReply] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'all' | 'bombing' | 'complaints'>('all');

    const syncLogRef = useRef<HTMLDivElement>(null);

    const addSyncLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setSyncLog(prev => [...prev, { msg, type, time }]);
        addLog(msg, type);
    };
    const clearSyncLog = () => setSyncLog([]);

    useEffect(() => {
        if (syncLogRef.current) syncLogRef.current.scrollTop = syncLogRef.current.scrollHeight;
    }, [syncLog]);

    // ─── Load from DB ───────────────────────────────────────────────
    useEffect(() => { loadFromDb(); }, []);

    const loadFromDb = async () => {
        try {
            const sb = getSupabase();
            const { data } = await sb.from('web_reviews').select('*').order('date', { ascending: false });
            if (data && data.length > 0) setItems(data as GoogleReview[]);
        } catch { /* Silent */ }
    };

    // ─── Filtered & sorted items ────────────────────────────────────
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.text?.toLowerCase().includes(q) ||
                r.author?.toLowerCase().includes(q) ||
                r.owner_response?.toLowerCase().includes(q) ||
                r.ai_comment?.toLowerCase().includes(q)
            );
        }

        // Location filter
        if (filterLocation !== 'all') {
            result = result.filter(r => r.location === filterLocation);
        }

        // Rating filter
        if (filterRating > 0) {
            result = result.filter(r => r.rating === filterRating);
        }

        // Tag filter
        if (filterTag !== 'all') {
            if (filterTag === 'featured') {
                result = result.filter(r => r.is_featured);
            } else {
                result = result.filter(r => r.ai_tag === filterTag);
            }
        }

        // Response filter
        if (filterResponse === 'replied') {
            result = result.filter(r => r.owner_response);
        } else if (filterResponse === 'unreplied') {
            result = result.filter(r => !r.owner_response);
        }

        // Sort
        if (sortBy === 'rating_high') {
            result.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'rating_low') {
            result.sort((a, b) => a.rating - b.rating);
        } else {
            result.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        }

        return result;
    }, [items, searchQuery, filterLocation, filterRating, filterTag, filterResponse, sortBy]);

    // ─── Stats ──────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = items.length;
        const highlight = items.filter(r => r.ai_tag === 'highlight').length;
        const honest = items.filter(r => r.ai_tag === 'honest').length;
        const bomb = items.filter(r => r.ai_tag === 'review_bomb').length;
        const featured = items.filter(r => r.is_featured).length;
        const withResponse = items.filter(r => r.owner_response).length;
        const avgRating = total > 0 ? (items.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0';

        // Per-location counts
        const locations: Record<string, number> = {};
        items.forEach(r => { locations[r.location] = (locations[r.location] || 0) + 1; });

        return { total, highlight, honest, bomb, featured, withResponse, avgRating, locations };
    }, [items]);

    // ─── Fetch from Google (TOP 5) ──────────────────────────────────
    const handleFetchFromGoogle = async () => {
        setLoading(true); clearSyncLog();
        addSyncLog('Fetching reviews from Google Places API...', 'info');
        try {
            const result = await fetchAllLocationReviews();
            if (result.reviews.length === 0) { addSyncLog('No reviews fetched.', 'error'); setLoading(false); return; }
            addSyncLog(`Fetched ${result.reviews.length} reviews`, 'success');
            await setSetting('google_location_ratings', result.ratings);
            const sb = getSupabase();
            await sb.from('web_reviews').delete().neq('id', '___never___');
            const { error } = await sb.from('web_reviews').upsert(result.reviews);
            if (error) addSyncLog(`DB error: ${error.message}`, 'error');
            else addSyncLog(`✅ Saved ${result.reviews.length} reviews`, 'success');
            setItems(result.reviews);
            invalidateReviewsCache();
        } catch (err) { addSyncLog(`Error: ${err}`, 'error'); }
        setLoading(false);
    };

    // ─── Deep Fetch via SerpApi ──────────────────────────────────────
    const handleDeepFetch = async () => {
        setLoading(true); clearSyncLog();
        addSyncLog('🔄 Fetching ALL reviews via SerpApi (paginated)...', 'info');
        try {
            const { fetchAllReviewsSerpApi } = await import('../../services/googleReviewsService');
            const result = await fetchAllReviewsSerpApi(addSyncLog);
            if (result.reviews.length > 0) {
                addSyncLog(`📦 Saving ${result.reviews.length} reviews to database...`, 'info');
                await setSetting('google_location_ratings', result.ratings);
                const sb = getSupabase();
                await sb.from('web_reviews').delete().neq('id', '___never___');
                const { error } = await sb.from('web_reviews').upsert(result.reviews);
                if (error) addSyncLog(`❌ DB error: ${error.message}`, 'error');
                else addSyncLog(`✅ ${result.reviews.length} reviews saved!`, 'success');
                setItems(result.reviews);
                invalidateReviewsCache();
            } else {
                addSyncLog('⚠️ No reviews fetched. Check API key and Place IDs.', 'error');
            }
        } catch (err) { addSyncLog(`❌ Error: ${err}`, 'error'); }
        setLoading(false);
    };

    // ─── AI Curate ──────────────────────────────────────────────────
    const handleAiCurate = async () => {
        if (items.length === 0) { addSyncLog('No reviews to curate.', 'error'); return; }
        setCurating(true); clearSyncLog();
        addSyncLog(`AI curating ${items.length} reviews...`, 'info');
        try {
            const curated = await curateReviewsWithAI(items, (msg) => addSyncLog(msg, 'info'));

            // Auto-feature: ONLY highlight → featured (public website shows only best reviews)
            const autoFeatured = curated.map(r => ({
                ...r,
                is_featured: r.ai_tag === 'highlight',
            }));

            const sb = getSupabase();
            for (const review of autoFeatured) { await sb.from('web_reviews').upsert(review); }
            setItems(autoFeatured); invalidateReviewsCache();
            const highlighted = autoFeatured.filter(r => r.is_featured).length;
            addSyncLog(`✅ AI curated & auto-featured: ${highlighted}/${autoFeatured.length} reviews marked for display`, 'success');
        } catch (err) { addLog(`AI error: ${err}`, 'error'); }
        setCurating(false);
    };

    // ─── Toggle featured ────────────────────────────────────────────
    const toggleFeatured = async (id: string) => {
        const review = items.find(r => r.id === id);
        if (!review) return;
        const updated = { ...review, is_featured: !review.is_featured };
        const sb = getSupabase();
        await sb.from('web_reviews').upsert(updated);
        setItems(prev => prev.map(r => r.id === id ? updated : r));
        invalidateReviewsCache();
    };

    // ─── Edit review ────────────────────────────────────────────────
    const startEdit = (review: GoogleReview) => {
        setEditingId(review.id);
        setEditForm({ ai_comment: review.ai_comment || '', ai_tag: review.ai_tag || 'regular' });
    };

    const saveEdit = async () => {
        if (!editingId) return;
        const review = items.find(r => r.id === editingId);
        if (!review) return;
        const updated = { ...review, ...editForm };
        const sb = getSupabase();
        await sb.from('web_reviews').upsert(updated);
        setItems(prev => prev.map(r => r.id === editingId ? updated as GoogleReview : r));
        setEditingId(null); invalidateReviewsCache();
        addLog(`Updated: ${review.author}`, 'success');
    };

    // ─── Delete review ──────────────────────────────────────────────
    const deleteReview = async (id: string) => {
        const sb = getSupabase();
        await sb.from('web_reviews').delete().eq('id', id);
        setItems(prev => prev.filter(r => r.id !== id));
        invalidateReviewsCache();
    };

    // ─── Reset ──────────────────────────────────────────────────────
    const resetAll = async () => {
        if (!confirm('Opravdu vymazat VŠECHNY recenze?')) return;
        const sb = getSupabase();
        await sb.from('web_reviews').delete().neq('id', '___never___');
        setItems([]); invalidateReviewsCache();
    };

    // ─── AI Generate Reply ──────────────────────────────────────────
    const generateAiReply = async (review: GoogleReview) => {
        setGeneratingReply(true);
        try {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });

            const prompt = `Jsi majitel herního klubu SkillZone v Praze. Napiš profesionální, přátelskou a stručnou odpověď na tuto Google recenzi.

Recenze od: ${review.author}
Hodnocení: ${review.rating}/5
Text: "${review.text}"
Pobočka: ${getLocationLabel(review.location)}

${replyDraft ? `Zákazníkův draft odpovědi (vylepši ho): "${replyDraft}"` : 'Napiš novou odpověď od nuly.'}

Pravidla:
- Piš česky
- Buď stručný (max 3 věty)
- Pokud je recenze pozitivní, poděkuj a pozvi zpět
- Pokud je negativní, omluv se, nabídni řešení
- Nepoj se jak robot, piš lidsky
- Nikdy nevymýšlej fakta
- Podepiš se jako "Tým SkillZone"`;

            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
            });
            setReplyDraft(result.text || '');
        } catch (err) {
            addLog(`AI reply error: ${err}`, 'error');
        }
        setGeneratingReply(false);
    };

    // ─── Copy to clipboard ──────────────────────────────────────────
    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    // ─── Render ─────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sz-red" />
                    <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                        Reviews ({stats.total})
                    </span>
                    <span className="text-[10px] text-gray-600">avg {stats.avgRating}⭐ · {stats.withResponse} replied</span>
                </div>
            </div>

            {/* ═══════════════ VIEW MODE TABS ═══════════════ */}
            <div className="flex gap-1 bg-black/30 p-1 rounded-lg border border-white/5">
                {[
                    { key: 'all' as const, label: '📋 All Reviews', count: stats.total },
                    { key: 'bombing' as const, label: '⚠️ Review Bombing', count: stats.bomb },
                    { key: 'complaints' as const, label: '🛡️ Oprávněná kritika', count: stats.honest + items.filter(r => r.ai_tag === 'genuine_complaint').length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setViewMode(tab.key)}
                        className={`flex-1 px-3 py-2 rounded text-[10px] font-bold uppercase transition-all ${viewMode === tab.key
                            ? 'bg-sz-red/20 text-sz-red border border-sz-red/30'
                            : 'text-gray-500 hover:text-white border border-transparent'
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* ═══════════════ BOMBING VIEW ═══════════════ */}
            {viewMode === 'bombing' && (
                <div className="space-y-3">
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400 font-bold text-xs uppercase">Review Bombing Analysis</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            Tyto recenze identifikovala AI jako nesmyslné nebo koordinované. Typicky 1★ bez textu,
                            nesouvisející obsah, nebo recenze od účtů bez historie. Tyto recenze se <strong className="text-orange-400">nezobrazují</strong> na
                            veřejném webu.
                        </p>
                        {/* Per-location stats */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                            {Object.entries(
                                items.filter(r => r.ai_tag === 'review_bomb').reduce((acc, r) => {
                                    acc[r.location] = (acc[r.location] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            ).map(([loc, count]) => (
                                <span key={loc} className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${getLocationColor(loc)}`}>
                                    {getLocationLabel(loc)}: {count}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {items.filter(r => r.ai_tag === 'review_bomb').map(item => (
                            <div key={item.id} className="flex items-start gap-3 p-3 bg-black/30 border border-orange-500/10 rounded-lg">
                                <div className="flex gap-0.5 shrink-0 mt-0.5">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <Star key={i} className={`w-2.5 h-2.5 ${i < item.rating ? 'text-yellow-400' : 'text-gray-700'}`} fill={i < item.rating ? 'currentColor' : 'none'} />
                                    ))}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-white text-[11px] font-bold">{item.author}</span>
                                        <span className={`text-[7px] px-1 py-0.5 rounded border font-bold uppercase ${getLocationColor(item.location)}`}>
                                            {getLocationLabel(item.location)}
                                        </span>
                                        <span className="text-[9px] text-gray-600">{item.date ? new Date(item.date).toLocaleDateString('cs') : ''}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{item.text || '(bez textu)'}</p>
                                    {item.ai_comment && (
                                        <div className="mt-2 bg-orange-500/5 border border-orange-500/15 rounded px-2 py-1">
                                            <span className="text-[9px] text-orange-400">🤖 {item.ai_comment}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {items.filter(r => r.ai_tag === 'review_bomb').length === 0 && (
                            <div className="text-center py-8 text-gray-600 font-mono text-xs">
                                Žádné review bomby nebyly detekovány. Spusť "AI Curate" pro analýzu.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════ COMPLAINTS VIEW ═══════════════ */}
            {viewMode === 'complaints' && (
                <div className="space-y-3">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 font-bold text-xs uppercase">Oprávněná kritika & Zpětná vazba</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            Recenze kde zákazníci poukazují na reálné problémy. Tyto recenze jsou cenné pro
                            interní zlepšení. Zobrazují se <strong className="text-blue-400">pouze v DevMenu</strong>, ne na veřejném webu.
                        </p>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {items.filter(r => r.ai_tag === 'honest' || r.ai_tag === 'genuine_complaint').map(item => (
                            <div key={item.id} className="p-3 bg-black/30 border border-blue-500/10 rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <Star key={i} className={`w-2.5 h-2.5 ${i < item.rating ? 'text-yellow-400' : 'text-gray-700'}`} fill={i < item.rating ? 'currentColor' : 'none'} />
                                        ))}
                                    </div>
                                    <span className="text-white text-[11px] font-bold">{item.author}</span>
                                    <span className={`text-[7px] px-1 py-0.5 rounded border font-bold uppercase ${getLocationColor(item.location)}`}>
                                        {getLocationLabel(item.location)}
                                    </span>
                                    <span className={`text-[8px] px-1 py-0.5 rounded border font-bold uppercase ${TAG_COLORS[item.ai_tag || 'regular']}`}>
                                        {item.ai_tag === 'genuine_complaint' ? '❗ Stížnost' : '🛡️ Zpětná vazba'}
                                    </span>
                                    <span className="text-[9px] text-gray-600 ml-auto">{item.date ? new Date(item.date).toLocaleDateString('cs') : ''}</span>
                                </div>
                                <p className="text-sm text-gray-200 leading-relaxed">{item.text || '(bez textu)'}</p>
                                {item.ai_comment && (
                                    <div className="bg-purple-500/5 border border-purple-500/15 rounded px-3 py-2">
                                        <span className="text-[9px] text-purple-400 font-bold uppercase">🤖 AI Analýza</span>
                                        <p className="text-[11px] text-purple-300/80 mt-1">{item.ai_comment}</p>
                                    </div>
                                )}
                                {item.owner_response ? (
                                    <div className="bg-green-500/5 border border-green-500/20 rounded px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-3 h-3 text-green-400" />
                                            <span className="text-[9px] text-green-400 font-bold uppercase">Naše odpověď</span>
                                            {item.owner_response_date && (
                                                <span className="text-[9px] text-green-400/50">{new Date(item.owner_response_date).toLocaleDateString('cs')}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-green-300/80 mt-1">{item.owner_response}</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-red-400 font-mono uppercase">⚠ Bez odpovědi</span>
                                        <button
                                            onClick={() => { setExpandedId(item.id); setViewMode('all'); }}
                                            className="text-[9px] text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                                        >
                                            Otevřít & napsat odpověď →
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {items.filter(r => r.ai_tag === 'honest' || r.ai_tag === 'genuine_complaint').length === 0 && (
                            <div className="text-center py-8 text-gray-600 font-mono text-xs">
                                Žádná oprávněná kritika nebyla identifikována. Spusť "AI Curate" pro analýzu.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
                <button onClick={handleFetchFromGoogle} disabled={loading}
                    className="flex items-center justify-center gap-1 px-3 py-2.5 bg-green-700 text-white text-[11px] font-bold uppercase rounded hover:bg-green-600 transition-colors disabled:opacity-50">
                    <CloudDownload className="w-3.5 h-3.5" /> Top 5 Sync
                </button>
                <button onClick={handleDeepFetch} disabled={loading}
                    className="flex items-center justify-center gap-1 px-3 py-2.5 bg-blue-700 text-white text-[11px] font-bold uppercase rounded hover:bg-blue-600 transition-colors disabled:opacity-50">
                    <CloudDownload className="w-3.5 h-3.5" /> Deep Fetch ALL
                </button>
                <button onClick={handleAiCurate} disabled={curating || items.length === 0}
                    className="flex items-center justify-center gap-1 px-3 py-2.5 bg-purple-700 text-white text-[11px] font-bold uppercase rounded hover:bg-purple-600 transition-colors disabled:opacity-50">
                    <Sparkles className="w-3.5 h-3.5" /> AI Curate
                </button>
            </div>

            {/* Sync Log */}
            {syncLog.length > 0 && (
                <div className="relative">
                    <div ref={syncLogRef}
                        className="bg-black/50 border border-white/10 rounded-lg p-3 max-h-[150px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-0.5">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-sz-red font-bold uppercase tracking-wider">⚡ Sync Log</span>
                            <button onClick={clearSyncLog} className="text-[9px] text-gray-600 hover:text-white">Clear</button>
                        </div>
                        {syncLog.map((entry, i) => (
                            <div key={i} className={`${entry.type === 'error' ? 'text-red-400' : entry.type === 'success' ? 'text-green-400' : 'text-gray-400'}`}>
                                <span className="text-gray-600">[{entry.time}]</span> {entry.msg}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats bar */}
            {stats.total > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/5 rounded-lg flex-wrap">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Stats:</span>
                    {Object.entries(stats.locations).map(([loc, count]) => (
                        <button key={loc} onClick={() => setFilterLocation(filterLocation === loc ? 'all' : loc)}
                            className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase transition-all ${filterLocation === loc ? getLocationColor(loc) + ' ring-1 ring-white/30' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}>
                            {getLocationLabel(loc)} ({count})
                        </button>
                    ))}
                    <span className="text-[10px] text-yellow-400 font-bold">{stats.highlight} ⭐</span>
                    <span className="text-[10px] text-orange-400 font-bold">{stats.bomb} ⚠️</span>
                    <span className="text-[10px] text-green-400 font-bold">{stats.featured} 👁️</span>
                    <button onClick={resetAll} className="ml-auto p-1 text-gray-600 hover:text-red-500 transition-colors" title="Clear all">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* ═══════════════ SEARCH & FILTERS (only in 'all' mode) ═══════════════ */}
            {viewMode === 'all' && <div className="space-y-2">
                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Hledat v recenzích... (jméno, text, odpověď)"
                        className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 font-mono focus:border-sz-red/50 outline-none transition-colors"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Filter row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-3 h-3 text-gray-500" />

                    {/* Rating filter */}
                    <select value={filterRating} onChange={e => setFilterRating(Number(e.target.value))}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono focus:border-sz-red outline-none">
                        {RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    {/* Tag filter */}
                    <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono focus:border-sz-red outline-none">
                        <option value="all">Všechny tagy</option>
                        <option value="highlight">⭐ Highlight</option>
                        <option value="honest">🛡️ Honest</option>
                        <option value="genuine_complaint">❗ Genuine Complaint</option>
                        <option value="review_bomb">⚠️ Review Bomb</option>
                        <option value="featured">👁️ Featured</option>
                        <option value="regular">Regular</option>
                    </select>

                    {/* Response filter */}
                    <select value={filterResponse} onChange={e => setFilterResponse(e.target.value as any)}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono focus:border-sz-red outline-none">
                        <option value="all">Odpovědi: vše</option>
                        <option value="replied">✅ S odpovědí</option>
                        <option value="unreplied">❌ Bez odpovědi</option>
                    </select>

                    {/* Sort */}
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono focus:border-sz-red outline-none">
                        <option value="date">Nejnovější</option>
                        <option value="rating_high">Nejlepší</option>
                        <option value="rating_low">Nejhorší</option>
                    </select>

                    <span className="text-[10px] text-gray-500 ml-auto">{filteredItems.length} / {items.length}</span>
                </div>
            </div>}

            {/* ═══════════════ REVIEWS LIST (only in 'all' mode) ═══════════════ */}
            {viewMode === 'all' && <div className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredItems.map(item => (
                    <div key={item.id} className="group">
                        {/* ─── Review Row (collapsed) ─── */}
                        <div
                            onClick={() => { setExpandedId(expandedId === item.id ? null : item.id); setReplyDraft(''); }}
                            className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition-all ${expandedId === item.id
                                ? 'bg-white/5 border-white/15'
                                : 'bg-black/30 border-white/5 hover:border-white/10'
                                }`}
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 shrink-0">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star key={i} className={`w-2.5 h-2.5 ${i < item.rating ? 'text-yellow-400' : 'text-gray-700'}`} fill={i < item.rating ? 'currentColor' : 'none'} />
                                ))}
                            </div>

                            {/* Location badge */}
                            <span className={`text-[7px] px-1 py-0.5 rounded border font-bold uppercase shrink-0 ${getLocationColor(item.location)}`}>
                                {getLocationLabel(item.location)}
                            </span>

                            {/* Author */}
                            <span className="text-white text-[11px] font-bold shrink-0">{item.author}</span>

                            {/* AI tag */}
                            {item.ai_tag && item.ai_tag !== 'regular' && (
                                <span className={`text-[8px] px-1 py-0.5 rounded border font-bold uppercase ${TAG_COLORS[item.ai_tag]}`}>
                                    {item.ai_tag === 'highlight' ? '⭐' : item.ai_tag === 'review_bomb' ? '⚠️' : '🛡️'}
                                </span>
                            )}

                            {/* Response indicator */}
                            {item.owner_response && (
                                <MessageCircle className="w-3 h-3 text-green-500 shrink-0" />
                            )}

                            {/* Preview text */}
                            <span className="text-[10px] text-gray-500 truncate flex-1 min-w-0">
                                {item.text ? item.text.substring(0, 60) + (item.text.length > 60 ? '...' : '') : '(bez textu)'}
                            </span>

                            {/* Date */}
                            <span className="text-[9px] text-gray-600 shrink-0">
                                {item.date ? new Date(item.date).toLocaleDateString('cs') : ''}
                            </span>

                            {/* Expand arrow */}
                            {expandedId === item.id ?
                                <ChevronUp className="w-3 h-3 text-gray-500 shrink-0" /> :
                                <ChevronDown className="w-3 h-3 text-gray-500 shrink-0 opacity-0 group-hover:opacity-100" />
                            }
                        </div>

                        {/* ─── Expanded Review Card ─── */}
                        {expandedId === item.id && (
                            <div className="bg-black/40 border border-white/10 rounded-b-lg p-4 space-y-3 -mt-0.5 animate-in">

                                {/* Full review text */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-white font-bold">{item.author}</span>
                                        <span className="text-[10px] text-gray-500">{item.date ? new Date(item.date).toLocaleDateString('cs', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                                        {item.google_url && (
                                            <a href={item.google_url} target="_blank" rel="noopener" className="text-gray-500 hover:text-white transition-colors">
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                                        {item.text || '(Recenze bez textu)'}
                                    </p>
                                </div>

                                {/* Owner response (if exists) */}
                                {item.owner_response && (
                                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-3 h-3 text-green-400" />
                                            <span className="text-[10px] text-green-400 font-bold uppercase">Naše odpověď</span>
                                            {item.owner_response_date && (
                                                <span className="text-[9px] text-green-400/50">{new Date(item.owner_response_date).toLocaleDateString('cs')}</span>
                                            )}
                                            <button onClick={() => copyToClipboard(item.owner_response!, item.id + '_resp')}
                                                className="ml-auto text-gray-500 hover:text-green-400 transition-colors">
                                                {copied === item.id + '_resp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-green-300/80 leading-relaxed">{item.owner_response}</p>
                                    </div>
                                )}

                                {/* AI Comment */}
                                {item.ai_comment && (
                                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                                        <span className="text-[10px] text-purple-400 font-bold uppercase">🤖 AI komentář</span>
                                        <p className="text-xs text-purple-300/80 mt-1">{item.ai_comment}</p>
                                    </div>
                                )}

                                {/* ─── Action Bar ─── */}
                                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                    <button onClick={() => toggleFeatured(item.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${item.is_featured ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500 hover:text-green-400'}`}>
                                        {item.is_featured ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {item.is_featured ? 'Featured' : 'Feature'}
                                    </button>
                                    <button onClick={() => startEdit(item)}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/5 text-gray-500 hover:text-white transition-colors">
                                        <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => copyToClipboard(item.text, item.id)}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/5 text-gray-500 hover:text-white transition-colors">
                                        {copied === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied === item.id ? 'Zkopírováno!' : 'Kopírovat'}
                                    </button>
                                    <button onClick={() => deleteReview(item.id)}
                                        className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/5 text-gray-500 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-3 h-3" /> Smazat
                                    </button>
                                </div>

                                {/* ─── Edit Panel ─── */}
                                {editingId === item.id && (
                                    <div className="bg-black/40 border border-sz-red/20 rounded p-3 space-y-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1">AI Tag</label>
                                                <select value={editForm.ai_tag || 'regular'} onChange={e => setEditForm({ ...editForm, ai_tag: e.target.value as any })}
                                                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none">
                                                    <option value="highlight">⭐ Highlight</option>
                                                    <option value="honest">🛡️ Honest</option>
                                                    <option value="review_bomb">⚠️ Review Bomb</option>
                                                    <option value="regular">Regular</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1">AI Comment</label>
                                            <textarea value={editForm.ai_comment || ''} onChange={e => setEditForm({ ...editForm, ai_comment: e.target.value })}
                                                rows={2} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none resize-none" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-sz-red text-white text-xs font-bold uppercase rounded hover:bg-red-700">
                                                <Save className="w-3 h-3" /> Save
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 text-xs font-bold uppercase rounded hover:text-white">
                                                <X className="w-3 h-3" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ─── AI Reply Composer ─── */}
                                {!item.owner_response && (
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Wand2 className="w-3 h-3 text-blue-400" />
                                            <span className="text-[10px] text-blue-400 font-bold uppercase">Napsat odpověď</span>
                                        </div>
                                        <textarea
                                            value={replyDraft}
                                            onChange={e => setReplyDraft(e.target.value)}
                                            placeholder="Napiš draft odpovědi (nepovinné) a klikni na AI Generate, nebo nech AI napsat odpověď od nuly..."
                                            rows={3}
                                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500/50 outline-none resize-none"
                                        />
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => generateAiReply(item)} disabled={generatingReply}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded hover:bg-blue-500 transition-colors disabled:opacity-50">
                                                <Sparkles className="w-3 h-3" />
                                                {generatingReply ? 'Generuji...' : replyDraft ? 'AI Vylepšit' : 'AI Vygenerovat'}
                                            </button>
                                            {replyDraft && (
                                                <>
                                                    <button onClick={() => copyToClipboard(replyDraft, item.id + '_reply')}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold uppercase rounded hover:bg-green-500 transition-colors">
                                                        {copied === item.id + '_reply' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        {copied === item.id + '_reply' ? 'Zkopírováno!' : 'Kopírovat'}
                                                    </button>
                                                    {item.google_url && (
                                                        <a href={item.google_url} target="_blank" rel="noopener"
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-[10px] font-bold uppercase rounded hover:bg-amber-500 transition-colors">
                                                            <ExternalLink className="w-3 h-3" /> Otevřít na Google
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                ))}

                {items.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-600 font-mono text-xs">
                        <CloudDownload className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                        Žádné recenze. Klikni na "Deep Fetch ALL" pro stažení.
                    </div>
                )}

                {filteredItems.length === 0 && items.length > 0 && (
                    <div className="text-center py-6 text-gray-600 font-mono text-xs">
                        <Search className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                        Žádné recenze neodpovídají filtrům.
                        <button onClick={() => { setSearchQuery(''); setFilterLocation('all'); setFilterRating(0); setFilterTag('all'); setFilterResponse('all'); }}
                            className="block mx-auto mt-2 text-sz-red hover:text-red-400 underline text-xs">
                            Vymazat filtry
                        </button>
                    </div>
                )}
            </div>}

            {/* Place IDs config (collapsed) */}
            <details className="bg-black/20 border border-white/5 rounded-lg">
                <summary className="px-3 py-2 text-[10px] font-mono text-gray-500 uppercase cursor-pointer hover:text-gray-300">
                    Place IDs Config ({Object.keys(PLACE_IDS).length} locations)
                </summary>
                <div className="px-3 pb-3 space-y-1">
                    {Object.entries(PLACE_IDS).map(([loc, cfg]) => (
                        <div key={loc} className="flex items-center gap-2">
                            <span className={`text-[8px] px-1 py-0.5 rounded border font-bold uppercase ${getLocationColor(loc)}`}>{getLocationLabel(loc)}</span>
                            <span className={`text-[10px] font-mono ${cfg.placeId ? 'text-green-400' : 'text-red-400'}`}>
                                {cfg.placeId || 'Not configured'}
                            </span>
                        </div>
                    ))}
                </div>
            </details>
        </div>
    );
};

export default ReviewsTab;
