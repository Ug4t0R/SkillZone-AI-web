import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Users, Calendar, Gamepad2, Phone, CheckCircle2, Loader2, Search, Building2, User, Clock, Image as ImageIcon, MapPin, Plus, Trash2 } from 'lucide-react';
import { AppView, GamingLocation } from '../../types';
import { submitRentalInquiry } from '../../utils/storage/rentals';
import { getMergedLocations } from '../../utils/devTools';
import { LOCATIONS_CS } from '../../data/locations';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const InlineCalendar = ({ selectedDate, onSelect }: { selectedDate: string, onSelect: (d: string) => void }) => {
    const [baseDate, setBaseDate] = useState(() => {
        const d = selectedDate ? new Date(selectedDate) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextMonth = () => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1));
    const prevMonth = () => {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
        if (d >= new Date(today.getFullYear(), today.getMonth(), 1)) setBaseDate(d);
    };

    const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
    const startDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).getDay();
    const offset = startDay === 0 ? 6 : startDay - 1; // Monday first

    return (
        <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm p-4 w-full select-none">
            <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-white font-orbitron font-bold uppercase">
                <button onClick={prevMonth} className="p-1 hover:text-sz-red transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <span>{baseDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}</span>
                <button onClick={nextMonth} className="p-1 hover:text-sz-red transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs text-gray-400 mb-2">
                {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-sm font-mono">
                {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), day, 12, 0, 0); // 12 avoids tz issues
                    const isPast = d < today;
                    const ds = d.toISOString().split('T')[0];
                    const isSelected = selectedDate === ds;
                    const isToday = d.getTime() === today.getTime();

                    return (
                        <button
                            key={day}
                            disabled={isPast}
                            onClick={() => onSelect(ds)}
                            className={`aspect-square flex items-center justify-center rounded transition-all ${isPast ? 'opacity-20 cursor-not-allowed text-gray-500' : isSelected ? 'bg-sz-red text-white font-bold' : isToday ? 'border border-sz-red text-sz-red hover:bg-sz-red/10' : 'text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10'}`}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

interface RentalWizardProps {
    onChangeView: (view: AppView) => void;
}

const RentalWizard: React.FC<RentalWizardProps> = ({ onChangeView }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locations, setLocations] = useState<GamingLocation[]>([]);
    const [isAresLoading, setIsAresLoading] = useState(false);

    useEffect(() => {
        getMergedLocations(LOCATIONS_CS).then(setLocations);
    }, []);

    // State for all form fields
    const [formData, setFormData] = useState({
        peopleCount: 5,
        isLargeGroup: false,
        selectedBranch: '',
        date: '',
        startTime: '16:00',
        durationHours: 6,
        games: [] as string[],
        gamesLater: false,
        addons: {
            beer: false,
            animator: false,
            technician: false
        },
        name: '',
        isCompany: false,
        ico: '',
        dic: '',
        companyName: '',
        companyAddress: '',
        phone: '',
        whatsapp: false,
        beerKegs: [{ id: 1, size: '30l' as '15l' | '30l' | '50l', brand: '' }],
        wantsInvoice: false,
        invoiceEmail: ''
    });

    // Auto branch selection logic
    useEffect(() => {
        if (!formData.isLargeGroup) {
            setFormData(prev => ({ ...prev, selectedBranch: prev.peopleCount <= 10 ? 'bootcamp' : 'haje' }));
        }
    }, [formData.peopleCount, formData.isLargeGroup]);


    // ARES lookup when ICO reaches 8 chars
    const handleAresLookup = useCallback(async (ico: string) => {
        if (ico.length !== 8 || isNaN(Number(ico))) return;
        setIsAresLoading(true);
        try {
            const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.obchodniJmeno) {
                    setFormData(prev => ({
                        ...prev,
                        companyName: data.obchodniJmeno,
                        dic: data.dic || '',
                        companyAddress: data.sidlo?.textovaAdresa || ''
                    }));
                }
            }
        } catch (e) {
            console.error('ARES lookup failed:', e);
        } finally {
            setIsAresLoading(false);
        }
    }, []);

    const handleNextStep = async () => {
        if (step === 4) {
            if (!formData.name || !formData.phone || !formData.date || !formData.startTime || !formData.durationHours) {
                setError('Prosím vyplňte jméno, telefon, datum a délku pronájmu.');
                return;
            }

            if (formData.isCompany && !formData.ico) {
                setError('Prosím vyplňte IČO pro firemní pronájem.');
                return;
            }

            setIsSubmitting(true);
            setError(null);

            const success = await submitRentalInquiry({
                name: formData.name,
                people_count: formData.peopleCount,
                is_large_group: formData.isLargeGroup,
                branch: formData.selectedBranch || 'unknown',
                date: formData.date,
                start_time: formData.startTime,
                duration_hours: formData.durationHours,
                games: formData.gamesLater ? [] : formData.games,
                games_later: formData.gamesLater,
                addons: {
                    ...formData.addons,
                    beer_kegs: formData.addons.beer ? formData.beerKegs.map(keg => ({
                        size: keg.size,
                        brand: keg.brand || 'Nespecifikováno'
                    })) : undefined,
                    invoice: formData.isCompany ? formData.wantsInvoice : false
                },
                is_company: formData.isCompany,
                company_name: formData.companyName,
                ico: formData.ico,
                dic: formData.dic,
                company_address: formData.companyAddress,
                invoice_email: formData.invoiceEmail,
                phone: formData.phone,
                whatsapp: formData.whatsapp
            });

            setIsSubmitting(false);

            if (success) {
                setStep(5);
            } else {
                setError('Něco se pokazilo při odesílání. Zkuste to prosím znovu nebo nám zavolejte.');
            }
        } else {
            setStep(s => Math.min(s + 1, 5));
            setError(null);
        }
    };

    const prevStep = () => {
        setStep(s => Math.max(s - 1, 1));
        setError(null);
    };

    const handleCapacityChange = (count: number) => {
        setFormData(prev => ({ ...prev, peopleCount: count, isLargeGroup: false }));
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                const selectedLocObj = locations.find(l => l.id === formData.selectedBranch);
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-2 uppercase">Pro kolik lidí to bude?</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">Vyberte očekávaný počet účastníků. Od toho se odvíjí ideální místnost.</p>
                        </div>

                        <div className="space-y-6">
                            {!formData.isLargeGroup && (
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sz-red font-orbitron font-bold text-2xl">
                                        <span>{formData.peopleCount} {formData.peopleCount >= 5 && formData.peopleCount <= 16 ? 'osob' : 'osoby'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="16"
                                        value={formData.peopleCount}
                                        onChange={(e) => handleCapacityChange(parseInt(e.target.value))}
                                        className="w-full accent-sz-red h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                                    />
                                    <div className="flex justify-between text-xs font-mono text-gray-400">
                                        <span>5 zapařenců</span>
                                        <span>16 LAN party zvířat</span>
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 dark:border-white/10 rounded-sm hover:border-sz-red transition-colors bg-gray-50 dark:bg-black/20">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-sz-red shrink-0"
                                    checked={formData.isLargeGroup}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isLargeGroup: e.target.checked, selectedBranch: e.target.checked ? 'zizkov' : (prev.peopleCount <= 10 ? 'bootcamp' : 'haje') }))}
                                />
                                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                                    <strong>Jsme větší skupina (nad 16 osob)</strong> a chceme např. pronájem celé velké herny (Žižkov).
                                </span>
                            </label>
                        </div>

                        <div className="mt-8 border-t border-gray-200 dark:border-white/10 pt-8">
                            <h3 className="text-sm font-orbitron text-gray-500 uppercase mb-4 tracking-wider">Doporučený prostor</h3>
                            <div className="bg-zinc-100 dark:bg-zinc-800 border-l-4 border-sz-red p-6 relative overflow-hidden group">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white uppercase mb-2">
                                    {selectedLocObj ? selectedLocObj.name : (formData.selectedBranch === 'zizkov' ? 'Celá Pobočka' : 'Vybraný Prostor')}
                                </h4>
                                <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-4 z-10 relative">
                                    {formData.isLargeGroup
                                        ? "Pro takto velké skupiny nabízíme flexibilní řešení od pronájmu části herny až po uzavření celého Žižkova. Ozveme se s řešením na míru."
                                        : formData.peopleCount <= 10
                                            ? "Bootcamp je plně uzavřená soukromá base přímo vedle naší pobočky Háje. Vlastní vchod, soukromí zaručeno, lednička, pípa a 10 high-end strojů jen pro vás."
                                            : "Přímo v herně na metru Háje vám vyhradíme prostornou zadní část. Jste v centru dění, blízko baru, ale máte svůj prostor pro partu."}
                                </p>

                                {selectedLocObj?.floorPlanUrl && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 relative z-10">
                                        <div className="flex items-center gap-2 text-sz-red text-xs font-bold uppercase tracking-wider mb-2">
                                            <ImageIcon className="w-4 h-4" /> Plánek prostor
                                        </div>
                                        <div className="relative rounded overflow-hidden border border-gray-200 dark:border-white/10 cursor-pointer">
                                            <img src={selectedLocObj.floorPlanUrl} alt={`Floor plan of ${selectedLocObj.name}`} className="w-full h-auto object-cover max-h-48 opacity-80 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-2 uppercase">Kdy chcete dorazit?</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm max-w-lg">Vyberte přesný termín, čas příchodu a plánovanou délku akce. Běžné LANky u nás trvají 6 až 12 hodin, ale klidně můžete pařit i 30 v kuse.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-orbitron uppercase text-gray-700 dark:text-gray-300">Konkrétní den</label>
                                <InlineCalendar selectedDate={formData.date} onSelect={d => setFormData(prev => ({ ...prev, date: d }))} />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="block text-sm font-orbitron uppercase text-gray-700 dark:text-gray-300">Začátek pronájmu (24h formát)</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sz-red transition-colors pointer-events-none" />
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-4 pl-12 pr-4 text-gray-900 dark:text-white font-mono focus:border-sz-red focus:ring-1 focus:ring-sz-red outline-none transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <label className="block text-sm font-orbitron uppercase text-gray-700 dark:text-gray-300">Délka trvání</label>
                                        <span className="font-mono text-sz-red font-bold">{formData.durationHours} hodin</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="4"
                                        max="48"
                                        step="1"
                                        value={formData.durationHours}
                                        onChange={(e) => setFormData(prev => ({ ...prev, durationHours: parseInt(e.target.value) }))}
                                        className="w-full accent-sz-red h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 mt-2"
                                    />
                                    <div className="flex justify-between text-xs font-mono text-gray-400">
                                        <span>4h min.</span>
                                        <span>48h (víkend max)</span>
                                    </div>
                                </div>
                                <div className="bg-sz-red/10 border border-sz-red/20 rounded p-4 flex items-start gap-3 mt-4">
                                    <CheckCircle2 className="w-5 h-5 text-sz-red shrink-0" />
                                    <p className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                        Pro noční pronájmy pamatujte, že se řídíme vybraným dnem **příchodu**. Do rána můžete bez problémů hrát i přes půlnoc.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                const popularGames = ['Counter-Strike 2', 'League of Legends', 'Valorant', 'Dota 2', 'Apex Legends', 'Fortnite', 'PUBG', 'Rocket League', 'Minecraft', 'Ostatní / Jiné'];
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-2 uppercase">Co se bude hrát?</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">Abychom vám mohli počítače předem připravit a opatchovat hry, zaškrtněte, co plánujete hrát.</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {popularGames.map(game => (
                                <label
                                    key={game}
                                    className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${formData.games.includes(game) ? 'border-sz-red bg-sz-red/10' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.games.includes(game)}
                                        disabled={formData.gamesLater}
                                        onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                games: e.target.checked
                                                    ? [...prev.games, game]
                                                    : prev.games.filter(g => g !== game)
                                            }))
                                        }}
                                    />
                                    <Gamepad2 className={`w-4 h-4 ${formData.games.includes(game) ? 'text-sz-red' : 'text-gray-400'}`} />
                                    <span className={`font-mono text-xs md:text-sm ${formData.games.includes(game) ? 'text-sz-red font-bold' : 'text-gray-600 dark:text-gray-400'}`}>{game}</span>
                                </label>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                            <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 dark:border-white/10 rounded-sm hover:border-sz-red transition-colors bg-gray-50 dark:bg-black/20">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-sz-red shrink-0"
                                    checked={formData.gamesLater}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        gamesLater: e.target.checked,
                                        games: e.target.checked ? [] : prev.games
                                    }))}
                                />
                                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                                    <strong>Ještě nevíme / Seznam her dodáme později.</strong> Nemusíte vyplňovat teď, stačí nám dát vědět nejpozději 3 dny před akcí.
                                </span>
                            </label>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white mb-2 uppercase">Služby a Fakturace</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">Vylaďte svou akci a vyplňte kontaktní, případně rovnou i firemní účetní údaje.</p>
                        </div>

                        <div className="space-y-3 border-b border-gray-200 dark:border-white/10 pb-6">
                            <div className={`p-4 border rounded-sm transition-colors ${formData.addons.beer ? 'border-sz-red bg-sz-red/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                <label className="flex items-start gap-4 cursor-pointer">
                                    <input type="checkbox" className="mt-1 w-5 h-5 accent-sz-red shrink-0" checked={formData.addons.beer} onChange={(e) => setFormData(prev => ({ ...prev, addons: { ...prev.addons, beer: e.target.checked } }))} />
                                    <div>
                                        <div className={`font-orbitron font-bold uppercase ${formData.addons.beer ? 'text-sz-red' : 'text-gray-900 dark:text-white'}`}>Točené Pivo / Nealko (Samoobsluha)</div>
                                        <div className="font-mono text-sm text-gray-500">Zajistíme vám sud (nebo víc) a pípu rovnou do herny. Pípa má 2 výstupy (lze i limo).</div>
                                    </div>
                                </label>
                                {formData.addons.beer && (
                                    <div className="mt-4 pl-9 space-y-4 animate-in fade-in slide-in-from-top-2">
                                        {formData.beerKegs.map((keg, idx) => (
                                            <div key={keg.id || idx} className="p-3 border border-gray-100 dark:border-white/5 rounded-sm relative group">
                                                {formData.beerKegs.length > 1 && (
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, beerKegs: prev.beerKegs.filter((_, i) => i !== idx) }))}
                                                        className="absolute right-2 top-2 text-gray-400 hover:text-sz-red" title="Odebrat sud"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-mono text-gray-500 uppercase">Značka (Pivo / Nealko) {idx + 1}</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Např. Plzeň 12° nebo Kofola"
                                                            value={keg.brand}
                                                            onChange={e => {
                                                                const newKegs = [...formData.beerKegs];
                                                                newKegs[idx] = { ...newKegs[idx], brand: e.target.value };
                                                                setFormData(prev => ({ ...prev, beerKegs: newKegs }));
                                                            }}
                                                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-sm py-2 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-mono text-gray-500 uppercase">Velikost Sudu</label>
                                                        <select
                                                            value={keg.size}
                                                            onChange={e => {
                                                                const newKegs = [...formData.beerKegs];
                                                                newKegs[idx] = { ...newKegs[idx], size: e.target.value as '15l' | '30l' | '50l' };
                                                                setFormData(prev => ({ ...prev, beerKegs: newKegs }));
                                                            }}
                                                            className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-sm py-2 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none appearance-none cursor-pointer pr-8"
                                                        >
                                                            <option value="15l">15 litrů (~30 piv)</option>
                                                            <option value="30l">30 litrů (~60 piv)</option>
                                                            <option value="50l">50 litrů (~100 piv)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                beerKegs: [...prev.beerKegs, { id: Date.now(), size: '30l', brand: '' }]
                                            }))}
                                            className="font-mono text-xs font-bold uppercase text-sz-red hover:text-red-500 flex items-center gap-1 mt-2"
                                        >
                                            <Plus className="w-3 h-3" /> Přidat další sud
                                        </button>
                                    </div>
                                )}
                            </div>

                            <label className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-colors ${formData.addons.animator ? 'border-sz-red bg-sz-red/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                <input type="checkbox" className="mt-1 w-5 h-5 accent-sz-red shrink-0" checked={formData.addons.animator} onChange={(e) => setFormData(prev => ({ ...prev, addons: { ...prev.addons, animator: e.target.checked } }))} />
                                <div>
                                    <div className={`font-orbitron font-bold uppercase ${formData.addons.animator ? 'text-sz-red' : 'text-gray-900 dark:text-white'}`}>Herní Animátor (Game Master)</div>
                                    <div className="font-mono text-sm text-gray-500">Náš člověk se postará o turnaj či moderování a celkový flow zábavy.</div>
                                </div>
                            </label>

                            <label className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-colors ${formData.addons.technician ? 'border-sz-red bg-sz-red/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                <input type="checkbox" className="mt-1 w-5 h-5 accent-sz-red shrink-0" checked={formData.addons.technician} onChange={(e) => setFormData(prev => ({ ...prev, addons: { ...prev.addons, technician: e.target.checked } }))} />
                                <div>
                                    <div className={`font-orbitron font-bold uppercase ${formData.addons.technician ? 'text-sz-red' : 'text-gray-900 dark:text-white'}`}>Technik na zavolanou</div>
                                    <div className="font-mono text-sm text-gray-500">IT support v zádech po celou dobu, pokud by se hra kousla nebo zlobily periférie.</div>
                                </div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-orbitron text-gray-900 dark:text-white uppercase tracking-wider mb-2">Kontaktní údaje</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-mono text-gray-500 uppercase">Jméno a Příjmení</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Jan Novák"
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-mono text-gray-500 uppercase">Telefonní číslo</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            placeholder="+420 123 456 789"
                                            value={formData.phone}
                                            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-sm py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer pt-2 pb-2">
                                <input type="checkbox" className="w-4 h-4 accent-sz-red shrink-0" checked={formData.whatsapp} onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.checked }))} />
                                <span className="font-mono text-xs text-gray-500">Pro urychlení se můžeme o dalších detailech klidně bavit běžně přes <strong>WhatsApp</strong>.</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 dark:border-white/10 rounded-sm bg-gray-50 dark:bg-zinc-800">
                                <input type="checkbox" className="w-5 h-5 accent-sz-red shrink-0" checked={formData.isCompany} onChange={(e) => setFormData(prev => ({ ...prev, isCompany: e.target.checked }))} />
                                <span className="font-orbitron font-bold text-sm uppercase text-gray-900 dark:text-white">Pronájem na firmu (B2B)</span>
                            </label>

                            {formData.isCompany && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 pt-1 bg-gray-50 dark:bg-zinc-800 border-x border-b border-gray-200 dark:border-white/10 rounded-b-sm animate-in fade-in zoom-in-95 -mt-5">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-mono text-gray-500 uppercase">IČO</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="12345678"
                                                maxLength={8}
                                                value={formData.ico}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setFormData(prev => ({ ...prev, ico: val }));
                                                    if (val.length === 8) handleAresLookup(val);
                                                }}
                                                className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-sm py-3 pl-10 pr-10 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none"
                                            />
                                            {isAresLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sz-red animate-spin" />}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-mono text-gray-500 uppercase">DIČ (ARES)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="CZ12345678"
                                                value={formData.dic}
                                                onChange={e => setFormData(prev => ({ ...prev, dic: e.target.value }))}
                                                className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-sm py-3 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="block text-xs font-mono text-gray-500 uppercase">Název Firmy (ARES)</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="SkillZone s.r.o."
                                                value={formData.companyName}
                                                onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                                className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-sm py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="block text-xs font-mono text-gray-500 uppercase">Sídlo Firmy (ARES)</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Adresa sídla"
                                                value={formData.companyAddress}
                                                onChange={e => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                                                className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-sm py-3 pl-10 pr-3 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 border-t border-gray-200 dark:border-white/10 pt-4 mt-2">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" className="w-4 h-4 accent-sz-red shrink-0" checked={formData.wantsInvoice} onChange={(e) => setFormData(prev => ({ ...prev, wantsInvoice: e.target.checked }))} />
                                            <span className="font-mono text-xs text-gray-600 dark:text-gray-400">Prosíme poslat fakturu na e-mail</span>
                                        </label>

                                        {formData.wantsInvoice && (
                                            <div className="mt-3 relative animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    type="email"
                                                    placeholder="fakturace@firma.cz"
                                                    value={formData.invoiceEmail}
                                                    onChange={e => setFormData(prev => ({ ...prev, invoiceEmail: e.target.value }))}
                                                    className="w-full bg-white dark:bg-black/30 border border-sz-red/50 rounded-sm py-2 px-3 text-sm text-gray-900 dark:text-white font-mono focus:border-sz-red outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-sz-red/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-12 h-12 text-sz-red" />
                        </div>
                        <h2 className="text-3xl font-orbitron font-bold text-gray-900 dark:text-white uppercase">Poptávka Přijata!</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-mono max-w-md mx-auto leading-relaxed">
                            Vaši žádost o pronájem pro {formData.peopleCount} osob jsme úspěšně zaregistrovali.
                            {formData.isCompany && formData.companyName && ` A děkujeme rovnou i klukům/holkám z ${formData.companyName} za důvěru!`}
                            Náš tým se vám brzy ozve na číslo <strong className="text-gray-900 dark:text-white">{formData.phone}</strong> ohledně ceny a potvrzení termínu.
                        </p>
                        <button
                            onClick={() => { onChangeView('home'); window.scrollTo(0, 0); }}
                            className="mt-8 bg-transparent border border-sz-red text-sz-red px-8 py-3 rounded-sm font-orbitron font-bold uppercase tracking-wider hover:bg-sz-red hover:text-white transition-colors"
                        >
                            Zpět na hlavní stránku
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="pt-20 min-h-screen bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-white transition-colors duration-300 flex flex-col items-center">
            <div className="w-full max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => {
                            if (step > 1 && step < 5) prevStep();
                            else onChangeView('home');
                        }}
                        className="flex items-center gap-2 text-gray-500 hover:text-sz-red transition-colors font-orbitron font-bold uppercase text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {step === 1 ? 'Opustit' : 'Zpět'}
                    </button>
                    {step < 5 && (
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className={`w-3 h-3 rounded-full ${s === step ? 'bg-sz-red' : s < step ? 'bg-sz-red/50' : 'bg-gray-300 dark:bg-zinc-800'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Card */}
                <div className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden flex flex-col">
                    <div className="flex-1">
                        {renderStepContent()}
                    </div>

                    {/* Footer / Controls */}
                    {step < 5 && (
                        <div className="p-8 bg-gray-50 dark:bg-black/60 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm font-mono text-gray-500 text-center sm:text-left">
                                {error ? <span className="text-red-500 font-bold">{error}</span> : `Krok ${step} ze 4`}
                            </div>
                            <button
                                onClick={handleNextStep}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-8 py-3 bg-sz-red text-white rounded-sm font-orbitron font-bold uppercase tracking-wider hover:bg-sz-red-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Odesílám...</>
                                ) : step === 4 ? (
                                    'Odeslat Poptávku'
                                ) : (
                                    'Pokračovat dál'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RentalWizard;
