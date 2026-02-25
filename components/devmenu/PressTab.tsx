import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, Star, ExternalLink, Filter, RotateCcw } from 'lucide-react';
import { PRESS_ITEMS, PRESS_CATEGORIES, PressCategory, PressItem } from '../../data/pressArticles';
import { getMergedPress, addCustomPressItem, removeCustomPressItem, getCustomPress, overrideCustomPress } from '../../utils/devTools';

interface PressTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const CATEGORIES: PressCategory[] = ['tv', 'press', 'gaming', 'esport', 'video', 'radio', 'social', 'partner'];

const EMPTY: PressItem = {
    id: '', source: '', title: '', titleEn: '', description: '', descriptionEn: '',
    url: '', date: '', year: new Date().getFullYear(), category: 'press', logo: '', highlight: false
};

const PressTab: React.FC<PressTabProps> = ({ addLog }) => {
    const [items, setItems] = useState<PressItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PressItem>(EMPTY);
    const [isAdding, setIsAdding] = useState(false);
    const [filterCat, setFilterCat] = useState<PressCategory | 'all'>('all');
    const [customIds, setCustomIds] = useState<Set<string>>(new Set());

    const refresh = async () => {
        const merged = await getMergedPress(PRESS_ITEMS);
        setItems(merged);
        const custom = await getCustomPress();
        setCustomIds(new Set(custom.map(i => i.id)));
    };

    useEffect(() => { refresh(); }, []);

    const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat);
    const sorted = [...filtered].sort((a, b) => {
        if (a.highlight && !b.highlight) return -1;
        if (!a.highlight && b.highlight) return 1;
        return b.year - a.year;
    });

    const startEdit = (item: PressItem) => {
        setEditingId(item.id);
        setForm({ ...item });
        setIsAdding(false);
    };

    const startAdd = () => {
        setForm({ ...EMPTY, id: `press_${Date.now()}` });
        setIsAdding(true);
        setEditingId(null);
    };

    const save = async () => {
        if (!form.source || !form.title) { addLog('Source and Title required', 'error'); return; }
        await addCustomPressItem({ ...form, isCustom: isAdding ? true : undefined } as any);
        addLog(`${isAdding ? 'Added' : 'Updated'}: ${form.source} — ${form.title}`, 'success');
        setEditingId(null);
        setIsAdding(false);
        refresh();
    };

    const remove = async (id: string) => {
        await removeCustomPressItem(id);
        addLog(`Removed press item: ${id}`, 'info');
        refresh();
    };

    const toggleHighlight = async (item: PressItem) => {
        await addCustomPressItem({ ...item, highlight: !item.highlight });
        addLog(`${!item.highlight ? 'Highlighted' : 'Unhighlighted'}: ${item.source}`, 'success');
        refresh();
    };

    const resetAll = async () => {
        await overrideCustomPress([]);
        addLog('All custom press data cleared', 'success');
        refresh();
    };

    const cancel = () => { setEditingId(null); setIsAdding(false); };

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'pressArticles.json'; a.click();
        URL.revokeObjectURL(url);
        addLog(`Exported ${items.length} press items`, 'success');
    };

    const renderForm = () => (
        <div className="bg-black/40 border border-sz-red/20 rounded p-4 space-y-3 mb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Source (e.g. Lupa.cz)"
                    className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as PressCategory })}
                    className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{PRESS_CATEGORIES[c].emoji} {c}</option>)}
                </select>
                <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="Date display (e.g. 2023)"
                    className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <input value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) || 0 })} placeholder="Year (sort)" type="number"
                    className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
            </div>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title (CZ)"
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
            <input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} placeholder="Title (EN)"
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (CZ)" rows={2}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none resize-none" />
            <textarea value={form.descriptionEn} onChange={e => setForm({ ...form, descriptionEn: e.target.value })} placeholder="Description (EN)" rows={2}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none resize-none" />
            <div className="grid grid-cols-2 gap-3">
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="URL (full link)"
                    className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <input value={form.logo || ''} onChange={e => setForm({ ...form, logo: e.target.value })} placeholder="Logo/Favicon URL (optional)"
                    className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.highlight || false} onChange={e => setForm({ ...form, highlight: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-yellow-500" />
                <span className="text-xs text-gray-400 font-mono">⭐ Highlight / Featured</span>
            </label>
            <div className="flex gap-2">
                <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-sz-red text-white text-xs font-bold uppercase rounded hover:bg-sz-red-dark transition-colors"><Save className="w-3 h-3" /> Save</button>
                <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 text-xs font-bold uppercase rounded hover:text-white transition-colors"><X className="w-3 h-3" /> Cancel</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">Press & Media ({items.length} items)</span>
                <div className="flex gap-2">
                    <button onClick={resetAll} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-gray-500 hover:text-white border border-white/5 rounded transition-colors"><RotateCcw className="w-3 h-3" /> Reset</button>
                    <button onClick={exportJson} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-gray-500 hover:text-white border border-white/5 rounded transition-colors">📦 Export</button>
                    <button onClick={startAdd} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-sz-red hover:text-white border border-sz-red/30 rounded hover:bg-sz-red transition-colors"><Plus className="w-3 h-3" /> Add</button>
                </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3 h-3 text-gray-600" />
                {(['all', ...CATEGORIES] as (PressCategory | 'all')[]).map(cat => (
                    <button key={cat} onClick={() => setFilterCat(cat)}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm transition-colors ${filterCat === cat
                                ? 'text-sz-red bg-sz-red/10 border border-sz-red/30'
                                : 'text-gray-600 hover:text-white border border-transparent'
                            }`}>
                        {cat === 'all' ? 'All' : `${PRESS_CATEGORIES[cat].emoji} ${cat}`}
                    </button>
                ))}
            </div>

            {isAdding && renderForm()}

            <div className="space-y-1">
                {sorted.map(item => {
                    const cat = PRESS_CATEGORIES[item.category];
                    return (
                        <React.Fragment key={item.id}>
                            <div className={`flex items-center justify-between p-2.5 rounded border transition-colors cursor-pointer ${editingId === item.id
                                    ? 'bg-sz-red/10 border-sz-red/30'
                                    : 'bg-black/30 border-white/5 hover:border-white/10'
                                }`} onClick={() => editingId !== item.id && startEdit(item)}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${cat.color}`}>
                                        {cat.emoji}
                                    </span>
                                    <span className="text-white text-xs font-bold truncate">{item.source}</span>
                                    <span className="text-gray-500 text-[11px] truncate hidden md:inline">{item.title}</span>
                                    <span className="text-gray-600 font-mono text-[10px] shrink-0">{item.date || item.year}</span>
                                    {item.highlight && <Star className="w-3 h-3 text-yellow-500 shrink-0 fill-yellow-500" />}
                                    {customIds.has(item.id) && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">db</span>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {item.url && (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                            className="p-1 text-gray-600 hover:text-blue-400 transition-colors">
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                    <button onClick={e => { e.stopPropagation(); toggleHighlight(item); }}
                                        className={`p-1 transition-colors ${item.highlight ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'}`}>
                                        <Star className="w-3 h-3" />
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); startEdit(item); }}
                                        className="p-1 text-gray-500 hover:text-white transition-colors"><Edit3 className="w-3 h-3" /></button>
                                    <button onClick={e => { e.stopPropagation(); remove(item.id); }}
                                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                            {editingId === item.id && renderForm()}
                        </React.Fragment>
                    );
                })}
            </div>

            {sorted.length === 0 && (
                <div className="text-center py-10 text-gray-600 font-mono text-xs">
                    No press items in this category.
                </div>
            )}
        </div>
    );
};

export default PressTab;
