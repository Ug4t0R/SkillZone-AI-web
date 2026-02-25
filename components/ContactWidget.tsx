
import React, { useState, useEffect } from 'react';
import { Phone, MapPin, MessageCircle, X, MessageSquare, Crown } from 'lucide-react';
import { LOCATIONS_CS } from '../data/locations';
import { getMergedLocations } from '../utils/devTools';
import { LocationType, GamingLocation } from '../types';

const ContactWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeLocations, setActiveLocations] = useState<GamingLocation[]>(LOCATIONS_CS);

    useEffect(() => {
        getMergedLocations(LOCATIONS_CS).then(setActiveLocations);
    }, []);

    // Sort: Put PRIVATE (VIP/Bootcamp) first, then others
    const sortedLocations = [...activeLocations].sort((a, b) => {
        if (a.type === LocationType.PRIVATE && b.type !== LocationType.PRIVATE) return -1;
        if (a.type !== LocationType.PRIVATE && b.type === LocationType.PRIVATE) return 1;
        return 0;
    });

    const contacts = sortedLocations.map(loc => ({
        id: loc.id,
        label: loc.name.replace(/Praha \d+: /, '').toUpperCase(), // Simplify name for widget
        sub: loc.type === LocationType.PRIVATE ? 'Private / VIP' : loc.address.split(',')[0],
        phone: loc.phone.replace(/\s/g, ''),
        map: loc.mapLink,
        icon: loc.type === LocationType.PRIVATE ? <Crown className="w-4 h-4 text-yellow-500" /> : null,
        special: loc.type === LocationType.PRIVATE
    }));

    return (
        <div className="fixed bottom-12 right-4 sm:right-6 z-50 flex flex-col items-end font-sans">

            {/* Expanded Options Panel */}
            <div className={`mb-4 bg-zinc-900/95 border border-sz-red/30 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right w-[300px] sm:w-[340px] backdrop-blur-md ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}`}>

                <div className="bg-black/50 p-3 border-b border-white/10 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-orbitron">Rychlý kontakt</span>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {contacts.map((contact) => (
                        <div key={contact.id} className={`flex items-center justify-between p-3 rounded-md ${contact.special ? 'bg-yellow-500/5 border border-yellow-500/20' : 'hover:bg-white/5'}`}>

                            {/* Label */}
                            <div className="flex flex-col max-w-[50%]">
                                <div className="flex items-center gap-2">
                                    {contact.icon}
                                    <span className={`font-bold text-sm font-orbitron truncate ${contact.special ? 'text-yellow-500' : 'text-white'}`}>
                                        {contact.label}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wide truncate">{contact.sub}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Call */}
                                <a
                                    href={`tel:+${contact.phone}`}
                                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-blue-600 text-gray-300 hover:text-white flex items-center justify-center transition-all border border-white/5"
                                    title="Zavolat"
                                >
                                    <Phone className="w-4 h-4" />
                                </a>

                                {/* WhatsApp */}
                                <a
                                    href={`https://wa.me/${contact.phone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-[#25D366] text-gray-300 hover:text-white flex items-center justify-center transition-all border border-white/5"
                                    title="Napsat na WhatsApp"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </a>

                                {/* Map (if available) */}
                                {contact.map ? (
                                    <a
                                        href={contact.map}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-sz-red text-gray-300 hover:text-white flex items-center justify-center transition-all border border-white/5"
                                        title="Navigovat"
                                    >
                                        <MapPin className="w-4 h-4" />
                                    </a>
                                ) : (
                                    <div className="w-10 h-10"></div> // Spacer
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Crisp Chat Trigger — only shown when Crisp is enabled */}
                    {localStorage.getItem('sz_crisp_enabled') === 'true' && (
                        <div className="flex items-center justify-between p-3 rounded-md hover:bg-white/5 border-t border-white/10 mt-2">
                            <div className="flex flex-col max-w-[60%]">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-sz-red" />
                                    <span className="font-bold text-sm font-orbitron text-white truncate">
                                        Online Podpora
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wide truncate">Live Chat (Crisp)</span>
                            </div>

                            <button
                                onClick={() => {
                                    if (window.$crisp) {
                                        window.$crisp.push(['do', 'chat:show']);
                                        window.$crisp.push(['do', 'chat:open']);
                                        setIsOpen(false);
                                    }
                                }}
                                className="h-10 px-4 rounded-full bg-sz-red hover:bg-sz-red-dark text-white text-xs font-bold font-orbitron uppercase flex items-center justify-center transition-all shadow-[0_0_10px_rgba(227,30,36,0.3)] hover:scale-105"
                            >
                                Napsat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-sz-red hover:bg-sz-red-dark text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(227,30,36,0.5)] transition-all hover:scale-110 group relative flex items-center justify-center z-50`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
                ) : (
                    <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:-translate-y-1" />
                )}

                {/* Notification Dot */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-yellow-500 border-2 border-dark-bg rounded-full animate-pulse"></span>
                )}
            </button>
        </div>
    );
};

export default ContactWidget;
