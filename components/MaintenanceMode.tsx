/**
 * MaintenanceMode — Fun fallback when Supabase is unreachable.
 * Shows gaming-themed error, basic contact info, and a mini arcade game.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Hardcoded branch contacts ───────────────────────────────────────
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

// ─── Glitch text effect ──────────────────────────────────────────────
const GLITCH_CHARS = '!@#$%^&*<>{}[]|/~`░▒▓█▀▄';
function useGlitchText(text: string, interval = 100) {
    const [display, setDisplay] = useState(text);
    useEffect(() => {
        let frame = 0;
        const id = setInterval(() => {
            frame++;
            if (frame > 20) { setDisplay(text); clearInterval(id); return; }
            setDisplay(
                text.split('').map((c, i) =>
                    Math.random() < 0.3 && frame < 15
                        ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
                        : c
                ).join('')
            );
        }, interval);
        return () => clearInterval(id);
    }, [text, interval]);
    return display;
}

// ─── Mini Space Invaders Game ────────────────────────────────────────
interface GameState {
    player: { x: number };
    bullets: Array<{ x: number; y: number }>;
    enemies: Array<{ x: number; y: number; alive: boolean }>;
    score: number;
    gameOver: boolean;
    started: boolean;
}

const GAME_W = 320;
const GAME_H = 400;
const PLAYER_W = 28;
const ENEMY_ROWS = 4;
const ENEMY_COLS = 8;
const ENEMY_SIZE = 18;

function initEnemies(): GameState['enemies'] {
    const enemies: GameState['enemies'] = [];
    for (let r = 0; r < ENEMY_ROWS; r++) {
        for (let c = 0; c < ENEMY_COLS; c++) {
            enemies.push({
                x: 30 + c * 34,
                y: 30 + r * 30,
                alive: true,
            });
        }
    }
    return enemies;
}

const MiniGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<GameState>({
        player: { x: GAME_W / 2 },
        bullets: [],
        enemies: initEnemies(),
        score: 0,
        gameOver: false,
        started: false,
    });
    const keysRef = useRef<Set<string>>(new Set());
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [started, setStarted] = useState(false);
    const animRef = useRef<number>(0);

    const resetGame = useCallback(() => {
        stateRef.current = {
            player: { x: GAME_W / 2 },
            bullets: [],
            enemies: initEnemies(),
            score: 0,
            gameOver: false,
            started: true,
        };
        setScore(0);
        setGameOver(false);
        setStarted(true);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleKey = (e: KeyboardEvent) => {
            keysRef.current.add(e.key);
            if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
        };
        const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
        window.addEventListener('keydown', handleKey);
        window.addEventListener('keyup', handleKeyUp);

        let enemyDir = 1;
        let enemySpeed = 0.3;
        let lastShot = 0;

        const loop = () => {
            const s = stateRef.current;
            if (!s.started || s.gameOver) {
                animRef.current = requestAnimationFrame(loop);
                return;
            }

            const keys = keysRef.current;
            // Move player
            if (keys.has('ArrowLeft') || keys.has('a')) s.player.x = Math.max(PLAYER_W / 2, s.player.x - 4);
            if (keys.has('ArrowRight') || keys.has('d')) s.player.x = Math.min(GAME_W - PLAYER_W / 2, s.player.x + 4);

            // Shoot
            const now = Date.now();
            if ((keys.has(' ') || keys.has('ArrowUp')) && now - lastShot > 200) {
                s.bullets.push({ x: s.player.x, y: GAME_H - 30 });
                lastShot = now;
            }

            // Move bullets
            s.bullets = s.bullets.filter(b => {
                b.y -= 6;
                return b.y > 0;
            });

            // Move enemies
            let hitEdge = false;
            s.enemies.forEach(e => {
                if (!e.alive) return;
                e.x += enemyDir * enemySpeed;
                if (e.x < 10 || e.x > GAME_W - 10) hitEdge = true;
            });
            if (hitEdge) {
                enemyDir *= -1;
                s.enemies.forEach(e => { e.y += 12; });
                enemySpeed = Math.min(enemySpeed + 0.05, 2);
            }

            // Collision detection
            s.bullets.forEach(b => {
                s.enemies.forEach(e => {
                    if (!e.alive) return;
                    if (Math.abs(b.x - e.x) < ENEMY_SIZE && Math.abs(b.y - e.y) < ENEMY_SIZE) {
                        e.alive = false;
                        b.y = -100; // remove bullet
                        s.score += 10;
                        setScore(s.score);
                    }
                });
            });

            // Check if enemies reached bottom
            const anyReachedBottom = s.enemies.some(e => e.alive && e.y > GAME_H - 50);
            const allDead = s.enemies.every(e => !e.alive);

            if (anyReachedBottom) {
                s.gameOver = true;
                setGameOver(true);
            } else if (allDead) {
                // New wave!
                s.enemies = initEnemies();
                enemySpeed += 0.3;
            }

            // Draw
            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, GAME_W, GAME_H);

            // Draw grid lines
            ctx.strokeStyle = '#ffffff08';
            for (let i = 0; i < GAME_W; i += 20) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, GAME_H); ctx.stroke();
            }
            for (let i = 0; i < GAME_H; i += 20) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(GAME_W, i); ctx.stroke();
            }

            // Draw player (triangle ship)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(s.player.x, GAME_H - 30);
            ctx.lineTo(s.player.x - PLAYER_W / 2, GAME_H - 10);
            ctx.lineTo(s.player.x + PLAYER_W / 2, GAME_H - 10);
            ctx.closePath();
            ctx.fill();
            // Engine glow
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(s.player.x - 3, GAME_H - 8, 6, 4);

            // Draw bullets
            ctx.fillStyle = '#fbbf24';
            s.bullets.forEach(b => {
                ctx.fillRect(b.x - 1.5, b.y, 3, 10);
            });

            // Draw enemies (pixelated aliens)
            s.enemies.forEach(e => {
                if (!e.alive) return;
                const row = Math.floor(s.enemies.indexOf(e) / ENEMY_COLS);
                const colors = ['#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
                ctx.fillStyle = colors[row % colors.length];
                // Simple pixel alien shape
                const sz = 6;
                ctx.fillRect(e.x - sz, e.y - sz, sz * 2, sz);
                ctx.fillRect(e.x - sz * 1.5, e.y, sz * 3, sz);
                ctx.fillRect(e.x - sz * 0.5, e.y - sz * 1.5, sz, sz * 0.5);
            });

            // Score
            ctx.fillStyle = '#6b7280';
            ctx.font = '11px monospace';
            ctx.fillText(`SCORE: ${s.score}`, 8, 16);

            animRef.current = requestAnimationFrame(loop);
        };

        animRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-2xl shadow-red-500/10">
                <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="block" />
                {!started && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                        <div className="text-lg font-orbitron text-white uppercase tracking-widest">SKILL INVADERS</div>
                        <button
                            onClick={resetGame}
                            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg uppercase tracking-wider transition-colors"
                        >
                            ▶ START
                        </button>
                        <div className="text-[10px] text-gray-500 font-mono">← → / A D = MOVE &nbsp; SPACE / ↑ = FIRE</div>
                    </div>
                )}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                        <div className="text-lg font-orbitron text-red-500 uppercase tracking-widest">GAME OVER</div>
                        <div className="text-2xl font-bold text-white font-orbitron">{score}</div>
                        <button
                            onClick={resetGame}
                            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg uppercase tracking-wider transition-colors"
                        >
                            ↻ RETRY
                        </button>
                    </div>
                )}
            </div>
            {started && !gameOver && (
                <div className="text-xs text-gray-600 font-mono">SCORE: {score}</div>
            )}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────
const MaintenanceMode: React.FC = () => {
    const glitchTitle = useGlitchText('CONNECTION LOST');
    const [dots, setDots] = useState('');

    useEffect(() => {
        const id = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* ─── Header ─── */}
            <header className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/SkillZone_logo_red.png" alt="SkillZone" className="h-8 w-auto" />
                    <span className="text-xs font-mono text-gray-600 uppercase">SYSTEM STATUS: OFFLINE</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono text-red-500">RECONNECTING{dots}</span>
                </div>
            </header>

            {/* ─── Main Content ─── */}
            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 p-6 lg:p-12">
                {/* Left side — Error + Contacts */}
                <div className="flex flex-col gap-8 max-w-md">
                    {/* Glitch Error */}
                    <div className="space-y-3">
                        <div className="text-3xl md:text-4xl font-orbitron font-black text-red-500 tracking-wider relative">
                            <span className="relative inline-block">
                                {glitchTitle}
                                <span className="absolute inset-0 text-cyan-500 opacity-30 translate-x-[2px] translate-y-[-1px]" aria-hidden>
                                    {glitchTitle}
                                </span>
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed font-mono">
                            Naše servery se zrovna <span className="text-yellow-500">respawnují</span>.
                            Neboj, dáváme si <span className="text-green-500">+100 HP</span> a jsme zpátky za chvíli.
                        </p>
                        <p className="text-gray-600 text-xs font-mono">
                            ERROR_CODE: 503_SERVER_RESPAWNING • RETRY: AUTO
                        </p>
                    </div>

                    {/* Contact Cards */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">
                            📍 Mezitím nás najdeš tady
                        </h3>
                        {BRANCHES.map((b, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-4 hover:border-red-500/20 transition-colors">
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">{b.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white">{b.name}</h4>
                                        {'isNew' in b && (b as any).isNew && (
                                            <span className="text-[8px] font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">NEW</span>
                                        )}
                                        <a href={b.maps} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white mt-1 inline-block transition-colors">
                                            📍 {b.address} →
                                        </a>
                                        <div className="flex items-center gap-4 mt-2">
                                            <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="text-xs text-red-400 hover:text-red-300 font-mono transition-colors">
                                                📞 {b.phone}
                                            </a>
                                            <a href={b.wa} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300 font-mono transition-colors">
                                                💬 WhatsApp
                                            </a>
                                            <span className="text-xs text-gray-500 font-mono">🕐 {b.hours}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-[10px] text-gray-700 font-mono text-center">
                        skillzone.cz • © {new Date().getFullYear()} SkillZone s.r.o.
                    </div>
                </div>

                {/* Right side — Game */}
                <div className="flex flex-col items-center gap-4">
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-widest font-mono">
                        Mezitím si zahraj ⬇️
                    </div>
                    <MiniGame />
                </div>
            </main>
        </div>
    );
};

export default MaintenanceMode;
