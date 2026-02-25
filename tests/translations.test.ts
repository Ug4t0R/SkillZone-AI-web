/**
 * translations.test.ts — Tests for translations.ts
 * Verifies all languages have required keys and brainrot overrides are valid.
 */
import { describe, it, expect } from 'vitest';
import { translations, brainrotOverrides } from '../translations';

const ALL_LANGUAGES = ['cs', 'sk', 'en', 'de', 'pl', 'ru', 'ua', 'vi'] as const;
const csKeys = Object.keys(translations['cs']);

describe('Translations', () => {
    it('should have CS as the base language with keys', () => {
        expect(csKeys.length).toBeGreaterThan(50);
    });

    it('should have all 8 supported languages', () => {
        for (const lang of ALL_LANGUAGES) {
            expect(translations[lang]).toBeDefined();
            expect(typeof translations[lang]).toBe('object');
        }
    });

    it('should have identical keys across all languages', () => {
        for (const lang of ALL_LANGUAGES) {
            const langKeys = Object.keys(translations[lang]);
            const missing = csKeys.filter(k => !langKeys.includes(k));
            expect(missing, `Language "${lang}" is missing keys: ${missing.join(', ')}`).toEqual([]);
        }
    });

    it('should not have empty string values in CS', () => {
        for (const key of csKeys) {
            const val = (translations['cs'] as any)[key];
            expect(val, `Key "${key}" in CS is empty`).toBeTruthy();
        }
    });

    it('should not have empty string values in EN', () => {
        const enKeys = Object.keys(translations['en']);
        for (const key of enKeys) {
            const val = (translations['en'] as any)[key];
            expect(val, `Key "${key}" in EN is empty`).toBeTruthy();
        }
    });
});

describe('Brainrot Overrides', () => {
    it('should exist and have at least 10 keys', () => {
        expect(Object.keys(brainrotOverrides).length).toBeGreaterThanOrEqual(10);
    });

    it('should only override keys that exist in CS translations', () => {
        const brainrotKeys = Object.keys(brainrotOverrides);
        for (const key of brainrotKeys) {
            expect(csKeys, `Brainrot key "${key}" not found in CS translations`).toContain(key);
        }
    });

    it('should have non-empty string values', () => {
        for (const [key, val] of Object.entries(brainrotOverrides)) {
            expect(val, `Brainrot key "${key}" is empty`).toBeTruthy();
            expect(typeof val).toBe('string');
        }
    });

    it('should have mostly different values than CS originals', () => {
        let differentCount = 0;
        const entries = Object.entries(brainrotOverrides);
        for (const [key, val] of entries) {
            const csVal = (translations['cs'] as any)[key];
            if (val !== csVal) differentCount++;
        }
        // At least 80% should be different (some may intentionally keep English text like "NEXT DROP:")
        expect(differentCount / entries.length).toBeGreaterThan(0.8);
    });
});
