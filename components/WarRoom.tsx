
import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Twitch, Users, Clock, ArrowRight, Gamepad2 } from 'lucide-react';
import { EVENTS_DATA_CS, EVENTS_DATA_EN } from '../data/events';
import { getMergedEvents } from '../utils/devTools';
import { useAppContext } from '../context/AppContext';
import { CalendarEvent } from '../types';
import { useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';

const WarRoom: React.FC = () => {
    const { language, t } = useAppContext();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
    const [countdown, setCountdown] = useState<string>('');
    const headingRef = useScrollReveal<HTMLDivElement>();
    const eventsRef = useStaggerReveal<HTMLDivElement>({ staggerDelay: 100 });

    useEffect(() => {
        const baseData = language === 'cs' ? EVENTS_DATA_CS : EVENTS_DATA_EN;
        getMergedEvents(baseData).then(merged => {
            // Filter out hidden/draft events from public view
            const visible = merged.filter(e => !e.hidden);
            setEvents(visible);
            // Find next event
            const now = new Date();
            const upcoming = visible.filter(e => new Date(e.date + 'T' + e.time) > now);
            if (upcoming.length > 0) {
                setNextEvent(upcoming[0]);
            }
        });
    }, [language]);

    useEffect(() => {
        if (!nextEvent) return;

        const timer = setInterval(() => {
            const target = new Date(nextEvent.date + 'T' + nextEvent.time).getTime();
            const now = new Date().getTime();
            const diff = target - now;

            if (diff < 0) {
                setCountdown('LIVE NOW');
            } else {
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setCountdown(`${d}d ${h}h ${m}m ${s}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextEvent]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'tournament': return <Trophy className="w-5 h-5" />;
            case 'stream': return <Twitch className="w-5 h-5" />;
            case 'party': return <Users className="w-5 h-5" />;
            default: return <Gamepad2 className="w-5 h-5" />;
        }
    };

    return (
        <section className="py-20 bg-black relative border-y border-sz-red/30">
            {/* Background Map Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.8)_2px,transparent_2px),linear-gradient(90deg,rgba(20,20,20,0.8)_2px,transparent_2px)] bg-[length:40px_40px] opacity-20 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">

                {/* Header */}
                <div ref={headingRef} className="scroll-reveal sr-glitch flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-sz-red/10 border border-sz-red/30 px-3 py-1 rounded mb-4 animate-pulse">
                            <div className="w-2 h-2 bg-sz-red rounded-full"></div>
                            <span className="text-sz-red font-mono text-xs uppercase font-bold tracking-widest">{t('war_room_status')}</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-orbitron font-black text-white uppercase tracking-tighter">
                            WAR <span className="text-sz-red text-glow">ROOM</span>
                        </h2>
                    </div>

                    {/* Next Event Countdown */}
                    {nextEvent && (
                        <div className="bg-zinc-900 border border-white/10 p-4 rounded min-w-[300px] text-right">
                            <div className="text-gray-500 text-xs font-mono uppercase mb-1">{t('war_room_next')}</div>
                            <div className="text-2xl font-bold text-white font-orbitron truncate mb-1">{nextEvent.title}</div>
                            <div className="text-4xl font-mono text-sz-red font-bold">{countdown}</div>
                        </div>
                    )}
                </div>

                {/* Events List */}
                <div ref={eventsRef} className="sr-stagger scroll-reveal grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="group relative bg-zinc-900/50 border border-white/10 hover:border-sz-red/50 p-6 rounded transition-all duration-300 hover:bg-zinc-900">
                            {/* Decorative Corner */}
                            <div className="absolute top-0 right-0 w-8 h-8 bg-white/5 skew-x-12 -mr-4 -mt-2 group-hover:bg-sz-red/20 transition-colors"></div>

                            <div className="flex items-start gap-4">
                                {/* Date Box */}
                                <div className="bg-black border border-white/20 p-3 rounded text-center min-w-[80px]">
                                    <div className="text-sz-red font-bold font-orbitron text-xl">{new Date(event.date).getDate()}</div>
                                    <div className="text-gray-500 text-xs uppercase font-bold">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                                    <div className="mt-2 pt-2 border-t border-white/10 text-white text-xs font-mono">{event.time}</div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${event.type === 'tournament' ? 'border-yellow-500 text-yellow-500' : 'border-blue-500 text-blue-500'}`}>
                                            {event.game}
                                        </span>
                                        <div className="flex items-center gap-1 text-gray-400 text-xs font-mono uppercase">
                                            {getIcon(event.type)}
                                            {event.type}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white font-orbitron mb-2 group-hover:text-sz-red transition-colors">{event.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{event.description}</p>

                                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-2 text-gray-500 text-xs font-mono">
                                            <Users className="w-3 h-3" /> {event.capacity || 'Unlimited'}
                                        </div>

                                        {event.registrationLink ? (
                                            <a
                                                href={event.registrationLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-white font-bold text-xs uppercase hover:text-sz-red transition-colors"
                                            >
                                                {t('war_room_reg')} <ArrowRight className="w-3 h-3" />
                                            </a>
                                        ) : (
                                            <span className="text-gray-600 text-xs uppercase italic">Info soon</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WarRoom;
