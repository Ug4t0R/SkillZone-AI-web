
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Quote, MapPin, ExternalLink, Sparkles, Shield, AlertTriangle, MessageSquare, ChevronDown } from 'lucide-react';
import { Review, GOOGLE_MAPS_URLS, loadReviews, loadLocationRatings, FALLBACK_REVIEWS_CS, FALLBACK_REVIEWS_EN } from '../data/reviews';
import { PlaceRating } from '../services/googleReviewsService';
import { useAppContext } from '../context/AppContext';
import { useScrollReveal } from '../hooks/useScrollReveal';

const LOCATION_LABELS: Record<string, string> = {
    'žižkov': 'Žižkov',
    'háje': 'Háje',
    'stodůlky': 'Stodůlky',
};

// Tag visual config
const TAG_CONFIG: Record<string, { icon: React.ReactNode; label: string; labelEn: string; bg: string; border: string; text: string }> = {
    highlight: {
        icon: <Sparkles className="w-3 h-3" />,
        label: 'Vybraná recenze',
        labelEn: 'Featured Review',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-500',
    },
    honest: {
        icon: <Shield className="w-3 h-3" />,
        label: 'Transparentní zpětná vazba',
        labelEn: 'Honest Feedback',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
    },
    genuine_complaint: {
        icon: <Shield className="w-3 h-3" />,
        label: 'Oprávněná kritika',
        labelEn: 'Valid Complaint',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
    },
    review_bomb: {
        icon: <AlertTriangle className="w-3 h-3" />,
        label: 'Podezřelá recenze',
        labelEn: 'Suspicious Review',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
    },
};

