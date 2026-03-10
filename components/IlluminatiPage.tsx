/**
 * IlluminatiPage — Secret easter egg page accessible via /illuminati
 * Found by clicking the triangle center on the tactical map.
 * A fun, mysterious, conspiracy-themed page with SkillZone lore.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Triangle, Skull, Lock, ChevronDown, Zap, ArrowLeft } from 'lucide-react';
import { pushRoute } from '../services/routeConfig';
import { AppView } from '../types';

// Classified "conspiracy" facts mixing real SkillZone history with humor
const CLASSIFIED_FILES = [
    {
        id: 'FILE-001',
        classification: 'TOP SECRET',
        title: 'Operace Žižkov',
        content: 'V roce 2005 založil agent Ug4t0R na Žižkově základnu pod krycím názvem "herní klub". Ve skutečnosti šlo o nejpokročilejší tréninkové středisko pro digitální válčení ve střední Evropě. Dosud zůstává v nonstop provozu — bez přerušení — 20 let.',
        date: '2005-XX-XX',
    },
    {
        id: 'FILE-002',
        classification: 'CLASSIFIED',
        title: 'Trojúhelník Prahy',
        content: 'Tři pobočky SkillZone — Žižkov, Háje, Stodůlky — tvoří na mapě dokonalý trojúhelník. Náhoda? Ne. Strategickým rozmístěním pokrývají 87.3% populace Prahy do 20 minut dosahu. Architektonická geometrie signalizuje příslušnost k vyšším řádům.',
        date: '2024-XX-XX',
    },
    {
        id: 'FILE-003',
        classification: 'EYES ONLY',
        title: 'Protokol 380Hz',
        content: 'V roce 2024 byly na pobočce Háje nainstalovány monitory s obnovovací frekvencí 380Hz — technologie, kterou běžná veřejnost neměla vidět. Důvod? Tréninková simulace vyžaduje vizuální vstup přesahující biologické limity lidského oka. Některé věci lze vidět jen tehdy, když víte, kam se dívat.',
        date: '2024-XX-XX',
    },
    {
        id: 'FILE-004',
        classification: 'RESTRICTED',
        title: 'Bootcamp — Privátní sektor',
        content: 'Privátní prostory na Hájích s vlastním vchodem, vlastním WC a vlastním cateringem. Oficiálně pro LAN party. Neoficiálně slouží jako bezpečná místnost pro strategické porady herních guildů, kteří kontrolují top 100 žebříčků v 17 zemích.',
        date: '2023-XX-XX',
    },
    {
        id: 'FILE-005',
        classification: 'TOP SECRET',
        title: 'Skiller — Umělá inteligence',
        content: 'Na počátku roku 2025 byl aktivován AI agent kódovým jménem "Skiller". Veřejnosti prezentován jako chatbot. Ve skutečnosti monitoruje 18 000+ registrovaných agentů, analyzuje herní vzorce a identifikuje příští generaci esport talentů. Skiller nikdy nespí.',
        date: '2025-01-XX',
    },
    {
        id: 'FILE-006',
        classification: 'CLASSIFIED',
        title: 'Kódex Tykání',
        content: 'Na všech pobočkách platí přísný zákaz vykání. Interní analýza prokázala, že neformální prostředí zvyšuje herní výkon o 23.7%. Jediná výjimka: „kravťáci, co si chodí obchodovat krypto na net" — ti si zaslouží formální oslovení.',
        date: '20XX-XX-XX',
    },
];

// Mysterious terminal-style messages
const TERMINAL_MESSAGES = [
    '> ESTABLISHING SECURE CONNECTION...',
    '> ENCRYPTING CHANNEL... AES-256-GCM',
    '> VERIFYING CLEARANCE LEVEL...',
    '> ACCESS GRANTED: LEVEL OMEGA',
    '> LOADING CLASSIFIED DOCUMENTS...',
    '> WARNING: ALL ACTIVITY IS MONITORED',
    '> WELCOME, AGENT. PROCEED WITH CAUTION.',
];

const IlluminatiPage: React.FC = () => {
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const [showContent, setShowContent] = useState(false);
    const [expandedFile, setExpandedFile] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [glitchActive, setGlitchActive] = useState(false);

    // Terminal boot sequence
    useEffect(() => {
        let idx = 0;
        const timer = setInterval(() => {
            if (idx < TERMINAL_MESSAGES.length) {
                const line = TERMINAL_MESSAGES[idx];
                idx++;
                setTerminalLines(prev => [...prev, line]);
            } else {
                clearInterval(timer);
                setTimeout(() => setShowContent(true), 500);
            }
        }, 400);
        return () => clearInterval(timer);
    }, []);

    // Random glitch effect
    useEffect(() => {
        const glitchTimer = setInterval(() => {
            if (Math.random() > 0.85) {
                setGlitchActive(true);
                setTimeout(() => setGlitchActive(false), 150);
            }
        }, 3000);
        return () => clearInterval(glitchTimer);
    }, []);

    // Track mouse for parallax eye
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
            y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
        });
    }, []);

    const navigateTo = (view: AppView) => {
        pushRoute(view);
        window.dispatchEvent(new Event('popstate'));
        window.scrollTo(0, 0);
    };

    return (
        <div
            className="min-h-screen bg-[#030303] text-white overflow-hidden relative"
            onMouseMove={handleMouseMove}
        >
            {/* Animated background grid */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="w-full h-full opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(#E31E24 1px, transparent 1px), linear-gradient(90deg, #E31E24 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }} />
            </div>

            {/* Floating triangles background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute border border-sz-red/5 animate-spin"
                        style={{
                            width: `${80 + i * 60}px`,
                            height: `${80 + i * 60}px`,
                            top: `${10 + i * 15}%`,
                            left: `${5 + i * 16}%`,
                            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                            animationDuration: `${30 + i * 15}s`,
                            animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
                        }}
                    />
                ))}
            </div>

            {/* Glitch overlay */}
            {glitchActive && (
                <div className="fixed inset-0 z-50 pointer-events-none mix-blend-difference">
                    <div className="w-full h-1 bg-sz-red/50 absolute" style={{ top: `${Math.random() * 100}%` }} />
                    <div className="w-full h-px bg-cyan-500/30 absolute" style={{ top: `${Math.random() * 100}%` }} />
                </div>
            )}

            <div className="relative z-10 max-w-4xl mx-auto px-6">
                {/* Back button */}
                <button
                    onClick={() => navigateTo('home')}
                    className="fixed top-20 left-4 md:left-8 z-20 flex items-center gap-2 text-gray-600 hover:text-sz-red text-xs font-mono transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> ABORT MISSION
                </button>

                {/* Terminal Boot */}
                <div className="pt-24 pb-8">
                    <div className="bg-black border border-sz-red/20 rounded-sm p-4 font-mono text-xs overflow-hidden">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                            <div className="w-2 h-2 rounded-full bg-sz-red animate-pulse" />
                            <span className="text-gray-500">SKILLZONE_INTEL_SYSTEM v3.7.1</span>
                        </div>
                        {terminalLines.filter(Boolean).map((line, i) => (
                            <div key={i} className={`${line?.includes('WARNING') ? 'text-yellow-400' : line?.includes('GRANTED') ? 'text-green-400' : 'text-green-500/70'} mb-1`}>
                                {line}
                            </div>
                        ))}
                        {!showContent && (
                            <span className="text-green-500 animate-pulse">█</span>
                        )}
                    </div>
                </div>

                {/* Main content — fades in after terminal */}
                <div className={`transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                    {/* Giant Eye */}
                    <div className="flex flex-col items-center py-12 relative">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            {/* Outer glow pulse */}
                            <div className="absolute inset-0 rounded-full bg-sz-red/5 animate-ping" style={{ animationDuration: '3s' }} />

                            {/* Triangle */}
                            <svg viewBox="0 0 200 180" className="w-full h-full absolute">
                                <polygon
                                    points="100,10 190,170 10,170"
                                    fill="none"
                                    stroke="#E31E24"
                                    strokeWidth="1.5"
                                    opacity="0.3"
                                />
                                <polygon
                                    points="100,40 160,150 40,150"
                                    fill="none"
                                    stroke="#E31E24"
                                    strokeWidth="0.8"
                                    opacity="0.15"
                                />
                            </svg>

                            {/* Eye that follows mouse */}
                            <div className="relative z-10" style={{
                                transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`,
                                transition: 'transform 0.1s ease-out',
                            }}>
                                <Eye className="w-12 h-12 text-sz-red drop-shadow-[0_0_20px_rgba(227,30,36,0.5)]" />
                            </div>
                        </div>

                        <h1 className={`mt-8 text-3xl md:text-5xl font-orbitron font-black tracking-[0.2em] uppercase text-center ${glitchActive ? 'text-cyan-400' : 'text-white'} transition-colors`}>
                            ILLUMINATI
                        </h1>
                        <div className="mt-2 text-sz-red text-xs font-mono tracking-[0.5em] uppercase">
                            CONFIRMED
                        </div>
                        <p className="mt-6 text-gray-500 text-sm font-mono text-center max-w-lg leading-relaxed">
                            Našel jsi to. Trojúhelník poboček SkillZone není náhoda.<br />
                            Vítej v hloubce. Zde jsou takzvané utajované dokumenty.
                        </p>
                    </div>

                    {/* Classified Files */}
                    <div className="space-y-3 pb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="w-4 h-4 text-sz-red" />
                            <h2 className="text-xs font-mono text-gray-400 uppercase tracking-[0.3em]">
                                Declassified Intelligence Files
                            </h2>
                        </div>

                        {CLASSIFIED_FILES.map((file) => (
                            <button
                                key={file.id}
                                onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                                className="w-full text-left group"
                            >
                                <div className={`bg-black/60 backdrop-blur-sm border rounded-sm p-4 transition-all duration-300 ${
                                    expandedFile === file.id
                                        ? 'border-sz-red/40 shadow-[0_0_20px_rgba(227,30,36,0.1)]'
                                        : 'border-white/5 hover:border-white/15'
                                }`}>
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm border ${
                                                file.classification === 'TOP SECRET'
                                                    ? 'text-red-400 border-red-400/30 bg-red-400/5'
                                                    : file.classification === 'EYES ONLY'
                                                        ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5'
                                                        : 'text-orange-400 border-orange-400/30 bg-orange-400/5'
                                            }`}>
                                                {file.classification}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-600">{file.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-gray-600">{file.date}</span>
                                            <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${expandedFile === file.id ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="mt-2 font-bold text-sm text-white group-hover:text-sz-red transition-colors">
                                        {file.title}
                                    </h3>

                                    {/* Content */}
                                    <div className={`overflow-hidden transition-all duration-300 ${expandedFile === file.id ? 'max-h-40 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="border-t border-white/5 pt-3">
                                            <p className="text-xs text-gray-400 leading-relaxed font-mono">
                                                {file.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Hidden message  */}
                    <div className="py-12 text-center border-t border-white/5">
                        <div className="inline-flex items-center gap-2 text-gray-700 text-[10px] font-mono tracking-wider">
                            <Triangle className="w-3 h-3" />
                            THE TRIANGLE SEES ALL
                            <Triangle className="w-3 h-3" />
                        </div>
                        <p className="mt-4 text-gray-600 text-xs font-mono">
                            Sdílej tento odkaz s dalšími agenty: <code className="text-sz-red/50 bg-white/5 px-2 py-0.5 rounded">skillzone.cz/illuminati</code>
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button
                                onClick={() => navigateTo('secretpages')}
                                className="text-[10px] font-mono text-gray-500 hover:text-sz-red border border-white/10 hover:border-sz-red/30 px-4 py-2 rounded-sm transition-all"
                            >
                                <Skull className="w-3 h-3 inline mr-1.5" />
                                DALŠÍ TAJNÉ STRÁNKY
                            </button>
                            <button
                                onClick={() => navigateTo('locations')}
                                className="text-[10px] font-mono text-gray-500 hover:text-sz-red border border-white/10 hover:border-sz-red/30 px-4 py-2 rounded-sm transition-all"
                            >
                                <Zap className="w-3 h-3 inline mr-1.5" />
                                ZPĚT NA TAKTICKOU MAPU
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IlluminatiPage;
