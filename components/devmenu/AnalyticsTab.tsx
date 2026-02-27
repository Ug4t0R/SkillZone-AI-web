// DevMenu Analytics Tab — live stats, visitor tracking, behavior analysis
import React, { useState, useEffect } from 'react';
import { Activity, Users, Globe, Monitor, Clock, TrendingUp, Zap, BarChart3, RefreshCw, Settings2, Save, Wifi, Trash2 } from 'lucide-react';
import { getSupabase } from '../../services/supabaseClient';
import { getSetting, setSetting } from '../../services/webDataService';

interface AnalyticsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

interface LiveStats {
    liveVisitors: number;
    todayViews: number;
    todaySessions: number;
    avgSessionDuration: number;
    topSections: { section: string; count: number }[];
    topPages: { page: string; count: number }[];
    languages: { lang: string; count: number }[];
    devices: { device: string; count: number }[];
    browsers: { browser: string; count: number }[];
    recentEvents: any[];
    liveVisitorDetails: { session_id: string; page_path: string; device: string; language: string; last_seen: string }[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ addLog }) => {
    const [stats, setStats] = useState<LiveStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [gaId, setGaId] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        loadStats();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const saved = await getSetting<string>('ga4_measurement_id', '');
        setGaId(saved);
    };

    const saveGaId = async () => {
        const ok = await setSetting('ga4_measurement_id', gaId);
        if (ok) {
            addLog('GA4 Measurement ID saved. Reload page to apply.', 'success');
        } else {
            addLog('Failed to save GA4 ID.', 'error');
        }
    };

    const loadStats = async () => {
        setLoading(true);
        try {
            const sb = getSupabase();
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

            // Live visitors (heartbeat within 5 min)
            const { data: liveData } = await sb
                .from('web_visitors')
                .select('*')
                .gte('last_seen', fiveMinAgo)
                .eq('is_active', true)
                .order('last_seen', { ascending: false });

            // Today's analytics events
            const { data: todayEvents } = await sb
                .from('web_analytics')
                .select('*')
                .gte('timestamp', todayStart)
                .order('timestamp', { ascending: false })
                .limit(500);

            const events = todayEvents || [];
            const live = liveData || [];

            // Compute stats
            const pageViews = events.filter(e => e.event_type === 'page_view');
            const sectionViews = events.filter(e => e.event_type === 'section_view');
            const uniqueSessions = new Set(events.map(e => e.session_id));

            // Section popularity
            const sectionCounts: Record<string, number> = {};
            sectionViews.forEach(e => {
                const s = e.event_data?.section || 'unknown';
                sectionCounts[s] = (sectionCounts[s] || 0) + 1;
            });
            const topSections = Object.entries(sectionCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([section, count]) => ({ section, count }));

            // Page popularity
            const pageCounts: Record<string, number> = {};
            pageViews.forEach(e => {
                const p = e.event_data?.view || e.page_path || 'unknown';
                pageCounts[p] = (pageCounts[p] || 0) + 1;
            });
            const topPages = Object.entries(pageCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([page, count]) => ({ page, count }));

            // Language breakdown
            const langCounts: Record<string, number> = {};
            events.forEach(e => {
                const l = e.language || 'unknown';
                langCounts[l] = (langCounts[l] || 0) + 1;
            });
            const languages = Object.entries(langCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([lang, count]) => ({ lang, count }));

            // Device breakdown
            const deviceCounts: Record<string, number> = {};
            events.forEach(e => {
                const d = e.device || 'unknown';
                deviceCounts[d] = (deviceCounts[d] || 0) + 1;
            });
            const devices = Object.entries(deviceCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([device, count]) => ({ device, count }));

            // Browser breakdown
            const browserCounts: Record<string, number> = {};
            events.forEach(e => {
                const b = e.browser || 'unknown';
                browserCounts[b] = (browserCounts[b] || 0) + 1;
            });
            const browsers = Object.entries(browserCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([browser, count]) => ({ browser, count }));

            // Session durations from session_end events
            const endEvents = events.filter(e => e.event_type === 'session_end');
            const avgDur = endEvents.length > 0
                ? endEvents.reduce((sum, e) => sum + (e.event_data?.duration || 0), 0) / endEvents.length
                : 0;

            setStats({
                liveVisitors: live.length,
                todayViews: pageViews.length,
                todaySessions: uniqueSessions.size,
                avgSessionDuration: Math.round(avgDur),
                topSections,
                topPages,
                languages,
                devices,
                browsers,
                recentEvents: events.slice(0, 20),
                liveVisitorDetails: live.map((v: any) => ({
                    session_id: v.session_id,
                    page_path: v.page_path || '/',
                    device: v.device || 'unknown',
                    language: v.language || '?',
                    last_seen: v.last_seen,
                })),
            });
            addLog(`Analytics loaded: ${live.length} live, ${pageViews.length} views today.`, 'success');
        } catch (err) {
            addLog(`Analytics load error: ${err}`, 'error');
        }
        setLoading(false);
    };

    const purgeOldVisitors = async () => {
        try {
            const sb = getSupabase();
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { error } = await sb.from('web_visitors').delete().lt('last_seen', cutoff);
            if (!error) {
                addLog('Old visitor records purged (>24h).', 'success');
                loadStats();
            } else {
                addLog(`Purge failed: ${error.message}`, 'error');
            }
        } catch (err) {
            addLog(`Purge error: ${err}`, 'error');
        }
    };

    const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ label, value, icon, color = 'text-sz-red' }) => (
        <div className="bg-zinc-800/50 border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className={color}>{icon}</span>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-orbitron font-black text-white">{value}</div>
        </div>
    );

    const Bar: React.FC<{ label: string; value: number; max: number; color?: string }> = ({ label, value, max, color = 'bg-sz-red' }) => (
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-400 w-24 truncate uppercase">{label}</span>
            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
            </div>
            <span className="text-[10px] font-mono text-white w-8 text-right">{value}</span>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center bg-zinc-800/50 p-4 rounded border border-white/5">
                <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2 uppercase">
                    <BarChart3 className="w-5 h-5 text-sz-red" /> Analytics_HQ
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setShowSettings(!showSettings)} className="bg-white/5 text-gray-400 hover:text-white px-3 py-2 text-xs font-bold uppercase rounded flex items-center gap-2 border border-white/10">
                        <Settings2 className="w-3 h-3" /> GA4
                    </button>
                    <button onClick={loadStats} disabled={loading} className="bg-sz-red text-white px-4 py-2 text-xs font-bold uppercase rounded flex items-center gap-2 disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* GA4 Settings */}
            {showSettings && (
                <div className="bg-zinc-800/50 border border-white/5 rounded-lg p-4 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold text-white uppercase mb-3 font-mono flex items-center gap-2">
                        <Globe className="w-3 h-3 text-sz-red" /> Google Analytics 4 Configuration
                    </h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={gaId}
                            onChange={e => setGaId(e.target.value)}
                            placeholder="G-XXXXXXXXXX"
                            className="flex-1 bg-black/40 text-white px-3 py-2 rounded text-sm font-mono border border-white/10 focus:border-sz-red/50 outline-none"
                        />
                        <button onClick={saveGaId} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs font-bold uppercase rounded flex items-center gap-2">
                            <Save className="w-3 h-3" /> Save
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 font-mono">
                        Get your Measurement ID from Google Analytics → Admin → Data Streams → Web
                    </p>
                </div>
            )}

            {/* Stats Grid */}
            {stats ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Top cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Live Now" value={stats.liveVisitors} icon={<Zap className="w-4 h-4" />} color="text-green-500" />
                        <StatCard label="Views Today" value={stats.todayViews} icon={<Activity className="w-4 h-4" />} />
                        <StatCard label="Sessions" value={stats.todaySessions} icon={<Users className="w-4 h-4" />} color="text-blue-400" />
                        <StatCard label="Avg Duration" value={stats.avgSessionDuration > 0 ? `${Math.floor(stats.avgSessionDuration / 60)}m ${stats.avgSessionDuration % 60}s` : '—'} icon={<Clock className="w-4 h-4" />} color="text-yellow-400" />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Section popularity */}
                        <div className="bg-zinc-800/30 border border-white/5 rounded-lg p-4">
                            <h4 className="text-xs font-bold text-white uppercase mb-4 font-mono flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 text-sz-red" /> Section Popularity
                            </h4>
                            <div className="space-y-2.5">
                                {stats.topSections.length > 0 ? stats.topSections.map(s => (
                                    <Bar key={s.section} label={s.section} value={s.count} max={stats.topSections[0].count} />
                                )) : <p className="text-gray-600 text-xs font-mono italic">No section data yet</p>}
                            </div>
                        </div>

                        {/* Languages */}
                        <div className="bg-zinc-800/30 border border-white/5 rounded-lg p-4">
                            <h4 className="text-xs font-bold text-white uppercase mb-4 font-mono flex items-center gap-2">
                                <Globe className="w-3 h-3 text-blue-400" /> Language Breakdown
                            </h4>
                            <div className="space-y-2.5">
                                {stats.languages.length > 0 ? stats.languages.map(l => (
                                    <Bar key={l.lang} label={l.lang} value={l.count} max={stats.languages[0].count} color="bg-blue-500" />
                                )) : <p className="text-gray-600 text-xs font-mono italic">No language data yet</p>}
                            </div>
                        </div>

                        {/* Devices */}
                        <div className="bg-zinc-800/30 border border-white/5 rounded-lg p-4">
                            <h4 className="text-xs font-bold text-white uppercase mb-4 font-mono flex items-center gap-2">
                                <Monitor className="w-3 h-3 text-purple-400" /> Devices
                            </h4>
                            <div className="space-y-2.5">
                                {stats.devices.length > 0 ? stats.devices.map(d => (
                                    <Bar key={d.device} label={d.device} value={d.count} max={stats.devices[0].count} color="bg-purple-500" />
                                )) : <p className="text-gray-600 text-xs font-mono italic">No device data yet</p>}
                            </div>
                        </div>

                        {/* Browsers */}
                        <div className="bg-zinc-800/30 border border-white/5 rounded-lg p-4">
                            <h4 className="text-xs font-bold text-white uppercase mb-4 font-mono flex items-center gap-2">
                                <Globe className="w-3 h-3 text-orange-400" /> Browsers
                            </h4>
                            <div className="space-y-2.5">
                                {stats.browsers.length > 0 ? stats.browsers.map(b => (
                                    <Bar key={b.browser} label={b.browser} value={b.count} max={stats.browsers[0].count} color="bg-orange-500" />
                                )) : <p className="text-gray-600 text-xs font-mono italic">No browser data yet</p>}
                            </div>
                        </div>
                    </div>

                    {/* Live Visitors Detail */}
                    <div className="bg-zinc-800/30 border border-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                                <Wifi className="w-3 h-3 text-green-400" /> Live Visitors ({stats.liveVisitorDetails.length})
                            </h4>
                            <button
                                onClick={purgeOldVisitors}
                                className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-mono font-bold uppercase rounded border border-red-500/20 transition-colors"
                                title="Smazat záznamy starší než 24h"
                            >
                                <Trash2 className="w-3 h-3" /> Purge old
                            </button>
                        </div>
                        {stats.liveVisitorDetails.length === 0 ? (
                            <p className="text-gray-600 text-xs font-mono italic">No active visitors right now.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {stats.liveVisitorDetails.map((v, i) => {
                                    const ageMs = Date.now() - new Date(v.last_seen).getTime();
                                    const ageSecs = Math.floor(ageMs / 1000);
                                    const dotColor = ageMs < 2 * 60 * 1000 ? 'bg-green-400' : ageMs < 10 * 60 * 1000 ? 'bg-yellow-400' : 'bg-gray-500';
                                    const ageLabel = ageSecs < 60 ? `${ageSecs}s ago` : `${Math.floor(ageSecs / 60)}m ago`;
                                    return (
                                        <div key={i} className="flex items-center gap-3 text-[10px] font-mono py-1 border-b border-white/5 last:border-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor} animate-pulse`} />
                                            <span className="text-gray-300 flex-1 truncate">{v.page_path}</span>
                                            <span className="text-gray-500">{v.device}</span>
                                            <span className="text-gray-600">{v.language}</span>
                                            <span className="text-gray-600 w-14 text-right shrink-0">{ageLabel}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recent Events */}
                    <div className="bg-zinc-800/30 border border-white/5 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-white uppercase mb-4 font-mono flex items-center gap-2">
                            <Activity className="w-3 h-3 text-green-400" /> Recent Events ({stats.recentEvents.length})
                        </h4>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                            {stats.recentEvents.map((e, i) => (
                                <div key={i} className="flex items-center gap-3 text-[10px] font-mono py-1 border-b border-white/5">
                                    <span className="text-gray-600 w-16">{new Date(e.timestamp).toLocaleTimeString()}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${e.event_type === 'page_view' ? 'bg-blue-500/20 text-blue-400' :
                                        e.event_type === 'section_view' ? 'bg-green-500/20 text-green-400' :
                                            e.event_type === 'click' ? 'bg-yellow-500/20 text-yellow-400' :
                                                e.event_type === 'conversion' ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-white/10 text-gray-400'
                                        }`}>{e.event_type}</span>
                                    <span className="text-gray-400 truncate flex-1">{JSON.stringify(e.event_data)}</span>
                                    <span className="text-gray-600">{e.device}</span>
                                    <span className="text-gray-600">{e.language}</span>
                                </div>
                            ))}
                            {stats.recentEvents.length === 0 && <p className="text-gray-600 text-xs font-mono italic py-4">No events recorded yet. Analytics data will appear here as visitors browse the site.</p>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-600 font-mono">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="uppercase tracking-[0.3em]">Loading Analytics...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsTab;
