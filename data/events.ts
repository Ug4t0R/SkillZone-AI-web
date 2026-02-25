import { CalendarEvent } from '../types';

export const EVENTS_DATA_CS: CalendarEvent[] = [
    { id: 'e1', title: 'CS2 Wingman Night', date: '2024-06-15', time: '18:00', game: 'CS2', type: 'tournament', description: 'Klasický 2v2 turnaj o kredity. Entry fee 100 Kč. Vítěz bere vše.', capacity: '16 Týmů', registrationLink: 'https://skillzone.cz/turnaje' },
    { id: 'e2', title: 'FIFA 24 Chill', date: '2024-06-20', time: '17:00', game: 'FIFA', type: 'party', description: 'Pohodový večer s FIFOU na PS5. Pivo v akci.', capacity: 'Volno' },
    { id: 'e3', title: 'Worlds Viewing Party', date: '2024-11-02', time: '12:00', game: 'LOL', type: 'stream', description: 'Sledujeme finále Worlds na projektoru. Tipovačka o skiny.', capacity: '40 Míst' }
];

export const EVENTS_DATA_EN: CalendarEvent[] = [
    { id: 'e1', title: 'CS2 Wingman Night', date: '2024-06-15', time: '18:00', game: 'CS2', type: 'tournament', description: 'Classic 2v2 tournament for credits. Entry fee 100 CZK. Winner takes all.', capacity: '16 Teams', registrationLink: 'https://skillzone.cz/tournaments' },
    { id: 'e2', title: 'FIFA 24 Chill', date: '2024-06-20', time: '17:00', game: 'FIFA', type: 'party', description: 'Chill evening with FIFA on PS5. Beer discounts.', capacity: 'Open' },
    { id: 'e3', title: 'Worlds Viewing Party', date: '2024-11-02', time: '12:00', game: 'LOL', type: 'stream', description: 'Watching Worlds finals on big screen. Skin prediction contest.', capacity: '40 Seats' }
];
