
import React, { useState } from 'react';
import { MapPin, Crown, Star, Clock, Monitor, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

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
    const { language } = useAppContext();

    const mapPoints: MapPoint[] = [
        {
            id: 'zizkov',
            label: language === 'cs' ? 'Žižkov (Nonstop)' : 'Žižkov (Nonstop)',
            top: '40%',
            left: '55%',
            type: 'public',
            specs: '240Hz, 10Gbps',
            status: 'NONSTOP 24/7',
            pcs: '29 PC'
        },
        {
            id: 'haje',
            label: language === 'cs' ? 'Háje / Bootcamp' : 'Háje / Bootcamp',
            top: '80%',
            left: '75%',
            type: 'hybrid',
            specs: '240Hz & 380Hz',
            status: '12:00 – 03:00+',
            pcs: '27 PC'
        },
        {
            id: 'stodulky',
            label: language === 'cs' ? 'Stodůlky (NOVÉ)' : 'Stodůlky (NEW)',
            top: '65%',
            left: '25%',
            type: 'new',
            specs: 'RTX 40 Series',
            status: '13:00 – 23:00',
            pcs: 'Next-Gen'
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

                    {/* Vltava River SVG */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 500" preserveAspectRatio="none">
                        <path d="M450,500 C450,400 480,350 500,300 C520,250 500,200 480,150 C460,100 480,50 500,0" fill="none" stroke="#1a1a1a" strokeWidth="80" className="blur-xl" />
                        <path d="M450,500 C450,400 480,350 500,300 C520,250 500,200 480,150 C460,100 480,50 500,0" fill="none" stroke="#3a5a80" strokeWidth="20" opacity="0.5" />
                    </svg>
                </div>

                {/* Connection Lines between locations */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]" preserveAspectRatio="none">
                    <line x1="55%" y1="40%" x2="75%" y2="80%" stroke="#E31E24" strokeWidth="1" opacity="0.15" strokeDasharray="6 4">
                        <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
                    </line>
                    <line x1="55%" y1="40%" x2="25%" y2="65%" stroke="#E31E24" strokeWidth="1" opacity="0.15" strokeDasharray="6 4">
                        <animate attributeName="stroke-dashoffset" values="0;-20" dur="2.5s" repeatCount="indefinite" />
                    </line>
                    <line x1="25%" y1="65%" x2="75%" y2="80%" stroke="#E31E24" strokeWidth="1" opacity="0.1" strokeDasharray="6 4">
                        <animate attributeName="stroke-dashoffset" values="0;-20" dur="3s" repeatCount="indefinite" />
                    </line>
                </svg>

                {/* Pins */}
                {mapPoints.map((point) => (
                    <div
                        key={point.id}
                        className="absolute flex flex-col items-center group/pin cursor-pointer z-10"
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
