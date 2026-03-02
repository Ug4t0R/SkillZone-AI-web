import React, { useState } from 'react';
import { getInquiriesByPhone, RentalInquiry } from '../../utils/storage/rentals';
import { Search, Loader2, Calendar, MapPin, Clock, Info, CheckCircle2, ChevronLeft, Map, MessageCircle } from 'lucide-react';
import { AppView } from '../../types';

interface ReservationStatusProps {
    onChangeView: (view: AppView) => void;
}

const bootcampRules = [
    "Bootcamp vám otevře obsluha (5 minut před objednaným časem) a je třeba ho opustit do 10 minut po skončení pronájmu. Nachází se VPRAVO od vstupu do klasické herny, NEOZNAČENÉ prosklené dveře, za kterými jsou vidět PC. Až dorazíte na místo, zavolejte na 777 766 112.",
    "V prostorech se s vámi nenachází nikdo, nicméně technik je schopen zaběhnout (v čase od 12:00 do 24:00) a máte vzdálenou podporu na telefonu (777 766 112).",
    "Do prostor je povolen vstup objednanému počtu osob, na místě se nachází požadovaný počet PC, párty reproduktor.",
    "V prostoru herny (která se nachází o patro nad) si lze za hotovost zakoupit předem vychlazené nápoje (Pivo, energy drinky, kafe, cola, voda) a cukrovinky. Pokud budete chtít, můžeme vám nápoje přenést i dolů, to se domlouvá na začátku nájmu.",
    "Do prostor si můžete vzít jakékoliv (i alkoholické) pití a jídlo. Máte k dispozici ledničku a výrobník ledu. (+ další věci chystáme)",
    "Pronajímatel akce zodpovídá za kontrolu bezinfekčnosti účastníků a případné škody jimi způsobené.",
    "V prostorech není dovoleno bez předchozí domluvy zapojovat do zásuvek žádné elektrické spotřebiče s výjimkou nabíječek na mobilní telefony."
];

