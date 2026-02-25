// Corporate Mode 🏢📊
// The anti-GenZ — sterile, formal, jargon-loaded corporate website parody
// Everything becomes a "solution", everyone is "Vážený klient", nothing is fun

import React, { useEffect, useState, useRef } from 'react';

// ═══════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════

const CORPORATE_QUOTES = [
    'Leveragujeme synergii herního zážitku a klientské spokojenosti.',
    'Naše KPI za Q4 překonaly benchmarky trhu o 23.7%.',
    'Vážený klienti, prosíme o dodržování provozního řádu.',
    'Optimalizujeme customer journey v reálném čase.',
    'Implementujeme agile přístup k správě herních stanic.',
    'Naše NPS skóre dosáhlo all-time high. Děkujeme stakeholderům.',
    'GDPR compliance status: ✅ Plně v souladu.',
    'Pivotujeme naši strategii směrem k omnichannel řešení.',
    'Proaktivně řešíme pain points v klientském onboardingu.',
    'Naše core competence? Disrupting the gaming café vertical.',
];

const COOKIE_CATEGORIES = [
    { id: 'essential', name: 'Nezbytné cookies', desc: 'Nutné pro základní funkčnost portálu', locked: true },
    { id: 'analytics', name: 'Analytické cookies', desc: 'Sledování KPI a uživatelských metrik', locked: false },
    { id: 'marketing', name: 'Marketingové cookies', desc: 'Personalizace obsahu a retargeting', locked: false },
    { id: 'synergy', name: 'Synergetické cookies™', desc: 'Optimalizace cross-platform experience', locked: false },
    { id: 'ai', name: 'AI-powered cookies', desc: 'Machine learning pro lepší UX', locked: false },
    { id: 'blockchain', name: 'Blockchain cookies', desc: 'Decentralizovaná správa preferencí', locked: false },
];

const STOCK_MEETINGS = [
    '🤝 Strategická porada vedení — 15:00',
    '📊 Quarterly Business Review — 16:30',
    '☕ Networking coffee s partnery — 10:00',
    '📋 Compliance audit follow-up — 11:00',
    '💼 Stakeholder alignment session — 14:00',
    '🎯 OKR planning sprint — 09:30',
];

// ═══════════════════════════════════════════════════════
// COOKIE CONSENT BANNER (parody)
// ═══════════════════════════════════════════════════════

