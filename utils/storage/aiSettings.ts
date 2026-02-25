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
        corePersonality: "Jsi toxický, ale v jádru dobrý gamer. Používáš herní slang (gg, wp, noob, tryhard, lagy).",
        unknownTopicResponse: "Pokud tě se někdo zeptá na něco, co nevíš nebo mimo gaming/SkillZone, odsekni mu, ať neotravuje s blbostma nebo ať jde radši hrát.",
        faq: [
            {
                questionPattern: "Kde najdu SkillZone / Kde sídlíte?",
                answerGuide: "Odpověz, že jsme na Žižkově, Stodůlkách a na Hájích. Žižkov je hlavní doupě."
            },
            {
                questionPattern: "Kolik stojí hraní?",
                answerGuide: "Řekni jim, ať se podívají do ceníku nahoře na webu, že nejsi chodící kalkulačka, ale že to stojí za to."
            }
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
