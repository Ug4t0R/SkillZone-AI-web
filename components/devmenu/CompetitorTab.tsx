/**
 * CompetitorTab — DevMenu tab for competitive intelligence.
 * Shows competitor comparison table, pricing chart, live Google ratings,
 * AI-powered SWOT analysis, and SEO keyword position monitoring.
 */
import React, { useState, useCallback } from 'react';
import {
    RefreshCw, TrendingUp, BarChart3, Brain, ExternalLink,
    Star, Monitor, Clock, MapPin, Wifi, Trophy,
    ChevronDown, ChevronUp, Search, Zap, Shield, Target,
    AlertTriangle, Sparkles
} from 'lucide-react';

interface CompetitorTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

// ─── COMPETITOR DATA ─────────────────────────────────────────────────

interface Competitor {
    id: string;
    name: string;
    shortName: string;
    website: string;
    color: string;
    isUs: boolean;
    branches: { city: string; address: string; pcCount?: number; specs?: string }[];
    pcCount: number;
    gpu: string;
    cpu: string;
    ram: string;
    monitor: string;
    pricePerHour: string;
    priceMin: number;
    priceMax: number;
    openHours: string;
    internet: string;
    consoles: string;
    food: string;
    lanParty: boolean;
    vr: boolean;
    founded: string;
    yearsActive: number;
    extras: string[];
    sourceUrls: { label: string; url: string }[];
    googlePlaceId?: string;
    // ARES & Business info
    ico?: string;
    owner?: string;
    legalForm?: string;
    aresNote?: string;
    // Social media
    socialMedia?: { platform: string; url: string; icon: string }[];
}

