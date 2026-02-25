
import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Skull } from 'lucide-react';
import { WHY_US_DATA_CS, WHY_US_DATA_EN } from '../data/whyUs';
import { useAppContext } from '../context/AppContext';

const WhyUs: React.FC = () => {
    const [reveal, setReveal] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);
    const { language, t, theme } = useAppContext();
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setReveal(true);
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const whyUsData = language === 'cs' ? WHY_US_DATA_CS : WHY_US_DATA_EN;
    const logoSrc = theme === 'dark' ? '/SkillZone_logo_white.png' : '/SkillZone_logo_red.png';

    return (
        <section id="why-us" ref={sectionRef} className="py-24 bg-light-bg dark:bg-dark-bg relative overflow-hidden transition-colors duration-300">
            {/* Decorative grunge background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5"></div>

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-orbitron font-black mb-4 uppercase text-gray-900 dark:text-white">
                        {t('why_title')} <span className="text-sz-red">{t('why_title_sub')}</span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                        {t('why_desc')}
                    </p>
                </div>

                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-1000 transform ${reveal ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>

                    {/* The Others Side */}
                    <div className="bg-white/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-8 rounded-sm grayscale opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-center mb-8 gap-3">
                            <Skull className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            <h3 className="text-2xl font-orbitron font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('why_others')}</h3>
                        </div>
                        <div className="space-y-6">
                            {whyUsData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 pb-4 last:border-0">
                                    <span className="text-gray-500 font-bold uppercase w-1/3 text-sm">{item.aspect}</span>
                                    <div className="flex items-center gap-3 w-2/3 justify-end text-right">
                                        <span className="text-gray-600 dark:text-gray-400 text-sm">{item.others}</span>
                                        <X className="w-5 h-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SkillZone Side */}
                    <div className="bg-white dark:bg-zinc-900/80 border border-sz-red/30 p-8 rounded-sm shadow-[0_0_30px_rgba(227,30,36,0.15)] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sz-red to-sz-red-dark"></div>
                        <div className="absolute -right-20 -top-20 w-60 h-60 bg-sz-red/10 rounded-full blur-[80px] group-hover:bg-sz-red/20 transition-colors"></div>

                        <div className="flex items-center justify-center mb-8 gap-3">
                            {!logoError ? (
                                <img
                                    src={logoSrc}
                                    alt="SZ"
                                    loading="lazy"
                                    className="h-8 w-auto"
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <img
                                    src="/SkillZone_logo_white.png"
                                    alt="SZ"
                                    loading="lazy"
                                    className="h-8 w-auto"
                                />
                            )}
                        </div>
                        <div className="space-y-6 relative z-10">
                            {whyUsData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-sz-red/10 pb-4 last:border-0">
                                    <span className="text-gray-700 dark:text-gray-400 font-bold uppercase w-1/3 text-sm">{item.aspect}</span>
                                    <div className="flex items-center gap-3 w-2/3 justify-end text-right">
                                        <span className="text-gray-900 dark:text-white font-bold text-sm text-glow">{item.skillzone}</span>
                                        <div className="bg-sz-red rounded-full p-0.5">
                                            <Check className="w-4 h-4 text-white flex-shrink-0" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default WhyUs;
