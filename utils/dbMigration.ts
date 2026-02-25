
import { getSupabase } from '../services/supabaseClient';
import { LOCATIONS_CS } from '../data/locations';
import { HISTORY_SHORT_CS, HISTORY_LONG_CS } from '../data/history';
import { PROTOCOL_DATA_CS } from '../data/protocol';
import { EVENTS_DATA_CS } from '../data/events';
import { PRESS_ITEMS } from '../data/pressArticles';
import {
    getCustomLocations,
    getCustomHistory,
    getCustomProtocol,
    getCustomEvents,
    getMergedLocations,
    getMergedHistory,
    getMergedProtocol,
    getMergedEvents,
    getMergedPress,
    overrideCustomPress,
    DEFAULT_AI_SETTINGS,
    getOwnerProfile,
    getDailyAiFeed,
    overrideCustomLocations,
    overrideCustomHistory,
    overrideCustomProtocol,
    overrideCustomEvents,
    saveAiSettings,
    saveOwnerProfile,
    saveDailyAiFeed
} from './devTools';

/**
 * Uploads all current client-side data to Supabase.
 * Accepts a logger callback to update the UI in real-time.
 */
export const uploadToSupabase = async (onLog: (msg: string, type?: 'info' | 'error' | 'success') => void) => {
    const supabase = getSupabase();
    if (!supabase) {
        onLog("CRITICAL: Supabase client not initialized. Check credentials.", 'error');
        throw new Error("Supabase not configured");
    }

    onLog("Initializing Uplink...", 'info');

    // 0. CHECK CONNECTION & TABLES
    // We try to fetch one row from locations to see if the table exists
    const { error: checkError } = await supabase.from('locations').select('id').limit(1);

    if (checkError) {
        if (checkError.code === '42P01') { // Postgres code for "undefined table"
            onLog("ERROR: Tables do not exist in database.", 'error');
            onLog("ACTION REQUIRED: Copy the SQL Schema above and run it in Supabase SQL Editor.", 'error');
            throw new Error("Tables missing");
        } else {
            onLog(`Connection Check Failed: ${checkError.message}`, 'error');
            throw checkError;
        }
    } else {
        onLog("Connection Established. Tables detected.", 'success');
    }

    // 1. LOCATIONS
    onLog("Syncing Locations module...", 'info');
    const locations = await getMergedLocations(LOCATIONS_CS);
    const { error: locError } = await supabase
        .from('locations')
        .upsert(locations.map(l => ({
            id: l.id,
            name: l.name,
            type: l.type,
            address: l.address,
            description: l.description,
            specs: l.specs,
            img_url: l.imgUrl,
            phone: l.phone,
            map_link: l.mapLink,
            open_hours: l.openHours,
            open_year: l.openYear,
            coordinates: l.coordinates,
            is_custom: l.isCustom || false
        })));

    if (locError) onLog(`Locations Sync Failed: ${locError.message}`, 'error');
    else onLog(`Locations: ${locations.length} items synced.`, 'success');

    // 2. HISTORY
    onLog("Syncing History Timeline...", 'info');
    const history = await getMergedHistory([...HISTORY_SHORT_CS, ...HISTORY_LONG_CS]);
    // Remove duplicates based on ID
    const uniqueHistory = Array.from(new Map(history.map((item: any) => [item.id, item])).values());

    const { error: histError } = await supabase
        .from('history_milestones')
        .upsert(uniqueHistory.map(h => ({
            id: h.id,
            year: h.year,
            title: h.title,
            description: h.description,
            category: h.category,
            img_url: h.imgUrl,
            is_custom: h.isCustom || false
        })));

    if (histError) onLog(`History Sync Failed: ${histError.message}`, 'error');
    else onLog(`History: ${uniqueHistory.length} milestones synced.`, 'success');

    // 3. PROTOCOL
    onLog("Syncing Protocol Rules...", 'info');
    const protocol = await getMergedProtocol(PROTOCOL_DATA_CS);
    const { error: protError } = await supabase
        .from('protocol_rules')
        .upsert(protocol.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            icon: p.icon,
            content: p.content,
            is_custom: p.isCustom || false
        })));

    if (protError) onLog(`Protocol Sync Failed: ${protError.message}`, 'error');
    else onLog(`Protocol: ${protocol.length} rules synced.`, 'success');

    // 4. EVENTS
    onLog("Syncing Calendar Events...", 'info');
    const events = await getMergedEvents(EVENTS_DATA_CS);
    const { error: evtError } = await supabase
        .from('calendar_events')
        .upsert(events.map(e => ({
            id: e.id,
            title: e.title,
            date: e.date,
            time: e.time,
            game: e.game,
            type: e.type,
            description: e.description,
            capacity: e.capacity,
            registration_link: e.registrationLink,
            is_custom: e.isCustom || false
        })));

    if (evtError) onLog(`Events Sync Failed: ${evtError.message}`, 'error');
    else onLog(`Events: ${events.length} events synced.`, 'success');

    // 5. AI SETTINGS
    onLog("Syncing AI Neural Config...", 'info');
    const { error: aiError } = await supabase
        .from('ai_settings')
        .upsert({
            id: 1,
            system_prompt: DEFAULT_AI_SETTINGS.systemPrompt,
            temperature: DEFAULT_AI_SETTINGS.temperature,
            model: DEFAULT_AI_SETTINGS.model
        });

    if (aiError) onLog(`AI Config Sync Failed: ${aiError.message}`, 'error');
    else onLog(`AI Config synced successfully.`, 'success');

    // 6. BOSS PROFILE (NEW)
    onLog("Syncing Boss Profile...", 'info');
    const boss = await getOwnerProfile('cs'); // Syncing Czech profile as default for now
    const { error: bossError } = await supabase
        .from('owner_profile')
        .upsert({
            id: 1,
            name: boss.name,
            nickname: boss.nickname,
            role: boss.role,
            bio: boss.bio,
            img_url: boss.imgUrl,
            stats: boss.stats
        });

    if (bossError) onLog(`Boss Profile Sync Failed: ${bossError.message}`, 'error');
    else onLog(`Boss Profile synced.`, 'success');

    // 7. FEED MESSAGES (NEW)
    onLog("Syncing Live Feed snapshot...", 'info');
    const feed = await getDailyAiFeed();
    if (feed.length > 0) {
        // Clear old feed messages first to keep it fresh
        await supabase.from('feed_messages').delete().neq('user_name', 'XYZ_PROTECT');

        const { error: feedError } = await supabase
            .from('feed_messages')
            .insert(feed.map(f => ({
                user_name: f.user,
                message: f.msg,
                is_ai: true
            })));

        if (feedError) onLog(`Feed Sync Failed: ${feedError.message}`, 'error');
        else onLog(`Live Feed: ${feed.length} messages archived.`, 'success');
    } else {
        onLog("Live Feed is empty, skipping.", 'info');
    }

    // 8. PRESS & MEDIA
    onLog("Syncing Press & Media...", 'info');
    const press = await getMergedPress(PRESS_ITEMS);
    const { error: pressError } = await supabase
        .from('web_press')
        .upsert(press.map(p => ({
            id: p.id,
            source: p.source,
            title: p.title,
            titleEn: p.titleEn,
            description: p.description,
            descriptionEn: p.descriptionEn,
            url: p.url,
            date: p.date,
            year: p.year,
            category: p.category,
            logo: p.logo || null,
            highlight: p.highlight || false
        })));

    if (pressError) onLog(`Press Sync Failed: ${pressError.message}`, 'error');
    else onLog(`Press: ${press.length} articles synced.`, 'success');

    onLog("------------------------------------------------", 'info');
    onLog("MIGRATION SEQUENCE COMPLETE", 'success');

    return true;
};

