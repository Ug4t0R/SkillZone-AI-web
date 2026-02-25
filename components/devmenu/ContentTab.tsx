// DevMenu Content Tab — edit all website text from here
import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw, Search, Globe, Type, CheckCircle, X, Filter, Zap } from 'lucide-react';
import { translations, brainrotOverrides } from '../../translations';
import { Language, useAppContext } from '../../context/AppContext';
import {
    getAllOverrides,
    saveContentOverride,
    deleteContentOverride,
    reloadContentOverrides,
} from '../../services/contentService';

interface ContentTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

// Group keys by prefix (e.g. hero_, loc_, tech_)
function groupKeys(keys: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    for (const key of keys) {
        const prefix = key.split('_')[0] || 'other';
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push(key);
    }
    return groups;
}

const GROUP_LABELS: Record<string, string> = {
    nav: '🧭 Navigace',
    hero: '🏠 Hero Banner',
    loc: '📍 Lokace',
    tech: '⚙️ Tech Specs',
    price: '💰 Ceník',
    about: '📖 O Nás',
    story: '📜 Story',
    why: '🏆 Proč My',
    contact: '📞 Kontakt',
    booking: '📅 Rezervace',
    review: '⭐ Recenze',
    footer: '🔻 Footer',
    seo: '🔍 SEO',
    other: '📋 Ostatní',
};

