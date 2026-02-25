/**
 * SkillerAvatar — Stream Avatar-style mascot that walks on the LiveFeed bar.
 * 
 * Desktop: Walks left↔right on the bottom status bar with legs animation.
 *   Weather-aware accessories (umbrella, sunglasses, scarf).
 *   Speech bubbles with weather context + idle phrases.
 *   Click → open chat. Long-press (1s) → shoot down.
 *   When shot down, peeks from right edge every 30-60s.
 * 
 * Mobile: No walking — just peeks from top every 40-50s.
 *   Tap opens chat. Long-press shoots down.
 * 
 * Respects animation preferences.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAnimationsEnabled } from '../utils/storage/animations';
import { getWeather, WeatherCondition } from '../services/weatherService';
import { getDailyAiFeed } from '../utils/storage/chat';

// ═══════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════

const IDLE_PHRASES = [
    'Čau, potřebuješ help? 🎮',
    'GG EZ 💀',
    'Nudim se… napiš mi!',
    'Skiller online 🟢',
    '*sipuje Monster*',
    'Tryhard mode: ON',
    '1v1 me bro',
    'ez clap 🔥',
    'Klikni na mě!',
    'gg wp, next?',
    '🎧 Grinding rank...',
    'Skill issue? Napiš mi.',
    'AFK? Probůdim tě!',
    'Elo hell je real...',
];

const WEATHER_PHRASES: Record<WeatherCondition, string[]> = {
    sun: [
        '☀️ Venku svítí, ale my grindíme rank!',
        'Perfect gaming weather — it\'s always gaming weather',
        '☀️ Sluníčko? Zavřete okna, je glare na monitoru!',
        'Touch grass? No thanks, touch keyboard ☀️',
    ],
    rain: [
        '🌧️ Venku prší, tak proč nejsi tu?',
        '☔ Déšť = legit výmluva zůstat grindovat',
        'Rain = Gaming marathon 🌧️',
        'Mokro venku, sucho na serveru 🎮',
    ],
    snow: [
        '❄️ Sněží! Hřej se u nás.',
        'Snow map IRL 🗺️',
        '❄️ Venku sněží, uvnitř je teplo a gaming!',
        'Winter is coming... to SkillZone! ❄️',
    ],
    storm: [
        '⛈️ Nebezpečno venku, bezpečno na serveru!',
        'Lightning fast! ⚡ Jako náš internet.',
        '⛈️ Bouřka? Máme záložní zdroj!',
        'Storm outside, calm inside 🎮',
    ],
    cloudy: [
        '☁️ Šedivej den, jasnej rank!',
        'Cloudy days = gaming days ☁️',
        'Ani mrak nás nezastaví ☁️',
    ],
    fog: [
        '🌫️ Mlha? Smoke grenade IRL!',
        'Foggy = stealth mode activated 🌫️',
    ],
    unknown: [
        '🌤️ Ať je venku cokoliv, tady je gaming!',
    ],
};

const SHOT_PHRASES = [
    '💥 Sestřelen!',
    '💀 K.O.!',
    '😵 Oof...',
    '🔥 Headshot!',
    '☠️ Wasted...',
];

// ═══════════════════════════════════════════════════════
// FULL GAMER BOT CHARACTER — front & side profile
// ═══════════════════════════════════════════════════════

export const SkillerCharacter: React.FC<{
    mood: string;
    isDead?: boolean;
    weather?: WeatherCondition;
    facingLeft?: boolean;
    isWalking?: boolean;
}> = ({ mood, isDead, weather, facingLeft, isWalking }) => {
    const eyeColor = isDead ? '#666' : mood === 'HYPE' ? '#22c55e' : mood === 'TILT' ? '#ef4444' : mood === 'TIRED' ? '#f59e0b' : '#e31e24';
    const glowColor = isDead ? 'transparent' : `${eyeColor}44`;
    const mouthStyle = isDead ? 'scaleY(-1)' : mood === 'TILT' ? 'scaleY(-1)' : mood === 'TIRED' ? 'scaleY(0.3)' : 'none';
    const side = isWalking;

    return (
        <div
            className="relative flex flex-col items-center transition-all duration-300"
            style={{ transform: facingLeft ? 'scaleX(-1)' : 'none', width: side ? '28px' : '36px' }}
        >
            {/* ─── WEATHER: Umbrella ─── */}
            {!isDead && (weather === 'rain' || weather === 'storm') && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
                    <div className="w-9 h-[18px] bg-gradient-to-b from-sz-red to-red-700 rounded-t-full border border-red-400/50" />
                    <div className="w-px h-[30px] bg-gray-400 mx-auto" />
                </div>
            )}

            {/* ─── HEAD ─── */}
            <div className="relative z-10">
                {/* Headset band */}
                <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 border-t-2 border-l-2 border-r-2 rounded-t-full transition-all duration-300 ${isDead ? 'border-gray-600' : 'border-zinc-500'}`}
                    style={{ width: side ? '24px' : '36px' }}
                />

                {/* Ear cups — side: only right visible */}
                {!side && (
                    <div className={`absolute top-1 -left-1.5 w-2.5 h-4 rounded-l-md ${isDead ? 'bg-gray-700' : 'bg-zinc-700 border border-zinc-500'}`}>
                        <div className={`w-1 h-2 mt-0.5 ml-0.5 rounded-sm ${isDead ? 'bg-gray-600' : 'bg-sz-red/50'}`} />
                    </div>
                )}
                <div className={`absolute top-1 -right-1.5 w-2.5 h-4 rounded-r-md ${isDead ? 'bg-gray-700' : 'bg-zinc-700 border border-zinc-500'}`}>
                    <div className={`w-1 h-2 mt-0.5 ml-1 rounded-sm ${isDead ? 'bg-gray-600' : 'bg-sz-red/50'}`} />
                </div>

                {/* Head / Visor — narrower when side */}
                <div
                    className={`h-8 rounded-md relative overflow-hidden transition-all duration-300 mx-auto ${isDead
                        ? 'bg-zinc-800 border-2 border-gray-600 opacity-60'
                        : 'bg-zinc-900 border-2 border-zinc-600'
                        }`}
                    style={{ width: side ? '20px' : '32px', boxShadow: isDead ? 'none' : `0 0 4px ${glowColor}` }}
                >
                    {/* Visor screen */}
                    {!isDead && <div className="absolute inset-0.5 bg-gradient-to-b from-zinc-800 to-black rounded-sm" />}

                    {/* Sunglasses (front only) */}
                    {!isDead && weather === 'sun' && !side && (
                        <div className="absolute top-1.5 left-0.5 right-0.5 h-2.5 bg-gray-900/80 rounded-sm z-10 flex items-center justify-center gap-1">
                            <div className="w-2 h-1.5 bg-gray-800 rounded-sm border border-gray-600" />
                            <div className="w-0.5 h-0.5 bg-gray-600" />
                            <div className="w-2 h-1.5 bg-gray-800 rounded-sm border border-gray-600" />
                        </div>
                    )}

                    {/* Eyes — side: 1 eye right-aligned, front: 2 eyes centered */}
                    <div
                        className={`relative z-[5] mt-1.5 ${side ? 'flex justify-end pr-1' : 'flex justify-center gap-1.5'}`}
                        style={{ animation: !isDead ? 'skillerBlink 4s ease-in-out infinite' : 'none' }}
                    >
                        {isDead ? (
                            <span className="text-[7px] text-gray-500 font-bold leading-none">✕</span>
                        ) : (
                            <>
                                {!side && <div className="w-1.5 h-2 rounded-sm" style={{ background: eyeColor, boxShadow: `0 0 3px ${glowColor}`, opacity: 0.9 }} />}
                                <div className="w-1.5 h-2 rounded-sm" style={{ background: eyeColor, boxShadow: `0 0 3px ${glowColor}`, opacity: 0.9 }} />
                            </>
                        )}
                    </div>

                    {/* Mouth */}
                    <div className={`mt-1 relative z-[5] ${side ? 'flex justify-end pr-1.5' : 'flex justify-center'}`}>
                        <div className={`h-0.5 rounded-full ${isDead ? 'bg-gray-600' : ''}`}
                            style={{ width: side ? '4px' : '12px', transform: mouthStyle, background: isDead ? undefined : eyeColor, opacity: isDead ? 1 : 0.4 }}
                        />
                    </div>

                    {/* Scan lines */}
                    {!isDead && <div className="absolute inset-0 opacity-15" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }} />}
                </div>

                {/* Scarf */}
                {!isDead && weather === 'snow' && <div className="w-9 h-1.5 bg-red-500 rounded-sm mx-auto -mt-0.5 z-20 relative opacity-90" />}
            </div>

            {/* ─── BODY ─── */}
            <div
                className={`relative -mt-0.5 rounded-b-md transition-all duration-300 ${isDead
                    ? 'bg-zinc-800 border border-gray-600 border-t-0 opacity-60'
                    : 'bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/50 border-t-0'
                    }`}
                style={{ width: side ? '18px' : '32px', height: '20px' }}
            >
                {/* Zipper + logo (front only) */}
                {!side && <>
                    <div className={`absolute left-1/2 -translate-x-1/2 w-px h-full ${isDead ? 'bg-gray-600' : 'bg-sz-red/15'}`} />
                    {!isDead && <div className="absolute top-0.5 left-1/2 -translate-x-1/2"><span className="text-[5px] font-black text-sz-red/40 font-orbitron leading-none">SZ</span></div>}
                </>}

                {/* Arms — side: one front, front: both sides */}
                {side ? (
                    <div className={`absolute -right-1 top-0 w-1.5 h-4 rounded-b-md z-10 ${isDead ? 'bg-zinc-800' : 'bg-zinc-700 border border-zinc-600/50'}`}
                        style={{ transformOrigin: 'top center', animation: !isDead ? 'skillerArmRight 0.5s ease-in-out infinite' : 'none' }}
                    />
                ) : (
                    <>
                        <div className={`absolute -left-1.5 top-0 w-1.5 h-4 rounded-b-md ${isDead ? 'bg-zinc-800' : 'bg-zinc-800 border border-zinc-700/30'}`} />
                        <div className={`absolute -right-1.5 top-0 w-1.5 h-4 rounded-b-md ${isDead ? 'bg-zinc-800' : 'bg-zinc-800 border border-zinc-700/30'}`} />
                    </>
                )}

                {/* RGB strip */}
                {!isDead && <div className="absolute bottom-0 left-0.5 right-0.5 h-px rounded-full" style={{ background: `linear-gradient(90deg, ${eyeColor}33, transparent, ${eyeColor}33)` }} />}
            </div>

            {/* ─── LEGS ─── */}
            <div className={`flex -mt-px ${side ? 'gap-0 justify-end pr-0.5' : 'gap-0.5 justify-center'}`}>
                {/* Front view: both legs static */}
                {!side && (
                    <div className={`w-1.5 h-3 rounded-b-sm ${isDead ? 'bg-gray-700' : 'bg-zinc-700 border-x border-b border-zinc-600/30'}`}>
                        <div className={`w-2 h-1 rounded-sm mt-2 -ml-0.5 ${isDead ? 'bg-gray-600' : 'bg-zinc-600'}`} />
                    </div>
                )}
                {/* Front leg (always visible, animated when side) */}
                <div className={`w-1.5 h-3 rounded-b-sm ${isDead ? 'bg-gray-700' : 'bg-zinc-700 border-x border-b border-zinc-600/30'}`}
                    style={{ transformOrigin: 'top center', animation: side && !isDead ? 'skillerLegLeft 0.5s ease-in-out infinite' : 'none' }}
                >
                    <div className={`w-2 h-1 rounded-sm mt-2 ${side ? '' : '-ml-0.5'} ${isDead ? 'bg-gray-600' : 'bg-zinc-600'}`} />
                </div>
                {/* Back leg (side only, offset behind) */}
                {side && (
                    <div className={`w-1.5 h-3 rounded-b-sm -ml-1 ${isDead ? 'bg-gray-700' : 'bg-zinc-600 border-x border-b border-zinc-500/20'}`}
                        style={{ transformOrigin: 'top center', animation: !isDead ? 'skillerLegRight 0.5s ease-in-out infinite' : 'none', zIndex: -1 }}
                    >
                        <div className={`w-2 h-1 rounded-sm mt-2 ${isDead ? 'bg-gray-600' : 'bg-zinc-500'}`} />
                    </div>
                )}
            </div>

            {/* ─── WEATHER FX ─── */}
            {!isDead && weather === 'storm' && <div className="absolute -top-1 -right-2 text-[8px] animate-pulse z-30">⚡</div>}
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// SNOW PARTICLES
// ═══════════════════════════════════════════════════════

const SnowParticles: React.FC = () => (
    <div className="absolute -top-8 -left-4 w-20 h-12 pointer-events-none overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
            <div
                key={i}
                className="absolute text-[6px] text-white opacity-60"
                style={{
                    left: `${10 + i * 18}%`,
                    animation: `skillerSnowfall ${1.5 + Math.random()}s linear ${Math.random() * 1.5}s infinite`,
                }}
            >
                ❄
            </div>
        ))}
    </div>
);

// ═══════════════════════════════════════════════════════
// EXPLOSION EFFECT
// ═══════════════════════════════════════════════════════

const ExplosionEffect: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * 360;
            const distance = 30 + Math.random() * 20;
            return (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-sz-red rounded-full animate-ping"
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${Math.cos(angle * Math.PI / 180) * distance}px, ${Math.sin(angle * Math.PI / 180) * distance}px)`,
                        animationDuration: `${0.3 + Math.random() * 0.3}s`,
                        animationIterationCount: 1,
                        opacity: 0.8,
                    }}
                />
            );
        })}
    </div>
);

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

