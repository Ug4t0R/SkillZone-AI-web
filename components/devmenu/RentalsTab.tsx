import React, { useState, useEffect } from 'react';
import { getRentalInquiries, RentalInquiry } from '../../utils/storage/rentals';
import { RefreshCw, MessageCircle, Calendar, Users, Phone, Loader2, MapPin, FileText, Mail } from 'lucide-react';
import AdminInvoiceModal from './AdminInvoiceModal';

interface RentalsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const RentalsTab: React.FC<RentalsTabProps> = ({ addLog }) => {
    const [inquiries, setInquiries] = useState<RentalInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [invoiceModalInquiry, setInvoiceModalInquiry] = useState<RentalInquiry | null>(null);

    const loadInquiries = async () => {
        setLoading(true);
        const data = await getRentalInquiries();
        setInquiries(data);
        setLoading(false);
    };

    useEffect(() => {
        loadInquiries();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'communicating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const StatusName = {
        'new': 'Nová poptávka',
        'communicating': 'V řešení',
        'approved': 'Schváleno',
        'rejected': 'Zamítnuto'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-sz-red animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white font-orbitron uppercase tracking-wide">Soukromé pronájmy</h3>
                    <p className="text-[11px] text-gray-500 font-mono mt-1">Správa příchozích poptávek z formuláře</p>
                </div>
                <button
                    onClick={() => {
                        loadInquiries();
                        addLog('Ověřování nových poptávek...', 'info');
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-mono text-gray-300 transition-colors"
                >
                    <RefreshCw className="w-3 h-3" />
                    Obnovit
                </button>
            </div>

            <div className="space-y-4">
                {inquiries.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-mono text-sm border border-white/5 bg-black/20 rounded-lg">
                        Žádné poptávky zatím nedorazily.
                    </div>
                ) : (
                    inquiries.map((inquiry) => (
                        <div key={inquiry.id} className="bg-black/40 border border-white/5 rounded-lg p-5 hover:border-white/10 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-sm ${getStatusColor(inquiry.status)}`}>
                                            {StatusName[inquiry.status as keyof typeof StatusName] || inquiry.status}
                                        </div>
                                        <span className="text-[11px] text-gray-500 font-mono">
                                            {new Date(inquiry.created_at).toLocaleString('cs-CZ')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span>{inquiry.date} ({inquiry.start_time}, na {inquiry.duration_hours}h)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Users className="w-4 h-4 text-gray-500" />
                                            <span>{inquiry.people_count} osob {inquiry.is_large_group && '(Velká skup.)'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span>{inquiry.branch}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm font-mono text-white bg-white/5 py-1 px-2 rounded w-fit">
                                                <Phone className="w-4 h-4 text-gray-500" />
                                                <span className="tracking-wide">{inquiry.phone}</span>
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-mono pl-1 mt-1">
                                                <span className="text-gray-300 font-bold">{inquiry.name}</span> {inquiry.is_company && inquiry.ico && `(IČO: ${inquiry.ico}${inquiry.dic ? `, DIČ: ${inquiry.dic}` : ''})`}
                                            </div>
                                            {inquiry.is_company && inquiry.company_name && (
                                                <div className="text-[10px] text-sz-red font-mono font-bold pl-1 uppercase tracking-wider flex flex-col gap-0.5 mt-1">
                                                    <span>{inquiry.company_name}</span>
                                                    {inquiry.company_address && <span className="text-gray-500 normal-case font-normal whitespace-pre-wrap">{inquiry.company_address}</span>}
                                                </div>
                                            )}
                                            {inquiry.is_company && inquiry.addons.invoice && inquiry.invoice_email && (
                                                <div className="text-[10px] text-green-400/80 font-mono pl-1 mt-1 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {inquiry.invoice_email}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(inquiry.addons.beer || inquiry.addons.animator || inquiry.addons.technician || inquiry.addons.invoice) && (
                                        <div className="flex gap-2 text-[11px] font-mono mt-2 flex-wrap">
                                            <span className="text-gray-500 uppercase">Příplatky:</span>
                                            {inquiry.addons.beer && (
                                                <span className="text-sz-red bg-sz-red/10 px-1 rounded flex items-center gap-1">
                                                    Pivo {inquiry.addons.beer_kegs?.length ? `(${inquiry.addons.beer_kegs.map(k => `${k.brand} ${k.size}`).join(', ')})` : ''}
                                                </span>
                                            )}
                                            {inquiry.addons.animator && <span className="text-violet-400 bg-violet-400/10 px-1 rounded">Animátor</span>}
                                            {inquiry.addons.technician && <span className="text-blue-400 bg-blue-400/10 px-1 rounded">Technik</span>}
                                            {inquiry.addons.invoice && <span className="text-green-400 bg-green-400/10 px-1 rounded border border-green-500/20">Žádost o Fakturu</span>}
                                        </div>
                                    )}

                                    {inquiry.games && inquiry.games.length > 0 && (
                                        <div className="flex gap-2 text-[11px] font-mono items-center mt-2 overflow-x-auto custom-scrollbar pb-1">
                                            <span className="text-gray-500 uppercase">Hry:</span>
                                            {inquiry.games.map(game => (
                                                <span key={game} className="text-gray-400 bg-white/5 px-2 rounded whitespace-nowrap">{game}</span>
                                            ))}
                                            {inquiry.games_later && <span className="text-yellow-500 bg-yellow-500/10 px-2 rounded">Dodají později</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-4">
                                    <h4 className="text-[10px] text-gray-500 font-mono uppercase">Akce</h4>
                                    {inquiry.whatsapp && (
                                        <a
                                            href={`https://wa.me/${inquiry.phone.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex justify-center items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md text-xs font-bold transition-all"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </a>
                                    )}
                                    {inquiry.is_company && inquiry.addons.invoice && (
                                        <button
                                            onClick={() => setInvoiceModalInquiry(inquiry)}
                                            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-md text-xs transition-all font-mono whitespace-nowrap"
                                        >
                                            <FileText className="w-3 h-3" />
                                            Faktura
                                        </button>
                                    )}
                                    <button
                                        onClick={() => addLog('Tato funkce (změna stavu) bude přidána.', 'info')}
                                        className="w-full text-center px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-md text-xs transition-all font-mono"
                                    >
                                        Změnit Stav
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))
                )}
            </div>
            {invoiceModalInquiry && (
                <AdminInvoiceModal inquiry={invoiceModalInquiry} onClose={() => setInvoiceModalInquiry(null)} />
            )}
        </div>
    );
};

export default RentalsTab;
