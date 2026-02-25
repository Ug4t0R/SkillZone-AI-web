import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, RotateCcw } from 'lucide-react';
import { ProtocolRule } from '../../types';
import { PROTOCOL_DATA_CS } from '../../data/protocol';
import { getMergedProtocol, addCustomProtocolRule, removeCustomProtocolRule, getCustomProtocol, overrideCustomProtocol } from '../../utils/devTools';

interface ProtocolTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

type Category = 'general' | 'tech' | 'behavior' | 'account';
const CATEGORIES: Category[] = ['general', 'tech', 'behavior', 'account'];
const ICONS = ['utensils', 'cpu', 'user-x', 'credit-card', 'shield', 'book', 'alert-triangle'];
const EMPTY: ProtocolRule = { id: '', title: '', content: [''], icon: 'shield', category: 'general' };

const ProtocolTab: React.FC<ProtocolTabProps> = ({ addLog }) => {
    const [items, setItems] = useState<ProtocolRule[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProtocolRule>(EMPTY);
    const [contentText, setContentText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const refresh = () => { getMergedProtocol(PROTOCOL_DATA_CS).then(setItems); };
    useEffect(() => { refresh(); }, []);

    const startEdit = (item: ProtocolRule) => {
        setEditingId(item.id);
        setForm({ ...item });
        setContentText(item.content.join('\n'));
        setIsAdding(false);
    };

    const startAdd = () => {
        setForm({ ...EMPTY, id: `rule_${Date.now()}` });
        setContentText('');
        setIsAdding(true);
        setEditingId(null);
    };

    const save = async () => {
        if (!form.title) { addLog('Title required', 'error'); return; }
        const bullets = contentText.split('\n').filter(l => l.trim());
        await addCustomProtocolRule({ ...form, content: bullets, isCustom: isAdding ? true : undefined });
        addLog(`${isAdding ? 'Added' : 'Updated'}: ${form.title}`, 'success');
        setEditingId(null); setIsAdding(false); refresh();
    };

    const remove = async (id: string) => { await removeCustomProtocolRule(id); addLog(`Removed: ${id}`, 'info'); refresh(); };
    const resetAll = async () => { await overrideCustomProtocol([]); addLog('All custom rules cleared', 'success'); refresh(); };
    const cancel = () => { setEditingId(null); setIsAdding(false); };
    const [customIds, setCustomIds] = useState<Set<string>>(new Set());
    useEffect(() => { getCustomProtocol().then(c => setCustomIds(new Set(c.map(i => i.id)))); }, [items]);

    const renderForm = () => (
        <div className="bg-black/40 border border-sz-red/20 rounded p-4 space-y-3 mb-4">
            <div className="grid grid-cols-3 gap-3">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Category })} className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none">
                    {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase mb-1 block">Rules (one per line)</label>
                <textarea value={contentText} onChange={e => setContentText(e.target.value)} placeholder="One rule per line..." rows={4} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none resize-none" />
            </div>
            <div className="flex gap-2">
                <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-sz-red text-white text-xs font-bold uppercase rounded hover:bg-sz-red-dark transition-colors"><Save className="w-3 h-3" /> Save</button>
                <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 text-xs font-bold uppercase rounded hover:text-white transition-colors"><X className="w-3 h-3" /> Cancel</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">Protocol ({items.length} rules)</span>
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
                                <span className="text-[10px] text-gray-500 font-mono uppercase w-16 shrink-0">{item.category}</span>
                                <span className="text-white text-xs font-bold truncate">{item.title}</span>
                                <span className="text-[10px] text-gray-500 font-mono hidden md:inline">{item.content.length} bullets</span>
                                {customIds.has(item.id) && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">custom</span>}
                                {item.isCustom && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">new</span>}
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

export default ProtocolTab;