interface SkillerAvatarProps {
    onChatOpen: () => void;
}

const SkillerAvatar: React.FC<SkillerAvatarProps> = ({ onChatOpen }) => {
    // Position & movement
    const [posX, setPosX] = useState(50); // percentage across the screen
    const [targetX, setTargetX] = useState(70);
    const [facingLeft, setFacingLeft] = useState(false);
    const [isWalking, setIsWalking] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    // UI state
    const [bubble, setBubble] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [mood, setMood] = useState<string>('CHILL');
    const [visible, setVisible] = useState(true);
    const [ghostVisible, setGhostVisible] = useState(true);

    // Shoot-down
    const [isShotDown, setIsShotDown] = useState(false);
    const [isPeeking, setIsPeeking] = useState(false);
    const [showExplosion, setShowExplosion] = useState(false);
    const [longPressProgress, setLongPressProgress] = useState(0);

    // Weather
    const [weather, setWeather] = useState<WeatherCondition>('unknown');

    // News phrases from daily feed
    const [newsPhrases, setNewsPhrases] = useState<string[]>([]);

    // Mobile
    const [isMobile, setIsMobile] = useState(false);

    // Refs
    const animRef = useRef<number>(0);
    const bubbleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const moveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const longPressStart = useRef<number>(0);
    const progressInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    // ─── INIT ────────────────────────────────────────────
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!getAnimationsEnabled()) setVisible(false);
    }, []);

    // ─── WEATHER ─────────────────────────────────────────
    useEffect(() => {
        getWeather().then(w => setWeather(w.condition)).catch(() => { });
        const interval = setInterval(() => {
            getWeather().then(w => setWeather(w.condition)).catch(() => { });
        }, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // ─── NEWS PHRASES ───────────────────────────────────
    useEffect(() => {
        getDailyAiFeed().then(msgs => {
            if (msgs.length > 0) {
                // Use the feed messages as news-style phrases
                const phrases = msgs
                    .map(m => `🎮 ${m.msg}`)
                    .slice(0, 8);
                setNewsPhrases(phrases);
            }
        }).catch(() => { });
    }, []);

    // ─── MOOD (time-based) ───────────────────────────────
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 3 && hour < 7) setMood('TIRED');
        else if (hour >= 7 && hour < 12) setMood('CHILL');
        else if (hour >= 18 && hour < 23) setMood('HYPE');
        else if (hour >= 23 || hour < 3) setMood('TILT');
        else setMood('FOCUS');
    }, []);

    // ─── DESKTOP: WALKING MOVEMENT ──────────────────────
    useEffect(() => {
        if (!visible || isMobile || isShotDown) return;

        const pickTarget = () => {
            // Walk to a random spot, biased away from current position
            const margin = 5;
            let newX: number;
            do {
                newX = margin + Math.random() * (90 - margin);
            } while (Math.abs(newX - posX) < 15); // Ensure movement is visible

            setTargetX(newX);
            setIsWalking(true);
            setIsPaused(false);
        };

        const cycle = () => {
            if (isPaused) {
                // After pause, start walking again
                pickTarget();
                moveTimer.current = setTimeout(cycle, 15000 + Math.random() * 10000);
            } else {
                // Pause for a moment (idle)
                setIsWalking(false);
                setIsPaused(true);
                moveTimer.current = setTimeout(cycle, 8000 + Math.random() * 7000);
            }
        };

        moveTimer.current = setTimeout(cycle, 10000 + Math.random() * 8000);
        return () => { if (moveTimer.current) clearTimeout(moveTimer.current); };
    }, [visible, isMobile, isShotDown, isPaused, posX]);

    // Ref to track current position for facing direction
    const posXRef = useRef(posX);
    useEffect(() => { posXRef.current = posX; }, [posX]);

    // ─── SMOOTH ANIMATION (desktop) ─────────────────────
    useEffect(() => {
        if (!visible || isMobile || isShotDown) return;

        const animate = () => {
            const currentPos = posXRef.current;
            const diff = targetX - currentPos;

            if (Math.abs(diff) < 0.3) {
                setIsWalking(false);
                setPosX(targetX);
            } else {
                // Face the direction of movement
                setFacingLeft(diff < 0);
                const newPos = currentPos + diff * 0.03;
                setPosX(newPos);
            }
            animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animRef.current);
    }, [targetX, visible, isMobile, isShotDown]);

    // ─── GHOST VISIBILITY (mobile only) ──────────────────
    useEffect(() => {
        if (!visible || isShotDown || !isMobile) return;
        let timeout: ReturnType<typeof setTimeout>;
        const cycle = () => {
            setGhostVisible(prev => {
                if (prev) {
                    timeout = setTimeout(cycle, 5000 + Math.random() * 3000);
                } else {
                    timeout = setTimeout(cycle, 40000 + Math.random() * 10000);
                }
                return !prev;
            });
        };
        timeout = setTimeout(cycle, 5000 + Math.random() * 10000);
        return () => clearTimeout(timeout);
    }, [visible, isShotDown, isMobile]);

    // ─── PEEKING (shot down) ─────────────────────────────
    useEffect(() => {
        if (!isShotDown || !visible) return;
        let timeout: ReturnType<typeof setTimeout>;
        const peekCycle = () => {
            setIsPeeking(true);
            timeout = setTimeout(() => {
                setIsPeeking(false);
                const nextDelay = isMobile ? 40000 + Math.random() * 10000 : 30000 + Math.random() * 30000;
                timeout = setTimeout(peekCycle, nextDelay);
            }, 3000 + Math.random() * 2000);
        };
        timeout = setTimeout(peekCycle, 5000 + Math.random() * 5000);
        return () => clearTimeout(timeout);
    }, [isShotDown, visible, isMobile]);

    // ─── SPEECH BUBBLES ──────────────────────────────────
    useEffect(() => {
        if (!visible || isShotDown) return;
        if (isMobile) return; // No bubbles on mobile

        const showBubble = () => {
            if (isHovered) return;
            // 20% news, 30% weather, 50% idle
            const roll = Math.random();
            let phrases: string[];
            if (roll < 0.2 && newsPhrases.length > 0) {
                phrases = newsPhrases;
            } else if (roll < 0.5 && weather !== 'unknown') {
                phrases = WEATHER_PHRASES[weather];
            } else {
                phrases = IDLE_PHRASES;
            }
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            setBubble(phrase);
            setTimeout(() => setBubble(null), 4000);
            bubbleTimer.current = setTimeout(showBubble, 12000 + Math.random() * 15000);
        };

        bubbleTimer.current = setTimeout(showBubble, 5000 + Math.random() * 5000);
        return () => { if (bubbleTimer.current) clearTimeout(bubbleTimer.current); };
    }, [visible, isHovered, isShotDown, isMobile, weather]);

    // ─── LONG-PRESS → SHOOT DOWN ─────────────────────────
    const handlePressStart = useCallback(() => {
        longPressStart.current = Date.now();
        setLongPressProgress(0);

        progressInterval.current = setInterval(() => {
            const elapsed = Date.now() - longPressStart.current;
            setLongPressProgress(Math.min(elapsed / 1000, 1));
        }, 30);

        longPressTimer.current = setTimeout(() => {
            if (progressInterval.current) clearInterval(progressInterval.current);
            setLongPressProgress(0);
            setShowExplosion(true);
            setBubble(SHOT_PHRASES[Math.floor(Math.random() * SHOT_PHRASES.length)]);

            try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } catch { /* Audio not available */ }

            setTimeout(() => {
                setShowExplosion(false);
                setBubble(null);
                setGhostVisible(false);
                setIsShotDown(true);
                setIsWalking(false);
            }, 800);
        }, 1000);
    }, []);

    const handlePressEnd = useCallback(() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (progressInterval.current) clearInterval(progressInterval.current);
        setLongPressProgress(0);
    }, []);

    const handleClick = useCallback(() => {
        if (isShotDown && isPeeking) {
            setIsShotDown(false);
            setIsPeeking(false);
            setGhostVisible(true);
            setBubble('Jsem zpět! 🔄');
            setTimeout(() => setBubble(null), 2000);
            return;
        }
        setBubble(null);
        onChatOpen();
    }, [onChatOpen, isShotDown, isPeeking]);

    if (!visible) return null;

    // ─── PEEKING STATE (shot down) ───────────────────────
    if (isShotDown) {
        return (
            <div
                className={`fixed z-[90] transition-all duration-700 ease-out cursor-pointer ${isPeeking ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={isMobile ? {
                    left: '50%',
                    top: isPeeking ? '0px' : '-60px',
                    transform: 'translateX(-50%)',
                    transition: 'top 700ms ease, opacity 700ms ease',
                } : {
                    right: isPeeking ? '-8px' : '-60px',
                    top: '40%',
                    transition: 'right 700ms ease, opacity 700ms ease',
                }}
            >
                <button
                    onClick={handleClick}
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    className="pointer-events-auto hover:scale-110 transition-transform"
                    title="Klikni pro obnovení Skillera"
                    aria-label="Restore Skiller"
                >
                    <SkillerCharacter mood={mood} isDead />
                </button>
                {isPeeking && (
                    <div className={`absolute whitespace-nowrap pointer-events-none text-[10px] font-mono text-gray-500 ${isMobile ? 'left-1/2 -translate-x-1/2 top-full mt-1' : 'right-full mr-2 top-1/2 -translate-y-1/2'}`}>
                        Klikni → obnov mě
                    </div>
                )}
            </div>
        );
    }

    // ─── MOBILE PEEK MODE ────────────────────────────────
    if (isMobile) {
        return (
            <div
                className={`fixed z-[90] left-1/2 transition-all duration-500 ease-out ${ghostVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{
                    top: ghostVisible ? '0px' : '-60px',
                    transform: 'translateX(-50%)',
                    transition: 'top 500ms ease, opacity 500ms ease',
                }}
            >
                <button
                    onClick={handleClick}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    className="pointer-events-auto relative"
                    title="Chat se Skillerem"
                    aria-label="Open chat with Skiller"
                >
                    <SkillerCharacter mood={mood} weather={weather} />
                    {showExplosion && <ExplosionEffect />}
                    {longPressProgress > 0 && longPressProgress < 1 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg className="w-14 h-14" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(227,30,36,0.3)" strokeWidth="3" />
                                <circle cx="28" cy="28" r="24" fill="none" stroke="#e31e24" strokeWidth="3"
                                    strokeDasharray={`${longPressProgress * 150.8} 150.8`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 28 28)"
                                />
                            </svg>
                        </div>
                    )}
                </button>
                {bubble && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="bg-black/90 border border-sz-red/40 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-lg">
                            {bubble}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── DESKTOP: WALKING ON LIVEFEED BAR ────────────────
    return (
        <div
            className="fixed z-[90] transition-none"
            style={{
                bottom: '32px', // just above the h-8 LiveFeed bar
                left: `${posX}%`,
                transform: 'translateX(-50%)',
            }}
        >
            {/* Speech Bubble — only when standing still */}
            {((bubble && !isWalking) || isHovered) && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-black/90 border border-sz-red/40 text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg relative max-w-[300px] whitespace-nowrap text-center">
                        {isHovered ? 'Click → Chat 💬 | Hold → 💥' : bubble}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-sz-red/40 rotate-45" />
                    </div>
                </div>
            )}

            {showExplosion && <ExplosionEffect />}

            {/* Long-press progress ring */}
            {longPressProgress > 0 && longPressProgress < 1 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <svg className="w-16 h-16" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(227,30,36,0.2)" strokeWidth="3" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#e31e24" strokeWidth="3"
                            strokeDasharray={`${longPressProgress * 175.9} 175.9`}
                            strokeLinecap="round"
                            transform="rotate(-90 32 32)"
                        />
                    </svg>
                </div>
            )}

            {/* Snow particles */}
            {weather === 'snow' && <SnowParticles />}

            {/* Avatar body */}
            <button
                onClick={handleClick}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={(e) => { setIsHovered(false); handlePressEnd(); }}
                onMouseEnter={() => setIsHovered(true)}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                className={`pointer-events-auto cursor-pointer transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'} hover:drop-shadow-[0_0_16px_rgba(227,30,36,0.6)] flex flex-col items-center`}
                title="Chat se Skillerem (drž 1s → sestřel)"
                aria-label="Open chat with Skiller"
                style={{
                    // Walking bobble effect
                    animation: isWalking ? 'skillerBobble 0.4s ease-in-out infinite' : 'none',
                }}
            >
                <SkillerCharacter mood={mood} weather={weather} facingLeft={facingLeft} isWalking={isWalking} />
            </button>
        </div>
    );
};

export default SkillerAvatar;
