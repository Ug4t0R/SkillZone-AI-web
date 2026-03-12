
import React, { useState, useCallback } from 'react';
import { MapPin, Crown, Star, Clock, Monitor, Zap, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { pushRoute } from '../services/routeConfig';

interface MapPoint {
    id: string;
    label: string;
    top: string;
    left: string;
    type: 'public' | 'hybrid' | 'new';
    specs: string;
    status: string;
    pcs: string;
}

const AllLocationsMap: React.FC = () => {
    const [hoveredPin, setHoveredPin] = useState<string | null>(null);
    const [triangleHovered, setTriangleHovered] = useState(false);
    const [illuminatiRevealed, setIlluminatiRevealed] = useState(false);
    const { language } = useAppContext();

    const handleTriangleClick = useCallback(() => {
        setIlluminatiRevealed(true);
        // Brief dramatic reveal then navigate
        setTimeout(() => {
            setIlluminatiRevealed(false);
            pushRoute('illuminati');
            window.dispatchEvent(new Event('popstate'));
            window.scrollTo(0, 0);
        }, 1500);
    }, []);

    const mapPoints: MapPoint[] = [
        {
            id: 'zizkov',
            label: language === 'cs' ? 'Žižkov (Nonstop)' : 'Žižkov (Nonstop)',
            top: '32%',
            left: '53%',
            type: 'public',
            specs: '240Hz, 10Gbps',
            status: 'NONSTOP 24/7',
            pcs: '29 PC'
        },
        {
            id: 'haje',
            label: language === 'cs' ? 'Háje / Bootcamp' : 'Háje / Bootcamp',
            top: '76%',
            left: '71%',
            type: 'hybrid',
            specs: '240Hz & 380Hz',
            status: '12:00 – 03:00+',
            pcs: '27 PC'
        },
        {
            id: 'stodulky',
            label: language === 'cs' ? 'Stodůlky (NOVÉ)' : 'Stodůlky (NEW)',
            top: '72%',
            left: '28%',
            type: 'new',
            specs: 'RTX 40 Series',
            status: '13:00 – 23:00',
            pcs: '24 PC'
        }
    ];

    const scrollToLocation = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <div className="w-full bg-zinc-900/50 border border-white/5 p-6 rounded-lg relative overflow-hidden">
            <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-6 uppercase border-b border-sz-red/30 pb-4 inline-block">
                {language === 'cs' ? 'Taktická Mapa' : 'Tactical Map'} <span className="text-sz-red">{language === 'cs' ? 'Prahy' : 'Prague'}</span>
            </h3>

            {/* Map Container */}
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-[#111] rounded-sm overflow-hidden border border-white/10 group">

                {/* Grid Background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="w-full h-full" style={{
                        backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}></div>

                    {/* Vltava River SVG — traced from user's hand-drawn reference */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 500" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2a4a6a" stopOpacity="0.6" />
                                <stop offset="50%" stopColor="#3a6a90" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#2a4a6a" stopOpacity="0.6" />
                            </linearGradient>
                            <filter id="riverGlow">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="riverShadow">
                                <feGaussianBlur stdDeviation="12" />
                            </filter>
                        </defs>
                        {/* 
                            Pin positions for reference:
                            Žižkov:    x=580 y=140
                            Stodůlky:  x=280 y=360
                            Háje:      x=720 y=390
                            River always LEFT of Žižkov, between Stodůlky and center
                        */}
                        {/* Shadow layer */}
                        <path
                            d="M350,0 C350,50 500,40 500,90 C500,140 380,120 380,180 C380,240 410,250 380,320 C350,390 340,430 340,500"
                            fill="none" stroke="#0a0a0a" strokeWidth="55" filter="url(#riverShadow)" opacity="0.8"
                        />
                        {/* Main river body */}
                        <path
                            d="M350,0 C350,50 500,40 500,90 C500,140 380,120 380,180 C380,240 410,250 380,320 C350,390 340,430 340,500"
                            fill="none" stroke="url(#riverGrad)" strokeWidth="16" strokeLinecap="round" filter="url(#riverGlow)"
                        />
                        {/* Thin highlight center line */}
                        <path
                            d="M350,0 C350,50 500,40 500,90 C500,140 380,120 380,180 C380,240 410,250 380,320 C350,390 340,430 340,500"
                            fill="none" stroke="#5a8ab5" strokeWidth="2" opacity="0.25" strokeLinecap="round"
                        />
                        {/* Animated flow particles */}
                        <circle r="2" fill="#6a9ac0" opacity="0.6">
                            <animateMotion dur="9s" repeatCount="indefinite"
                                path="M350,0 C350,50 500,40 500,90 C500,140 380,120 380,180 C380,240 410,250 380,320 C350,390 340,430 340,500" />
                        </circle>
                        <circle r="1.5" fill="#6a9ac0" opacity="0.4">
                            <animateMotion dur="9s" repeatCount="indefinite" begin="3s"
                                path="M350,0 C350,50 500,40 500,90 C500,140 380,120 380,180 C380,240 410,250 380,320 C350,390 340,430 340,500" />
                        </circle>
                        <circle r="1.5" fill="#6a9ac0" opacity="0.5">
                            <animateMotion dur="9s" repeatCount="indefinite" begin="6s"
                                path="M350,0 C350,50 500,40 500,90 C500,140 380,120 380,180 C380,240 410,250 380,320 C350,390 340,430 340,500" />
                        </circle>
                    </svg>
                </div>

                {/* Connection Lines between locations */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]" preserveAspectRatio="none">
                    <line x1="53%" y1="32%" x2="28%" y2="72%" stroke="#E31E24" strokeWidth="1" opacity="0.15" strokeDasharray="6 4">
                        <animate attributeName="stroke-dashoffset" values="0;-20" dur="2.5s" repeatCount="indefinite" />
                    </line>
                    <line x1="28%" y1="72%" x2="71%" y2="76%" stroke="#E31E24" strokeWidth="1" opacity="0.1" strokeDasharray="6 4">
                        <animate attributeName="stroke-dashoffset" values="0;-20" dur="3s" repeatCount="indefinite" />
                    </line>
                    <line x1="53%" y1="32%" x2="71%" y2="76%" stroke="#E31E24" strokeWidth="1" opacity="0.15" strokeDasharray="6 4">
                        <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
                    </line>
                </svg>

                {/* 🔺 Illuminati Easter Egg — Hidden clickable triangle center */}
                <div
                    className="absolute z-[2] cursor-pointer transition-all duration-500"
                    style={{ top: '60%', left: '50.7%', transform: 'translate(-50%, -50%)' }}
                    onClick={handleTriangleClick}
                    onMouseEnter={() => setTriangleHovered(true)}
                    onMouseLeave={() => setTriangleHovered(false)}
                    title=""
                >
                    <svg width="60" height="52" viewBox="0 0 60 52" className={`transition-all duration-500 ${triangleHovered ? 'opacity-40 scale-110' : 'opacity-0 scale-100'} ${illuminatiRevealed ? '!opacity-100 !scale-150' : ''}`}>
                        <polygon points="30,2 58,50 2,50" fill="none" stroke="#E31E24" strokeWidth="1.5" opacity="0.6" />
                        <polygon points="30,14 46,44 14,44" fill="none" stroke="#E31E24" strokeWidth="0.8" opacity="0.4" />
                        {/* Eye */}
                        <ellipse cx="30" cy="32" rx="8" ry="5" fill="none" stroke="#E31E24" strokeWidth="1" opacity="0.7" />
                        <circle cx="30" cy="32" r="2.5" fill="#E31E24" opacity="0.8" />
                    </svg>
                    {/* Glow effect on hover */}
                    {(triangleHovered || illuminatiRevealed) && (
                        <div className={`absolute inset-0 rounded-full blur-xl transition-opacity ${illuminatiRevealed ? 'bg-sz-red/30 animate-pulse' : 'bg-sz-red/10'}`} />
                    )}
                </div>

                {/* Illuminati reveal overlay */}
                {illuminatiRevealed && (
                    <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="text-center">
                            <Eye className="w-16 h-16 text-sz-red mx-auto mb-4 animate-pulse" />
                            <p className="font-orbitron text-xl text-sz-red font-bold tracking-[0.3em] uppercase">ILLUMINATI CONFIRMED</p>
                            <p className="text-gray-500 text-xs font-mono mt-2">REDIRECTING TO CLASSIFIED INTEL...</p>
                        </div>
                    </div>
                )}

                {/* Pins */}
                {mapPoints.map((point) => (
                    <div
                        key={point.id}
                        className="absolute flex flex-col items-center group/pin cursor-pointer z-10 -translate-x-1/2 -translate-y-1/2"
                        style={{ top: point.top, left: point.left }}
                        onClick={() => scrollToLocation(point.id)}
                        onMouseEnter={() => setHoveredPin(point.id)}
                        onMouseLeave={() => setHoveredPin(null)}
                    >
                        <div className="relative">
                            {/* Ping Effect */}
                            <div className={`absolute -inset-4 rounded-full blur-md transition-opacity animate-pulse ${hoveredPin === point.id ? 'opacity-100' : 'opacity-0'
                                } ${point.type === 'new' ? 'bg-blue-500/30' : 'bg-sz-red/20'}`}></div>

                            {/* Always-visible pulse ring */}
                            <div className={`absolute -inset-3 rounded-full border-2 animate-ping opacity-20 ${point.type === 'new' ? 'border-blue-400' : 'border-sz-red'
                                }`}></div>

                            {/* Pin Icon */}
                            <MapPin className={`w-8 h-8 drop-shadow-[0_0_5px_rgba(0,0,0,1)] transform transition-transform ${hoveredPin === point.id ? 'scale-125' : 'scale-100'
                                } ${point.type === 'new' ? 'text-blue-400' : 'text-sz-red'}`} />

                            {/* Badges */}
                            {point.type === 'hybrid' && (
                                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full p-0.5 border border-black shadow-lg animate-bounce" title="Private Zone">
                                    <Crown className="w-3 h-3" />
                                </div>
                            )}
                            {point.type === 'new' && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-0.5 border border-black shadow-lg animate-pulse" title="New">
                                    <Star className="w-3 h-3" />
                                </div>
                            )}
                        </div>

                        {/* Label */}
                        <div className={`mt-1 bg-black/80 backdrop-blur px-3 py-1 rounded border text-[10px] font-bold font-mono whitespace-nowrap transition-all flex items-center gap-2 ${hoveredPin === point.id
                            ? 'opacity-100 border-sz-red/50 shadow-[0_0_10px_rgba(227,30,36,0.2)]'
                            : 'opacity-80 border-white/10'
                            }`}>
                            {point.label}
                            {point.type === 'hybrid' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>}
                        </div>

                        {/* Hover Tooltip */}
                        <div className={`absolute top-full mt-10 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-xl border border-sz-red/30 rounded-sm p-3 min-w-[180px] shadow-2xl transition-all duration-200 z-50 ${hoveredPin === point.id
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 -translate-y-2 pointer-events-none'
                            }`}>
                            <div className="text-white font-bold text-xs mb-2 uppercase font-orbitron">{point.label}</div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-300">
                                    <Monitor className="w-3 h-3 text-sz-red flex-shrink-0" />
                                    <span>{point.pcs}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-300">
                                    <Zap className="w-3 h-3 text-sz-red flex-shrink-0" />
                                    <span>{point.specs}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-300">
                                    <Clock className="w-3 h-3 text-sz-red flex-shrink-0" />
                                    <span>{point.status}</span>
                                </div>
                            </div>
                            <div className="mt-2 text-[9px] text-sz-red font-mono uppercase tracking-wider text-center border-t border-white/10 pt-2">
                                {language === 'cs' ? '▼ Klikni pro detail' : '▼ Click for detail'}
                            </div>
                            {/* Arrow */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/95 border-l border-t border-sz-red/30 rotate-45"></div>
                        </div>
                    </div>
                ))}

                {/* Radar Sweep */}
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="w-[200%] h-[10px] bg-sz-red/10 absolute top-0 -left-[50%] rotate-45 animate-[pulse_4s_linear_infinite] blur-xl"></div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-6 text-xs text-gray-500 font-mono">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-sz-red rounded-full"></div> {language === 'cs' ? 'Veřejná zóna' : 'Public Zone'}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div> <Crown className="w-3 h-3 text-yellow-500" /> {language === 'cs' ? 'Privátní sektor (Bootcamp)' : 'Private Sector (Bootcamp)'}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div> <Star className="w-3 h-3 text-blue-400" /> {language === 'cs' ? 'Nová Lokace' : 'New Location'}
                </div>
            </div>
        </div>
    );
};

export default AllLocationsMap;
