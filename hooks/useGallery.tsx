/**
 * Gallery Context & Hook — centralized image management via Supabase gallery.
 * Loads all gallery items once, components query by ID or section.
 * Fallbacks ensure images show immediately before Supabase loads.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { GalleryItem, getGalleryItems } from '../data/gallery';

interface GalleryContextValue {
    items: GalleryItem[];
    /** Get a single image URL by gallery item ID. Returns fallback if not found. */
    getImage: (id: string, fallback: string) => string;
    /** Get all visible image URLs for a given section. */
    getSection: (section: string) => GalleryItem[];
    /** Whether gallery data has loaded from Supabase */
    loaded: boolean;
}

const GalleryContext = createContext<GalleryContextValue>({
    items: [],
    getImage: (_id, fallback) => fallback,
    getSection: () => [],
    loaded: false,
});

export const GalleryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        getGalleryItems().then(data => {
            setItems(data);
            setLoaded(true);
        }).catch(() => setLoaded(true));
    }, []);

    const getImage = useCallback((id: string, fallback: string): string => {
        const item = items.find(i => i.id === id && i.visible !== false);
        return item?.src || fallback;
    }, [items]);

    const getSection = useCallback((section: string): GalleryItem[] => {
        return items
            .filter(i => i.sections?.includes(section) && i.visible !== false)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }, [items]);

    const value = useMemo(() => ({
        items, getImage, getSection, loaded
    }), [items, getImage, getSection, loaded]);

    return (
        <GalleryContext.Provider value={value}>
            {children}
        </GalleryContext.Provider>
    );
};

/** Access gallery images. Use getImage(id, fallback) for specific slots, getSection(name) for collections. */
export const useGallery = () => useContext(GalleryContext);

/**
 * Shortcut hook: returns a single image URL by gallery ID.
 * Usage: const logoSrc = useGalleryImage('logo_white', '/SkillZone_logo_white.png');
 */
export const useGalleryImage = (id: string, fallback: string): string => {
    const { getImage } = useGallery();
    return getImage(id, fallback);
};
