import React from 'react';
import { WeatherCondition } from '../../services/weatherService';

// ─── SkillerCharacter ─────────────────────────────────────────────────────────
// SVG pixel-art gamer bot. Weather-aware accessories (umbrella, sunglasses, scarf).
// Supports front view and side-walking view.
// ─── TYPES ────────────────────────────────────────────────────────────────────
export type SkillerVariant = 'default' | 'cyberpunk' | 'ghost' | 'arcade' | 'ninja' | 'mage';

// ─── SkillerCharacter ─────────────────────────────────────────────────────────

const MOOD_EMOTE: Record<string, string> = {
    HYPE: '🔥',
    TILT: '😤',
    TIRED: '😴',
    FOCUS: '🎯',
    CHILL: '😎',
};

export const SkillerCharacter: React.FC<{
    mood: string;
    isDead?: boolean;
    weather?: WeatherCondition;
    facingLeft?: boolean;
    isWalking?: boolean;
    isHovered?: boolean;
    isDancing?: boolean;
    action?: 'dance' | 'jump' | 'wave' | 'sit' | null;
    variant?: SkillerVariant;
}> = ({ mood, isDead, weather, facingLeft, isWalking, isHovered, isDancing, action, variant = 'default' }) => {

    // ─── Variant Settings ───

    // Base eye colors by mood (used for default and some variants)
    let eyeColor = isDead ? '#666' : mood === 'HYPE' ? '#22c55e' : mood === 'TILT' ? '#ef4444' : mood === 'TIRED' ? '#f59e0b' : '#e31e24';

    // Customize colors and visibility based on variant
    let primaryColor = '#e31e24'; // sz-red
    let visorBg = 'bg-zinc-900 border-zinc-600';
    let visorGradient = 'from-zinc-800 to-black';
    let bodyBg = 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-zinc-700/50';
    let headsetColor = 'border-zinc-500';
    let earCupBg = 'bg-zinc-700 border-zinc-500';
    let legBg = 'bg-zinc-700 border-zinc-600/30';
    let legTip = 'bg-zinc-600';
    let globalOpacity = 1;

    // Apply variant overrides
    if (variant === 'cyberpunk') {
        primaryColor = '#0ea5e9'; // cyan
        eyeColor = isDead ? '#666' : mood === 'TILT' ? '#f43f5e' : '#0ea5e9';
        visorBg = 'bg-slate-900 border-cyan-700';
        visorGradient = 'from-slate-800 to-slate-950';
        bodyBg = 'bg-gradient-to-b from-slate-800 to-slate-900 border-cyan-800/40';
        headsetColor = 'border-pink-500';
        earCupBg = 'bg-slate-800 border-pink-500';
        legBg = 'bg-slate-800 border-cyan-800/40';
        legTip = 'bg-cyan-900';
    } else if (variant === 'ghost') {
        primaryColor = '#22c55e'; // matrix green
        eyeColor = isDead ? '#333' : '#22c55e';
        visorBg = 'bg-black border-green-900';
        visorGradient = 'from-green-950/20 to-black';
        bodyBg = 'bg-black border-green-900/30';
        headsetColor = 'border-green-800/30';
        earCupBg = 'bg-black border-green-900/50';
        legBg = 'bg-black border-green-900/30';
        legTip = 'bg-green-950';
        globalOpacity = 0.7;
    } else if (variant === 'arcade') {
        primaryColor = '#eab308'; // retro yellow
        eyeColor = isDead ? '#666' : mood === 'TILT' ? '#ef4444' : '#eab308';
        visorBg = 'bg-neutral-900 border-yellow-600 border-4'; // chunky borders
        visorGradient = 'from-neutral-800 to-neutral-900';
        bodyBg = 'bg-neutral-800 border-yellow-700/80 border-2';
        headsetColor = 'border-orange-500 border-4 rounded-none'; // square headset
        earCupBg = 'bg-orange-600 border-orange-400 rounded-none';
        legBg = 'bg-neutral-700 border-yellow-600 rounded-none';
        legTip = 'bg-yellow-600 rounded-none';
    } else if (variant === 'ninja') {
        primaryColor = '#ef4444';
        eyeColor = isDead ? '#666' : '#ef4444';
        visorBg = 'bg-zinc-950 border-red-900';
        visorGradient = 'from-zinc-900 to-black';
        bodyBg = 'bg-zinc-950 border-red-900/30';
        headsetColor = 'border-transparent'; // no headset
        earCupBg = 'bg-transparent border-transparent';
        legBg = 'bg-zinc-900 border-zinc-800';
        legTip = 'bg-zinc-950';
    } else if (variant === 'mage') {
        primaryColor = '#a855f7'; // magical purple
        eyeColor = isDead ? '#666' : '#a855f7';
        visorBg = 'bg-indigo-950 border-purple-700';
        visorGradient = 'from-indigo-900 to-fuchsia-950';
        bodyBg = 'bg-gradient-to-b from-indigo-900 to-purple-950 border-purple-600/40 border-b-0';
        headsetColor = 'border-transparent'; // no headset
        earCupBg = 'bg-transparent border-transparent';
        legBg = 'bg-purple-900 border-purple-600/30';
        legTip = 'bg-purple-950';
    }

    const glowColor = isDead ? 'transparent' : `${eyeColor}44`;
    const mouthStyle = isDead ? 'scaleY(-1)' : mood === 'TILT' ? 'scaleY(-1)' : mood === 'TIRED' ? 'scaleY(0.3)' : 'none';
    const side = isWalking;
    const emote = !isDead && !isWalking ? MOOD_EMOTE[mood] ?? null : null;

    return (
        <div
            className="relative flex flex-col items-center transition-all duration-300"
            style={{
                transform: facingLeft ? `scaleX(-1) ${action === 'sit' ? 'translateY(4px) scaleY(0.9)' : ''}` : (action === 'sit' ? 'translateY(4px) scaleY(0.9)' : 'none'),
                transformOrigin: 'bottom center',
                width: side ? '28px' : '36px',
                opacity: globalOpacity,
                filter: isHovered && !isDead
                    ? `drop-shadow(0 0 8px ${eyeColor}99) drop-shadow(0 0 20px ${eyeColor}44)`
                    : (isDancing || action === 'dance')
                        ? `drop-shadow(0 0 12px ${eyeColor}88)`
                        : 'none',
                transition: 'filter 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                animation: (isDancing || action === 'dance') ? 'skillerDance 0.4s ease-in-out infinite' : action === 'jump' ? 'skillerJump 0.5s ease-in-out infinite' : undefined,
            }}
        >
            {/* ─── EMOTE above head ─── */}
            {emote && !isDead && (
                <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 text-[13px] leading-none z-50 pointer-events-none"
                    style={{ animation: 'skillerEmotePop 0.3s cubic-bezier(0.34,1.56,0.64,1) both, skillerEmoteFloat 2s ease-in-out 0.3s infinite' }}
                >
                    {emote}
                </div>
            )}

            {/* ─── VARIANT: MAGE HAT ─── */}
            {variant === 'mage' && !isDead && (
                <div className={`absolute -top-6 ${side ? 'left-1' : 'left-1/2 -translate-x-1/2'} z-30 flex flex-col items-center`}>
                    <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-transparent border-b-purple-700" />
                    <div className="w-10 h-1.5 bg-purple-900 rounded-full shadow-[0_2px_10px_rgba(168,85,247,0.5)]" />
                </div>
            )}

            {/* ─── WEATHER: Umbrella ─── */}
            {!isDead && (weather === 'rain' || weather === 'storm') && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
                    <div className="w-9 h-[18px] bg-gradient-to-b from-blue-500 to-blue-700 rounded-t-full border border-blue-400/50" />
                    <div className="w-px h-[30px] bg-gray-400 mx-auto" />
                </div>
            )}

            {/* ─── HEAD ─── */}
            <div className="relative z-10">

                {/* ─── VARIANT: NINJA BANDANA ─── */}
                {variant === 'ninja' && !isDead && (
                    <div className="absolute top-1 left-0 right-0 h-2 bg-red-600 z-20 shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                        {/* Bandana tie on the back if walking side */}
                        {side && (
                            <div className="absolute top-0 -left-2 w-3 h-2 bg-red-700 transform -rotate-12 rounded-l-full" />
                        )}
                    </div>
                )}

                {/* Headset band (hidden for ninja/mage) */}
                {variant !== 'ninja' && variant !== 'mage' && (
                    !side ? (
                        <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 border-t-2 border-l-2 border-r-2 rounded-t-full transition-all duration-300 ${isDead ? 'border-gray-600' : headsetColor}`}
                            style={{ width: '36px' }}
                        />
                    ) : (
                        <div className={`absolute -top-1.5 left-1 w-3 h-4 border-t-2 border-x-2 rounded-t-[3px] z-10 transition-all duration-300 ${isDead ? 'border-gray-600' : headsetColor}`} />
                    )
                )}

                {/* Ear cups (hidden for ninja/mage) */}
                {variant !== 'ninja' && variant !== 'mage' && (
                    !side ? (
                        <>
                            <div className={`absolute top-1 -left-1.5 w-2.5 h-4 rounded-l-md ${isDead ? 'bg-gray-700' : earCupBg}`}>
                                <div className={`w-1 h-2 mt-0.5 ml-0.5 rounded-sm ${isDead ? 'bg-gray-600' : `bg-[${primaryColor}]/70`}`} style={{ backgroundColor: isDead ? undefined : primaryColor, opacity: 0.7 }} />
                            </div>
                            <div className={`absolute top-1 -right-1.5 w-2.5 h-4 rounded-r-md ${isDead ? 'bg-gray-700' : earCupBg}`}>
                                <div className={`w-1 h-2 mt-0.5 ml-1 rounded-sm ${isDead ? 'bg-gray-600' : `bg-[${primaryColor}]/70`}`} style={{ backgroundColor: isDead ? undefined : primaryColor, opacity: 0.7 }} />
                            </div>
                        </>
                    ) : (
                        <div className={`absolute top-1 left-1.5 w-3 h-4 rounded-[4px] z-20 ${isDead ? 'bg-gray-700' : earCupBg}`}>
                            <div className={`w-1 h-2 mt-0.5 mx-auto rounded-sm ${isDead ? 'bg-gray-600' : `bg-[${primaryColor}]/70`}`} style={{ backgroundColor: isDead ? undefined : primaryColor, opacity: 0.7 }} />
                        </div>
                    )
                )}

                {/* Head / Visor */}
                <div
                    className={`h-8 rounded-md relative overflow-hidden transition-all duration-300 mx-auto ${isDead
                        ? 'bg-zinc-800 border-2 border-gray-600 opacity-60'
                        : `${visorBg} ${variant === 'arcade' ? '' : 'border-2'}`
                        }`}
                    style={{ width: side ? '20px' : '32px', boxShadow: isDead ? 'none' : `0 0 4px ${glowColor}` }}
                >
                    {!isDead && <div className={`absolute inset-0.5 bg-gradient-to-b ${visorGradient} rounded-sm`} />}

                    {/* Sunglasses (front only) */}
                    {!isDead && weather === 'sun' && !side && (
                        <div className="absolute top-1.5 left-0.5 right-0.5 h-2.5 bg-gray-900/80 rounded-sm z-10 flex items-center justify-center gap-1">
                            <div className="w-2 h-1.5 bg-gray-800 rounded-sm border border-gray-600" />
                            <div className="w-0.5 h-0.5 bg-gray-600" />
                            <div className="w-2 h-1.5 bg-gray-800 rounded-sm border border-gray-600" />
                        </div>
                    )}

                    {/* Eyes */}
                    <div
                        className={`relative z-[5] mt-1.5 ${side ? 'flex justify-end pr-[2px]' : 'flex justify-center gap-1.5'}`}
                        style={{ animation: !isDead && variant !== 'arcade' ? 'skillerBlink 4s ease-in-out infinite' : 'none' }}
                    >
                        {isDead ? (
                            <span className={`text-[7px] text-gray-500 font-bold leading-none ${side ? 'scale-[0.8]' : ''}`}>✕</span>
                        ) : (
                            <>
                                {!side ? (
                                    <>
                                        <div className={`w-1.5 h-2 ${variant === 'arcade' ? 'rounded-none' : 'rounded-sm'}`} style={{ background: eyeColor, boxShadow: `0 0 5px ${glowColor}`, opacity: 1 }} />
                                        <div className={`w-1.5 h-2 ${variant === 'arcade' ? 'rounded-none' : 'rounded-sm'}`} style={{ background: eyeColor, boxShadow: `0 0 5px ${glowColor}`, opacity: 1 }} />
                                    </>
                                ) : (
                                    <div className={`w-1 h-2 ${variant === 'arcade' ? 'rounded-none' : 'rounded-sm'}`} style={{ background: eyeColor, boxShadow: `0 0 5px ${glowColor}`, opacity: 1 }} />
                                )}
                            </>
                        )}
                    </div>

                    {/* Mouth */}
                    <div className={`mt-1 relative z-[5] ${side ? 'flex justify-end pr-0' : 'flex justify-center'}`}>
                        <div className={`h-0.5 ${variant === 'arcade' ? 'rounded-none' : 'rounded-full'} ${isDead ? 'bg-gray-600' : ''}`}
                            style={{ width: side ? '4px' : '12px', transform: mouthStyle, background: isDead ? undefined : eyeColor, opacity: isDead ? 1 : 0.6 }}
                        />
                    </div>

                    {/* Scan lines (hidden in arcade) */}
                    {!isDead && variant !== 'arcade' && <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }} />}
                </div>

                {/* Scarf (snow) */}
                {!isDead && weather === 'snow' && (
                    <div className="relative z-20 -mt-0.5 mx-auto" style={{ width: side ? '22px' : '34px' }}>
                        <div className="h-2 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-sm opacity-90" />
                        <div className="flex justify-around">
                            {Array.from({ length: side ? 3 : 5 }).map((_, i) => (
                                <div key={i} className="w-px h-1 bg-red-400/70" />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── BODY ─── */}
            <div
                className={`relative -mt-0.5 ${variant === 'arcade' || variant === 'ninja' ? 'rounded-none' : 'rounded-b-md'} transition-all duration-300 ${isDead
                    ? 'bg-zinc-800 border border-gray-600 border-t-0 opacity-60'
                    : `${bodyBg} border-t-0`
                    }`}
                style={{ width: side ? '18px' : '32px', height: '20px' }}
            >
                {!side && <>
                    <div className={`absolute left-1/2 -translate-x-1/2 w-px h-full ${isDead ? 'bg-gray-600' : ''}`} style={{ backgroundColor: isDead ? undefined : primaryColor, opacity: 0.15 }} />
                    {!isDead && <div className="absolute top-0.5 left-1/2 -translate-x-1/2"><span className="text-[5px] font-black font-orbitron leading-none" style={{ color: primaryColor, opacity: 0.5 }}>SZ</span></div>}
                </>}

                {/* Arms */}
                {side ? (
                    <div className={`absolute -right-1 top-0 w-1.5 h-4 ${variant === 'arcade' || variant === 'ninja' ? 'rounded-none' : 'rounded-b-md'} z-10 ${isDead ? 'bg-zinc-800' : 'bg-black/20 border border-white/10'}`}
                        style={{ transformOrigin: 'top center', animation: !isDead ? 'skillerArmRight 0.5s ease-in-out infinite' : 'none' }}
                    />
                ) : (
                    <>
                        <div className={`absolute -left-1.5 top-0 w-1.5 h-4 ${variant === 'arcade' || variant === 'ninja' ? 'rounded-none' : 'rounded-b-md'} ${isDead ? 'bg-zinc-800' : 'bg-black/20 border border-white/5'}`} />
                        <div className={`absolute -right-1.5 top-0 w-1.5 h-4 ${variant === 'arcade' || variant === 'ninja' ? 'rounded-none' : 'rounded-b-md'} ${isDead ? 'bg-zinc-800' : 'bg-black/20 border border-white/5'}`}
                            style={{ transformOrigin: 'top center', animation: action === 'wave' && !isDead ? 'skillerWave 0.5s ease-in-out infinite' : 'none' }}
                        />
                    </>
                )}

                {/* RGB strip (magic particles for mage) */}
                {!isDead && variant !== 'ninja' && variant !== 'mage' && (
                    <div className="absolute bottom-0 left-0.5 right-0.5 h-px rounded-full" style={{ background: `linear-gradient(90deg, ${eyeColor}33, transparent, ${eyeColor}33)` }} />
                )}
                {/* Mage belt */}
                {!isDead && variant === 'mage' && (
                    <div className="absolute bottom-1 left-0 right-0 h-1 bg-yellow-600/50 flex justify-center items-center">
                        <div className="w-2 h-2 rounded-sm border border-yellow-400 bg-purple-900" />
                    </div>
                )}
            </div>

            {/* ─── LEGS ─── */}
            <div className={`flex -mt-px ${side ? 'gap-0 justify-end pr-0.5' : 'gap-0.5 justify-center'}`}>
                {!side && (
                    <div className={`w-1.5 h-3 ${variant === 'arcade' ? 'rounded-none' : 'rounded-b-sm'} ${isDead ? 'bg-gray-700' : legBg}`}>
                        <div className={`w-2 h-1 ${variant === 'arcade' ? 'rounded-none' : 'rounded-sm'} mt-2 -ml-0.5 ${isDead ? 'bg-gray-600' : legTip}`} />
                    </div>
                )}
                <div className={`w-1.5 h-3 ${variant === 'arcade' ? 'rounded-none' : 'rounded-b-sm'} ${isDead ? 'bg-gray-700' : legBg}`}
                    style={{ transformOrigin: 'top center', animation: side && !isDead ? 'skillerLegLeft 0.5s ease-in-out infinite' : 'none' }}
                >
                    <div className={`w-2 h-1 ${variant === 'arcade' ? 'rounded-none' : 'rounded-sm'} mt-2 ${side ? '' : '-ml-0.5'} ${isDead ? 'bg-gray-600' : legTip}`} />
                </div>
                {side && (
                    <div className={`w-1.5 h-3 ${variant === 'arcade' ? 'rounded-none' : 'rounded-b-sm'} -ml-1 ${isDead ? 'bg-gray-700' : legBg}`}
                        style={{ transformOrigin: 'top center', animation: !isDead ? 'skillerLegRight 0.5s ease-in-out infinite' : 'none', zIndex: -1, filter: 'brightness(0.7)' }}
                    >
                        <div className={`w-2 h-1 ${variant === 'arcade' ? 'rounded-none' : 'rounded-sm'} mt-2 ${isDead ? 'bg-gray-600' : legTip}`} />
                    </div>
                )}
            </div>

            {/* ─── WALKING DUST PARTICLES ─── */}
            {isWalking && !isDead && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className={`absolute w-1 h-1 rounded-full ${variant === 'mage' ? 'bg-purple-500/60 shadow-[0_0_5px_rgba(168,85,247,0.8)]' : variant === 'cyberpunk' ? 'bg-cyan-500/60 shadow-[0_0_5px_rgba(6,182,212,0.8)]' : 'bg-zinc-600/40'}`}
                            style={{
                                left: `${-4 + i * 4}px`,
                                animation: `skillerDust ${0.6 + i * 0.1}s ease-out ${i * 0.15}s infinite`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ─── WEATHER FX ─── */}
            {!isDead && weather === 'storm' && <div className="absolute -top-1 -right-2 text-[8px] animate-pulse z-30">⚡</div>}
        </div>
    );
};

// ─── SnowParticles ────────────────────────────────────────────────────────────

export const SnowParticles: React.FC = () => (
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

// ─── ExplosionEffect ──────────────────────────────────────────────────────────

export const ExplosionEffect: React.FC = () => (
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

