
import React from 'react';
import { ChevronLeft, Ticket, MapPin, Phone, Clock, Users, CreditCard, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AppView } from '../types';

interface VoucherRedeemPageProps {
    onChangeView: (view: AppView) => void;
}

const VoucherRedeemPage: React.FC<VoucherRedeemPageProps> = ({ onChangeView }) => {
    const { language } = useAppContext();
    const cs = language === 'cs';

    const steps = [
        {
            number: '01',
            icon: <MapPin className="w-6 h-6 text-sz-red" />,
            title: cs ? 'Přijď do SkillZone' : 'Visit SkillZone',
            desc: cs
                ? 'Zastav se na jedné z našich poboček — Žižkov, Háje nebo Stodůlky.'
                : 'Stop by one of our locations — Žižkov, Háje, or Stodůlky.'
        },
        {
            number: '02',
            icon: <Ticket className="w-6 h-6 text-sz-red" />,
            title: cs ? 'Řekni heslo na baru' : 'Tell the password at the bar',
            desc: cs
                ? 'Nemusíš brát letáček. Stačí na baru říct heslo „POUKAZ" a obsluha ti vše vyřídí.'
                : 'No need to bring the flyer. Just say "POUKAZ" at the bar and the staff will handle everything.'
        },
        {
            number: '03',
            icon: <CreditCard className="w-6 h-6 text-sz-red" />,
            title: cs ? 'Registruj se zdarma' : 'Register for free',
            desc: cs
                ? 'Registrace je rychlá, zvládneš ji za pár minut. Stačí mít u sebe mobil. Registrace je zcela zdarma.'
                : 'Registration is quick, takes just a few minutes. All you need is your phone. Registration is completely free.'
        },
        {
            number: '04',
            icon: <Sparkles className="w-6 h-6 text-sz-red" />,
            title: cs ? 'Hraj zdarma 2 hodiny' : 'Play for free for 2 hours',
            desc: cs
                ? 'Vyber si ze stovky her a vyzkoušej naše služby na 2 hodiny zdarma. Můžeš vzít i kámoše!'
                : 'Choose from hundreds of games and try our services for 2 hours free. You can even bring a friend!'
        }
    ];

    const details = [
        {
            icon: <Clock className="w-5 h-5 text-sz-red" />,
            title: cs ? 'Kdy můžu přijít?' : 'When can I come?',
            text: cs
                ? 'Poukázku je možné aktivovat v týdnu od pondělí do čtvrtka, od 8:00 do 18:00.'
                : 'The voucher can be activated Monday to Thursday, from 8:00 AM to 6:00 PM.'
        },
        {
            icon: <Users className="w-5 h-5 text-sz-red" />,
            title: cs ? 'Pro koho platí?' : 'Who is it for?',
            text: cs
                ? 'Poukázka platí pro nové hráče, kteří se u nás registrují poprvé. Můžeš ji využít i pro více osob.'
                : 'The voucher is for new players registering for the first time. You can use it for multiple people.'
        },
        {
            icon: <CheckCircle className="w-5 h-5 text-sz-red" />,
            title: cs ? 'Rozděl si návštěvy' : 'Split your visits',
            text: cs
                ? 'Výhodou je, že si poukázku můžeš rozdělit na více návštěv — nemusíš vše využít najednou.'
                : 'You can split the voucher across multiple visits — no need to use it all at once.'
        }
    ];

    const locations = [
        {
            name: 'Praha 3 — Žižkov',
            phone: '777 766 113',
            link: 'https://g.page/SkillZone-Nonstop?share'
        },
        {
            name: 'Praha 4 — Háje',
            phone: '777 766 114',
            link: 'https://skillzone.cz/provozovny/haje/'
        },
        {
            name: 'Praha 13 — Stodůlky',
            phone: '777 766 115',
            link: 'https://maps.google.com'
        }
    ];

    return (
        <section className="min-h-screen pt-32 pb-24 px-4 bg-dark-bg relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-motherboard opacity-5 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-red-glow opacity-20 pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Back button */}
                <button
                    onClick={() => onChangeView('home')}
                    className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-mono text-sm uppercase tracking-widest group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {cs ? 'Zpět na hlavní' : 'Back to main'}
                </button>

                {/* Header */}
                <div className="mb-16 animate-in fade-in">
                    <div className="inline-flex items-center gap-2 bg-sz-red/10 border border-sz-red/30 px-3 py-1 rounded-sm mb-6">
                        <Ticket className="w-4 h-4 text-sz-red" />
                        <span className="text-sz-red font-mono text-xs font-bold tracking-widest uppercase">VOUCHER_REDEEM_PROTOCOL</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-orbitron font-black text-white uppercase leading-none mb-6">
                        {cs ? <>Poukázka do<br /><span className="text-sz-red">SkillZone</span></> : <>Voucher for<br /><span className="text-sz-red">SkillZone</span></>}
                    </h1>

                    <p className="text-xl text-gray-300 font-bold mb-4 max-w-2xl">
                        {cs
                            ? 'Gratulujeme! Získal jsi poukázku na 2 hodiny hraní zdarma pro nové hráče.'
                            : 'Congratulations! You\'ve received a free 2-hour gaming voucher for new players.'}
                    </p>

                    <p className="text-gray-500 leading-relaxed max-w-2xl">
                        {cs
                            ? 'Stačí přijít do jednoho z našich herních klubů, říct heslo „POUKAZ" na baru a užít si stovky her na prémiových herních stanicích.'
                            : 'Simply visit one of our gaming clubs, say the password "POUKAZ" at the bar, and enjoy hundreds of games on premium gaming stations.'}
                    </p>
                </div>

                {/* Steps */}
                <div className="mb-16">
                    <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">
                        {cs ? 'Jak na to — 4 jednoduché kroky' : 'How it works — 4 simple steps'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {steps.map((step, i) => (
                            <div key={i} className="relative bg-zinc-900/60 border border-white/5 p-6 rounded-sm hover:border-sz-red/30 transition-all group">
                                <div className="absolute top-4 right-4 text-4xl font-orbitron font-black text-white/5 group-hover:text-sz-red/10 transition-colors">
                                    {step.number}
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-sz-red/10 border border-sz-red/30 flex items-center justify-center rounded-sm">
                                        {step.icon}
                                    </div>
                                    <h3 className="text-white font-orbitron font-bold text-sm uppercase tracking-wide">{step.title}</h3>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Password highlight */}
                <div className="mb-16 text-center">
                    <div className="inline-block bg-zinc-900/80 border-2 border-sz-red/50 p-8 rounded-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-motherboard opacity-10"></div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-sz-red shadow-[0_0_15px_#E31E24]"></div>
                        <div className="relative z-10">
                            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-3">
                                {cs ? 'Heslo pro aktivaci' : 'Activation password'}
                            </p>
                            <div className="text-5xl md:text-7xl font-orbitron font-black text-sz-red tracking-wider text-glow">
                                POUKAZ
                            </div>
                            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-4">
                                {cs ? 'Řekni toto heslo na baru při registraci' : 'Tell this password at the bar during registration'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Details grid */}
                <div className="mb-16">
                    <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">
                        {cs ? 'Důležité informace' : 'Important information'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {details.map((detail, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 p-5 rounded-sm backdrop-blur-sm hover:border-sz-red/20 transition-colors">
                                <div className="flex items-center gap-2 mb-3">
                                    {detail.icon}
                                    <h3 className="text-white font-bold text-sm uppercase">{detail.title}</h3>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed">{detail.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Locations */}
                <div className="mb-16">
                    <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">
                        {cs ? 'Kde nás najdeš' : 'Where to find us'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {locations.map((loc, i) => (
                            <a
                                key={i}
                                href={loc.link}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-zinc-900/60 border border-white/5 p-5 rounded-sm hover:border-sz-red/30 transition-all group block"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-sz-red" />
                                    <span className="text-white font-orbitron font-bold text-sm tracking-wide">{loc.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Phone className="w-3 h-3" />
                                    <span className="font-mono">{loc.phone}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* CTA: want to stay longer? */}
                <div className="text-center bg-zinc-900/40 border border-white/5 p-8 rounded-sm">
                    <h3 className="text-white font-orbitron font-bold text-lg uppercase mb-3">
                        {cs ? 'Chceš zůstat déle?' : 'Want to stay longer?'}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-lg mx-auto text-sm">
                        {cs
                            ? 'Po vyzkoušení volných 2 hodin se můžeš podívat na náš ceník a pokračovat v hraní. Jestli vás půjde víc, zavolej předem a rezervujeme ti místo.'
                            : 'After your free 2 hours, check out our pricing and keep playing. If you\'re coming in a group, call ahead and we\'ll reserve a spot.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => onChangeView('pricing')}
                            className="px-8 py-4 bg-sz-red hover:bg-white hover:text-black text-white font-black font-orbitron text-sm transition-all flex items-center justify-center gap-2 clip-angle tracking-widest shadow-[0_0_20px_rgba(227,30,36,0.3)] group"
                        >
                            {cs ? 'Ceník' : 'Pricing'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => onChangeView('booking')}
                            className="px-8 py-4 bg-transparent border-2 border-white/20 hover:border-sz-red text-white font-bold font-orbitron text-sm transition-all flex items-center justify-center gap-2 tracking-widest"
                        >
                            {cs ? 'Rezervovat' : 'Book'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VoucherRedeemPage;
