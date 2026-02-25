
import React, { useState } from 'react';
import { Gift, Mail, Store, Truck, Clock, ShieldCheck, ArrowRight, ChevronLeft, CreditCard, Info, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AppView } from '../types';

interface VoucherPageProps {
    onChangeView: (view: AppView) => void;
}

const VoucherPage: React.FC<VoucherPageProps> = ({ onChangeView }) => {
    const { t, language } = useAppContext();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

    const voucherTiers = [
        { amount: 200, label: 'STARTER', color: 'text-zinc-400' },
        { amount: 500, label: 'PLAYER', color: 'text-orange-500' },
        { amount: 1000, label: 'GAMER', color: 'text-gray-300' },
        { amount: 2000, label: 'PRO', color: 'text-yellow-500' },
        { amount: 5000, label: 'ELITE', color: 'text-sz-red' }
    ];

    const benefits = [
        { icon: <MapPin className="w-5 h-5 text-sz-red" />, text: t('gift_b1') },
        { icon: <CreditCard className="w-5 h-5 text-sz-red" />, text: t('gift_b2') },
        { icon: <ShieldCheck className="w-5 h-5 text-sz-red" />, text: t('gift_b3') },
        { icon: <Truck className="w-5 h-5 text-sz-red" />, text: t('gift_b4') }
    ];

    const deliveryOptions = [
        { 
            icon: <Mail className="w-6 h-6 text-sz-red" />, 
            title: language === 'cs' ? 'Elektronicky (PDF)' : 'Electronic (PDF)',
            desc: language === 'cs' ? 'Poukaz obdržíte ihned do e-mailu připravený k tisku.' : 'Receive the voucher immediately in your email, ready to print.'
        },
        { 
            icon: <Store className="w-6 h-6 text-sz-red" />, 
            title: language === 'cs' ? 'Osobně v klubu' : 'In-Person at Club',
            desc: language === 'cs' ? 'Vyzvedněte si tištěnou kartu zdarma na baru jakékoliv pobočky.' : 'Pick up a physical printed card for free at any club bar.'
        },
        { 
            icon: <Truck className="w-6 h-6 text-sz-red" />, 
            title: language === 'cs' ? 'Zásilkovna' : 'Zásilkovna Delivery',
            desc: language === 'cs' ? 'Zašleme vám fyzický poukaz na vybrané výdejní místo.' : 'We will send a physical voucher to your chosen pickup point.'
        }
    ];

    return (
        <section className="min-h-screen pt-32 pb-24 px-4 bg-dark-bg relative overflow-hidden flex flex-col items-center">
            {/* Background Tech Effects */}
            <div className="absolute inset-0 bg-motherboard opacity-5 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-red-glow opacity-30 pointer-events-none"></div>
            
            <div className="max-w-6xl w-full relative z-10">
                <button 
                    onClick={() => onChangeView('home')}
                    className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-mono text-sm uppercase tracking-widest group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('book_back')}
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left Side: Info */}
                    <div className="animate-in fade-in slide-in-from-left duration-700">
                        <div className="inline-flex items-center gap-2 bg-sz-red/10 border border-sz-red/30 px-3 py-1 rounded-sm mb-6">
                            <Gift className="w-4 h-4 text-sz-red" />
                            <span className="text-sz-red font-mono text-xs font-bold tracking-widest uppercase">GIFT_SYSTEM_ONLINE</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-orbitron font-black text-white uppercase leading-none mb-6">
                            {t('gift_title')}
                        </h1>
                        
                        <p className="text-xl text-gray-300 font-bold mb-4">
                            {t('gift_subtitle')}
                        </p>
                        
                        <p className="text-gray-500 mb-10 leading-relaxed max-w-lg">
                            {t('gift_desc')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            {benefits.map((b, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-sm border border-white/5 backdrop-blur-sm group hover:border-sz-red/30 transition-colors">
                                    <div className="shrink-0">{b.icon}</div>
                                    <span className="text-gray-300 font-mono text-[11px] font-bold leading-tight uppercase">{b.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Delivery Options */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-[0.3em] mb-4">MOŽNOSTI DORUČENÍ:</h4>
                            <div className="space-y-4">
                                {deliveryOptions.map((opt, i) => (
                                    <div key={i} className="flex gap-4 p-4 border border-white/5 bg-black/40 rounded-sm hover:border-sz-red/20 transition-all">
                                        <div className="mt-1">{opt.icon}</div>
                                        <div>
                                            <div className="text-white font-bold text-sm uppercase font-orbitron tracking-wide">{opt.title}</div>
                                            <div className="text-gray-500 text-xs mt-1">{opt.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Visual & Selector */}
                    <div className="animate-in fade-in slide-in-from-right duration-700 lg:sticky lg:top-32">
                        {/* Interactive Voucher Visual */}
                        <div className="relative mb-8 transform hover:rotate-1 transition-transform cursor-pointer group">
                            <div className="absolute inset-0 bg-sz-red/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-gradient-to-br from-zinc-800 to-black border-2 border-sz-red/50 p-8 aspect-[16/9] rounded-xl flex flex-col justify-between relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-motherboard opacity-20"></div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-sz-red shadow-[0_0_15px_#E31E24]"></div>
                                
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-sz-red flex items-center justify-center rounded-lg shadow-lg">
                                        <Gift className="text-white w-7 h-7" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sz-red font-orbitron font-black text-2xl tracking-tighter italic">SKILLZONE</div>
                                        <div className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">Prague Gaming Network</div>
                                    </div>
                                </div>

                                <div className="my-6">
                                    <div className="text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-1 opacity-50">VALUE_CREDITS</div>
                                    <div className="text-5xl font-black font-orbitron text-white tracking-tighter">
                                        {selectedAmount ? `${selectedAmount} CZK` : '---- CZK'}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-5 bg-zinc-700 rounded-sm opacity-30"></div>
                                        <div className="w-8 h-5 bg-zinc-700 rounded-sm opacity-30"></div>
                                    </div>
                                    <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest font-bold">UNLIMITED_VALIDITY_PROTOCOL</span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Selector */}
                        <div className="space-y-6">
                            <h4 className="text-center font-bold font-orbitron text-sm uppercase text-gray-400 tracking-widest">{t('gift_selector')}</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {voucherTiers.map((tier) => (
                                    <button
                                        key={tier.amount}
                                        onClick={() => setSelectedAmount(tier.amount)}
                                        className={`p-3 border-2 rounded-sm transition-all flex flex-col items-center justify-center ${
                                            selectedAmount === tier.amount 
                                            ? `border-sz-red bg-white text-black` 
                                            : `border-white/5 bg-zinc-900/50 text-gray-400 hover:border-sz-red/50`
                                        }`}
                                    >
                                        <span className={`text-[9px] font-mono font-bold uppercase mb-1 ${selectedAmount === tier.amount ? 'text-black/50' : tier.color}`}>{tier.label}</span>
                                        <span className="text-lg font-black font-orbitron">{tier.amount}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSelectedAmount(null)}
                                    className={`p-3 border-2 rounded-sm transition-all flex flex-col items-center justify-center border-dashed border-zinc-700 text-gray-500 hover:border-white hover:text-white`}
                                >
                                    <span className="text-[9px] font-mono font-bold uppercase mb-1">CUSTOM</span>
                                    <span className="text-lg font-black font-orbitron">{language === 'cs' ? 'Jiný' : 'Other'}</span>
                                </button>
                            </div>

                            <a 
                                href="https://skillzone.cz/eshop" 
                                target="_blank"
                                rel="noreferrer"
                                className={`w-full py-5 bg-sz-red hover:bg-white hover:text-black text-white font-black font-orbitron text-lg transition-all flex items-center justify-center gap-3 clip-angle tracking-widest shadow-[0_0_20px_rgba(227,30,36,0.3)] group`}
                            >
                                <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                {t('gift_cta')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </a>

                            <div className="flex items-start gap-3 bg-white/5 p-4 border border-white/5 rounded">
                                <Info className="w-5 h-5 text-gray-400 shrink-0" />
                                <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                                    {language === 'cs' 
                                        ? 'Potřebujete poukaz na jinou částku nebo pro firmu? Kontaktujte nás na info@skillzone.cz a domluvíme se na individuálním řešení pro váš event.' 
                                        : 'Need a voucher for a different amount or for a company? Contact us at info@skillzone.cz for a custom solution for your event.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VoucherPage;
