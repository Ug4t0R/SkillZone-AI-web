/**
 * Contact — Public contact page with click-to-reveal phone numbers and WhatsApp links.
 * No emails — SkillZone uses WhatsApp and phone only.
 */
import React, { useState, useCallback } from 'react';
import { Phone, MessageCircle, MapPin, Clock, ExternalLink, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { AppView } from '../types';
import { LOCATIONS_CS } from '../data/locations';
import { trackView } from '../services/analytics';

interface ContactProps {
    onChangeView: (view: AppView) => void;
}

// Click-to-reveal phone component with tracking
const RevealPhone: React.FC<{ phone: string; label: string; className?: string }> = ({ phone, label, className = '' }) => {
    const [revealed, setRevealed] = useState(false);

    const handleReveal = useCallback(() => {
        if (!revealed) {
            setRevealed(true);
            // Track reveal event
            try { trackView('contact_phone_reveal' as any); } catch { }
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'phone_reveal', { event_category: 'contact', event_label: label });
            }
        }
    }, [revealed, label]);

    const handleCall = useCallback(() => {
        try { trackView('contact_phone_call' as any); } catch { }
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'phone_call', { event_category: 'contact', event_label: label });
        }
        window.location.href = `tel:+420${phone.replace(/\s/g, '')}`;
    }, [phone, label]);

    if (!revealed) {
        return (
            <button
                onClick={handleReveal}
                className={`group flex items-center gap-2 text-sm font-mono bg-white/5 hover:bg-sz-red/20 border border-white/10 hover:border-sz-red/50 rounded-lg px-4 py-3 transition-all ${className}`}
            >
                <Phone className="w-4 h-4 text-sz-red" />
                <span className="text-gray-400 group-hover:text-white transition-colors">
                    {phone.slice(0, 5)}•••••
                </span>
                <span className="text-[9px] bg-sz-red/20 text-sz-red px-1.5 py-0.5 rounded ml-auto">ODKRÝT</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleCall}
            className={`group flex items-center gap-2 text-sm font-mono bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 rounded-lg px-4 py-3 transition-all ${className}`}
        >
            <Phone className="w-4 h-4 text-green-400" />
            <span className="text-white font-bold">{phone}</span>
            <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded ml-auto">ZAVOLAT</span>
        </button>
    );
};

// WhatsApp button with tracking
const WhatsAppButton: React.FC<{ phone: string; message?: string; label: string }> = ({ phone, message, label }) => {
    const handleClick = useCallback(() => {
        try { trackView('contact_whatsapp_click' as any); } catch { }
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'whatsapp_click', { event_category: 'contact', event_label: label });
        }
        const cleanPhone = `420${phone.replace(/\s/g, '')}`;
        const url = `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
        window.open(url, '_blank');
    }, [phone, message, label]);

    return (
        <button
            onClick={handleClick}
            className="group flex items-center gap-2 text-sm font-mono bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 rounded-lg px-4 py-3 transition-all w-full"
        >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span className="text-white">WhatsApp</span>
            <ExternalLink className="w-3 h-3 text-gray-500 ml-auto group-hover:text-[#25D366] transition-colors" />
        </button>
    );
};

const Contact: React.FC<ContactProps> = ({ onChangeView }) => {
    const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

    const publicLocations = LOCATIONS_CS.filter(l => l.type === 'PUBLIC' || l.type === 'public');

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505] text-white pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-orbitron font-bold mb-4">
                        <span className="bg-gradient-to-r from-sz-red via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                            KONTAKT
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm max-w-xl mx-auto">
                        Nejrychlejší cesta k nám je přes WhatsApp nebo telefon. Nepoužíváme email — odpovídáme okamžitě.
                    </p>
                </div>

                {/* Main contact card */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-5 h-5 text-sz-red" />
                        <h2 className="text-lg font-orbitron font-bold">Hlavní kontakt</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <WhatsAppButton phone="777 766 112" message="Ahoj, mám dotaz ohledně SkillZone..." label="main" />
                        <RevealPhone phone="777 766 112" label="main" />
                    </div>
                    <p className="text-xs text-gray-600 font-mono mt-4 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Odpovídáme většinou do pár minut, v noci do rána.
                    </p>
                </div>

                {/* Per-location contacts */}
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Kontakty podle poboček
                </h2>
                <div className="space-y-3">
                    {LOCATIONS_CS.map(loc => (
                        <div key={loc.id} className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setExpandedLocation(expandedLocation === loc.id ? null : loc.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                            >
                                <div>
                                    <div className="font-bold text-white text-sm">{loc.name}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">{loc.address}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-gray-500">{loc.openHours}</span>
                                    {expandedLocation === loc.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                </div>
                            </button>
                            {expandedLocation === loc.id && (
                                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <WhatsAppButton phone={loc.phone} message={`Ahoj, mám dotaz ohledně pobočky ${loc.name}...`} label={loc.id} />
                                        <RevealPhone phone={loc.phone} label={loc.id} />
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <button
                                            onClick={() => { onChangeView(`branch_${loc.id}` as AppView); window.scrollTo(0, 0); }}
                                            className="text-[10px] font-mono text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            📍 Detail pobočky
                                        </button>
                                        {loc.mapLink && (
                                            <a
                                                href={loc.mapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-mono text-green-400 hover:text-green-300 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                🗺️ Google Maps <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Business info */}
                <div className="mt-10 bg-white/[0.01] border border-white/5 rounded-xl p-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Obchodní údaje</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono text-gray-500">
                        <div><span className="text-gray-600">Firma:</span> <span className="text-white">SkillZone s.r.o.</span></div>
                        <div><span className="text-gray-600">IČO:</span> <span className="text-white">03674525</span></div>
                        <div><span className="text-gray-600">DIČ:</span> <span className="text-white">CZ03674525</span></div>
                        <div><span className="text-gray-600">Sídlo:</span> <span className="text-white">Na Ohradě 91, 386 01 Strakonice</span></div>
                        <div><span className="text-gray-600">Provozovatel:</span> <span className="text-white">Tomáš Švec</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