const Reviews: React.FC = () => {
    const { language, t } = useAppContext();
    const headingRef = useScrollReveal<HTMLDivElement>();
    const cardsGridRef = useRef<HTMLDivElement>(null);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [ratings, setRatings] = useState<Record<string, PlaceRating>>({});
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [showAll, setShowAll] = useState(false);

    // Load reviews from Supabase (or fallback)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [loadedReviews, loadedRatings] = await Promise.all([
                    loadReviews(),
                    loadLocationRatings(),
                ]);
                if (mounted) {
                    setReviews(loadedReviews);
                    setRatings(loadedRatings);
                }
            } catch {
                if (mounted) {
                    setReviews(language === 'cs' ? FALLBACK_REVIEWS_CS : FALLBACK_REVIEWS_EN);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [language]);

    // Trigger stagger animation AFTER cards are rendered
    useEffect(() => {
        const el = cardsGridRef.current;
        if (!el || loading || reviews.length === 0) return;

        // Set stagger delays on children
        Array.from(el.children).forEach((child, i) => {
            (child as HTMLElement).style.setProperty('--sr-delay', `${i * 100}ms`);
        });

        // Use IntersectionObserver to trigger when visible
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [loading, reviews.length, activeFilter, showAll]);

    // Filter reviews by location
    const locationFiltered = activeFilter === 'all'
        ? reviews
        : reviews.filter(r => r.location === activeFilter);

    // Filter: public site shows ONLY featured reviews (AI-curated best)
    const publicReviews = locationFiltered.filter(r => r.is_featured);
    // Fallback: if no featured reviews exist, show all (for first-time setup)
    const sortedReviews = publicReviews.length > 0 ? publicReviews : locationFiltered;

    // Show limited unless expanded
    const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 8);

    // Overall stats
    const allRatings: PlaceRating[] = Object.values(ratings);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum: number, r: PlaceRating) => sum + r.rating, 0) / allRatings.length).toFixed(1)
        : '4.6';
    const totalReviews = allRatings.reduce((sum: number, r: PlaceRating) => sum + r.totalReviews, 0);

    return (
        <section id="reviews" className="py-24 bg-light-bg dark:bg-dark-bg relative overflow-hidden transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4">
                <div ref={headingRef} className="scroll-reveal sr-glitch text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-orbitron font-black text-gray-900 dark:text-gray-200 uppercase mb-4">
                        {t('rev_title')} <span className="text-sz-red">{t('rev_title_sub')}</span>
                    </h2>

                    {/* AI-curated badge */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">
                            {language === 'cs'
                                ? 'Nejlepší recenze vybrané umělou inteligencí'
                                : 'Best reviews curated by AI'}
                        </p>
                    </div>

                    {/* Overall rating */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star
                                    key={i}
                                    className={`w-5 h-5 ${i <= Math.round(parseFloat(avgRating as string)) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-700'}`}
                                />
                            ))}
                        </div>
                        <span className="text-2xl font-orbitron font-black text-gray-900 dark:text-white">{avgRating}</span>
                        <span className="text-xs text-gray-500 font-mono">/ {totalReviews} {language === 'cs' ? 'recenzí' : 'reviews'}</span>
                    </div>

                    {/* Location rating badges */}
                    <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
                        {Object.entries(ratings).map(([loc, data]: [string, PlaceRating]) => (
                            <a
                                key={loc}
                                href={GOOGLE_MAPS_URLS[loc as keyof typeof GOOGLE_MAPS_URLS]}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-white dark:bg-zinc-900/40 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-lg hover:border-sz-red/40 transition-colors group"
                            >
                                <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{data.rating}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono uppercase">{LOCATION_LABELS[loc]}</span>
                                <span className="text-[9px] text-gray-400">({data.totalReviews})</span>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-sz-red transition-colors" />
                            </a>
                        ))}
                    </div>

                    {/* Location filter */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${activeFilter === 'all'
                                ? 'bg-sz-red text-white'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {language === 'cs' ? 'Všechny' : 'All'}
                        </button>
                        {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveFilter(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeFilter === key
                                    ? 'bg-sz-red text-white'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <MapPin className="w-3 h-3" /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Review cards */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900/30 border border-gray-200 dark:border-white/5 p-6 rounded-sm animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-24 mb-3" />
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-full" />
                                    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                                </div>
                                <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-20 mt-6" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div ref={cardsGridRef} className="sr-stagger scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {displayedReviews.map((review, index) => {
                                const tagCfg = review.ai_tag && review.ai_tag !== 'regular' ? TAG_CONFIG[review.ai_tag] : null;

                                return (
                                    <div
                                        key={review.id || index}
                                        className={`bg-white dark:bg-zinc-900/30 border p-6 rounded-sm relative group hover:-translate-y-2 transition-all duration-300 shadow-md dark:shadow-none ${tagCfg
                                            ? `${tagCfg.border} dark:${tagCfg.border}`
                                            : 'border-gray-200 dark:border-white/5'
                                            }`}
                                    >
                                        {/* Tag badge */}
                                        {tagCfg && (
                                            <div className={`absolute -top-2.5 left-4 ${tagCfg.bg} ${tagCfg.text} px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border ${tagCfg.border}`}>
                                                {tagCfg.icon}
                                                {language === 'cs' ? tagCfg.label : tagCfg.labelEn}
                                            </div>
                                        )}

                                        <Quote className="absolute top-4 right-4 w-8 h-8 text-gray-200 dark:text-white/5 group-hover:text-sz-red/20 transition-colors" />

                                        {/* Stars + Location */}
                                        <div className={`flex items-center justify-between ${tagCfg ? 'mt-2' : ''} mb-3`}>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < review.rating ? 'text-sz-red fill-sz-red' : 'text-gray-300 dark:text-gray-700'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="flex items-center gap-1 text-[9px] text-gray-400 font-mono uppercase bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                                <MapPin className="w-2.5 h-2.5" /> {LOCATION_LABELS[review.location]}
                                            </span>
                                        </div>

                                        {/* Review text */}
                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 italic">
                                            "{review.text}"
                                        </p>

                                        {/* AI Comment */}
                                        {review.ai_comment && tagCfg && (
                                            <div className={`${tagCfg.bg} border ${tagCfg.border} rounded-lg px-3 py-2 mb-4`}>
                                                <div className={`flex items-start gap-2 ${tagCfg.text}`}>
                                                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                                    <p className="text-[11px] leading-relaxed">
                                                        {review.ai_comment}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Author + source */}
                                        <div className="mt-auto border-t border-gray-100 dark:border-white/5 pt-4 flex items-end justify-between">
                                            <div className="flex items-center gap-2">
                                                {review.photo_url && (
                                                    <img
                                                        src={review.photo_url}
                                                        alt={review.author}
                                                        loading="lazy"
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <span className="text-gray-900 dark:text-white font-bold font-mono text-xs uppercase block">
                                                        {review.author}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-600 text-[10px] uppercase flex items-center gap-1">
                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                        </svg>
                                                        Google Review • {review.date}
                                                    </span>
                                                </div>
                                            </div>
                                            {review.google_url && (
                                                <a
                                                    href={review.google_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-gray-400 hover:text-sz-red transition-colors"
                                                    title="View on Google Maps"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Show more button */}
                        {sortedReviews.length > 8 && !showAll && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-sm font-mono uppercase tracking-wider rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                    {language === 'cs'
                                        ? `Zobrazit všech ${sortedReviews.length} recenzí`
                                        : `Show all ${sortedReviews.length} reviews`}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom link */}
                <div className="mt-12 text-center">
                    <a
                        href={GOOGLE_MAPS_URLS.žižkov}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-500 hover:text-black dark:hover:text-white text-sm underline decoration-sz-red underline-offset-4 transition-colors"
                    >
                        {t('rev_google')}
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Reviews;
