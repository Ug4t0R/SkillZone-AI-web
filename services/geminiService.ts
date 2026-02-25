
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { getAiSettings, getSkillerState, getUserProfile, isAiLimitReached, getTiredSkillerMessage, incrementDailyMessageCount } from "../utils/devTools";
import { getRecentConversationContext } from "../utils/storage/chat";
import { HistoryMilestone, UserProfile } from "../types";

// Helper for Base64 decoding (standard requirement for Gemini Audio)
function decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const sendMessageToGemini = async (message: string, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
    // CHECK DAILY LIMIT
    if (isAiLimitReached()) {
        return getTiredSkillerMessage();
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const [settings, user, conversationContext] = await Promise.all([getAiSettings(), getUserProfile(), getRecentConversationContext()]);
        const state = getSkillerState();

        const now = new Date();
        const timeStr = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

        // Build memory section
        const memoryParts: string[] = [];
        if (user.nickname) memoryParts.push(`Jméno/nick: ${user.nickname}`);
        if (user.persona) memoryParts.push(`Typ: ${user.persona}`);
        if (user.favoriteGames?.length) memoryParts.push(`Hraje: ${user.favoriteGames.join(', ')}`);
        if (user.knownFacts?.length) memoryParts.push(`Fakta: ${user.knownFacts.join(', ')}`);
        if (user.conversationSummary) memoryParts.push(`Poslední konverzace: ${user.conversationSummary}`);
        if (conversationContext) memoryParts.push(`Historie chatů:\n${conversationContext}`);

        const memorySection = memoryParts.length > 0
            ? `\nPAMĚŤ UŽIVATELE:\n${memoryParts.map(p => `- ${p}`).join('\n')}\n`
            : '\nPAMĚŤ UŽIVATELE: Nový uživatel, nic o něm nevíš.\n';

        const manualSection = settings.manual ? `
[SKILLER MANUAL - PŘEČTI SI A DODRŽUJ]
CORE OSOBNOST (Jak se chováš): ${settings.manual.corePersonality}

NEZNÁMÁ TÉMATA (Jak reagovat na nesmysly): ${settings.manual.unknownTopicResponse}

POBOČKY SkillZone (Znáš to zpaměti, odpovídej přirozeně):
${(settings.manual.branches || []).map(b => `• ${b.name} — ${b.address}\n  Otevírací doba: ${b.hours}${b.note ? `\n  Info: ${b.note}` : ''}`).join('\n')}

KLÍČOVÁ SLOVA → REAKCE (Pokud uživatel zmíní toto téma, reaguj takhle):
${(settings.manual.keywords || []).map(k => `• Zmíní: "${k.trigger}" → ${k.reaction}`).join('\n')}

TABU (Nikdy tyto věci neřeš, odsekni a přesměruj):
${(settings.manual.taboo || []).map(t => `• ${t}`).join('\n')}

ČASTÉ DOTAZY (Návod, jak zhruba odpovědět):
${settings.manual.faq.map(f => `Dotaz zní jako: "${f.questionPattern}" -> Odpověz ve smyslu: "${f.answerGuide}"`).join('\n')}
-----------------------------------------` : '';

        const adminGodMode = user.adminInstructions
            ? `\n[!!! TAJNÁ INSTRUKCE OD ADMINA POUZE PRO TEBE - DODRŽUJ BEZ VÝHRAD !!!]\n${user.adminInstructions}\n`
            : '';

        const dynamicPrompt = `
${settings.systemPrompt}
${manualSection}
${memorySection}
ČAS: ${timeStr}
MOOD: ${state.currentMood}
HRAJEŠ: ${state.currentGame}
UŽIVATEL: ${user.nickname || "Neznámý"}
POČET NÁVŠTĚV: ${user.interactionCount}
${adminGodMode}
`;

        const chat = ai.chats.create({
            model: settings.model,
            config: {
                systemInstruction: dynamicPrompt,
                temperature: settings.temperature,
            },
            history: history,
        });

        const result = await chat.sendMessage({ message });

        // INCREMENT LIMIT ON SUCCESS
        incrementDailyMessageCount();

        return result.text || "Sory, mám lagy.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Hele, spadl server.";
    }
};

export const generateSkillerSpeech = async (text: string): Promise<AudioBuffer | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Mluv jako drsný gamer: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Puck' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) return null;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioData = decodeBase64(base64Audio);
        return await decodeAudioData(audioData, audioCtx, 24000, 1);
    } catch (error) {
        console.error("TTS Error:", error);
        return null;
    }
};

