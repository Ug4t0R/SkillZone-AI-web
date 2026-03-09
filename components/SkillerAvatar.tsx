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
 * v2: + time-based phrases, hover glow, unread badge, time-on-site reaction,
 *       wave-back on mouse leave, walking dust, emotes, double-click dance
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAnimationsEnabled } from '../utils/storage/animations';
import { getWeather, WeatherCondition } from '../services/weatherService';
import { getDailyAiFeed } from '../utils/storage/chat';
import { SkillerCharacter, SnowParticles, ExplosionEffect } from './skilleravatar/SkillerCharacter';

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
    'noob spotted? nie, jsem tu já! 😏',
    'Cursor na mě? sheesh 👀',
];

/** Fráze závislé na čase */
function getTimePhrases(): string[] {
    const h = new Date().getHours();
    if (h >= 5 && h < 9) return [
        '☀️ Dobré ráno, early bird!',
        'Ráno = quest accepted ☕',
        'Ranní grind je OP, trust me',
    ];
    if (h >= 9 && h < 12) return [
        'Dopolední session? To je dedikace 🎮',
        'School skip? Respekt. 👑',
    ];
    if (h >= 12 && h < 14) return [
        '🍕 Obědová pauza? Nebo rovnou gaming?',
        'Lunch break gaming hits different',
    ];
    if (h >= 22 && h < 24) return [
        '🌙 Noční grind, klasika',
        'Večer, kdy rank čeká…',
        'Late night? Ty jsi hardcore 😤',
    ];
    if (h >= 0 && h < 4) return [
        '😴 Co...? Je skoro ráno, jdeš spát?',
        '🌑 Půlnoční grind detected. Respect.',
        'Tvoji rodiče spí. My grindíme. gg',
    ];
    return [];
}

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

const WAVE_BACK_PHRASES = [
    'Vrať se! 👋',
    'Hej, kam jdeš? 👀',
    'Don\'t leave me bro 😤',
    'Čau čau… nebo se vrátíš? 🥺',
];

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

interface SkillerAvatarProps {
    onChatOpen: () => void;
    hasUnread?: boolean;
}

