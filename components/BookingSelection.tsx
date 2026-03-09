
import React, { useState } from 'react';
import { User, Users, Beer, Briefcase, ArrowRight, ChevronLeft, MapPin, Phone, MessageCircle, Clock, CheckCircle2, Loader2, Send, Building2 } from 'lucide-react';
import { AppView } from '../types';
import { useAppContext } from '../context/AppContext';

interface BookingSelectionProps {
    onChangeView: (view: AppView) => void;
}

// ─── Branch data for individual visitors ────────────────────────────

const BRANCHES = [
    {
        id: 'zizkov',
        name: 'SkillZone Žižkov',
        address: 'Orebitská 630/4, Praha 3',
        phone: '777 766 113',
        hours: 'NONSTOP 24/7',
        metro: '🚇 Želivského / Flora',
        maps: 'https://share.google/1sTUyG7cfbPHZSNce',
        color: 'border-red-500/40 bg-red-500/5',
        features: ['29 PC', '240Hz Monitory', 'VIP zóna', '10Gbps Internet'],
    },
    {
        id: 'haje',
        name: 'SkillZone Háje',
        address: 'Arkalycká 877/4, Praha 4',
        phone: '777 766 114',
        hours: '12:00 – 00:00 (s hráči až do 03:00)',
        metro: '🚇 Háje',
        maps: 'https://share.google/XBcvMnkhHHB3eL13P',
        color: 'border-blue-500/40 bg-blue-500/5',
        features: ['27 PC', '240Hz & 380Hz', 'Konzole', 'VIP Zóna'],
    },
    {
        id: 'stodulky',
        name: 'SkillZone Stodůlky',
        address: 'Mukařovského 1986/7, Praha 5',
        phone: '777 766 115',
        hours: '13:00 – 21:00 (s hráči až do 23:00)',
        metro: '🚇 Stodůlky',
        maps: 'https://share.google/Bm7VrkmwoRSA3TwVI',
        color: 'border-green-500/40 bg-green-500/5',
        features: ['RTX 40 Series', 'Next-Gen PC', 'Nový prostor'],
    },
];

// ─── B2B Inquiry Form Component ─────────────────────────────────────