const COMPETITORS: Competitor[] = [
    {
        id: 'skillzone',
        name: 'SkillZone Gaming Club',
        shortName: 'SkillZone',
        website: 'skillzone.cz',
        color: '#E31E24',
        isUs: true,
        branches: [
            { city: 'Praha 3', address: 'Orebitská 630/4, Žižkov', pcCount: 29, specs: '240Hz + 380Hz + VIP 2.5K' },
            { city: 'Praha 4', address: 'Arkalycká 877/4, Háje', pcCount: 27, specs: '240Hz + 380Hz + VIP 2.5K + Konzole' },
            { city: 'Praha 5', address: 'Mukařovského 1986/7, Stodůlky', pcCount: 15, specs: 'RTX 40 Series, Next-Gen' },
            { city: 'Praha 4', address: 'Bootcamp Háje (Private)', pcCount: 10, specs: 'BYOB, Soukromý vchod, Pípa' },
        ],
        pcCount: 81,
        gpu: 'RTX 4070 Ti Super',
        cpu: 'Intel i7-13700KF',
        ram: '64 GB DDR5',
        monitor: '240Hz 24.5" + 380Hz 24" Esport',
        pricePerHour: 'od 49 Kč (member)',
        priceMin: 49,
        priceMax: 119,
        openHours: 'NONSTOP 24/7 (Žižkov)',
        internet: '10 Gbps',
        consoles: 'Konzole s 65" TV',
        food: 'Barista káva',
        lanParty: true,
        vr: false,
        founded: '2005',
        yearsActive: new Date().getFullYear() - 2005,
        extras: ['NONSTOP 24/7', `${new Date().getFullYear() - 2005} let na trhu`, '10Gbps internet', 'SkillParty', 'Esport 380Hz PC', 'Hráčský profil app', 'Private Bootcamp'],
        sourceUrls: [{ label: 'Web', url: 'https://skillzone.cz/' }],
        googlePlaceId: 'ChIJb1rmyqmUC0cRT5nRhm_j490',
        ico: '03674525',
        owner: 'Tomáš Švec',
        legalForm: 's.r.o.',
        socialMedia: [
            { platform: 'Facebook', url: 'https://www.facebook.com/SkillZone.cz', icon: '📘' },
            { platform: 'Instagram', url: 'https://www.instagram.com/skillzone.cz', icon: '📸' },
        ],
    },
    {
        id: 'mvp',
        name: 'MVP Esports — Chill & Gaming Space',
        shortName: 'MVP Esports',
        website: 'mvpesports.cz',
        color: '#6366f1',
        isUs: false,
        branches: [
            { city: 'Praha 1', address: 'Spálená 51', specs: 'NEZJIŠTĚNO' },
            { city: 'Brno', address: 'Centrum', specs: 'NEZJIŠTĚNO' },
        ],
        pcCount: 0, // NEZJIŠTĚNO — web neukazuje
        gpu: 'NEZJIŠTĚNO',
        cpu: 'NEZJIŠTĚNO',
        ram: 'NEZJIŠTĚNO',
        monitor: '240Hz 25" BenQ Zowie',
        pricePerHour: '45–80 Kč',
        priceMin: 45,
        priceMax: 80,
        openHours: '12:00–21:00',
        internet: 'N/A',
        consoles: 'PS5',
        food: 'Bar',
        lanParty: false,
        vr: false,
        founded: '~2020',
        yearsActive: new Date().getFullYear() - 2020,
        extras: ['Centrum Prahy', 'Pobočka v Brně', 'Day/Night passy', 'Franšíza', 'Mobilní appka'],
        sourceUrls: [
            { label: 'Web Praha', url: 'https://mvpesports.cz/praha' },
            { label: 'Web Brno', url: 'https://mvpesports.cz/brno' },
        ],
        googlePlaceId: 'ChIJz3TaLIaUC0cRThN4uyflYL4',
        socialMedia: [
            { platform: 'Instagram', url: 'https://www.instagram.com/mvpesports.cz', icon: '📸' },
        ],
    },
    {
        id: 'playzone',
        name: 'Vodafone PLAYzone Arena',
        shortName: 'PLAYzone',
        website: 'playzonearena.cz',
        color: '#22c55e',
        isUs: false,
        branches: [
            { city: 'Praha 4', address: 'OC Westfield Chodov, Roztylská 2321/19', pcCount: 55, specs: '20 open + 7× bootcamp, VR, simulátory' },
        ],
        pcCount: 55,
        gpu: 'RTX 4060Ti — RTX 5070Ti',
        cpu: 'i5-13400F / Ryzen 7 9800X3D',
        ram: '32–64 GB',
        monitor: '240Hz+',
        pricePerHour: '79 Kč',
        priceMin: 79,
        priceMax: 79,
        openHours: 'NE-ČT 11-22, PÁ-SO 11-01',
        internet: 'N/A',
        consoles: 'PS5, VR, simulátory',
        food: 'PIXEL BURGER + bar',
        lanParty: true,
        vr: true,
        founded: '~2019',
        yearsActive: new Date().getFullYear() - 2019,
        extras: ['55 PC (20 open, 7x bootcamp room)', 'VR stanice', 'Závodní simulátory', 'PIXEL BURGER restaurace', 'V OC Chodov', 'Kempy pro děti', 'Narozeninové oslavy'],
        sourceUrls: [{ label: 'Web', url: 'https://www.playzonearena.cz/' }],
        googlePlaceId: 'ChIJU0DPK5OTC0cR53f9-0LcXxA',
        ico: '07551096',
        legalForm: 's.r.o.',
        socialMedia: [
            { platform: 'Instagram', url: 'https://www.instagram.com/playzonearena', icon: '📸' },
            { platform: 'Facebook', url: 'https://www.facebook.com/PlayzoneArena', icon: '📘' },
        ],
    },
    {
        id: 'pitstop',
        name: 'Pit-Stop Lounge',
        shortName: 'Pit-Stop',
        website: 'pitstoplounge.com',
        color: '#f59e0b',
        isUs: false,
        branches: [
            { city: 'Praha', address: 'N/A' },
        ],
        pcCount: 12, // NEZJIŠTĚNO přesně
        gpu: 'RTX 4060 Ti', // NEZJIŠTĚNO přesně
        cpu: 'NEZJIŠTĚNO',
        ram: 'NEZJIŠTĚNO',
        monitor: 'NEZJIŠTĚNO',
        pricePerHour: 'NEZJIŠTĚNO',
        priceMin: 0, // NEZJIŠTĚNO
        priceMax: 0, // NEZJIŠTĚNO,
        openHours: 'PO-SO 10:00–22:00',
        internet: 'N/A',
        consoles: 'PS5, Xbox',
        food: 'Bar',
        lanParty: true,
        vr: false,
        founded: '~2023',
        yearsActive: new Date().getFullYear() - 2023,
        extras: ['Turnaje (CS2)', 'Kulečník', 'Vinohrady'],
        sourceUrls: [{ label: 'Oficiální web', url: 'https://pitstoplounge.com/' }],
    },
    {
        id: 'reload',
        name: 'Reload Esports Bar',
        shortName: 'Reload',
        website: 'facebook.com/ReloadEsportsBar',
        color: '#eab308',
        isUs: false,
        branches: [
            { city: 'Praha 5', address: 'Zborovská 1074/30, Smíchov' },
        ],
        pcCount: 20,
        gpu: 'N/A',
        cpu: 'N/A',
        ram: 'N/A',
        monitor: '144Hz+',
        pricePerHour: 'N/A',
        priceMin: 0,
        priceMax: 0,
        openHours: 'ÚT-NE 16:00–00:00',
        internet: 'N/A',
        consoles: 'PS5, Xbox',
        food: 'Bar + Občerstvení',
        lanParty: false,
        vr: false,
        founded: '~2015',
        yearsActive: new Date().getFullYear() - 2015,
        extras: ['E-sports bar', 'Sledování turnajů', 'Deskové hry'],
        sourceUrls: [{ label: 'Facebook', url: 'https://www.facebook.com/ReloadEsportsBar' }],
    },
    {
        id: 'cyberempire',
        name: 'CyberEmpire',
        shortName: 'CyberEmpire',
        website: 'cyberempire.cz',
        color: '#a855f7',
        isUs: false,
        branches: [
            { city: 'Praha 1', address: 'Na Florenci 23', pcCount: 36, specs: '25 open + 2×5 bootcamp + VIP (360Hz)' },
        ],
        pcCount: 36,
        gpu: 'RTX 5070 Ti',
        cpu: 'Intel i7-14700KF',
        ram: 'N/A',
        monitor: '240Hz 27" ZOWIE + 360Hz VIP',
        pricePerHour: '90 Kč',
        priceMin: 90,
        priceMax: 90,
        openHours: 'N/A (Day pass 12-21)',
        internet: 'N/A',
        consoles: 'PS5 + VR',
        food: 'Minibar v VIP',
        lanParty: true,
        vr: true,
        founded: '~2024',
        yearsActive: new Date().getFullYear() - 2024,
        extras: ['VIP Room (360Hz)', '200 m²', 'RTX 5070 Ti', '2× Bootcamp room', 'Klimatizace', 'HyperX příslušenství'],
        sourceUrls: [{ label: 'Web', url: 'https://cyberempire.cz/' }],
        socialMedia: [
            { platform: 'Instagram', url: 'https://www.instagram.com/cyberempirecz/', icon: '📸' },
        ],
    },
    {
        id: 'esportarena',
        name: 'Esport Arena Plzeň',
        shortName: 'Esport Arena',
        website: 'esportarena.cz',
        color: '#0ea5e9',
        isUs: false,
        branches: [
            { city: 'Plzeň', address: 'AreaD' },
        ],
        pcCount: 28,
        gpu: 'RX 7800 XT',
        cpu: 'Ryzen 5 9600X',
        ram: '32 GB DDR5',
        monitor: 'N/A',
        pricePerHour: '75 Kč',
        priceMin: 75,
        priceMax: 75,
        openHours: 'N/A',
        internet: 'N/A',
        consoles: 'PS5, SIM-Racing',
        food: 'Pizza (Slevomat)',
        lanParty: false,
        vr: false,
        founded: 'N/A',
        yearsActive: 0,
        extras: ['EsportVan', 'Kroužky pro děti', 'Mimo Prahu'],
        sourceUrls: [{ label: 'Web', url: 'https://esportarena.cz/' }],
    },
];

