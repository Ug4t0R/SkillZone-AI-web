
import React, { useState, useEffect } from 'react';
import { Shield, Sword, Crown, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getOwnerProfile } from '../utils/devTools';
import { OwnerProfileData } from '../types';
import { DEFAULT_OWNER_PROFILE_CS } from '../data/ownerProfile';
import { useScrollReveal } from '../hooks/useScrollReveal';

const OwnerProfile: React.FC = () => {
    const { t, language } = useAppContext();
    const [profile, setProfile] = useState<OwnerProfileData>(DEFAULT_OWNER_PROFILE_CS);
    const headingRef = useScrollReveal<HTMLDivElement>();
    const cardRef = useScrollReveal<HTMLDivElement>();

    useEffect(() => {
        getOwnerProfile(language === 'en' ? 'en' : 'cs').then(setProfile);
    }, [language]);

    return (
        <section className="py-20 bg-dark-bg relative overflow-hidden border-t border-white/5">
            <div className="max-w-5xl mx-auto px-4">

                {/* Header */}
                <div ref={headingRef} className="scroll-reveal sr-glitch text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-orbitron font-black text-white uppercase tracking-tighter">
                        {t('owner_title')}
                    </h2>
                    <div className="h-1 w-20 bg-sz-red mx-auto mt-4 rounded-full"></div>
                </div>

                <div ref={cardRef} className="scroll-reveal sr-scale bg-zinc-900/50 border border-sz-red/30 rounded-lg p-6 md:p-10 flex flex-col md:flex-row items-center gap-10 md:gap-16 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group">

                    {/* Background Glitch Effect */}
                    <div className="absolute inset-0 bg-sz-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay"></div>

                    {/* Left: Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 relative z-10">
                            {/* Decorative Frame */}
                            <div className="absolute inset-0 border-2 border-sz-red rounded-full animate-pulse-slow"></div>
                            <div className="absolute -inset-2 border border-white/10 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>

                            {/* Image */}
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-black shadow-2xl relative">
                                <img
                                    src={profile.imgUrl}
                                    alt={profile.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/111/E31E24?text=Boss'; }}
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            </div>

                            {/* Level Badge */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black text-sz-red border border-sz-red px-3 py-1 font-orbitron font-bold text-sm rounded shadow-lg whitespace-nowrap z-20">
                                LVL 40+
                            </div>
                        </div>
                    </div>

                    {/* Right: Stats & Bio */}
                    <div className="text-center md:text-left relative z-10">
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-orbitron font-black text-white mb-2 uppercase flex items-center justify-center md:justify-start gap-2 sm:gap-3 flex-wrap">
                            {profile.name.split(' ')[0]} <span className="text-sz-red text-glow">"{profile.nickname}"</span> {profile.name.split(' ').slice(1).join(' ')}
                        </h3>
                        <p className="text-gray-500 font-mono uppercase tracking-widest text-xs sm:text-sm mb-4 sm:mb-6 flex items-center justify-center md:justify-start gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" /> {profile.role}
                        </p>

                        <div className="bg-black/40 p-6 rounded border-l-2 border-sz-red mb-8">
                            <p className="text-gray-300 leading-relaxed italic">
                                "{profile.bio}"
                            </p>
                        </div>

                        {/* RPG Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-black/60 p-3 rounded border border-white/5 flex flex-col items-center">
                                <span className="text-sz-red mb-1"><Zap className="w-4 h-4" /></span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">XP / Grind</span>
                                <span className="text-white font-orbitron font-bold text-sm">{profile.stats.xp}</span>
                            </div>
                            <div className="bg-black/60 p-3 rounded border border-white/5 flex flex-col items-center">
                                <span className="text-blue-400 mb-1"><Shield className="w-4 h-4" /></span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Class</span>
                                <span className="text-white font-orbitron font-bold text-sm">{profile.stats.class}</span>
                            </div>
                            <div className="bg-black/60 p-3 rounded border border-white/5 flex flex-col items-center">
                                <span className="text-yellow-500 mb-1"><Sword className="w-4 h-4" /></span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Ulti</span>
                                <span className="text-white font-orbitron font-bold text-sm">{profile.stats.ulti}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default OwnerProfile;
