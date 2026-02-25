/**
 * contentService.test.ts — Tests for the content override service
 * Tests in-memory cache behavior and override lookup logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSelect = vi.fn().mockReturnValue({});
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
vi.mock('../services/supabaseClient', () => ({
    getSupabase: () => ({
        from: mockFrom,
    }),
}));

// We need to reset module state between tests since contentService uses module-level caching
let contentService: typeof import('../services/contentService');

beforeEach(async () => {
    vi.resetModules();
    mockSelect.mockReturnValue({
        data: [
            { key: 'hero_cta', lang: 'cs', value: 'VLASTNÍ TLAČÍTKO' },
            { key: 'hero_cta', lang: 'en', value: 'CUSTOM BUTTON' },
            { key: 'nav_home', lang: 'cs', value: 'Domů Custom' },
        ],
        error: null,
    });
    contentService = await import('../services/contentService');
});

describe('contentService', () => {
    describe('loadContentOverrides', () => {
        it('should load overrides from Supabase', async () => {
            await contentService.loadContentOverrides();
            expect(mockFrom).toHaveBeenCalledWith('web_content');
            expect(contentService.isContentLoaded()).toBe(true);
        });

        it('should not reload if already loaded', async () => {
            await contentService.loadContentOverrides();
            const callCount = mockFrom.mock.calls.length;
            await contentService.loadContentOverrides();
            expect(mockFrom.mock.calls.length).toBe(callCount); // No additional call
        });
    });

    describe('getContentOverride', () => {
        it('should return CS override after loading', async () => {
            await contentService.loadContentOverrides();
            expect(contentService.getContentOverride('hero_cta', 'cs')).toBe('VLASTNÍ TLAČÍTKO');
        });

        it('should return EN override after loading', async () => {
            await contentService.loadContentOverrides();
            expect(contentService.getContentOverride('hero_cta', 'en')).toBe('CUSTOM BUTTON');
        });

        it('should return undefined for non-overridden keys', async () => {
            await contentService.loadContentOverrides();
            expect(contentService.getContentOverride('nonexistent', 'cs')).toBeUndefined();
        });

        it('should return undefined for non-overridden languages', async () => {
            await contentService.loadContentOverrides();
            expect(contentService.getContentOverride('hero_cta', 'de')).toBeUndefined();
        });
    });

    describe('getAllOverrides', () => {
        it('should return all overrides for a language', async () => {
            await contentService.loadContentOverrides();
            const csOverrides = contentService.getAllOverrides('cs');
            expect(Object.keys(csOverrides)).toContain('hero_cta');
            expect(Object.keys(csOverrides)).toContain('nav_home');
            expect(Object.keys(csOverrides).length).toBe(2);
        });

        it('should return empty object for unknown language', async () => {
            await contentService.loadContentOverrides();
            const plOverrides = contentService.getAllOverrides('pl');
            expect(Object.keys(plOverrides).length).toBe(0);
        });
    });

    describe('error handling', () => {
        it('should handle Supabase errors gracefully', async () => {
            mockSelect.mockReturnValue({ data: null, error: { message: 'DB error' } });
            const spy = vi.spyOn(console, 'debug').mockImplementation(() => { });
            await contentService.loadContentOverrides();
            expect(contentService.isContentLoaded()).toBe(true); // Still marks as loaded
            spy.mockRestore();
        });
    });
});
