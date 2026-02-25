import React, { useState, useEffect } from 'react';
import { Cookie, ChevronDown, ChevronUp, Shield, X } from 'lucide-react';

const CookieBanner: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [showLegal, setShowLegal] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('sz_cookie_consent');
        if (!consent) {
            // Small delay so it doesn't flash on load
            const t = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(t);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('sz_cookie_consent', 'accepted');
        localStorage.setItem('sz_cookie_consent_date', new Date().toISOString());
        setVisible(false);
    };

    const decline = () => {
        localStorage.setItem('sz_cookie_consent', 'declined');
        localStorage.setItem('sz_cookie_consent_date', new Date().toISOString());
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[99999] pointer-events-none animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto px-4 pb-4 pointer-events-auto">
                <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-6 relative overflow-hidden">
                    {/* Decorative scan line */}
                    <div className="absolute inset-0 bg-gradient-to-b from-sz-red/5 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sz-red/50 to-transparent" />

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-sz-red/10 border border-sz-red/30 rounded-lg flex items-center justify-center">
                                    <Cookie className="w-5 h-5 text-sz-red" />
                                </div>
                                <div>
                                    <h3 className="text-white font-orbitron font-bold text-sm uppercase tracking-wider">
                                        🍪 Cookies? Nejsme pekárna, ale...
                                    </h3>
                                    <p className="text-gray-400 text-xs font-mono mt-1">
                                        Používáme cookies, aby ti web šlapal jak RTX na ultra.
                                    </p>
                                </div>
                            </div>
                            <button onClick={decline} className="text-gray-500 hover:text-white transition-colors p-1" title="Zavřít">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Main text */}
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            Používáme nezbytné cookies pro fungování webu a analytické cookies (abychom věděli,
                            co vás baví). Žádné reklamy, žádný spam — slovo gamera. 🎮
                        </p>

                        {/* Buttons */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={accept}
                                className="bg-sz-red hover:bg-sz-red-dark text-white px-6 py-2.5 text-xs font-bold uppercase rounded-lg transition-all shadow-lg shadow-sz-red/20 hover:shadow-sz-red/40 font-orbitron tracking-wider"
                            >
                                GG, Akceptuju ✓
                            </button>
                            <button
                                onClick={decline}
                                className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-5 py-2.5 text-xs font-bold uppercase rounded-lg transition-all border border-white/10"
                            >
                                Jen nutné
                            </button>
                            <button
                                onClick={() => setShowLegal(!showLegal)}
                                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors ml-auto"
                            >
                                <Shield className="w-3 h-3" />
                                Korporátní kecy
                                {showLegal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                        </div>

                        {/* Expandable legal text */}
                        {showLegal && (
                            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="bg-black/40 rounded-lg p-4 max-h-64 overflow-y-auto custom-scrollbar">
                                    <h4 className="text-white font-bold text-xs uppercase mb-3 font-mono tracking-wider flex items-center gap-2">
                                        <Shield className="w-3 h-3 text-sz-red" />
                                        Zásady zpracování osobních údajů & Cookies
                                    </h4>

                                    <div className="space-y-3 text-gray-400 text-xs leading-relaxed font-mono">
                                        <p>
                                            <strong className="text-gray-300">Správce údajů:</strong> SkillZone s.r.o., IČO: 03674525,
                                            DIČ: CZ03674525, se sídlem Na Ohradě 91, 386 01 Strakonice. Kontakt: info@skillzone.cz
                                        </p>

                                        <p>
                                            <strong className="text-gray-300">Jaké cookies používáme:</strong>
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li><strong>Nezbytné</strong> — funkce webu, přihlášení, jazyk, téma (localStorage)</li>
                                            <li><strong>Analytické</strong> — anonymní statistiky návštěvnosti pro zlepšení webu</li>
                                            <li><strong>Funkční</strong> — zapamatování preferencí (jazyk, dark mode)</li>
                                        </ul>
                                        <p>Reklamní cookies nepoužíváme. Vaše data neprodáváme třetím stranám.</p>

                                        <p>
                                            <strong className="text-gray-300">Právní základ:</strong> Oprávněný zájem správce (čl. 6 odst. 1 písm. f) GDPR)
                                            pro nezbytné cookies; souhlas (čl. 6 odst. 1 písm. a) GDPR) pro analytické cookies.
                                        </p>

                                        <p>
                                            <strong className="text-gray-300">Doba uchování:</strong> Cookies jsou uchovávány po dobu nezbytnou
                                            pro jejich účel, maximálně 12 měsíců. Souhlas můžete kdykoli odvolat smazáním cookies v prohlížeči.
                                        </p>

                                        <p>
                                            <strong className="text-gray-300">Vaše práva dle GDPR:</strong> Máte právo na přístup, opravu, výmaz,
                                            omezení zpracování, přenositelnost údajů a právo vznést námitku. Stížnost můžete podat u ÚOOÚ
                                            (Úřad pro ochranu osobních údajů, www.uoou.cz).
                                        </p>

                                        <p>
                                            <strong className="text-gray-300">Třetí strany:</strong> Crisp (live chat), Supabase (databáze),
                                            Google Fonts (písmo). Tyto služby mají vlastní zásady ochrany soukromí.
                                        </p>

                                        <p className="text-gray-500 italic">
                                            Poslední aktualizace: únor 2025. Plné znění zásad je k dispozici na vyžádání na info@skillzone.cz.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
