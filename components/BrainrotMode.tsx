// Gen Z Brainrot Mode 🧠💀
// Overstimulation core — every sense attacked, but still readable
import React, { useEffect, useState, useRef } from 'react';

// ═══════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════

const EMOJIS = ['💀', '🔥', '🗿', '💯', '😂', '👀', '⚡', '🎮', '🧠', '👑', '🫡', '😈', '🥶', '🤯', '✨'];

const SIGMA_QUOTES = [
    "Don't be a beta, visit SkillZone 💪",
    "Grind never stops. Neither do we. 🫡",
    "Average gamer: sleeps. Sigma gamer: SkillZone 24/7.",
    "They laughed at my 500h on Steam. Now they pay to watch me.",
    "No days off. Only GG's. 🔥",
    "While you were sleeping, I was ranking up.",
    "Hustle in silence. Let your KDA speak. 🗿",
    "Success is a choice. So is SkillZone.",
    "Built different. Plays different. 👑",
    "The grindset is not a phase, mom.",
    "I don't touch grass. Grass touches me. 😤",
    "Solo queue mentality. Sigma mindset.",
    "They called it addiction. I call it dedication.",
    "Every W starts at SkillZone.",
    "Wake up → SkillZone → Repeat 🔄",
];

const ACHIEVEMENTS = [
    { text: '+1000 Aura ⭐', color: 'from-yellow-500 to-orange-500' },
    { text: 'Social Credit +15 📈', color: 'from-red-500 to-pink-500' },
    { text: 'You are the Rizzler 👑', color: 'from-purple-500 to-pink-500' },
    { text: 'W Rizz Unlocked 🔓', color: 'from-cyan-500 to-blue-500' },
    { text: '+500 Ohio Points 💀', color: 'from-green-500 to-emerald-500' },
    { text: 'Sigma Status Achieved 🗿', color: 'from-zinc-500 to-zinc-700' },
    { text: 'Skibidi Level MAX 🚽', color: 'from-violet-500 to-purple-500' },
    { text: 'Fanum Tax Collected 💸', color: 'from-yellow-500 to-green-500' },
    { text: 'Main Character Energy ✨', color: 'from-pink-500 to-rose-500' },
    { text: 'Caught in 4K 📸', color: 'from-blue-500 to-indigo-500' },
    { text: 'GOAT Status 🐐', color: 'from-amber-500 to-yellow-500' },
    { text: 'No Cap Achievement 🧢', color: 'from-red-500 to-orange-500' },
];

const L_RATIO_RESPONSES = [
    'L + Ratio + No Rizz 💀',
    'Imagine trying to stop brainrot 🤡',
    'Skill issue detected 🗿',
    'Nice try, but no. 😈',
    'You fell off + cope + seethe',
    'The brainrot is eternal 🧠',
    'Denied. Ratio + L + Blocked',
    'Error 404: Rizz not found 💀',
];

// ═══════════════════════════════════════════════════════
// FLOATING EMOJI (gentle CSS, from previous version)
// ═══════════════════════════════════════════════════════

interface FloatingEmoji {
    id: number; emoji: string; x: number; delay: number; duration: number; size: number;
}

