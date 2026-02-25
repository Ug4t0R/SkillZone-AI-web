import { ProtocolRule } from '../types';

export const PROTOCOL_DATA_CS: ProtocolRule[] = [
    {
        id: 'p1', title: 'Jídlo & Pití', category: 'general', icon: 'utensils',
        content: [
            'VEŘEJNÁ ZÓNA: U PC je zakázáno konzumovat vlastní jídlo. Můžeš si přinést vlastní pití, ale pouze v UZAVÍRATELNÉ LAHVI.',
            'BOOTCAMP: Zde je dovoleno VŠE. Vlastní jídlo, pití, alkohol (pokud ti je 18+).',
            'Na baru zakoupené věci lze konzumovat všude bez omezení.'
        ]
    },
    {
        id: 'p2', title: 'Hardware & Software', category: 'tech', icon: 'cpu',
        content: [
            'PŘÍSNÝ ZÁKAZ restartování a vypínání počítačů.',
            'ZÁKAZ instalování, modování, hackování, botování či skriptování.',
            'ZÁKAZ přemisťování vybavení (klávesnice, myši, sluchátka, židle) bez svolení obsluhy.',
            'ZÁKAZ zapojování vlastních věcí do zásuvek pro PC (nabíječky řeš na baru).',
            'V případě technických problémů VŽDY kontaktuj obsluhu.'
        ]
    },
    {
        id: 'p3', title: 'Chování & Noční Klid', category: 'behavior', icon: 'user-x',
        content: [
            'ZÁKAZ spaní v provozovně.',
            'ZÁKAZ vstupu pod vlivem alkoholu či drog.',
            'ZÁKAZ kouření uvnitř (elektronické cigarety povoleny jen s ohledem na techniku).',
            'Od 00:00 do 08:00 smí být v herně pouze návštěvníci přihlášení u PC.',
            'Prostory jsou monitorovány kamerovým systémem.'
        ]
    },
    {
        id: 'p4', title: 'Herní Účet & Kredit', category: 'account', icon: 'credit-card',
        content: [
            'Kredit je nepřenosný mezi účty.',
            'Kredit NEPROPADÁ. Nikdy.',
            'Nelze hrát na cizím účtu bez přítomnosti majitele.',
            'Za kredit na účtu lze nakupovat zboží na baru.'
        ]
    }
];

export const PROTOCOL_DATA_EN: ProtocolRule[] = [
    {
        id: 'p1', title: 'Food & Drinks', category: 'general', icon: 'utensils',
        content: [
            'PUBLIC ZONE: Consuming own food at PCs is prohibited. You may bring your own drink, but only in a CLOSABLE BOTTLE.',
            'BOOTCAMP: EVERYTHING allowed here. Own food, drinks, alcohol (18+).',
            'Items purchased at the bar can be consumed anywhere without restriction.'
        ]
    },
    {
        id: 'p2', title: 'Hardware & Software', category: 'tech', icon: 'cpu',
        content: [
            'STRICTLY PROHIBITED to restart or turn off computers.',
            'NO installing, modding, hacking, botting or scripting.',
            'NO moving equipment (keyboards, mice, headsets, chairs) without staff permission.',
            'NO plugging own devices into PC power outlets (charge at bar).',
            'In case of technical issues ALWAYS contact staff.'
        ]
    },
    {
        id: 'p3', title: 'Behavior & Night Ops', category: 'behavior', icon: 'user-x',
        content: [
            'NO sleeping in the premises.',
            'NO entry under influence of alcohol or drugs.',
            'NO smoking inside (vaping allowed with caution regarding tech).',
            'From 00:00 to 08:00 only customers logged in at PCs allowed.',
            'Premises are monitored by CCTV.'
        ]
    },
    {
        id: 'p4', title: 'Game Account & Credit', category: 'account', icon: 'credit-card',
        content: [
            'Credit is non-transferable between accounts.',
            'Credit NEVER EXPIRES.',
            'Playing on another person\'s account is prohibited without owner present.',
            'Credit can be used to buy items at the bar.'
        ]
    }
];
