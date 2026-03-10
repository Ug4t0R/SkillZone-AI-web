
import React, { useState, useEffect } from 'react';
import { Wifi, Users, Calendar, ChevronRight, ChevronLeft, Zap, Monitor, Lock, Wallet, MessageCircle, Pause, Play, ArrowRight, Gift } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getYearsOnMarket } from '../utils/founding';
import { pushRoute } from '../services/routeConfig';
import { AppView } from '../types';

const SLIDE_DURATION = 10000; // 10 seconds per slide — enough to read
const TOTAL_SLIDES = 8;
const VOUCHER_SLIDE_INDEX = 0; // Voucher slide is the first one

// Simple animated counter component
const AnimatedCounter: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            // Ease out quart
            const easeProgress = 1 - Math.pow(1 - progress, 4);

            setCount(Math.floor(easeProgress * end));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count.toLocaleString()}{suffix}</span>;
};

const HeroPresentation: React.FC = () => {
    // Show voucher slide first for new visitors who haven't seen it yet
    const isNewVisitor = !localStorage.getItem('sz_seen_voucher_slide');
    const [currentSlide, setCurrentSlide] = useState(isNewVisitor ? VOUCHER_SLIDE_INDEX : 1);
    const [strikeAnimated, setStrikeAnimated] = useState(false);
    const [glitchTrigger, setGlitchTrigger] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { t } = useAppContext();

    const effectivelyPaused = isPaused || isHovered;

    // Reset animation state when slide changes
    useEffect(() => {
        setStrikeAnimated(false);
        setGlitchTrigger(true);
        const timer = setTimeout(() => setGlitchTrigger(false), 500); // Short glitch on change

        if (currentSlide === 1) {
            setTimeout(() => setStrikeAnimated(true), 800); // Delay strike for effect
        }
        // Mark voucher slide as seen once visitor moves past it
        if (currentSlide !== VOUCHER_SLIDE_INDEX && isNewVisitor) {
            localStorage.setItem('sz_seen_voucher_slide', '1');
        }
        return () => clearTimeout(timer);
    }, [currentSlide]);

    // Auto-play logic with progress reset
    useEffect(() => {
        if (effectivelyPaused) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
        }, SLIDE_DURATION);
        return () => clearInterval(interval);
    }, [currentSlide, effectivelyPaused]); // Reset timer on manual change, pause toggle, or hover

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? TOTAL_SLIDES - 1 : prev - 1));
    };

    const navigateTo = (view: AppView) => {
        pushRoute(view);
        window.dispatchEvent(new Event('popstate'));
        window.scrollTo(0, 0);
    };

    // CTA link component for slides
    const SlideCTA: React.FC<{ label: string; view: AppView }> = ({ label, view }) => (
        <button
            onClick={() => navigateTo(view)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-sz-red/10 hover:bg-sz-red text-sz-red hover:text-white border border-sz-red/30 hover:border-sz-red rounded-sm font-orbitron text-xs font-bold uppercase tracking-wider transition-all duration-300 group/cta"
        >
            {label}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-1" />
        </button>
    );

    return (
        <div
            className="group/slider select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Slides container */}
            <div className="relative w-full h-[320px] sm:h-[360px] md:h-[300px] flex flex-col justify-center items-center overflow-hidden">

                {/* Pause indicator - shown when hovering */}
                {isHovered && !isPaused && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs font-mono text-gray-400 dark:text-gray-500 bg-white/60 dark:bg-black/40 backdrop-blur-sm px-2 py-1 rounded opacity-0 group-hover/slider:opacity-70 transition-opacity">
                        <Pause className="w-3 h-3" /> PAUSED
                    </div>
                )}

                {/* SLIDE 0: Voucher Promo — New Customer Acquisition */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-4 ${currentSlide === 0 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="relative">
                        {/* Glowing badge */}
                        <div className="flex justify-center mb-4">
                            <span className="px-3 py-1 bg-sz-red/10 border border-sz-red/40 rounded-sm text-sz-red font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] animate-pulse shadow-[0_0_15px_rgba(227,30,36,0.15)]">
                                🎁 {t('slide_voucher_badge')}
                            </span>
                        </div>
                        <h2 className={`text-2xl sm:text-4xl md:text-6xl font-orbitron font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center leading-none mb-3 ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                            {t('slide_voucher_title')} <span className="text-sz-red text-glow">{t('slide_voucher_highlight')}</span>
                        </h2>
                        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-sz-red/30 px-5 md:px-6 py-2 md:py-3 rounded-sm max-w-2xl text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-sz-red"></div>
                            <p className="text-gray-600 dark:text-gray-300 font-mono text-sm md:text-base">
                                {t('slide_voucher_desc')}
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <SlideCTA label={t('slide_cta_voucher')} view="poukaz" />
                        </div>
                    </div>
                </div>

                {/* SLIDE 1: Identity / Correction */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-4 ${currentSlide === 1 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="absolute inset-0 z-0"><img src="/bg/P3.webp" alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" /></div>
                    <div className="relative mb-4 z-10">
                        <span className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-black text-gray-400 dark:text-gray-500 opacity-50 tracking-widest">
                            {t('slide_we_are')}
                        </span>
                        <div className={`strike-line transition-all duration-500 ease-out ${strikeAnimated ? 'w-[120%]' : 'w-0'}`}></div>
                    </div>
                    <div className={`transition-all duration-500 delay-300 transform text-center ${strikeAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <h2 className={`text-2xl sm:text-4xl md:text-6xl font-orbitron font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center leading-none ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                            {t('slide_network').split(' ').slice(0, 1).join(' ')} <span className="text-sz-red text-glow">{t('slide_network').split(' ').slice(1).join(' ')}</span>
                        </h2>
                        <div className="flex flex-wrap gap-3 justify-center mt-4 text-gray-500 dark:text-gray-300 font-mono text-xs md:text-sm">
                            <span className="px-2 py-0.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded">ŽIŽKOV</span>
                            <span className="text-sz-red flex items-center"><Zap className="w-3 h-3 animate-pulse" /></span>
                            <span className="px-2 py-0.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded">HÁJE</span>
                            <span className="text-sz-red flex items-center"><Zap className="w-3 h-3 animate-pulse" /></span>
                            <span className="px-2 py-0.5 bg-white dark:bg-zinc-900 border border-sz-red/50 text-sz-red rounded animate-pulse">STODŮLKY (NEW)</span>
                        </div>
                        <SlideCTA label={t('slide_cta_locations')} view="locations" />
                    </div>
                </div>

                {/* SLIDE 2: Stats */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-4 ${currentSlide === 2 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-4xl">
                        <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black border border-gray-200 dark:border-sz-red/20 p-4 md:p-5 rounded-sm flex flex-col items-center justify-center group hover:border-sz-red/60 transition-all shadow-lg">
                            <Calendar className="w-6 h-6 text-sz-red mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-3xl md:text-4xl font-black font-orbitron text-gray-900 dark:text-white mb-1">
                                {currentSlide === 2 ? <AnimatedCounter end={getYearsOnMarket()} /> : '0'}
                            </span>
                            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{t('slide_years')}</span>
                        </div>
                        <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black border border-gray-200 dark:border-sz-red/20 p-4 md:p-5 rounded-sm flex flex-col items-center justify-center group hover:border-sz-red/60 transition-all shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-sz-red/5 animate-pulse"></div>
                            <Users className="w-6 h-6 text-sz-red mb-2 group-hover:scale-110 transition-transform relative z-10" />
                            <span className="text-3xl md:text-4xl font-black font-orbitron text-gray-900 dark:text-white mb-1 relative z-10">
                                {currentSlide === 2 ? <AnimatedCounter end={18179} /> : '0'}
                            </span>
                            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold relative z-10">{t('slide_db')}</span>
                            <div className="absolute bottom-0 left-0 w-full p-2 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center">
                                <p className="text-[10px] text-gray-300 leading-tight">{t('slide_db_note')}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black border border-gray-200 dark:border-sz-red/20 p-4 md:p-5 rounded-sm flex flex-col items-center justify-center group hover:border-sz-red/60 transition-all shadow-lg">
                            <Wifi className="w-6 h-6 text-sz-red mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-3xl md:text-4xl font-black font-orbitron text-gray-900 dark:text-white mb-1">
                                {currentSlide === 2 ? <AnimatedCounter end={10000} /> : '0'}
                            </span>
                            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Mbps (Žižkov)</span>
                        </div>
                    </div>
                    <SlideCTA label={t('slide_cta_story')} view="history" />
                </div>

                {/* SLIDE 3: Hardware (380Hz) */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-4 ${currentSlide === 3 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="absolute inset-0 z-0"><img src="/bg/P4.webp" alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" /></div>
                    <div className="relative z-10">
                        <Monitor className="w-16 h-16 text-sz-red mx-auto mb-4 opacity-20 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150" />
                        <h2 className={`text-3xl sm:text-5xl md:text-7xl font-orbitron font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center leading-none mb-3 ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                            380Hz <span className="text-sz-red">{t('slide_monitors')}</span>
                        </h2>
                    </div>
                    <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-gray-200 dark:border-white/10 px-5 py-2 rounded-sm max-w-2xl text-center">
                        <p className="text-gray-600 dark:text-gray-300 font-mono text-base">
                            {t('slide_mon_desc')}
                        </p>
                    </div>
                    <SlideCTA label={t('slide_cta_locations')} view="locations" />
                </div>

                {/* SLIDE 4: Bootcamp Private Space */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-4 ${currentSlide === 4 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="absolute inset-0 z-0"><img src="/bg/bootcamp.webp" alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" /></div>
                    <Lock className="w-8 h-8 text-sz-red mb-3 opacity-50 relative z-10" />
                    <h2 className={`relative z-10 text-2xl sm:text-3xl md:text-6xl font-orbitron font-black text-white uppercase tracking-tighter text-center leading-tight mb-3 ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                        {t('slide_boot_q').split(' ').slice(0, 1).join(' ')} <span className="text-sz-red">{t('slide_boot_q').split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <div className="relative z-10 bg-black/60 backdrop-blur-sm border border-sz-red/30 px-6 py-3 rounded-sm max-w-2xl text-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-sz-red"></div>
                        <p className="text-lg text-white font-bold font-sans uppercase tracking-wide">
                            {t('slide_boot_a')}
                        </p>
                        <p className="text-gray-300 font-mono text-xs mt-1">
                            {t('slide_boot_desc')}
                        </p>
                    </div>
                    <div className="relative z-10"><SlideCTA label={t('slide_cta_bootcamp')} view="branch_bootcamp" /></div>
                </div>

                {/* SLIDE 5: Flexible Pricing */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-4 ${currentSlide === 5 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <Wallet className="w-8 h-8 text-sz-red mb-3 opacity-50" />
                    <h2 className={`text-2xl sm:text-3xl md:text-6xl font-orbitron font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center leading-tight mb-3 ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                        {t('slide_price_q').split(' ').slice(0, 1).join(' ')} <span className="text-sz-red">{t('slide_price_q').split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-sz-red/30 px-6 py-3 rounded-sm max-w-2xl text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-sz-red"></div>
                        <p className="text-lg text-gray-900 dark:text-white font-bold font-sans uppercase tracking-wide">
                            {t('slide_price_a')}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 font-mono text-xs mt-1">
                            {t('slide_price_desc')}
                        </p>
                    </div>
                    <SlideCTA label={t('slide_cta_pricing')} view="pricing" />
                </div>

                {/* SLIDE 6: Tykáme si */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-4 ${currentSlide === 6 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="absolute inset-0 z-0"><img src="/bg/P5.webp" alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" /></div>
                    <MessageCircle className="w-8 h-8 text-sz-red mb-3 opacity-50 relative z-10" />
                    <h2 className={`relative z-10 text-2xl sm:text-3xl md:text-6xl font-orbitron font-black text-white uppercase tracking-tighter text-center leading-tight mb-3 ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                        {t('slide_vibe_q').split(' ').slice(0, 1).join(' ')} <span className="text-sz-red">{t('slide_vibe_q').split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <div className="relative z-10 bg-black/60 backdrop-blur-sm border border-sz-red/30 px-6 py-3 rounded-sm max-w-2xl text-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-sz-red"></div>
                        <p className="text-lg text-white font-bold font-sans uppercase tracking-wide">
                            {t('slide_vibe_a')}
                        </p>
                        <p className="text-gray-300 font-mono text-xs mt-1">
                            {t('slide_vibe_desc')}
                        </p>
                    </div>
                    <div className="relative z-10"><SlideCTA label={t('slide_cta_gallery')} view="gallery" /></div>
                </div>

                {/* SLIDE 7: Atmosphere (Original Slogan) */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-4 ${currentSlide === 7 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="absolute inset-0 z-0"><img src="/bg/P3.webp" alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/40" /></div>
                    <h1 className="relative z-10 font-orbitron text-2xl sm:text-4xl md:text-6xl font-black mb-2 leading-tight tracking-tight text-center drop-shadow-2xl">
                        <span className="text-white block mb-2 opacity-90">{t('intro_s1')}</span>
                        <span className="text-gray-300 text-lg md:text-2xl block font-sans font-bold mb-4 tracking-widest bg-black/50 px-4 py-1.5 inline-block rounded">
                            {t('intro_s2')}
                        </span>
                        <span className={`text-sz-red text-glow block transform -skew-x-6 mt-1 text-3xl sm:text-5xl md:text-7xl ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                            {t('intro_s3')}
                        </span>
                    </h1>
                    <div className="relative z-10"><SlideCTA label={t('slide_cta_locations')} view="locations" /></div>
                </div>
            </div>

            {/* Controls — OUTSIDE the slider, no overlap */}
            <div className="w-full max-w-lg mx-auto flex flex-col gap-1.5 px-4 pt-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300">
                {/* Progress Line */}
                <div className="w-full h-1 bg-gray-300/50 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                    <div
                        key={`${currentSlide}-${effectivelyPaused}`}
                        className="h-full bg-sz-red origin-left"
                        style={{
                            animationDuration: `${SLIDE_DURATION}ms`,
                            animationName: effectivelyPaused ? 'none' : 'progress',
                            animationTimingFunction: 'linear',
                            animationFillMode: 'forwards',
                            width: effectivelyPaused ? '100%' : undefined
                        }}
                    >
                        <style>{`
                            @keyframes progress {
                                from { width: 0%; }
                                to { width: 100%; }
                            }
                        `}</style>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-gray-500 dark:text-gray-400">
                    <button onClick={prevSlide} className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/20 dark:hover:bg-white/10">
                        <ChevronLeft className="w-4 h-4" /> PREV
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-sz-red shadow-[0_0_8px_#E31E24] scale-125' : 'bg-gray-400 dark:bg-zinc-600 hover:bg-gray-500 dark:hover:bg-zinc-400'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setIsPaused(p => !p)}
                            className="p-1.5 hover:text-black dark:hover:text-white transition-colors rounded hover:bg-white/20 dark:hover:bg-white/10"
                            title={isPaused ? 'Play' : 'Pause'}
                        >
                            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                    </div>

                    <button onClick={nextSlide} className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/20 dark:hover:bg-white/10">
                        NEXT <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeroPresentation;
