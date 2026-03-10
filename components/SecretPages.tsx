/**
 * SecretPages — Hidden directory page listing all unlisted/secret routes.
 * Accessible via /prisnetajne — not linked from any public navigation.
 */
import React from 'react';
import { Eye, EyeOff, Lock, MapPin, Gift, Sword, Gamepad2, Monitor, Calendar, ArrowRight, Skull, Shield } from 'lucide-react';
import { getAllRoutes, RouteEntry } from '../services/routeConfig';
import { AppView } from '../types';

interface SecretPagesProps {
    onChangeView: (view: AppView) => void;
}

interface SecretPageInfo {
    path: string;
    view: AppView;
    title: string;
    description: string;
    icon: React.ReactNode;
    category: 'branch' | 'promo' | 'hidden' | 'easteregg' | 'system';
    aliases?: string[];
}

const SECRET_PAGES: SecretPageInfo[] = [
    // Branch detail pages
    {
        path: '/provozovny/zizkov',
        view: 'branch_zizkov',
        title: 'Žižkov (Nonstop)',
        description: 'Detail stránka legendární nonstop pobočky v Praze 3. Orebitská 630/4.',
        icon: <MapPin className="w-5 h-5" />,
        category: 'branch',
        aliases: ['/zizkov', '/provozovny/nonstop'],
    },
    {
        path: '/provozovny/haje',
        view: 'branch_haje',
        title: 'Háje (Metro)',
        description: 'Detail stránka pobočky u metra Háje. Arkalycká 877/4.',
        icon: <MapPin className="w-5 h-5" />,
        category: 'branch',
        aliases: ['/haje'],
    },
    {
        path: '/provozovny/stodulky',
        view: 'branch_stodulky',
        title: 'Stodůlky (Nově otevřeno)',
        description: 'Detail stránka nejnovější pobočky v Praze 13. Prusíkova 2577/16.',
        icon: <MapPin className="w-5 h-5" />,
        category: 'branch',
        aliases: ['/stodulky'],
    },
    {
        path: '/provozovny/bootcamp',
        view: 'branch_bootcamp',
        title: 'Private Bootcamp',
        description: 'Soukromý pronájem 10 PC pro LAN party, narozeniny, rozlučky. BYOB, vlastní vchod.',
        icon: <Lock className="w-5 h-5" />,
        category: 'branch',
        aliases: ['/bootcamp', '/provozovny/holesovice'],
    },

    // SEO Promo landing pages
    {
        path: '/arena',
        view: 'arena',
        title: 'Herní Aréna Praha',
        description: 'SEO landing page cílící na klíčové slovo "herní aréna Praha". Přesměruje návštěvníky na pobočky.',
        icon: <Sword className="w-5 h-5" />,
        category: 'promo',
    },
    {
        path: '/mvp',
        view: 'mvp',
        title: 'MVP Esport Trénink',
        description: 'SEO landing page cílící na "MVP esport". Ukazuje naše esportové vybavení.',
        icon: <Gamepad2 className="w-5 h-5" />,
        category: 'promo',
    },
    {
        path: '/cybersport',
        view: 'cybersport',
        title: 'Cybersport & Bootcamp',
        description: 'SEO landing page cílící na "cybersport Praha". Propaguje privátní Bootcamp.',
        icon: <Monitor className="w-5 h-5" />,
        category: 'promo',
    },

    // Hidden functional pages
    {
        path: '/poukaz-darky',
        view: 'gift',
        title: 'Dárkové poukázky',
        description: 'Stránka pro nákup dárkových poukázek. PDF, osobní předání nebo Zásilkovna.',
        icon: <Gift className="w-5 h-5" />,
        category: 'hidden',
        aliases: ['/gift', '/voucher'],
    },
    {
        path: '/poukaz',
        view: 'poukaz',
        title: 'Uplatnit poukázku',
        description: 'Stránka pro aktivaci promo kódů. Zadej heslo a získej kredit zdarma.',
        icon: <Gift className="w-5 h-5" />,
        category: 'hidden',
        aliases: ['/redeem'],
    },
    {
        path: '/pronajem',
        view: 'rentals',
        title: 'Soukromý pronájem',
        description: 'Pronájem prostor a techniky pro eventy, teambuildingy, narozeniny.',
        icon: <Calendar className="w-5 h-5" />,
        category: 'hidden',
        aliases: ['/rentals', '/soukromy-pronajem'],
    },

    // Easter egg / system aliases
    {
        path: '/?comingsoon',
        view: 'home',
        title: 'Coming Soon Preview',
        description: 'Náhled Coming Soon stránky. Funguje jen když je Coming Soon mód zapnutý v DevMenu → Sections.',
        icon: <Eye className="w-5 h-5" />,
        category: 'system',
    },
    {
        path: '/?mode=brainrot',
        view: 'home',
        title: 'GenZ / Brainrot Mode',
        description: 'Aktivuje Brainrot mode — sigma quotes, floating emoji, Ohio rizz energy. Pro sdílení s kamarády.',
        icon: <Skull className="w-5 h-5" />,
        category: 'easteregg',
        aliases: ['/?mode=genz', '/?mode=zoomer'],
    },
    {
        path: '/?mode=corporate',
        view: 'home',
        title: 'Corporate Mode',
        description: 'Aktivuje korporátní režim — synergy leveraging, fake cookie bannery, meeting widgety. Pro sdílení s kolegy z office.',
        icon: <Shield className="w-5 h-5" />,
        category: 'easteregg',
        aliases: ['/?mode=corp', '/?mode=office'],
    },
    {
        path: '/illuminati',
        view: 'illuminati',
        title: '🔺 Illuminati Confirmed',
        description: 'Na taktické mapě naše pobočky tvoří trojúhelník. Najdi střed, klikni na oko a zjisti, co se stane. Nebo prostě běž na /illuminati.',
        icon: <Eye className="w-5 h-5" />,
        category: 'easteregg',
        aliases: ['/triangle', '/all-seeing-eye', '/oko'],
    },
];

