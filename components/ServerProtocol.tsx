
import React, { useState, useEffect } from 'react';
import { ChevronDown, Shield, Utensils, Cpu, UserX, CreditCard, Lock, Unlock } from 'lucide-react';
import { PROTOCOL_DATA_CS, PROTOCOL_DATA_EN } from '../data/protocol';
import { getMergedProtocol } from '../utils/devTools';
import { useAppContext } from '../context/AppContext';
import { ProtocolRule } from '../types';
import { useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';

const ServerProtocol: React.FC = () => {
    const { language, t } = useAppContext();
    const [rules, setRules] = useState<ProtocolRule[]>([]);
    const [openId, setOpenId] = useState<string | null>(null);
    const headingRef = useScrollReveal<HTMLDivElement>();
    const rulesRef = useStaggerReveal<HTMLDivElement>({ staggerDelay: 80 });

    useEffect(() => {
        const baseData = language === 'cs' ? PROTOCOL_DATA_CS : PROTOCOL_DATA_EN;
        getMergedProtocol(baseData).then(setRules);
    }, [language]);

    const toggleRule = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'utensils': return <Utensils className="w-5 h-5" />;
            case 'cpu': return <Cpu className="w-5 h-5" />;
            case 'user-x': return <UserX className="w-5 h-5" />;
            case 'credit-card': return <CreditCard className="w-5 h-5" />;
            default: return <Shield className="w-5 h-5" />;
        }
    };

    return (
        <section className="py-20 bg-zinc-900 border-t border-sz-red/20 relative overflow-hidden">
            {/* Background Tech Elements */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-gradient-to-b from-transparent via-sz-red to-transparent opacity-30"></div>

            <div className="max-w-4xl mx-auto px-4 relative z-10">
                <div ref={headingRef} className="scroll-reveal sr-glitch text-center mb-12">
                    <div className="inline-flex items-center gap-2 text-sz-red font-mono text-sm uppercase tracking-widest mb-2 border border-sz-red/30 px-3 py-1 rounded bg-black/50">
                        <Shield className="w-4 h-4" />
                        {t('protocol_status')}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-orbitron font-black text-white uppercase tracking-tight">
                        {t('protocol_title')} <span className="text-sz-red text-glow">{t('protocol_title_sub')}</span>
                    </h2>
                </div>

                <div ref={rulesRef} className="sr-stagger scroll-reveal grid gap-4">
                    {rules.map((rule) => {
                        const isOpen = openId === rule.id;
                        return (
                            <div
                                key={rule.id}
                                className={`bg-black/40 border transition-all duration-300 overflow-hidden group ${isOpen ? 'border-sz-red shadow-[0_0_20px_rgba(227,30,36,0.15)] bg-black/60' : 'border-white/10 hover:border-white/30'}`}
                            >
                                <button
                                    onClick={() => toggleRule(rule.id)}
                                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded bg-zinc-800 transition-colors ${isOpen ? 'text-sz-red' : 'text-gray-400 group-hover:text-white'}`}>
                                            {getIcon(rule.icon)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-orbitron font-bold uppercase transition-colors text-lg ${isOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                {rule.title}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                                                SECTOR: {rule.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold uppercase hidden sm:block ${isOpen ? 'text-sz-red' : 'text-gray-600'}`}>
                                            {isOpen ? 'ACCESS GRANTED' : 'LOCKED'}
                                        </span>
                                        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                            {isOpen ? <Unlock className="w-5 h-5 text-sz-red" /> : <Lock className="w-5 h-5 text-gray-500" />}
                                        </div>
                                    </div>
                                </button>

                                <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-5 pt-0 pl-[4.5rem] text-gray-400 font-mono text-sm space-y-2 border-t border-white/5 mt-2 pt-4">
                                        {rule.content.map((line, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <span className="text-sz-red mt-1">›</span>
                                                <p>{line}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-12">
                    <p className="text-gray-500 text-xs font-mono max-w-lg mx-auto">
                        {t('protocol_footer')}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ServerProtocol;
