// ─── Pricing Data ─────────────────────────────────────────────────────────────
// Centralizovaná datová vrstva pro komponentu Pricing.
// Ceny jsou aktualizovány k 28.7.2025.

export type SeatType = 'standard' | 'vip' | 'esport';

export interface MemberTier {
    id: string;
    icon: string;
    name: string;
    visits: string;
    price: number;
    color: string;
    gradient: string;
    featured?: boolean;
}

export interface TopUpBonus {
    amount: number;
    /** Cumulative bonus minutes at this top-up level */
    bonus: number;
    perk: string | null;
}

export interface ExtraFee {
    id: string;
    nameCs: string;
    nameEn: string;
    descCs: string;
    descEn: string;
    price: number;
    altPrice?: number;
    altNote?: string;
}

export interface Package {
    id: string;
    nameCs: string;
    nameEn: string;
    time: string;
    icon: string;
}

export interface Location {
    id: string;
    nameCs: string;
    nameEn: string;
    label: string;
}

export const MEMBER_TIERS: MemberTier[] = [
    { id: 'sleeper', icon: '💤', name: 'Sleeper', visits: '0', price: 79, color: '#6b7280', gradient: 'from-gray-600 to-gray-800' },
    { id: 'basic', icon: '⭐', name: 'Basic', visits: '1 – 8', price: 69, color: '#eab308', gradient: 'from-yellow-600 to-yellow-800' },
    { id: 'premium', icon: '💎', name: 'Premium', visits: '9 – 23', price: 59, color: '#3b82f6', gradient: 'from-blue-500 to-blue-700' },
    { id: 'ultras', icon: '🏆', name: 'ULTRAS', visits: '24+', price: 49, color: '#ef4444', gradient: 'from-red-500 to-red-700', featured: true },
];

// Rule: 2× amount → 3× bonus (cumulative). Caps at 2 000 Kč, rule still applies above.
export const TOP_UP_BONUSES: TopUpBonus[] = [
    { amount: 250, bonus: 20, perk: null },         // base
    { amount: 500, bonus: 60, perk: null },         // 2×250 → 3×20
    { amount: 1000, bonus: 180, perk: 'premium30' },  // 2×500 → 3×60
    { amount: 2000, bonus: 540, perk: 'premium30' },  // 2×1000 → 3×180
];

export const EXTRA_FEES: ExtraFee[] = [
    { id: 'esport_haje', nameCs: 'VIP PC (Háje)', nameEn: 'VIP PC (Háje)', descCs: '27" 240Hz 2.5K Monitor', descEn: '27" 240Hz 2.5K Monitor', price: 30 },
    { id: 'esport_stodulky', nameCs: 'Esport PC (Stodůlky)', nameEn: 'Esport PC (Stodůlky)', descCs: '380Hz Monitor', descEn: '380Hz Monitor', price: 90, altPrice: 60, altNote: 'Premium/ULTRAS' },
    { id: 'night', nameCs: 'Noční návštěva', nameEn: 'Night visit', descCs: '00:00 – 06:00 (ULTRAS neplatí)', descEn: '00:00 – 06:00 (ULTRAS exempt)', price: 50 },
    { id: 'saturday', nameCs: 'Sobota', nameEn: 'Saturday', descCs: '12:00 – 00:00', descEn: '12:00 – 00:00', price: 30 },
    { id: 'controller', nameCs: 'Zapůjčení ovladače', nameEn: 'Controller rental', descCs: 'Dle pobočky', descEn: 'Per branch', price: 20 },
];

export const PACKAGES: Package[] = [
    { id: 'daylan_zizkov', nameCs: 'DayLAN Žižkov', nameEn: 'DayLAN Žižkov', time: '08:00 → 22:00', icon: '☀️' },
    { id: 'nightlan_zizkov', nameCs: 'NightLAN Žižkov', nameEn: 'NightLAN Žižkov', time: '22:00 → 08:00', icon: '🌙' },
    { id: 'daylan_haje', nameCs: 'DayLAN Háje / Stodůlky', nameEn: 'DayLAN Háje / Stodůlky', time: '12:00 → 24:00', icon: '🌇' },
];

export const LOCATIONS: Location[] = [
    { id: 'haje', nameCs: 'Háje', nameEn: 'Háje', label: 'Praha 4' },
    { id: 'zizkov', nameCs: 'Žižkov', nameEn: 'Žižkov', label: 'Praha 3' },
    { id: 'stodulky', nameCs: 'Stodůlky', nameEn: 'Stodůlky', label: 'Praha 5' },
];
