/**
 * ComingSoon — Epic "Work in Progress" landing page.
 * Toggleable via Supabase setting. Shows countdown timer, hype messaging,
 * branch contacts with Google Maps + WhatsApp links, and particle effects.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Globe, Lock, Unlock, User, Smartphone } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAppContext } from '../context/AppContext';

// ─── Branch Contacts (same as MaintenanceMode) ──────────────────────
const BRANCHES = [
    {
        name: 'SkillZone Žižkov — Nonstop',
        address: 'Orebitská 630/4, Praha 3',
        phone: '+420 777 766 113',
        hours: 'NONSTOP 24/7',
        emoji: '🔴',
        maps: 'https://maps.app.goo.gl/QXsEJ7R7yR7KM6cZ6',
        wa: 'https://wa.me/420777766113',
    },
    {
        name: 'SkillZone Háje',
        address: 'Arkalycká 877/4, Praha 4',
        phone: '+420 777 766 114',
        hours: '12:00 – 03:00',
        emoji: '🟢',
        maps: 'https://maps.app.goo.gl/eUPW2HhSJxqMDGFq9',
        wa: 'https://wa.me/420777766114',
    },
    {
        name: 'SkillZone Stodůlky',
        address: 'Mukařovského 1986/7, Praha 5',
        phone: '+420 777 766 115',
        hours: '13:00 – 23:00',
        emoji: '🔵',
        maps: 'https://maps.app.goo.gl/B4vN6RwTi3Q7DPXHA',
        wa: 'https://wa.me/420777766115',
        isNew: true,
    },
];

// ─── Particle Background ─────────────────────────────────────────────
const ParticleCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const particles: Array<{
            x: number; y: number; vx: number; vy: number;
            size: number; alpha: number; color: string;
        }> = [];

        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2.5 + 0.5,
                alpha: Math.random() * 0.4 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        let animId = 0;
        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            // Connection lines
            ctx.globalAlpha = 0.03;
            ctx.strokeStyle = '#ef4444';
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    if (Math.abs(dx) + Math.abs(dy) < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
            animId = requestAnimationFrame(draw);
        };

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        animId = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// ─── Countdown Hook ──────────────────────────────────────────────────
interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

function useCountdown(targetDate: string | null): TimeLeft {
    const calc = useCallback((): TimeLeft => {
        if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
        const diff = new Date(targetDate).getTime() - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            total: diff,
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calc);

    useEffect(() => {
        const id = setInterval(() => setTimeLeft(calc()), 1000);
        return () => clearInterval(id);
    }, [calc]);

    return timeLeft;
}

// ─── Countdown Digit Component ───────────────────────────────────────
const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
        <div className="relative">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 md:px-6 md:py-4 min-w-[70px] md:min-w-[100px] text-center shadow-lg shadow-red-500/5">
                <span className="text-3xl md:text-5xl lg:text-6xl font-orbitron font-black text-white tabular-nums tracking-wider">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-red-500/10 rounded-xl blur-xl -z-10" />
        </div>
        <span className="text-[10px] md:text-xs text-gray-500 font-mono uppercase tracking-widest mt-2">{label}</span>
    </div>
);

// ─── Separator ───────────────────────────────────────────────────────
const TimeSep: React.FC = () => (
    <div className="flex flex-col gap-2 pb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────
interface ComingSoonProps {
    targetDate: string | null;
    onUnlock?: () => void;
    onPlayAim?: () => void;
    onPlayReaction?: () => void;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ targetDate, onUnlock, onPlayAim, onPlayReaction }) => {
    const { t, language, setLanguage, allLanguages } = useAppContext();
    const timeLeft = useCountdown(targetDate);
    const hasCountdown = targetDate && timeLeft.total > 0;
    const [pulse, setPulse] = useState(false);
    const [prankType, setPrankType] = useState<'branch' | 'competitor' | 'tomas' | null>(null);

    // VIP State
    const [vipCode, setVipCode] = useState('');
    const [vipError, setVipError] = useState(false);
    const [vipSuccess, setVipSuccess] = useState(false);
    const [showVipInput, setShowVipInput] = useState(false);
    const vipInputRef = useRef<HTMLInputElement>(null);

    // Device detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Allow forced prank via URL for testing
        const params = new URLSearchParams(window.location.search);
        const forcedPrank = params.get('prank');
        if (forcedPrank && ['branch', 'competitor', 'tomas'].includes(forcedPrank)) {
            setPrankType(forcedPrank as 'branch' | 'competitor' | 'tomas');
            return;
        }

        // Fetch IP and simulate prank detection
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => {
                const ip = data.ip;
                // Placeholders for actual IP checks:
                // if (ip === '1.2.3.4') setPrankType('branch');
                // else if (ip === '5.6.7.8') setPrankType('competitor');
                // else if (ip === '9.10.11.12') setPrankType('tomas');
            })
            .catch(console.error);
    }, []);

    // Heartbeat pulse every second
    useEffect(() => {
        const id = setInterval(() => {
            setPulse(true);
            setTimeout(() => setPulse(false), 200);
        }, 1000);
        return () => clearInterval(id);
    }, []);

    // Handle VIP Submission
    const handleVipSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // The code is '1337', which is 'MTMzNw==' in base64
        if (btoa(vipCode) === 'MTMzNw==') {
            setVipSuccess(true);
            setVipError(false);
            if (onUnlock) {
                setTimeout(() => {
                    onUnlock();
                }, 4000); // Wait 4s to show the cool success message before unlocking
            }
        } else {
            setVipError(true);
            setVipCode('');
            setTimeout(() => setVipError(false), 1000);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col overflow-hidden relative">
            <ParticleCanvas />

            {/* ─── Header ─── */}
            <header className="relative z-10 p-4 md:p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <img src="/SkillZone_logo_red.png" alt="SkillZone" className="h-7 md:h-9 w-auto" />
                </div>

                {/* Language Switcher */}
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-2 py-1">
                    <Globe className="w-4 h-4 text-white/50" />
                    {allLanguages.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all uppercase
                                ${language === lang ? 'bg-red-600 text-white border border-red-500 shadow-lg shadow-red-500/20 scale-110' : 'text-gray-500 hover:text-white border border-transparent hover:bg-white/5'}`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${pulse ? 'bg-yellow-400 scale-150' : 'bg-yellow-500'}`} />
                    <span className="text-[10px] md:text-xs font-mono text-yellow-500 uppercase">WORK IN PROGRESS</span>
                </div>
            </header>

            {/* VIP Success Overlay Animation */}
            {vipSuccess && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <Unlock className="w-24 h-24 text-green-500 mb-6 animate-bounce" />
                    <h2 className="text-4xl md:text-6xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-4 scale-in-center">
                        ACCESS GRANTED
                    </h2>
                    <p className="text-xl md:text-2xl text-green-400 font-mono tracking-widest uppercase animate-pulse">
                        Aha, elitní hráč! 👀
                    </p>
                    <p className="mt-6 text-gray-400 max-w-lg mx-auto leading-relaxed border border-green-500/20 bg-green-900/10 p-4 rounded-xl font-mono text-sm">
                        Mrkni na novej web. Je stále <span className="text-yellow-500">work in progress</span> a obsahuje dummy data, tak to prosím <span className="text-red-500 font-bold">nešiř dál</span>. Užij si VIP preview! 🤫
                    </p>
                    <div className="mt-8 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-[loadingBar_4s_ease-in-out_forwards]" />
                    </div>
                </div>
            )}

            {/* ─── Main Content ─── */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 md:gap-12 p-4 md:p-8 lg:p-12">

                {/* Hype Title */}
                <div className="text-center space-y-4 max-w-3xl">
                    <div className="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full mb-2">
                        <span className="text-[10px] md:text-xs font-mono text-red-400 uppercase tracking-widest">
                            {prankType ? t(`coming_prank_${prankType}_badge` as any) : t('coming_badge')}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-orbitron font-black tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
                            {prankType ? t(`coming_prank_${prankType}_title` as any) : t('coming_title1')}
                        </span>
                        {!prankType && (
                            <>
                                <br />
                                <span className="text-white text-2xl md:text-4xl lg:text-5xl">
                                    {t('coming_title2').replace('...', '')}<span className="animate-pulse">...</span>
                                </span>
                            </>
                        )}
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base font-mono leading-relaxed max-w-xl mx-auto">
                        {prankType ? t(`coming_prank_${prankType}_desc` as any) : t('coming_desc')}
                    </p>
                </div>

                {/* Countdown */}
                {hasCountdown && (
                    <div className="flex items-center gap-2 md:gap-4">
                        <CountdownUnit value={timeLeft.days} label={t('coming_days')} />
                        <TimeSep />
                        <CountdownUnit value={timeLeft.hours} label={t('coming_hours')} />
                        <TimeSep />
                        <CountdownUnit value={timeLeft.minutes} label={t('coming_mins')} />
                        <TimeSep />
                        <CountdownUnit value={timeLeft.seconds} label={t('coming_secs')} />
                    </div>
                )}

                {/* Progress Bar */}
                <div className="w-full max-w-md">
                    <div className="flex justify-between text-[10px] text-gray-600 font-mono mb-1.5">
                        <span>{t('coming_progress')}</span>
                        <span>{t('coming_almost')}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full transition-all duration-1000"
                            style={{ width: '78%', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}
                        />
                    </div>
                </div>

                {/* --- Profile Promo Promo --- */}
                <div className="relative w-full max-w-3xl mt-4 rounded-2xl border border-red-500/20 bg-black/40 backdrop-blur-md p-6 overflow-hidden group hover:border-red-500/40 transition-all">
                    {/* Glowing background blob */}
                    <div className="absolute -inset-20 bg-gradient-to-r from-red-600/10 via-orange-500/10 to-transparent blur-3xl rounded-full opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity" />

                    <div className="relative flex flex-col md:flex-row items-center gap-8 justify-between">
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-2xl font-orbitron font-bold text-white flex items-center justify-center md:justify-start gap-2 mb-2">
                                <User className="text-red-500" />
                                {language === 'cs' ? 'MÁTE U NÁS REGISTRACI?' : 'HAVE AN ACCOUNT?'}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                                {language === 'cs'
                                    ? 'Nový web sice ještě ladíme, ale váš osobní profil je stále dostupný. Zkontrolujte si kredity, historii a úroveň!'
                                    : 'While we are fine-tuning the new website, your personal profile remains accessible. Check your credits, history, and level!'}
                            </p>

                            {isMobile && (
                                <a
                                    href="https://profil.skillzone.cz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 inline-flex items-center justify-center w-full gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-500/30 transform active:scale-95"
                                >
                                    <Smartphone className="w-5 h-5" />
                                    {language === 'cs' ? 'OTEVŘÍT MŮJ PROFIL' : 'OPEN MY PROFILE'}
                                </a>
                            )}
                        </div>

                        {!isMobile && (
                            <div className="flex flex-col items-center shrink-0">
                                <div className="bg-white p-3 rounded-xl shadow-2xl transform transition-transform hover:scale-105 hover:rotate-2">
                                    <QRCode value="https://profil.skillzone.cz" size={120} />
                                </div>
                                <a
                                    href="https://profil.skillzone.cz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 text-xs font-mono text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest hover:underline"
                                >
                                    profil.skillzone.cz ↗
                                </a>
                            </div>
                        )}
                    </div>
                </div>
                {/* ------------------------- */}

                {/* Branch Cards */}
                <div className="w-full max-w-2xl">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono text-center mb-4">
                        {t('coming_location_title')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {BRANCHES.map((b, i) => (
                            <div key={i} className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-red-500/20 transition-all hover:scale-[1.02] group">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{b.emoji}</span>
                                    <h4 className="text-xs font-bold text-white truncate">{b.name.replace('SkillZone ', '')}</h4>
                                    {'isNew' in b && (b as any).isNew && (
                                        <span className="text-[8px] font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shrink-0">NEW</span>
                                    )}
                                </div>
                                <a href={b.maps} target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] text-gray-500 hover:text-white block transition-colors mb-2 truncate">
                                    📍 {b.address} →
                                </a>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="text-[10px] text-red-400 hover:text-red-300 font-mono transition-colors">
                                        📞 {b.phone}
                                    </a>
                                    <a href={b.wa} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-400 hover:text-green-300 font-mono transition-colors">
                                        💬 WA
                                    </a>
                                </div>
                                <div className="text-[9px] text-gray-600 font-mono mt-1.5">🕐 {b.hours}</div>
                            </div>
                        ))}
                    </div>
                    {/* Mini-Games to Kill Time */}
                    {(onPlayAim || onPlayReaction) && (
                        <div className="mt-12 text-center w-full">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono mb-4 text-center">
                                {language === 'cs' ? 'Zkraťte si čekání tréninkem' : 'Kill some time training'}
                            </h3>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {onPlayAim && (
                                    <button onClick={onPlayAim} className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-sm rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2">
                                        🎯 AIM CHALLENGE
                                    </button>
                                )}
                                {onPlayReaction && (
                                    <button onClick={onPlayReaction} className="w-full sm:w-auto px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold font-mono text-sm rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 flex items-center justify-center gap-2">
                                        ⚡ REACTION CHALLENGE
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact BOSS Ug4t0R */}
                    <div className="mt-16 text-center border-t border-white/5 pt-8">
                        <h3 className="text-xl font-bold text-white mb-2 font-orbitron">
                            {language === 'cs' ? 'Dotazy? Pochvaly? Stížnosti?' : 'Questions? Praises? Complaints?'}
                        </h3>
                        <p className="text-gray-400 text-xs md:text-sm font-mono leading-relaxed max-w-lg mx-auto mb-6">
                            {language === 'cs'
                                ? 'Náš BOSS Ug4t0R naslouchá a zajišťuje kvalitu! Je to jeden z nás, žádnej korporát. Zastihnete ho buď osobně na baru, nebo rovnou napřímo:'
                                : 'Our BOSS Ug4t0R listens and ensures quality! He is one of us, no corporate guy. Catch him personally at the bar, or contact him directly:'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <a href="tel:+420777766113" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-green-400 hover:text-green-300 font-mono transition-colors text-sm">
                                📞 {language === 'cs' ? 'Zavolat na Bar / Bossovi' : 'Call Bar / Boss'}
                            </a>
                            <a href="https://instagram.com/skillzone.cz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-pink-400 hover:text-pink-300 font-mono transition-colors text-sm">
                                📸 INSTAGRAM
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            {/* ─── Footer ─── */}
            <footer className="relative z-10 p-4 border-t border-white/5 flex flex-col items-center gap-4">
                <div className="text-[10px] text-gray-700 font-mono">
                    skillzone.cz • © {new Date().getFullYear()} SkillZone s.r.o.
                </div>

                {/* VIP Secret Trigger */}
                {!showVipInput ? (
                    <button
                        onClick={() => {
                            setShowVipInput(true);
                            setTimeout(() => vipInputRef.current?.focus(), 100);
                        }}
                        className="w-8 h-8 opacity-0 hover:opacity-10 transition-opacity"
                        aria-label="Secret Access"
                    />
                ) : (
                    <form onSubmit={handleVipSubmit} className="flex items-center gap-2 mt-2 animate-in slide-in-from-bottom border border-white/10 p-1 rounded-lg bg-black/50">
                        <Lock className="w-4 h-4 text-gray-500 ml-2" />
                        <input
                            ref={vipInputRef}
                            type="password"
                            value={vipCode}
                            onChange={(e) => setVipCode(e.target.value)}
                            placeholder="_"
                            className={`bg-transparent outline-none border-none text-white font-mono w-24 text-center placeholder-gray-700
                                ${vipError ? 'text-red-500 animate-shake' : ''}`}
                            maxLength={10}
                        />
                        <button type="submit" className="hidden">Submit</button>
                    </form>
                )}
            </footer>
        </div>
    );
};

export default ComingSoon;
