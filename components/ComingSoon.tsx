/**
 * ComingSoon — Epic "Work in Progress" landing page.
 * Toggleable via Supabase setting. Shows countdown timer, hype messaging,
 * branch contacts with Google Maps + WhatsApp links, and particle effects.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
}

const ComingSoon: React.FC<ComingSoonProps> = ({ targetDate }) => {
    const { t } = useAppContext();
    const timeLeft = useCountdown(targetDate);
    const hasCountdown = targetDate && timeLeft.total > 0;
    const [pulse, setPulse] = useState(false);
    const [prankType, setPrankType] = useState<'branch' | 'competitor' | 'tomas' | null>(null);

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

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col overflow-hidden relative">
            <ParticleCanvas />

            {/* ─── Header ─── */}
            <header className="relative z-10 p-4 md:p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <img src="/SkillZone_logo_red.png" alt="SkillZone" className="h-7 md:h-9 w-auto" />
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${pulse ? 'bg-yellow-400 scale-150' : 'bg-yellow-500'}`} />
                    <span className="text-[10px] md:text-xs font-mono text-yellow-500 uppercase">WORK IN PROGRESS</span>
                </div>
            </header>

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
                    {/* Social Links */}
                    <div className="flex items-center gap-6 mt-4">
                        <a href="https://discord.gg/skillzone" target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#5865F2] transition-colors font-mono">
                            <span>💬</span> DISCORD SERVER
                        </a>
                        <a href="https://instagram.com/skillzone" target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#E1306C] transition-colors font-mono">
                            <span>📸</span> INSTAGRAM
                        </a>
                    </div>
                </div>
            </main>

            {/* ─── Footer ─── */}
            <footer className="relative z-10 p-4 border-t border-white/5 text-center">
                <div className="text-[10px] text-gray-700 font-mono">
                    skillzone.cz • © {new Date().getFullYear()} SkillZone s.r.o.
                </div>
            </footer>
        </div>
    );
};

export default ComingSoon;
