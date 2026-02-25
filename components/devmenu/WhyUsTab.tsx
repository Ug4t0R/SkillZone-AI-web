import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, RotateCcw, Swords } from 'lucide-react';
import { WHY_US_DATA_CS } from '../../data/whyUs';
import { getSetting, setSetting } from '../../services/webDataService';

interface WhyUsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

interface WhyUsRow {
    id: string;
    aspect: string;
    others: string;
    skillzone: string;
    winner: string;
    isCustom?: boolean;
}

const EMPTY: WhyUsRow = { id: '', aspect: '', others: '', skillzone: '', winner: 'skillzone' };
const WHYUS_KEY = 'custom_whyus';

const withIds = (arr: typeof WHY_US_DATA_CS): WhyUsRow[] =>
    arr.map((r, i) => ({ ...r, id: `whyus_${i}` }));

const WhyUsTab: React.FC<WhyUsTabProps> = ({ addLog }) => {
    const [items, setItems] = useState<WhyUsRow[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<WhyUsRow>(EMPTY);
    const [isAdding, setIsAdding] = useState(false);
    const [customData, setCustomData] = useState<WhyUsRow[]>([]);

    const loadAndMerge = async () => {
        const custom = await getSetting<WhyUsRow[]>(WHYUS_KEY, []);
        setCustomData(custom);
        const base = withIds(WHY_US_DATA_CS);
        const customMap = new Map(custom.map(r => [r.id, r]));
        const merged = base.map(item => {
            if (customMap.has(item.id)) { const c = customMap.get(item.id)!; customMap.delete(item.id); return { ...c, isCustom: false }; }
            return item;
        });
        setItems([...merged, ...Array.from(customMap.values()).map(r => ({ ...r, isCustom: true }))]);
    };

    useEffect(() => { loadAndMerge(); }, []);

    const startEdit = (item: WhyUsRow) => { setEditingId(item.id); setForm({ ...item }); setIsAdding(false); };
    const startAdd = () => { setForm({ ...EMPTY, id: `whyus_custom_${Date.now()}` }); setIsAdding(true); setEditingId(null); };
    const cancel = () => { setEditingId(null); setIsAdding(false); };

    const save = async () => {
        if (!form.aspect) { addLog('Aspekt je povinný', 'error'); return; }
        const current = [...customData];
        const idx = current.findIndex(r => r.id === form.id);
        if (idx >= 0) current[idx] = form; else current.push(form);
        await setSetting(WHYUS_KEY, current);
        addLog(`${isAdding ? 'Přidáno' : 'Upraveno'}: ${form.aspect}`, 'success');
        setEditingId(null); setIsAdding(false); await loadAndMerge();
    };

    const remove = async (id: string) => { await setSetting(WHYUS_KEY, customData.filter(r => r.id !== id)); addLog(`Odebráno: ${id}`, 'info'); await loadAndMerge(); };
    const resetAll = async () => { await setSetting(WHYUS_KEY, []); addLog('WhyUs resetováno', 'success'); await loadAndMerge(); };
    const customIds = new Set(customData.map(r => r.id));
    const inputCls = "bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none w-full";

    const renderForm = () => (
        <div className="bg-black/40 border border-sz-red/20 rounded p-4 space-y-3 mb-4">
            <input value={form.aspect} onChange={e => setForm({ ...form, aspect: e.target.value })} placeholder="Aspekt (např. Atmosféra)" className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-gray-500 font-mono mb-1 block">🏢 Ostatní</label>
                    <input value={form.others} onChange={e => setForm({ ...form, others: e.target.value })} placeholder="Co nabízí konkurence..." className={inputCls} />
                </div>
                <div>
                    <label className="text-[10px] text-sz-red font-mono mb-1 block">🔥 SkillZone</label>
                    <input value={form.skillzone} onChange={e => setForm({ ...form, skillzone: e.target.value })} placeholder="Co nabízíme my..." className={inputCls} />
                </div>
            </div>
            <select value={form.winner} onChange={e => setForm({ ...form, winner: e.target.value })} className={inputCls}>
                <option value="skillzone">✅ SkillZone vyhrává</option>
                <option value="others">⚠️ Ostatní vyhrávají</option>
                <option value="tie">🤝 Remíza</option>
            </select>
            <div className="flex gap-2">
                <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-sz-red text-white text-xs font-bold uppercase rounded hover:bg-sz-red-dark transition-colors"><Save className="w-3 h-3" /> Uložit</button>
                <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 text-xs font-bold uppercase rounded hover:text-white transition-colors"><X className="w-3 h-3" /> Zrušit</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-sz-red" />
                    <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">Why Us ({items.length} rows)</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={resetAll} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-gray-500 hover:text-white border border-white/5 rounded transition-colors"><RotateCcw className="w-3 h-3" /> Reset</button>
                    <button onClick={startAdd} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-sz-red hover:text-white border border-sz-red/30 rounded hover:bg-sz-red transition-colors"><Plus className="w-3 h-3" /> Add</button>
                </div>
            </div>

            {isAdding && renderForm()}

            {/* Header */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-2 px-2.5 text-[10px] font-mono text-gray-500 uppercase">
                <span>Aspekt</span>
                <span>🏢 Ostatní</span>
                <span className="text-sz-red">🔥 SkillZone</span>
            </div>

            <div className="space-y-1">
                {items.map(item => (
                    <React.Fragment key={item.id}>
                        <div className={`grid grid-cols-[120px_1fr_1fr_auto] gap-2 items-center p-2.5 rounded border transition-colors cursor-pointer ${editingId === item.id ? 'bg-sz-red/10 border-sz-red/30' : 'bg-black/30 border-white/5 hover:border-white/10'}`} onClick={() => editingId !== item.id && startEdit(item)}>
                            <span className="text-white text-xs font-bold truncate">{item.aspect}</span>
                            <span className="text-[11px] text-gray-500 truncate">{item.others}</span>
                            <span className="text-[11px] text-green-400 truncate">{item.skillzone}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                {customIds.has(item.id) && <span className="text-[9px] bg-green-500/20 text-green-400 px-1 py-0.5 rounded font-bold">C</span>}
                                <button onClick={e => { e.stopPropagation(); startEdit(item); }} className="p-1 text-gray-500 hover:text-white transition-colors"><Edit3 className="w-3 h-3" /></button>
                                {customIds.has(item.id) && <button onClick={e => { e.stopPropagation(); remove(item.id); }} className="p-1 text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>}
                            </div>
                        </div>
                        {editingId === item.id && renderForm()}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default WhyUsTab;
