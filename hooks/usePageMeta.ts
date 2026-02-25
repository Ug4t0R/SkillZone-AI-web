import { useEffect } from 'react';
import { AppView } from '../types';
import { Language } from '../context/AppContext';

interface PageMeta {
    title: string;
    description: string;
}

type PageMetaMap = Partial<Record<AppView, PageMeta>>;

const PAGE_META: Partial<Record<Language, PageMetaMap>> = {
    cs: {
        home: {
            title: 'SkillZone | Síť herních klubů v Praze',
            description: 'SkillZone — síť herních klubů v Praze. RTX 4070 Ti, 240Hz monitory, 10Gbps internet. Žižkov NONSTOP 24/7, Háje, Stodůlky. 20 let na trhu.'
        },
        locations: {
            title: 'Pobočky | SkillZone Gaming Club',
            description: 'Najdi nejbližší hernu SkillZone v Praze. Žižkov (nonstop 24/7), Háje (u metra), Stodůlky (nově otevřeno), Private Bootcamp.'
        },
        pricing: {
            title: 'Ceník | SkillZone Gaming Club',
            description: 'Dynamický ceník SkillZone. Čím víc hraješ, tím míň platíš. Kredit nepropadá. Od 29 Kč/hod.'
        },
        history: {
            title: 'Historie | SkillZone Gaming Club',
            description: '20 let herní historie. Od 10 PC ve Strakonicích po síť herních klubů v Praze.'
        },
        booking: {
            title: 'Rezervace | SkillZone Gaming Club',
            description: 'Rezervuj si místo v herně SkillZone. LAN party, narozeniny, teambuilding nebo solo session.'
        },
        services: {
            title: 'Služby | SkillZone Gaming Club',
            description: 'Pronájem techniky, stream produkce, eventy na klíč.'
        },
        gift: {
            title: 'Dárkové poukázky | SkillZone Gaming Club',
            description: 'Kup kredit na SkillZone jako dárek. PDF, osobní předání nebo Zásilkovna. Kredit nikdy nepropadá.'
        },
        poukaz: {
            title: 'Uplatnit poukázku | SkillZone Gaming Club',
            description: 'Máš promo poukázku na SkillZone? Přijď, řekni heslo, registruj se a hraj 2 hodiny zdarma!'
        },
        gallery: {
            title: 'Galerie | SkillZone Gaming Club',
            description: 'Fotogalerie herních klubů SkillZone. Atmosféra, hardware, turnaje, komunita. Nahlédni do zákulisí.'
        },
        map: {
            title: 'Mapa poboček | SkillZone Gaming Club',
            description: 'Interaktivní mapa všech herních klubů SkillZone v Praze. Žižkov, Háje, Stodůlky — najdi nejbližší hernu.'
        },
        arena: {
            title: 'Herní Aréna Praha | Pobočky SkillZone',
            description: 'Hledáte nejlepší herní arénu v Praze? SkillZone nabízí 3 špičkové pobočky rozeseté v trojúhelníku Prahy. Místo jedné arény zkus naše herní kluby.'
        },
        mvp: {
            title: 'MVP Esport Trénink | SkillZone Praha',
            description: 'Získej titul MVP s esportovým vybavením ve SkillZone Praha. Špičková PC, 240Hz monitory a prostředí pro profíky, kteří chtějí hrát na maximum.'
        },
        cybersport: {
            title: 'Cybersport a Bootcamp | SkillZone Praha',
            description: 'To pravé centrum pro cybersport a herní eventy v Praze. Rezervuj si privátní Bootcamp, založ tým a hrajte nerušeně v profesionálním herním prostředí.'
        }
    },
    en: {
        home: {
            title: 'SkillZone | Gaming Club Network in Prague',
            description: 'SkillZone — gaming club network in Prague. RTX 4070 Ti, 240Hz monitors, 10Gbps internet. 20 years of gaming.'
        },
        locations: {
            title: 'Locations | SkillZone Gaming Club',
            description: 'Find your nearest SkillZone gaming club in Prague. Žižkov (24/7), Háje, Stodůlky, Private Bootcamp.'
        },
        pricing: {
            title: 'Pricing | SkillZone Gaming Club',
            description: 'Dynamic pricing at SkillZone. The more you play, the less you pay. Credit never expires.'
        },
        history: {
            title: 'History | SkillZone Gaming Club',
            description: '20 years of gaming history. From 10 PCs in Strakonice to a gaming club network in Prague.'
        },
        booking: {
            title: 'Booking | SkillZone Gaming Club',
            description: 'Book your spot at SkillZone. LAN party, birthday, teambuilding or solo session.'
        },
        services: {
            title: 'Services | SkillZone Gaming Club',
            description: 'HW rental, stream production, turnkey events.'
        },
        gift: {
            title: 'Gift Vouchers | SkillZone Gaming Club',
            description: 'Buy SkillZone credit as a gift. PDF, in-person or delivery. Credit never expires.'
        },
        poukaz: {
            title: 'Redeem Voucher | SkillZone Gaming Club',
            description: 'Got a SkillZone promo voucher? Come in, say the password, register and play 2 hours for free!'
        },
        gallery: {
            title: 'Gallery | SkillZone Gaming Club',
            description: 'Photo gallery of SkillZone gaming clubs. Atmosphere, hardware, tournaments, community.'
        },
        map: {
            title: 'Location Map | SkillZone Gaming Club',
            description: 'Interactive map of all SkillZone gaming clubs in Prague. Žižkov, Háje, Stodůlky — find your nearest club.'
        },
        arena: {
            title: 'Gaming Arena Prague | SkillZone Locations',
            description: 'Looking for the best gaming arena in Prague? SkillZone offers 3 top-tier locations spread across the city. Try our gaming clubs.'
        },
        mvp: {
            title: 'MVP Esports Training | SkillZone Prague',
            description: 'Earn your MVP title with esports gear at SkillZone Prague. Top PCs, 240Hz monitors, and an environment for pros playing to the max.'
        },
        cybersport: {
            title: 'Cybersport and Bootcamp | SkillZone Prague',
            description: 'The true hub for cybersport and gaming events in Prague. Book a private Bootcamp, build a team, and play undisturbed.'
        }
    },
    ru: {
        home: {
            title: 'SkillZone | Сеть игровых клубов в Праге',
            description: 'SkillZone — сеть игровых клубов в Праге. RTX 4070 Ti, 240Hz мониторы, 10Gbps интернет. 20 лет на рынке.'
        },
        locations: {
            title: 'Филиалы | SkillZone Gaming Club',
            description: 'Найди ближайший клуб SkillZone в Праге. Жижков (24/7), Гае, Стодулки.'
        },
        pricing: {
            title: 'Цены | SkillZone Gaming Club',
            description: 'Динамическое ценообразование SkillZone. Чем больше играешь, тем дешевле.'
        },
        history: {
            title: 'История | SkillZone Gaming Club',
            description: '20 лет игровой истории. От 10 ПК до сети клубов в Праге.'
        },
        booking: {
            title: 'Бронирование | SkillZone Gaming Club',
            description: 'Забронируй место в SkillZone. LAN party, день рождения, тимбилдинг.'
        },
        services: {
            title: 'Услуги | SkillZone Gaming Club',
            description: 'Аренда техники, стрим-продакшн, мероприятия под ключ.'
        },
        gift: {
            title: 'Подарочные сертификаты | SkillZone Gaming Club',
            description: 'Купи кредит SkillZone в подарок. Кредит никогда не сгорает.'
        },
        poukaz: {
            title: 'Активировать сертификат | SkillZone Gaming Club',
            description: 'Есть промо-сертификат SkillZone? Приходи, назови пароль и играй 2 часа бесплатно!'
        },
        gallery: {
            title: 'Галерея | SkillZone Gaming Club',
            description: 'Фотогалерея игровых клубов SkillZone. Атмосфера, железо, турниры, комьюнити.'
        },
        map: {
            title: 'Карта филиалов | SkillZone Gaming Club',
            description: 'Интерактивная карта всех игровых клубов SkillZone в Праге. Жижков, Гае, Стодулки.'
        },
        arena: {
            title: 'Игровая Арена Прага | SkillZone',
            description: 'Ищете лучшую игровую арену в Праге? SkillZone предлагает 3 клуба по всему городу с топовым железом.'
        },
        mvp: {
            title: 'MVP Киберспорт | SkillZone Прага',
            description: 'Стань MVP с киберспортивным оборудованием в SkillZone. ПК RTX 4070 Ti, 240Hz мониторы.'
        },
        cybersport: {
            title: 'Киберспорт и Буткемп | SkillZone Прага',
            description: 'Центр киберспорта в Праге. Забронируй приватный Буткемп для команды и играй без помех.'
        }
    },
    ua: {
        home: {
            title: 'SkillZone | Мережа ігрових клубів у Празі',
            description: 'SkillZone — мережа ігрових клубів у Празі. RTX 4070 Ti, 240Hz монітори, 10Gbps інтернет. 20 років на ринку.'
        },
        locations: {
            title: 'Філіали | SkillZone Gaming Club',
            description: 'Знайди найближчий клуб SkillZone у Празі. Жижков (24/7), Гає, Стодулки.'
        },
        pricing: {
            title: 'Ціни | SkillZone Gaming Club',
            description: 'Динамічне ціноутворення SkillZone. Чим більше граєш, тим дешевше.'
        },
        history: {
            title: 'Історія | SkillZone Gaming Club',
            description: '20 років ігрової історії. Від 10 ПК до мережі клубів у Празі.'
        },
        booking: {
            title: 'Бронювання | SkillZone Gaming Club',
            description: 'Забронюй місце в SkillZone. LAN party, день народження, тімбілдинг.'
        },
        services: {
            title: 'Послуги | SkillZone Gaming Club',
            description: 'Оренда техніки, стрім-продакшн, заходи під ключ.'
        },
        gift: {
            title: 'Подарункові сертифікати | SkillZone Gaming Club',
            description: 'Купи кредит SkillZone у подарунок. Кредит ніколи не згорає.'
        },
        poukaz: {
            title: 'Активувати сертифікат | SkillZone Gaming Club',
            description: 'Є промо-сертифікат SkillZone? Приходь, назви пароль і грай 2 години безкоштовно!'
        },
        gallery: {
            title: 'Галерея | SkillZone Gaming Club',
            description: 'Фотогалерея ігрових клубів SkillZone. Атмосфера, залізо, турніри, ком\'юніті.'
        },
        map: {
            title: 'Карта філіалів | SkillZone Gaming Club',
            description: 'Інтерактивна карта всіх ігрових клубів SkillZone у Празі. Жижков, Гає, Стодулки.'
        },
        arena: {
            title: 'Ігрова Арена Прага | SkillZone',
            description: 'Шукаєте найкращу ігрову арену в Празі? SkillZone пропонує 3 клуби по всьому місту з топовим залізом.'
        },
        mvp: {
            title: 'MVP Кіберспорт | SkillZone Прага',
            description: 'Стань MVP з кіберспортивним обладнанням у SkillZone. ПК RTX 4070 Ti, 240Hz монітори.'
        },
        cybersport: {
            title: 'Кіберспорт і Буткемп | SkillZone Прага',
            description: 'Центр кіберспорту в Празі. Забронюй приватний Буткемп для команди і грай без перешкод.'
        }
    }
};

