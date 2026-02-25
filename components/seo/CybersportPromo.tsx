import React, { useEffect } from 'react';
import { Users, Swords, Gamepad2, ShieldAlert } from 'lucide-react';
import { AppView } from '../types';
import { trackView, trackClick, trackConversion } from '../../services/analytics';

interface CybersportPromoProps {
    onChangeView: (view: AppView) => void;
}

const CybersportPromo: React.FC<CybersportPromoProps> = ({ onChangeView }) => {
    useEffect(() => { trackView('cybersport'); }, []);

    return (
        <section className="min-h-screen bg-black pt-24 pb-16 px-4 md:px-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Vizuální efekty pozadí */}
            <div className="absolute inset-0 bg-sz-red/5 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30"></div>
            </div>

            <div className="absolute top-0 right-0 w-1/2 h-screen bg-gradient-to-l from-sz-red/10 to-transparent pointer-events-none blur-[100px]"></div>

            <div className="max-w-4xl w-full relative z-10 text-center flex flex-col items-center">
                <div className="flex justify-center gap-4 mb-8">
                    <div className="p-4 bg-zinc-900/80 border border-sz-red/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }}>
                        <Swords className="w-8 h-8 text-sz-red" />
                    </div>
                </div>

                <div className="inline-block bg-white text-black text-[10px] sm:text-xs font-bold px-3 py-1 uppercase tracking-widest rounded-sm mb-4 clip-angle">
                    TEAM OPERATION
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-orbitron font-black text-white uppercase tracking-tight mb-6 leading-tight">
                    Pravý <span className="text-sz-red text-glow">cybersport</span><br />
                    se hraje <span className="text-gray-400">spolu.</span>
                </h1>

                <div className="w-24 h-1 bg-gradient-to-r from-sz-red/0 via-white to-sz-red/0 mx-auto mb-8"></div>

                <div className="bg-gradient-to-b from-zinc-900/80 to-black/80 backdrop-blur-md border border-sz-red/20 p-6 sm:p-8 rounded-sm shadow-2xl mb-12 max-w-3xl">
                    <p className="text-gray-300 text-lg sm:text-xl leading-relaxed font-sans mb-4">
                        Ať už říkáš e-sport nebo cybersport, vždycky šlo hlavně o to jedno: změřit síly v týmu, překonat soupeře a urvat výhru.
                    </p>
                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Nespoléhej na náhodný matchmaking s toxic randomáky. Skládej tým a přijďte trénovat do našeho
                        <span className="font-bold text-sz-red"> privátního Bootcampu ve SkillZone Háje</span>.
                        Čeká vás vlastní místnost, nekompromisní stroje a absolutní klid na taktickou přípravu.
                    </p>
                </div>

                {/* Bootcamp Highlights */}
                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl mb-12">
                    <div className="flex-1 bg-black/60 border-l-2 border-sz-red p-6 text-left group hover:bg-sz-red/5 transition-colors">
                        <Users className="w-6 h-6 text-sz-red mb-3 group-hover:scale-110 transition-transform" />
                        <h4 className="text-white font-bold uppercase mb-2">Privátní Bootcamp</h4>
                        <p className="text-gray-500 text-sm">Vlastní vchod, soukromí pro celý tým. Ideální pro lanky a tréninky před turnajem.</p>
                    </div>

                    <div className="flex-1 bg-black/60 border-l-2 border-white p-6 text-left group hover:bg-white/5 transition-colors">
                        <Gamepad2 className="w-6 h-6 text-white mb-3 group-hover:scale-110 transition-transform" />
                        <h4 className="text-white font-bold uppercase mb-2">Komunita</h4>
                        <p className="text-gray-500 text-sm">SkillZone není jen herna, je to basecamp české herní komunity už od roku 2005.</p>
                    </div>
                </div>

                <button
                    onClick={() => { trackClick('cybersport_cta_bootcamp', { destination: 'locations' }); trackConversion('seo_landing_click', { page: 'cybersport', action: 'bootcamp' }); onChangeView('locations'); setTimeout(() => document.getElementById('haje')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                    className="bg-sz-red hover:bg-sz-red-dark text-white font-orbitron font-bold uppercase tracking-widest px-10 py-5 text-lg transition-all shadow-[0_0_20px_rgba(227,30,36,0.3)] hover:shadow-[0_0_40px_rgba(227,30,36,0.6)] clip-angle flex items-center gap-3"
                >
                    <ShieldAlert className="w-6 h-6" />
                    Chci s týmem na Bootcamp
                </button>

                <div className="mt-12">
                    <button
                        onClick={() => onChangeView('home')}
                        className="text-gray-600 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors border-b border-transparent hover:border-white pb-1"
                    >
                        Prozkoumat všechny pobočky
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CybersportPromo;
