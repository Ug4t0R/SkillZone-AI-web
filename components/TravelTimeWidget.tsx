
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation, MapPin, Car, Train, Footprints, Loader2, ExternalLink, LocateFixed, Search, Clock, AlertCircle } from 'lucide-react';
import { GamingLocation } from '../types';
import {
    LatLng,
    TravelResult,
    TravelEstimate,
    getTravelEstimates,
    getFallbackEstimates,
    geocodeAddress,
    generateDeepLinks,
    logTravelLookup,
} from '../services/travelTimeService';
import { useAppContext } from '../context/AppContext';

// ─── Bolt & Uber SVG logos (inline for independence) ────────────────

const BoltLogo = () => (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M13.2 2L5 14h6l-1.2 8L18 10h-6l1.2-8z" />
    </svg>
);

const UberLogo = () => (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
    </svg>
);

// ─── Mode config ────────────────────────────────────────────────────

const MODE_CONFIG = {
    walking: {
        icon: <Footprints className="w-4 h-4" />,
        label: { cs: 'Pěšky', en: 'Walking' },
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
    },
    transit: {
        icon: <Train className="w-4 h-4" />,
        label: { cs: 'MHD', en: 'Transit' },
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
    },
    driving: {
        icon: <Car className="w-4 h-4" />,
        label: { cs: 'Autem', en: 'By Car' },
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
    },
};

// ─── Shared user position context ───────────────────────────────────

let sharedUserPosition: LatLng | null = null;
let positionListeners: ((pos: LatLng | null) => void)[] = [];

function subscribeToPosition(cb: (pos: LatLng | null) => void) {
    positionListeners.push(cb);
    return () => { positionListeners = positionListeners.filter(l => l !== cb); };
}

function setSharedPosition(pos: LatLng | null) {
    sharedUserPosition = pos;
    positionListeners.forEach(cb => cb(pos));
}

// ─── Component ──────────────────────────────────────────────────────

interface Props {
    location: GamingLocation;
}

