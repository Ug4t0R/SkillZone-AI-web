import { GamingLocation, LocationType } from '../types';

export const LOCATIONS_CS: GamingLocation[] = [
    {
        id: 'zizkov',
        name: 'Praha 3: Žižkov (Nonstop)',
        type: LocationType.PUBLIC,
        address: 'Orebitská 630/4, Praha 3',
        description: 'Náš legendární nonstop spot. Funguje už od roku 2011. Přijď kdykoliv, odejdi... no, to záleží na tobě. Ideální pro solo hráče i party.',
        specs: ['29 PC', '240Hz Monitory', 'VIP zóna (2.5k 240Hz)', '10Gbps Internet (Tuned)'],
        imgUrl: '/bg/P3.webp',
        phone: '777 766 113',
        mapLink: 'https://share.google/1sTUyG7cfbPHZSNce',
        openHours: 'NONSTOP 24/7',
        openYear: '2011',
        coordinates: { lat: 50.085536, lng: 14.454236 }
    },
    {
        id: 'haje',
        name: 'Praha 4: Háje (Metro)',
        type: LocationType.PUBLIC,
        address: 'Arkalycká 877/4, Praha 4',
        description: 'Nová vymazlená herna (otevřeno 2024) přímo na metru. Vylezeš z vagónu a do minuty fraguješ. Top klimatizace.',
        specs: ['27 PC', '240Hz & 380Hz Monitory', 'Konzole', 'VIP Zóna'],
        imgUrl: '/bg/P4.webp',
        phone: '777 766 114',
        mapLink: 'https://share.google/XBcvMnkhHHB3eL13P',
        openHours: '12:00 – 00:00 (s hráči až do 03:00)',
        openYear: '2024',
        coordinates: { lat: 50.031670, lng: 14.527940 }
    },
    {
        id: 'stodulky',
        name: 'Praha 5: Stodůlky (Nově otevřeno)',
        type: LocationType.PUBLIC,
        address: 'Mukařovského 1986/7, Praha 5',
        description: 'Naše nejnovější expanze. Čerstvý hardware, nový prostor, stejný SkillZone vibe. Otevřeno 2025!',
        specs: ['RTX 40 Series', 'Next-Gen PC', 'Nový prostor', 'Otevřeno 2025'],
        imgUrl: '/bg/P4.webp',
        phone: '777 766 115',
        mapLink: 'https://share.google/Bm7VrkmwoRSA3TwVI',
        openHours: '13:00 – 21:00 (s hráči až do 23:00)',
        openYear: '2025',
        coordinates: { lat: 50.0417, lng: 14.3278 }
    },
    {
        id: 'bootcamp',
        name: 'Private Bootcamp Háje',
        type: LocationType.PRIVATE,
        address: 'Háje (Metro)',
        description: 'Vezměte ženicha tam, kde je mu nejlíp – za klávesnici a myš. Ve SkillZone si užijete zcela soukromou LAN párty! Máme pro vás privátní prostory (ne, fakt nejde jen o „místnost v herně" – takže žádní cizí lidi a random kidi) s vlastním zázemím, a klidně i pípou. Přineste si vlastní drinky, sváču a klidně přijďte s mísou řízků. Zahrajte si legendární hry z vašeho dětství, dospívání, zavzpomínejte na LANky s kámošema! Ukažte, kdo je tady pánem serveru, než se on stane pánem domu.',
        specs: ['10 PC', 'BYOB (Vlastní jídlo/pití)', 'Soukromý vchod & WC', 'Pípa & Ledovač'],
        imgUrl: 'https://skillzone.cz/wp-content/uploads/2024/04/8.png',
        phone: '777 766 112',
        mapLink: 'https://maps.app.goo.gl/Gse2er99AjK45Wt5A',
        openHours: 'Na objednání 24/7',
        openYear: '2024',
        coordinates: { lat: 50.031670, lng: 14.527940 }
    }
];

export const LOCATIONS_EN: GamingLocation[] = [
    {
        id: 'zizkov',
        name: 'Prague 3: Žižkov (Nonstop)',
        type: LocationType.PUBLIC,
        address: 'Orebitská 630/4, Prague 3',
        description: 'Our legendary nonstop spot. Running since 2011. Come anytime, leave... well, that depends on you. Ideal for solo players and parties.',
        specs: ['29 PCs', '240Hz Monitors', 'VIP Zone (2.5k 240Hz)', '10Gbps Internet (Tuned)'],
        imgUrl: '/bg/P3.webp',
        phone: '777 766 113',
        mapLink: 'https://share.google/1sTUyG7cfbPHZSNce',
        openHours: 'NONSTOP 24/7',
        openYear: '2011',
        coordinates: { lat: 50.085536, lng: 14.454236 }
    },
    {
        id: 'haje',
        name: 'Prague 4: Háje (Metro)',
        type: LocationType.PUBLIC,
        address: 'Arkalycká 877/4, Prague 4',
        description: 'New polished game room (opened 2024) right at the metro station. Step out of the train and start fragging in a minute. Top tier AC.',
        specs: ['27 PCs', '240Hz & 380Hz Monitors', 'Consoles', 'VIP Zone'],
        imgUrl: '/bg/P4.webp',
        phone: '777 766 114',
        mapLink: 'https://share.google/XBcvMnkhHHB3eL13P',
        openHours: '12:00 – Midnight (open till 3am if players present)',
        openYear: '2024',
        coordinates: { lat: 50.031670, lng: 14.527940 }
    },
    {
        id: 'stodulky',
        name: 'Prague 5: Stodůlky (New Opening)',
        type: LocationType.PUBLIC,
        address: 'Mukařovského 1986/7, Prague 5',
        description: 'Our newest expansion. Fresh hardware, new space, same SkillZone vibe. Opened 2025!',
        specs: ['RTX 40 Series', 'Next-Gen PC', 'New Space', 'Opened 2025'],
        imgUrl: '/bg/P4.webp',
        phone: '777 766 115',
        mapLink: 'https://share.google/Bm7VrkmwoRSA3TwVI',
        openHours: '13:00 – 21:00 (open till 23:00 if players present)',
        openYear: '2025',
        coordinates: { lat: 50.0417, lng: 14.3278 }
    },
    {
        id: 'bootcamp',
        name: 'Private Bootcamp Háje',
        type: LocationType.PRIVATE,
        address: 'Háje (Metro)',
        description: 'Take the groom where he feels best – behind a keyboard and mouse. Enjoy a completely private LAN party at SkillZone! We have private spaces (no, really not just a "room in a cybercafe" – so no strangers and random kids) with own facilities, and even a tap. Bring your own drinks, snacks. Play legendary games from your childhood, memories of LANs with friends! Show who is the server master before he becomes the master of the house.',
        specs: ['10 PCs', 'BYOB (Own Food/Drink)', 'Private Entrance & WC', 'Tap & Ice Machine'],
        imgUrl: 'https://skillzone.cz/wp-content/uploads/2024/04/8.png',
        phone: '777 766 112',
        mapLink: 'https://maps.app.goo.gl/Gse2er99AjK45Wt5A',
        openHours: 'On Order 24/7',
        openYear: '2024',
        coordinates: { lat: 50.031670, lng: 14.527940 }
    }
];

export const LOCATIONS = LOCATIONS_CS;
