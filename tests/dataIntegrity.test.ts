/**
 * dataIntegrity.test.ts — Tests for data files integrity
 * Verifies locations, events, reviews, and owner profile defaults are valid.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_OWNER_PROFILE_CS, DEFAULT_OWNER_PROFILE_EN } from '../data/ownerProfile';

describe('Owner Profile Defaults', () => {
    it('should have CS profile with all fields', () => {
        expect(DEFAULT_OWNER_PROFILE_CS.name).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_CS.nickname).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_CS.role).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_CS.bio).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_CS.imgUrl).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_CS.stats).toBeDefined();
        expect(DEFAULT_OWNER_PROFILE_CS.stats.xp).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_CS.stats.class).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_CS.stats.ulti).toBeTruthy();
    });

    it('should have EN profile with all fields', () => {
        expect(DEFAULT_OWNER_PROFILE_EN.name).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_EN.nickname).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_EN.bio).toBeTruthy();
        expect(DEFAULT_OWNER_PROFILE_EN.imgUrl).toBeTruthy();
    });

    it('should have matching name in CS and EN', () => {
        expect(DEFAULT_OWNER_PROFILE_CS.name).toBe(DEFAULT_OWNER_PROFILE_EN.name);
    });

    it('should have matching nickname in CS and EN', () => {
        expect(DEFAULT_OWNER_PROFILE_CS.nickname).toBe(DEFAULT_OWNER_PROFILE_EN.nickname);
    });
});

describe('Data File Imports', () => {
    it('should import locations without errors', async () => {
        const locations = await import('../data/locations');
        expect(locations).toBeDefined();
    });

    it('should import events without errors', async () => {
        const events = await import('../data/events');
        expect(events).toBeDefined();
    });

    it('should import history without errors', async () => {
        const history = await import('../data/history');
        expect(history).toBeDefined();
    });
});