/**
 * DOWNLOADS all data FROM Supabase and overwrites local state.
 * This effectively makes the DB the single source of truth.
 */
export const downloadFromSupabase = async (onLog: (msg: string, type?: 'info' | 'error' | 'success') => void) => {
    const supabase = getSupabase();
    if (!supabase) {
        onLog("CRITICAL: Supabase client not initialized.", 'error');
        throw new Error("Supabase not configured");
    }

    onLog("Initializing Downlink...", 'info');

    try {
        // 1. LOCATIONS
        const { data: locs, error: locError } = await supabase.from('locations').select('*');
        if (locError) throw locError;
        if (locs) {
            const mappedLocs = locs.map((l: any) => ({
                id: l.id,
                name: l.name,
                type: l.type,
                address: l.address,
                description: l.description,
                specs: l.specs,
                imgUrl: l.img_url,
                phone: l.phone,
                mapLink: l.map_link,
                openHours: l.open_hours,
                openYear: l.open_year,
                coordinates: l.coordinates,
                isCustom: l.is_custom
            }));
            overrideCustomLocations(mappedLocs);
            onLog(`Locations: Downloaded ${mappedLocs.length} items.`, 'success');
        }

        // 2. HISTORY
        const { data: hist, error: histError } = await supabase.from('history_milestones').select('*');
        if (histError) throw histError;
        if (hist) {
            const mappedHist = hist.map((h: any) => ({
                id: h.id,
                year: h.year,
                title: h.title,
                description: h.description,
                category: h.category,
                imgUrl: h.img_url,
                isCustom: h.is_custom
            }));
            overrideCustomHistory(mappedHist);
            onLog(`History: Downloaded ${mappedHist.length} milestones.`, 'success');
        }

        // 3. PROTOCOL
        const { data: proto, error: protoError } = await supabase.from('protocol_rules').select('*');
        if (protoError) throw protoError;
        if (proto) {
            const mappedProto = proto.map((p: any) => ({
                id: p.id,
                title: p.title,
                category: p.category,
                icon: p.icon,
                content: p.content,
                isCustom: p.is_custom
            }));
            overrideCustomProtocol(mappedProto);
            onLog(`Protocol: Downloaded ${mappedProto.length} rules.`, 'success');
        }

        // 4. EVENTS
        const { data: evts, error: evtError } = await supabase.from('calendar_events').select('*');
        if (evtError) throw evtError;
        if (evts) {
            const mappedEvts = evts.map((e: any) => ({
                id: e.id,
                title: e.title,
                date: e.date,
                time: e.time,
                game: e.game,
                type: e.type,
                description: e.description,
                capacity: e.capacity,
                registrationLink: e.registration_link,
                isCustom: e.is_custom
            }));
            overrideCustomEvents(mappedEvts);
            onLog(`Events: Downloaded ${mappedEvts.length} events.`, 'success');
        }

        // 5. AI SETTINGS
        const { data: ai, error: aiError } = await supabase.from('ai_settings').select('*').single();
        if (!aiError && ai) {
            saveAiSettings({
                systemPrompt: ai.system_prompt,
                temperature: ai.temperature,
                model: ai.model
            });
            onLog(`AI Settings: Configuration loaded.`, 'success');
        }

        // 6. BOSS PROFILE
        const { data: boss, error: bossError } = await supabase.from('owner_profile').select('*').single();
        if (!bossError && boss) {
            saveOwnerProfile({
                name: boss.name,
                nickname: boss.nickname,
                role: boss.role,
                bio: boss.bio,
                imgUrl: boss.img_url,
                stats: boss.stats
            });
            onLog(`Boss Profile: Data loaded.`, 'success');
        }

        // 7. FEED
        const { data: feed, error: feedError } = await supabase.from('feed_messages').select('*').order('created_at', { ascending: false }).limit(20);
        if (!feedError && feed && feed.length > 0) {
            const mappedFeed = feed.map((f: any) => ({
                user: f.user_name,
                msg: f.message
            }));
            saveDailyAiFeed(mappedFeed);
            onLog(`Live Feed: Loaded ${mappedFeed.length} messages.`, 'success');
        }

        // 8. PRESS
        const { data: press, error: pressError } = await supabase.from('web_press').select('*');
        if (!pressError && press && press.length > 0) {
            overrideCustomPress(press);
            onLog(`Press: Downloaded ${press.length} articles.`, 'success');
        }

        onLog("------------------------------------------------", 'info');
        onLog("DOWNLOAD COMPLETE. APP REFRESHING...", 'success');
        return true;

    } catch (e: any) {
        onLog(`DOWNLOAD FAILED: ${e.message}`, 'error');
        throw e;
    }
};