const TravelTimeWidget: React.FC<Props> = ({ location }) => {
    const { language } = useAppContext();
    const cs = language === 'cs';

    const [userPosition, setUserPosition] = useState<LatLng | null>(sharedUserPosition);
    const [result, setResult] = useState<TravelResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [addressInput, setAddressInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Subscribe to shared position
    useEffect(() => {
        const unsub = subscribeToPosition(pos => {
            setUserPosition(pos);
        });
        return unsub;
    }, []);

    // Fetch estimates when position changes
    useEffect(() => {
        if (!userPosition || !location.coordinates) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        getTravelEstimates(userPosition, location.id).then(res => {
            if (cancelled) return;
            if (res) {
                setResult(res);
            } else {
                // Fallback to Haversine estimates
                const fallback = getFallbackEstimates(userPosition, location.id);
                setResult(fallback);
            }
            setLoading(false);
            setExpanded(true);
        }).catch(() => {
            if (cancelled) return;
            const fallback = getFallbackEstimates(userPosition!, location.id);
            setResult(fallback);
            setLoading(false);
            setExpanded(true);
        });

        return () => { cancelled = true; };
    }, [userPosition, location.id, location.coordinates]);

    // Request geolocation
    const handleLocate = useCallback(() => {
        if (!navigator.geolocation) {
            setError(cs ? 'Geolokace není podporována' : 'Geolocation not supported');
            return;
        }

        setLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setSharedPosition(newPos);
                setLocating(false);
                logTravelLookup(location.id, 'geolocation');
            },
            (err) => {
                setLocating(false);
                if (err.code === 1) {
                    setError(cs ? 'Přístup k poloze zamítnut' : 'Location access denied');
                } else {
                    setError(cs ? 'Nepodařilo se získat polohu' : 'Could not get location');
                }
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    }, [location.id, cs]);

    // Search by address
    const handleAddressSearch = useCallback(async () => {
        const addr = addressInput.trim();
        if (!addr) {
            inputRef.current?.focus();
            return;
        }

        setLoading(true);
        setError(null);

        const coords = await geocodeAddress(addr);
        if (coords) {
            setSharedPosition(coords);
            logTravelLookup(location.id, 'address_search');
        } else {
            setError(cs ? 'Adresa nenalezena' : 'Address not found');
        }
        setLoading(false);
    }, [addressInput, location.id, cs]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAddressSearch();
    };

    // Deep link click handler with logging
    const handleTaxiClick = (provider: 'bolt' | 'uber') => {
        if (!result) return;
        const driving = result.estimates.find(e => e.mode === 'driving');
        logTravelLookup(location.id, 'taxi', driving?.durationMinutes, driving?.distanceKm, provider);
        window.open(result.deepLinks[provider], '_blank');
    };

    const handleModeClick = (estimate: TravelEstimate) => {
        if (!result) return;
        logTravelLookup(location.id, estimate.mode, estimate.durationMinutes, estimate.distanceKm);
        window.open(result.deepLinks.googleMaps.replace('travelmode=transit', `travelmode=${estimate.mode === 'driving' ? 'driving' : estimate.mode === 'walking' ? 'walking' : 'transit'}`), '_blank');
    };

    // No coordinates for this location
    if (!location.coordinates) return null;

    return (
        <div className="mb-6 rounded-sm overflow-hidden border border-gray-200 dark:border-white/10 transition-all duration-300">
            {/* Header — always visible */}
            <div
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/70 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition-colors"
                onClick={() => { if (!expanded) setExpanded(true); else if (!result) setExpanded(false); }}
            >
                <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sz-red" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                        {cs ? 'Jak se k nám dostaneš?' : 'How to get here?'}
                    </span>
                </div>
                {result && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                        <Clock className="w-3 h-3" />
                        {result.estimates.find(e => e.mode === 'transit')?.durationText || result.estimates[0]?.durationText}
                    </div>
                )}
            </div>

            {/* Expanded content */}
            <div className={`transition-all duration-300 overflow-hidden ${expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 space-y-4 bg-white dark:bg-zinc-900/30">

                    {/* Location buttons + address input */}
                    {!result && !loading && (
                        <div className="space-y-3">
                            <button
                                onClick={handleLocate}
                                disabled={locating}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-sz-red hover:bg-red-700 text-white font-bold text-sm uppercase rounded-sm transition-colors disabled:opacity-50"
                            >
                                {locating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {cs ? 'Zjišťuji polohu...' : 'Getting location...'}</>
                                ) : (
                                    <><LocateFixed className="w-4 h-4" /> {cs ? 'Použít moji polohu' : 'Use my location'}</>
                                )}
                            </button>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                                <span>{cs ? 'nebo' : 'or'}</span>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                            </div>

                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={addressInput}
                                    onChange={e => setAddressInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={cs ? 'Zadej adresu nebo stanici...' : 'Enter address or station...'}
                                    className="flex-1 bg-gray-100 dark:bg-black border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white text-sm px-3 py-2.5 rounded-sm font-mono placeholder:text-gray-400"
                                />
                                <button
                                    onClick={handleAddressSearch}
                                    className="bg-gray-900 dark:bg-zinc-800 hover:bg-sz-red text-white px-4 py-2.5 rounded-sm transition-colors"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-black/30 rounded-sm animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700" />
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-20 mb-2" />
                                        <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-32" />
                                    </div>
                                    <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded w-12" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Travel estimates */}
                    {result && !loading && (
                        <>
                            <div className="space-y-2">
                                {result.estimates.map(estimate => {
                                    const cfg = MODE_CONFIG[estimate.mode];
                                    return (
                                        <button
                                            key={estimate.mode}
                                            onClick={() => handleModeClick(estimate)}
                                            className={`w-full flex items-center gap-3 p-3 ${cfg.bg} border ${cfg.border} rounded-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center border ${cfg.border}`}>
                                                {cfg.icon}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className={`text-sm font-bold ${cfg.color}`}>
                                                    {cfg.label[language]}
                                                </div>
                                                {estimate.transitDetails && (
                                                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                                        {estimate.transitDetails}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black font-mono text-gray-900 dark:text-white">
                                                    {estimate.durationText}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    {estimate.distanceText}
                                                </div>
                                            </div>
                                            <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Taxi section */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => handleTaxiClick('bolt')}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#34D186] hover:bg-[#2dbe78] text-white text-xs font-bold uppercase rounded-sm transition-colors"
                                >
                                    <BoltLogo />
                                    Bolt
                                    <span className="text-white/70">
                                        ~{result.estimates.find(e => e.mode === 'driving')?.durationText || '?'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleTaxiClick('uber')}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase rounded-sm transition-colors border border-white/10"
                                >
                                    <UberLogo />
                                    Uber
                                    <span className="text-white/50">
                                        ~{result.estimates.find(e => e.mode === 'driving')?.durationText || '?'}
                                    </span>
                                </button>
                            </div>

                            {/* Change address */}
                            <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={addressInput}
                                        onChange={e => setAddressInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={cs ? 'Změnit startovní adresu...' : 'Change starting address...'}
                                        className="flex-1 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-xs px-3 py-2 rounded-sm font-mono placeholder:text-gray-400"
                                    />
                                    <button
                                        onClick={handleAddressSearch}
                                        className="text-gray-500 hover:text-sz-red px-2 transition-colors"
                                    >
                                        <Search className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={handleLocate}
                                        className="text-gray-500 hover:text-sz-red px-2 transition-colors"
                                    >
                                        <LocateFixed className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TravelTimeWidget;
