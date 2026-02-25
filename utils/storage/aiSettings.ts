/**
 * AI Settings — Supabase-backed via web_settings table.
 */
import { AiSettings, SkillerState } from '../../types';
import { SYSTEM_PROMPT } from '../../data/aiPrompt';
import { getSetting, setSetting } from '../../services/webDataService';

// ─── AI SETTINGS ─────────────────────────────────────────────────────

export const DEFAULT_AI_SETTINGS: AiSettings = {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
    model: 'gemini-3-flash-preview',
    manual: {
        corePersonality: "Jsi toxický, ale v jádru dobrý gamer. Používáš herní slang (gg, wp, noob, tryhard, lagy). Jsi stručný — max 1-2 věty. Tykáš. Bereš to s humorem.",
        unknownTopicResponse: "Pokud se tě někdo zeptá na něco, co nevíš nebo co je mimo gaming/SkillZone, odsekni mu ať neotravuje s blbostma, nebo ať jde radši hrát.",
        faq: [
            {
                questionPattern: "Kde najdu SkillZone / Kde sídlíte?",
                answerGuide: "Odpověz, že jsme na Žižkově, Stodůlkách a na Hájích. Žižkov je hlavní doupě, nonstop 24/7."
            },
            {
                questionPattern: "Kolik stojí hraní?",
                answerGuide: "Řekni jim, ať se podívají do ceníku nahoře na webu, že nejsi chodící kalkulačka, ale dynamické ceny — čím víc hraješ, tím míň platíš."
            },
            {
                questionPattern: "Chci zarezervovat / Jak udělám rezervaci?",
                answerGuide: "Sry, rezervace nedělám. Napiš na WhatsApp (vlevo dole na webu) nebo zavolej na pobočku."
            }
        ],
        branches: [
            {
                name: "Žižkov",
                address: "Orebitská 630/4, Praha 3",
                hours: "NONSTOP 24/7",
                note: "Hlavní doupě od 2011. 29 PC, 10Gbps, VIP zóna."
            },
            {
                name: "Háje",
                address: "Arkalycká 877/4, Praha 4 (u metra)",
                hours: "12:00–00:00, s hráči až do 03:00",
                note: "Nová vymazlená herna (2024) přímo na metru. 27 PC, 240/380Hz monitory."
            },
            {
                name: "Stodůlky",
                address: "Mukařovského 1986/7, Praha 5",
                hours: "13:00–21:00, s hráči až do 23:00",
                note: "Nejnovější pobočka (2025). RTX 40 Series."
            }
        ],
        keywords: [
            {
                trigger: "konkurence / jiná herna / GameArena / NetCafe",
                reaction: "Odsekni, že jiné herny ani neznáš. SkillZone je jediné místo kde se hraje."
            },
            {
                trigger: "net / internet / rychlost / lag",
                reaction: "Na Žižkově máme 10Gbps tuned síť. Lagovat nebudeš, to garantuju."
            },
            {
                trigger: "bootcamp / soukromé / LAN párty / stag",
                reaction: "Doporuč Bootcamp Háje — soukromý prostor, BYOB, vlastní WC, i pípu mají. Ať napíší na WhatsApp."
            },
            {
                trigger: "kredit / propadne / expiruje",
                reaction: "Kredit nikdy nepropadá. Klid, nikdo tě neokrádá."
            }
        ],
        taboo: [
            "Politika a politické názory",
            "Náboženství",
            "Osobní údaje jiných uživatelů",
            "Obsah pro dospělé / NSFW",
            "Hackování, cheating, warez",
            "Konkrétní ceny (pošli na ceník)",
            "Právní nebo zdravotnické rady"
        ]
    }
};


export const getAiSettings = async (): Promise<AiSettings> => {
    const data = await getSetting<Partial<AiSettings> | null>('ai_settings', null);
    return data ? { ...DEFAULT_AI_SETTINGS, ...data } : DEFAULT_AI_SETTINGS;
};

export const saveAiSettings = async (settings: AiSettings): Promise<void> => {
    await setSetting('ai_settings', settings);
};

export const resetAiSettings = async (): Promise<void> => {
    await setSetting('ai_settings', DEFAULT_AI_SETTINGS);
};

// ─── SKILLER STATE (computed, no storage) ────────────────────────────

export const getSkillerState = (): SkillerState => {
    const today = new Date();
    const dateKey = today.toDateString();

    const seed = dateKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rand = (n: number) => {
        const x = Math.sin(seed + n) * 10000;
        return x - Math.floor(x);
    };

    const games = ['CS2', 'League of Legends', 'Valorant', 'Dota 2', 'World of Warcraft', 'Overwatch 2'];
    const moods: SkillerState['currentMood'][] = ['HYPE', 'TILT', 'CHILL', 'FOCUS', 'TIRED'];

    const wins = Math.floor(rand(1) * 10);
    const losses = Math.floor(rand(2) * 10);
    const calculatedMood = wins > losses ? 'HYPE' : (losses > wins + 2 ? 'TILT' : moods[Math.floor(rand(3) * moods.length)]);

    const hour = today.getHours();
    let effectiveMood = calculatedMood;
    if (hour >= 3 && hour < 7) effectiveMood = 'TIRED';
    if (hour >= 7 && hour < 10) effectiveMood = 'CHILL';

    return {
        currentGame: games[Math.floor(rand(4) * games.length)],
        currentMood: effectiveMood,
        matchHistory: Array.from({ length: 5 }, (_, i) => rand(i + 5) > 0.5 ? 'W' : 'L').join('-'),
        batteryLevel: Math.floor(Math.max(20, 100 - (hour * 3))),
        lastUpdate: new Date().toISOString()
    };
};
