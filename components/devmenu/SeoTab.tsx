// DevMenu SEO Tab — Supabase-backed
import React, { useState, useEffect } from 'react';
import { Globe, Eye, EyeOff } from 'lucide-react';
import { getSitemapConfig, saveSitemapConfig, generateSitemapXML, SitemapEntry } from '../../utils/sitemap';

interface SeoTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const SeoTab: React.FC<SeoTabProps> = ({ addLog }) => {
    const [entries, setEntries] = useState<SitemapEntry[]>([]);

    useEffect(() => {
        getSitemapConfig().then(setEntries);
    }, []);

    const toggleVisibility = async (idx: number) => {
        const updated = entries.map((e, i) => i === idx ? { ...e, visible: !e.visible } : e);
        setEntries(updated);
        await saveSitemapConfig(updated);
        addLog(`Sitemap entry "${entries[idx].label}" visibility toggled`, 'info');
    };

    const xml = generateSitemapXML(entries);

    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
            <div className="bg-zinc-800/50 p-6 rounded-lg border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center gap-2 uppercase">
                    <Globe className="w-5 h-5 text-sz-red" /> Sitemap Config
                </h3>
                <div className="space-y-2">
                    {entries.map((entry, i) => (
                        <div key={entry.path} className="flex items-center justify-between p-3 bg-black/30 rounded border border-white/5">
                            <div>
                                <span className="text-sm text-white font-mono">{entry.path}</span>
                                <span className="text-xs text-gray-500 ml-2">({entry.label})</span>
                                <span className="text-[10px] text-gray-600 ml-2">p:{entry.priority} | {entry.changefreq}</span>
                            </div>
                            <button onClick={() => toggleVisibility(i)} className={entry.visible ? 'text-green-500' : 'text-red-500/50'}>
                                {entry.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-black/60 p-6 rounded-lg border border-white/5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Generated Sitemap Preview</h4>
                <pre className="text-xs text-green-400 overflow-auto max-h-64 custom-scrollbar font-mono whitespace-pre">
                    {xml}
                </pre>
            </div>
        </div>
    );
};

export default SeoTab;
