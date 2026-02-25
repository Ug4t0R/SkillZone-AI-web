import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, RotateCcw, Wrench } from 'lucide-react';
import { SERVICES_DATA_CS } from '../../data/services';
import { getSetting, setSetting } from '../../services/webDataService';

interface ServicesTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

interface Service {
    id: string;
    title: string;
    desc: string;
    icon: string;
    isCustom?: boolean;
}

const ICONS = ['server', 'video', 'trophy', 'gamepad', 'monitor', 'zap', 'globe', 'headphones'];
const EMPTY: Service = { id: '', title: '', desc: '', icon: 'server' };
const SERVICES_KEY = 'custom_services';

const withIds = (arr: typeof SERVICES_DATA_CS): Service[] =>
    arr.map((s, i) => ({ ...s, id: `svc_${i}` }));

const ServicesTab: React.FC<ServicesTabProps> = ({ addLog }) => {
    const [items, setItems] = useState<Service[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Service>(EMPTY);
    const [isAdding, setIsAdding] = useState(false);
    const [customServices, setCustomServices] = useState<Service[]>([]);

    const loadAndMerge = async () => {
        const custom = await getSetting<Service[]>(SERVICES_KEY, []);
        setCustomServices(custom);
        const base = withIds(SERVICES_DATA_CS);
        const customMap = new Map(custom.map(s => [s.id, s]));
        const merged = base.map(item => {
            if (customMap.has(item.id)) { const c = customMap.get(item.id)!; customMap.delete(item.id); return { ...c, isCustom: false }; }
            return item;
        });
        const additions = Array.from(customMap.values()).map(s => ({ ...s, isCustom: true }));
        setItems([...merged, ...additions]);
    };

    useEffect(() => { loadAndMerge(); }, []);

    const startEdit = (item: Service) => { setEditingId(item.id); setForm({ ...item }); setIsAdding(false); };
    const startAdd = () => { setForm({ ...EMPTY, id: `svc_custom_${Date.now()}` }); setIsAdding(true); setEditingId(null); };
    const cancel = () => { setEditingId(null); setIsAdding(false); };

    const save = async () => {
        if (!form.title) { addLog('Title required', 'error'); return; }
        const current = [...customServices];
        const idx = current.findIndex(s => s.id === form.id);
        if (idx >= 0) current[idx] = form; else current.push(form);
        await setSetting(SERVICES_KEY, current);
        addLog(`${isAdding ? 'Added' : 'Updated'}: ${form.title}`, 'success');
        setEditingId(null); setIsAdding(false); await loadAndMerge();
    };

    const remove = async (id: string) => { await setSetting(SERVICES_KEY, customServices.filter(s => s.id !== id)); addLog(`Removed: ${id}`, 'info'); await loadAndMerge(); };
    const resetAll = async () => { await setSetting(SERVICES_KEY, []); addLog('Services reset', 'success'); await loadAndMerge(); };
    const customIds = new Set(customServices.map(s => s.id));

    const renderForm = () => (
        <div className="bg-black/40 border border-sz-red/20 rounded p-4 space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none">
                    {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
            </div>
            <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Description" rows={3} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none resize-none" />
            <div className="flex gap-2">
                <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-sz-red text-white text-xs font-bold uppercase rounded hover:bg-sz-red-dark transition-colors"><Save className="w-3 h-3" /> Save</button>
                <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 text-xs font-bold uppercase rounded hover:text-white transition-colors"><X className="w-3 h-3" /> Cancel</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-sz-red" />
                    <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">Services ({items.length})</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={resetAll} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-gray-500 hover:text-white border border-white/5 rounded transition-colors"><RotateCcw className="w-3 h-3" /> Reset</button>
                    <button onClick={startAdd} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-sz-red hover:text-white border border-sz-red/30 rounded hover:bg-sz-red transition-colors"><Plus className="w-3 h-3" /> Add</button>
                </div>
            </div>

            {isAdding && renderForm()}

            <div className="space-y-1">
                {items.map(item => (
                    <React.Fragment key={item.id}>
                        <div className={`flex items-center justify-between p-2.5 rounded border transition-colors cursor-pointer ${editingId === item.id ? 'bg-sz-red/10 border-sz-red/30' : 'bg-black/30 border-white/5 hover:border-white/10'}`} onClick={() => editingId !== item.id && startEdit(item)}>
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="text-[10px] text-gray-500 font-mono uppercase w-16 shrink-0">{item.icon}</span>
                                <span className="text-white text-xs font-bold truncate">{item.title}</span>
                                <span className="text-[10px] text-gray-500 truncate hidden md:inline">{item.desc.substring(0, 70)}...</span>
                                {customIds.has(item.id) && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">custom</span>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
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

export default ServicesTab;