// Home aliases that are secret entry points
const HOME_ALIASES = ['/bar', '/info', '/skillvestr', '/sms', '/appnews', '/appwelcome', '/xxx', '/ohrada'];

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    branch: { label: '📍 Detail poboček', color: 'text-blue-400', icon: <MapPin className="w-4 h-4" /> },
    promo: { label: '🎯 SEO Landing Pages', color: 'text-purple-400', icon: <Sword className="w-4 h-4" /> },
    hidden: { label: '🔒 Skryté funkční stránky', color: 'text-green-400', icon: <EyeOff className="w-4 h-4" /> },
    easteregg: { label: '🥚 Easter Eggy & Skryté módy', color: 'text-yellow-400', icon: <Eye className="w-4 h-4" /> },
    system: { label: '⚙️ Systémové', color: 'text-gray-400', icon: <Shield className="w-4 h-4" /> },
};

const SecretPages: React.FC<SecretPagesProps> = ({ onChangeView }) => {
    const categories = ['branch', 'promo', 'hidden', 'easteregg', 'system'] as const;

    const navigate = (view: AppView) => {
        onChangeView(view);
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505] text-white">
            {/* Header */}
            <div className="max-w-4xl mx-auto px-6 pt-16 pb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Skull className="w-8 h-8 text-sz-red animate-pulse" />
                    <h1 className="text-3xl md:text-4xl font-orbitron font-bold bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                        PŘÍSNĚ TAJNÉ
                    </h1>
                </div>
                <p className="text-gray-500 text-sm font-mono mt-2">
                    Tato stránka obsahuje seznam všech skrytých a neveřejných URL adres,
                    které nejsou přístupné z hlavní navigace webu. Některé slouží jako SEO
                    landing pages, jiné jako interní nástroje.
                </p>
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    <p className="text-xs text-red-400 font-mono flex items-center gap-2">
                        <Lock className="w-4 h-4 flex-shrink-0" />
                        Tato stránka sama o sobě je skrytá na <code className="bg-black/40 px-1.5 py-0.5 rounded">/prisnetajne</code> — nikde na webu na ni nevede odkaz.
                    </p>
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-4xl mx-auto px-6 pb-16 space-y-10">
                {categories.map(cat => {
                    const pages = SECRET_PAGES.filter(p => p.category === cat);
                    const meta = CATEGORY_LABELS[cat];
                    if (pages.length === 0) return null;

                    return (
                        <div key={cat}>
                            <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${meta.color}`}>
                                {meta.icon} {meta.label}
                            </h2>
                            <div className="grid gap-3">
                                {pages.map(page => (
                                    <button
                                        key={page.path}
                                        onClick={() => {
                                            if (page.path.startsWith('/?')) {
                                                window.location.href = page.path;
                                            } else {
                                                navigate(page.view);
                                            }
                                        }}
                                        className="group w-full text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-200"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-0.5 text-gray-500 group-hover:text-sz-red transition-colors">
                                                {page.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-bold text-white group-hover:text-sz-red transition-colors">
                                                        {page.title}
                                                    </span>
                                                    <code className="text-[10px] font-mono bg-black/40 text-gray-500 px-2 py-0.5 rounded">
                                                        {page.path}
                                                    </code>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                    {page.description}
                                                </p>
                                                {page.aliases && page.aliases.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        <span className="text-[9px] text-gray-600 font-mono">Aliasy:</span>
                                                        {page.aliases.map(a => (
                                                            <code key={a} className="text-[9px] font-mono bg-white/5 text-gray-500 px-1.5 py-0.5 rounded">
                                                                {a}
                                                            </code>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-sz-red transition-colors mt-1 flex-shrink-0" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Easter egg aliases */}
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-yellow-400">
                        <Skull className="w-4 h-4" /> Easter Egg URL
                    </h2>
                    <p className="text-xs text-gray-500 font-mono mb-3">
                        Tyto URL adresy existují, ale všechny vedou na homepage. Jsou to skryté aliasy.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {HOME_ALIASES.map(alias => (
                            <a
                                key={alias}
                                href={alias}
                                className="text-xs font-mono bg-yellow-500/5 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 px-3 py-1.5 rounded-lg transition-all"
                            >
                                {alias}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Route stats */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📊 Statistiky routování</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        {(() => {
                            const routes = getAllRoutes();
                            const hidden = routes.filter(r => r.hidden);
                            const totalAliases = routes.reduce((sum, r) => sum + r.aliases.length, 0);
                            return (
                                <>
                                    <div>
                                        <div className="text-2xl font-orbitron font-bold text-white">{routes.length}</div>
                                        <div className="text-[10px] font-mono text-gray-500 mt-1">Celkem stránek</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-orbitron font-bold text-red-400">{hidden.length}</div>
                                        <div className="text-[10px] font-mono text-gray-500 mt-1">Skrytých</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-orbitron font-bold text-blue-400">{totalAliases}</div>
                                        <div className="text-[10px] font-mono text-gray-500 mt-1">URL aliasů</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-orbitron font-bold text-green-400">{routes.length + totalAliases}</div>
                                        <div className="text-[10px] font-mono text-gray-500 mt-1">Celkem URL</div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecretPages;
