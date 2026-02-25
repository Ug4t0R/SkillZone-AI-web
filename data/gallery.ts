/**
 * Gallery data — Supabase-backed via web_gallery table.
 */
import { fetchAll, upsertRow, upsertRows, deleteRow, TABLES } from '../services/webDataService';

export interface GalleryItem {
    id: string;
    src: string;
    alt: string;
    category: 'atmosphere' | 'events' | 'hardware' | 'community';
    location?: string;
    date?: string;
    visible?: boolean;
    tags?: string[];
    sections?: string[];
    sort_order?: number;
    storage_path?: string;
}

export const GALLERY_CATEGORIES = [
    { id: 'all', label_cs: 'Vše', label_en: 'All' },
    { id: 'atmosphere', label_cs: 'Atmosféra', label_en: 'Atmosphere' },
    { id: 'events', label_cs: 'Eventy', label_en: 'Events' },
    { id: 'hardware', label_cs: 'Hardware', label_en: 'Hardware' },
    { id: 'community', label_cs: 'Komunita', label_en: 'Community' },
] as const;

/** Sections where photos can be assigned for use */
export const GALLERY_SECTIONS = [
    { id: 'gallery', label: '🖼️ Gallery' },
    { id: 'hero', label: '🏠 Hero' },
    { id: 'services', label: '⚙️ Services' },
    { id: 'whyus', label: '🏆 Why Us' },
    { id: 'locations', label: '📍 Locations' },
    { id: 'reviews', label: '⭐ Reviews' },
    { id: 'story', label: '📜 Story' },
] as const;

// Default gallery data (fallback when DB is empty)
export const DEFAULT_GALLERY_CS: GalleryItem[] = [
    { id: 'g1', src: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600', alt: 'Gaming setup s RGB osvětlením', category: 'atmosphere' },
    { id: 'g2', src: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600', alt: 'Turnaj CS2 — live match', category: 'events', location: 'Žižkov' },
    { id: 'g3', src: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600', alt: 'RTX 4070 Ti Super detail', category: 'hardware' },
    { id: 'g4', src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600', alt: 'Hráči na LAN party', category: 'community', location: 'Háje' },
    { id: 'g5', src: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600', alt: 'Noční atmosféra herny', category: 'atmosphere' },
    { id: 'g6', src: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600', alt: 'Valorant turnaj — tým', category: 'events', location: 'Žižkov' },
    { id: 'g7', src: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600', alt: '240Hz monitor close-up', category: 'hardware' },
    { id: 'g8', src: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600', alt: 'Komunita hráčů', category: 'community' },
    { id: 'g9', src: 'https://images.unsplash.com/photo-1625805866449-3589fe3f71a3?w=600', alt: 'Bunker entrance — neon', category: 'atmosphere', location: 'Žižkov' },
    { id: 'g10', src: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=600', alt: 'Bootcamp private session', category: 'events', location: 'Háje' },
    { id: 'g11', src: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600', alt: 'Herní klávesnice detail', category: 'hardware' },
    { id: 'g12', src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600', alt: 'Hráči slaví výhru', category: 'community', location: 'Žižkov' },
    { id: 'g13', src: 'https://images.unsplash.com/photo-1586182987320-4f376d39d787?w=600', alt: 'Server room', category: 'hardware' },
    { id: 'g14', src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', alt: 'RGB ambientní osvětlení', category: 'atmosphere' },
];

export const DEFAULT_GALLERY_EN: GalleryItem[] = [
    { id: 'g1', src: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600', alt: 'Gaming setup with RGB lighting', category: 'atmosphere' },
    { id: 'g2', src: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600', alt: 'CS2 tournament — live match', category: 'events', location: 'Žižkov' },
    { id: 'g3', src: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600', alt: 'RTX 4070 Ti Super closeup', category: 'hardware' },
    { id: 'g4', src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600', alt: 'Players at LAN party', category: 'community', location: 'Háje' },
    { id: 'g5', src: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600', alt: 'Night gaming atmosphere', category: 'atmosphere' },
    { id: 'g6', src: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600', alt: 'Valorant tournament — team', category: 'events', location: 'Žižkov' },
    { id: 'g7', src: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600', alt: '240Hz monitor close-up', category: 'hardware' },
    { id: 'g8', src: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600', alt: 'Gaming community', category: 'community' },
    { id: 'g9', src: 'https://images.unsplash.com/photo-1625805866449-3589fe3f71a3?w=600', alt: 'Bunker entrance — neon', category: 'atmosphere', location: 'Žižkov' },
    { id: 'g10', src: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=600', alt: 'Bootcamp private session', category: 'events', location: 'Háje' },
    { id: 'g11', src: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600', alt: 'Gaming keyboard detail', category: 'hardware' },
    { id: 'g12', src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600', alt: 'Players celebrating a win', category: 'community', location: 'Žižkov' },
    { id: 'g13', src: 'https://images.unsplash.com/photo-1586182987320-4f376d39d787?w=600', alt: 'Server room', category: 'hardware' },
    { id: 'g14', src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', alt: 'RGB ambient lighting', category: 'atmosphere' },
];

// ─── Supabase CRUD ───────────────────────────────────────────────────

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
    return fetchAll<GalleryItem>(TABLES.GALLERY, DEFAULT_GALLERY_CS, 'sort_order');
};

export const saveGalleryItems = async (items: GalleryItem[]): Promise<void> => {
    await upsertRows(TABLES.GALLERY, items);
};

export const addGalleryItem = async (item: GalleryItem): Promise<void> => {
    await upsertRow(TABLES.GALLERY, item);
};

export const removeGalleryItem = async (id: string): Promise<void> => {
    await deleteRow(TABLES.GALLERY, id);
};
