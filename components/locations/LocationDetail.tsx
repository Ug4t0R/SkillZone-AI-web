import React, { useState } from 'react';
import { ArrowLeft, MapPin, Clock, CalendarHeart, MonitorSpeaker, Map, X as XIcon } from 'lucide-react';
import { AppView } from '../../types';
import CyberSeparator from '../CyberSeparator';
import Gallery from '../Gallery';
import { useGalleryImage } from '../../hooks/useGallery';

export interface LocationDataParams {
    id: string;
    title: string;
    description: string;
    subtitle: string;
    heroImage: string;
    address: string;
    openHours: string;
    specs: string[];
    rentUrl?: string; // Optional direct booking param
}

interface LocationDetailProps {
    data?: LocationDataParams;
    onChangeView: (view: AppView) => void;
}

const LocationDetail: React.FC<LocationDetailProps> = ({ data, onChangeView }) => {
    if (!data) return null;

    const floorPlanSrc = useGalleryImage(`fp_${data.id}`, '', { width: 1200, quality: 85 });
    const [lightboxOpen, setLightboxOpen] = useState(false);

    return (
        <div className="pt-20 min-h-screen bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-white transition-colors duration-300">
            {/* Lightbox for floor plan */}
            {lightboxOpen && floorPlanSrc && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
                    >
                        <XIcon className="w-8 h-8" />
                    </button>
                    <img
                        src={floorPlanSrc}
                        alt={`Plánek SkillZone ${data.title}`}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Header / Hero */}
            <div className="relative h-[40vh] min-h-[400px] overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-10" />
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${data.heroImage})` }}
                />

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
                    <button
                        onClick={() => { onChangeView('locations'); window.scrollTo(0, 0); }}
                        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-sz-red transition-colors uppercase font-orbitron tracking-wider text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Všechny Pobočky
                    </button>

                    <h1 className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 text-center">
                        SkillZone <span className="text-sz-red">{data.title}</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 font-mono tracking-widest uppercase text-center mt-2 decoration-sz-red">
                        {data.subtitle}
                    </p>
                </div>

                {/* Cyber grid overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-light-bg dark:from-dark-bg to-transparent z-20 pointer-events-none" />
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Description */}
                        <div>
                            <h2 className="text-3xl font-orbitron font-bold text-sz-red mb-6 uppercase">O Pobočce</h2>
                            <div className="prose prose-invert max-w-none font-mono text-gray-400 dark:text-gray-300 leading-relaxed space-y-4">
                                {data.description.split('\n\n').map((paragraph, idx) => (
                                    <p key={idx}>{paragraph.trim()}</p>
                                ))}
                            </div>
                        </div>

                        {/* Floor Plan */}
                        {floorPlanSrc && (
                            <div>
                                <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-6 uppercase flex items-center gap-3">
                                    <Map className="text-sz-red" />
                                    Mapa Prostor
                                </h3>
                                <div
                                    className="bg-white dark:bg-zinc-900/50 border border-white/10 hover:border-sz-red/30 rounded-sm overflow-hidden cursor-pointer group transition-all shadow-lg"
                                    onClick={() => setLightboxOpen(true)}
                                >
                                    <img
                                        src={floorPlanSrc}
                                        alt={`Plánek prostor SkillZone ${data.title}`}
                                        className="w-full max-h-[500px] object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500"
                                    />
                                    <div className="border-t border-white/5 px-4 py-2 flex items-center justify-center gap-2 text-xs text-gray-500 font-mono uppercase">
                                        <Map className="w-3 h-3" /> Klikni pro zvětšení
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Specs */}
                        <div>
                            <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-6 uppercase flex items-center gap-3">
                                <MonitorSpeaker className="text-sz-red" />
                                Vybavení
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.specs.map((spec, idx) => (
                                    <div key={idx} className="bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 p-4 rounded-sm flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-sz-red mt-2 shrink-0 animate-pulse" />
                                        <span className="font-mono text-gray-600 dark:text-gray-400 text-sm">{spec}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact & Info Box */}
                        <div className="bg-white dark:bg-zinc-900/50 border border-sz-red/30 p-8 relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sz-red/5 rounded-full blur-3xl group-hover:bg-sz-red/10 transition-colors" />

                            <h3 className="text-xl font-orbitron font-bold text-gray-900 dark:text-white mb-6 uppercase">Základní info</h3>

                            <div className="space-y-6 relative z-10">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-sm bg-sz-red/10 flex items-center justify-center shrink-0">
                                        <MapPin className="text-sz-red w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-orbitron uppercase mb-1">Adresa</div>
                                        <div className="font-mono text-gray-600 dark:text-gray-300">{data.address}</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-sm bg-sz-red/10 flex items-center justify-center shrink-0">
                                        <Clock className="text-sz-red w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-orbitron uppercase mb-1">Otevírací doba</div>
                                        <div className="font-mono text-gray-600 dark:text-gray-300">{data.openHours}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rental Call to Action */}
                        <div className="bg-gradient-to-br from-sz-red/10 to-transparent dark:from-sz-red/20 dark:to-black border border-sz-red p-8 flex flex-col items-center text-center shadow-[0_0_30px_rgba(227,30,36,0.1)]">
                            <CalendarHeart className="w-12 h-12 text-sz-red mb-4" />
                            <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-2 uppercase">Soukromý Pronájem</h3>
                            <p className="font-mono text-gray-600 dark:text-gray-400 text-sm mb-8">
                                Hledáš místo pro firemní teambuilding, bootcamp, nebo oslavu narozenin?
                                Zarezervuj si celou pobočku nebo oddělenou místnost jen pro sebe a tvou partu.
                            </p>
                            <button
                                onClick={() => { onChangeView('rentals' as AppView); window.scrollTo(0, 0); }}
                                className="w-full bg-sz-red text-white py-4 font-orbitron font-bold uppercase tracking-widest hover:bg-black transition-colors"
                            >
                                Poptat Pronájem
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CyberSeparator />
            <Gallery />
        </div>
    );
};

export default LocationDetail;
