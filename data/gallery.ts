/**
 * Gallery data — Supabase-backed via web_gallery table.
 */
import { fetchAll, upsertRow, upsertRows, deleteRow, TABLES } from '../services/webDataService';

export interface GalleryItem {
    id: string;
    src: string;
    alt: string;
    /** Longer descriptive text used for img alt attribute (WCAG). Falls back to `alt` if not set. */
    description?: string;
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
    { id: 'floorplans', label: '🗺️ Floor Plans' },
] as const;

// Default gallery data (fallback when DB is empty)
export const DEFAULT_GALLERY_CS: GalleryItem[] = [
    { id: 'g1', src: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600', alt: 'Gaming setup s RGB osvětlením', description: 'Herní stanice s vícebarevným RGB podsvícením klávesnice a monitoru v herním klubu SkillZone', category: 'atmosphere' },
    { id: 'g2', src: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600', alt: 'Turnaj CS2 — live match', description: 'Živý záběr z turnaje Counter-Strike 2 v pobočce SkillZone Žižkov, hráči soustředění na monitory', category: 'events', location: 'Žižkov' },
    { id: 'g3', src: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600', alt: 'RTX 4070 Ti Super detail', description: 'Detailní pohled na grafickou kartu NVIDIA RTX 4070 Ti Super nainstalovanou v herním PC', category: 'hardware' },
    { id: 'g4', src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600', alt: 'Hráči na LAN party', description: 'Skupina hráčů na LAN party v pobočce SkillZone Háje, společné hraní a zábava', category: 'community', location: 'Háje' },
    { id: 'g5', src: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600', alt: 'Noční atmosféra herny', description: 'Noční atmosféra herního klubu SkillZone s tlumeným neonovým osvětlením a svítícími monitory', category: 'atmosphere' },
    { id: 'g6', src: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600', alt: 'Valorant turnaj — tým', description: 'Tým hráčů během turnaje ve Valorantu v SkillZone Žižkov, koordinovaná týmová hra', category: 'events', location: 'Žižkov' },
    { id: 'g7', src: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600', alt: '240Hz monitor close-up', description: 'Detailní záběr na 240Hz herní monitor s vysokou obnovovací frekvencí pro plynulý obraz', category: 'hardware' },
    { id: 'g8', src: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600', alt: 'Komunita hráčů', description: 'Komunita hráčů SkillZone — přátelská atmosféra a společný zájem o gaming', category: 'community' },
    { id: 'g9', src: 'https://images.unsplash.com/photo-1625805866449-3589fe3f71a3?w=600', alt: 'Bunker entrance — neon', description: 'Neonově osvětlený vchod do herního bunkru SkillZone Žižkov s industriálním designem', category: 'atmosphere', location: 'Žižkov' },
    { id: 'g10', src: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=600', alt: 'Bootcamp private session', description: 'Privátní bootcamp session v SkillZone Háje — individuální trénink a coaching pro hráče', category: 'events', location: 'Háje' },
    { id: 'g11', src: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600', alt: 'Herní klávesnice detail', description: 'Detail mechanické herní klávesnice s RGB podsvícením jednotlivých kláves', category: 'hardware' },
    { id: 'g12', src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600', alt: 'Hráči slaví výhru', description: 'Nadšení hráči slaví společné vítězství v turnaji na pobočce SkillZone Žižkov', category: 'community', location: 'Žižkov' },
    { id: 'g13', src: 'https://images.unsplash.com/photo-1586182987320-4f376d39d787?w=600', alt: 'Server room', description: 'Serverovna SkillZone s rackovými servery zajišťujícími nízký ping a stabilní připojení', category: 'hardware' },
    { id: 'g14', src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', alt: 'RGB ambientní osvětlení', description: 'Ambientní RGB osvětlení herního prostoru vytvářející atmosféru pro imerzivní gaming zážitek', category: 'atmosphere' },
    { id: 'fp_zizkov', src: '/floorplans/zizkov.png', alt: 'Plánek Žižkov', description: 'Půdorys pobočky SkillZone Žižkov — NONSTOP herna s hlavní halou, Esport zónou, batem a server roomem', category: 'atmosphere', location: 'Žižkov', sections: ['floorplans', 'locations'], tags: ['floorplan', 'layout', 'top-view', 'zizkov'] },
    { id: 'fp_haje', src: '/floorplans/haje.png', alt: 'Plánek Háje', description: 'Půdorys pobočky SkillZone Háje / Bootcamp — herní zóna, VIP sekce, privátní bootcamp místnost', category: 'atmosphere', location: 'Háje', sections: ['floorplans', 'locations'], tags: ['floorplan', 'layout', 'top-view', 'haje'] },
    { id: 'fp_stodulky', src: '/floorplans/stodulky.png', alt: 'Plánek Stodůlky', description: 'Půdorys nové pobočky SkillZone Stodůlky — kompaktní herní prostor s efektivním využitím prostoru', category: 'atmosphere', location: 'Stodůlky', sections: ['floorplans', 'locations'], tags: ['floorplan', 'layout', 'top-view', 'stodulky'] },
    { id: 'fp_bootcamp', src: '/floorplans/bootcamp.png', alt: 'Plánek Bootcamp (Holešovice)', description: 'Půdorys privátní pobočky Bootcamp — uspořádání 12 PC pro profesionální týmy', category: 'atmosphere', location: 'Bootcamp', sections: ['floorplans', 'locations'], tags: ['floorplan', 'layout', 'top-view', 'bootcamp'] },
    // ─── System images (logo, hero backgrounds) ──────────────────────
    { id: 'logo_white', src: '/SkillZone_logo_white.png', alt: 'SkillZone logo (bílé)', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['logo', 'system'] },
    { id: 'logo_red', src: '/SkillZone_logo_red.png', alt: 'SkillZone logo (červené)', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['logo', 'system'] },
    { id: 'hero_bg_0', src: '/bg/P3.webp', alt: 'Hero pozadí — pobočka', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['hero', 'background', 'system'], sort_order: 0 },
    { id: 'hero_bg_1', src: '/bg/P4.webp', alt: 'Hero pozadí — gaming', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['hero', 'background', 'system'], sort_order: 1 },
    { id: 'hero_bg_2', src: '/bg/bootcamp.webp', alt: 'Hero pozadí — bootcamp', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['hero', 'background', 'system'], sort_order: 2 },
    { id: 'hero_bg_3', src: '/bg/P5.webp', alt: 'Hero pozadí — atmosféra', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['hero', 'background', 'system'], sort_order: 3 },
];

export const DEFAULT_GALLERY_EN: GalleryItem[] = [
    { id: 'g1', src: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600', alt: 'Gaming setup with RGB lighting', description: 'Gaming station with multicolor RGB backlighting on keyboard and monitor at SkillZone gaming club', category: 'atmosphere' },
    { id: 'g2', src: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600', alt: 'CS2 tournament — live match', description: 'Live shot from a Counter-Strike 2 tournament at SkillZone Žižkov branch, players focused on monitors', category: 'events', location: 'Žižkov' },
    { id: 'g3', src: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600', alt: 'RTX 4070 Ti Super closeup', description: 'Close-up view of an NVIDIA RTX 4070 Ti Super graphics card installed in a gaming PC', category: 'hardware' },
    { id: 'g4', src: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600', alt: 'Players at LAN party', description: 'Group of players at a LAN party at SkillZone Háje branch, cooperative gaming and fun', category: 'community', location: 'Háje' },
    { id: 'g5', src: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600', alt: 'Night gaming atmosphere', description: 'Night atmosphere of SkillZone gaming club with dimmed neon lighting and glowing monitors', category: 'atmosphere' },
    { id: 'g6', src: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600', alt: 'Valorant tournament — team', description: 'Team of players during a Valorant tournament at SkillZone Žižkov, coordinated team play', category: 'events', location: 'Žižkov' },
    { id: 'g7', src: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600', alt: '240Hz monitor close-up', description: 'Close-up of a 240Hz gaming monitor with high refresh rate for smooth visuals', category: 'hardware' },
    { id: 'g8', src: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600', alt: 'Gaming community', description: 'SkillZone gaming community — friendly atmosphere and shared passion for gaming', category: 'community' },
    { id: 'g9', src: 'https://images.unsplash.com/photo-1625805866449-3589fe3f71a3?w=600', alt: 'Bunker entrance — neon', description: 'Neon-lit entrance to the SkillZone Žižkov gaming bunker with industrial design aesthetic', category: 'atmosphere', location: 'Žižkov' },
    { id: 'g10', src: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=600', alt: 'Bootcamp private session', description: 'Private bootcamp session at SkillZone Háje — individual training and coaching for players', category: 'events', location: 'Háje' },
    { id: 'g11', src: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600', alt: 'Gaming keyboard detail', description: 'Detail of a mechanical gaming keyboard with per-key RGB backlighting', category: 'hardware' },
    { id: 'g12', src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600', alt: 'Players celebrating a win', description: 'Excited players celebrating a tournament victory at SkillZone Žižkov branch', category: 'community', location: 'Žižkov' },
    { id: 'g13', src: 'https://images.unsplash.com/photo-1586182987320-4f376d39d787?w=600', alt: 'Server room', description: 'SkillZone server room with rack-mounted servers ensuring low ping and stable connectivity', category: 'hardware' },
    { id: 'g14', src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', alt: 'RGB ambient lighting', description: 'Ambient RGB lighting in the gaming space creating an atmosphere for an immersive gaming experience', category: 'atmosphere' },
    { id: 'fp_zizkov', src: '/floorplans/zizkov.png', alt: 'Žižkov Floor Plan', description: 'Floor plan of SkillZone Žižkov NONSTOP branch — main hall, esport zone, bar and server room', category: 'atmosphere', location: 'Žižkov', sections: ['floorplans', 'locations'], tags: ['floorplan', 'layout', 'top-view', 'zizkov'] },
    { id: 'fp_haje', src: '/floorplans/haje.png', alt: 'Háje Floor Plan', description: 'Floor plan of SkillZone Háje / Bootcamp — gaming zone, VIP section, private bootcamp room', category: 'atmosphere', location: 'Háje', sections: ['floorplans', 'locations'], tags: ['floorplan', 'layout', 'top-view', 'haje'] },
    { id: 'fp_stodulky', src: '/floorplans/stodulky.png', alt: 'Stodůlky Floor Plan', description: 'Floor plan of new SkillZone Stodůlky branch — compact gaming space with efficient layout', category: 'atmosphere', location: 'Stodůlky', sections: ['floorplans', 'locations'], tags: ['floorplan', 'layout', 'top-view', 'stodulky'] },
    { id: 'fp_bootcamp', src: '/floorplans/bootcamp.png', alt: 'Bootcamp Floor Plan', description: 'Floor plan of the private Bootcamp branch — 12 PC setup for professional teams', category: 'atmosphere', location: 'Bootcamp', sections: ['floorplans', 'locations'], tags: ['floorplan', 'layout', 'top-view', 'bootcamp'] },
    // ─── System images (logo, hero backgrounds) ──────────────────────
    { id: 'logo_white', src: '/SkillZone_logo_white.png', alt: 'SkillZone logo (white)', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['logo', 'system'] },
    { id: 'logo_red', src: '/SkillZone_logo_red.png', alt: 'SkillZone logo (red)', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['logo', 'system'] },
    { id: 'hero_bg_0', src: '/bg/P3.webp', alt: 'Hero background — branch', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['hero', 'background', 'system'], sort_order: 0 },
    { id: 'hero_bg_1', src: '/bg/P4.webp', alt: 'Hero background — gaming', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['hero', 'background', 'system'], sort_order: 1 },
    { id: 'hero_bg_2', src: '/bg/bootcamp.webp', alt: 'Hero background — bootcamp', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['hero', 'background', 'system'], sort_order: 2 },
    { id: 'hero_bg_3', src: '/bg/P5.webp', alt: 'Hero background — atmosphere', category: 'atmosphere', visible: true, sections: ['hero'], tags: ['hero', 'background', 'system'], sort_order: 3 },
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