const ContentTab: React.FC<ContentTabProps> = ({ addLog }) => {
    const { language, allLanguages, isBrainrot, setBrainrot } = useAppContext();
    const [editLang, setEditLang] = useState<Language>(language);
    const [searchQuery, setSearchQuery] = useState('');
    const [editedKeys, setEditedKeys] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [brainrotMode, setBrainrotMode] = useState(false);

    // Brainrot override keys
    const brainrotKeys = useMemo(() => Object.keys(brainrotOverrides), []);

    // All translation keys from default CS translations
    const allKeys = useMemo(() => Object.keys(translations['cs']), []);
    const grouped = useMemo(() => groupKeys(allKeys), [allKeys]);
    const overrides = useMemo(() => getAllOverrides(editLang), [editLang, saving]);

    // Filter keys by search
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return grouped;
        const q = searchQuery.toLowerCase();
        const result: Record<string, string[]> = {};
        for (const [group, keys] of Object.entries(grouped) as [string, string[]][]) {
            const filtered = keys.filter(key => {
                const defaultVal = (translations[editLang] as any)?.[key] || (translations['cs'] as any)?.[key] || '';
                const overrideVal = overrides[key] || '';
                return key.toLowerCase().includes(q) ||
                    defaultVal.toLowerCase().includes(q) ||
                    overrideVal.toLowerCase().includes(q);
            });
            if (filtered.length > 0) result[group] = filtered;
        }
        return result;
    }, [grouped, searchQuery, editLang, overrides]);

    const getDefaultValue = (key: string): string => {
        return (translations[editLang] as any)?.[key] || (translations['cs'] as any)?.[key] || '';
    };

    const getCurrentValue = (key: string): string => {
        if (key in editedKeys) return editedKeys[key];
        if (key in overrides) return overrides[key];
        return getDefaultValue(key);
    };

    const isOverridden = (key: string): boolean => {
        return key in overrides;
    };

    const isEdited = (key: string): boolean => {
        return key in editedKeys;
    };

    const handleChange = (key: string, value: string) => {
        setEditedKeys(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key: string) => {
        const value = editedKeys[key];
        if (value === undefined) return;

        setSaving(true);
        const ok = await saveContentOverride(key, editLang, value);
        if (ok) {
            addLog(`Saved: ${key} (${editLang})`, 'success');
            setEditedKeys(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        } else {
            addLog(`Failed to save: ${key}`, 'error');
        }
        setSaving(false);
    };

    const handleRevert = async (key: string) => {
        const ok = await deleteContentOverride(key, editLang);
        if (ok) {
            addLog(`Reverted to default: ${key} (${editLang})`, 'success');
            setEditedKeys(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        let count = 0;
        for (const [key, value] of Object.entries(editedKeys) as [string, string][]) {
            const ok = await saveContentOverride(key, editLang, value);
            if (ok) count++;
        }
        addLog(`Saved ${count} changes (${editLang}). Reload page to see updates.`, 'success');
        setEditedKeys({});
        setSaving(false);
    };

    const handleReload = async () => {
        await reloadContentOverrides();
        setEditedKeys({});
        addLog('Content reloaded from Supabase.', 'success');
    };

    const editedCount = Object.keys(editedKeys).length;
    const overrideCount = Object.keys(overrides).length;

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-zinc-800/50 p-4 rounded border border-white/5">
                <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2 uppercase">
                    <Type className="w-5 h-5 text-sz-red" /> Content_CMS
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-gray-500">{allKeys.length} keys</span>
                    {overrideCount > 0 && (
                        <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{overrideCount} overrides</span>
                    )}
                    {editedCount > 0 && (
                        <span className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">{editedCount} unsaved</span>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Language selector + GenZ */}
                <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                    {allLanguages.map(lang => (
                        <button
                            key={lang}
                            onClick={() => { setBrainrotMode(false); setEditLang(lang); setEditedKeys({}); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${!brainrotMode && editLang === lang
                                ? 'bg-sz-red text-white'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {lang}
                        </button>
                    ))}
                    <button
                        onClick={() => { setBrainrotMode(true); setEditedKeys({}); }}
                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-1 ${brainrotMode
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Zap className="w-3 h-3" /> GenZ
                    </button>
                </div>

                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Hledat klíč nebo text..."
                        className="w-full bg-black/40 text-white pl-10 pr-4 py-2 rounded-lg text-sm font-mono border border-white/10 focus:border-sz-red/50 outline-none"
                    />
                </div>

                {/* Actions */}
                <button onClick={handleReload} className="bg-white/5 text-gray-400 hover:text-white px-3 py-2 text-xs font-bold uppercase rounded flex items-center gap-1.5 border border-white/10">
                    <RotateCcw className="w-3 h-3" /> Reload
                </button>
                {editedCount > 0 && (
                    <button onClick={handleSaveAll} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs font-bold uppercase rounded flex items-center gap-1.5 disabled:opacity-50">
                        <Save className="w-3 h-3" /> Save All ({editedCount})
                    </button>
                )}
            </div>

            {/* Brainrot Mode Panel */}
            {brainrotMode && (
                <div className="space-y-2">
                    {/* Brainrot status bar */}
                    <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-3">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300 font-bold font-mono">GEN Z BRAINROT MODE</span>
                        <span className="text-[10px] text-gray-500 font-mono">{brainrotKeys.length} override klíčů</span>
                        <div className="flex-1" />
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className={`w-8 h-4 rounded-full flex items-center transition-colors ${isBrainrot ? 'bg-purple-500' : 'bg-white/10'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${isBrainrot ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">
                                {isBrainrot ? '🧠 ACTIVE' : 'OFF'}
                            </span>
                        </label>
                        <button
                            onClick={() => setBrainrot(!isBrainrot)}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${isBrainrot
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                        >
                            {isBrainrot ? 'Deactivate' : 'Activate Live'}
                        </button>
                    </div>

                    {/* Brainrot overrides list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        {brainrotKeys
                            .filter(key => {
                                if (!searchQuery.trim()) return true;
                                const q = searchQuery.toLowerCase();
                                return key.toLowerCase().includes(q)
                                    || ((brainrotOverrides as any)[key] || '').toLowerCase().includes(q)
                                    || ((translations['cs'] as any)[key] || '').toLowerCase().includes(q);
                            })
                            .map(key => (
                                <div key={key} className="bg-zinc-800/30 border border-purple-500/10 rounded-lg px-4 py-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-mono text-purple-400 uppercase">{key}</span>
                                        <span className="text-[9px] text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded font-bold">BRAINROT</span>
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono mb-1.5 truncate">
                                        CS originál: {(translations['cs'] as any)[key] || '(empty)'}
                                    </div>
                                    <input
                                        type="text"
                                        value={(brainrotOverrides as any)[key] || ''}
                                        readOnly
                                        className="w-full bg-black/40 text-purple-300 px-3 py-1.5 rounded text-sm font-mono border border-purple-500/20 outline-none"
                                    />
                                </div>
                            ))}
                    </div>

                    <div className="text-[10px] text-gray-600 font-mono text-center py-2">
                        💡 Brainrot texty se mění v souboru <span className="text-purple-400">translations.ts → brainrotOverrides</span>
                    </div>
                </div>
            )}

            {/* Content groups — only when NOT in brainrot mode */}
            {!brainrotMode && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {(Object.entries(filteredGroups) as [string, string[]][]).map(([group, keys]) => (
                        <div key={group} className="bg-zinc-800/30 border border-white/5 rounded-lg overflow-hidden">
                            {/* Group header */}
                            <button
                                onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
                            >
                                <span className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                    {GROUP_LABELS[group] || `📦 ${group}`}
                                    <span className="text-[10px] text-gray-600 font-mono">({keys.length})</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    {keys.some(k => isOverridden(k)) && (
                                        <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono">
                                            {keys.filter(k => isOverridden(k)).length} custom
                                        </span>
                                    )}
                                    <span className={`text-gray-600 transition-transform ${expandedGroup === group ? 'rotate-90' : ''}`}>▶</span>
                                </div>
                            </button>

                            {/* Keys */}
                            {expandedGroup === group && (
                                <div className="border-t border-white/5 divide-y divide-white/5">
                                    {keys.map(key => (
                                        <div key={key} className={`px-4 py-3 ${isEdited(key) ? 'bg-yellow-500/5' : isOverridden(key) ? 'bg-blue-500/5' : ''}`}>
                                            {/* Key name + status */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-mono text-gray-600 uppercase">{key}</span>
                                                {isOverridden(key) && !isEdited(key) && (
                                                    <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-bold">CUSTOM</span>
                                                )}
                                                {isEdited(key) && (
                                                    <span className="text-[9px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded font-bold">UNSAVED</span>
                                                )}
                                            </div>

                                            {/* Default value */}
                                            <div className="text-[10px] text-gray-600 font-mono mb-1.5 truncate" title={getDefaultValue(key)}>
                                                Default: {getDefaultValue(key) || '(empty)'}
                                            </div>

                                            {/* Editable value */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={getCurrentValue(key)}
                                                    onChange={e => handleChange(key, e.target.value)}
                                                    className="flex-1 bg-black/40 text-white px-3 py-1.5 rounded text-sm font-mono border border-white/10 focus:border-sz-red/50 outline-none"
                                                />
                                                {isEdited(key) && (
                                                    <button
                                                        onClick={() => handleSave(key)}
                                                        disabled={saving}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-[10px] font-bold disabled:opacity-50"
                                                        title="Save this key"
                                                    >
                                                        <Save className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {isOverridden(key) && (
                                                    <button
                                                        onClick={() => handleRevert(key)}
                                                        className="bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 px-2.5 py-1 rounded text-[10px] font-bold border border-white/5"
                                                        title="Revert to default"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {Object.keys(filteredGroups).length === 0 && (
                        <div className="text-center py-12 text-gray-600 font-mono text-sm">
                            No keys match "{searchQuery}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContentTab;
