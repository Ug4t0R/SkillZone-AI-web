import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, RotateCcw, Calendar, EyeOff, Eye } from 'lucide-react';
import { CalendarEvent } from '../../types';
import { EVENTS_DATA_CS } from '../../data/events';
import { getMergedEvents, addCustomEvent, removeCustomEvent, getCustomEvents, overrideCustomEvents } from '../../utils/devTools';

interface EventsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

type EventType = 'tournament' | 'party' | 'promo' | 'stream';
const EVENT_TYPES: EventType[] = ['tournament', 'party', 'promo', 'stream'];
const GAMES = ['CS2', 'LOL', 'FIFA', 'Valorant', 'Fortnite', 'General'];
const EMPTY: CalendarEvent = { id: '', title: '', date: '', time: '', game: 'CS2', type: 'tournament', description: '', capacity: '' };

const TYPE_COLORS: Record<EventType, string> = {
    tournament: 'bg-red-500/20 text-red-400',
    party: 'bg-purple-500/20 text-purple-400',
    promo: 'bg-yellow-500/20 text-yellow-400',
    stream: 'bg-blue-500/20 text-blue-400'
};

const EventsTab: React.FC<EventsTabProps> = ({ addLog }) => {
    const [items, setItems] = useState<CalendarEvent[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CalendarEvent>(EMPTY);
    const [isAdding, setIsAdding] = useState(false);

    const refresh = () => { getMergedEvents(EVENTS_DATA_CS).then(setItems); };
    useEffect(() => { refresh(); }, []);

    const startEdit = (item: CalendarEvent) => {
        setEditingId(item.id);
        setForm({ ...item });
        setIsAdding(false);
    };

    const startAdd = () => {
        setForm({ ...EMPTY, id: `evt_${Date.now()}`, date: new Date().toISOString().split('T')[0] });
        setIsAdding(true);
        setEditingId(null);
    };

    const save = async () => {
        if (!form.title || !form.date) { addLog('Title and date required', 'error'); return; }
        await addCustomEvent({ ...form, isCustom: isAdding ? true : undefined });
        addLog(`${isAdding ? 'Added' : 'Updated'}: ${form.title}`, 'success');
        setEditingId(null); setIsAdding(false); refresh();
    };

    const remove = async (id: string) => { await removeCustomEvent(id); addLog(`Removed: ${id}`, 'info'); refresh(); };
    const resetAll = async () => { await overrideCustomEvents([]); addLog('All custom events cleared', 'success'); refresh(); };
    const cancel = () => { setEditingId(null); setIsAdding(false); };
    const [customIds, setCustomIds] = useState<Set<string>>(new Set());
    useEffect(() => { getCustomEvents().then(c => setCustomIds(new Set(c.map(i => i.id)))); }, [items]);

    const renderForm = () => (
        <div className="bg-black/40 border border-sz-red/20 rounded p-4 space-y-3 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none col-span-2" />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <input value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="Time (18:00)" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select value={form.game} onChange={e => setForm({ ...form, game: e.target.value })} className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none">
                    {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EventType })} className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none">
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={form.capacity || ''} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Capacity" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
                <input value={form.registrationLink || ''} onChange={e => setForm({ ...form, registrationLink: e.target.value })} placeholder="Registration URL" className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none" />
            </div>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none resize-none" />
            <div className="flex gap-2 items-center">
                <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-sz-red text-white text-xs font-bold uppercase rounded hover:bg-sz-red-dark transition-colors"><Save className="w-3 h-3" /> Save</button>
                <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 text-xs font-bold uppercase rounded hover:text-white transition-colors"><X className="w-3 h-3" /> Cancel</button>
                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, hidden: !form.hidden })}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-colors border ${form.hidden
                                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                                : 'border-white/10 bg-white/5 text-gray-500 hover:text-white'
                            }`}
                    >
                        {form.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {form.hidden ? 'Hidden (Draft)' : 'Visible'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sz-red" />
                    <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">Events ({items.length})</span>
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
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[item.type]}`}>{item.type}</span>
                                <span className="text-white text-xs font-bold truncate">{item.title}</span>
                                <span className="text-[10px] text-gray-500 font-mono hidden md:inline">{item.date} {item.time}</span>
                                <span className="text-[10px] text-sz-red font-bold hidden md:inline">{item.game}</span>
                                {customIds.has(item.id) && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">custom</span>}
                                {item.isCustom && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">new</span>}
                                {item.hidden && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase">draft</span>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {item.capacity && <span className="text-[10px] text-gray-500 font-mono mr-2 hidden md:inline">{item.capacity}</span>}
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

export default EventsTab;
