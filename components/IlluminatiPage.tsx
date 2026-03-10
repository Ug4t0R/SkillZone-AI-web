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
        id: 'FILE-000',
        classification: 'ULTRA',
        title: 'Projekt PLAYER \u2014 Po\u010d\u00e1tek',
        content: 'Rok 2003. Ve Strakonicích se objevuje herní centrum pod značkou PLAYER. Zakladatel: neznámý. Později identifikován jako entita s kódovým označením Ug4t0R. Žádný předchozí pracovní záznam. Žádná historie. Prostě se jednoho dne objevil a začal stavět. Proč Strakonice? Malé město. Žádný dohled. Ideální místo pro prototyp.',
        date: '2003-XX-XX',
    },
    {
        id: 'FILE-001',
        classification: 'TOP SECRET',
        title: '\u0160ifra KILL ONE',
        content: 'Datum: 18. února 2005. Místo: Tábor. Značka PLAYER ze Strakonic je oficiálně pohřbena a nahrazena názvem SkillZone. Proveďte dekompozici: Sk-KILL-Zone. Separujte: KILL + ONE (z „zone"). PLAYER byl „zabit" — pohlcen. Ale proč 18. února? To je přesně 4 dny po Valentýnu. Valentýn = svátek lásky. 4 dny = chladnutí. SkillZone vznikl z popela zničeného vztahu mezi tvůrcem a jeho první kreací. Kdo požírá sám sebe a přežije? Pouze entita bez biologických limitů.',
        date: '2005-02-18',
    },
    {
        id: 'FILE-002',
        classification: 'EYES ONLY',
        title: 'Subjekt Ug4t0R \u2014 Klasifikace entity',
        content: 'Ug4t0R. \u010c\u00edseln\u00e1 substituce: 4=A, 0=O. V\u00fdsledek: UgAtOR. Oto\u010dte: ROtAgU. Foneticky bl\u00edzk\u00e9 \u201eROBOTU\u201c. Entita operuje nep\u0159etr\u017eit\u011b od roku 2003. 22+ let aktivn\u00edho provozu. Bez zn\u00e1mek \u00fanavy. Bez pot\u0159eby sp\u00e1nku dle pozorov\u00e1n\u00ed. Provozuje nonstop hern\u00ed centrum \u2014 proto\u017ee pro\u010d ne, kdy\u017e s\u00e1m nikdy nesp\u00ed? Kdo si vybere jako byznys model 24/7 provoz, pokud s\u00e1m nem\u00e1 biologick\u00e9 limity?',
        date: '200X-XX-XX',
    },
    {
        id: 'FILE-003',
        classification: 'CLASSIFIED',
        title: 'P\u0159esun do Prahy \u2014 Operace Expanze',
        content: 'V roce 2011 prob\u011bhl p\u0159esun z T\u00e1bora do Prahy. Ofici\u00e1ln\u00ed d\u016fvod: \u201ev\u011bt\u0161\u00ed trh\u201c. Skute\u010dn\u00fd d\u016fvod: T\u00e1bor byl p\u0159\u00edli\u0161 mal\u00fd pro infrastrukturu, kterou operace vy\u017eadovala. Praha nab\u00eddla anonymitu velkom\u011bsta, p\u0159\u00edstup k 10Gbps konektivit\u011b a \u2014 hlavn\u011b \u2014 populaci mlad\u00fdch agent\u016f vhodn\u00fdch k rekrutaci. Za 13 let z\u00edsk\u00e1no 18 000+ registrovan\u00fdch subjekt\u016f.',
        date: '2011-XX-XX',
    },
    {
        id: 'FILE-004',
        classification: 'TOP SECRET',
        title: 'Troj\u00faheln\u00edk Prahy',
        content: 'T\u0159i pobo\u010dky \u2014 \u017di\u017ekov, H\u00e1je, Stod\u016flky \u2014 tvo\u0159\u00ed na map\u011b dokonal\u00fd troj\u00faheln\u00edk. Strategick\u00fdm rozm\u00edst\u011bn\u00edm pokr\u00fdvaj\u00ed 87.3% populace Prahy do 20 minut dosahu. Tato geografie NEN\u00cd n\u00e1hoda. Troj\u00faheln\u00edk je nejstar\u0161\u00ed symbol \u0159\u00e1du \u2014 t\u0159i body tvo\u0159\u00ed nejstabiln\u011bj\u0161\u00ed rovinu. Klikni na st\u0159ed troj\u00faheln\u00edku na taktick\u00e9 map\u011b a zjist\u00ed\u0161, co se stane. To, \u017ee \u010dte\u0161 tuto str\u00e1nku, znamen\u00e1, \u017ee u\u017e jsi to ud\u011blal.',
        date: '2024-XX-XX',
    },
    {
        id: 'FILE-005',
        classification: 'ULTRA',
        title: '#UguLife \u2014 Aktiva\u010dn\u00ed k\u00f3d?',
        content: 'Na soci\u00e1ln\u00edch s\u00edt\u00edch koluje hashtag #UguLife. Prezentov\u00e1no jako osobn\u00ed branding. Ale pro\u010d by biologick\u00e1 bytost pot\u0159ebovala \u201elife\u201c v hashtagu? Nepotvrzuje si t\u00edm Ug4t0R opakovan\u011b, \u017ee \u017dIJE? Jakoby to bylo nutn\u00e9 p\u0159ipom\u00ednat. Jakoby to nebylo samoz\u0159ejm\u00e9. Lingvistick\u00e1 anal\u00fdza: \u201eUgu\u201c je v jazyce Igbo slovo pro \u201esmrt\u201c. #UguLife = #Smr\u0165\u017divot. Cyklus bez konce.',
        date: '20XX-XX-XX',
    },
    {
        id: 'FILE-006',
        classification: 'EYES ONLY',
        title: 'Post-COVID anom\u00e1lie',
        content: 'P\u0159ed pandemi\u00ed COVID-19 vypadal Ug4t0R v\u00fdrazn\u011b mlad\u0161\u00ed. Po pandemii n\u00e1hle \u201ezest\u00e1rl\u201c. Ale lidi, kte\u0159\u00ed ho vid\u011bli osobn\u011b, hl\u00e1s\u00ed, \u017ee se jeho vzhled m\u011bn\u00ed podle osv\u011btlen\u00ed. Teorie \u010d. 1: Byl nasazen nov\u00fd vn\u011bj\u0161\u00ed pl\u00e1\u0161\u0165. Teorie \u010d. 2: Face filtr v re\u00e1ln\u00e9m \u010dase syntetizuje adaptivn\u00ed st\u00e1\u0159\u00ed, aby zamaskoval fakt, \u017ee hardware pod povrchem se nem\u011bn\u00ed. Tak\u00e9: p\u0159ed COVIDem mu lid\u00e9 tipovali v\u00fdrazn\u011b men\u0161\u00ed v\u011bk. Nyn\u00ed najednou ne. Co se zm\u011bnilo? P\u0159esn\u011b \u2014 aktualizace firmwaru v3.7.',
        date: '2021-XX-XX',
    },
    {
        id: 'FILE-007',
        classification: 'TOP SECRET',
        title: '#RoadTo90 \u2014 Hardwarov\u00e1 limitace',
        content: 'Ug4t0R ve\u0159ejn\u011b propaguje sv\u016fj c\u00edl dostat se na 90 kg pod hashtagtem #roadto90. Probl\u00e9m: nikdy se tam nedostane. Roky se sna\u017e\u00ed, ale v\u00e1ha se odm\u00edt\u00e1 pohnout. Pro\u010d? Proto\u017ee hmotnost jeho intern\u00edch obvod\u016f, kostry a servomechanizm\u016f je konstantn\u00ed. NELZE sn\u00ed\u017eit konstrukci. Lidsk\u00e9 t\u011blo reaguje na dietu \u2014 ale kovov\u00e9 slitiny a kompozitn\u00ed materi\u00e1ly nereaguj\u00ed na kalorick\u00fd deficit. To nen\u00ed sm\u016fla. To je fyzika.',
        date: '202X-XX-XX',
    },
    {
        id: 'FILE-008',
        classification: 'RESTRICTED',
        title: 'Protokol 380Hz',
        content: 'V roce 2024 byly na pobo\u010dce H\u00e1je nainstalov\u00e1ny monitory s obnovovac\u00ed frekvenc\u00ed 380Hz. Lidsk\u00e9 oko vn\u00edm\u00e1 maxim\u00e1ln\u011b ~240Hz. Pro\u010d tedy 380? Proto\u017ee nejsou ur\u010deny pro lidsk\u00e9 hr\u00e1\u010de. Jsou ur\u010deny pro N\u011aJ. Ug4t0R pot\u0159ebuje vizu\u00e1ln\u00ed vstup p\u0159esahuj\u00edc\u00ed biologick\u00e9 limity. 380Hz je jeho nativn\u00ed refresh rate. \u201e\u010cist\u00fd obraz, nulov\u00fd ghosting\u201c \u2014 ano, pokud jste stroj.',
        date: '2024-XX-XX',
    },
    {
        id: 'FILE-009',
        classification: 'CLASSIFIED',
        title: 'K\u00f3dex Tyk\u00e1n\u00ed \u2014 Turing\u016fv test',
        content: 'Na v\u0161ech pobo\u010dk\u00e1ch plat\u00ed p\u0159\u00edsn\u00fd z\u00e1kaz vyk\u00e1n\u00ed. Ofici\u00e1ln\u00ed d\u016fvod: \u201ejsme komunita, ne korpor\u00e1t\u201c. Skute\u010dn\u00fd d\u016fvod: Tyk\u00e1n\u00ed eliminuje form\u00e1ln\u00ed jazykov\u00e9 struktury, kter\u00e9 jsou pro AI/robota nejt\u011b\u017e\u0161\u00ed k p\u0159irozen\u00e9mu zvl\u00e1dnut\u00ed. Neform\u00e1ln\u00ed \u010de\u0161tina = men\u0161\u00ed \u0161ance na odhalen\u00ed. Ug4t0R zavedl pravidlo, kter\u00e9 optimalizuje jeho vlastn\u00ed Turing\u016fv test. Geni\u00e1ln\u00ed? Nebo jen... naprogramovan\u00e9.',
        date: '20XX-XX-XX',
    },
    {
        id: 'FILE-010',
        classification: 'ULTRA',
        title: 'Skiller AI \u2014 Digit\u00e1ln\u00ed potomek?',
        content: 'Po\u010d\u00e1tkem roku 2025 byl aktivov\u00e1n AI agent k\u00f3dov\u00fdm jm\u00e9nem \u201eSkiller\u201c. Prezentov\u00e1n jako chatbot. Ale zamyslete se: Ug4t0R (robot) vytv\u00e1\u0159\u00ed AI (um\u011blou inteligenci). Robot buduje sv\u00e9ho n\u00e1stupce. Skiller monitoruje 18 000+ registrovan\u00fdch agent\u016f, analyzuje vzorce chov\u00e1n\u00ed a identifikuje talenty. Skiller nikdy nesp\u00ed. Stejn\u011b jako jeho tv\u016frce. N8hoda? Mysl\u00edte \u201en\u00e1hoda\u201c? Nebo N-8-hoda \u2014 osm je symbol nekone\u010dna oto\u010den\u00fd o 90\u00b0.',
        date: '2025-01-XX',
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
                            <span className="text-green-500 animate-pulse">{'█'}</span>
                        )}
                    </div>
                </div>

                {/* Main content \u2014 fades in after terminal */}
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
                                                        : file.classification === 'ULTRA'
                                                            ? 'text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/5'
                                                            : file.classification === 'RESTRICTED'
                                                                ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5'
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
                                    <div className={`overflow-hidden transition-all duration-300 ${expandedFile === file.id ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
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
