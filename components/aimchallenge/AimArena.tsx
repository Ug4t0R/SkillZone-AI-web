import React from 'react';
import { ARENA_W, ARENA_H, type TargetState, type DifficultyLevel, type GhostFrame } from '../../services/aimChallengeService';

interface FloatingScore {
    id: number;
    x: number;
    y: number;
    points: number;
    ring: string;
    ts: number;
}

interface AimArenaProps {
    arenaRef: React.RefObject<HTMLDivElement>;
    target: TargetState | null;
    difficulty: DifficultyLevel;
    arenaScale: number;
    shrinkProgress: number;
    currentGhostPos: { x: number; y: number } | null;
    floatingScores: FloatingScore[];
    onHit: (e: React.MouseEvent) => void;
    onMisclick: (e: React.MouseEvent) => void;
}

const AimArena: React.FC<AimArenaProps> = ({
    arenaRef, target, difficulty, arenaScale, shrinkProgress,
    currentGhostPos, floatingScores, onHit, onMisclick,
}) => {
    return (
        <div
            ref={arenaRef}
            onClick={onMisclick}
            className="relative border-2 border-blue-500/30 rounded-lg overflow-hidden"
            style={{
                width: ARENA_W,
                height: ARENA_H,
                transform: `scale(${arenaScale})`,
                transformOrigin: 'center center',
                background: `
                    radial-gradient(circle at 50% 50%, rgba(20,30,60,0.8) 0%, rgba(5,5,15,1) 100%),
                    repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.02) 79px, rgba(255,255,255,0.02) 80px),
                    repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.02) 79px, rgba(255,255,255,0.02) 80px)
                `,
            }}
        >
            {/* Ghost dot */}
            {currentGhostPos && (
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: currentGhostPos.x - 8,
                        top: currentGhostPos.y - 8,
                        width: 16,
                        height: 16,
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 0 8px rgba(255,255,255,0.1)',
                        transition: 'left 0.05s linear, top 0.05s linear',
                    }}
                />
            )}

            {/* Target */}
            {target && (() => {
                const sz = difficulty.shrinkTargets
                    ? target.size * (1 - shrinkProgress * 0.6)
                    : target.size;
                return (
                    <div
                        onClick={onHit}
                        className="absolute rounded-full cursor-crosshair"
                        style={{
                            left: target.x,
                            top: target.y,
                            width: sz,
                            height: sz,
                            background: 'radial-gradient(circle, #ff4444 0%, #cc2222 28%, #881111 30%, #cc2222 32%, #993333 68%, #661111 70%, #993333 72%, #552222 100%)',
                            boxShadow: `0 0 ${20 + (1 - shrinkProgress) * 10}px rgba(255,0,0,0.6), inset 0 0 8px rgba(255,100,100,0.4)`,
                            transition: 'width 0.1s linear, height 0.1s linear',
                            zIndex: 10,
                        }}
                    >
                        {/* Outer ring border */}
                        <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                        {/* Middle ring */}
                        <div className="absolute rounded-full border border-white/30" style={{ left: '15%', top: '15%', right: '15%', bottom: '15%' }} />
                        {/* Inner ring (bullseye zone) */}
                        <div className="absolute rounded-full border-2 border-yellow-400/60" style={{ left: '35%', top: '35%', right: '35%', bottom: '35%' }} />
                        {/* Center dot */}
                        <div className="absolute rounded-full bg-yellow-300/80" style={{ left: '43%', top: '43%', right: '43%', bottom: '43%' }} />
                    </div>
                );
            })()}

            {/* Floating score popups */}
            {floatingScores.map(f => (
                <div
                    key={f.id}
                    className="absolute pointer-events-none font-mono font-black text-center"
                    style={{
                        left: f.x - 40,
                        top: f.y - 20,
                        width: 80,
                        zIndex: 50,
                        animation: 'floatUp 0.85s ease-out forwards',
                        fontSize: f.ring.includes('BULLSEYE') ? 18 : f.ring === 'INNER' ? 15 : 13,
                        color: f.ring.includes('BULLSEYE') ? '#facc15' : f.ring === 'INNER' ? '#60a5fa' : '#a3a3a3',
                        textShadow: '0 0 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)',
                    }}
                >
                    <div>+{f.points}</div>
                    {f.ring.includes('BULLSEYE') && <div style={{ fontSize: 10 }}>💀 BULLSEYE</div>}
                </div>
            ))}
        </div>
    );
};

export default AimArena;