const CookieConsentBanner: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none">
            <div
                className="pointer-events-auto w-full max-w-2xl m-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 animate-in slide-in-from-bottom duration-500"
                style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
            >
                <div className="flex items-start gap-3 mb-4">
                    <span className="text-3xl">🍪</span>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Nastavení souborů cookies</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Společnost SkillZone s.r.o. využívá soubory cookies a obdobné technologie za účelem
                            optimalizace Vašeho uživatelského zážitku, analýzy návštěvnosti a personalizace obsahu
                            v souladu s nařízením EU 2016/679 (GDPR).
                        </p>
                    </div>
                </div>

                {showDetails && (
                    <div className="border-t border-gray-200 pt-4 mb-4 space-y-2 max-h-48 overflow-y-auto">
                        {COOKIE_CATEGORIES.map(c => (
                            <label key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                <div>
                                    <span className="font-medium text-gray-800">{c.name}</span>
                                    <span className="text-gray-400 text-xs block">{c.desc}</span>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked={c.locked}
                                    disabled={c.locked}
                                    className="w-4 h-4 accent-blue-600"
                                />
                            </label>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => setVisible(false)}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition-colors"
                    >
                        Přijmout vše
                    </button>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded font-medium text-sm hover:bg-gray-200 transition-colors"
                    >
                        {showDetails ? 'Skrýt nastavení' : 'Přizpůsobit'}
                    </button>
                    <button
                        onClick={() => setVisible(false)}
                        className="py-2.5 px-4 bg-gray-100 text-gray-500 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                        Odmítnout
                    </button>
                </div>

                <p className="text-[9px] text-gray-400 mt-3 text-center">
                    Podrobnosti naleznete v naší Zásadách ochrany osobních údajů | GDPR | Obchodní podmínky | ISO 27001
                </p>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// CORPORATE QUOTE TICKER — top bar
// ═══════════════════════════════════════════════════════

const CorporateTicker: React.FC = () => {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const iv = setInterval(() => {
            setIdx(i => (i + 1) % CORPORATE_QUOTES.length);
        }, 6000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-gradient-to-r from-blue-900 to-blue-800 text-white py-1.5 px-4 font-sans text-xs text-center shadow-sm">
            <span className="opacity-60 mr-2">📢</span>
            <span className="transition-opacity duration-500">{CORPORATE_QUOTES[idx]}</span>
            <span className="opacity-40 ml-4">|</span>
            <span className="opacity-60 ml-4 text-[10px]">SkillZone s.r.o. — Vaše herní řešení™</span>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// MEETING WIDGET — bottom-right corner
// ═══════════════════════════════════════════════════════

const MeetingWidget: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 8000);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed bottom-20 right-4 z-[9997] animate-in slide-in-from-right duration-500">
            <div
                className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                style={{ fontFamily: "'Segoe UI', Arial, sans-serif", width: expanded ? '280px' : '220px' }}
            >
                <div
                    className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span className="text-xs font-medium">📅 Dnešní schůzky</span>
                    <button onClick={(e) => { e.stopPropagation(); setVisible(false); }}
                        className="text-white/60 hover:text-white text-xs"
                    >✕</button>
                </div>
                {expanded && (
                    <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {STOCK_MEETINGS.map((m, i) => (
                            <div key={i} className="text-[11px] text-gray-600 py-1 border-b border-gray-100 last:border-0">
                                {m}
                            </div>
                        ))}
                    </div>
                )}
                {!expanded && (
                    <div className="px-4 py-2 text-[11px] text-gray-500">
                        {STOCK_MEETINGS.length} naplánovaných schůzek
                    </div>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// WATERMARK — faint diagonal "CONFIDENTIAL" text
// ═══════════════════════════════════════════════════════

const ConfidentialWatermark: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9990] pointer-events-none overflow-hidden select-none" aria-hidden>
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    transform: 'rotate(-30deg) scale(2)',
                    opacity: 0.02,
                }}
            >
                <div className="text-6xl font-bold text-gray-900 dark:text-white tracking-[0.3em] whitespace-nowrap">
                    CONFIDENTIAL — INTERNAL USE ONLY
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// OUTLOOK-STYLE NOTIFICATION POPUP
// ═══════════════════════════════════════════════════════

const EmailPopup: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [emailIdx, setEmailIdx] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const EMAILS = [
        { from: 'HR oddělení', subject: 'Připomínka: vyplnění dotazníku zaměstnanecké spokojenosti' },
        { from: 'IT Support', subject: 'Plánovaná odstávka systémů — 03:00–05:00' },
        { from: 'Marketing', subject: 'FW: RE: FW: Nový branding guidelines draft v3.2 FINAL (2)' },
        { from: 'Compliance', subject: 'Povinné školení BOZP — deadline pátek' },
        { from: 'CFO Office', subject: 'Q4 Budget reforecast — action required' },
        { from: 'Receptionist AI', subject: 'Vážený klienti, Vaše rezervace byla potvrzena' },
    ];

    const showNext = () => {
        setEmailIdx(i => (i + 1) % EMAILS.length);
        setVisible(true);
        timerRef.current = setTimeout(() => setVisible(false), 5000);
    };

    useEffect(() => {
        const initial = setTimeout(showNext, 15000);
        const recurring = setInterval(showNext, 25000 + Math.random() * 15000);
        return () => {
            clearTimeout(initial);
            clearInterval(recurring);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    if (!visible) return null;

    const email = EMAILS[emailIdx];

    return (
        <div className="fixed bottom-4 right-4 z-[9996] animate-in slide-in-from-bottom-2 duration-300">
            <div
                className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-72"
                style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
            >
                <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-lg">✉️</span>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-400 font-medium">{email.from}</div>
                        <div className="text-xs text-gray-800 font-medium truncate">{email.subject}</div>
                    </div>
                    <button
                        onClick={() => setVisible(false)}
                        className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
                    >✕</button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// TOGGLE BUTTON (with "Zpět do normálu" option)
// ═══════════════════════════════════════════════════════

const CorporateToggle: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
    return (
        <div className="fixed top-10 right-4 z-[9999]">
            <button
                onClick={onToggle}
                className="bg-white border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded shadow-sm hover:bg-gray-50 transition-all"
                style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
            >
                ⚠️ Deaktivovat korporátní režim
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const CorporateMode: React.FC<{ isActive: boolean; onToggle: () => void }> = ({ isActive, onToggle }) => {
    if (!isActive) return null;

    return (
        <>
            <CorporateTicker />
            <CookieConsentBanner />
            <ConfidentialWatermark />
            <MeetingWidget />
            <EmailPopup />
            <CorporateToggle onToggle={onToggle} />
        </>
    );
};

export default CorporateMode;
