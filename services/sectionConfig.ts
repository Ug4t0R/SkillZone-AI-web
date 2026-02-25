/**
 * SectionConfig — centralized toggle system for website sections.
 * Stored in Supabase web_settings under key 'sections_config'.
 * Falls back to all-enabled defaults when offline.
 */
import { useState, useEffect } from 'react';
import { getSetting, setSetting } from './webDataService';

// ─── Types ───────────────────────────────────────────────────────────

export interface SectionConfig {
    // Navigation pages
    locations: boolean;
    pricing: boolean;
    history: boolean;
    services: boolean;
    booking: boolean;
    voucher: boolean;

    // Homepage sections
    warroom: boolean;
    techspecs: boolean;
    whyus: boolean;
    reviews: boolean;
    gallery: boolean;
    team: boolean;
    owner: boolean;
    protocol: boolean;
    press: boolean;

    // Widgets & overlays
    livefeed: boolean;
    skiller: boolean;
    aimchallenge: boolean;
    comingSoon: boolean;
}

// ─── Defaults (all enabled) ──────────────────────────────────────────

export const DEFAULT_SECTIONS: SectionConfig = {
    locations: true,
    pricing: true,
    history: true,
    services: true,
    booking: true,
    voucher: true,
    warroom: true,
    techspecs: true,
    whyus: true,
    reviews: true,
    gallery: true,
    team: true,
    owner: true,
    protocol: true,
    press: true,
    livefeed: true,
    skiller: true,
    aimchallenge: true,
    comingSoon: false,
};

const SETTINGS_KEY = 'sections_config';

// ─── CRUD ────────────────────────────────────────────────────────────

export async function getSectionConfig(): Promise<SectionConfig> {
    const stored = await getSetting<Partial<SectionConfig>>(SETTINGS_KEY, {});
    // Merge with defaults so new sections are always enabled
    return { ...DEFAULT_SECTIONS, ...stored };
}

export async function setSectionConfig(config: SectionConfig): Promise<boolean> {
    return setSetting(SETTINGS_KEY, config);
}

// ─── React Hook ──────────────────────────────────────────────────────

export function useSections() {
    const [sections, setSections] = useState<SectionConfig>(DEFAULT_SECTIONS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getSectionConfig().then(cfg => {
            if (!cancelled) {
                setSections(cfg);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, []);

    const updateSections = async (updated: SectionConfig) => {
        setSections(updated);
        return setSectionConfig(updated);
    };

    return { sections, loading, updateSections };
}

// ─── Section metadata (for DevMenu UI) ──────────────────────────────

export interface SectionMeta {
    id: keyof SectionConfig;
    label: string;
    group: 'pages' | 'homepage' | 'widgets';
    description: string;
}

export const SECTION_META: SectionMeta[] = [
    // Pages
    { id: 'locations', label: 'Locations', group: 'pages', description: 'Locations page & nav link' },
    { id: 'pricing', label: 'Pricing', group: 'pages', description: 'Price list page & nav link' },
    { id: 'history', label: 'Story', group: 'pages', description: 'History / Story page & nav link' },
    { id: 'services', label: 'Services', group: 'pages', description: 'Services page & nav link' },
    { id: 'booking', label: 'Booking', group: 'pages', description: 'Booking button in navbar' },
    { id: 'voucher', label: 'Voucher', group: 'pages', description: 'Gift / Poukaz routes' },

    // Homepage sections
    { id: 'warroom', label: 'WarRoom', group: 'homepage', description: 'Events / tournaments section' },
    { id: 'techspecs', label: 'Tech Specs', group: 'homepage', description: 'Hardware specifications' },
    { id: 'whyus', label: 'Why Us', group: 'homepage', description: 'Competitive advantages' },
    { id: 'reviews', label: 'Reviews', group: 'homepage', description: 'Customer reviews section' },
    { id: 'gallery', label: 'Gallery', group: 'homepage', description: 'Photo gallery section' },
    { id: 'team', label: 'Team', group: 'homepage', description: 'Team members section' },
    { id: 'owner', label: 'Owner Profile', group: 'homepage', description: 'Boss profile section' },
    { id: 'protocol', label: 'Server Protocol', group: 'homepage', description: 'Rules & guidelines' },
    { id: 'press', label: 'Press', group: 'homepage', description: 'Media mentions & press articles' },

    // Widgets
    { id: 'livefeed', label: 'Live Feed', group: 'widgets', description: 'Floating live feed widget' },
    { id: 'skiller', label: 'Skiller', group: 'widgets', description: 'Floating mascot avatar' },
    { id: 'aimchallenge', label: 'Aim Challenge', group: 'widgets', description: 'Aim challenge button' },
    { id: 'comingSoon', label: '🚀 Coming Soon', group: 'widgets', description: 'WIP landing page with countdown' },
];
