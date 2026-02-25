import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Camera, Eye, EyeOff, Trash2, Plus, RotateCcw, Tag, MapPin,
    Upload, Link2, Search, Filter, GripVertical, X, Check,
    ChevronDown, ChevronUp, Image as ImageIcon, AlertTriangle
} from 'lucide-react';
import {
    GalleryItem, getGalleryItems, saveGalleryItems, addGalleryItem,
    removeGalleryItem, DEFAULT_GALLERY_CS, GALLERY_CATEGORIES, GALLERY_SECTIONS
} from '../../data/gallery';
import { uploadPhoto, deletePhoto, fileToDataUrl, checkStorageBucket } from '../../services/photoStorage';

interface GalleryTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

// ─── Tag colors (rotating palette) ──────────────────────────────────

const TAG_COLORS = [
    'bg-red-500/20 text-red-400 border-red-500/30',
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
];

function tagColor(tag: string): string {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// ─── Component ──────────────────────────────────────────────────────

const GalleryTab: React.FC<GalleryTabProps> = ({ addLog }) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [hasBucket, setHasBucket] = useState<boolean | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [addMode, setAddMode] = useState<'upload' | 'url'>('upload');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterSection, setFilterSection] = useState('all');

    // Form for URL mode
    const [urlForm, setUrlForm] = useState({ src: '', alt: '', category: 'atmosphere' as GalleryItem['category'], location: '' });

    // Drag reorder
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Load ───────────────────────────────────────────────────────

    useEffect(() => {
        getGalleryItems().then(setItems);
        checkStorageBucket().then(setHasBucket);
    }, []);

    const refresh = async () => {
        setItems(await getGalleryItems());
    };

    // ─── Upload handler ─────────────────────────────────────────────

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        if (uploading) return;
        setUploading(true);
        const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (fileArr.length === 0) {
            addLog('No image files found', 'error');
            setUploading(false);
            return;
        }

        let successCount = 0;
        for (const file of fileArr) {
            const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
            let src: string;
            let storagePath: string | undefined;

            if (hasBucket) {
                const result = await uploadPhoto(file);
                if (result) {
                    src = result.url;
                    storagePath = result.path;
                } else {
                    addLog(`Upload failed: ${file.name}`, 'error');
                    continue;
                }
            } else {
                // Fallback to data URL
                src = await fileToDataUrl(file);
            }

            const newItem: GalleryItem = {
                id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                src,
                alt: name,
                category: 'atmosphere',
                date: new Date().toISOString().slice(0, 10),
                visible: true,
                tags: [],
                sections: ['gallery'],
                sort_order: items.length + successCount,
                storage_path: storagePath,
            };
            await addGalleryItem(newItem);
            successCount++;
        }

        await refresh();
        addLog(`${successCount} photo(s) added`, 'success');
        setUploading(false);
    }, [uploading, hasBucket, items.length, addLog]);

    // ─── URL add handler ────────────────────────────────────────────

    const handleAddUrl = async () => {
        if (!urlForm.src || !urlForm.alt) return;
        const newItem: GalleryItem = {
            id: `g_${Date.now()}`,
            src: urlForm.src,
            alt: urlForm.alt,
            category: urlForm.category,
            location: urlForm.location || undefined,
            date: new Date().toISOString().slice(0, 10),
            visible: true,
            tags: [],
            sections: ['gallery'],
            sort_order: items.length,
        };
        await addGalleryItem(newItem);
        await refresh();
        setUrlForm({ src: '', alt: '', category: 'atmosphere', location: '' });
        addLog(`Photo added: ${urlForm.alt}`, 'success');
    };

    // ─── Item actions ───────────────────────────────────────────────

    const toggleVisibility = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const updated = { ...item, visible: !item.visible };
        await addGalleryItem(updated);
        await refresh();
        addLog(`"${item.alt}" ${updated.visible ? 'shown' : 'hidden'}`, 'info');
    };

    const handleDelete = async (item: GalleryItem) => {
        if (item.storage_path) {
            await deletePhoto(item.storage_path);
        }
        await removeGalleryItem(item.id);
        await refresh();
        addLog(`"${item.alt}" deleted`, 'success');
    };

    const updateItem = async (item: GalleryItem) => {
        await addGalleryItem(item);
        setItems(prev => prev.map(i => i.id === item.id ? item : i));
    };

    const resetDefaults = async () => {
        await saveGalleryItems([...DEFAULT_GALLERY_CS]);
        await refresh();
        addLog('Gallery reset to defaults', 'success');
    };

    // ─── Tag helpers ────────────────────────────────────────────────

    const addTag = (item: GalleryItem, tag: string) => {
        const trimmed = tag.trim().toLowerCase();
        if (!trimmed || item.tags?.includes(trimmed)) return;
        updateItem({ ...item, tags: [...(item.tags || []), trimmed] });
    };

    const removeTag = (item: GalleryItem, tag: string) => {
        updateItem({ ...item, tags: (item.tags || []).filter(t => t !== tag) });
    };

    // ─── Section assign helpers ─────────────────────────────────────

    const toggleSection = (item: GalleryItem, sectionId: string) => {
        const current = item.sections || [];
        const next = current.includes(sectionId)
            ? current.filter(s => s !== sectionId)
            : [...current, sectionId];
        updateItem({ ...item, sections: next });
    };

    // ─── Drag reorder ───────────────────────────────────────────────

    const handleDragEnd = async () => {
        if (dragIdx === null || dragOverIdx === null || dragIdx === dragOverIdx) {
            setDragIdx(null);
            setDragOverIdx(null);
            return;
        }
        const reordered = [...filteredItems];
        const [moved] = reordered.splice(dragIdx, 1);
        reordered.splice(dragOverIdx, 0, moved);
        const updated = reordered.map((item, i) => ({ ...item, sort_order: i }));
        setItems(prev => {
            const map = new Map(updated.map(u => [u.id, u]));
            return prev.map(i => map.get(i.id) || i).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        });
        await saveGalleryItems(updated);
        addLog('Photos reordered', 'info');
        setDragIdx(null);
        setDragOverIdx(null);
    };

    // ─── Filtering ──────────────────────────────────────────────────

    const filteredItems = items
        .filter(i => {
            if (filterCategory !== 'all' && i.category !== filterCategory) return false;
            if (filterSection !== 'all' && !(i.sections || []).includes(filterSection)) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesText = i.alt.toLowerCase().includes(q) ||
                    (i.location || '').toLowerCase().includes(q) ||
                    (i.tags || []).some(t => t.includes(q));
                if (!matchesText) return false;
            }
            return true;
        })
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    // ─── Styles ─────────────────────────────────────────────────────

    const inputCls = 'w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-red-500/50 outline-none';
    const btnSmall = 'p-1 rounded transition-colors';

    // ─── Render ─────────────────────────────────────────────────────

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-red-500" />
                    <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">Photo Manager</span>
                    <span className="text-[10px] text-gray-600 font-mono">({items.length} items)</span>
                    {hasBucket === false && (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-500/70 font-mono">
                            <AlertTriangle className="w-3 h-3" /> no bucket
                        </span>
                    )}
                </div>
                <button onClick={resetDefaults} className="flex items-center gap-1 text-[10px] font-mono text-gray-500 hover:text-red-500 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
            </div>

            {/* Upload / Add Zone */}
            <div className="bg-black/20 border border-white/5 rounded-lg overflow-hidden">
                {/* Mode tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setAddMode('upload')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono uppercase transition-colors ${addMode === 'upload' ? 'bg-red-500/10 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                    <button
                        onClick={() => setAddMode('url')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono uppercase transition-colors ${addMode === 'url' ? 'bg-red-500/10 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Link2 className="w-3.5 h-3.5" /> URL
                    </button>
                </div>

                <div className="p-3">
                    {addMode === 'upload' ? (
                        /* Drop zone */
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${dragOver
                                    ? 'border-red-500 bg-red-500/10'
                                    : uploading
                                        ? 'border-yellow-500/30 bg-yellow-500/5'
                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                }`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={e => e.target.files && handleFiles(e.target.files)}
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-yellow-500 font-mono">Uploading...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className={`w-6 h-6 ${dragOver ? 'text-red-400' : 'text-gray-500'}`} />
                                    <span className="text-xs text-gray-400 font-mono">
                                        Drop photos here or <span className="text-red-400 underline">browse</span>
                                    </span>
                                    <span className="text-[10px] text-gray-600 font-mono">JPG, PNG, WebP, GIF — max 10MB each</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* URL form */
                        <div className="space-y-2">
                            <input value={urlForm.src} onChange={e => setUrlForm({ ...urlForm, src: e.target.value })} placeholder="Image URL" className={inputCls} />
                            <input value={urlForm.alt} onChange={e => setUrlForm({ ...urlForm, alt: e.target.value })} placeholder="Description" className={inputCls} />
                            <div className="flex gap-2">
                                <select value={urlForm.category} onChange={e => setUrlForm({ ...urlForm, category: e.target.value as GalleryItem['category'] })} className={inputCls}>
                                    {GALLERY_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                        <option key={c.id} value={c.id}>{c.label_en}</option>
                                    ))}
                                </select>
                                <input value={urlForm.location} onChange={e => setUrlForm({ ...urlForm, location: e.target.value })} placeholder="Location" className={inputCls} />
                            </div>
                            <button onClick={handleAddUrl} disabled={!urlForm.src || !urlForm.alt} className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 text-xs font-bold rounded transition-colors disabled:opacity-30 flex items-center justify-center gap-1">
                                <Plus className="w-3 h-3" /> Add Photo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[140px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-black/30 border border-white/10 rounded pl-6 pr-2 py-1.5 text-xs text-white font-mono focus:border-red-500/50 outline-none"
                    />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={`${inputCls} w-auto min-w-[100px]`}>
                    {GALLERY_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label_en}</option>
                    ))}
                </select>
                <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className={`${inputCls} w-auto min-w-[100px]`}>
                    <option value="all">All Sections</option>
                    {GALLERY_SECTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Items Grid */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-gray-600 font-mono text-xs italic border-2 border-dashed border-white/5 rounded-lg">
                        {items.length === 0 ? 'No photos yet. Upload or add via URL.' : 'No photos match filters.'}
                    </div>
                )}
                {filteredItems.map((item, idx) => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                        onDragEnd={handleDragEnd}
                        className={`bg-black/30 rounded-lg border transition-all ${dragOverIdx === idx ? 'border-red-500/50 bg-red-500/5' :
                                item.visible === false ? 'border-white/5 opacity-50' :
                                    'border-white/5 hover:border-white/10'
                            }`}
                    >
                        {/* Main row */}
                        <div className="flex items-center gap-2 p-2">
                            <GripVertical className="w-3.5 h-3.5 text-gray-600 cursor-grab flex-shrink-0" />
                            <img
                                src={item.src}
                                alt={item.alt}
                                className="w-12 h-12 object-cover rounded flex-shrink-0 border border-white/10"
                                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/111/E31E24?text=?'; }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-white truncate">{item.alt}</div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                                    <span className="flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" /> {item.category}</span>
                                    {item.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {item.location}</span>}
                                    {(item.tags?.length ?? 0) > 0 && (
                                        <span className="text-gray-600">{item.tags!.length} tags</span>
                                    )}
                                    {(item.sections?.length ?? 0) > 0 && (
                                        <span className="text-gray-600">{item.sections!.length} sections</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className={`${btnSmall} text-gray-500 hover:text-white`}>
                                    {expandedId === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => toggleVisibility(item.id)} className={`${btnSmall} ${item.visible !== false ? 'text-green-500' : 'text-red-500/50'}`}>
                                    {item.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => handleDelete(item)} className={`${btnSmall} text-gray-500 hover:text-red-500`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Expanded detail panel */}
                        {expandedId === item.id && (
                            <div className="border-t border-white/5 p-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                                {/* Editable fields */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-mono uppercase">Name</label>
                                        <input
                                            value={item.alt}
                                            onChange={e => updateItem({ ...item, alt: e.target.value })}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-mono uppercase">Location</label>
                                        <input
                                            value={item.location || ''}
                                            onChange={e => updateItem({ ...item, location: e.target.value || undefined })}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-mono uppercase">Category</label>
                                        <select
                                            value={item.category}
                                            onChange={e => updateItem({ ...item, category: e.target.value as GalleryItem['category'] })}
                                            className={inputCls}
                                        >
                                            {GALLERY_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                                <option key={c.id} value={c.id}>{c.label_en}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-mono uppercase">Date</label>
                                        <input
                                            type="date"
                                            value={item.date || ''}
                                            onChange={e => updateItem({ ...item, date: e.target.value || undefined })}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="text-[10px] text-gray-500 font-mono uppercase mb-1 block">Tags</label>
                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                        {(item.tags || []).map(tag => (
                                            <span key={tag} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono border ${tagColor(tag)}`}>
                                                {tag}
                                                <button onClick={() => removeTag(item, tag)} className="hover:text-white ml-0.5"><X className="w-2.5 h-2.5" /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        placeholder="Add tag (Enter)"
                                        className={inputCls}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                addTag(item, (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                    />
                                </div>

                                {/* Section assignments */}
                                <div>
                                    <label className="text-[10px] text-gray-500 font-mono uppercase mb-1 block">Assign to sections</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {GALLERY_SECTIONS.map(sec => {
                                            const active = (item.sections || []).includes(sec.id);
                                            return (
                                                <button
                                                    key={sec.id}
                                                    onClick={() => toggleSection(item, sec.id)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all ${active
                                                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                            : 'bg-black/20 text-gray-500 border-white/5 hover:border-white/15'
                                                        }`}
                                                >
                                                    {active ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                                                    {sec.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Image preview */}
                                <div className="bg-black/40 rounded border border-white/5 p-2">
                                    <img
                                        src={item.src}
                                        alt={item.alt}
                                        className="w-full max-h-48 object-contain rounded"
                                        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x200/111/E31E24?text=Error'; }}
                                    />
                                    {item.storage_path && (
                                        <div className="text-[10px] text-gray-600 font-mono mt-1 truncate">
                                            📦 {item.storage_path}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Stats bar */}
            <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono border-t border-white/5 pt-2">
                <span>{filteredItems.length} / {items.length} shown</span>
                <span>{items.filter(i => i.visible !== false).length} visible</span>
                <span>{items.filter(i => i.storage_path).length} uploaded</span>
            </div>
        </div>
    );
};

export default GalleryTab;
