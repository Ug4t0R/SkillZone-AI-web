
import React, { useState, useEffect } from 'react';
import { Zap, Terminal, Activity } from 'lucide-react';
import { getMergedFeedMessages } from '../utils/devTools';
import { subscribeToFeed } from '../services/supabaseClient';
import { getWeather, WeatherData } from '../services/weatherService';

interface LiveFeedProps {
    onChatOpen: () => void;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ onChatOpen }) => {
    const [messages, setMessages] = useState<{ user: string, msg: string }[]>([]);
    const [isLive, setIsLive] = useState(false);
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        getMergedFeedMessages().then(msgs => {
            setMessages([...msgs, ...msgs, ...msgs]);
        });

        // Subscribe to real-time updates
        const subscription = subscribeToFeed((payload) => {
            setIsLive(true);
            const newMsg = { user: payload.new.user_name, msg: payload.new.message };
            setMessages(prev => [newMsg, ...prev.slice(0, 20)]);
            setTimeout(() => setIsLive(false), 3000);
        });

        // Fetch weather
        getWeather().then(setWeather).catch(() => { });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    return (
        <div
            onClick={onChatOpen}
            className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-sz-red/30 z-50 h-8 flex items-center overflow-hidden shadow-[0_-2px_10px_rgba(0,0,0,0.8)] cursor-pointer group transition-colors hover:bg-zinc-900 hover:border-sz-red/80"
        >
            {/* Label */}
            <div className={`h-full px-3 flex items-center justify-center z-20 shadow-lg transition-colors ${isLive ? 'bg-green-600' : 'bg-sz-red group-hover:bg-white group-hover:text-black'}`}>
                {isLive ? <Activity className="w-3 h-3 text-white animate-bounce mr-2" /> : <Terminal className="w-3 h-3 text-white group-hover:text-black animate-pulse mr-2" />}
                <span className="text-[10px] font-bold font-orbitron uppercase tracking-widest hidden sm:inline">
                    {isLive ? 'INCOMING DATA' : 'SYSTEM STATUS'}
                </span>
            </div>

            {/* Scrolling Content */}
            <div className="flex items-center animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
                {messages.map((item, index) => (
                    <div key={index} className="flex items-center mx-6 text-xs font-mono group/item cursor-pointer">
                        <span className={`font-bold mr-2 ${item.user === 'System' || item.user === 'ADMIN' ? 'text-sz-red' : 'text-gray-400 group-hover/item:text-white'}`}>
                            [{item.user}]:
                        </span>
                        <span className="text-gray-300 group-hover/item:text-white transition-colors">
                            {item.msg}
                        </span>
                        {index % 3 === 0 && <Zap className="w-3 h-3 text-yellow-500 ml-6 opacity-50" />}
                    </div>
                ))}
            </div>

            {/* Weather Badge (right side) */}
            {weather && (
                <div className="absolute right-12 top-0 h-full flex items-center z-20 pointer-events-none">
                    <div className="bg-black/80 border-l border-white/10 px-3 h-full flex items-center gap-1.5">
                        <span className="text-[10px]">{weather.emoji}</span>
                        <span className="text-[10px] font-mono text-gray-300 font-bold">{weather.temp}°C</span>
                        <span className="text-[9px] text-gray-500 hidden sm:inline">Praha</span>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-sz-red/90 text-black font-black font-orbitron text-sm uppercase tracking-[0.5em] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                ACCESS TERMINAL
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
        </div>
    );
};

export default LiveFeed;
