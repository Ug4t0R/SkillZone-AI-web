import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { RentalInquiry } from '../../utils/storage/rentals';

interface AdminInvoiceModalProps {
    inquiry: RentalInquiry;
    onClose: () => void;
}

const AdminInvoiceModal: React.FC<AdminInvoiceModalProps> = ({ inquiry, onClose }) => {
    // Boilerplate basic calculation (can be adjusted by admin later)
    const basePrice = inquiry.duration_hours * 1500; // Example base rate

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white text-black w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold font-orbitron">Generátor Faktury</h2>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors" title="Vytisknout / Uložit PDF">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-1 font-mono text-sm print:p-0 print:m-0" id="invoice-content">
                    {/* INVOICE TEMPLATE */}
                    <div className="space-y-8">
                        <div className="flex justify-between items-start border-b pb-8">
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Faktura</h1>
                                <p className="text-gray-500">Číslo: <strong>{new Date().getFullYear()}{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}</strong></p>
                                <p className="text-gray-500">Datum vystavení: <strong>{new Date().toLocaleDateString('cs-CZ')}</strong></p>
                                <p className="text-gray-500">Datum splatnosti: <strong>{new Date(Date.now() + 14 * 86400000).toLocaleDateString('cs-CZ')}</strong></p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-2xl font-bold mb-1">SkillZone</h3>
                                <p className="text-gray-600">Dodavatel</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            {/* Dodavatel */}
                            <div>
                                <h4 className="font-bold text-gray-400 uppercase text-xs mb-2">Dodavatel</h4>
                                <div className="font-bold text-lg mb-1">Tomas [DOPLNIT JMENO / FIRMU]</div>
                                <div className="text-gray-600 space-y-1">
                                    <p>Arkalycká 877/4</p>
                                    <p>149 00 Praha 4-Háje</p>
                                    <p className="mt-2 pt-2 border-t border-gray-100">IČO: <strong>03674525</strong></p>
                                    <p>DIČ: <strong>CZ03674252</strong></p>
                                </div>
                            </div>

                            {/* Odběratel */}
                            <div>
                                <h4 className="font-bold text-gray-400 uppercase text-xs mb-2">Odběratel</h4>
                                <div className="font-bold text-lg mb-1">{inquiry.company_name || inquiry.name}</div>
                                <div className="text-gray-600 space-y-1">
                                    {inquiry.company_address ? (
                                        <p className="whitespace-pre-wrap">{inquiry.company_address}</p>
                                    ) : (
                                        <>
                                            <p>Adresa zákazníka (doplnit)</p>
                                            <p>Město, PSČ (doplnit)</p>
                                        </>
                                    )}
                                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                                        {inquiry.ico && <p>IČO: <strong>{inquiry.ico}</strong></p>}
                                        {inquiry.dic ? <p>DIČ: <strong>{inquiry.dic}</strong></p> : (inquiry.ico && <p>DIČ: <strong>CZ{inquiry.ico}</strong></p>)}
                                        {inquiry.invoice_email && <p className="text-xs mt-2 text-gray-400">E-mail: {inquiry.invoice_email}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="py-3 px-2 font-bold uppercase text-xs">Položka</th>
                                        <th className="py-3 px-2 font-bold uppercase text-xs text-right">Množství</th>
                                        <th className="py-3 px-2 font-bold uppercase text-xs text-right">Cena za jedn.</th>
                                        <th className="py-3 px-2 font-bold uppercase text-xs text-right">Celkem (bez DPH)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-200">
                                        <td className="py-4 px-2">Pronájem prostor ({inquiry.branch}) na {inquiry.date}</td>
                                        <td className="py-4 px-2 text-right">{inquiry.duration_hours} h</td>
                                        <td className="py-4 px-2 text-right">1 500 Kč</td>
                                        <td className="py-4 px-2 text-right">{basePrice.toLocaleString('cs-CZ')} Kč</td>
                                    </tr>
                                    {inquiry.addons.beer && inquiry.addons.beer_kegs?.map((keg, idx) => (
                                        <tr key={idx} className="border-b border-gray-200">
                                            <td className="py-4 px-2">Sud piva {keg.brand} ({keg.size})</td>
                                            <td className="py-4 px-2 text-right">1 ks</td>
                                            <td className="py-4 px-2 text-right">2 500 Kč</td>
                                            <td className="py-4 px-2 text-right">2 500 Kč</td>
                                        </tr>
                                    ))}
                                    {inquiry.addons.animator && (
                                        <tr className="border-b border-gray-200">
                                            <td className="py-4 px-2">Služby animátora</td>
                                            <td className="py-4 px-2 text-right">{inquiry.duration_hours} h</td>
                                            <td className="py-4 px-2 text-right">300 Kč</td>
                                            <td className="py-4 px-2 text-right">{(inquiry.duration_hours * 300).toLocaleString('cs-CZ')} Kč</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-8">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between text-gray-500">
                                    <span>Základ DPH (21%)</span>
                                    <span>[Doplnit] Kč</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black border-t-2 border-black pt-2">
                                    <span>Celkem:</span>
                                    <span>[Doplnit] Kč</span>
                                </div>
                                <p className="text-xs text-right text-gray-400">Nejsme plátci DPH / Jsme plátci DPH</p>
                            </div>
                        </div>

                        <div className="pt-16 text-xs text-gray-400 border-t mt-8">
                            <p>Faktura slouží jako daňový doklad. Děkujeme za důvěru a přejeme skvělou LAN párty!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Minimal print styles injection */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    #invoice-content, #invoice-content * { visibility: visible; }
                    #invoice-content { position: absolute; left: 0; top: 0; width: 100%; padding: 2cm; }
                }
            `}} />
        </div>
    );
};

export default AdminInvoiceModal;
