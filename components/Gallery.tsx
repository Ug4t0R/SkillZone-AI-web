import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, MapPin, Tag, ZoomIn } from 'lucide-react';
import { GalleryItem, getGalleryItems, GALLERY_CATEGORIES } from '../data/gallery';
import { useAppContext } from '../context/AppContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

const Gallery: React.FC = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [lightbox, setLightbox] = useState<{ item: GalleryItem; index: number } | null>(null);
    const [imgLoaded, setImgLoaded] = useState<Set<string>>(new Set());
    const { language, t } = useAppContext();
    const headingRef = useScrollReveal<HTMLDivElement>();

    useEffect(() => {
        getGalleryItems().then(data => setItems(data.filter(i => i.visible !== false)));
    }, []);

    const filtered = activeCategory === 'all'
        ? items
        : items.filter(i => i.category === activeCategory);

    const openLightbox = useCallback((item: GalleryItem) => {
        const idx = filtered.findIndex(f => f.id === item.id);
        setLightbox({ item, index: idx });
        document.body.style.overflow = 'hidden';
    }, [filtered]);

    const closeLightbox = useCallback(() => {
        setLightbox(null);
        document.body.style.overflow = '';
    }, []);

    const navigate = useCallback((dir: -1 | 1) => {
        if (!lightbox) return;
        const newIdx = (lightbox.index + dir + filtered.length) % filtered.length;
        setLightbox({ item: filtered[newIdx], index: newIdx });
    }, [lightbox, filtered]);

    // Keyboard navigation
    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightbox, closeLightbox, navigate]);

    const getCategoryLabel = (id: string) => {
        const cat = GALLERY_CATEGORIES.find(c => c.id === id);
        if (!cat) return id;
        return language === 'cs' || language === 'ru' || language === 'ua' ? cat.label_cs : cat.label_en;
    };

    // Masonry pattern: varying heights for visual interest
    const getHeightClass = (index: number) => {
        const pattern = [
            'h-64', 'h-80', 'h-64', 'h-72',
            'h-80', 'h-64', 'h-72', 'h-64',
            'h-72', 'h-80', 'h-64', 'h-80',
            'h-64', 'h-72'
        ];
        return pattern[index % pattern.length];
    };

    return (
        <section id="gallery" className="py-24 bg-light-bg dark:bg-dark-bg relative overflow-hidden transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div ref={headingRef} className="scroll-reveal sr-glitch text-center mb-12">
                    <h2 className="text-4xl md:text-6xl font-orbitron font-black uppercase tracking-tight text-gray-900 dark:text-white">
                        {language === 'cs' ? 'Galerie' : 'Gallery'} <span className="text-sz-red">{language === 'cs' ? 'Záběry' : 'Shots'}</span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mt-4 max-w-xl mx-auto">
                        {language === 'cs'
                            ? 'Nahlédni do atmosféry našich herních klubů. Hardware, eventy, komunita.'
                            : 'Peek into the atmosphere of our gaming clubs. Hardware, events, community.'}
                    </p>
                    <div className="h-1 w-20 bg-sz-red mx-auto mt-4 rounded-full"></div>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {GALLERY_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all border ${activeCategory === cat.id
                                ? 'bg-sz-red text-white border-sz-red shadow-[0_0_15px_rgba(227,30,36,0.3)]'
                                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-sz-red/50 hover:text-sz-red'
                                }`}
                        >
                            {getCategoryLabel(cat.id)}
                        </button>
                    ))}
                </div>

                {/* Masonry Grid */}
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                    {filtered.map((item, index) => (
                        <div
                            key={item.id}
                            className={`break-inside-avoid group relative overflow-hidden rounded-sm border border-gray-200 dark:border-white/5 cursor-pointer transition-all duration-500 hover:border-sz-red/50 hover:shadow-[0_0_25px_rgba(227,30,36,0.15)] ${imgLoaded.has(item.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}
                            onClick={() => openLightbox(item)}
                            style={{ transitionDelay: `${index * 50}ms` }}
                        >
                            <div className={`${getHeightClass(index)} w-full relative overflow-hidden bg-gray-100 dark:bg-zinc-900`}>
                                <img
                                    src={item.src}
                                    alt={item.alt}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter group-hover:brightness-75"
                                    onLoad={() => setImgLoaded(prev => new Set(prev).add(item.id))}
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/800x600/111/E31E24?text=${encodeURIComponent(item.category)}`; setImgLoaded(prev => new Set(prev).add(item.id)); }}
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <p className="text-white font-bold text-sm mb-2">{item.alt}</p>
                                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-300">
                                        <span className="flex items-center gap-1">
                                            <Tag className="w-3 h-3 text-sz-red" />
                                            {getCategoryLabel(item.category)}
                                        </span>
                                        {item.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-sz-red" />
                                                {item.location}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Zoom Icon */}
                                <div className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-100 scale-75">
                                    <ZoomIn className="w-4 h-4" />
                                </div>

                                {/* Category Badge */}
                                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-sz-red text-[9px] font-mono font-bold uppercase px-2 py-1 rounded-sm border border-sz-red/30">
                                    {getCategoryLabel(item.category)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-600 py-20 font-mono text-sm">
                        {language === 'cs' ? 'Žádné fotky v této kategorii.' : 'No photos in this category.'}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white/60 hover:text-white p-2 transition-colors z-50"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Navigation Arrows */}
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-3 transition-colors z-50"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(1); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-3 transition-colors z-50"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>

                    {/* Image */}
                    <div
                        className="max-w-5xl max-h-[85vh] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightbox.item.src}
                            alt={lightbox.item.alt}
                            className="max-w-full max-h-[80vh] object-contain rounded-sm shadow-2xl"
                        />
                        {/* Info Bar */}
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <div>
                                <p className="text-white font-bold">{lightbox.item.alt}</p>
                                <div className="flex items-center gap-4 mt-1 text-gray-400 text-xs font-mono">
                                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {getCategoryLabel(lightbox.item.category)}</span>
                                    {lightbox.item.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lightbox.item.location}</span>}
                                    {lightbox.item.date && <span>{lightbox.item.date}</span>}
                                </div>
                            </div>
                            <span className="text-gray-500 font-mono text-xs">
                                {lightbox.index + 1} / {filtered.length}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Gallery;
