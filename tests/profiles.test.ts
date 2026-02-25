/**
 * profiles.test.ts — Tests for user/owner profile utilities
 * Tests visitor ID generation, identity detection, and list merging.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the webDataService before importing profiles
vi.mock('../services/webDataService', () => ({
    getSetting: vi.fn().mockResolvedValue(null),
    setSetting: vi.fn().mockResolvedValue(true),
    deleteSetting: vi.fn().mockResolvedValue(true),
    getSettingsByPrefix: vi.fn().mockResolvedValue([]),
    fetchById: vi.fn().mockResolvedValue(null),
    upsertRow: vi.fn().mockResolvedValue(undefined),
    TABLES: { OWNER_PROFILE: 'web_owner_profile' },
}));

// Mock constants (owner profile defaults)
vi.mock('../constants', () => ({
    DEFAULT_OWNER_PROFILE_CS: {
        name: 'Tomáš Švec', nickname: 'Ug4t0R', role: 'Founder',
        bio: 'Test bio CS', imgUrl: 'https://example.com/photo.jpg',
        stats: { xp: '20 Let', class: 'Warlord', ulti: 'Banhammer' },
    },
    DEFAULT_OWNER_PROFILE_EN: {
        name: 'Tomáš Švec', nickname: 'Ug4t0R', role: 'Founder',
        bio: 'Test bio EN', imgUrl: 'https://example.com/photo.jpg',
        stats: { xp: '20 Years', class: 'Warlord', ulti: 'Banhammer' },
    },
}));

import {
    getOrCreateVisitorId,
    detectUserIdentity,
    getUserProfile,
    getOwnerProfile,
} from '../utils/storage/profiles';
import { getSetting, fetchById } from '../services/webDataService';

describe('getOrCreateVisitorId', () => {
    it('should create a new visitor ID if none exists', () => {
        const id = getOrCreateVisitorId();
        expect(id).toMatch(/^viz_/);
        expect(id.length).toBeGreaterThan(4);
    });

    it('should return the same ID on subsequent calls', () => {
        const id1 = getOrCreateVisitorId();
        const id2 = getOrCreateVisitorId();
        expect(id1).toBe(id2);
    });

    it('should persist the ID in localStorage', () => {
        const id = getOrCreateVisitorId();
        expect(localStorage.getItem('sz_visitor_id')).toBe(id);
    });
});

describe('detectUserIdentity', () => {
    const baseProfile = { interactionCount: 0, lastVisit: '', visitorId: 'viz_test' };

    it('should detect Czech name patterns', () => {
        const result = detectUserIdentity('jsem Petr', baseProfile);
        expect(result).not.toBeNull();
        expect(result!.nickname).toBe('Petr');
    });

    it('should detect English name patterns', () => {
        const result = detectUserIdentity('call me John', baseProfile);
        expect(result).not.toBeNull();
        expect(result!.nickname).toBe('John');
    });

    it('should detect game mentions - CS2', () => {
        const result = detectUserIdentity('hraju CS2 každý den', baseProfile);
        expect(result).not.toBeNull();
        expect(result!.favoriteGames).toContain('CS2');
    });

    it('should detect game mentions - League of Legends', () => {
        const result = detectUserIdentity('mám rád LoL', baseProfile);
        expect(result).not.toBeNull();
        expect(result!.favoriteGames).toContain('League of Legends');
    });

    it('should detect game mentions - Valorant', () => {
        const result = detectUserIdentity("let's play valo", baseProfile);
        expect(result).not.toBeNull();
        expect(result!.favoriteGames).toContain('Valorant');
    });

    it('should detect multiple games in one message', () => {
        const result = detectUserIdentity('hraju cs2 a valorant', baseProfile);
        expect(result).not.toBeNull();
        expect(result!.favoriteGames).toContain('CS2');
        expect(result!.favoriteGames).toContain('Valorant');
    });

    it('should return null if no identity info found', () => {
        const result = detectUserIdentity('ahoj jak se máš', baseProfile);
        expect(result).toBeNull();
    });

    it('should not overwrite existing games', () => {
        const profile = { ...baseProfile, favoriteGames: ['Minecraft'] };
        const result = detectUserIdentity('hraju cs2', profile);
        expect(result).not.toBeNull();
        expect(result!.favoriteGames).toContain('Minecraft');
        expect(result!.favoriteGames).toContain('CS2');
    });

    it('should not add duplicate games', () => {
        const profile = { ...baseProfile, favoriteGames: ['CS2'] };
        const result = detectUserIdentity('hraju cs2', profile);
        expect(result).toBeNull(); // No change, so null
    });

    it('should ignore "skiller" as a name', () => {
        const result = detectUserIdentity('jsem skiller', baseProfile);
        expect(result).toBeNull();
    });
});

describe('getUserProfile', () => {
    it('should return a default profile if none exists in DB', async () => {
        (getSetting as any).mockResolvedValue(null);
        const profile = await getUserProfile();
        expect(profile.interactionCount).toBe(0);
        expect(profile.visitorId).toMatch(/^viz_/);
    });

    it('should return DB data when it exists', async () => {
        const existingProfile = {
            interactionCount: 42,
            lastVisit: '2025-01-01',
            visitorId: 'viz_12345678',
            nickname: 'TestUser',
        };
        (getSetting as any).mockResolvedValue(existingProfile);
        const profile = await getUserProfile();
        expect(profile.interactionCount).toBe(42);
        expect(profile.nickname).toBe('TestUser');
    });
});

describe('getOwnerProfile', () => {
    it('should return CS default when DB is empty', async () => {
        (fetchById as any).mockResolvedValue(null);
        const profile = await getOwnerProfile('cs');
        expect(profile.bio).toBe('Test bio CS');
    });

    it('should return EN default when DB is empty and lang=en', async () => {
        (fetchById as any).mockResolvedValue(null);
        const profile = await getOwnerProfile('en');
        expect(profile.bio).toBe('Test bio EN');
    });

    it('should return DB data when it exists', async () => {
        const dbProfile = {
            name: 'From DB', nickname: 'DB', role: 'Admin',
            bio: 'DB Bio', imgUrl: 'https://db.com/photo.jpg',
            stats: { xp: '10', class: 'X', ulti: 'Y' },
        };
        (fetchById as any).mockResolvedValue(dbProfile);
        const profile = await getOwnerProfile('cs');
        expect(profile.name).toBe('From DB');
    });
});
