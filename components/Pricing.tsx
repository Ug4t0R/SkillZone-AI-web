
import React, { useState, useMemo } from 'react';
import { Crown, Star, Gem, Zap, Users, Clock, Monitor, Gamepad2, Moon, CalendarDays, Gift, Heart, UserPlus, Calculator, ChevronDown, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// ─── Data ────────────────────────────────────────────────────────────

const MEMBER_TIERS = [
    { id: 'sleeper', icon: '💤', name: 'Sleeper', visits: '0', price: 79, color: '#6b7280', gradient: 'from-gray-600 to-gray-800' },
    { id: 'basic', icon: '⭐', name: 'Basic', visits: '1 – 8', price: 69, color: '#eab308', gradient: 'from-yellow-600 to-yellow-800' },
    { id: 'premium', icon: '💎', name: 'Premium', visits: '9 – 23', price: 59, color: '#3b82f6', gradient: 'from-blue-500 to-blue-700' },
    { id: 'ultras', icon: '🏆', name: 'ULTRAS', visits: '24+', price: 49, color: '#ef4444', gradient: 'from-red-500 to-red-700', featured: true },
];

const TOP_UP_BONUSES = [
    { amount: 250, bonus: 20, perk: null },
    { amount: 500, bonus: 40, perk: null },
    { amount: 750, bonus: 60, perk: null },
    { amount: 1000, bonus: 80, perk: 'premium30' },
    { amount: 1250, bonus: 100, perk: 'premium30' },
    { amount: 1500, bonus: 120, perk: 'premium30' },
    { amount: 1750, bonus: 140, perk: 'premium30' },
    { amount: 2000, bonus: 160, perk: 'premium30' },
];

const EXTRA_FEES = [
    { id: 'esport_haje', nameCs: 'VIP PC (Háje)', nameEn: 'VIP PC (Háje)', descCs: '27" 240Hz 2.5K Monitor', descEn: '27" 240Hz 2.5K Monitor', price: 30 },
    { id: 'esport_stodulky', nameCs: 'Esport PC (Stodůlky)', nameEn: 'Esport PC (Stodůlky)', descCs: '380Hz Monitor', descEn: '380Hz Monitor', price: 90, altPrice: 60, altNote: 'Premium/ULTRAS' },
    { id: 'night', nameCs: 'Noční návštěva', nameEn: 'Night visit', descCs: '00:00 – 06:00 (ULTRAS neplatí)', descEn: '00:00 – 06:00 (ULTRAS exempt)', price: 50 },
    { id: 'saturday', nameCs: 'Sobota', nameEn: 'Saturday', descCs: '12:00 – 00:00', descEn: '12:00 – 00:00', price: 30 },
    { id: 'controller', nameCs: 'Zapůjčení ovladače', nameEn: 'Controller rental', descCs: 'Dle pobočky', descEn: 'Per branch', price: 20 },
];

const PACKAGES = [
    { id: 'daylan_zizkov', nameCs: 'DayLAN Žižkov', nameEn: 'DayLAN Žižkov', time: '08:00 → 22:00', icon: '☀️' },
    { id: 'nightlan_zizkov', nameCs: 'NightLAN Žižkov', nameEn: 'NightLAN Žižkov', time: '22:00 → 08:00', icon: '🌙' },
    { id: 'daylan_haje', nameCs: 'DayLAN Háje / Stodůlky', nameEn: 'DayLAN Háje / Stodůlky', time: '12:00 → 24:00', icon: '🌇' },
];

const LOCATIONS = [
    { id: 'haje', nameCs: 'Háje', nameEn: 'Háje', label: 'Praha 4' },
    { id: 'zizkov', nameCs: 'Žižkov', nameEn: 'Žižkov', label: 'Praha 3' },
    { id: 'stodulky', nameCs: 'Stodůlky', nameEn: 'Stodůlky', label: 'Praha 5' },
];

type SeatType = 'standard' | 'vip' | 'esport';

// ─── Component ───────────────────────────────────────────────────────

const Pricing: React.FC = () => {
    const { language } = useAppContext();
    const cs = language === 'cs';

    // Calculator state
    const [calcLocation, setCalcLocation] = useState('haje');
    const [calcHours, setCalcHours] = useState(3);
    const [calcSeat, setCalcSeat] = useState<SeatType>('standard');
    const [calcNight, setCalcNight] = useState(false);
    const [calcSaturday, setCalcSaturday] = useState(false);
    const [calcDayLAN, setCalcDayLAN] = useState(false);

    // Bonus calculator state
    const [bonusSlider, setBonusSlider] = useState(500);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    // Price calculator
    const calcResult = useMemo(() => {
        const results: Record<string, { hourly: number; total: number; totalSat: number }> = {};

        for (const tier of MEMBER_TIERS) {
            const hourly = tier.price;
            let total: number;

            if (calcDayLAN) {
                total = (tier.id === 'premium' || tier.id === 'ultras') ? 495 : 595;
            } else {
                total = hourly * calcHours;
            }

            // Seat surcharge
            if (calcSeat === 'vip' && calcLocation === 'haje') total += 30;
            if (calcSeat === 'esport') {
                if (calcLocation === 'stodulky') {
                    total += (tier.id === 'premium' || tier.id === 'ultras') ? 60 : 90;
                }
            }

            // Night surcharge
            if (calcNight && tier.id !== 'ultras') total += 50;

            // Saturday surcharge
            const totalSat = total + (calcSaturday ? 30 : 0);

            results[tier.id] = { hourly, total, totalSat };
        }

        // Guest
        const guestBase = 120 + Math.max(0, calcHours - 1) * 60;
        let guestTotal = guestBase;
        if (calcSeat === 'esport' && calcLocation === 'stodulky') guestTotal += 90;
        if (calcNight) guestTotal += 50;
        const guestTotalSat = guestTotal + (calcSaturday ? 30 : 0);
        results['guest'] = { hourly: 120, total: guestDayLAN(), totalSat: guestTotalSat };

        function guestDayLAN() {
            if (calcDayLAN) return 595;
            return guestTotal;
        }

        return results;
    }, [calcLocation, calcHours, calcSeat, calcNight, calcSaturday, calcDayLAN]);

    // Bonus effective pricing — bonuses STACK (cumulative)
    const bonusInfo = useMemo(() => {
        // Sum all bonuses for tiers <= slider value
        const matchedTiers = TOP_UP_BONUSES.filter(b => bonusSlider >= b.amount);
        const bonusMinutes = matchedTiers.reduce((sum, b) => sum + b.bonus, 0);
        const hasPerk = matchedTiers.some(b => b.perk === 'premium30');
        const effectiveRates = MEMBER_TIERS.map(tier => {
            const baseMinutes = (bonusSlider / tier.price) * 60;
            const totalMinutes = baseMinutes + bonusMinutes;
            const effectiveRate = Math.round((bonusSlider / (totalMinutes / 60)) * 10) / 10;
            return { tier: tier.id, name: tier.name, icon: tier.icon, base: tier.price, effective: effectiveRate };
        });
        return { bonus: bonusMinutes, perk: hasPerk ? 'premium30' : null, rates: effectiveRates };
    }, [bonusSlider]);

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
                        {cs ? 'Aktualizovaný 28. 7. 2025' : 'Updated July 28, 2025'}
                    </p>
                </div>

                {/* ─── Promo banner ───────────────────────── */}
                <div className="mb-12 bg-gradient-to-r from-sz-red/20 via-red-600/10 to-sz-red/20 border border-sz-red/30 rounded-xl p-6 text-center">
                    <div className="text-3xl mb-2">🎉</div>
                    <h2 className="text-xl md:text-2xl font-orbitron font-black text-gray-900 dark:text-white mb-3">
                        {cs ? 'SLAVÍME 20 LET' : 'CELEBRATING 20 YEARS'} 🎉
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-1">
                        {cs ? 'Odměny pro naše věrné členy!' : 'Rewards for our loyal members!'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 text-sm">
                        <div className="bg-black/10 dark:bg-white/5 rounded-lg px-4 py-2">
                            <strong className="text-gray-900 dark:text-white">{cs ? 'Týdenní výzva (PO-PÁ):' : 'Weekly challenge (MON-FRI):'}</strong>
                            <span className="text-sz-red ml-1">{cs ? 'Odehraj 6 hodin → +60 min zpět' : 'Play 6h → +60 min back'}</span>
                        </div>
                        <div className="bg-black/10 dark:bg-white/5 rounded-lg px-4 py-2">
                            <strong className="text-gray-900 dark:text-white">{cs ? 'Denní odměna:' : 'Daily reward:'}</strong>
                            <span className="text-sz-red ml-1">{cs ? 'Každý den v 8:00 vracíme čas' : 'Daily refund at 8:00'}</span>
                        </div>
                    </div>
                </div>

                {/* ─── Main Grid: Members | Guest | Extra ───────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">

                    {/* ── MEMBERS ──────────────────────────── */}
                    <div className="glass-panel rounded-xl p-6 border border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-sz-red" />
                            <h3 className="font-orbitron font-bold text-lg uppercase text-sz-red">{cs ? 'Členové' : 'Members'}</h3>
                        </div>

                        <div className="bg-gray-100 dark:bg-zinc-900/50 rounded-lg p-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
                            <strong className="text-gray-900 dark:text-white block mb-1">{cs ? 'Staň se členem zdarma!' : 'Become a member for free!'}</strong>
                            {cs
                                ? 'Registrace na baru zabere pár minut a je k ní třeba tel. číslo a doklad.'
                                : 'Registration at the bar takes a few minutes. You need a phone number and ID.'
                            }
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
                            {cs
                                ? 'Tvůj level a cena se automaticky aktualizují podle tvé aktivity za posledních 90 dní.'
                                : 'Your level and price auto-update based on your activity in the last 90 days.'
                            }
                        </p>

                        {/* Tier cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {MEMBER_TIERS.map(tier => (
                                <div key={tier.id}
                                    className={`relative rounded-lg p-4 text-center border transition-all hover:scale-105
                                         ${tier.featured
                                            ? 'border-sz-red/50 bg-sz-red/5 shadow-lg shadow-sz-red/10'
                                            : 'border-black/5 dark:border-white/10 bg-gray-50 dark:bg-zinc-800/50'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{tier.icon}</div>
                                    <div className={`font-orbitron font-bold text-xs uppercase mb-2 ${tier.featured ? 'text-sz-red' : 'text-gray-700 dark:text-gray-300'}`}>{tier.name}</div>
                                    <div className="flex items-baseline justify-center gap-0.5">
                                        <span className={`text-3xl font-black ${tier.featured ? 'text-sz-red' : 'text-gray-900 dark:text-white'}`}>{tier.price},-</span>
                                    </div>
                                    <div className="text-gray-400 text-xs font-mono mt-0.5">Kč/h</div>
                                    <div className="text-gray-500 dark:text-gray-500 text-[10px] mt-2 font-mono">
                                        {tier.visits} {cs ? 'návštěv' : 'visits'}
                                    </div>
                                    {tier.featured && (
                                        <div className="absolute -top-2 -right-2 bg-sz-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Best</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <p className="text-[10px] text-gray-400 mt-4 italic">
                            * {cs
                                ? 'Nově registrovaný hráč začíná jako Sleeper, protože u nás 90 dní nebyl.'
                                : 'Newly registered players start as Sleeper (no visits in last 90 days).'
                            }
                        </p>
                    </div>

                    {/* ── GUEST ────────────────────────────── */}
                    <div className="glass-panel rounded-xl p-6 border border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-blue-400" />
                            <h3 className="font-orbitron font-bold text-lg uppercase text-blue-400">Guest</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            {cs
                                ? 'Pro jednorázové návštěvy bez registrace.'
                                : 'For one-time visits without registration.'
                            }
                        </p>

                        {/* Guest pricing */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 bg-gray-100 dark:bg-zinc-900/50 rounded-lg p-4 text-center border border-black/5 dark:border-white/5">
                                <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">{cs ? 'PRVNÍ HODINA' : 'FIRST HOUR'}</div>
                                <div className="text-2xl font-black text-sz-red">120,-</div>
                                <div className="text-gray-400 text-xs">Kč</div>
                            </div>
                            <div className="text-gray-400 text-xl">+</div>
                            <div className="flex-1 bg-gray-100 dark:bg-zinc-900/50 rounded-lg p-4 text-center border border-black/5 dark:border-white/5">
                                <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">{cs ? 'KAŽDÁ DALŠÍ' : 'EACH EXTRA'}</div>
                                <div className="text-2xl font-black text-sz-red">+60,-</div>
                                <div className="text-gray-400 text-xs">Kč</div>
                            </div>
                        </div>

                        {/* Inter-active calculator */}
                        <div className="border-t border-black/5 dark:border-white/5 pt-6">
                            <h4 className="font-orbitron font-bold text-sm mb-4 text-gray-800 dark:text-gray-200 uppercase">
                                {cs ? 'Spočítejte si cenu!' : 'Calculate your price!'}
                            </h4>

                            {/* Location tabs */}
                            <div className="flex gap-1 mb-4">
                                {LOCATIONS.map(loc => (
                                    <button key={loc.id}
                                        onClick={() => setCalcLocation(loc.id)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-all
                                                ${calcLocation === loc.id
                                                ? 'bg-sz-red text-white'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}>
                                        <MapPin className="w-3 h-3" />
                                        {cs ? loc.nameCs : loc.nameEn}
                                    </button>
                                ))}
                            </div>

                            {/* Hour buttons */}
                            <div className="grid grid-cols-5 gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map(h => (
                                    <button key={h}
                                        onClick={() => { setCalcHours(h); setCalcDayLAN(false); }}
                                        className={`py-2 rounded-lg text-sm font-mono font-bold transition-all
                                                ${calcHours === h && !calcDayLAN
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                            }`}>
                                        {h}h
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-5 gap-1 mb-4">
                                {[6, 7, 8, 9, 10].map(h => (
                                    <button key={h}
                                        onClick={() => { setCalcHours(h); setCalcDayLAN(false); }}
                                        className={`py-2 rounded-lg text-sm font-mono font-bold transition-all
                                                ${calcHours === h && !calcDayLAN
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                            }`}>
                                        {h}h
                                    </button>
                                ))}
                            </div>

                            {/* DayLAN toggle */}
                            <button onClick={() => setCalcDayLAN(!calcDayLAN)}
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-mono border transition-all mb-3
                                        ${calcDayLAN
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent'
                                        : 'border-black/10 dark:border-white/10 text-gray-500 hover:border-gray-300'
                                    }`}>
                                <Clock className="w-3 h-3" />
                                DayLAN {calcLocation === 'zizkov' ? '12:00 → 24:00' : '12:00 → 24:00'}
                            </button>

                            {/* Seat type */}
                            <div className="flex gap-1 mb-3">
                                {([
                                    { id: 'standard' as SeatType, label: 'STANDARD', desc: '240Hz' },
                                    { id: 'vip' as SeatType, label: 'VIP', desc: '2.5K' },
                                    { id: 'esport' as SeatType, label: 'ESPORT', desc: '380Hz' },
                                ]).map(s => (
                                    <button key={s.id}
                                        onClick={() => setCalcSeat(s.id)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all
                                                ${calcSeat === s.id
                                                ? 'bg-sz-red text-white'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                            }`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Toggles: night, saturday */}
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => setCalcNight(!calcNight)}
                                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-mono border transition-all
                                            ${calcNight
                                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                                            : 'border-black/10 dark:border-white/10 text-gray-400'
                                        }`}>
                                    <Moon className="w-3 h-3" />
                                    {cs ? 'Noční' : 'Night'} (+50 Kč)
                                </button>
                                <button onClick={() => setCalcSaturday(!calcSaturday)}
                                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-mono border transition-all
                                            ${calcSaturday
                                            ? 'bg-orange-600/20 border-orange-500/40 text-orange-400'
                                            : 'border-black/10 dark:border-white/10 text-gray-400'
                                        }`}>
                                    <CalendarDays className="w-3 h-3" />
                                    {cs ? 'Sobota' : 'Saturday'} (+30 Kč)
                                </button>
                            </div>

                            {/* Results table */}
                            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-black/5 dark:border-white/5 overflow-hidden">
                                <div className="grid grid-cols-3 gap-0 text-[10px] font-mono uppercase text-gray-400 px-3 py-2 border-b border-black/5 dark:border-white/5">
                                    <span>{cs ? 'Level' : 'Level'}</span>
                                    <span className="text-right">{cs ? 'Celkem' : 'Total'}</span>
                                    {calcSaturday && <span className="text-right">{cs ? 'So.' : 'Sat.'}</span>}
                                </div>
                                {MEMBER_TIERS.map(tier => {
                                    const r = calcResult[tier.id];
                                    return r ? (
                                        <div key={tier.id} className="grid grid-cols-3 gap-0 px-3 py-2 border-b border-black/5 dark:border-white/5 last:border-0">
                                            <span className="text-xs font-mono text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                <span className="text-sm">{tier.icon}</span> {tier.name}
                                            </span>
                                            <span className="text-right text-sm font-bold text-sz-red font-mono">{r.total},- Kč</span>
                                            {calcSaturday && <span className="text-right text-sm font-bold text-orange-400 font-mono">{r.totalSat},- Kč</span>}
                                        </div>
                                    ) : null;
                                })}
                                {calcResult['guest'] && (
                                    <div className="grid grid-cols-3 gap-0 px-3 py-2 bg-gray-100 dark:bg-zinc-800/50">
                                        <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                                            👋 Guest
                                        </span>
                                        <span className="text-right text-sm font-bold text-gray-500 font-mono">{calcResult['guest'].total},- Kč</span>
                                        {calcSaturday && <span className="text-right text-sm font-bold text-orange-300 font-mono">{calcResult['guest'].totalSat},- Kč</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── EXTRA ────────────────────────────── */}
                    <div className="glass-panel rounded-xl p-6 border border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <h3 className="font-orbitron font-bold text-lg uppercase text-yellow-400">Extra</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            {cs
                                ? 'Jednorázový příplatek za celou návštěvu.'
                                : 'One-time surcharge per visit.'
                            }
                        </p>

                        {/* Extra fees */}
                        <div className="space-y-3">
                            {EXTRA_FEES.map(fee => (
                                <div key={fee.id} className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50 rounded-lg px-4 py-3 border border-black/5 dark:border-white/5">
                                    <div>
                                        <div className="font-bold text-sm text-gray-800 dark:text-white">
                                            {cs ? fee.nameCs : fee.nameEn}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono">
                                            {cs ? fee.descCs : fee.descEn}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sz-red font-bold font-mono text-sm">
                                            {fee.price},- Kč
                                        </span>
                                        {fee.altPrice && (
                                            <div className="text-[10px] text-gray-400 font-mono">
                                                ({fee.altPrice},- {fee.altNote})
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Packages */}
                        <div className="mt-8 border-t border-black/5 dark:border-white/5 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-purple-400" />
                                <h4 className="font-orbitron font-bold text-sm uppercase text-purple-400">{cs ? 'Balíčky' : 'Packages'}</h4>
                            </div>
                            <p className="text-xs text-gray-400 mb-4 font-mono">DayLAN &amp; NightLAN</p>

                            <div className="space-y-2 mb-4">
                                {PACKAGES.map(pkg => (
                                    <div key={pkg.id} className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-900/50 rounded-lg px-4 py-2 border border-black/5 dark:border-white/5">
                                        <span className="text-lg">{pkg.icon}</span>
                                        <div>
                                            <div className="font-bold text-xs text-gray-800 dark:text-white">{cs ? pkg.nameCs : pkg.nameEn}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{pkg.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Package pricing */}
                            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-black/5 dark:border-white/5 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Gem className="w-3 h-3 text-blue-400" /> Premium / <span className="text-sz-red font-bold">ULTRAS</span>
                                    </span>
                                    <span className="font-bold text-sm font-mono text-gray-900 dark:text-white">495,-</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400" /> New / Basic / GUEST
                                    </span>
                                    <span className="font-bold text-sm font-mono text-gray-900 dark:text-white">595,-</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Bonuses Section ─────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                    {/* Top-up bonuses */}
                    <div className="glass-panel rounded-xl p-6 border border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Gift className="w-5 h-5 text-green-400" />
                            <h3 className="font-orbitron font-bold text-lg uppercase text-green-400">{cs ? 'Bonusy za dobití' : 'Top-up Bonuses'}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            {cs ? 'Víc dobíješ = víc dostaneš. Bonusové minuty se sčítají!' : 'More you top up = more you get. Bonus minutes stack!'}
                        </p>

                        <div className="space-y-3">
                            {TOP_UP_BONUSES.map((b, i) => {
                                const stackedBonus = TOP_UP_BONUSES.slice(0, i + 1).reduce((sum, t) => sum + t.bonus, 0);
                                return (
                                    <div key={b.amount} className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50 rounded-lg px-4 py-3 border border-black/5 dark:border-white/5">
                                        <span className="font-bold text-gray-800 dark:text-white font-mono">{b.amount},- Kč</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-green-400 font-bold font-mono">+ {b.bonus} min</span>
                                            <span className="text-green-300/60 text-xs font-mono">(celkem {stackedBonus})</span>
                                            {b.perk && (
                                                <span className="text-blue-400 text-xs font-mono flex items-center gap-1">
                                                    💎 PREMIUM {cs ? 'na 30 dní' : 'for 30 days'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bonus slider calculator */}
                        <div className="mt-6 border-t border-black/5 dark:border-white/5 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Calculator className="w-4 h-4 text-yellow-400" />
                                <h4 className="font-orbitron font-bold text-xs uppercase text-yellow-400">
                                    {cs ? 'Kalkulačka bonusů' : 'Bonus Calculator'}
                                </h4>
                            </div>

                            <div className="flex justify-between text-xs text-gray-400 font-mono mb-1">
                                <span>200 Kč</span>
                                <span>2000 Kč</span>
                            </div>
                            <input
                                type="range"
                                min={250}
                                max={2000}
                                step={250}
                                value={bonusSlider}
                                onChange={e => setBonusSlider(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sz-red"
                            />

                            <div className="flex items-center justify-between mt-3 mb-4">
                                <div>
                                    <div className="text-xs text-gray-400 font-mono">{cs ? 'Dobíjený kredit' : 'Top-up credit'}</div>
                                    <div className="text-2xl font-black text-gray-900 dark:text-white">{bonusSlider},- Kč</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-green-400 font-mono">{cs ? 'Dostaneš bonus' : 'You get bonus'}</div>
                                    <div className="text-2xl font-black text-green-400">+{bonusInfo.bonus} min</div>
                                </div>
                            </div>

                            {bonusInfo.perk && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-blue-400 text-xs font-mono mb-4 text-center">
                                    🎁 {cs
                                        ? `Získáváš ${bonusInfo.bonus} min hraní navíc zdarma + PREMIUM na 30 dní!`
                                        : `You get ${bonusInfo.bonus} bonus minutes + PREMIUM for 30 days!`
                                    }
                                </div>
                            )}

                            {/* Effective rates */}
                            <div className="text-xs font-mono text-gray-400 mb-2 uppercase">
                                {cs ? 'Tvoje reálná cena za hodinu' : 'Your effective hourly rate'}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {bonusInfo.rates.map(r => (
                                    <div key={r.tier} className={`rounded-lg p-3 text-center border ${r.tier === 'ultras' ? 'border-sz-red/30 bg-sz-red/5' : 'border-black/5 dark:border-white/5 bg-gray-50 dark:bg-zinc-800/50'
                                        }`}>
                                        <div className="text-sm mb-0.5">{r.icon} <span className="font-bold text-gray-700 dark:text-gray-300">{r.name}</span></div>
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-gray-400 line-through text-xs">{r.base} Kč/h</span>
                                            <span className={`font-black text-lg ${r.tier === 'ultras' ? 'text-sz-red' : 'text-gray-900 dark:text-white'}`}>{r.effective}</span>
                                            <span className="text-gray-400 text-xs">Kč</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Rewards & Promos */}
                    <div className="glass-panel rounded-xl p-6 border border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <Crown className="w-5 h-5 text-amber-400" />
                            <h3 className="font-orbitron font-bold text-lg uppercase text-amber-400">{cs ? 'Odměny & Akce' : 'Rewards & Promos'}</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Europlasma */}
                            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-400" />
                                        <span className="font-bold text-sm text-gray-800 dark:text-white">{cs ? 'Dárci Europlasmy' : 'Europlasma Donors'}</span>
                                    </div>
                                    <span className="text-green-400 font-bold font-mono text-sm">180 min {cs ? 'zdarma' : 'free'}</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {cs ? 'Odměna za dárcovství každý měsíc.' : 'Monthly reward for donations.'}
                                </p>
                            </div>

                            {/* Refer a friend */}
                            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-blue-400" />
                                        <span className="font-bold text-sm text-gray-800 dark:text-white">{cs ? 'Přiveď kamaráda' : 'Bring a friend'}</span>
                                    </div>
                                    <span className="text-green-400 font-bold font-mono text-sm">120 min {cs ? 'zdarma' : 'free'}</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {cs ? 'Získej bonus za jeho registraci.' : 'Get bonus for their registration.'}
                                </p>
                            </div>

                            {/* Promo code */}
                            <div className="bg-gradient-to-r from-sz-red/10 to-transparent rounded-lg p-4 border border-sz-red/20">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Gift className="w-4 h-4 text-sz-red" />
                                        <span className="font-bold text-sm text-gray-800 dark:text-white">{cs ? 'Promo kód' : 'Promo Code'}</span>
                                    </div>
                                    <span className="text-green-400 font-bold font-mono text-sm">120 min {cs ? 'zdarma' : 'free'}</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">
                                    {cs
                                        ? 'Řekni heslo při první návštěvě (PO-ČT, 08:00-18:00).'
                                        : 'Say the password on your first visit (MON-THU, 08:00-18:00).'
                                    }
                                </p>
                                <div className="bg-black/10 dark:bg-white/5 rounded-lg px-4 py-2 text-center">
                                    <span className="font-orbitron font-black text-2xl text-sz-red tracking-widest">
                                        "{cs ? 'POUKAZ' : 'VOUCHER'}"
                                    </span>
                                </div>
                            </div>

                            {/* Weekly challenge */}
                            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-400" />
                                        <span className="font-bold text-sm text-gray-800 dark:text-white">{cs ? 'Týdenní výzva (PO-PÁ)' : 'Weekly Challenge (MON-FRI)'}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {cs
                                        ? 'Odehraj 6 hodin a dostaneš 60 minut zpátky!'
                                        : 'Play 6 hours and get 60 minutes back!'
                                    }
                                </p>
                            </div>

                            {/* Daily reward */}
                            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-purple-400" />
                                        <span className="font-bold text-sm text-gray-800 dark:text-white">{cs ? 'Denní odměna' : 'Daily Reward'}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {cs
                                        ? 'Každý den v 8:00 vracíme jednomu členovi čas z předchozího dne!'
                                        : 'Every day at 8:00 we refund one member\'s time from the previous day!'
                                    }
                                </p>
                            </div>
                        </div>
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
