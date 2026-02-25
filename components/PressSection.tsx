
import React, { useState, useMemo } from 'react';
import { Newspaper, ExternalLink, Filter, Sparkles } from 'lucide-react';
import { PRESS_ITEMS, PRESS_CATEGORIES, PressCategory, PressItem } from '../data/pressArticles';
import { useAppContext } from '../context/AppContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

const ALL_CATEGORIES: (PressCategory | 'all')[] = ['all', 'tv', 'press', 'gaming', 'esport', 'video', 'radio', 'partner'];

const PressSection: React.FC = () => {
    const [filter, setFilter] = useState<PressCategory | 'all'>('all');
    const [showAll, setShowAll] = useState(false);
    const { language } = useAppContext();
    const revealRef = useScrollReveal<HTMLElement>();

    const sortedItems = useMemo(() => {
        const filtered = filter === 'all'
            ? PRESS_ITEMS
            : PRESS_ITEMS.filter(item => item.category === filter);

        // Highlighted first, then by year descending
        return [...filtered].sort((a, b) => {
            if (a.highlight && !b.highlight) return -1;
            if (!a.highlight && b.highlight) return 1;
            return b.year - a.year;
        });
    }, [filter]);

    const INITIAL_COUNT = 9;
    const displayedItems = showAll ? sortedItems : sortedItems.slice(0, INITIAL_COUNT);
    const hasMore = sortedItems.length > INITIAL_COUNT;

    return (
        <section
            id="press"
            ref={revealRef}
            className="py-24 bg-light-bg dark:bg-dark-bg relative overflow-hidden transition-colors duration-300"
        >
            <div className="max-w-7xl mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-sz-red/10 rounded-full mb-4 border border-sz-red/20">
                        <Newspaper className="w-8 h-8 text-sz-red" />
                    </div>
                    <h2 className="text-5xl md:text-7xl font-orbitron font-black mb-6 uppercase tracking-tight text-gray-900 dark:text-white">
                        {language === 'cs' ? 'PSALI' : 'IN THE'}{' '}
                        <span className="text-sz-red text-glow">
                            {language === 'cs' ? 'O NÁS' : 'MEDIA'}
                        </span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xl max-w-2xl mx-auto mb-10">
                        {language === 'cs'
                            ? 'Kde všude se o nás psalo, mluvilo a natáčelo — od České televize po herní portály.'
                            : 'Where we\'ve been featured — from Czech Television to gaming portals.'}
                    </p>

                    {/* Category Filter */}
                    <div className="flex items-center justify-center gap-2 flex-wrap bg-white/50 dark:bg-zinc-900/50 p-2 rounded-md border border-gray-200 dark:border-white/5 max-w-3xl mx-auto">
                        <Filter className="w-4 h-4 text-gray-500 ml-1" />
                        {ALL_CATEGORIES.map(cat => {
                            const isActive = filter === cat;
                            const meta = cat === 'all' ? null : PRESS_CATEGORIES[cat];
                            return (
                                <button
                                    key={cat}
                                    onClick={() => { setFilter(cat); setShowAll(false); }}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap flex items-center gap-1.5
                                        ${isActive
                                            ? 'text-sz-red bg-sz-red/10 border border-sz-red/30'
                                            : 'text-gray-500 hover:text-black dark:hover:text-white border border-transparent'}`}
                                >
                                    {meta && <span className="text-sm">{meta.emoji}</span>}
                                    {cat === 'all'
                                        ? (language === 'cs' ? 'Vše' : 'All')
                                        : (language === 'cs' ? meta!.label : meta!.labelEn)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedItems.map((item, idx) => (
                        <PressCard key={item.id} item={item} index={idx} language={language} />
                    ))}
                </div>

                {/* Show more */}
                {hasMore && !showAll && (
                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowAll(true)}
                            className="bg-transparent border border-sz-red/40 text-sz-red px-8 py-3 font-orbitron font-bold text-sm uppercase hover:bg-sz-red hover:text-white transition-all shadow-[0_0_10px_rgba(227,30,36,0.1)] hover:shadow-[0_0_20px_rgba(227,30,36,0.3)] rounded-sm"
                        >
                            {language === 'cs'
                                ? `Zobrazit všechny (${sortedItems.length})`
                                : `Show all (${sortedItems.length})`}
                        </button>
                    </div>
                )}

                {displayedItems.length === 0 && (
                    <div className="text-center py-20 text-gray-500 font-mono">
                        {language === 'cs' ? 'V této kategorii zatím nic není.' : 'Nothing in this category yet.'}
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── Individual Card ─────────────────────────────────────────────────

interface PressCardProps {
    item: PressItem;
    index: number;
    language: string;
}

const PressCard: React.FC<PressCardProps> = ({ item, index, language }) => {
    const cat = PRESS_CATEGORIES[item.category];
    const title = language === 'cs' ? item.title : item.titleEn;
    const desc = language === 'cs' ? item.description : item.descriptionEn;
    const hasUrl = item.url && item.url.length > 0;

    const Wrapper = hasUrl ? 'a' : 'div';
    const wrapperProps = hasUrl
        ? { href: item.url, target: '_blank' as const, rel: 'noopener noreferrer' }
        : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={`group relative bg-white/80 dark:bg-zinc-900/60 backdrop-blur-sm border rounded-sm overflow-hidden
                transition-all duration-300 hover:-translate-y-1
                ${item.highlight
                    ? 'border-sz-red/40 shadow-[0_0_20px_rgba(227,30,36,0.08)] hover:shadow-[0_0_30px_rgba(227,30,36,0.15)]'
                    : 'border-gray-200 dark:border-white/10 hover:border-sz-red/30 shadow-lg hover:shadow-xl'
                }
                ${hasUrl ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Highlight badge */}
            {item.highlight && (
                <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1 bg-sz-red/10 text-sz-red text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border border-sz-red/20">
                        <Sparkles className="w-3 h-3" />
                        {language === 'cs' ? 'Doporučeno' : 'Featured'}
                    </div>
                </div>
            )}

            <div className="p-6">
                {/* Source header */}
                <div className="flex items-center gap-3 mb-4">
                    {/* Source logo/emoji */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border text-lg ${cat.color}`}>
                        {item.logo ? (
                            <img
                                src={item.logo}
                                alt=""
                                loading="lazy"
                                className="w-5 h-5 rounded-sm object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = cat.emoji; }}
                            />
                        ) : (
                            cat.emoji
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.source}</div>
                        {item.date && (
                            <div className="text-xs text-gray-500 font-mono">{item.date}</div>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-orbitron font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-sz-red transition-colors line-clamp-2">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
                    {desc}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    {/* Category tag */}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border ${cat.color}`}>
                        {cat.emoji} {language === 'cs' ? cat.label : cat.labelEn}
                    </span>

                    {/* External link indicator */}
                    {hasUrl && (
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-sz-red transition-colors" />
                    )}
                </div>
            </div>

            {/* Bottom accent line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-sz-red/30 to-transparent group-hover:via-sz-red transition-all" />
        </Wrapper>
    );
};

export default PressSection;
