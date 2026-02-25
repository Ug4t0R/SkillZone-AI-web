
import React from 'react';
import { Cpu, Network, Monitor, Mouse } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';

const TechSpecs: React.FC = () => {
    const { t } = useAppContext();
    const headingRef = useScrollReveal<HTMLDivElement>();
    const cardsRef = useStaggerReveal<HTMLDivElement>({ staggerDelay: 100 });

    return (
        <section id="tech" className="py-24 bg-light-bg dark:bg-card-bg border-y border-gray-200 dark:border-white/5 relative transition-colors duration-300">
            {/* Decorative Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-sz-red to-transparent opacity-50"></div>

            <div className="max-w-7xl mx-auto px-4">
                <div ref={headingRef} className="scroll-reveal sr-glitch flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-orbitron font-black mb-4 uppercase italic text-gray-900 dark:text-white">
                            {t('tech_title')} <span className="text-sz-red">{t('tech_title_sub')}</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl">
                            {t('tech_desc')}
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-sz-red font-mono text-sm opacity-70">{t('tech_status')}</div>
                        <div className="text-gray-500 dark:text-gray-600 font-mono text-xs">{t('tech_fps')}</div>
                    </div>
                </div>

                <div ref={cardsRef} className="sr-stagger scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1 */}
                    <div className="bg-white dark:bg-dark-bg border border-gray-200 dark:border-white/5 p-8 hover:border-sz-red/40 transition-all group relative overflow-hidden shadow-lg dark:shadow-none">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-sz-red/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <Network className="w-10 h-10 text-gray-500 group-hover:text-sz-red mb-6 transition-colors" />
                        <h3 className="text-xl font-bold font-orbitron mb-2 text-gray-800 dark:text-gray-200">{t('tech_conn')}</h3>
                        <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{t('tech_conn_val')}</div>
                        <p className="text-gray-600 dark:text-gray-500 text-sm">
                            {t('tech_conn_desc')}
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white dark:bg-dark-bg border border-gray-200 dark:border-white/5 p-8 hover:border-sz-red/40 transition-all group relative overflow-hidden shadow-lg dark:shadow-none">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-sz-red/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <Monitor className="w-10 h-10 text-gray-500 group-hover:text-sz-red mb-6 transition-colors" />
                        <h3 className="text-xl font-bold font-orbitron mb-2 text-gray-800 dark:text-gray-200">{t('tech_disp')}</h3>
                        <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{t('tech_disp_val')}</div>
                        <p className="text-gray-600 dark:text-gray-500 text-sm">{t('tech_disp_desc')}</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white dark:bg-dark-bg border border-gray-200 dark:border-white/5 p-8 hover:border-sz-red/40 transition-all group relative overflow-hidden shadow-lg dark:shadow-none">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-sz-red/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <Cpu className="w-10 h-10 text-gray-500 group-hover:text-sz-red mb-6 transition-colors" />
                        <h3 className="text-xl font-bold font-orbitron mb-2 text-gray-800 dark:text-gray-200">{t('tech_conf')}</h3>
                        <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{t('tech_conf_val')}</div>
                        <p className="text-gray-600 dark:text-gray-500 text-sm">{t('tech_conf_desc')}</p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white dark:bg-dark-bg border border-gray-200 dark:border-white/5 p-8 hover:border-sz-red/40 transition-all group relative overflow-hidden shadow-lg dark:shadow-none">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-sz-red/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <Mouse className="w-10 h-10 text-gray-500 group-hover:text-sz-red mb-6 transition-colors" />
                        <h3 className="text-xl font-bold font-orbitron mb-2 text-gray-800 dark:text-gray-200">{t('tech_gear')}</h3>
                        <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{t('tech_gear_val')}</div>
                        <p className="text-gray-600 dark:text-gray-500 text-sm">{t('tech_gear_desc')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TechSpecs;
