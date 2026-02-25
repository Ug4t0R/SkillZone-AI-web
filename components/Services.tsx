
import React from 'react';
import { Server, Video, Trophy, ArrowRight } from 'lucide-react';
import { SERVICES_DATA_CS, SERVICES_DATA_EN } from '../data/services';
import { useAppContext } from '../context/AppContext';
import { useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';

const Services: React.FC = () => {
    const { language, t } = useAppContext();
    const headingRef = useScrollReveal<HTMLDivElement>();
    const cardsRef = useStaggerReveal<HTMLDivElement>({ staggerDelay: 120 });

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'server': return <Server className="w-10 h-10 text-sz-red" />;
            case 'video': return <Video className="w-10 h-10 text-sz-red" />;
            case 'trophy': return <Trophy className="w-10 h-10 text-sz-red" />;
            default: return <Server className="w-10 h-10 text-sz-red" />;
        }
    };

    const servicesData = language === 'cs' ? SERVICES_DATA_CS : SERVICES_DATA_EN;

    return (
        <section id="services" className="py-24 bg-white dark:bg-card-bg relative overflow-hidden transition-colors duration-300">
            {/* Background tech pattern */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-sz-red/5 skew-x-12 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div ref={headingRef} className="scroll-reveal sr-glitch flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-1 bg-sz-red"></div>
                            <span className="text-sz-red font-mono text-sm uppercase tracking-widest font-bold">B2B & Events</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-orbitron font-black text-gray-900 dark:text-white uppercase">
                            {t('serv_title')}
                        </h2>
                    </div>
                    <div className="max-w-md text-gray-600 dark:text-gray-400 text-right hidden md:block">
                        <p>{t('serv_subtitle')}</p>
                    </div>
                </div>

                <div ref={cardsRef} className="sr-stagger scroll-reveal grid grid-cols-1 md:grid-cols-3 gap-8">
                    {servicesData.map((service, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-white/5 p-8 hover:border-sz-red/50 transition-all group flex flex-col shadow-lg dark:shadow-none">
                            <div className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-full w-fit border border-gray-200 dark:border-white/5 group-hover:scale-110 transition-transform">
                                {getIcon(service.icon)}
                            </div>
                            <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-4 uppercase">{service.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8 flex-1">
                                {service.desc}
                            </p>
                            <a
                                href="mailto:info@skillzone.cz"
                                className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold uppercase text-sm tracking-wider hover:text-sz-red dark:hover:text-sz-red transition-colors"
                            >
                                {t('serv_btn')} <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
