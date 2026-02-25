/**
 * SectionsTab — DevMenu tab for toggling website sections on/off
 * and providing quick-navigation links to all routes.
 */
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ExternalLink, ToggleLeft, ToggleRight, RefreshCw, Layers, Link2, Map } from 'lucide-react';
import { SectionConfig, DEFAULT_SECTIONS, SECTION_META, getSectionConfig, setSectionConfig } from '../../services/sectionConfig';
import { getAllRoutes, RouteEntry } from '../../services/routeConfig';
import { getSetting, setSetting } from '../../services/webDataService';

interface SectionsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

// Extra non-routeConfig routes (admin-only pages etc.)
const EXTRA_ROUTES = [
    { path: '/test', label: 'Test Runner', public: false },
    { path: '/sitemap', label: 'Sitemap', public: false },
];

const SectionsTab: React.FC<SectionsTabProps> = ({ addLog }) => {
    const [config, setConfig] = useState<SectionConfig>(DEFAULT_SECTIONS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [countdownDate, setCountdownDate] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        const cfg = await getSectionConfig();
        setConfig(cfg);
        const date = await getSetting<string>('coming_soon_date', '');
        setCountdownDate(date || '');
        setLoading(false);
        addLog('Sections config loaded');
    };

    const toggleSection = async (key: keyof SectionConfig) => {
        const updated = { ...config, [key]: !config[key] };
        setConfig(updated);
        setSaving(true);
        const ok = await setSectionConfig(updated);
        setSaving(false);
        if (ok) {
            addLog(`Section "${key}" ${updated[key] ? 'enabled' : 'disabled'}`, 'success');
        } else {
            addLog(`Failed to save section "${key}"`, 'error');
        }
    };

    const enableAll = async () => {
        setSaving(true);
        const ok = await setSectionConfig(DEFAULT_SECTIONS);
        if (ok) {
            setConfig(DEFAULT_SECTIONS);
            addLog('All sections enabled', 'success');
        } else {
            addLog('Failed to enable all sections', 'error');
        }
        setSaving(false);
    };

    const navigateTo = (path: string) => {
        window.history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
        // Close DevMenu by dispatching custom event
        window.dispatchEvent(new CustomEvent('devmenu:close'));
    };

    const groups = [
        { id: 'pages' as const, label: 'Pages & Navigation', icon: '📄' },
        { id: 'homepage' as const, label: 'Homepage Sections', icon: '🏠' },
        { id: 'widgets' as const, label: 'Widgets & Overlays', icon: '🎮' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 text-sz-red animate-spin" />
                <span className="text-gray-400 text-sm ml-2 font-mono">Loading config...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-sz-red" />
                    <h3 className="text-white font-bold font-orbitron text-sm uppercase">Section Control</h3>
                </div>
                <div className="flex items-center gap-2">
                    {saving && <span className="text-[10px] text-yellow-400 font-mono animate-pulse">SAVING...</span>}
                    <button
                        onClick={enableAll}
                        className="text-[10px] font-mono text-gray-400 hover:text-white px-2 py-1 border border-white/10 rounded hover:bg-white/5 transition-all uppercase"
                    >
                        Enable All
                    </button>
                    <button
                        onClick={loadConfig}
                        className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Section toggles by group */}
            {groups.map(group => {
                const items = SECTION_META.filter(s => s.group === group.id);
                const enabled = items.filter(s => config[s.id]).length;

                return (
                    <div key={group.id}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm">{group.icon}</span>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.label}</h4>
                            <span className="text-[10px] font-mono text-gray-600 ml-auto">
                                {enabled}/{items.length} active
                            </span>
                        </div>
                        <div className="space-y-1">
                            {items.map(section => {
                                const isOn = config[section.id];
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => toggleSection(section.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${isOn
                                            ? 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10'
                                            : 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isOn ? (
                                                <Eye className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-red-400" />
                                            )}
                                            <div className="text-left">
                                                <div className={`text-xs font-bold ${isOn ? 'text-white' : 'text-gray-500'}`}>
                                                    {section.label}
                                                </div>
                                                <div className="text-[10px] text-gray-600 font-mono">{section.description}</div>
                                            </div>
                                        </div>
                                        {isOn ? (
                                            <ToggleRight className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5 text-red-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Coming Soon Config (when enabled) */}
            {config.comingSoon && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🚀</span>
                        <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Coming Soon — Countdown</h4>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-[10px] text-gray-500 font-mono uppercase shrink-0">Cílové datum:</label>
                        <input
                            type="datetime-local"
                            value={countdownDate}
                            onChange={async (e) => {
                                const val = e.target.value;
                                setCountdownDate(val);
                                const ok = await setSetting('coming_soon_date', val ? new Date(val).toISOString() : '');
                                addLog(ok ? `Countdown set to ${val}` : 'Failed to save countdown', ok ? 'success' : 'error');
                            }}
                            className="bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-orange-500/40 focus:outline-none flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setCountdownDate(''); setSetting('coming_soon_date', ''); addLog('Countdown cleared', 'success'); }}
                            className="text-[10px] font-mono text-gray-500 hover:text-white px-2 py-1 border border-white/10 rounded hover:bg-white/5 transition-all"
                        >
                            ✕ Clear Date
                        </button>
                        <button
                            onClick={() => navigateTo('/?comingsoon')}
                            className="text-[10px] font-mono text-orange-400 hover:text-white px-2 py-1 border border-orange-500/20 rounded hover:bg-orange-500/10 transition-all"
                        >
                            👁 Preview
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono">
                        Zapnuto = návštěvníci vidí Coming Soon místo webu. Admin vidí normálně.
                    </p>
                </div>
            )}

            {/* Quick Navigation */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Navigation</h4>
                </div>

                <div className="grid grid-cols-2 gap-1">
                    {getAllRoutes().map(route => (
                        <button
                            key={route.canonical}
                            onClick={() => navigateTo(route.canonical)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5"
                        >
                            <ExternalLink className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="text-xs font-bold text-white">{route.view}</div>
                                <div className="text-[10px] font-mono text-gray-500 truncate">
                                    {route.canonical}
                                    {route.aliases.length > 0 && (
                                        <span className="text-gray-600 ml-1">
                                            ({route.aliases.join(', ')})
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                    {EXTRA_ROUTES.map(route => (
                        <button
                            key={route.path}
                            onClick={() => navigateTo(route.path)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all border border-yellow-500/10 hover:border-yellow-500/30 hover:bg-yellow-500/5"
                        >
                            <ExternalLink className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                            <div>
                                <div className="text-xs font-bold text-white">{route.label}</div>
                                <div className="text-[10px] font-mono text-yellow-500/60">
                                    {route.path} 🔒
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SectionsTab;