const B2BInquiryForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [form, setForm] = useState({
        companyName: '', contactName: '', email: '', phone: '',
        eventType: '', peopleCount: '', preferredDate: '', message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!form.contactName || !form.phone) return;
        setIsSubmitting(true);
        // Simulate submission (in real implementation, this would POST to Supabase)
        await new Promise(r => setTimeout(r, 1500));
        setIsSubmitting(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="pt-32 pb-24 px-4 min-h-screen bg-light-bg dark:bg-dark-bg relative overflow-hidden flex flex-col items-center justify-center">
                <div className="max-w-xl text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-orbitron font-bold text-gray-900 dark:text-white uppercase">Poptávka odeslána!</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-mono leading-relaxed">
                        Děkujeme, <strong className="text-gray-900 dark:text-white">{form.contactName}</strong>! Vaši poptávku jsme přijali a obvykle se ozýváme do 24 hodin.
                        Pokud je to urgentní, klidně zavolejte na{' '}
                        <a href="tel:+420777766112" className="text-sz-red hover:underline font-bold">777 766 112</a> a vyřešíme to ihned.
                    </p>
                    <button onClick={onBack} className="mt-4 bg-transparent border border-sz-red text-sz-red px-8 py-3 rounded-sm font-orbitron font-bold uppercase tracking-wider hover:bg-sz-red hover:text-white transition-colors">
                        Zpět
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-24 px-4 min-h-screen bg-light-bg dark:bg-dark-bg relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none dark:block hidden"></div>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-3xl w-full relative z-10">
                <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-sz-red transition-colors font-mono text-sm uppercase tracking-widest">
                    <ChevronLeft className="w-4 h-4" /> Zpět na výběr
                </button>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4 border border-blue-500/20">
                        <Briefcase className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-orbitron font-black uppercase tracking-tight mb-4 text-gray-900 dark:text-white">
                        Firemní <span className="text-blue-400">Akce</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                        Teambuilding, firemní turnaj, večírek nebo konference s herním zážitkem? Vyplňte poptávku a my se vám ozveneme do 24 hodin s nabídkou na míru.
                    </p>
                </div>

                <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-6 md:p-8 space-y-6">
                        {/* Company + Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-mono text-gray-500 uppercase">Název firmy</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                                        placeholder="SkillZone s.r.o." className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-400 outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-mono text-gray-500 uppercase">Kontaktní osoba *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                                        placeholder="Jan Novák" className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-400 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Phone + Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-mono text-gray-500 uppercase">Telefon *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder="+420 777 123 456" className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-400 outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-mono text-gray-500 uppercase">E-mail</label>
                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="jan@firma.cz" className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-400 outline-none" />
                            </div>
                        </div>

                        {/* Event details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-mono text-gray-500 uppercase">Typ akce</label>
                                <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-400 outline-none cursor-pointer">
                                    <option value="">Vyberte...</option>
                                    <option value="teambuilding">Teambuilding</option>
                                    <option value="turnaj">Firemní turnaj</option>
                                    <option value="vecirek">Firemní večírek</option>
                                    <option value="konference">Konference / Školení</option>
                                    <option value="aktivita">Doprovodná aktivita</option>
                                    <option value="jine">Jiné</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-mono text-gray-500 uppercase">Počet lidí (odhad)</label>
                                <input type="text" value={form.peopleCount} onChange={e => setForm(f => ({ ...f, peopleCount: e.target.value }))}
                                    placeholder="20-30" className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-400 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-mono text-gray-500 uppercase">Preferovaný termín</label>
                                <input type="date" value={form.preferredDate} onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))}
                                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-400 outline-none cursor-pointer" />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="block text-xs font-mono text-gray-500 uppercase">Zpráva / Požadavky</label>
                            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                                placeholder="Popište nám vaši představu — catering, program, speciální požadavky..."
                                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-400 outline-none resize-none" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 md:p-8 bg-gray-50 dark:bg-black/60 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm font-mono text-gray-500 text-center sm:text-left space-y-1">
                            <p>Obvykle odpovídáme <strong className="text-gray-900 dark:text-white">do 24 hodin</strong>.</p>
                            <p>Urgentní? Zavolejte na <a href="tel:+420777766112" className="text-sz-red font-bold hover:underline">777 766 112</a> a řešíme ihned.</p>
                        </div>
                        <button onClick={handleSubmit} disabled={isSubmitting || !form.contactName || !form.phone}
                            className="w-full sm:w-auto px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-sm font-orbitron font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Odesílám...</> : <><Send className="w-4 h-4" /> Odeslat poptávku</>}
                        </button>
                    </div>
                </div>

                {/* WhatsApp alternative */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm font-mono mb-3">Nebo nás rovnou kontaktujte:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <a href="tel:+420777766112" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 hover:border-sz-red hover:text-sz-red transition-colors text-sm font-mono">
                            <Phone className="w-4 h-4" /> 777 766 112
                        </a>
                        <a href="https://wa.me/420777766112?text=Dobrý%20den%2C%20mám%20zájem%20o%20firemní%20akci%20u%20SkillZone." target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors text-sm font-mono">
                            <MessageCircle className="w-4 h-4" /> WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Solo Visitor Branch Picker ─────────────────────────────────────

const SoloBranchPicker: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="pt-32 pb-24 px-4 min-h-screen bg-light-bg dark:bg-dark-bg relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none dark:block hidden"></div>

            <div className="max-w-4xl w-full relative z-10">
                <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-sz-red transition-colors font-mono text-sm uppercase tracking-widest">
                    <ChevronLeft className="w-4 h-4" /> Zpět na výběr
                </button>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-zinc-800 rounded-full mb-4 border border-gray-200 dark:border-white/10">
                        <User className="w-8 h-8 text-gray-700 dark:text-white" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-orbitron font-black uppercase tracking-tight mb-4 text-gray-900 dark:text-white">
                        Vyber si <span className="text-sz-red">pobočku</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                        Jako jednotlivec se můžeš přijít zapařit kdykoliv — žádná registrace ani rezervace není potřeba, ale doporučujeme ji. Zavolej na pobočku a ověř si volná místa.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {BRANCHES.map((branch, idx) => (
                        <div key={branch.id}
                            className={`group bg-white dark:bg-black/40 border ${branch.color} rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8`}
                            style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'backwards' }}
                        >
                            <div className="p-6 space-y-4">
                                <h3 className="text-lg font-orbitron font-bold text-gray-900 dark:text-white uppercase">{branch.name}</h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                                        <span>{branch.address}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                        <Clock className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                                        <span className="font-mono text-xs">{branch.hours}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">{branch.metro}</div>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {branch.features.map(f => (
                                        <span key={f} className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-sm">{f}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-black/30 space-y-2">
                                <a href={`tel:+420${branch.phone.replace(/\s/g, '')}`}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-sz-red hover:bg-sz-red-dark text-white rounded-sm font-orbitron font-bold text-xs uppercase tracking-wider transition-colors">
                                    <Phone className="w-4 h-4" /> {branch.phone}
                                </a>
                                <a href={`https://wa.me/420${branch.phone.replace(/\s/g, '')}?text=${encodeURIComponent('Ahoj, je u vás volné nějaké PC?')}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-green-500/20">
                                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-mono">
                        💡 <strong className="text-gray-900 dark:text-white">Tip:</strong> Registrace ani rezervace není povinná — ale doporučujeme ji.
                        Zavolej na pobočku, řekni na kolik hodin a máš místo jisté. Walk-in samozřejmě taky jde, záleží na obsazenosti.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── Main Booking Selection ─────────────────────────────────────────

const BookingSelection: React.FC<BookingSelectionProps> = ({ onChangeView }) => {
    const [activePanel, setActivePanel] = useState<'none' | 'solo' | 'b2b'>('none');
    const { t } = useAppContext();

    if (activePanel === 'solo') {
        return <SoloBranchPicker onBack={() => setActivePanel('none')} />;
    }

    if (activePanel === 'b2b') {
        return <B2BInquiryForm onBack={() => setActivePanel('none')} />;
    }

  const options = [
    {
        id: 'solo',
        icon: <User className="w-10 h-10 text-white" />,
        title: "JEDNOTLIVEC / DUO",
        subtitle: "1 až 4 lidé",
        description: "Jdeš si zapařit sám nebo s pár kámoši? Žádná rezervace. Přijdeš, sedneš, hraješ. Na všech pobočkách.",
        actionText: "Pobočky a kontakty",
        onClick: () => setActivePanel('solo'),
        color: "border-zinc-700 hover:border-white",
        bg: "bg-zinc-900/50"
    },
    {
        id: 'party',
        icon: <Users className="w-10 h-10 text-sz-red" />,
        title: "PARTA / LANKA",
        subtitle: "5 a více lidí",
        description: "Jste větší skupina (5+)? Rezervujte si soukromý prostor, vlastní pípu a celou řadu PC. Bootcamp nebo celou hernu.",
        actionText: "Vyplnit poptávku",
        onClick: () => onChangeView('rentals'),
        color: "border-sz-red/30 hover:border-sz-red",
        bg: "bg-zinc-900/80"
    },
    {
        id: 'private',
        icon: <Beer className="w-10 h-10 text-yellow-500" />,
        title: "ROZLUČKA / SOUKROMÍ",
        subtitle: "5 až 14 lidí",
        description: "Ideální pro 5-14 lidí. Private Bootcamp s vlastním vchodem, WC a pípou. Bachelor party, narozeniny nebo prostě klid od random kidů.",
        actionText: "Vyplnit poptávku",
        onClick: () => onChangeView('rentals'),
        color: "border-yellow-500/30 hover:border-yellow-500",
        bg: "bg-zinc-900/80"
    },
    {
        id: 'b2b',
        icon: <Briefcase className="w-10 h-10 text-blue-400" />,
        title: "FIREMNÍ AKCE",
        subtitle: "5 až 50+ lidí",
        description: "Teambuilding, turnaj nebo večírek? Zvládneme malé týmy i velké firmy do 50 lidí. Catering, moderování, technika — vše na klíč.",
        actionText: "Poptávkový formulář",
        onClick: () => setActivePanel('b2b'),
        color: "border-blue-500/30 hover:border-blue-400",
        bg: "bg-zinc-900/50"
    }
  ];

  return (
    <section className="pt-32 pb-24 px-4 min-h-screen bg-dark-bg relative overflow-hidden flex flex-col items-center">
        
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sz-red/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl w-full relative z-10">
            <button 
                onClick={() => onChangeView('home')}
                className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-mono text-sm uppercase tracking-widest"
            >
                <ChevronLeft className="w-4 h-4" /> {t('book_back')}
            </button>

            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-7xl font-orbitron font-black uppercase tracking-tight mb-4">
                    {t('book_mission')} <span className="text-sz-red text-glow">{t('book_mission_sub')}</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    {t('book_desc')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {options.map((opt, index) => (
                    <div 
                        key={opt.id}
                        onClick={opt.onClick}
                        className={`group relative p-8 border ${opt.color} ${opt.bg} rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left animate-in fade-in slide-in-from-bottom-8`}
                        style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
                    >
                        <div className="p-4 bg-black/50 rounded-full border border-white/5 group-hover:scale-110 transition-transform duration-300">
                            {opt.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-orbitron font-bold text-white mb-1 group-hover:text-sz-red transition-colors">{opt.title}</h3>
                            <p className="text-sz-red font-mono text-xs uppercase tracking-widest mb-3">{opt.subtitle}</p>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">{opt.description}</p>
                            
                            <span className="inline-flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide group-hover:translate-x-2 transition-transform">
                                {opt.actionText} <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 text-center animate-in fade-in delay-500 duration-700">
                <p className="text-gray-500 text-sm font-mono">
                    Nevíš si rady? <a href="tel:+420777766112" className="text-sz-red hover:underline">Zavolej na 777 766 112</a> a my tě nasměrujem.
                </p>
            </div>
        </div>
    </section>
  );
};

export default BookingSelection;
