
import React, { useState } from 'react';
import { Crosshair, Navigation, Info, Eye, EyeOff, Layers } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const InteractiveMap: React.FC = () => {
    const [isCyberMode, setIsCyberMode] = useState(true);
    const { t } = useAppContext();
    
    // Using the specific Google My Map provided
    const mapSrc = "https://www.google.com/maps/d/embed?mid=1L1uUQ8RebSuAF-Ef2fi9slFRlXUrACo&ehbc=2E312F";

    return (
        <div className="w-full bg-zinc-900 border-2 border-sz-red/50 p-1 rounded-sm relative overflow-hidden shadow-[0_0_30px_rgba(227,30,36,0.2)] group h-[500px] md:h-[600px]">
            
            {/* HUD Overlay Top */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/80 to-transparent z-10 pointer-events-none flex justify-between items-start p-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isCyberMode ? 'bg-sz-red' : 'bg-green-500'}`}></div>
                    <span className={`font-mono text-xs font-bold tracking-widest ${isCyberMode ? 'text-sz-red' : 'text-green-500'}`}>
                        {isCyberMode ? 'CYBER_GRID_ONLINE' : 'SATELLITE_FEED_LIVE'}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-sz-red font-mono text-xs tracking-widest opacity-70">
                        PRAGUE_SECURE_GRID
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">
                        LOCATIONS: ALL
                    </div>
                </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-sz-red z-20 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sz-red z-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sz-red z-20 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-sz-red z-20 pointer-events-none"></div>

            {/* Center Crosshair (Decorative) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sz-red/30 pointer-events-none z-10">
                <Crosshair className="w-24 h-24 stroke-1" />
            </div>

            {/* The Map Iframe */}
            <div className="relative w-full h-full bg-zinc-900 transition-all duration-700 overflow-hidden">
                {/* 
                    NOTE: Google My Maps embeds have a header bar. 
                    We use negative margin (-mt-[60px]) and increased height to hide it for a cleaner "Cyber" look.
                */}
                <iframe 
                    src={mapSrc}
                    width="100%" 
                    height="120%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="SkillZone Network Map"
                    className={`transition-all duration-700 w-full -mt-[60px] ${isCyberMode ? 'filter grayscale invert contrast-[1.2] brightness-90 hue-rotate-180' : ''}`}
                ></iframe>

                {/* Cyber Tint Overlay */}
                {isCyberMode && (
                    <div className="absolute inset-0 bg-sz-red/10 mix-blend-multiply pointer-events-none z-[5]"></div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute top-20 right-4 z-30 flex flex-col gap-2">
                <button 
                    onClick={() => setIsCyberMode(!isCyberMode)}
                    className="bg-black/80 text-white p-2 rounded border border-sz-red/50 hover:bg-sz-red hover:border-white transition-all group/btn shadow-lg"
                    title={isCyberMode ? "Switch to Real View" : "Switch to Cyber View"}
                >
                    {isCyberMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
            </div>

            {/* HUD Overlay Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-between px-4 border-t border-white/10 pointer-events-none">
                 <div className="flex gap-4 text-[10px] font-mono text-gray-400">
                    <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> NETWORK STATUS: ACTIVE</span>
                 </div>
                 <div className="flex items-center gap-2 text-sz-red text-[10px] font-bold uppercase tracking-wider">
                    <Layers className="w-3 h-3" />
                    Google MyMaps Layer
                 </div>
            </div>
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>
        </div>
    );
};

export default InteractiveMap;
