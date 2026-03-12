import React, { useState, useMemo, useEffect } from 'react';
import { Crown, Star, Gem, Zap, Users, Clock, Monitor, Gamepad2, Moon, CalendarDays, Gift, Heart, UserPlus, Calculator, ChevronDown, ChevronUp, MapPin, Lightbulb, CheckCircle2, Info, AlertTriangle, Phone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getYearsOnMarket } from '../utils/founding';
import {
    MEMBER_TIERS, TOP_UP_BONUSES, EXTRA_FEES, PACKAGES, LOCATIONS,
    type SeatType,
} from '../data/pricing';


// ─── Component ───────────────────────────────────────────────────────

const Pricing: React.FC = () => {
    const { language } = useAppContext();
    const cs = language === 'cs';

    // Calculator state
    const [calcLocation, setCalcLocation] = useState('zizkov');
    const [calcHours, setCalcHours] = useState(3);
    const [calcSeat, setCalcSeat] = useState<SeatType>('standard');
    const [calcNight, setCalcNight] = useState(false);
    const [calcSaturday, setCalcSaturday] = useState(false);
    const [calcDayLAN, setCalcDayLAN] = useState(false);
    const [calcNightLAN, setCalcNightLAN] = useState(false);

    // UX state
    const [showFullCalc, setShowFullCalc] = useState(false);
    const [bonusSlider, setBonusSlider] = useState(500);
    const [timeAutoApplied, setTimeAutoApplied] = useState<string[]>([]);
    const [showTierDetails, setShowTierDetails] = useState(false);

    // Current location config
    const currentLoc = LOCATIONS.find(l => l.id === calcLocation) || LOCATIONS[0];

    // Auto-detect surcharges based on current time
    useEffect(() => {
        const now = new Date();
        const day = now.getDay(); // 0=Sun, 6=Sat
        const hour = now.getHours();
        const applied: string[] = [];

        // Saturday from 12:00 onward
        if (day === 6 && hour >= 12) {
            setCalcSaturday(true);
            applied.push('saturday');
        }

        // Night: midnight (0:00) to 6:00
        if (hour >= 0 && hour < 6) {
            setCalcNight(true);
            applied.push('night');
        }

        setTimeAutoApplied(applied);
    }, []);

    // Reset seat type when location changes and seat is unavailable
    useEffect(() => {
        if (calcSeat === 'vip' && !currentLoc.hasVip) setCalcSeat('standard');
        // Reset package options when switching locations
        if (!currentLoc.hasDayLAN) setCalcDayLAN(false);
        if (!currentLoc.hasNightLAN) setCalcNightLAN(false);
    }, [calcLocation]);

    // Is any package active?
    const isPackageActive = calcDayLAN || calcNightLAN;

    // Price calculator
    const calcResult = useMemo(() => {
        const results: Record<string, { hourly: number; total: number; totalSat: number }> = {};

        // Seat surcharges (one-time per visit)
        const getEsportSurcharge = (tierId: string): number => {
            if (calcSeat !== 'esport') return 0;
            // Guests & Basic/Sleeper pay 90, Premium & Ultras pay 60
            return (tierId === 'premium' || tierId === 'ultras') ? 60 : 90;
        };
        const getVipSurcharge = (): number => {
            if (calcSeat !== 'vip' || !currentLoc.hasVip) return 0;
            return 30;
        };

        // Night surcharge (not for Premium/Ultras)
        let nightSurcharge = 0;
        if (calcNight) nightSurcharge = 50;

        for (const tier of MEMBER_TIERS) {
            const hourly = tier.price;
            let total: number;

            if (calcDayLAN || calcNightLAN) {
                // DayLAN / NightLAN balíček
                if (currentLoc.dayLANPromoPrice && calcDayLAN) {
                    // Háje / Stodůlky akční DayLAN cena
                    total = currentLoc.dayLANPromoPrice;
                } else {
                    total = (tier.id === 'premium' || tier.id === 'ultras') ? 495 : 595;
                }
            } else {
                total = hourly * calcHours;
            }

            // Apply seat surcharges
            total += getEsportSurcharge(tier.id);
            total += getVipSurcharge();

            // Night surcharge (Premium & Ultras exempt)
            if (tier.id !== 'ultras' && tier.id !== 'premium') total += nightSurcharge;

            const totalSat = total + (calcSaturday ? 30 : 0);
            results[tier.id] = { hourly, total, totalSat };
        }

        // Guest logic
        const guestBase = 120 + Math.max(0, calcHours - 1) * 60;
        let guestTotal: number;

        if (calcDayLAN || calcNightLAN) {
            if (currentLoc.dayLANPromoPrice && calcDayLAN) {
                guestTotal = currentLoc.dayLANPromoPrice;
            } else {
                guestTotal = 595;
            }
        } else {
            guestTotal = guestBase;
        }

        guestTotal += getEsportSurcharge('guest');
        guestTotal += getVipSurcharge();
        guestTotal += nightSurcharge;

        const guestTotalSat = guestTotal + (calcSaturday ? 30 : 0);
        results['guest'] = { hourly: 120, total: guestTotal, totalSat: guestTotalSat };

        return results;
    }, [calcLocation, calcHours, calcSeat, calcNight, calcSaturday, calcDayLAN, calcNightLAN, currentLoc]);

    // Bonus effective pricing
    const bonusInfo = useMemo(() => {
        const matchedTiers = TOP_UP_BONUSES.filter(b => bonusSlider >= b.amount);
        const bestTier = matchedTiers[matchedTiers.length - 1];
        const bonusMinutes = bestTier?.bonus ?? 0;
        const hasPerk = bestTier?.perk === 'premium30';
        const effectiveRates = MEMBER_TIERS.map(tier => {
            const baseMinutes = (bonusSlider / tier.price) * 60;
            const totalMinutes = baseMinutes + bonusMinutes;
            const effectiveRate = Math.round((bonusSlider / (totalMinutes / 60)) * 10) / 10;
            return { tier: tier.id, name: tier.name, icon: tier.icon, base: tier.price, effective: effectiveRate };
        });
        return { bonus: bonusMinutes, perk: hasPerk ? 'premium30' : null, rates: effectiveRates };
    }, [bonusSlider]);

    // Helper specific texts for Guest vs Member
    const textGuestTitle = cs ? 'Neregistrovaný Guest' : 'Unregistered Guest';
    const textMemberTitle = cs ? 'Registrovaný Člen' : 'Registered Member';

    return (
        <section className="py-20 px-4 relative overflow-hidden bg-light-bg dark:bg-dark-bg transition-colors duration-300">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-sz-red/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                {/* ─── Header ────────────────────────────── */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-orbitron font-black mb-4 uppercase text-gray-900 dark:text-white">
                        {cs ? 'CENÍK' : 'PRICE LIST'} <span className="text-sz-red">SKILLZONE</span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-mono">
                        {cs ? 'Rychleji. Férověji. Bez závazků.' : 'Faster. Fairer. No commitments.'}
                    </p>
                </div>

                {/* ─── Guide / Wizard Banner ──────────────── */}
                <div className="mb-12 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-sz-red" />
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <h2 className="text-xl md:text-2xl font-orbitron font-bold flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
                                <Lightbulb className="text-yellow-400" />
                                {cs ? 'Nevíš si rady?' : 'Not sure what to pick?'}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {cs 
                                    ? 'Jako jediní v Praze nabízíme hraní úplně bez registrace. A pro pravidelné hráče máme členství zdarma s cenou, která se automaticky snižuje podle toho, jak často chodíš.' 
                                    : 'We\'re the only gaming center in Prague where you can play without any registration. And for regulars, we offer free membership with prices that automatically drop based on how often you visit.'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => {
                                    document.getElementById('guest-card')?.scrollIntoView({behavior: 'smooth', block: 'center'});
                                }}
                                className="px-5 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 font-bold font-mono hover:scale-105 transition-transform text-sm md:text-base text-center"
                            >
                                {cs ? 'Jdu poprvé na zkoušku' : 'First time trying out'}
                            </button>
                            <button 
                                onClick={() => {
                                    document.getElementById('member-card')?.scrollIntoView({behavior: 'smooth', block: 'center'});
                                }}
                                className="px-5 py-3 rounded-xl bg-sz-red text-white font-bold font-mono shadow-lg shadow-sz-red/30 hover:scale-105 transition-transform text-sm md:text-base text-center"
                            >
                                {cs ? 'Chci chodit pravidelně' : 'Plan to visit regularly'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Main Comparison: Guest vs Member ───────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    
                    {/* GUEST MODE - Prioritized! */}
                    <div id="guest-card" className="glass-panel rounded-2xl p-6 border-2 border-blue-400/30 flex flex-col h-full relative overflow-hidden group hover:border-blue-400/60 transition-colors">
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                            {cs ? 'Bezstarostný start' : 'Hassle-free start'}
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-orbitron font-black text-2xl text-gray-900 dark:text-white uppercase">Guest</h3>
                                <p className="text-blue-500 font-mono text-sm">{cs ? 'Neregistrovaný hráč' : 'Unregistered player'}</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong className="text-gray-900 dark:text-white">{cs ? '0 minut byrokracie.' : '0 minutes bureaucracy.'}</strong><br/>
                                    {cs ? 'Žádné občanky, žádné formuláře.' : 'No IDs, no forms.'}
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong className="text-gray-900 dark:text-white">{cs ? 'Zaplať a hraj.' : 'Pay and play.'}</strong><br/>
                                    {cs ? 'Řekni kolik hodin chceš a jdeme na to.' : 'Tell us how many hours you want and let\'s go.'}
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong className="text-gray-900 dark:text-white">{cs ? 'Přístup ke všem PC.' : 'Access to all PCs.'}</strong><br/>
                                    {cs ? 'Chceš lepší monitor? Stačí jednorázový příplatek.' : 'Want a better monitor? Just a one-time upgrade fee.'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold uppercase">{cs ? '1. hodina' : '1st hour'}</div>
                                <div className="text-xl font-black text-gray-900 dark:text-white">120<span className="text-xs text-gray-500 font-normal">,- Kč</span></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold uppercase">{cs ? 'Každá další' : 'Each extra'}</div>
                                <div className="text-xl font-black text-gray-900 dark:text-white">60<span className="text-xs text-gray-500 font-normal">,- Kč</span></div>
                            </div>
                        </div>
                    </div>

                    {/* MEMBER MODE */}
                    <div id="member-card" className="glass-panel rounded-2xl p-6 border-2 border-sz-red/30 flex flex-col h-full relative overflow-hidden group hover:border-sz-red/60 transition-colors">
                        <div className="absolute top-0 right-0 bg-sz-red text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                            {cs ? 'Pro fajnšmekry' : 'For enthusiasts'}
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-sz-red/10 flex items-center justify-center">
                                <Crown className="w-6 h-6 text-sz-red" />
                            </div>
                            <div>
                                <h3 className="font-orbitron font-black text-2xl text-gray-900 dark:text-white uppercase">Member</h3>
                                <p className="text-sz-red font-mono text-sm">{cs ? 'Registrovaný člen' : 'Registered member'}</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-sz-red shrink-0 mt-0.5" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong className="text-gray-900 dark:text-white">{cs ? 'Registrace je zdarma.' : 'Registration is free.'}</strong><br/>
                                    {cs ? 'Zabere 2 minuty na baru (stačí OP a telefon).' : 'Takes 2 mins at the bar (ID and phone needed).'}
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-sz-red shrink-0 mt-0.5" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong className="text-gray-900 dark:text-white">{cs ? 'Levněji za věrnost.' : 'Cheaper for loyalty.'}</strong><br/>
                                    {cs ? 'Čím víc chodíš (za 90 dní), tím levnější.' : 'The more you visit (in 90 days), the cheaper.'}
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-sz-red shrink-0 mt-0.5" />
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong className="text-gray-900 dark:text-white">{cs ? 'Bonusy za dobití.' : 'Top-up bonuses.'}</strong><br/>
                                    {cs ? 'Dobij si kredit a získej hodiny navíc.' : 'Top up credit and get extra hours free.'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-sz-red/5 rounded-xl p-5 border border-red-100 dark:border-sz-red/20">
                            {/* Summary row */}
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-sz-red font-mono font-bold uppercase">{cs ? 'Hodinová sazba' : 'Hourly rate'}</div>
                                <div className="text-xl font-black text-gray-900 dark:text-white">79–49<span className="text-xs text-gray-500 font-normal">,- Kč/h</span></div>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1 mb-3">
                                {cs ? 'Čím víc chodíš (za 90 dní), tím levnější. Cena klesá automaticky.' : 'The more you visit (in 90 days), the cheaper. Price drops automatically.'}
                            </p>

                            {/* Expand/collapse */}
                            <button
                                onClick={() => setShowTierDetails(!showTierDetails)}
                                className="w-full flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-sz-red hover:text-red-400 transition-colors py-1"
                            >
                                {showTierDetails
                                    ? <>{cs ? 'Skrýt úrovně' : 'Hide tiers'} <ChevronUp className="w-3 h-3" /></>
                                    : <>{cs ? 'Zobrazit úrovně a počty návštěv' : 'Show tiers & visit counts'} <ChevronDown className="w-3 h-3" /></>
                                }
                            </button>

                            {/* Detailed tiers */}
                            {showTierDetails && (
                                <div className="mt-3 pt-3 border-t border-red-100 dark:border-sz-red/20 space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-sz-red font-mono font-bold uppercase">🚀 Sleeper</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{cs ? '(nový člen)' : '(new member)'}</span>
                                        </div>
                                        <div className="text-sm font-black text-gray-900 dark:text-white">79<span className="text-[10px] text-gray-500 font-normal">,- Kč/h</span></div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-sz-red font-mono font-bold uppercase">⭐ Basic</span>
                                            <span className="text-[10px] text-gray-400 font-mono">1–8 {cs ? 'návštěv' : 'visits'}</span>
                                        </div>
                                        <div className="text-sm font-black text-gray-900 dark:text-white">69<span className="text-[10px] text-gray-500 font-normal">,- Kč/h</span></div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-sz-red font-mono font-bold uppercase">💎 Premium</span>
                                            <span className="text-[10px] text-gray-400 font-mono">9–23 {cs ? 'návštěv' : 'visits'}</span>
                                        </div>
                                        <div className="text-sm font-black text-gray-900 dark:text-white">59<span className="text-[10px] text-gray-500 font-normal">,- Kč/h</span></div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-sz-red font-mono font-bold uppercase">🏆 ULTRAS</span>
                                            <span className="text-[10px] text-gray-400 font-mono">24+ {cs ? 'návštěv' : 'visits'}</span>
                                        </div>
                                        <div className="text-sm font-black text-sz-red">49<span className="text-[10px] font-normal">,- Kč/h</span></div>
                                    </div>

                                    {/* Premium trial tip */}
                                    <div className="mt-3 pt-3 border-t border-red-100/50 dark:border-sz-red/10">
                                        <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
                                            <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                                            {cs
                                                ? <span><strong className="text-gray-900 dark:text-white">Tip:</strong> Při dobití od 1 000 Kč získáš Premium na 30 dní — i bez 9 návštěv. Ideální na vyzkoušení.</span>
                                                : <span><strong className="text-gray-900 dark:text-white">Tip:</strong> Top up 1 000 CZK or more and get Premium for 30 days — even without 9 visits. Great for trying it out.</span>
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* ─── Interactive Calculator & Fees ───────────────── */}
                <div className="mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-4xl font-orbitron font-black text-gray-900 dark:text-white uppercase">
                            {cs ? 'Jednoduchá kalkulačka' : 'Simple Calculator'}
                        </h2>
                        <p className="text-gray-500 font-mono mt-2">
                            {cs ? 'Nastav si parametry a hned uvidíš, kolik zaplatíš.' : 'Set your parameters and immediately see your price.'}
                        </p>
                    </div>

                    <div className="glass-panel rounded-2xl p-6 lg:p-8 border border-black/5 dark:border-white/10 max-w-4xl mx-auto shadow-2xl">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Controls */}
                            <div className="space-y-6 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 pb-6 md:pb-0 md:pr-8">
                                
                                {/* Pobočka */}
                                <div>
                                    <label className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                        <MapPin className="w-3 h-3" /> {cs ? 'Kde budeš hrát?' : 'Where will you play?'}
                                    </label>
                                    <div className="flex gap-2 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                                        {LOCATIONS.map(loc => (
                                            <button key={loc.id}
                                                onClick={() => setCalcLocation(loc.id)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                                                        ${calcLocation === loc.id
                                                        ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                    }`}>
                                                {cs ? loc.nameCs : loc.nameEn}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Čas */}
                                <div>
                                    <label className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                        <Clock className="w-3 h-3" /> {cs ? 'Jak dlouho?' : 'How long?'}
                                    </label>
                                    <div className="grid grid-cols-5 gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map(h => (
                                            <button key={h} onClick={() => { setCalcHours(h); setCalcDayLAN(false); setCalcNightLAN(false); }}
                                                className={`py-2 rounded-lg text-sm font-mono font-bold transition-all
                                                        ${calcHours === h && !isPackageActive
                                                        ? 'bg-sz-red text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                    }`}>
                                                {h}h
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-5 gap-1 mb-2">
                                        {[6, 7, 8, 9, 10].map(h => (
                                            <button key={h} onClick={() => { setCalcHours(h); setCalcDayLAN(false); setCalcNightLAN(false); }}
                                                className={`py-2 rounded-lg text-sm font-mono font-bold transition-all
                                                        ${calcHours === h && !isPackageActive
                                                        ? 'bg-sz-red text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                    }`}>
                                                {h}h
                                            </button>
                                        ))}
                                    </div>

                                    {/* Package buttons — context-dependent on location */}
                                    <div className="space-y-1">
                                        {currentLoc.hasDayLAN && (
                                            <button onClick={() => { setCalcDayLAN(!calcDayLAN); setCalcNightLAN(false); }}
                                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-mono font-bold transition-all border
                                                        ${calcDayLAN
                                                        ? 'bg-sz-red border-sz-red text-white' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                                    }`}>
                                                ☀️ DayLAN ({currentLoc.dayLANTime}){currentLoc.dayLANPromoPrice ? ` — ${cs ? 'AKCE' : 'PROMO'} ${currentLoc.dayLANPromoPrice},- Kč` : ''}
                                            </button>
                                        )}
                                        {currentLoc.hasNightLAN && (
                                            <button onClick={() => { setCalcNightLAN(!calcNightLAN); setCalcDayLAN(false); }}
                                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-mono font-bold transition-all border
                                                        ${calcNightLAN
                                                        ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                                    }`}>
                                                🌙 NightLAN ({currentLoc.nightLANTime})
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Upgrady PC (Jednorázové) */}
                                <div>
                                    <label className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                        <Monitor className="w-3 h-3" /> {cs ? 'Jaký PC? (Příplatek jen 1x za návštěvu)' : 'Which PC? (One-time fee per visit)'}
                                    </label>
                                    <div className="flex gap-2 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                                        {([
                                            { id: 'standard' as SeatType, label: 'STANDARD', available: true },
                                            { id: 'vip' as SeatType, label: 'VIP', available: currentLoc.hasVip },
                                            { id: 'esport' as SeatType, label: 'ESPORT', available: currentLoc.hasEsport },
                                        ]).map(s => (
                                            <button key={s.id}
                                                onClick={() => s.available && setCalcSeat(s.id)}
                                                disabled={!s.available}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all
                                                        ${!s.available
                                                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
                                                        : calcSeat === s.id
                                                        ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                    }`}>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Seat type info */}
                                    {calcSeat === 'esport' && (
                                        <div className="mt-2 bg-red-50 dark:bg-sz-red/5 border border-red-100 dark:border-sz-red/20 rounded-lg p-3 flex gap-2 items-start text-left">
                                            <Info className="w-4 h-4 text-sz-red shrink-0 mt-0.5" />
                                            <div className="text-xs text-red-800 dark:text-red-300">
                                                {cs
                                                ? 'Esport PC: +90 Kč pro Hosty, Sleeper a Basic | +60 Kč pro Premium a ULTRAS'
                                                : 'Esport PC: +90 CZK for Guests, Sleeper & Basic | +60 CZK for Premium & ULTRAS'}
                                            </div>
                                        </div>
                                    )}
                                    {calcSeat === 'vip' && currentLoc.hasVip && (
                                        <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-3 flex gap-2 items-start text-left">
                                            <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                            <div className="text-xs text-yellow-800 dark:text-yellow-300">
                                                {cs ? 'VIP PC: +30 Kč jednorázově za návštěvu' : 'VIP PC: +30 CZK one-time per visit'}
                                            </div>
                                        </div>
                                    )}
                                    {calcSeat === 'standard' && (
                                        <div className="mt-2 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg p-3 flex gap-2 items-start text-left">
                                            <Info className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <div className="text-xs text-green-800 dark:text-green-300">
                                                {cs ? 'Standard PC: bez příplatku, 240Hz monitor' : 'Standard PC: no surcharge, 240Hz monitor'}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Noční & Víkend (Jednorázové) */}
                                <div>
                                    <label className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                        <CalendarDays className="w-3 h-3" /> {cs ? 'Kdy budeš hrát?' : 'When will you play?'}
                                    </label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setCalcNight(!calcNight)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-mono font-bold transition-all border
                                                    ${calcNight
                                                    ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400'
                                                }`}>
                                            <Moon className="w-4 h-4" /> {cs ? 'Noc' : 'Night'}
                                        </button>
                                        <button onClick={() => setCalcSaturday(!calcSaturday)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-mono font-bold transition-all border
                                                    ${calcSaturday
                                                    ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400'
                                                }`}>
                                            <CalendarDays className="w-4 h-4" /> {cs ? 'Sobota' : 'Saturday'}
                                        </button>
                                    </div>
                                </div>

                                {/* Auto-detected time info */}
                                {timeAutoApplied.length > 0 && (
                                    <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-lg p-3 flex gap-2 items-start text-left animate-in fade-in">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div className="text-xs text-amber-800 dark:text-amber-300">
                                            {cs
                                                ? <>Automaticky jsme zaškrtli {timeAutoApplied.includes('night') && <strong>noční příplatek</strong>}{timeAutoApplied.includes('night') && timeAutoApplied.includes('saturday') && ' a '}{timeAutoApplied.includes('saturday') && <strong>sobotní příplatek</strong>}, protože právě teď {timeAutoApplied.includes('night') ? 'je noc (00:00–06:00)' : 'je sobota'}. Můžeš to kdykoliv odškrtnout.</>
                                                : <>We auto-checked {timeAutoApplied.includes('night') && <strong>night surcharge</strong>}{timeAutoApplied.includes('night') && timeAutoApplied.includes('saturday') && ' and '}{timeAutoApplied.includes('saturday') && <strong>Saturday surcharge</strong>} based on current time. You can uncheck anytime.</>
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Results */}
                            <div className="flex flex-col justify-center">
                                {/* Guest prominently displayed */}
                                <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6 text-center mb-6 relative hover:border-blue-500/60 transition-colors">
                                    <div className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">
                                        {isPackageActive ? (calcDayLAN ? 'DayLAN' : 'NightLAN') : `${calcHours}h`} • GUEST
                                    </div>
                                    <div className="text-5xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                        {calcSaturday ? calcResult['guest'].totalSat : calcResult['guest'].total}
                                        <span className="text-xl text-gray-500 font-normal">,- Kč</span>
                                    </div>

                                    {/* Price breakdown */}
                                    <div className="mt-4 pt-3 border-t border-blue-500/20 space-y-1 text-left max-w-[240px] mx-auto">
                                        <div className="flex justify-between text-xs font-mono text-gray-600 dark:text-gray-400">
                                            <span>{isPackageActive ? (calcDayLAN ? 'DayLAN' : 'NightLAN') : (cs ? `Hraní (${calcHours}h)` : `Play time (${calcHours}h)`)}</span>
                                            <span>{(calcDayLAN && currentLoc.dayLANPromoPrice) ? currentLoc.dayLANPromoPrice : (calcDayLAN || calcNightLAN) ? '595' : (120 + Math.max(0, calcHours - 1) * 60)},- Kč</span>
                                        </div>
                                        {calcSeat === 'vip' && currentLoc.hasVip && (
                                            <div className="flex justify-between text-xs font-mono text-yellow-600 dark:text-yellow-400">
                                                <span>+ VIP PC</span>
                                                <span>30,- Kč</span>
                                            </div>
                                        )}
                                        {calcSeat === 'esport' && (
                                            <div className="flex justify-between text-xs font-mono text-yellow-600 dark:text-yellow-400">
                                                <span>+ Esport PC</span>
                                                <span>90,- Kč</span>
                                            </div>
                                        )}
                                        {calcNight && (
                                            <div className="flex justify-between text-xs font-mono text-indigo-500">
                                                <span>+ {cs ? 'Noční' : 'Night'}</span>
                                                <span>50,- Kč</span>
                                            </div>
                                        )}
                                        {calcSaturday && (
                                            <div className="flex justify-between text-xs font-mono text-orange-500">
                                                <span>+ {cs ? 'Sobota' : 'Saturday'}</span>
                                                <span>30,- Kč</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500 mt-3 font-mono">
                                        {cs ? 'Zaplatíš na začátku. Jednoduché.' : 'Pay upfront. Simple.'}
                                    </div>
                                </div>

                                {/* Mobile expandable members */}
                                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-900/50">
                                    <button 
                                        onClick={() => setShowFullCalc(!showFullCalc)}
                                        className="w-full flex items-center justify-between p-4 font-bold text-sm bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Crown className="w-4 h-4 text-sz-red" />
                                            {cs ? 'Ceny pro Registrované' : 'Prices for Members'}
                                        </span>
                                        {showFullCalc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {/* Price range preview — visible only when collapsed */}
                                    {!showFullCalc && (() => {
                                        const sleeper = calcResult['sleeper'];
                                        const ultras = calcResult['ultras'];
                                        if (!sleeper || !ultras) return null;
                                        const high = calcSaturday ? sleeper.totalSat : sleeper.total;
                                        const low = calcSaturday ? ultras.totalSat : ultras.total;
                                        return (
                                            <div className="px-4 py-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
                                                <span className="text-xs font-mono text-gray-500">{cs ? 'Člen platí' : 'Member pays'}</span>
                                                <span className="text-lg font-black text-gray-900 dark:text-white">
                                                    {high} – <span className="text-sz-red">{low}</span>
                                                    <span className="text-xs text-gray-500 font-normal">,- Kč</span>
                                                </span>
                                            </div>
                                        );
                                    })()}
                                    
                                    {showFullCalc && (
                                        <div className="p-4 space-y-3">
                                            {MEMBER_TIERS.map(tier => {
                                                const r = calcResult[tier.id];
                                                return r ? (
                                                    <div key={tier.id} className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            <span>{tier.icon}</span> {tier.name}
                                                        </span>
                                                        <span className={`text-lg font-black ${tier.featured ? 'text-sz-red' : 'text-gray-900 dark:text-white'}`}>
                                                            {calcSaturday ? r.totalSat : r.total},-
                                                        </span>
                                                    </div>
                                                ) : null;
                                            })}
                                            <div className="text-[10px] text-gray-400 text-center pt-2 font-mono italic">
                                                {cs ? 'Příplatky za PC/Noc jsou již započítány v ceně výše jako jednorázová částka.' : 'PC/Night surcharges are already factored into the prices above as a one-time fee.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ─── PC Types & Extra Fees ───────────────────── */}
                <div className="mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-4xl font-orbitron font-black text-gray-900 dark:text-white uppercase">
                            {cs ? 'Typy PC & Příplatky' : 'PC Types & Surcharges'}
                        </h2>
                        <p className="text-gray-500 font-mono mt-2">
                            {cs ? 'Všechny příplatky jsou jednorázové za celou návštěvu, ne za hodinu.' : 'All surcharges are one-time per visit, not per hour.'}
                        </p>
                    </div>

                    {/* PC Types */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                        <div className="glass-panel rounded-xl p-5 border border-black/5 dark:border-white/10 text-center">
                            <div className="text-3xl mb-2">🖥️</div>
                            <h4 className="font-orbitron font-bold text-sm uppercase text-gray-900 dark:text-white mb-1">Standard</h4>
                            <p className="text-xs text-gray-500 font-mono mb-3">240Hz Monitor</p>
                            <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-bold rounded-lg px-3 py-1.5 inline-block">
                                {cs ? 'V ceně' : 'Included'}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                {cs ? 'Výchozí PC pro všechny hráče. Plynulý zážitek na vysoké úrovni.' : 'Default PC for all players. Smooth high-level experience.'}
                            </p>
                        </div>

                        <div className="glass-panel rounded-xl p-5 border border-yellow-400/30 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">VIP</div>
                            <div className="text-3xl mb-2">✨</div>
                            <h4 className="font-orbitron font-bold text-sm uppercase text-yellow-500 mb-1">VIP PC</h4>
                            <p className="text-xs text-gray-500 font-mono mb-3">27" 2.5K Monitor</p>
                            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm font-bold rounded-lg px-3 py-1.5 inline-block">
                                +30,- Kč <span className="font-normal text-xs opacity-70">({cs ? 'Háje' : 'Háje'})</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                {cs ? 'Výkonnější sestavy s většími monitory. Ideální pro pohodové hraní ve vyšším rozlišení.' : 'More powerful rigs with bigger monitors. Ideal for relaxed gaming at higher resolution.'}
                            </p>
                        </div>

                        <div className="glass-panel rounded-xl p-5 border border-sz-red/30 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-sz-red text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">ESPORT</div>
                            <div className="text-3xl mb-2">🎯</div>
                            <h4 className="font-orbitron font-bold text-sm uppercase text-sz-red mb-1">Esport PC</h4>
                            <p className="text-xs text-gray-500 font-mono mb-3">380Hz Monitor</p>
                            <div className="bg-sz-red/10 text-sz-red text-sm font-bold rounded-lg px-3 py-1.5 inline-block">
                                +90,- Kč <span className="font-normal text-xs opacity-70">(+60 Premium/ULTRAS)</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                {cs ? 'Maximum FPS. Závodní monitory pro kompetitivní hráče. Každý frame se počítá.' : 'Maximum FPS. Racing monitors for competitive players. Every frame counts.'}
                            </p>
                        </div>
                    </div>

                    {/* Other Surcharges */}
                    <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="glass-panel rounded-lg p-4 border border-black/5 dark:border-white/10 text-center">
                            <Moon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                            <div className="font-bold text-sm text-gray-900 dark:text-white">{cs ? 'Noční' : 'Night'}</div>
                            <div className="text-xs text-gray-400 font-mono">00:00 – 06:00</div>
                            <div className="text-indigo-400 font-bold font-mono mt-1">+50,- Kč</div>
                            <div className="text-[10px] text-gray-500 mt-1">{cs ? 'ULTRAS neplatí' : 'ULTRAS exempt'}</div>
                        </div>
                        <div className="glass-panel rounded-lg p-4 border border-black/5 dark:border-white/10 text-center">
                            <CalendarDays className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                            <div className="font-bold text-sm text-gray-900 dark:text-white">{cs ? 'Sobota' : 'Saturday'}</div>
                            <div className="text-xs text-gray-400 font-mono">12:00 – 00:00</div>
                            <div className="text-orange-400 font-bold font-mono mt-1">+30,- Kč</div>
                        </div>
                        <div className="glass-panel rounded-lg p-4 border border-black/5 dark:border-white/10 text-center">
                            <Gamepad2 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                            <div className="font-bold text-sm text-gray-900 dark:text-white">{cs ? 'Ovladač' : 'Controller'}</div>
                            <div className="text-xs text-gray-400 font-mono">{cs ? 'Zapůjčení' : 'Rental'}</div>
                            <div className="text-purple-400 font-bold font-mono mt-1">+20,- Kč</div>
                        </div>
                        <div className="glass-panel rounded-lg p-4 border border-black/5 dark:border-white/10 text-center">
                            <Clock className="w-5 h-5 text-green-400 mx-auto mb-2" />
                            <div className="font-bold text-sm text-gray-900 dark:text-white">DayLAN / NightLAN</div>
                            <div className="text-xs text-gray-400 font-mono">{cs ? 'Žižkov: 12:00–00:00 / 00:00–06:00' : 'Žižkov: 12:00–00:00 / 00:00–06:00'}</div>
                            <div className="text-green-400 font-bold font-mono mt-1">{cs ? 'od 495,- Kč' : 'from 495,- Kč'}</div>
                        </div>
                    </div>
                </div>
                {/* ─── Rewards & Vouchers ───────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Try us / Voucher Block */}
                    <div className="relative glass-panel rounded-2xl border-2 border-sz-red shadow-lg shadow-sz-red/20 p-8 flex flex-col justify-center items-center text-center overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sz-red/10 rounded-full blur-[40px] pointer-events-none" />
                        <Gift className="w-12 h-12 text-sz-red mb-4" />
                        <h3 className="font-orbitron font-black text-2xl uppercase text-gray-900 dark:text-white mb-2">
                            {cs ? 'Chceš si nás vyzkoušet?' : 'Want to try us out?'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {cs 
                                ? 'Máme pro tebe čas zdarma! Stačí při první návštěvě říct heslo obsluze.' 
                                : 'We have free time for you! Just say the password to the staff on your first visit.'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                            {cs ? 'Platí pro nové členy při první návštěvě.' : 'Valid for new members on their first visit.'}
                        </p>

                        <a href="/poukaz" className="px-8 py-3 rounded-full bg-sz-red text-white font-bold font-mono text-sm hover:bg-red-700 transition-colors shadow-lg shadow-sz-red/30">
                            {cs ? 'Zjistit více a získat čas zdarma →' : 'Learn more & get free time →'}
                        </a>
                    </div>

                    {/* Various Loyalty Rewards */}
                    <div className="glass-panel rounded-2xl border-2 border-yellow-400/30 p-8 flex flex-col justify-center">
                        <h3 className="font-orbitron font-black text-xl uppercase text-yellow-500 mb-6 flex items-center gap-2">
                            <Crown className="w-6 h-6" />
                            {cs ? 'Proč být členem?' : 'Why be a member?'}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{cs ? 'Přiveď kámoše' : 'Bring a friend'}</div>
                                    <div className="text-sm text-gray-500">{cs ? 'Získej 120 minut za každýho, koho přivedeš k registraci.' : 'Get 120 min for every friend you bring to register.'}</div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{cs ? 'Dárci krve/plazmy' : 'Blood donors'}</div>
                                    <div className="text-sm text-gray-500">{cs ? 'Měsíčně dáváme 180 minut dárcům krve/plazmy.' : '180 free minutes monthly for blood/plasma donors.'} <a href="https://www.europlasma.cz/program-slev-a-vyhod-skillzone.html" target="_blank" rel="noopener noreferrer" className="text-sz-red hover:underline">{cs ? 'Více info' : 'More info'} →</a></div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{cs ? 'Bonusy za dobití' : 'Top-up bonuses'}</div>
                                    <div className="text-sm text-gray-500">{cs ? 'Dobij si kredit depozitem na baru a získej až desítky minut zcela zdarma.' : 'Top up your credit at the bar and get up to dozens of minutes completely free.'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Opening Hours & Info ────────────────────────── */}
                <div className="glass-panel rounded-2xl p-6 mb-10 border border-gray-200 dark:border-white/10">
                    <h3 className="font-orbitron font-black text-sm uppercase text-gray-500 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {cs ? 'Otevírací doby poboček' : 'Branch Opening Hours'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-sz-red/5 border border-red-100 dark:border-sz-red/20 rounded-lg">
                            <MapPin className="w-4 h-4 text-sz-red shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">Žižkov</div>
                                <div className="text-sz-red font-mono text-xs font-bold">NONSTOP 24/7</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">Háje</div>
                                <div className="text-gray-500 font-mono text-xs">12:00 – 00:00 {cs ? '(s hráči až 03:00)' : '(till 3am with players)'}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">Stodůlky</div>
                                <div className="text-gray-500 font-mono text-xs">13:00 – 21:00 {cs ? '(s hráči až 23:00)' : '(till 23:00 with players)'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 font-mono flex items-center gap-2">
                        <Phone className="w-3 h-3 text-sz-red" />
                        {cs
                            ? <>Tip: Jakoukoli pobočku lze otevřít mimo otevírací dobu pro skupiny. Stačí se domluvit den předem na <a href="tel:+420777766112" className="text-sz-red hover:underline font-bold">777 766 112</a>.&nbsp;</>
                            : <>Tip: Any branch can be opened outside hours for groups. Just arrange a day ahead at <a href="tel:+420777766112" className="text-sz-red hover:underline font-bold">777 766 112</a>.</>}
                    </div>
                </div>

                {/* ─── Footer note ────────────────────────── */}
                <div className="text-center text-xs text-gray-400 font-mono space-y-1">
                    <p>{cs ? 'Provozovatelem je SkillZone s.r.o.' : 'Operated by SkillZone s.r.o.'}</p>
                    <p>{cs ? 'Problém v provozovně? Ozvěte se na' : 'Issue at the venue? Contact'} <a href="tel:+420777766112" className="text-sz-red hover:underline">777 766 112</a></p>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
