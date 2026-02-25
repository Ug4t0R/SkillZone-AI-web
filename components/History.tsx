
import React, { useState, useEffect } from 'react';
import { HISTORY_SHORT_CS, HISTORY_SHORT_EN, HISTORY_LONG_CS, HISTORY_LONG_EN } from '../data/history';
import { History, Maximize2, Minimize2, Filter, Circle } from 'lucide-react';
import { getMergedHistory } from '../utils/devTools';
import { HistoryMilestone } from '../types';
import { useAppContext } from '../context/AppContext';

const HistorySection: React.FC = () => {
    const [viewMode, setViewMode] = useState<'short' | 'long'>('short');
    const [filter, setFilter] = useState<string>('all');
    const [combinedData, setCombinedData] = useState<HistoryMilestone[]>([]);
    const { language, t } = useAppContext();
    const [logoError, setLogoError] = useState(false);

    // Merge hardcoded history with custom/edited events
    useEffect(() => {
        const shortData = language === 'cs' ? HISTORY_SHORT_CS : HISTORY_SHORT_EN;
        const longData = language === 'cs' ? HISTORY_LONG_CS : HISTORY_LONG_EN;
        const baseData = viewMode === 'short' ? shortData : longData;

        // Use the merge function to handle overrides and additions
        getMergedHistory(baseData).then(setCombinedData);
    }, [viewMode, filter, language]);

    const filteredData = filter === 'all' ? combinedData : combinedData.filter(item => item.category === filter);

    return (
        <section id="history" className="py-24 bg-light-bg dark:bg-dark-bg relative overflow-hidden transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center justify-center p-3 bg-sz-red/10 rounded-full mb-4 border border-sz-red/20">
                        <History className="w-8 h-8 text-sz-red animate-pulse-slow" />
                    </div>
                    <h2 className="text-5xl md:text-7xl font-orbitron font-black mb-6 uppercase tracking-tight text-gray-900 dark:text-white">
                        {t('hist_title')} <span className="text-sz-red text-glow">{t('hist_title_sub')}</span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xl max-w-2xl mx-auto mb-10">
                        {t('hist_desc')}
                    </p>

                    {/* Controls Panel */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        {/* Mode Toggle */}
                        <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-md border border-gray-200 dark:border-white/10 flex shadow-lg">
                            <button
                                onClick={() => setViewMode('short')}
                                className={`px-6 py-2 text-sm font-bold uppercase transition-all rounded-sm flex items-center gap-2 ${viewMode === 'short' ? 'bg-sz-red text-white shadow-md' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                            >
                                <Minimize2 className="w-4 h-4" /> {t('hist_mode_short')}
                            </button>
                            <button
                                onClick={() => setViewMode('long')}
                                className={`px-6 py-2 text-sm font-bold uppercase transition-all rounded-sm flex items-center gap-2 ${viewMode === 'long' ? 'bg-sz-red text-white shadow-md' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                            >
                                <Maximize2 className="w-4 h-4" /> {t('hist_mode_long')}
                            </button>
                        </div>

                        {/* Category Filter */}
                        {viewMode === 'long' && (
                            <div className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 p-2 rounded-md border border-gray-200 dark:border-white/5 overflow-x-auto max-w-full">
                                <Filter className="w-4 h-4 text-gray-600 ml-2" />
                                {['all', 'business', 'community', 'tech', 'expansion'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${filter === cat ? 'text-sz-red bg-sz-red/10 border border-sz-red/30' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                                    >
                                        {cat === 'all' ? 'Vše' : cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline Container */}
                <div className="relative py-10">

                    {/* Central Ribbon Axis */}
                    <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[2px] bg-sz-red/30 md:transform md:-translate-x-1/2 z-0"></div>

                    <div className="space-y-16 md:space-y-24">
                        {filteredData.map((milestone, index) => {
                            const isEven = index % 2 === 0;

                            return (
                                <div key={milestone.id} className="relative flex flex-col md:flex-row items-center w-full group">

                                    {/* Center Year Badge (Absolute positioned on desktop) */}
                                    <div className="absolute left-6 md:left-1/2 transform -translate-x-1/2 md:-translate-x-1/2 z-20 flex flex-col items-center justify-center">
                                        <div className="bg-black border-2 border-sz-red text-white font-orbitron font-black text-sm md:text-lg px-3 py-1 rounded shadow-[0_0_15px_rgba(227,30,36,0.6)] group-hover:scale-110 group-hover:bg-sz-red transition-all duration-300 relative whitespace-nowrap">
                                            {milestone.year}
                                            {milestone.isCustom && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Custom/Edited Event"></span>}
                                        </div>
                                    </div>

                                    {/* LEFT SIDE CONTENT */}
                                    <div className={`w-full md:w-1/2 pl-16 md:pl-0 md:pr-12 ${isEven ? 'md:text-right order-2 md:order-1' : 'md:text-right order-2 md:order-1'}`}>
                                        {isEven ? (
                                            // EVEN: Text on Left (Desktop), Image Below (Mobile handled by order)
                                            // Actually let's do: Even = Image Left, Text Right. Odd = Text Left, Image Right.
                                            // REVISING: 
                                            // Even Index: Image (Left) | Year | Text (Right)
                                            // Odd Index:  Text (Left)  | Year | Image (Right)

                                            /* IMAGE COMPONENT (Left Side for Even) */
                                            <div className="hidden md:block group-hover:-translate-y-2 transition-transform duration-500 relative">
                                                <div className="h-64 w-full overflow-hidden rounded-sm border border-gray-200 dark:border-white/10 relative shadow-xl">
                                                    <img
                                                        src={milestone.imgUrl || 'https://placehold.co/600x400/111/E31E24?text=No+Image'}
                                                        alt={milestone.title}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/111/E31E24?text=SkillZone+History'; }}
                                                    />
                                                    {/* Connector Line */}
                                                    <div className="absolute top-1/2 right-[-48px] w-[48px] h-[1px] bg-sz-red/30 group-hover:bg-sz-red transition-colors"></div>
                                                    <div className="absolute top-1/2 right-[-4px] w-2 h-2 bg-sz-red rounded-full"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* TEXT COMPONENT (Left Side for Odd) */
                                            <div className="group-hover:-translate-y-1 transition-transform duration-300 relative">
                                                <div className="bg-white/80 dark:bg-black/40 backdrop-blur-sm p-6 rounded-sm border border-gray-200 dark:border-white/10 hover:border-sz-red/50 transition-colors shadow-lg">
                                                    <span className="text-sz-red font-mono text-xs uppercase tracking-widest mb-2 block">{milestone.category}</span>
                                                    <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-3 uppercase">{milestone.title}</h3>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{milestone.description}</p>
                                                </div>
                                                {/* Connector Line (Desktop Only) */}
                                                <div className="hidden md:block absolute top-1/2 right-[-48px] w-[48px] h-[1px] bg-sz-red/30 group-hover:bg-sz-red transition-colors"></div>
                                                <div className="hidden md:block absolute top-1/2 right-[-4px] w-2 h-2 bg-sz-red rounded-full"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT SIDE CONTENT */}
                                    <div className={`w-full md:w-1/2 pl-16 md:pl-12 ${isEven ? 'md:text-left order-3' : 'md:text-left order-3'}`}>
                                        {isEven ? (
                                            /* TEXT COMPONENT (Right Side for Even) */
                                            <div className="group-hover:-translate-y-1 transition-transform duration-300 relative mt-4 md:mt-0">
                                                <div className="bg-white/80 dark:bg-black/40 backdrop-blur-sm p-6 rounded-sm border border-gray-200 dark:border-white/10 hover:border-sz-red/50 transition-colors shadow-lg">
                                                    <span className="text-sz-red font-mono text-xs uppercase tracking-widest mb-2 block">{milestone.category}</span>
                                                    <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-3 uppercase">{milestone.title}</h3>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{milestone.description}</p>
                                                </div>
                                                {/* Connector Line (Desktop Only) */}
                                                <div className="hidden md:block absolute top-1/2 left-[-48px] w-[48px] h-[1px] bg-sz-red/30 group-hover:bg-sz-red transition-colors"></div>
                                                <div className="hidden md:block absolute top-1/2 left-[-4px] w-2 h-2 bg-sz-red rounded-full"></div>
                                            </div>
                                        ) : (
                                            /* IMAGE COMPONENT (Right Side for Odd) */
                                            <div className="hidden md:block group-hover:-translate-y-2 transition-transform duration-500 relative">
                                                <div className="h-64 w-full overflow-hidden rounded-sm border border-gray-200 dark:border-white/10 relative shadow-xl">
                                                    <img
                                                        src={milestone.imgUrl || 'https://placehold.co/600x400/111/E31E24?text=No+Image'}
                                                        alt={milestone.title}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/111/E31E24?text=SkillZone+History'; }}
                                                    />
                                                    {/* Connector Line */}
                                                    <div className="absolute top-1/2 left-[-48px] w-[48px] h-[1px] bg-sz-red/30 group-hover:bg-sz-red transition-colors"></div>
                                                    <div className="absolute top-1/2 left-[-4px] w-2 h-2 bg-sz-red rounded-full"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* MOBILE IMAGE (Always visible below year on mobile, hidden on desktop) */}
                                    <div className="md:hidden pl-16 w-full mb-4 order-1 mt-8">
                                        <div className="h-48 w-full overflow-hidden rounded-sm border border-gray-200 dark:border-white/10 shadow-lg">
                                            <img
                                                src={milestone.imgUrl || 'https://placehold.co/600x400/111/E31E24?text=No+Image'}
                                                alt={milestone.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/111/E31E24?text=SkillZone+History'; }}
                                            />
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>

                    {/* Ribbon End Logo */}
                    <div className="absolute bottom-[-40px] left-6 md:left-1/2 transform -translate-x-1/2 bg-black p-4 rounded-full border-4 border-sz-red z-20 shadow-[0_0_30px_rgba(227,30,36,0.8)]">
                        {!logoError ? (
                            <img
                                src="/SkillZone_logo_white.png"
                                alt="SZ"
                                loading="lazy"
                                className="h-8 w-auto"
                                onError={() => setLogoError(true)}
                            />
                        ) : (
                            <img
                                src="/SkillZone_logo_white.png"
                                alt="SZ"
                                className="h-8 w-auto"
                            />
                        )}
                    </div>
                </div>

                {filteredData.length === 0 && (
                    <div className="text-center py-20 text-gray-500 font-mono">
                        V této kategorii zatím nic není. Ale brzy bude.
                    </div>
                )}
            </div>
        </section>
    );
};

export default HistorySection;
