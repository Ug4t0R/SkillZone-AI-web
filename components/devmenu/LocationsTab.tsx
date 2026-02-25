import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, RotateCcw, MapPin } from 'lucide-react';
import { GamingLocation, LocationType } from '../../types';
import { LOCATIONS_CS } from '../../data/locations';
import { getMergedLocations, addCustomLocation, removeCustomLocation, getCustomLocations, overrideCustomLocations } from '../../utils/devTools';

interface LocationsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const EMPTY: GamingLocation = {
    id: '', name: '', type: LocationType.PUBLIC, address: '', description: '',
    specs: [], imgUrl: '', phone: '', mapLink: '', openHours: '', openYear: '',
    coordinates: { lat: 0, lng: 0 }
};

const LocationsTab: React.FC<LocationsTabProps> = ({ addLog }) => {
    const [items, setItems] = useState<GamingLocation[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<GamingLocation>(EMPTY);
    const [specsText, setSpecsText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const refresh = () => { getMergedLocations(LOCATIONS_CS).then(setItems); };
    useEffect(() => { refresh(); }, []);

    const startEdit = (item: GamingLocation) => {
        setEditingId(item.id);
        setForm({ ...item });
        setSpecsText(item.specs.join('\n'));
        setIsAdding(false);
    };

    const startAdd = () => {
        setForm({ ...EMPTY, id: `loc_${Date.now()}` });
        setSpecsText('');
        setIsAdding(true);
        setEditingId(null);
    };

    const save = async () => {
        if (!form.name || !form.address) { addLog('Name and address required', 'error'); return; }
        const specs = specsText.split('\n').filter(l => l.trim());
        await addCustomLocation({ ...form, specs, isCustom: isAdding ? true : undefined });
        addLog(`${isAdding ? 'Added' : 'Updated'}: ${form.name}`, 'success');
        setEditingId(null); setIsAdding(false); refresh();
    };

    const remove = async (id: string) => { await removeCustomLocation(id); addLog(`Removed: ${id}`, 'info'); refresh(); };
    const resetAll = async () => { await overrideCustomLocations([]); addLog('All custom locations cleared', 'success'); refresh(); };
    const cancel = () => { setEditingId(null); setIsAdding(false); };
    const [customIds, setCustomIds] = useState<Set<string>>(new Set());
    useEffect(() => { getCustomLocations().then(c => setCustomIds(new Set(c.map(i => i.id)))); }, [items]);

    const renderForm = () => (
        <div className="bg-black/40 border border-sz-red/20 rounded p-4 space-y-3 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none col-span-2" />
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as LocationType })} className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none">
                    <option value={LocationType.PUBLIC}>PUBLIC</option>
                    <option value={LocationType.PRIVATE}>PRIVATE</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
            </div>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none resize-none" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input value={form.openHours} onChange={e => setForm({ ...form, openHours: e.target.value })} placeholder="Open Hours" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <input value={form.openYear} onChange={e => setForm({ ...form, openYear: e.target.value })} placeholder="Open Year" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <input value={form.imgUrl} onChange={e => setForm({ ...form, imgUrl: e.target.value })} placeholder="Image URL" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <input value={form.mapLink} onChange={e => setForm({ ...form, mapLink: e.target.value })} placeholder="Map Link" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
            </div>
            <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase mb-1 block">Specs (one per line)</label>
                <textarea value={specsText} onChange={e => setSpecsText(e.target.value)} placeholder="One spec per line..." rows={3} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none resize-none" />
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
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sz-red" />
                    <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">Locations ({items.length})</span>
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
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${item.type === LocationType.PRIVATE ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>{item.type}</span>
                                <span className="text-white text-xs font-bold truncate">{item.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono hidden md:inline truncate">{item.address}</span>
                                {customIds.has(item.id) && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">custom</span>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-gray-500 font-mono mr-2 hidden md:inline">{item.openHours}</span>
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

export default LocationsTab;
