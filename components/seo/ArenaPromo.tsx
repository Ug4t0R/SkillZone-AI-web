import React, { useEffect } from 'react';
import { ShieldAlert, Crosshair, Map, Zap, Target } from 'lucide-react';
import { AppView } from '../types';
import { trackView, trackClick, trackConversion } from '../../services/analytics';

interface ArenaPromoProps {
    onChangeView: (view: AppView) => void;
}

const ArenaPromo: React.FC<ArenaPromoProps> = ({ onChangeView }) => {
    useEffect(() => { trackView('arena'); }, []);

    const handleLocationClick = (zone: string, locationId: string) => {
        trackClick(`arena_zone_${zone}`, { destination: 'locations', zone });
        trackConversion('seo_landing_click', { page: 'arena', zone });
        onChangeView('locations');
        setTimeout(() => document.getElementById(locationId)?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    return (
        <section className="min-h-screen bg-black pt-24 pb-16 px-4 md:px-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Vizuální efekty pozadí */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sz-red/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sz-red/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-4xl w-full relative z-10 text-center flex flex-col items-center">
                <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-sz-red/10 rounded-full mb-6 border border-sz-red/20 animate-pulse-slow">
                    <Target className="w-8 h-8 sm:w-12 sm:h-12 text-sz-red" />
                </div>

                <div className="inline-block bg-sz-red text-white text-[10px] sm:text-xs font-bold px-3 py-1 uppercase tracking-widest rounded-sm mb-4 clip-angle">
                    SITREP: ARENA STATUS
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-orbitron font-black text-white uppercase tracking-tight mb-6 leading-tight">
                    Hledáš <span className="text-sz-red text-glow">Arénu?</span><br />
                    Máme rovnou <span className="text-white">celý trojúhelník.</span>
                </h1>

                <div className="w-24 h-1 bg-gradient-to-r from-sz-red/0 via-sz-red to-sz-red/0 mx-auto mb-8"></div>

                <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-sm shadow-2xl mb-12 max-w-3xl">
                    <p className="text-gray-300 text-lg sm:text-xl leading-relaxed font-sans mb-4">
                        Naše obří aréna sice padla v battle royale jménem Covid-19, ale my nesklopili zbraně.
                        Místo jedné obří arény z dob minulých jsme postavili rovnou <strong className="text-white">tři moderní herní základny</strong> rozeseté po Praze.
                    </p>
                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Místo zdlouhavého dojíždění do jednoho obchoďáku si vyber <span className="font-bold text-sz-red">SkillZone pobočku</span>, kterou máš nejblíž,
                        zasedni k RTX 4070 Ti, 240Hz monitoru s nulovým pingem na 10Gbps optice a hraj tam, kde hrají opravdoví gameři.
                    </p>
                </div>

                {/* Rozcestník lokalit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
                    <div className="group bg-black/40 border border-sz-red/30 p-6 rounded-sm hover:-translate-y-2 transition-all hover:shadow-[0_0_30px_rgba(227,30,36,0.2)] cursor-pointer flex flex-col items-center text-center"
                        onClick={() => handleLocationClick('zizkov', 'zizkov')}>
                        <Zap className="w-8 h-8 text-sz-red mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-orbitron font-bold text-xl uppercase mb-2">Žižkov<br />(Nonstop)</h3>
                        <p className="text-gray-500 font-mono text-xs uppercase mb-4">Základna 1 • Nonstop</p>
                        <span className="text-sz-red text-xs font-bold uppercase tracking-wider group-hover:underline">Vybrat Zónu 1 &rarr;</span>
                    </div>

                    <div className="group bg-black/40 border border-sz-red/30 p-6 rounded-sm hover:-translate-y-2 transition-all hover:shadow-[0_0_30px_rgba(227,30,36,0.2)] cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
                        onClick={() => handleLocationClick('haje', 'haje')}>
                        <div className="absolute top-0 right-0 bg-sz-red text-white text-[8px] font-bold uppercase py-0.5 px-6 transform rotate-45 translate-x-4 translate-y-2">Bootcamp</div>
                        <Crosshair className="w-8 h-8 text-sz-red mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-orbitron font-bold text-xl uppercase mb-2">Háje<br />(Metro)</h3>
                        <p className="text-gray-500 font-mono text-xs uppercase mb-4">Základna 2 • Bootcamp</p>
                        <span className="text-sz-red text-xs font-bold uppercase tracking-wider group-hover:underline">Vybrat Zónu 2 &rarr;</span>
                    </div>

                    <div className="group bg-black/40 border border-sz-red/30 p-6 rounded-sm hover:-translate-y-2 transition-all hover:shadow-[0_0_30px_rgba(227,30,36,0.2)] cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
                        onClick={() => handleLocationClick('stodulky', 'stodulky')}>
                        <div className="absolute top-0 right-0 bg-sz-red text-white text-[8px] font-bold uppercase py-0.5 px-6 transform rotate-45 translate-x-4 translate-y-2">Next-Gen</div>
                        <Map className="w-8 h-8 text-sz-red mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-orbitron font-bold text-xl uppercase mb-2">Stodůlky<br />(2025)</h3>
                        <p className="text-gray-500 font-mono text-xs uppercase mb-4">Základna 3 • Fresh</p>
                        <span className="text-sz-red text-xs font-bold uppercase tracking-wider group-hover:underline">Vybrat Zónu 3 &rarr;</span>
                    </div>
                </div>

                <div className="mt-12">
                    <button
                        onClick={() => onChangeView('home')}
                        className="text-gray-500 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors border-b border-transparent hover:border-white pb-1"
                    >
                        Zpět na domovskou stránku
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ArenaPromo;