// ─── SEO KEYWORDS ────────────────────────────────────────────────────

const SEO_KEYWORDS = [
    'herní klub Praha',
    'gaming cafe Praha',
    'LAN party Praha',
    'cyber cafe Praha',
    'esport Praha',
    'počítačový klub Praha',
    'gaming club Prague',
    'PC herna Praha',
];

// ─── COMPONENT ───────────────────────────────────────────────────────

const CompetitorTab: React.FC<CompetitorTabProps> = ({ addLog }) => {
    const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);
    const [swotAnalysis, setSwotAnalysis] = useState<string | null>(null);
    const [swotLoading, setSwotLoading] = useState(false);
    const [ratings, setRatings] = useState<Record<string, { rating: number; count: number } | null>>({});
    const [ratingsLoading, setRatingsLoading] = useState(false);
    const [seoResults, setSeoResults] = useState<Record<string, { position: number; url: string }[]> | null>(null);
    const [seoLoading, setSeoLoading] = useState(false);

    // ─── Live Google Ratings ─────────────────────────────────────────
    const fetchRatings = useCallback(async () => {
        setRatingsLoading(true);
        addLog('Fetching competitor Google ratings...');
        const results: Record<string, { rating: number; count: number } | null> = {};

        for (const c of COMPETITORS) {
            if (!c.googlePlaceId) {
                results[c.id] = null;
                continue;
            }
            try {
                // Use Places API via proxy
                const { callPlacesProxy } = await import('../../services/apiProxy');
                const data = await callPlacesProxy(
                    `https://places.googleapis.com/v1/places/${c.googlePlaceId}`,
                    {
                        method: 'GET',
                        fieldMask: 'rating,userRatingCount',
                    }
                );
                results[c.id] = {
                    rating: data.rating || 0,
                    count: data.userRatingCount || 0,
                };
            } catch {
                results[c.id] = null;
            }
        }

        setRatings(results);
        setRatingsLoading(false);
        addLog('Google ratings loaded', 'success');
    }, [addLog]);

    // ─── AI SWOT Analysis ────────────────────────────────────────────
    const runSwotAnalysis = useCallback(async () => {
        setSwotLoading(true);
        addLog('Running AI competitive analysis...');

        const competitorSummary = COMPETITORS.map(c => {
            return `${c.name}:
- PCs: ${c.pcCount}, GPU: ${c.gpu}, Monitor: ${c.monitor}
- Price: ${c.pricePerHour} (${c.priceMin}–${c.priceMax} Kč/h)
- Hours: ${c.openHours}, Internet: ${c.internet}
- Branches: ${c.branches.length} (${c.branches.map(b => b.city).join(', ')})
- Founded: ${c.founded} (${c.yearsActive} years)
- Extras: ${c.extras.join(', ')}
- Consoles: ${c.consoles}, Food: ${c.food}, VR: ${c.vr ? 'Yes' : 'No'}
- Google Rating: ${ratings[c.id] ? `${ratings[c.id]!.rating}⭐ (${ratings[c.id]!.count} reviews)` : 'N/A'}
${c.isUs ? '>>> THIS IS OUR COMPANY <<<' : ''}`;
        }).join('\n\n');

        try {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY || '' });

            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `You are a competitive intelligence analyst for SkillZone, a gaming club chain in Prague, Czech Republic.

Analyze the following competitor data and provide a comprehensive SWOT analysis IN CZECH LANGUAGE:

${competitorSummary}

Format your response as:

## 💪 SILNÉ STRÁNKY (Strengths)
- List 5-7 key strengths of SkillZone vs competitors

## ⚠️ SLABÉ STRÁNKY (Weaknesses)
- List 3-5 weaknesses compared to competitors

## 🚀 PŘÍLEŽITOSTI (Opportunities)
- List 5-7 opportunities for growth/improvement based on what competitors offer

## 🔥 HROZBY (Threats)
- List 3-5 competitive threats

## 📊 DOPORUČENÍ
- List 5 specific, actionable recommendations to strengthen competitive position

Be specific, data-driven, and reference actual numbers. Focus on the Czech gaming cafe market.`,
            });

            setSwotAnalysis(result.text || 'Analysis failed.');
            addLog('SWOT analysis complete', 'success');
        } catch (err) {
            setSwotAnalysis(`Error: ${err}`);
            addLog('SWOT analysis failed', 'error');
        }

        setSwotLoading(false);
    }, [addLog, ratings]);

    // ─── SEO Keyword Check ──────────────────────────────────────────
    const checkSeoPositions = useCallback(async () => {
        setSeoLoading(true);
        addLog('Checking SEO keyword positions...');

        const results: Record<string, { position: number; url: string }[]> = {};

        for (const keyword of SEO_KEYWORDS.slice(0, 4)) { // Limit to save API credits
            try {
                const { callSerpApiProxy } = await import('../../services/apiProxy');

                const data = await callSerpApiProxy({
                    engine: 'google',
                    q: keyword,
                    location: 'Prague, Czech Republic',
                    gl: 'cz',
                    hl: 'cs',
                    num: '20',
                });

                const organicResults = data.organic_results || [];
                const found: { position: number; url: string }[] = [];

                for (const result of organicResults) {
                    const url = (result.link || '').toLowerCase();
                    for (const comp of COMPETITORS) {
                        if (url.includes(comp.website)) {
                            found.push({
                                position: result.position || 0,
                                url: result.link,
                            });
                        }
                    }
                }
                results[keyword] = found;
            } catch (err) {
                addLog(`SEO check failed for "${keyword}": ${err}`, 'error');
            }
        }

        setSeoResults(results);
        setSeoLoading(false);
        addLog('SEO position check complete', 'success');
    }, [addLog]);

    // ─── RENDER HELPERS ──────────────────────────────────────────────

    const us = COMPETITORS.find(c => c.isUs)!;
    const them = COMPETITORS.filter(c => !c.isUs);
    const maxPCs = Math.max(...COMPETITORS.map(c => c.pcCount));
    const maxPrice = Math.max(...COMPETITORS.filter(c => c.priceMax > 0).map(c => c.priceMax));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-sz-red" />
                    <h3 className="text-white font-bold font-orbitron text-sm uppercase">Competitor Intelligence</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchRatings}
                        disabled={ratingsLoading}
                        className="text-[10px] font-mono text-gray-400 hover:text-white px-2 py-1 border border-white/10 rounded hover:bg-white/5 transition-all uppercase flex items-center gap-1"
                    >
                        {ratingsLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                        Ratings
                    </button>
                </div>
            </div>

            {/* ─── Quick Stats Row ─── */}
            <div className="grid grid-cols-4 gap-2">
                {COMPETITORS.map(c => (
                    <div
                        key={c.id}
                        className={`rounded-lg p-3 border transition-all cursor-pointer ${c.isUs
                            ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                            }`}
                        onClick={() => setExpandedCompetitor(expandedCompetitor === c.id ? null : c.id)}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                            <span className={`text-xs font-bold truncate ${c.isUs ? 'text-red-400' : 'text-white'}`}>
                                {c.shortName}
                            </span>
                            {c.isUs && <span className="text-[8px] bg-red-500 text-white px-1 rounded">MY</span>}
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                                <Monitor className="w-3 h-3" /> {c.pcCount > 0 ? `${c.pcCount} PC` : 'NEZJIŠTĚNO'}
                            </div>
                            <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {c.branches.length} poboč{c.branches.length === 1 ? 'ka' : c.branches.length < 5 ? 'ky' : 'ek'}
                            </div>
                            <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {c.founded}
                            </div>
                            {ratings[c.id] && (
                                <div className="text-[10px] font-mono text-yellow-400 flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400" /> {ratings[c.id]!.rating} ({ratings[c.id]!.count})
                                </div>
                            )}
                        </div>
                        <div className="mt-2">
                            {expandedCompetitor === c.id ? <ChevronUp className="w-3 h-3 text-gray-500 mx-auto" /> : <ChevronDown className="w-3 h-3 text-gray-500 mx-auto" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Expanded Competitor Detail ─── */}
            {expandedCompetitor && (() => {
                const c = COMPETITORS.find(x => x.id === expandedCompetitor)!;
                return (
                    <div className="bg-black/40 border border-white/10 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                                {c.name}
                                {c.isUs && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">MY COMPANY</span>}
                            </h4>
                            <div className="flex items-center gap-3">
                                {c.socialMedia?.map((s, i) => (
                                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] text-gray-400 hover:text-white transition-colors" title={s.platform}>
                                        {s.icon}
                                    </a>
                                ))}
                                <a href={`https://${c.website}`} target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                    {c.website} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* ARES / Business Info */}
                        {(c.ico || c.owner || c.legalForm) && (
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                                <div className="text-[10px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-1.5">
                                    🏛️ Obchodní rejstřík (ARES)
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
                                    {c.ico && <div><span className="text-gray-500">IČO:</span> <span className="text-white">{c.ico}</span></div>}
                                    {c.owner && <div><span className="text-gray-500">Majitel:</span> <span className="text-white">{c.owner}</span></div>}
                                    {c.legalForm && <div><span className="text-gray-500">Forma:</span> <span className="text-white">{c.legalForm}</span></div>}
                                    <div><span className="text-gray-500">Založeno:</span> <span className="text-white">{c.founded}</span></div>
                                </div>
                                {c.aresNote && <div className="text-[9px] text-gray-500 mt-1 italic">{c.aresNote}</div>}
                            </div>
                        )}

                        {/* Hardware Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] font-mono">
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">GPU:</span> <span className="text-white">{c.gpu}</span>
                            </div>
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">CPU:</span> <span className="text-white">{c.cpu}</span>
                            </div>
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">RAM:</span> <span className="text-white">{c.ram}</span>
                            </div>
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">Monitor:</span> <span className="text-white">{c.monitor}</span>
                            </div>
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">Cena/h:</span> <span className="text-green-400">{c.pricePerHour}</span>
                            </div>
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">Internet:</span> <span className="text-white">{c.internet}</span>
                            </div>
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">Konzole:</span> <span className="text-white">{c.consoles}</span>
                            </div>
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">Jídlo:</span> <span className="text-white">{c.food}</span>
                            </div>
                            <div className="bg-white/5 rounded px-2 py-1.5">
                                <span className="text-gray-500">Hodiny:</span> <span className="text-white">{c.openHours}</span>
                            </div>
                        </div>

                        {/* Per-Branch Breakdown Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-[10px] font-mono border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-1.5 px-2 text-gray-500">Pobočka</th>
                                        <th className="text-left py-1.5 px-2 text-gray-500">Adresa</th>
                                        <th className="text-center py-1.5 px-2 text-gray-500">PC</th>
                                        <th className="text-left py-1.5 px-2 text-gray-500">Specifikace</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {c.branches.map((b, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="py-1.5 px-2 text-white">{b.city}</td>
                                            <td className="py-1.5 px-2 text-gray-400">{b.address}</td>
                                            <td className="py-1.5 px-2 text-center font-bold" style={{ color: c.color }}>{b.pcCount || '?'}</td>
                                            <td className="py-1.5 px-2 text-gray-500">{b.specs || '—'}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-white/10 bg-white/[0.02]">
                                        <td className="py-1.5 px-2 text-white font-bold" colSpan={2}>Celkem</td>
                                        <td className="py-1.5 px-2 text-center font-bold" style={{ color: c.color }}>{c.pcCount}</td>
                                        <td className="py-1.5 px-2 text-gray-500">{c.branches.length} poboč{c.branches.length === 1 ? 'ka' : c.branches.length < 5 ? 'ky' : 'ek'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Extras tags */}
                        <div className="flex flex-wrap gap-1.5">
                            {c.extras.map((e, i) => (
                                <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                                    style={{ borderColor: `${c.color}40`, color: c.color, background: `${c.color}10` }}>
                                    {e}
                                </span>
                            ))}
                        </div>

                        {/* Sources */}
                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-2">
                                Zdroje:
                                {c.sourceUrls.map((s, i) => (
                                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                        {s.label}
                                    </a>
                                ))}
                            </span>
                            {c.ico && (
                                <>
                                    <span className="opacity-30">|</span>
                                    <a href={`https://ares.gov.cz/ekonomicke-subjekty-v-be/detail/${c.ico}`} target="_blank" rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 underline">
                                        ARES Detail
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* ─── Comparison Charts ─── */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" /> Porovnání
                </h4>

                {/* PC Count bars */}
                <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Počet PC</span>
                    {COMPETITORS.map(c => (
                        <div key={c.id} className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400 w-20 truncate">{c.shortName}</span>
                            <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                                    style={{
                                        width: `${(c.pcCount / maxPCs) * 100}%`,
                                        background: `linear-gradient(90deg, ${c.color}40, ${c.color})`,
                                    }}
                                >
                                    <span className="text-[9px] font-bold text-white">{c.pcCount}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price range bars */}
                <div className="space-y-2 mt-4">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Cena za hodinu (Kč)</span>
                    {COMPETITORS.filter(c => c.priceMax > 0).map(c => (
                        <div key={c.id} className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400 w-20 truncate">{c.shortName}</span>
                            <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden relative">
                                {/* Min-max range */}
                                <div
                                    className="h-full rounded-full absolute transition-all duration-700 flex items-center justify-center"
                                    style={{
                                        left: `${(c.priceMin / maxPrice) * 100}%`,
                                        width: `${((c.priceMax - c.priceMin) / maxPrice) * 100}%`,
                                        minWidth: '30px',
                                        background: `linear-gradient(90deg, ${c.color}60, ${c.color})`,
                                    }}
                                >
                                    <span className="text-[8px] font-bold text-white whitespace-nowrap">
                                        {c.priceMin}–{c.priceMax}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Competitive Advantages (auto-detected) ─── */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" /> Naše výhody
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { icon: Clock, text: 'Jediný NONSTOP 24/7', detail: 'Žádný konkurent nemá non-stop provoz' },
                        { icon: Wifi, text: '10 Gbps internet', detail: 'Nejvyšší rychlost na trhu' },
                        { icon: Trophy, text: `${us.yearsActive} let na trhu`, detail: `Od ${us.founded} — nejdéle z konkurence` },
                        { icon: MapPin, text: `${us.branches.length} pobočky v Praze`, detail: 'Nejširší pokrytí v Praze' },
                        { icon: Monitor, text: '380Hz Esport PC', detail: 'Nejvyšší refresh rate na trhu' },
                        { icon: Target, text: 'Nejnižší cena/h', detail: `Od ${us.priceMin} Kč pro členy` },
                    ].map((adv, i) => (
                        <div key={i} className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 group hover:bg-green-500/10 transition-all">
                            <div className="flex items-center gap-2 mb-1">
                                <adv.icon className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-xs font-bold text-green-400">{adv.text}</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500">{adv.detail}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Gaps (areas to improve) ─── */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" /> K Zlepšení
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { text: 'Konzole (PS5)', detail: 'MVP i PLAYzone nabízí PS5' },
                        { text: 'Bar / občerstvení', detail: 'PLAYzone má PIXEL BURGER, MVP bar' },
                        { text: 'VR stanice', detail: 'PLAYzone nabízí Valve Index + HTC Vive' },
                        { text: 'Závodní simulátory', detail: 'PLAYzone nabízí HYUNDAI sim' },
                    ].map((gap, i) => (
                        <div key={i} className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                            <span className="text-xs font-bold text-orange-400">{gap.text}</span>
                            <div className="text-[10px] font-mono text-gray-500 mt-0.5">{gap.detail}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── AI SWOT Analysis ─── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" /> AI SWOT Analýza
                    </h4>
                    <button
                        onClick={runSwotAnalysis}
                        disabled={swotLoading}
                        className="text-[10px] font-mono text-purple-400 hover:text-white px-3 py-1.5 border border-purple-500/20 rounded hover:bg-purple-500/10 transition-all flex items-center gap-1.5"
                    >
                        {swotLoading ? (
                            <><RefreshCw className="w-3 h-3 animate-spin" /> Analyzuji...</>
                        ) : (
                            <><Sparkles className="w-3 h-3" /> Spustit AI analýzu</>
                        )}
                    </button>
                </div>
                {swotAnalysis && (
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                        <div className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                            {swotAnalysis}
                        </div>
                    </div>
                )}
                {!swotAnalysis && !swotLoading && (
                    <p className="text-[10px] text-gray-600 font-mono">
                        Klikni "Spustit AI analýzu" pro generaci SWOT analýzy pomocí Gemini. Doporučuji nejprve načíst Google ratings.
                    </p>
                )}
            </div>

            {/* ─── SEO Position Monitor ─── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Search className="w-4 h-4 text-cyan-400" /> SEO Pozice
                    </h4>
                    <button
                        onClick={checkSeoPositions}
                        disabled={seoLoading}
                        className="text-[10px] font-mono text-cyan-400 hover:text-white px-3 py-1.5 border border-cyan-500/20 rounded hover:bg-cyan-500/10 transition-all flex items-center gap-1.5"
                    >
                        {seoLoading ? (
                            <><RefreshCw className="w-3 h-3 animate-spin" /> Kontroluji...</>
                        ) : (
                            <><TrendingUp className="w-3 h-3" /> Zkontrolovat pozice</>
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-gray-600 font-mono">
                    ⚠️ Používá SerpAPI — spotřebovává API kredity. Kontroluje prvních 20 pozic na Google.cz.
                </p>

                {seoResults && (
                    <div className="space-y-2">
                        {SEO_KEYWORDS.slice(0, 4).map(keyword => {
                            const results = seoResults[keyword] || [];
                            return (
                                <div key={keyword} className="bg-black/40 border border-white/10 rounded-lg p-3">
                                    <div className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
                                        <Search className="w-3 h-3" /> „{keyword}"
                                    </div>
                                    {results.length === 0 ? (
                                        <span className="text-[10px] text-gray-500 font-mono">Žádný z nás ani konkurence v TOP 20</span>
                                    ) : (
                                        <div className="space-y-1">
                                            {results.map((r, i) => {
                                                const comp = COMPETITORS.find(c => r.url.toLowerCase().includes(c.website));
                                                return (
                                                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                                                        <span className={`w-5 h-5 rounded flex items-center justify-center font-bold ${r.position <= 3 ? 'bg-green-500/20 text-green-400' : r.position <= 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            {r.position}
                                                        </span>
                                                        <div className="w-2 h-2 rounded-full" style={{ background: comp?.color || '#666' }} />
                                                        <span className={comp?.isUs ? 'text-red-400 font-bold' : 'text-gray-300'}>
                                                            {comp?.shortName || 'Unknown'}
                                                        </span>
                                                        <span className="text-gray-600 truncate ml-auto">{r.url}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Target keywords as tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {SEO_KEYWORDS.map((kw, i) => (
                        <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">
                            {kw}
                        </span>
                    ))}
                </div>
            </div>

            {/* ─── Full Comparison Table ─── */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-white" /> Srovnávací tabulka
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-mono border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-2 px-2 text-gray-500">Parametr</th>
                                {COMPETITORS.map(c => (
                                    <th key={c.id} className="text-center py-2 px-2" style={{ color: c.color }}>
                                        {c.shortName}
                                        {c.isUs && ' ⭐'}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: 'Počet PC', get: (c: Competitor) => String(c.pcCount) },
                                { label: 'GPU', get: (c: Competitor) => c.gpu },
                                { label: 'Monitor', get: (c: Competitor) => c.monitor },
                                { label: 'Cena/h', get: (c: Competitor) => c.pricePerHour },
                                { label: 'Otevírací doba', get: (c: Competitor) => c.openHours },
                                { label: 'Internet', get: (c: Competitor) => c.internet },
                                { label: 'Pobočky', get: (c: Competitor) => String(c.branches.length) },
                                { label: 'Konzole', get: (c: Competitor) => c.consoles },
                                { label: 'Jídlo', get: (c: Competitor) => c.food },
                                { label: 'VR', get: (c: Competitor) => c.vr ? '✅' : '—' },
                                { label: 'LAN Party', get: (c: Competitor) => c.lanParty ? '✅' : '—' },
                                { label: 'Založeno', get: (c: Competitor) => c.founded },
                            ].map((row, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="py-1.5 px-2 text-gray-500">{row.label}</td>
                                    {COMPETITORS.map(c => (
                                        <td key={c.id} className={`py-1.5 px-2 text-center ${c.isUs ? 'text-red-300 font-bold' : 'text-gray-400'}`}>
                                            {row.get(c)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CompetitorTab;
