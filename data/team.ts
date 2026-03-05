import { getYearsOnMarket } from '../utils/founding';

export interface TeamMember {
    id: string;
    name: string;
    nickname: string;
    role: string;
    class: 'Commander' | 'Tank' | 'Support' | 'DPS' | 'Healer' | 'Scout';
    rank: 'Boss' | 'Officer' | 'Veteran' | 'Recruit';
    location: string; // 'Žižkov' | 'Háje' | 'Stodůlky' | 'HQ' | 'All'
    bio: string;
    skills: string[];
    joinedYear: number;
    emoji: string; // Character icon
}

export const TEAM_DATA: TeamMember[] = [
    {
        id: 'tomas',
        name: 'Tomáš',
        nickname: 'Boss',
        role: 'Founder & CEO',
        class: 'Commander',
        rank: 'Boss',
        location: 'HQ',
        bio: `Založil SkillZone v 2005. ${getYearsOnMarket()} let buduje nejlepší herní komunitu v Praze. Vizionář, stratég, gamer heart.`,
        skills: ['Leadership', 'Strategy', 'Business', 'Gaming Culture'],
        joinedYear: 2005,
        emoji: '👑',
    },
    {
        id: 'member_2',
        name: 'Lukáš',
        nickname: 'Luki',
        role: 'Shift Manager — Žižkov',
        class: 'Tank',
        rank: 'Officer',
        location: 'Žižkov',
        bio: 'Noční směny, nonstop provoz, klid i v nejdrsnějších situacích. Žižkov je jeho rajón.',
        skills: ['Night Shift', 'Troubleshooting', 'Customer Ops', 'Hardware'],
        joinedYear: 2019,
        emoji: '🛡️',
    },
    {
        id: 'member_3',
        name: 'Marek',
        nickname: 'Marty',
        role: 'Tech Lead',
        class: 'DPS',
        rank: 'Officer',
        location: 'All',
        bio: 'Stará se o to, aby každý PC jel na max. Od BIOSu po RGB — pokud to svítí a počítá, je to jeho.',
        skills: ['PC Building', 'Networking', 'Overclocking', 'Diagnostics'],
        joinedYear: 2020,
        emoji: '⚡',
    },
    {
        id: 'member_4',
        name: 'Petra',
        nickname: 'Pixie',
        role: 'Community & Events',
        class: 'Support',
        rank: 'Veteran',
        location: 'Háje',
        bio: 'Organizuje turnaje, bootcampy a events. Pokud se někde v SkillZone děje sranda, je za tím ona.',
        skills: ['Event Planning', 'Social Media', 'Community', 'Tournament Ops'],
        joinedYear: 2021,
        emoji: '🎯',
    },
    {
        id: 'member_5',
        name: 'Daniel',
        nickname: 'Dan',
        role: 'Shift Operator — Háje',
        class: 'Scout',
        rank: 'Veteran',
        location: 'Háje',
        bio: 'Na Hájích má všechno pod kontrolou. Quick fix, welcome drink, a radí co hrát — multitasker.',
        skills: ['Customer Service', 'Quick Repairs', 'Game Knowledge', 'Multitasking'],
        joinedYear: 2022,
        emoji: '🎮',
    },
    {
        id: 'member_6',
        name: 'Jakub',
        nickname: 'Kuba',
        role: 'Shift Operator — Stodůlky',
        class: 'Healer',
        rank: 'Recruit',
        location: 'Stodůlky',
        bio: 'Čerstvá krev v týmu. Nadšenec pro esport a nová pobočka ve Stodůlkách je jeho mise.',
        skills: ['Esport', 'Console Gaming', 'New Gen', 'Positive Vibes'],
        joinedYear: 2024,
        emoji: '🚀',
    },
];
