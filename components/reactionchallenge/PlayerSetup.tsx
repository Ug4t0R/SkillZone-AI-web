import React, { useState, useEffect, useCallback } from 'react';
import {
    type PlayerSlot, type ReactionMode,
    PLAYER_COLORS, TEAM_COLORS, DEFAULT_DESKTOP_KEYS, getKeyLabel,
} from '../../services/reactionChallengeService';

interface PlayerSetupProps {
    players: PlayerSlot[];
    mode: ReactionMode;
    isTouchDevice: boolean;
    cs: boolean;
    onPlayersReady: (players: PlayerSlot[]) => void;
    onBack: () => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({
    players: initialPlayers, mode, isTouchDevice, cs, onPlayersReady, onBack,
}) => {
    const [players, setPlayers] = useState<PlayerSlot[]>(initialPlayers);
    const [listeningFor, setListeningFor] = useState<number | null>(null);
    const [editingName, setEditingName] = useState<number | null>(null);

    // Auto-assign touch zones on mobile
    useEffect(() => {
        if (isTouchDevice) {
            setPlayers(prev => prev.map((p, i) => ({ ...p, key: `touch-${i}` })));
        }
    }, [isTouchDevice]);

    // Listen for key press to assign keys
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (listeningFor === null) return;
        e.preventDefault();
        const key = e.key.toLowerCase();

        // Check if key is already taken
        const taken = players.some((p, i) => i !== listeningFor && p.key === key);
        if (taken) return;

        setPlayers(prev => prev.map((p, i) =>
            i === listeningFor ? { ...p, key } : p
        ));
        setListeningFor(null);
    }, [listeningFor, players]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Auto-assign default keys
    const autoAssign = () => {
        setPlayers(prev => prev.map((p, i) => ({
            ...p, key: DEFAULT_DESKTOP_KEYS[i] || '',
        })));
    };

    const allReady = players.every(p => p.key !== '');

    return (
        <div className="flex flex-col items-center gap-5 px-4 max-w-lg w-full max-h-[90vh] overflow-y-auto pb-8">
            <div className="text-center">
                <div className="text-4xl mb-2">🎮</div>
                <h2 className="text-2xl font-black text-white">
                    {cs ? 'Nastavení hráčů' : 'Player Setup'}
                </h2>
                <p className="text-white/40 text-sm mt-1 font-mono">
                    {isTouchDevice
                        ? (cs ? 'Každý hráč bude mít svou zónu na obrazovce' : 'Each player gets a screen zone')
                        : (cs ? 'Každý hráč si vybere svou klávesu' : 'Each player picks their key')}
                </p>
            </div>

            {/* Player cards */}
            <div className="w-full space-y-3">
                {players.map((player, idx) => {
                    const pColor = PLAYER_COLORS[idx];
                    const team = mode === 'team' ? TEAM_COLORS[player.teamId || 0] : null;

                    return (
                        <div key={idx}
                            className={`rounded-xl border ${pColor.border} bg-black/40 p-4 transition-all
                                ${listeningFor === idx ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${pColor.bg}`} />
                                    {editingName === idx ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={player.name}
                                            maxLength={12}
                                            onChange={e => setPlayers(prev => prev.map((p, i) =>
                                                i === idx ? { ...p, name: e.target.value } : p
                                            ))}
                                            onBlur={() => setEditingName(null)}
                                            onKeyDown={e => { if (e.key === 'Enter') setEditingName(null); }}
                                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-24 outline-none focus:border-yellow-400"
                                        />
                                    ) : (
                                        <button onClick={() => setEditingName(idx)}
                                            className={`font-bold text-sm ${pColor.text} hover:underline`}>
                                            {player.name}
                                        </button>
                                    )}

                                    {team && (
                                        <span className={`text-xs font-mono ${team.color} ${team.bg} px-2 py-0.5 rounded`}>
                                            {cs ? team.nameCs : team.name}
                                        </span>
                                    )}
                                </div>

                                {isTouchDevice ? (
                                    <div className="text-white/30 text-xs font-mono">
                                        📱 Zone {idx + 1}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {player.key ? (
                                            <div className={`${pColor.bg} text-black font-black text-lg px-3 py-1 rounded-lg min-w-[48px] text-center`}>
                                                {getKeyLabel(player.key)}
                                            </div>
                                        ) : (
                                            <div className="text-white/20 text-xs font-mono">
                                                {cs ? 'nepřiřazeno' : 'unset'}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setListeningFor(listeningFor === idx ? null : idx)}
                                            className={`text-xs font-mono px-2 py-1 rounded border transition-all
                                                ${listeningFor === idx
                                                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                                                    : 'border-white/20 text-white/40 hover:text-white/70'}`}>
                                            {listeningFor === idx
                                                ? (cs ? '⌨️ Zmáčkni...' : '⌨️ Press...')
                                                : (cs ? '🔄 Změnit' : '🔄 Change')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Auto-assign button (desktop only) */}
            {!isTouchDevice && (
                <button onClick={autoAssign}
                    className="text-white/30 hover:text-white/60 text-xs font-mono transition-colors">
                    ⚡ {cs ? 'Výchozí klávesy' : 'Default keys'} (SPACE, F, J, K)
                </button>
            )}

            {/* Actions */}
            <div className="flex gap-3 w-full">
                <button onClick={onBack}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm py-3 rounded-lg transition-all">
                    ← {cs ? 'ZPĚT' : 'BACK'}
                </button>
                <button onClick={() => onPlayersReady(players)}
                    disabled={!allReady}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/10 disabled:text-white/20
                        text-black font-black text-sm py-3 rounded-lg transition-all">
                    ⚡ {cs ? 'HRÁT!' : 'PLAY!'}
                </button>
            </div>
        </div>
    );
};

export default PlayerSetup;
