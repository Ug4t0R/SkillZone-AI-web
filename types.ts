
export enum LocationType {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE'
}

export interface GamingLocation {
    id: string;
    name: string;
    type: LocationType;
    address: string;
    description: string;
    specs: string[];
    imgUrl: string;
    phone: string;
    mapLink: string;
    openHours: string;
    openYear: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    isCustom?: boolean;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export type AppView = 'home' | 'locations' | 'pricing' | 'history' | 'booking' | 'services' | 'gift' | 'poukaz' | 'gallery' | 'map' | 'arena' | 'mvp' | 'cybersport';

export type HistoryCategory = 'business' | 'community' | 'tech' | 'expansion';

export interface HistoryMilestone {
    id: string; // Made required for editing
    year: string;
    title: string;
    description: string;
    category: HistoryCategory;
    imgUrl?: string; // New image field
    isCustom?: boolean;
}

export interface FeedMessage {
    id: string;
    user: string;
    msg: string;
    date: string; // ISO date string
    isAi?: boolean;
}

export interface ProtocolRule {
    id: string;
    title: string;
    content: string[]; // List of bullet points or paragraphs
    icon: string; // Icon name string for dynamic rendering
    category: 'general' | 'tech' | 'behavior' | 'account';
    isCustom?: boolean;
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: string; // ISO Date (YYYY-MM-DD or full timestamp)
    time: string; // e.g. "18:00"
    game: string; // "CS2", "LOL", "FIFA", "General"
    type: 'tournament' | 'party' | 'promo' | 'stream';
    description: string;
    capacity?: string; // e.g. "5/10 Teams"
    registrationLink?: string;
    isCustom?: boolean;
    hidden?: boolean; // Draft/hidden — not shown in public WarRoom
}

export interface FaqEntry {
    questionPattern: string;
    answerGuide: string;
}

export interface BranchInfo {
    name: string;       // Např. "Háje"
    address: string;
    hours: string;      // Čitelně: "12:00–00:00, s hráči do 03:00"
    note?: string;      // Volitelná poznámka (nonstop, nová pobočka, ...)
}

export interface KeywordRule {
    trigger: string;    // Klíčové slovo / fráze
    reaction: string;   // Jak Skiller reaguje
}

export interface SkillerManual {
    corePersonality: string;       // The core traits and "vibe" of Skiller
    unknownTopicResponse: string;  // How to answer things he doesn't know
    faq: FaqEntry[];              // Specific scenarios/questions and how to answer them roughly
    branches: BranchInfo[];       // Pobočky — jméno, adresa, otevírací doby
    keywords: KeywordRule[];      // Klíčová slova → specifická reakce
    taboo: string[];              // Témata, která Skiller nikdy neřeší
}

export interface AiSettings {
    systemPrompt: string;
    temperature: number;
    model: string;
    manual?: SkillerManual;
}

export interface OwnerProfileData {
    name: string;
    nickname: string;
    role: string;
    bio: string;
    imgUrl: string;
    stats: {
        xp: string;
        class: string;
        ulti: string;
    };
}

export interface SkillerState {
    currentGame: string;
    currentMood: 'HYPE' | 'TILT' | 'CHILL' | 'FOCUS' | 'TIRED';
    matchHistory: string; // e.g. "W-L-W-W-L"
    batteryLevel: number; // 0-100
    lastUpdate: string;
}

export interface UserProfile {
    nickname?: string;
    interactionCount: number;
    lastVisit: string;
    visitorId?: string;            // Persistent ID (localStorage)
    favoriteGames?: string[];      // Games user mentioned
    persona?: string;              // AI-generated summary ("tryharder", "casual", "noob")
    conversationSummary?: string;  // AI summary of recent conversations
    knownFacts?: string[];         // Discovered facts ("studuje IT", "hraje CS2")
    adminInstructions?: string;    // Special instructions from staff on how Skiller should behave towards this user
}

export interface PressRelease {
    id: string;
    title: string;
    perex: string;           // Short teaser/subtitle
    content: string;         // Full body text
    category: 'announcement' | 'event' | 'partnership' | 'update' | 'other';
    author: string;
    date: string;            // ISO date string
    imageUrl?: string;
    hidden?: boolean;        // Draft/hidden — not shown publicly
    isCustom?: boolean;
}

export interface SupabaseConfig {
    url: string;
    key: string;
}
