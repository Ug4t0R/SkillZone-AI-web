/**
 * ownerProfile.test.tsx — Tests for the OwnerProfile component
 * Verifies rendering of profile data, image fallback, and RPG stats display.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock AppContext
vi.mock('../context/AppContext', () => ({
    useAppContext: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                owner_title: 'BOSS LEVEL',
            };
            return map[key] || key;
        },
        language: 'cs',
    }),
}));

// Mock useScrollReveal
vi.mock('../hooks/useScrollReveal', () => ({
    useScrollReveal: () => ({ current: null }),
}));

// Mock devTools
vi.mock('../utils/devTools', () => ({
    getOwnerProfile: vi.fn().mockResolvedValue({
        name: 'Tomáš Švec',
        nickname: 'Ug4t0R',
        role: 'Founder / Head Admin',
        bio: 'Test bio for owner profile.',
        imgUrl: 'https://example.com/boss.jpg',
        stats: { xp: '20 Let', class: 'Warlord', ulti: 'Banhammer' },
    }),
}));

import OwnerProfile from '../components/OwnerProfile';

describe('OwnerProfile', () => {
    it('should render the BOSS LEVEL title', async () => {
        render(<OwnerProfile />);
        await waitFor(() => {
            expect(screen.getByText('BOSS LEVEL')).toBeDefined();
        });
    });

    it('should display the owner nickname', async () => {
        render(<OwnerProfile />);
        await waitFor(() => {
            expect(screen.getByText('"Ug4t0R"')).toBeDefined();
        });
    });

    it('should display the owner role', async () => {
        render(<OwnerProfile />);
        await waitFor(() => {
            expect(screen.getByText('Founder / Head Admin')).toBeDefined();
        });
    });

    it('should display the bio in quotes', async () => {
        render(<OwnerProfile />);
        await waitFor(() => {
            expect(screen.getByText('"Test bio for owner profile."')).toBeDefined();
        });
    });

    it('should display RPG stats', async () => {
        render(<OwnerProfile />);
        await waitFor(() => {
            expect(screen.getByText('20 Let')).toBeDefined();
            expect(screen.getByText('Warlord')).toBeDefined();
            expect(screen.getByText('Banhammer')).toBeDefined();
        });
    });

    it('should render the LVL badge', async () => {
        render(<OwnerProfile />);
        await waitFor(() => {
            expect(screen.getByText('LVL 40+')).toBeDefined();
        });
    });

    it('should render the profile image', async () => {
        render(<OwnerProfile />);
        await waitFor(() => {
            const img = document.querySelector('img[alt="Tomáš Švec"]') as HTMLImageElement;
            expect(img).toBeDefined();
            expect(img.src).toBe('https://example.com/boss.jpg');
        });
    });
});