const SkillerAvatar: React.FC<SkillerAvatarProps> = ({ onChatOpen, hasUnread = false }) => {
    // Position & movement
    const [posX, setPosX] = useState(50);
    const [targetX, setTargetX] = useState(70);
    const [facingLeft, setFacingLeft] = useState(false);
    const [isWalking, setIsWalking] = useState(false);
    const [isPaused, setIsPaused] = useState(true);

    // UI state
    const [bubble, setBubble] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [mood, setMood] = useState<string>('CHILL');
    const [visible, setVisible] = useState(true);
    const [ghostVisible, setGhostVisible] = useState(true);

    // Elevator state (desktop) — 'hidden' | 'half' (just eyes peek) | 'full' (fully risen)
    const [isElevated, setIsElevated] = useState<'hidden' | 'half' | 'full'>('hidden');

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

    // v2: idle actions
    const [action, setAction] = useState<'dance' | 'jump' | 'wave' | 'sit' | null>(null);
    const lastClickTime = useRef(0);
    const hoverLeaveTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Refs
    const animRef = useRef<number>(0);
    const bubbleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const moveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const longPressStart = useRef<number>(0);
    const progressInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const elevatorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ─── INIT ────────────────────────────────────────────
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ─── SCROLL REACTION (Desktop only) ─────────────────
    useEffect(() => {
        if (!visible || isMobile || isShotDown) return;

        let scrollTimeout: ReturnType<typeof setTimeout>;
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const diff = Math.abs(currentScrollY - lastScrollY);

            if (diff > 50 && isElevated === 'full') {
                setIsWalking(false);
                setIsPaused(true);
                setFacingLeft(false);
                setBubble("Kampak scrolluješ? 👀");

                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    setBubble(null);
                    setIsPaused(false);
                }, 3000);
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [visible, isMobile, isShotDown, isElevated]);

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

    // ─── NEWS PHRASES ────────────────────────────────────
    useEffect(() => {
        getDailyAiFeed().then(msgs => {
            if (msgs.length > 0) {
                const phrases = msgs.map(m => `🎮 ${m.msg}`).slice(0, 8);
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

    // ─── TIME ON SITE reaction (after 2 min) ─────────────
    useEffect(() => {
        if (!visible || isShotDown) return;
        const t = setTimeout(() => {
            setBubble('Líbí se ti tu, co? 😏');
            setTimeout(() => setBubble(null), 4000);
        }, 2 * 60 * 1000);
        return () => clearTimeout(t);
    }, [visible, isShotDown]);

    // ─── ELEVATOR CYCLE (desktop) ────────────────────────
    // Cycle: hidden → (half-peek or full rise, random) → hidden → repeat
    useEffect(() => {
        if (!visible || isMobile || isShotDown) return;

        const scheduleElevator = () => {
            // Hidden phase: wait 20-50s, then rise
            const hideDelay = 20000 + Math.random() * 30000;
            elevatorTimer.current = setTimeout(() => {
                const surfaceX = 15 + Math.random() * 70;
                setPosX(surfaceX);
                setTargetX(surfaceX);
                setIsWalking(false);
                setIsPaused(true);

                // 30% chance of half-peek, 70% full rise
                const doHalfPeek = Math.random() < 0.3;

                if (doHalfPeek) {
                    // Half-peek: just eyes peeking out for 4-8s
                    setIsElevated('half');
                    const peekPhrases = ['👀', '...', '🤫', '👁️'];
                    setBubble(peekPhrases[Math.floor(Math.random() * peekPhrases.length)]);
                    const peekDuration = 4000 + Math.random() * 4000;
                    elevatorTimer.current = setTimeout(() => {
                        setIsElevated('hidden');
                        setBubble(null);
                        // Sometimes follow half-peek with full rise
                        if (Math.random() < 0.5) {
                            elevatorTimer.current = setTimeout(() => {
                                setPosX(surfaceX);
                                setTargetX(surfaceX);
                                setIsElevated('full');
                                const arrivalPhrases = ['Tak hele, jsem tu! 😄', 'Neodolal jsem 😏', 'Ok ok, jdu ven 🚀'];
                                setBubble(arrivalPhrases[Math.floor(Math.random() * arrivalPhrases.length)]);
                                setTimeout(() => setBubble(null), 3000);
                                const showDuration = 10000 + Math.random() * 20000;
                                elevatorTimer.current = setTimeout(() => {
                                    setIsElevated('hidden');
                                    setIsWalking(false);
                                    setIsPaused(true);
                                    setBubble(null);
                                    setTimeout(() => scheduleElevator(), 800);
                                }, showDuration);
                            }, 2000 + Math.random() * 3000);
                        } else {
                            setTimeout(() => scheduleElevator(), 800);
                        }
                    }, peekDuration);
                } else {
                    // Full rise
                    setIsElevated('full');
                    const arrivalPhrases = ['Čau! 👋', 'Skiller tu! 🟢', 'Někdo volal? 😏', 'Yo! 🎮', '🔔 *ding*'];
                    setBubble(arrivalPhrases[Math.floor(Math.random() * arrivalPhrases.length)]);
                    setTimeout(() => setBubble(null), 3000);
                    const showDuration = 10000 + Math.random() * 20000;
                    elevatorTimer.current = setTimeout(() => {
                        setIsElevated('hidden');
                        setIsWalking(false);
                        setIsPaused(true);
                        setBubble(null);
                        setTimeout(() => scheduleElevator(), 800);
                    }, showDuration);
                }
            }, hideDelay);
        };

        // First appearance: show quickly (3-8s after load)
        const initialDelay = 3000 + Math.random() * 5000;
        elevatorTimer.current = setTimeout(() => {
            const surfaceX = 20 + Math.random() * 60;
            setPosX(surfaceX);
            setTargetX(surfaceX);
            setIsElevated('full');
            setIsPaused(true);

            const showDuration = 15000 + Math.random() * 15000;
            elevatorTimer.current = setTimeout(() => {
                setIsElevated('hidden');
                setIsWalking(false);
                setIsPaused(true);
                setBubble(null);
                setTimeout(() => scheduleElevator(), 800);
            }, showDuration);
        }, initialDelay);

        return () => { if (elevatorTimer.current) clearTimeout(elevatorTimer.current); };
    }, [visible, isMobile, isShotDown]);

    // ─── DESKTOP: WALKING MOVEMENT (only when fully elevated) ──
    useEffect(() => {
        if (!visible || isMobile || isShotDown || isElevated !== 'full') return;

        const pickTarget = () => {
            const margin = 5;
            let newX: number;
            do {
                newX = margin + Math.random() * (90 - margin);
            } while (Math.abs(newX - posX) < 15);
            setTargetX(newX);
            setIsWalking(true);
            setIsPaused(false);
        };

        const cycle = () => {
            if (isPaused) {
                pickTarget();
                moveTimer.current = setTimeout(cycle, 8000 + Math.random() * 6000);
            } else {
                setIsWalking(false);
                setIsPaused(true);
                moveTimer.current = setTimeout(cycle, 4000 + Math.random() * 4000);
            }
        };

        moveTimer.current = setTimeout(cycle, 3000 + Math.random() * 3000);
        return () => { if (moveTimer.current) clearTimeout(moveTimer.current); };
    }, [visible, isMobile, isShotDown, isPaused, posX, isElevated]);

    // ─── IDLE ANIMATIONS (only when elevated) ────────────
    useEffect(() => {
        if (!visible || isMobile || isShotDown || isWalking || isHovered || !isPaused || isElevated !== 'full') return;
        let timeout: ReturnType<typeof setTimeout>;

        const doAction = () => {
            const actions: ('jump' | 'wave' | 'sit')[] = ['jump', 'wave', 'sit'];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];

            if (randomAction === 'jump' && mood !== 'HYPE' && Math.random() > 0.3) {
                timeout = setTimeout(doAction, 5000 + Math.random() * 10000);
                return;
            }

            setAction(randomAction);
            let duration = 0;
            if (randomAction === 'jump') duration = 1200;
            else if (randomAction === 'wave') duration = 1800;
            else if (randomAction === 'sit') duration = 4000;

            setTimeout(() => {
                setAction(null);
            }, duration);

            timeout = setTimeout(doAction, 10000 + Math.random() * 15000);
        };

        timeout = setTimeout(doAction, 2000 + Math.random() * 5000);
        return () => clearTimeout(timeout);
    }, [visible, isMobile, isShotDown, isWalking, isHovered, mood, isPaused, isElevated]);

    const posXRef = useRef(posX);
    useEffect(() => { posXRef.current = posX; }, [posX]);

    // ─── SMOOTH ANIMATION (desktop) ─────────────────────
    useEffect(() => {
        if (!visible || isMobile || isShotDown || isElevated !== 'full') return;

        const animate = () => {
            const currentPos = posXRef.current;
            const diff = targetX - currentPos;
            if (Math.abs(diff) < 0.3) {
                setIsWalking(false);
                setPosX(targetX);
            } else {
                setFacingLeft(diff < 0);
                const newPos = currentPos + diff * 0.03;
                setPosX(newPos);
            }
            animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animRef.current);
    }, [targetX, visible, isMobile, isShotDown, isElevated]);

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

    // ─── SPEECH BUBBLES (only when elevated) ─────────────
    useEffect(() => {
        if (!visible || isShotDown || isElevated === 'hidden') return;
        if (isMobile) return;

        const showBubble = () => {
            if (isHovered) return;
            const roll = Math.random();
            let phrases: string[];
            const timePhrases = getTimePhrases();
            if (roll < 0.2 && newsPhrases.length > 0) {
                phrases = newsPhrases;
            } else if (roll < 0.35 && timePhrases.length > 0) {
                phrases = timePhrases;
            } else if (roll < 0.65 && weather !== 'unknown') {
                phrases = WEATHER_PHRASES[weather];
            } else {
                phrases = IDLE_PHRASES;
            }
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            setBubble(phrase);
            setTimeout(() => setBubble(null), 4000);
            bubbleTimer.current = setTimeout(showBubble, 8000 + Math.random() * 8000);
        };

        bubbleTimer.current = setTimeout(showBubble, 3000 + Math.random() * 3000);
        return () => { if (bubbleTimer.current) clearTimeout(bubbleTimer.current); };
    }, [visible, isHovered, isShotDown, isMobile, weather, isElevated]);

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
                setIsElevated('hidden');
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

    // ─── CLICK: double-click dance, restore, chat ────────
    const handleClick = useCallback(() => {
        const now = Date.now();
        // Double-click → dance easter egg
        if (now - lastClickTime.current < 400 && !isShotDown) {
            lastClickTime.current = 0;
            setAction('dance');
            setBubble('🕺 lets gooo!');
            setTimeout(() => { setAction(null); setBubble(null); }, 2000);
            return;
        }
        lastClickTime.current = now;

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

    // ─── WAVE BACK on mouse leave after hover ────────────
    const handleMouseEnter = useCallback(() => {
        if (hoverLeaveTimeout.current) clearTimeout(hoverLeaveTimeout.current);
        setIsHovered(true);
        if (!isShotDown && action !== 'dance') {
            setBubble('Ooo, koukáš? 👀 | Hold → 💥 | 2× → 🕺');
        }
    }, [isShotDown, action]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        handlePressEnd();
        hoverLeaveTimeout.current = setTimeout(() => {
            if (!isShotDown) {
                const phrase = WAVE_BACK_PHRASES[Math.floor(Math.random() * WAVE_BACK_PHRASES.length)];
                setBubble(phrase);
                setTimeout(() => setBubble(null), 3000);
            }
        }, 800);
    }, [handlePressEnd, isShotDown]);

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
                    onMouseLeave={() => setShowExplosion(false)}
                    className="pointer-events-auto relative cursor-pointer outline-none select-none"
                    title="Chat se Skillerem"
                    aria-label="Open chat with Skiller"
                >
                    <SkillerCharacter mood={mood} weather={weather} action={action} />
                    {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-sz-red rounded-full border border-black animate-pulse z-50" />
                    )}
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
                        <div className="bg-white/95 dark:bg-black/90 border border-sz-red/40 text-gray-900 dark:text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-lg">
                            {bubble}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── DESKTOP: ELEVATOR FROM STATUS BAR ───────────────
    // The avatar is clipped by an overflow:hidden container anchored
    // to the LiveFeed bar. translateY controls the rise/sink animation.
    // Character height is ~60px. When hidden, translateY pushes it below the clip.
    const avatarHeight = 70; // px — total character height including bubble space

    // Calculate translateY based on elevator state
    const getTranslateY = () => {
        switch (isElevated) {
            case 'full': return '0px';
            case 'half': return `${avatarHeight - 18}px`; // only top ~18px visible (eyes+head)
            case 'hidden': return `${avatarHeight + 30}px`; // +30 guarantees mood emoji is fully hidden
        }
    };

    return (
        <>
            {/* Speech Bubble — OUTSIDE the clip container so it's never cut off */}
            {bubble && (!isWalking || isHovered || isElevated !== 'full') && (
                <div
                    className="fixed z-[91] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200"
                    style={{
                        bottom: isElevated === 'full'
                            ? `${32 + avatarHeight + 8}px`
                            : isElevated === 'half'
                                ? `${32 + 22}px`
                                : `${32 + 4}px`,
                        left: `${posX}%`,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div className="bg-white/95 dark:bg-black/90 border border-sz-red/40 text-gray-900 dark:text-white text-[11px] font-mono px-3 py-1.5 rounded-lg shadow-lg relative max-w-[300px] whitespace-nowrap text-center leading-relaxed">
                        {bubble}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/95 dark:bg-black/90 border-r border-b border-sz-red/40 rotate-45" />
                    </div>
                </div>
            )}

            {/* Elevator shaft — clipping container above the LiveFeed bar */}
            <div
                className="fixed z-[90] pointer-events-none"
                style={{
                    bottom: '32px',
                    left: `${posX}%`,
                    transform: 'translateX(-50%)',
                    height: `${avatarHeight}px`,
                    width: '80px',
                    overflow: 'hidden',
                }}
            >
                {/* Inner elevator carriage — slides up/down */}
                <div
                    className="absolute bottom-0 left-1/2 pointer-events-auto"
                    style={{
                        transform: `translateX(-50%) translateY(${getTranslateY()})`,
                        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
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

                    {/* Unread badge */}
                    {hasUnread && !isHovered && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-sz-red rounded-full border border-black animate-pulse z-50" />
                    )}

                    {/* Avatar body */}
                    <button
                        onClick={handleClick}
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handleMouseLeave}
                        onMouseEnter={handleMouseEnter}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        className={`pointer-events-auto cursor-pointer transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'} flex flex-col items-center`}
                        title="Chat se Skillerem (drž 1s → sestřel, 2× klik → 🕺)"
                        aria-label="Open chat with Skiller"
                        style={{
                            animation: isWalking && action !== 'dance' ? 'skillerBobble 0.4s ease-in-out infinite' : 'none',
                        }}
                    >
                        <SkillerCharacter
                            mood={mood}
                            weather={weather}
                            facingLeft={facingLeft}
                            isWalking={isWalking}
                            isHovered={isHovered}
                            action={action}
                        />
                    </button>
                </div>
            </div>

            {/* Hatch door indicator on the LiveFeed bar */}
            <div
                className="fixed z-[89] pointer-events-none"
                style={{
                    bottom: '32px',
                    left: `${posX}%`,
                    transform: 'translateX(-50%)',
                    transition: 'left 0.3s ease-out, opacity 0.5s ease',
                    opacity: isElevated !== 'hidden' ? 1 : 0,
                }}
            >
                <div className="w-10 h-[2px] bg-gradient-to-r from-transparent via-sz-red/40 to-transparent" />
            </div>
        </>
    );
};

export default SkillerAvatar;