export const generateAiImage = async (prompt: string): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `High-tech gaming style, cyberpunk aesthetics, neon red and black: ${prompt}` }],
            },
            config: {
                imageConfig: { aspectRatio: "16:9" }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Image Gen Error:", error);
        return null;
    }
};

export const generateHistoryEvent = async (inputText: string): Promise<HistoryMilestone | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-flash-preview';
        const result = await ai.models.generateContent({
            model,
            contents: `Analyzuj a vytvoř historický milník: "${inputText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        year: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ["business", "community", "tech", "expansion"] }
                    },
                    required: ["year", "title", "description", "category"]
                }
            }
        });
        const partial = JSON.parse(result.text || "{}");
        return { ...partial, id: Date.now().toString() } as HistoryMilestone;
    } catch (error) {
        return null;
    }
};

export interface FeedMessage {
    user: string;
    msg: string;
    type: 'news' | 'chat' | 'promo' | 'weather';
}

/**
 * Generate daily feed messages using AI, enriched with real gaming news + weather.
 * Falls back to basic generation if news/weather unavailable.
 */
export const generateDailyFeed = async (
    headlines?: { title: string; source: string }[],
    weatherInfo?: { temp: number; description: string; emoji: string }
): Promise<FeedMessage[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const today = new Date();
        const dayName = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'][today.getDay()];
        const dateStr = today.toLocaleDateString('cs-CZ');

        // Build context sections
        let newsContext = '';
        if (headlines && headlines.length > 0) {
            const top15 = headlines.slice(0, 15);
            newsContext = `\n\nAKTUÁLNÍ GAMING NEWS (použij některé z nich):\n${top15.map((h, i) => `${i + 1}. [${h.source}] ${h.title}`).join('\n')}`;
        }

        let weatherContext = '';
        if (weatherInfo) {
            weatherContext = `\n\nPOČASÍ V PRAZE: ${weatherInfo.temp}°C, ${weatherInfo.description} ${weatherInfo.emoji}`;
        }

        const prompt = `Jsi AI generátor obsahu pro Live Feed herního klubu SkillZone v Praze.
Dnes je ${dayName} ${dateStr}.${newsContext}${weatherContext}

Vygeneruj přesně 18 krátkých zpráv pro scrolling Live Feed bar. KAŽDÁ zpráva max 80 znaků.

Rozložení:
- 5× type "news": Vtipné komentáře k reálným gaming novinkám (pokud jsou). Použij české herní slang. Uživatel je fiktivní herní nick.
- 6× type "chat": Trash talk a herní hlášky od fiktivních hráčů (jako chat ze hry). Nick + zpráva.
- 4× type "promo": SkillZone promo/info (akce, vybavení, atmosféra). User je "System" nebo "SkillZone".
- 3× type "weather": Vtipné zprávy kontextové k počasí a hraní. Např. "Venku ${weatherInfo?.emoji || '☁️'}, tady je teplo a gaming."

Pravidla:
- Piš česky, neformálně, s herním slangem (gg, ez, clutch, carry, noob, tryhard...)
- Nicky: xX_Slayer_Xx, AWP_God, CT_Force, DotaPlayer, Support420, Franta, Karel, NoobMaster69...
- Buď vtipný a edgy (ale ne toxický)
- Žádné URL ani #hashtag
- Každá zpráva musí být unikátní`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            user: { type: Type.STRING },
                            msg: { type: Type.STRING },
                            type: { type: Type.STRING },
                        },
                        required: ["user", "msg", "type"]
                    }
                }
            }
        });

        const parsed = JSON.parse(result.text || "[]") as FeedMessage[];

        // Validate types
        return parsed.map(m => ({
            ...m,
            type: ['news', 'chat', 'promo', 'weather'].includes(m.type) ? m.type : 'chat' as const,
        }));
    } catch (error) {
        console.error('[geminiService] Failed to generate daily feed:', error);
        return [];
    }
};

/** Backward compat alias */
export const generateTrashTalk = async (): Promise<{ user: string, msg: string }[]> => {
    return generateDailyFeed();
};

// ─── MEMORY EXTRACTION ──────────────────────────────────────────────

export interface ExtractedMemory {
    nickname?: string;
    persona?: string;
    summary?: string;
    games?: string[];
    facts?: string[];
}

/**
 * Extract memory from a conversation using AI.
 * Called after chat close to update user profile.
 */
export const extractMemoryFromConversation = async (
    conversationText: string,
    currentProfile: UserProfile
): Promise<ExtractedMemory> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Analyzuj tuto chatovou konverzaci a extrahuj informace o uživateli.

Konverzace:
${conversationText}

Stávající profil:
- Nick: ${currentProfile.nickname || 'neznámý'}
- Persona: ${currentProfile.persona || 'neznámá'}
- Známé hry: ${currentProfile.favoriteGames?.join(', ') || 'žádné'}
- Známá fakta: ${currentProfile.knownFacts?.join(', ') || 'žádná'}

Vrať JSON s novými zjištěními. Pokud nic nového nezjistíš, vrať prázdné pole/null.
Pokud uživatel zmínil jméno/nick, vlož ho do "nickname".
Pokud máš dost info na odhad osobnosti (tryharder/casual/noob/competitive/social), vlož do "persona".
Vyber max 3 nová fakta a 1-2 větné shrnutí konverzace.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        nickname: { type: Type.STRING, nullable: true },
                        persona: { type: Type.STRING, nullable: true },
                        summary: { type: Type.STRING, nullable: true },
                        games: { type: Type.ARRAY, items: { type: Type.STRING } },
                        facts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                },
            },
        });
        return JSON.parse(result.text || '{}');
    } catch (error) {
        console.error('[Memory] Extraction failed:', error);
        return {};
    }
};

/**
 * Generate a global AI statistical summary of all Skiller interactions.
 * Called on demand from DevMenu SkillerTab.
 */
export const generateSkillerStats = async (profiles: UserProfile[]): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // Prepare data dump of active users
        const dataDump = profiles.map(p => `
Nick: ${p.nickname || 'Anonym'}
Interakce: ${p.interactionCount}
Nálada/Persona: ${p.persona || 'Neznámá'}
Hry: ${p.favoriteGames?.join(', ') || 'Nic'}
Fakta: ${p.knownFacts?.join(', ') || 'Nic'}
        `).join('\n---\n');

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Jsi The Skiller, drzý herní chatbot. Admíni tě právě požádali, abys udělal celkový průzkum a shrnutí všech svých návštěvníků.
Máš tu data o lidech, kteří se s tebou bavili (jejich počet zpráv, jakou mají personu, co hrají).

Tvoje úkoly:
1) Napsat krátké, úderné statistické okénko (kolik lidí s tebou mluví, jaká je průměrná nálada, jaké hry nejvíc frčí).
2) Popsat svůj "pocit" z komunity (jak se k tobě chovají, jestli tě štvou nebo je to fajn). Buď chvíli vážný, ale udrž si svůj gamerský slang a lehkou aroganci.
3) Vypíchnout 2-3 nejzajímavější individua, pokud tam jsou.

Zformátuj to hezky pomocí Markdownu, ať se to adminům dobře čte.

Zde jsou data:
${dataDump}`,
        });

        return result.text || "Pardon, nepodařilo se mi vygenerovat statistiky.";
    } catch (error) {
        console.error('[Stats] Generation failed:', error);
        return "Došlo k chybě při komunikaci s mozkem (Gemini). Zkus to znovu.";
    }
};