const FloatingEmojis: React.FC = () => {
    const [emojis] = useState<FloatingEmoji[]>(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            x: 5 + Math.random() * 90,
            delay: Math.random() * 8,
            duration: 14 + Math.random() * 10,
            size: 16 + Math.random() * 12,
        }))
    );

    return (
        <div className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden">
            {emojis.map(e => (
                <div
                    key={e.id}
                    className="absolute opacity-30"
                    style={{
                        left: `${e.x}%`,
                        bottom: '-40px',
                        fontSize: e.size,
                        animation: `crazyFloat ${e.duration}s ease-in-out ${e.delay}s infinite`,
                    }}
                >
                    {e.emoji}
                </div>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// SUBWAY SURFERS PiP — bottom-left corner
// ═══════════════════════════════════════════════════════

const SubwaySurfersPiP: React.FC = () => {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[9995] group">
            <div className="relative w-[120px] h-[180px] md:w-[160px] md:h-[240px] rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-purple-500/20">
                {/* Muted Subway Surfers gameplay loop */}
                <iframe
                    src="https://www.youtube.com/embed/iKggOfcKM28?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&playlist=iKggOfcKM28&playsinline=1&modestbranding=1"
                    className="w-full h-full border-0 pointer-events-none"
                    allow="autoplay; encrypted-media"
                    title="subway-surfers"
                    tabIndex={-1}
                />
                {/* Close button */}
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-1 right-1 w-6 h-6 md:w-5 md:h-5 bg-black/60 text-white rounded-full text-[10px] font-bold opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                    ✕
                </button>
                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider">
                        🏂 for your attention
                    </span>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// SIGMA QUOTE TICKER — top bar
// ═══════════════════════════════════════════════════════

const SigmaQuoteTicker: React.FC = () => {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setQuoteIndex(i => (i + 1) % SIGMA_QUOTES.length);
                setVisible(true);
            }, 400);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed top-16 md:top-[80px] left-0 right-0 z-[9992] bg-gradient-to-r from-purple-900/90 via-black/90 to-purple-900/90 backdrop-blur-sm border-b border-purple-500/20" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
            <div className={`text-center py-1 md:py-1.5 px-3 md:px-4 text-[10px] md:text-xs font-bold transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400">
                    💪 {SIGMA_QUOTES[quoteIndex]}
                </span>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// ACHIEVEMENT POPUP — slides in from right
// ═══════════════════════════════════════════════════════

const AchievementPopup: React.FC = () => {
    const [achievement, setAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const fire = () => {
            const a = ACHIEVEMENTS[Math.floor(Math.random() * ACHIEVEMENTS.length)];
            setAchievement(a);
            setShow(true);
            setTimeout(() => setShow(false), 3000);
        };

        // First one after 8s
        const initial = setTimeout(fire, 8000);
        // Then every 20-40s
        const interval = setInterval(fire, 20000 + Math.random() * 20000);

        return () => { clearTimeout(initial); clearInterval(interval); };
    }, []);

    if (!achievement) return null;

    return (
        <div className={`fixed top-16 right-2 md:right-4 z-[9999] transition-all duration-500 max-w-[calc(100vw-1rem)] ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className={`bg-gradient-to-r ${achievement.color} px-3 md:px-5 py-2 md:py-3 rounded-xl shadow-2xl border border-white/20`}>
                <div className="text-[10px] text-white/70 font-bold uppercase tracking-widest mb-0.5" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                    🏆 Achievement Unlocked
                </div>
                <div className="text-white font-black text-sm md:text-lg" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                    {achievement.text}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// AURA COUNTER — bottom-right widget
// ═══════════════════════════════════════════════════════

const AuraCounter: React.FC = () => {
    const [aura, setAura] = useState(1337);
    const lastScrollY = useRef(0);

    useEffect(() => {
        // Slowly increase with time
        const timer = setInterval(() => {
            setAura(a => a + Math.floor(Math.random() * 3) + 1);
        }, 2000);

        // Boost on scroll
        const handleScroll = () => {
            const delta = Math.abs(window.scrollY - lastScrollY.current);
            if (delta > 50) {
                setAura(a => a + Math.floor(delta / 10));
                lastScrollY.current = window.scrollY;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => { clearInterval(timer); window.removeEventListener('scroll', handleScroll); };
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-[9995]">
            <div className="bg-black/80 backdrop-blur-md border border-purple-500/30 rounded-xl px-3 md:px-4 py-2 md:py-2.5 shadow-lg shadow-purple-500/10">
                <div className="text-[9px] text-purple-400 font-bold uppercase tracking-widest mb-0.5" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                    ✨ Your Aura
                </div>
                <div className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 tabular-nums" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                    {aura.toLocaleString()}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// FAKE STOP BUTTON + REAL TOGGLE
// ═══════════════════════════════════════════════════════

const ControlButtons: React.FC<{ onRealToggle: () => void }> = ({ onRealToggle }) => {
    const [lToast, setLToast] = useState<string | null>(null);

    const handleFakeStop = () => {
        const msg = L_RATIO_RESPONSES[Math.floor(Math.random() * L_RATIO_RESPONSES.length)];
        setLToast(msg);
        setTimeout(() => setLToast(null), 2500);
    };

    return (
        <>
            {/* Fake stop button */}
            <button
                onClick={handleFakeStop}
                className="fixed top-[6.5rem] md:top-[7.5rem] left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 z-[10000] bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform border border-red-400/30"
                style={{ fontFamily: "'Comic Sans MS', cursive" }}
            >
                🛑 STOP THE BRAINROT
            </button>

            {/* L + Ratio toast */}
            {lToast && (
                <div className="fixed top-[8.5rem] md:top-[9rem] left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-20 z-[10001] animate-bounce max-w-[calc(100vw-1rem)]">
                    <div className="bg-black border-2 border-red-500 text-white font-black text-xs md:text-sm px-3 md:px-4 py-2 rounded-xl shadow-2xl" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                        {lToast}
                    </div>
                </div>
            )}
        </>
    );
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const BrainrotMode: React.FC<{ isActive: boolean; onToggle: () => void }> = ({ isActive, onToggle }) => {
    if (!isActive) return null;

    return (
        <>
            <SigmaQuoteTicker />
            <FloatingEmojis />
            <SubwaySurfersPiP />
            <AchievementPopup />
            <AuraCounter />
            <ControlButtons onRealToggle={onToggle} />
        </>
    );
};

export default BrainrotMode;
