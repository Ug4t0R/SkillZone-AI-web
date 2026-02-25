import React, { useState, useEffect, useRef } from 'react';
import { Save, RotateCcw, User, Upload, Link, Camera, X } from 'lucide-react';
import { OwnerProfileData } from '../../types';
import { DEFAULT_OWNER_PROFILE_CS } from '../../data/ownerProfile';
import { getOwnerProfile, saveOwnerProfile, resetOwnerProfile } from '../../utils/devTools';

interface OwnerProfileTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const OwnerProfileTab: React.FC<OwnerProfileTabProps> = ({ addLog }) => {
    const [form, setForm] = useState<OwnerProfileData>(DEFAULT_OWNER_PROFILE_CS);
    const [imgMode, setImgMode] = useState<'url' | 'upload'>('url');
    const [urlInput, setUrlInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getOwnerProfile('cs').then(profile => {
            setForm(profile);
            setUrlInput(profile.imgUrl);
        });
    }, []);

    const save = async () => {
        if (!form.name) { addLog('Jméno je povinné', 'error'); return; }
        await saveOwnerProfile(form);
        addLog('Profil uložen ✓', 'success');
    };

    const reset = async () => {
        await resetOwnerProfile();
        setForm(DEFAULT_OWNER_PROFILE_CS);
        setUrlInput(DEFAULT_OWNER_PROFILE_CS.imgUrl);
        addLog('Profil resetován na výchozí', 'success');
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            addLog('Soubor musí být obrázek (JPG, PNG, WebP)', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            addLog('Obrázek je příliš velký (max 2 MB)', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setForm(prev => ({ ...prev, imgUrl: dataUrl }));
            setUrlInput('');
            addLog(`Fotka nahrána: ${file.name}`, 'success');
        };
        reader.readAsDataURL(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const applyUrl = () => {
        if (!urlInput.trim()) { addLog('URL je prázdná', 'error'); return; }
        setForm(prev => ({ ...prev, imgUrl: urlInput.trim() }));
        addLog('URL fotky aplikována', 'success');
    };

    const removePhoto = () => {
        setForm(prev => ({ ...prev, imgUrl: '' }));
        setUrlInput('');
        addLog('Fotka odebrána', 'info');
    };

    const inputCls = "bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-sz-red outline-none w-full";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sz-red" />
                    <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">Vizitka Majitele</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={reset} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-gray-500 hover:text-white border border-white/5 rounded transition-colors"><RotateCcw className="w-3 h-3" /> Reset</button>
                    <button onClick={save} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-white border border-sz-red/30 rounded bg-sz-red hover:bg-sz-red-dark transition-colors"><Save className="w-3 h-3" /> Uložit</button>
                </div>
            </div>

            {/* Photo + Preview section */}
            <div className="bg-black/30 rounded border border-white/5 p-4">
                <div className="flex gap-6">
                    {/* Photo area */}
                    <div className="shrink-0">
                        <div
                            className={`relative w-32 h-32 rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${isDragging ? 'border-sz-red border-dashed bg-sz-red/10 scale-105' : 'border-white/10 hover:border-sz-red/50'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            {form.imgUrl ? (
                                <>
                                    <img src={form.imgUrl} alt={form.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                        <Camera className="w-6 h-6 text-white" />
                                        <span className="text-[10px] text-white font-mono uppercase">Změnit</span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-black/50 gap-2">
                                    <Upload className="w-8 h-8 text-gray-500" />
                                    <span className="text-[10px] text-gray-500 font-mono text-center px-2">Klikni nebo přetáhni</span>
                                </div>
                            )}

                            {/* Remove button */}
                            {form.imgUrl && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            )}
                        </div>

                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

                        {/* Image source toggle */}
                        <div className="flex mt-2 bg-black/50 rounded overflow-hidden border border-white/5">
                            <button
                                onClick={() => setImgMode('upload')}
                                className={`flex-1 flex items-center justify-center gap-1 py-1 text-[9px] font-mono uppercase transition-colors ${imgMode === 'upload' ? 'bg-sz-red text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Upload className="w-3 h-3" /> Soubor
                            </button>
                            <button
                                onClick={() => setImgMode('url')}
                                className={`flex-1 flex items-center justify-center gap-1 py-1 text-[9px] font-mono uppercase transition-colors ${imgMode === 'url' ? 'bg-sz-red text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Link className="w-3 h-3" /> URL
                            </button>
                        </div>

                        {/* URL input */}
                        {imgMode === 'url' && (
                            <div className="mt-2 flex gap-1">
                                <input
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    placeholder="https://..."
                                    className="bg-black/50 border border-white/10 rounded px-2 py-1 text-[11px] text-white font-mono focus:border-sz-red outline-none flex-1 min-w-0"
                                    onKeyDown={e => e.key === 'Enter' && applyUrl()}
                                />
                                <button onClick={applyUrl} className="px-2 py-1 bg-sz-red text-white text-[9px] font-bold uppercase rounded hover:bg-sz-red-dark transition-colors shrink-0">OK</button>
                            </div>
                        )}
                    </div>

                    {/* Profile preview */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="text-white font-bold text-lg">{form.name || 'Jméno'}</div>
                        <div className="text-sz-red font-mono text-sm">"{form.nickname || 'Nickname'}"</div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase mt-1">{form.role || 'Role'}</div>
                        <div className="mt-3 text-[11px] text-gray-400 leading-relaxed line-clamp-3">{form.bio || 'Bio...'}</div>
                        <div className="mt-3 flex gap-4">
                            {form.stats.xp && <div className="text-center"><div className="text-[9px] text-gray-500 font-mono uppercase">XP</div><div className="text-sz-red font-bold text-xs">{form.stats.xp}</div></div>}
                            {form.stats.class && <div className="text-center"><div className="text-[9px] text-gray-500 font-mono uppercase">Class</div><div className="text-sz-red font-bold text-xs">{form.stats.class}</div></div>}
                            {form.stats.ulti && <div className="text-center"><div className="text-[9px] text-gray-500 font-mono uppercase">Ulti</div><div className="text-sz-red font-bold text-xs">{form.stats.ulti}</div></div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form fields */}
            <div className="bg-black/40 border border-sz-red/20 rounded p-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] text-gray-500 font-mono mb-1 block">Jméno</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tomáš Švec" className={inputCls} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-mono mb-1 block">Přezdívka</label>
                        <input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="Ug4t0R" className={inputCls} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-mono mb-1 block">Role</label>
                        <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Founder / Head Admin" className={inputCls} />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-gray-500 font-mono mb-1 block">Bio</label>
                    <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Popis..." rows={3} className={`${inputCls} resize-none`} />
                </div>

                <div>
                    <label className="text-[10px] text-gray-500 font-mono uppercase mb-2 block">⚔️ RPG Stats</label>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] text-gray-500 font-mono mb-1 block">XP</label>
                            <input value={form.stats.xp} onChange={e => setForm({ ...form, stats: { ...form.stats, xp: e.target.value } })} className={inputCls} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 font-mono mb-1 block">Class</label>
                            <input value={form.stats.class} onChange={e => setForm({ ...form, stats: { ...form.stats, class: e.target.value } })} className={inputCls} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 font-mono mb-1 block">Ultimate</label>
                            <input value={form.stats.ulti} onChange={e => setForm({ ...form, stats: { ...form.stats, ulti: e.target.value } })} className={inputCls} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerProfileTab;
