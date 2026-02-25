/**
 * appContext.test.tsx — Tests for the AppContext provider
 * Verifies theme toggling, language switching, brainrot mode, and t() translation.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useAppContext } from '../context/AppContext';

// Mock contentService (loads from Supabase)
vi.mock('../services/contentService', () => ({
    loadContentOverrides: vi.fn().mockResolvedValue(undefined),
    getContentOverride: vi.fn().mockReturnValue(undefined),
}));

// Helper component that exposes context
function TestConsumer() {
    const ctx = useAppContext();
    return (
        <div>
            <span data-testid="theme">{ctx.theme}</span>
            <span data-testid="lang">{ctx.language}</span>
            <span data-testid="brainrot">{String(ctx.isBrainrot)}</span>
            <span data-testid="t-hero">{ctx.t('hero_cta')}</span>
            <span data-testid="all-langs">{ctx.allLanguages.join(',')}</span>
            <button data-testid="toggle-theme" onClick={ctx.toggleTheme}>toggle</button>
            <button data-testid="set-en" onClick={() => ctx.setLanguage('en')}>en</button>
            <button data-testid="set-de" onClick={() => ctx.setLanguage('de')}>de</button>
            <button data-testid="next-lang" onClick={ctx.nextLanguage}>next</button>
            <button data-testid="toggle-brainrot" onClick={() => ctx.setBrainrot(!ctx.isBrainrot)}>brainrot</button>
        </div>
    );
}

const renderWithProvider = () =>
    render(
        <AppProvider>
            <TestConsumer />
        </AppProvider>
    );

describe('AppContext', () => {
    it('should provide default dark theme', () => {
        renderWithProvider();
        expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    it('should toggle theme from dark to light', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        await user.click(screen.getByTestId('toggle-theme'));
        expect(screen.getByTestId('theme').textContent).toBe('light');
    });

    it('should toggle theme back to dark', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        await user.click(screen.getByTestId('toggle-theme'));
        await user.click(screen.getByTestId('toggle-theme'));
        expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    it('should provide all 8 languages', () => {
        renderWithProvider();
        const langs = screen.getByTestId('all-langs').textContent;
        expect(langs).toBe('cs,sk,en,de,pl,ru,ua,vi');
    });

    it('should switch language to EN', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        await user.click(screen.getByTestId('set-en'));
        expect(screen.getByTestId('lang').textContent).toBe('en');
    });

    it('should switch language to DE', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        await user.click(screen.getByTestId('set-de'));
        expect(screen.getByTestId('lang').textContent).toBe('de');
    });

    it('should cycle to next language', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        // Default might be 'cs' in test env → next should be 'sk'
        const initialLang = screen.getByTestId('lang').textContent;
        await user.click(screen.getByTestId('next-lang'));
        const nextLang = screen.getByTestId('lang').textContent;
        expect(nextLang).not.toBe(initialLang);
    });

    it('should start with brainrot off', () => {
        renderWithProvider();
        expect(screen.getByTestId('brainrot').textContent).toBe('false');
    });

    it('should toggle brainrot mode on', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        await user.click(screen.getByTestId('toggle-brainrot'));
        expect(screen.getByTestId('brainrot').textContent).toBe('true');
    });

    it('should translate hero_cta based on language', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        // Set to EN
        await user.click(screen.getByTestId('set-en'));
        const enText = screen.getByTestId('t-hero').textContent;
        expect(enText).toBeTruthy();
        expect(enText!.length).toBeGreaterThan(0);
    });

    it('should use brainrot override for hero_cta when active', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        await user.click(screen.getByTestId('toggle-brainrot'));
        const brainrotText = screen.getByTestId('t-hero').textContent;
        // Brainrot CTA is "LOCK IN 🔒"
        expect(brainrotText).toBe('LOCK IN 🔒');
    });

    it('should persist theme to localStorage', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        await user.click(screen.getByTestId('toggle-theme'));
        expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should persist language to localStorage', async () => {
        renderWithProvider();
        const user = userEvent.setup();
        await user.click(screen.getByTestId('set-en'));
        expect(localStorage.getItem('lang')).toBe('en');
    });
});

describe('useAppContext', () => {
    it('should throw if used outside provider', () => {
        // Suppress console.error from React
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => {
            render(<TestConsumer />);
        }).toThrow('useAppContext must be used within an AppProvider');
        spy.mockRestore();
    });
});
