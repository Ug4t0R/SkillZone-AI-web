/**
 * hero.test.tsx — Tests for the Hero component
 * Verifies render, scan button visibility, and Neural Sync overlay logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock AppContext
vi.mock('../context/AppContext', () => ({
    useAppContext: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                hero_cta: 'PLAY NOW',
                hero_players: 'registered players',
            };
            return map[key] || key;
        },
    }),
}));

// Mock HeroPresentation
vi.mock('../components/HeroPresentation', () => ({
    default: () => <div data-testid="hero-presentation">Presentation</div>,
}));

// Mock devTools
vi.mock('../utils/devTools', () => ({
    getUserProfile: vi.fn().mockResolvedValue({
        interactionCount: 0,
        lastVisit: '',
        visitorId: 'viz_test',
    }),
    saveUserProfile: vi.fn().mockResolvedValue(undefined),
}));

import Hero from '../components/Hero';

describe('Hero', () => {
    it('should render the hero section', () => {
        render(<Hero />);
        expect(screen.getByText('PLAY NOW')).toBeDefined();
    });

    it('should show the scan button', () => {
        render(<Hero />);
        expect(screen.getByText('Initialize_Neural_Scan')).toBeDefined();
    });

    it('should show Neural Sync overlay after clicking scan', async () => {
        render(<Hero />);
        const user = userEvent.setup();
        await user.click(screen.getByText('Initialize_Neural_Scan'));
        expect(screen.getByText('Neural_Sync_Active')).toBeDefined();
    });

    it('should dismiss Neural Sync after timeout', async () => {
        vi.useFakeTimers();
        render(<Hero />);

        // Click scan
        await act(async () => {
            screen.getByText('Initialize_Neural_Scan').click();
        });

        expect(screen.getByText('Neural_Sync_Active')).toBeDefined();

        // Fast-forward 3.1 seconds (scan completes after 3s)
        await act(async () => {
            vi.advanceTimersByTime(3100);
        });

        // Allow async callback to resolve
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // Overlay should be gone
        expect(screen.queryByText('Neural_Sync_Active')).toBeNull();
        vi.useRealTimers();
    });

    it('should show players count', () => {
        render(<Hero />);
        expect(screen.getByText('registered players')).toBeDefined();
    });

    it('should render HeroPresentation', () => {
        render(<Hero />);
        expect(screen.getByTestId('hero-presentation')).toBeDefined();
    });
});
