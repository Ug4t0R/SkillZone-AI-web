import React, { useEffect } from 'react';
import { Crown, Trophy, Crosshair, Zap, MousePointer2 } from 'lucide-react';
import { AppView } from '../types';
import { trackView, trackClick, trackConversion } from '../../services/analytics';

interface MvpPromoProps {
    onChangeView: (view: AppView) => void;
}

const MvpPromo: React.FC<MvpPromoProps> = ({ onChangeView }) => {
    useEffect(() => { trackView('mvp'); }, []);

    return (
        <section className="min-h-screen bg-black pt-24 pb-16 px-4 md:px-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Vizuální efekty pozadí */}
            <div className="absolute inset-0 bg-blue-900/5 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-4xl w-full relative z-10 text-center flex flex-col items-center">
                <div className="relative mb-8">
                    <Crown className="w-16 h-16 sm:w-24 sm:h-24 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-[bounce_3s_ease-in-out_infinite]" />
                    <div className="absolute -inset-4 border-2 border-yellow-500/30 rounded-full animate-[spin_10s_linear_infinite] border-dashed"></div>
                </div>

                <div className="inline-block bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1 uppercase tracking-widest rounded-sm mb-4 clip-angle">
                    PERFORMANCE CHECK
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-orbitron font-black text-white uppercase tracking-tight mb-6 leading-tight">
                    Chceš být <span className="text-yellow-500 text-glow-yellow">MVP?</span><br />
                    Trénuj jako <span className="text-blue-500">profík.</span>
                </h1>

                <div className="w-24 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 mx-auto mb-8"></div>

                <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-sm shadow-[0_0_50px_rgba(59,130,246,0.1)] mb-12 max-w-3xl">
                    <p className="text-gray-300 text-lg sm:text-xl leading-relaxed font-sans mb-4">
                        Titul MVP nezískáš se sekaným obrazem a vysokým pingem. Výhra se rodí tam, kde
                        žádný lag nestojí v cestě tvojí mušce.
                    </p>
                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Zastav se do <span className="font-bold text-sz-red">SkillZone</span>, zasedni k RTX 4070 Ti, zapni esportový 240Hz/380Hz monitor
                        s 10Gbps optikou a ukaž všem, kdo zatahá příští hru. Vytvořili jsme zázemí pro ty, kdo chtějí stoupat v ladderu a nehledají výmluvy.
                    </p>
                </div>

                {/* Akční prvky */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-yellow-500/30 p-6 flex flex-col items-center justify-center text-center rounded-sm group hover:border-yellow-500 transition-colors">
                        <Trophy className="w-10 h-10 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
                        <h4 className="text-white font-bold uppercase mb-1">Esport Zóna</h4>
                        <p className="text-gray-500 text-xs font-mono uppercase">240Hz+ panely a profi periferie</p>
                    </div>

                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-blue-500/30 p-6 flex flex-col items-center justify-center text-center rounded-sm group hover:border-blue-500 transition-colors">
                        <MousePointer2 className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                        <h4 className="text-white font-bold uppercase mb-1">0 Ping, 100% Skill</h4>
                        <p className="text-gray-500 text-xs font-mono uppercase">Vyladěná 10Gbps síť</p>
                    </div>
                </div>

                <button
                    onClick={() => { trackClick('mvp_cta_booking', { destination: 'booking' }); trackConversion('seo_landing_click', { page: 'mvp', action: 'book' }); onChangeView('booking'); window.scrollTo(0, 0); }}
                    className="bg-sz-red hover:bg-sz-red-dark text-white font-orbitron font-bold uppercase tracking-widest px-10 py-5 text-lg transition-all shadow-[0_0_20px_rgba(227,30,36,0.3)] hover:shadow-[0_0_40px_rgba(227,30,36,0.6)] clip-angle flex items-center gap-3 group"
                >
                    <Crosshair className="w-6 h-6 group-hover:scale-125 transition-transform" />
                    Jdu si pro titul MVP
                </button>

                <div className="mt-12">
                    <button
                        onClick={() => onChangeView('home')}
                        className="text-gray-600 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors border-b border-transparent hover:border-white pb-1"
                    >
                        Přejít na standardní web &rarr;
                    </button>
                </div>
            </div>
        </section>
    );
};

export default MvpPromo;
