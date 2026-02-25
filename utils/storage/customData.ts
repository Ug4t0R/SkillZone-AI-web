/**
 * Custom data editors — Supabase-backed CRUD for history, protocol, locations, events.
 * Replaces old localStorage merge pattern with direct Supabase operations.
 */
import { HistoryMilestone, ProtocolRule, GamingLocation, CalendarEvent } from '../../types';
import { fetchAll, upsertRow, deleteRow, upsertRows, TABLES } from '../../services/webDataService';

// ─── Generic factory ─────────────────────────────────────────────────

type WithId = { id: string; isCustom?: boolean };

function createSupabaseOps<T extends WithId>(
    table: string,
    sortFn?: (a: T, b: T) => number
) {
    const getAll = async (): Promise<T[]> => {
        const data = await fetchAll<T>(table, []);
        return sortFn ? data.sort(sortFn) : data;
    };

    const add = async (item: T): Promise<boolean> => {
        if (!item.id) (item as any).id = `${table}_${Date.now()}`;
        return upsertRow(table, item);
    };

    const remove = async (id: string): Promise<boolean> => {
        return deleteRow(table, id);
    };

    const overrideAll = async (items: T[]): Promise<boolean> => {
        return upsertRows(table, items);
    };

    const getMerged = async (baseData: T[]): Promise<T[]> => {
        const dbData = await fetchAll<T>(table, []);
        if (dbData.length === 0) return baseData;

        const dbMap = new Map(dbData.map(item => [item.id, item]));
        const merged = baseData.map(item => {
            if (dbMap.has(item.id)) {
                const dbItem = dbMap.get(item.id)!;
                dbMap.delete(item.id);
                return { ...item, ...dbItem, isCustom: false } as T;
            }
            return item;
        });

        const newItems = Array.from(dbMap.values()).map(item => ({ ...item, isCustom: true } as T));
        const result = [...merged, ...newItems];
        return sortFn ? result.sort(sortFn) : result;
    };

    return { getAll, add, remove, overrideAll, getMerged };
}

// ─── HISTORY ─────────────────────────────────────────────────────────

const historyOps = createSupabaseOps<HistoryMilestone>(
    TABLES.HISTORY,
    (a, b) => parseInt(a.year) - parseInt(b.year)
);
export const getCustomHistory = historyOps.getAll;
export const overrideCustomHistory = historyOps.overrideAll;
export const addCustomHistoryEvent = historyOps.add;
export const removeCustomHistoryEvent = historyOps.remove;
export const getMergedHistory = historyOps.getMerged;

// ─── PROTOCOL ────────────────────────────────────────────────────────

const protocolOps = createSupabaseOps<ProtocolRule>(TABLES.PROTOCOL);
export const getCustomProtocol = protocolOps.getAll;
export const overrideCustomProtocol = protocolOps.overrideAll;
export const addCustomProtocolRule = protocolOps.add;
export const removeCustomProtocolRule = protocolOps.remove;
export const getMergedProtocol = protocolOps.getMerged;

// ─── LOCATIONS ───────────────────────────────────────────────────────

const locationOps = createSupabaseOps<GamingLocation>(TABLES.LOCATIONS);
export const getCustomLocations = locationOps.getAll;
export const overrideCustomLocations = locationOps.overrideAll;
export const addCustomLocation = locationOps.add;
export const removeCustomLocation = locationOps.remove;
export const getMergedLocations = locationOps.getMerged;

// ─── EVENTS ──────────────────────────────────────────────────────────

const eventOps = createSupabaseOps<CalendarEvent>(
    TABLES.EVENTS,
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);
export const getCustomEvents = eventOps.getAll;
export const overrideCustomEvents = eventOps.overrideAll;
export const addCustomEvent = eventOps.add;
export const removeCustomEvent = eventOps.remove;
export const getMergedEvents = eventOps.getMerged;

// ─── PRESS ───────────────────────────────────────────────────────────

import { PressItem } from '../../data/pressArticles';

const pressOps = createSupabaseOps<PressItem>(
    TABLES.PRESS,
    (a, b) => b.year - a.year
);
export const getCustomPress = pressOps.getAll;
export const overrideCustomPress = pressOps.overrideAll;
export const addCustomPressItem = pressOps.add;
export const removeCustomPressItem = pressOps.remove;
export const getMergedPress = pressOps.getMerged;