/**
 * Hook that dynamically updates document.title and meta description
 * based on the current view and language.
 */
export function usePageMeta(view: AppView, language: string) {
    useEffect(() => {
        const lang = (language as Language) || 'cs';
        const meta = PAGE_META[lang]?.[view] || PAGE_META['cs'][view];
        if (!meta) return;

        document.title = meta.title;

        const descTag = document.querySelector('meta[name="description"]');
        if (descTag) descTag.setAttribute('content', meta.description);

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', meta.title);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', meta.description);

        // Dynamically update Canonical URL for SEO (Critical for SPAs)
        const baseUrl = 'https://skillzone.cz';
        const currentUrl = view === 'home' ? baseUrl : `${baseUrl}/${view}`;

        let canonicalTag = document.querySelector('link[rel="canonical"]');
        if (!canonicalTag) {
            canonicalTag = document.createElement('link');
            canonicalTag.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalTag);
        }
        canonicalTag.setAttribute('href', currentUrl);

        let ogUrlTag = document.querySelector('meta[property="og:url"]');
        if (!ogUrlTag) {
            ogUrlTag = document.createElement('meta');
            ogUrlTag.setAttribute('property', 'og:url');
            document.head.appendChild(ogUrlTag);
        }
        ogUrlTag.setAttribute('content', currentUrl);

        document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
    }, [view, language]);
}
