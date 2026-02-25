
import React from 'react';
import { User, Users, Beer, Briefcase, ArrowRight, ChevronLeft } from 'lucide-react';
import { AppView } from '../types';

interface BookingSelectionProps {
    onChangeView: (view: AppView) => void;
}

const BookingSelection: React.FC<BookingSelectionProps> = ({ onChangeView }) => {

  const options = [
    {
        id: 'solo',
        icon: <User className="w-10 h-10 text-white" />,
        title: "JEDNOTLIVEC / DUO",
        subtitle: "1 až 4 lidé",
        description: "Jdeš si zapařit sám nebo s pár kámoši? Standardní rezervace PC v našich veřejných zónách (Žižkov/Háje).",
        actionText: "Rezervovat místo",
        onClick: () => window.open('https://skillzone.cz/rezervace', '_blank'),
        color: "border-zinc-700 hover:border-white",
        bg: "bg-zinc-900/50"
    },
    {
        id: 'party',
        icon: <Users className="w-10 h-10 text-sz-red" />,
        title: "PARTA / LANKA",
        subtitle: "5 a více lidí",
        description: "Jste větší skupina (5+)? Rezervujte si celou řadu počítačů vedle sebe, ať na sebe můžete řvát přes stůl.",
        actionText: "Mrknout na prostory",
        onClick: () => {
             onChangeView('locations');
             setTimeout(() => {
                 document.getElementById('haje')?.scrollIntoView({ behavior: 'smooth' });
             }, 100);
        },
        color: "border-sz-red/30 hover:border-sz-red",
        bg: "bg-zinc-900/80"
    },
    {
        id: 'private',
        icon: <Beer className="w-10 h-10 text-yellow-500" />,
        title: "ROZLUČKA / SOUKROMÍ",
        subtitle: "5 až 14 lidí",
        description: "Ideální pro 5-14 lidí. Private Bootcamp s pípou. Bachelor party, narozeniny nebo prostě jen chcete klid od 'random kidů'.",
        actionText: "Zobrazit nabídku",
        onClick: () => {
            onChangeView('pricing');
            setTimeout(() => {
                window.scrollTo(0, 0); 
            }, 100);
        },
        color: "border-yellow-500/30 hover:border-yellow-500",
        bg: "bg-zinc-900/80"
    },
    {
        id: 'b2b',
        icon: <Briefcase className="w-10 h-10 text-blue-400" />,
        title: "FIREMNÍ AKCE",
        subtitle: "5 až 50+ lidí",
        description: "Teambuilding, turnaj nebo večírek? Zvládneme malé týmy i velké firmy do 50 lidí. Catering, moderování, technika.",
        actionText: "Nabídka spolupráce",
        onClick: () => {
             onChangeView('services');
        },
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
                <ChevronLeft className="w-4 h-4" /> Zpět na hlavní
            </button>

            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-7xl font-orbitron font-black uppercase tracking-tight mb-4">
                    Jaká je tvoje <span className="text-sz-red text-glow">mise?</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Vyber si svůj styl. Ať už jdeš sám na rankedy, nebo s celou firmou na teambuilding, máme pro tebe slot.
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
                    Nevíš si rady? <a href="tel:777766113" className="text-sz-red hover:underline">Zavolej na bar</a> a my tě nasměrujem.
                </p>
            </div>
        </div>
    </section>
  );
};

export default BookingSelection;