const ReservationStatus: React.FC<ReservationStatusProps> = ({ onChangeView }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [inquiries, setInquiries] = useState<RentalInquiry[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) return;

        setLoading(true);
        const results = await getInquiriesByPhone(phone.trim());
        setInquiries(results || []);
        setSearched(true);
        setLoading(false);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'new': return { label: 'Zpracovává se', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' };
            case 'communicating': return { label: 'V jednání', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
            case 'approved': return { label: 'Schváleno / Potvrzeno', color: 'text-green-500 bg-green-500/10 border-green-500/20' };
            case 'rejected': return { label: 'Zamítnuto / Zrušeno', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
            default: return { label: 'Neznámý stav', color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' };
        }
    };

    return (
        <div className="min-h-screen bg-black pt-32 pb-24 text-white">
            <div className="max-w-4xl mx-auto px-4">
                <button
                    onClick={() => onChangeView('home')}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 font-mono text-sm"
                >
                    <ChevronLeft className="w-4 h-4" /> Zpět na hlavní stránku
                </button>

                <h1 className="text-4xl md:text-5xl font-black font-orbitron tracking-tighter uppercase mb-4">
                    Stav <span className="text-sz-red">Rezervace</span>
                </h1>
                <p className="text-gray-400 font-mono mb-8">Zadejte své telefonní číslo, které jste vyplnili při tvorbě rezervace.</p>

                <form onSubmit={handleSearch} className="flex gap-4 mb-12 border border-white/10 p-4 rounded-sm bg-zinc-900/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                        <input
                            type="tel"
                            placeholder="Zadejte telefon (např. +420 123 456 789 nebo 123456789)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-sm py-4 pl-12 pr-4 text-white font-mono focus:border-sz-red outline-none transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !phone}
                        className="bg-sz-red hover:bg-sz-red/80 text-white font-orbitron font-bold uppercase transition-colors px-8 rounded-sm shrink-0 flex items-center justify-center min-w-[140px]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Vyhledat'}
                    </button>
                </form>

                {searched && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {inquiries.length === 0 ? (
                            <div className="text-center py-12 border border-white/5 rounded-sm bg-white/5">
                                <p className="text-gray-400 font-mono">Nenalezeny žádné rezervace pro toto číslo.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {inquiries.map((inq) => {
                                    const statusObj = getStatusLabel(inq.status);

                                    return (
                                        <div key={inq.id} className="border border-white/10 rounded-sm bg-zinc-900 overflow-hidden">
                                            {/* Header */}
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-white/5 bg-black/40 gap-4">
                                                <div>
                                                    <h3 className="text-xl font-bold font-orbitron uppercase flex items-center gap-3">
                                                        Pronájem {inq.branch}
                                                        <span className={`text-[10px] px-2 py-1 rounded border font-mono tracking-wider ${statusObj.color}`}>
                                                            {statusObj.label}
                                                        </span>
                                                    </h3>
                                                    <p className="text-gray-500 font-mono text-xs mt-1">Vytvořeno: {new Date(inq.created_at).toLocaleDateString('cs-CZ')} | Objekt: {inq.is_company && inq.company_name ? inq.company_name : inq.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 text-sz-red font-mono font-bold text-lg mb-1">
                                                        <Calendar className="w-5 h-5" />
                                                        {new Date(inq.date).toLocaleDateString('cs-CZ')}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-400 font-mono text-sm justify-end">
                                                        <Clock className="w-4 h-4" />
                                                        {inq.start_time} (na {inq.duration_hours}h)
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details & Location Info */}
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-bold uppercase text-gray-500 tracking-wider font-orbitron">Přehled žádosti</h4>
                                                        <div className="space-y-2 text-sm font-mono text-gray-300 bg-white/5 p-4 rounded border border-white/5">
                                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                                <span className="text-gray-500">Osoby:</span>
                                                                <span>{inq.people_count} {inq.is_large_group && '(Velká skupina)'}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-white/5 pb-2 pt-2">
                                                                <span className="text-gray-500">Hry:</span>
                                                                <span className="text-right">
                                                                    {inq.games_later ? 'Seznam dodají později' : (inq.games?.join(', ') || 'Nespecifikováno')}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-1 pt-2">
                                                                <span className="text-gray-500 mb-1">Doplňky a Služby:</span>
                                                                {inq.addons.beer && <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-sz-red" /> Točené Pivo {inq.addons.beer_kegs?.length && `(${inq.addons.beer_kegs.map(k => `${k.brand} ${k.size}`).join(', ')})`}</span>}
                                                                {inq.addons.animator && <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-sz-red" /> Animátor (Game Master)</span>}
                                                                {inq.addons.technician && <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-sz-red" /> Technik na place</span>}
                                                                {inq.addons.invoice && <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-sz-red" /> Žádost o B2B Fakturu</span>}
                                                                {!inq.addons.beer && !inq.addons.animator && !inq.addons.technician && !inq.addons.invoice && <span className="text-gray-500 text-xs italic">Žádné extra doplňky</span>}
                                                            </div>
                                                        </div>

                                                        {inq.price_quote && (
                                                            <div className="mt-4 p-4 border border-green-500/30 bg-green-500/5 rounded">
                                                                <h4 className="text-xs font-bold uppercase text-green-500 tracking-wider mb-2">Nabídnutá cena</h4>
                                                                <p className="font-mono text-lg font-bold text-white">{inq.price_quote}</p>
                                                            </div>
                                                        )}

                                                        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
                                                            <p className="text-sm font-mono text-gray-400">Potřebujete s námi vyřešit detaily této rezervace?</p>
                                                            <a
                                                                href={`https://wa.me/420777766112?text=${encodeURIComponent(`Dobrý den, píšu ohledně rezervace prostoru ${inq.branch} na jméno ${inq.name} ze dne ${new Date(inq.date).toLocaleDateString('cs-CZ')}.`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba56] text-white px-4 py-3 rounded-sm font-bold font-mono text-sm transition-colors w-full"
                                                            >
                                                                <MessageCircle className="w-5 h-5" />
                                                                Napsat zprávu na WhatsApp
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* BOOTCAMP INFO SECTION */}
                                                    {inq.branch.toLowerCase() === 'bootcamp' && (
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold uppercase text-sz-red tracking-wider font-orbitron flex items-center gap-2">
                                                                <Info className="w-4 h-4" /> Důležité instrukce k BootCampu
                                                            </h4>
                                                            <div className="bg-sz-red/5 border border-sz-red/20 rounded p-4 text-xs font-mono text-gray-300 leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
                                                                <div className="mb-4">
                                                                    <div className="font-bold text-white mb-2 uppercase tracking-wide">Obecné informace a podmínky:</div>
                                                                    <ul className="space-y-3 list-disc pl-4 text-gray-400">
                                                                        {bootcampRules.map((rule, idx) => (
                                                                            <li key={idx}><span className="text-gray-300">{rule}</span></li>
                                                                        ))}
                                                                    </ul>
                                                                </div>

                                                                <div className="bg-black/40 p-4 rounded border border-white/5 space-y-2">
                                                                    <div className="font-bold text-white uppercase tracking-wide flex items-center gap-2 mb-2">
                                                                        <MapPin className="w-4 h-4 text-sz-red" /> Kde nás najdete:
                                                                    </div>
                                                                    <p><strong>Arkalycká 877/4, 149 00 Praha 4-Háje</strong></p>
                                                                    <p className="text-gray-400">Přímo na stanici metra Háje, kde vyjdete směrem k OC ale nezabočíte k OC, nýbrž půjdete okolo Lahůdek a Rossmanu v průchodu ještě pár metrů až téměř k AIRBANK bankomatu.</p>

                                                                    <div className="p-3 bg-red-950/30 border border-sz-red/30 rounded text-red-200 my-3 relative overflow-hidden group">
                                                                        <div className="absolute top-0 left-0 w-1 h-full bg-sz-red"></div>
                                                                        <Map className="w-4 h-4 inline-block -mt-1 mr-2 text-sz-red" />
                                                                        <strong>POZOR:</strong> Navigace autem (Waze/Apple) vás občas navede MIMO "vnitroblok" k Soláriu. My jsme ale umístěni přímo ve "vnitrobloku". <span className="text-white font-bold">V navigaci proto doporučujeme přepnout na pěší trasu!</span>
                                                                    </div>

                                                                    <a
                                                                        href="https://maps.app.goo.gl/rQy1dajTpEoY948r6"
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-block mt-2 text-sz-red hover:text-white underline transition-colors"
                                                                    >
                                                                        Otevřít v Google Maps (SkillZone Bootcamp Háje)
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReservationStatus;
