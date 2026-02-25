// Crazy Mode — Gen Z / Brain Rot vibes 🧠
// Fun meme energy without making the page unusable
import React, { useEffect, useState, useCallback } from 'react';

const EMOJIS = ['💀', '🔥', '🗿', '💯', '😂', '👀', '⚡', '🎮', '🧠', '👑', '🫡', '😈', '🥶'];

const MEME_QUOTES = [
    'no cap fr fr',
    'skill issue 💀',
    'its giving skillzone',
    'slay bestie 💅',
    'understood the assignment',
    'main character energy',
    'rent free in my head',
    'this hits different',
    'lowkey goated',
    'bussin no cap',
    'W rizz',
    'ong this is fire',
    'we move 🫡',
    'caught in 4k',
    'living rent free',
];

interface FloatingEmoji {
    id: number;
    emoji: string;
    x: number;
    delay: number;
    duration: number;
    size: number;
}

const CrazyMode: React.FC<{ isActive: boolean; onToggle: () => void }> = ({ isActive, onToggle }) => {
    const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
    const [quote, setQuote] = useState('');
    const [quoteVisible, setQuoteVisible] = useState(false);

    // Spawn a few gentle floating emojis (CSS animated, not JS physics)
    useEffect(() => {
        if (!isActive) { setEmojis([]); return; }

        const batch: FloatingEmoji[] = Array.from({ length: 8 }, (_, i) => ({
            id: i,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            x: 5 + Math.random() * 90,
            delay: Math.random() * 8,
            duration: 12 + Math.random() * 10,
            size: 18 + Math.random() * 14,
        }));
        setEmojis(batch);
    }, [isActive]);

    // Rotate meme quotes every 6s
    useEffect(() => {
        if (!isActive) return;

        const show = () => {
            setQuote(MEME_QUOTES[Math.floor(Math.random() * MEME_QUOTES.length)]);
            setQuoteVisible(true);
            setTimeout(() => setQuoteVisible(false), 4000);
        };

        show();
        const interval = setInterval(show, 7000);
        return () => clearInterval(interval);
    }, [isActive]);

    if (!isActive) return null;

    return (
        <>
            {/* Gentle floating emojis — CSS only, no JS physics */}
            <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
                {emojis.map(e => (
                    <div
                        key={e.id}
                        className="absolute opacity-40"
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

            {/* Meme quote toast */}
            <div
                className={`fixed top-28 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-500 ${quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
                <div
                    className="bg-black/80 border border-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-lg"
                    style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}
                >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-400 to-cyan-400 font-bold text-lg">
                        {quote}
                    </span>
                </div>
            </div>

            {/* Toggle Button — no bounce, just vibes */}
            <button
                onClick={onToggle}
                className="fixed top-20 right-4 z-[10000] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-black text-sm px-4 py-2 rounded-full shadow-lg hover:scale-110 transition-transform border border-white/20"
                style={{ fontFamily: "'Comic Sans MS', cursive" }}
            >
                🧠 CRAZY OFF
            </button>

            {/* "Subscribe" watermark — subtle meme */}
            <div
                className="fixed bottom-16 right-6 z-[9999] pointer-events-none opacity-60"
                style={{ fontFamily: "'Comic Sans MS', cursive" }}
            >
                <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500">
                    ⬇️ SUBSCRIBE & SMASH LIKE ⬇️
                </div>
            </div>
        </>
    );
};

export default CrazyMode;
