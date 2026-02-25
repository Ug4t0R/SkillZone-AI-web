
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Phone, Lock, Navigation, Map, Car, Search, Grid, Globe, Zap, AlertCircle } from 'lucide-react';
import { LOCATIONS_CS, LOCATIONS_EN } from '../data/locations';
import { LocationType, GamingLocation } from '../types';
import AllLocationsMap from './AllLocationsMap';
import InteractiveMap from './InteractiveMap';
import TravelTimeWidget from './TravelTimeWidget';
import { useAppContext } from '../context/AppContext';
import { getMergedLocations } from '../utils/devTools';

const Locations: React.FC = () => {
    const [reveal, setReveal] = useState(false);
    const [mapView, setMapView] = useState<'tactical' | 'real'>('tactical');
    const [locationsData, setLocationsData] = useState<GamingLocation[]>([]);
    const { language, t } = useAppContext();

    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => setReveal(true), 100);
    }, []);

    useEffect(() => {
        const baseData = language === 'cs' ? LOCATIONS_CS : LOCATIONS_EN;
        getMergedLocations(baseData).then(setLocationsData);
    }, [language]);



    const getStatus = (loc: GamingLocation) => {
        if (loc.openHours.toUpperCase().includes('NONSTOP')) {
            return { label: language === 'cs' ? 'NONSTOP 24/7' : '24/7 NONSTOP', color: 'text-sz-red', icon: <Zap className="w-3 h-3 animate-pulse" /> };
        }

        const now = new Date();
        const currentHour = now.getHours() + now.getMinutes() / 60;

        // Simple parser for formats like "12:00 – 03:00+"
        const times = loc.openHours.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
        if (!times) return { label: loc.openHours, color: 'text-gray-500', icon: <Clock className="w-3 h-3" /> };

        const start = parseInt(times[1]) + parseInt(times[2]) / 60;
        let end = parseInt(times[3]) + parseInt(times[4]) / 60;

        // Handle closing after midnight (03:00+)
        const isAfterMidnight = loc.openHours.includes('+') || end < start;
        if (isAfterMidnight && currentHour < 12) {
            // It's early morning, check if we're still before closing
            if (currentHour < end) {
                const diff = (end - currentHour) * 60;
                return {
                    label: language === 'cs' ? `ZAVÍRÁ ZA ${Math.floor(diff / 60)}h ${Math.floor(diff % 60)}m` : `CLOSES IN ${Math.floor(diff / 60)}h ${Math.floor(diff % 60)}m`,
                    color: 'text-green-500',
                    icon: <Clock className="w-3 h-3" />
                };
            }
        } else {
            // Standard check
            const effectiveEnd = isAfterMidnight ? end + 24 : end;
            const effectiveCurrent = (isAfterMidnight && currentHour < 12) ? currentHour + 24 : currentHour;

            if (effectiveCurrent >= start && effectiveCurrent < effectiveEnd) {
                const diff = (effectiveEnd - effectiveCurrent) * 60;
                return {
                    label: language === 'cs' ? `ZAVÍRÁ ZA ${Math.floor(diff / 60)}h ${Math.floor(diff % 60)}m` : `CLOSES IN ${Math.floor(diff / 60)}h ${Math.floor(diff % 60)}m`,
                    color: 'text-green-500',
                    icon: <Clock className="w-3 h-3" />
                };
            }
        }

        return { label: language === 'cs' ? 'ZAVŘENO' : 'CLOSED', color: 'text-red-500', icon: <AlertCircle className="w-3 h-3" /> };
    };



    return (
        <section id="locations" ref={sectionRef} className="pt-32 pb-24 px-4 relative bg-light-bg dark:bg-dark-bg min-h-screen transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className={`mb-12 transition-all duration-700 transform ${reveal ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <h2 className="text-4xl md:text-6xl font-orbitron font-black uppercase tracking-tight text-gray-900 dark:text-white">
                            {t('loc_title')} <span className="text-sz-red">{t('loc_title_sub')}</span>
                        </h2>
                        <div className="flex bg-gray-200 dark:bg-zinc-900 p-1 rounded-sm border border-gray-300 dark:border-white/10">
                            <button onClick={() => setMapView('tactical')} className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-2 rounded-sm transition-all ${mapView === 'tactical' ? 'bg-white dark:bg-black text-sz-red shadow-sm' : 'text-gray-500'}`}><Grid className="w-3 h-3" /> {t('loc_view_tactical')}</button>
                            <button onClick={() => setMapView('real')} className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-2 rounded-sm transition-all ${mapView === 'real' ? 'bg-white dark:bg-black text-sz-red shadow-sm' : 'text-gray-500'}`}><Globe className="w-3 h-3" /> {t('loc_view_real')}</button>
                        </div>
                    </div>
                    {mapView === 'tactical' ? <AllLocationsMap /> : <InteractiveMap />}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16">
                    {locationsData.map((loc, index) => {
                        const status = getStatus(loc);
                        return (
                            <div key={loc.id} id={loc.id} className={`group relative bg-white dark:bg-card-bg border border-gray-200 dark:border-white/5 hover:border-sz-red/50 transition-all duration-700 flex flex-col transform ${reveal ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} shadow-lg`} style={{ transitionDelay: `${index * 100}ms` }}>
                                <div className="h-72 w-full relative overflow-hidden">
                                    <div className="absolute top-0 left-0 bg-sz-red text-white font-bold font-orbitron text-xs px-4 py-2 z-10 uppercase skew-x-12 -ml-2">
                                        <span className="block -skew-x-12">{loc.type === LocationType.PUBLIC ? t('loc_public_zone') : t('loc_private_sector')}</span>
                                    </div>
                                    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                                        <div className="bg-black/80 backdrop-blur border border-sz-red/30 px-3 py-1 rounded-sm"><span className="text-sz-red font-mono text-xs font-bold">EST. {loc.openYear}</span></div>
                                        <div className={`bg-black/90 backdrop-blur border border-white/10 px-3 py-1 rounded-sm flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-tighter shadow-xl ${status.color}`}>
                                            {status.icon}
                                            {status.label}
                                        </div>
                                    </div>
                                    <img src={loc.imgUrl} alt={loc.name} loading="lazy" className="w-full h-full object-cover transition-all transform lg:filter lg:grayscale lg:opacity-90 dark:lg:opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-card-bg via-white/50 dark:via-card-bg/50 to-transparent"></div>
                                    <div className="absolute bottom-4 left-6 right-6">
                                        <h3 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-1 uppercase drop-shadow-lg">{loc.name}</h3>
                                        <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm gap-2">
                                            <MapPin className="w-4 h-4 text-sz-red" />
                                            <span className="font-mono">{loc.address}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex-1 border-l-2 border-gray-200 dark:border-white/10 pl-4">{loc.description}</p>
                                    <div className="grid grid-cols-2 gap-2 mb-8 bg-gray-100 dark:bg-black/30 p-4 rounded border border-gray-200 dark:border-white/5">
                                        {loc.specs.map((spec, i) => (<div key={i} className="flex items-center gap-2 text-xs font-mono text-gray-700 dark:text-gray-400 uppercase"><span className="text-sz-red text-lg leading-none">•</span>{spec}</div>))}
                                    </div>
                                    <TravelTimeWidget location={loc} />
                                    <div className="border-t border-gray-200 dark:border-white/5 pt-6 flex justify-between items-end">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3 text-gray-900 dark:text-white"><Clock className="w-4 h-4 text-sz-red" /><span className="font-bold tracking-wide text-sm">{loc.openHours}</span></div>
                                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-mono text-xs"><Phone className="w-4 h-4 text-sz-red" />{loc.phone}</div>
                                        </div>
                                        <a href={loc.mapLink} target="_blank" className="bg-zinc-800 hover:bg-sz-red text-white p-3 rounded-full transition-all"><Navigation className="w-5 h-5" /></a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Locations;
