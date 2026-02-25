
import React, { useState, useEffect } from 'react';
import { Wifi, Users, Calendar, ChevronRight, ChevronLeft, Zap, Monitor, Beer, Utensils } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SLIDE_DURATION = 6000; // 6 seconds per slide
const TOTAL_SLIDES = 5;

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
    const [currentSlide, setCurrentSlide] = useState(0);
    const [strikeAnimated, setStrikeAnimated] = useState(false);
    const [glitchTrigger, setGlitchTrigger] = useState(false);
    const { t } = useAppContext();

    // Reset animation state when slide changes
    useEffect(() => {
        setStrikeAnimated(false);
        setGlitchTrigger(true);
        const timer = setTimeout(() => setGlitchTrigger(false), 500); // Short glitch on change

        if (currentSlide === 0) {
            setTimeout(() => setStrikeAnimated(true), 800); // Delay strike for effect
        }
        return () => clearTimeout(timer);
    }, [currentSlide]);

    // Auto-play logic with progress reset
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
        }, SLIDE_DURATION);
        return () => clearInterval(interval);
    }, [currentSlide]); // Reset timer on manual change

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? TOTAL_SLIDES - 1 : prev - 1));
    };

    return (
        <div className="relative w-full h-[360px] sm:h-[400px] md:h-[320px] flex flex-col justify-center items-center select-none group/slider overflow-hidden">

            {/* SLIDE 1: Identity / Correction */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${currentSlide === 0 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="relative mb-6">
                    <span className="text-2xl sm:text-4xl md:text-6xl font-orbitron font-black text-gray-400 dark:text-gray-500 opacity-50 tracking-widest">
                        {t('slide_we_are')}
                    </span>
                    {/* The red strike line - Enhanced */}
                    <div className={`strike-line transition-all duration-500 ease-out ${strikeAnimated ? 'w-[120%]' : 'w-0'}`}></div>
                </div>

                <div className={`transition-all duration-500 delay-300 transform ${strikeAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <h2 className={`text-3xl sm:text-5xl md:text-7xl font-orbitron font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center leading-none ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                        {t('slide_network').split(' ').slice(0, 1).join(' ')} <span className="text-sz-red text-glow">{t('slide_network').split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <div className="flex flex-wrap gap-4 justify-center mt-6 text-gray-500 dark:text-gray-300 font-mono text-sm md:text-base">
                        <span className="px-3 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded">ŽIŽKOV</span>
                        <span className="text-sz-red flex items-center"><Zap className="w-4 h-4 animate-pulse" /></span>
                        <span className="px-3 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded">HÁJE</span>
                        <span className="text-sz-red flex items-center"><Zap className="w-4 h-4 animate-pulse" /></span>
                        <span className="px-3 py-1 bg-white dark:bg-zinc-900 border border-sz-red/50 text-sz-red rounded animate-pulse">STODŮLKY (NEW)</span>
                    </div>
                </div>
            </div>

            {/* SLIDE 2: Stats (PDF inspired) with Counters */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${currentSlide === 1 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-5xl px-4">

                    {/* Stat 1 */}
                    <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black border border-gray-200 dark:border-sz-red/20 p-6 rounded-sm flex flex-col items-center justify-center group hover:border-sz-red/60 transition-all shadow-lg">
                        <Calendar className="w-8 h-8 text-sz-red mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-4xl md:text-5xl font-black font-orbitron text-gray-900 dark:text-white mb-1">
                            {currentSlide === 1 ? <AnimatedCounter end={20} /> : '0'}
                        </span>
                        <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">{t('slide_years')}</span>
                    </div>

                    {/* Stat 2 */}
                    <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black border border-gray-200 dark:border-sz-red/20 p-6 rounded-sm flex flex-col items-center justify-center group hover:border-sz-red/60 transition-all shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-sz-red/5 animate-pulse"></div>
                        <Users className="w-8 h-8 text-sz-red mb-3 group-hover:scale-110 transition-transform relative z-10" />
                        <span className="text-4xl md:text-5xl font-black font-orbitron text-gray-900 dark:text-white mb-1 relative z-10">
                            {currentSlide === 1 ? <AnimatedCounter end={18179} /> : '0'}
                        </span>
                        <span className="text-gray-500 text-xs uppercase tracking-widest font-bold relative z-10">{t('slide_db')}</span>
                        {/* New Text Insertion */}
                        <div className="absolute bottom-0 left-0 w-full p-2 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center">
                            <p className="text-[10px] text-gray-300 leading-tight">
                                {t('slide_db_note')}
                            </p>
                        </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black border border-gray-200 dark:border-sz-red/20 p-6 rounded-sm flex flex-col items-center justify-center group hover:border-sz-red/60 transition-all shadow-lg">
                        <Wifi className="w-8 h-8 text-sz-red mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-4xl md:text-5xl font-black font-orbitron text-gray-900 dark:text-white mb-1">
                            {currentSlide === 1 ? <AnimatedCounter end={10000} /> : '0'}
                        </span>
                        <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Mbps (Žižkov)</span>
                    </div>
                </div>
            </div>

            {/* SLIDE 3: Hardware (380Hz) */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${currentSlide === 2 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="relative">
                    <Monitor className="w-20 h-20 text-sz-red mx-auto mb-6 opacity-20 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150" />
                    <h2 className={`text-3xl sm:text-5xl md:text-8xl font-orbitron font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center leading-none mb-4 md:mb-6 ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                        380Hz <span className="text-sz-red">{t('slide_monitors')}</span>
                    </h2>
                </div>
                <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-gray-200 dark:border-white/10 px-6 py-3 rounded-sm max-w-2xl text-center">
                    <p className="text-gray-600 dark:text-gray-300 font-mono text-lg">
                        {t('slide_mon_desc')}
                    </p>
                </div>
            </div>

            {/* SLIDE 4: Bootcamp (BYOB) */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${currentSlide === 3 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="flex items-center gap-6 mb-4 opacity-50">
                    <Utensils className="w-12 h-12 text-gray-700 dark:text-white" />
                    <Beer className="w-12 h-12 text-sz-red" />
                </div>
                <h2 className={`text-2xl sm:text-4xl md:text-7xl font-orbitron font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center leading-tight mb-4 md:mb-6 ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                    {t('slide_food_q').split(' ').slice(0, 1).join(' ')} <span className="text-sz-red">{t('slide_food_q').split(' ').slice(1).join(' ')}</span>
                </h2>
                <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm border border-sz-red/30 px-8 py-4 rounded-sm max-w-3xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sz-red"></div>
                    <p className="text-xl text-gray-900 dark:text-white font-bold font-sans uppercase tracking-wide">
                        {t('slide_food_a')}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 font-mono text-sm mt-2">
                        {t('slide_food_desc')}
                    </p>
                </div>
            </div>

            {/* SLIDE 5: Atmosphere (Original Slogan) */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${currentSlide === 4 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <h1 className="font-orbitron text-2xl sm:text-4xl md:text-7xl font-black mb-4 leading-tight tracking-tight text-center drop-shadow-2xl">
                    <span className="text-gray-900 dark:text-white block mb-4 opacity-90">{t('intro_s1')}</span>
                    <span className="text-gray-500 text-xl md:text-3xl block font-sans font-bold mb-6 tracking-widest bg-white/50 dark:bg-black/50 px-4 py-2 inline-block rounded">
                        {t('intro_s2')}
                    </span>
                    <span className={`text-sz-red text-glow block transform -skew-x-6 mt-2 text-3xl sm:text-5xl md:text-8xl ${glitchTrigger ? 'animate-glitch-text' : ''}`}>
                        {t('intro_s3')}
                    </span>
                </h1>
            </div>

            {/* Progress Bar & Controls */}
            <div className="absolute -bottom-16 w-full max-w-md mx-auto flex flex-col gap-4 px-4">
                {/* Progress Line */}
                <div className="w-full h-1 bg-gray-300 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        key={currentSlide} // Re-renders on slide change to restart animation
                        className="h-full bg-sz-red origin-left animate-linear-progress"
                        style={{
                            animationDuration: `${SLIDE_DURATION}ms`,
                            animationName: 'progress',
                            animationTimingFunction: 'linear',
                            animationFillMode: 'forwards'
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

                <div className="flex justify-between items-center text-xs font-mono text-gray-500 dark:text-gray-600">
                    <button onClick={prevSlide} className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> PREV
                    </button>

                    <div className="flex gap-2">
                        {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-sz-red shadow-[0_0_8px_#E31E24] scale-125' : 'bg-gray-400 dark:bg-zinc-700 hover:bg-gray-500'}`}
                            />
                        ))}
                    </div>

                    <button onClick={nextSlide} className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                        NEXT <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeroPresentation;