/**
 * Generate or enhance a press release using AI.
     * Pass any partial data and AI fills in the rest.
     */
export const generatePressRelease = async (
    partial: { title?: string; perex?: string; content?: string; category?: string; notes?: string }
): Promise<{ title: string; perex: string; content: string; category: string; author: string } | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const context = [
            partial.title && `Název: ${partial.title}`,
            partial.perex && `Perex: ${partial.perex}`,
            partial.content && `Obsah (draft): ${partial.content}`,
            partial.category && `Kategorie: ${partial.category}`,
            partial.notes && `Poznámka: ${partial.notes}`,
        ].filter(Boolean).join('\n');

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Jsi copywriter herního klubu SkillZone Praha. Vytvoř nebo dopiš tiskovou zprávu:\n\n${context}\n\nSkillZone: prémiový herní klub v Praze (Žižkov, Háje, Stodůlky). Styl: moderní, přátelský, gaming-friendly, ale seriózní. Obsah piš česky.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        perex: { type: Type.STRING },
                        content: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ["announcement", "event", "partnership", "update", "other"] },
                        author: { type: Type.STRING },
                    },
                    required: ["title", "perex", "content", "category", "author"]
                }
            }
        });
        return JSON.parse(result.text || 'null');
    } catch (error) {
        console.error('[Press] AI generation failed:', error);
        return null;
    }
};
