import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    X, Terminal, Brain, MessageSquare, History, Activity,
    Shield, MapPin, Calendar, MessageCircle, LogOut, Image as ImageIcon, Globe, Newspaper,
    User, Star, Wrench, Swords, Gamepad2, Camera, Type, PanelLeftClose, PanelLeftOpen,
    BarChart3, Settings, Search, ChevronDown, ChevronRight
} from 'lucide-react';
import {
    getChatHistory, getAdminMessages, getDailyAiFeed, getMergedHistory,
    getMergedProtocol, getMergedLocations, getMergedEvents, getAiSettings,
    getSkillerState, getUserProfile, DEFAULT_AI_SETTINGS
} from '../utils/devTools';
import { getCurrentUser, signOut } from '../services/supabaseClient';
import { AiSettings, SkillerState, UserProfile } from '../types';
import { HISTORY_SHORT_CS, HISTORY_LONG_CS } from '../data/history';
import { PROTOCOL_DATA_CS } from '../data/protocol';
import { LOCATIONS_CS } from '../data/locations';
import { EVENTS_DATA_CS } from '../data/events';
import { useAppContext } from '../context/AppContext';
import { BrainTab, VisualsTab, FeedTab, ChatsTab, HistoryTab, ProtocolTab, LocationsTab, EventsTab, SkillerTab, LogEntry, ChatSession } from './devmenu/index';
import SeoTab from './devmenu/SeoTab';
import OwnerProfileTab from './devmenu/OwnerProfileTab';
import ReviewsTab from './devmenu/ReviewsTab';
import ServicesTab from './devmenu/ServicesTab';
import WhyUsTab from './devmenu/WhyUsTab';
import SkillCheckTab from './devmenu/SkillCheckTab';
import GalleryTab from './devmenu/GalleryTab';
import AnalyticsTab from './devmenu/AnalyticsTab';
import ContentTab from './devmenu/ContentTab';
import SectionsTab from './devmenu/SectionsTab';
import PressTab from './devmenu/PressTab';

interface DevMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabId = 'chats' | 'feed' | 'story' | 'protocol' | 'locations' | 'events' | 'brain' | 'skiller' | 'visuals' | 'seo' | 'owner' | 'reviews' | 'services' | 'whyus' | 'skillcheck' | 'gallery' | 'analytics' | 'content' | 'sections' | 'press';

// ─── GROUPED SIDEBAR CONFIG ──────────────────────────────────────────

interface TabItem {
    id: TabId;
    label: string;
    icon: React.FC<{ className?: string }>;
    description?: string;
}

interface TabGroup {
    title: string;
    emoji: string;
    items: TabItem[];
}

const TAB_GROUPS: TabGroup[] = [
    {
        title: 'System',
        emoji: '⚡',
        items: [
            { id: 'sections', label: 'Sections', icon: Settings, description: 'Toggle website sections' },
            { id: 'brain', label: 'Neural', icon: Brain, description: 'AI personality & settings' },
            { id: 'skiller', label: 'Skiller', icon: MessageCircle, description: 'Local Chatbot Memory' },
            { id: 'chats', label: 'Sessions', icon: MessageCircle, description: 'Chat conversation history' },
            { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Live stats & visitors' },
        ],
    },
    {
        title: 'Content',
        emoji: '✏️',
        items: [
            { id: 'feed', label: 'Broadcast', icon: MessageSquare, description: 'Admin messages & live feed' },
            { id: 'visuals', label: 'Visual Forge', icon: ImageIcon, description: 'AI images & animations' },
            { id: 'content', label: 'Content', icon: Type, description: 'Edit all website text' },
            { id: 'gallery', label: 'Gallery', icon: Camera, description: 'Photo manager & upload' },
            { id: 'press', label: 'Press', icon: Newspaper, description: 'Media mentions & articles' },
        ],
    },
    {
        title: 'Site',
        emoji: '🌐',
        items: [
            { id: 'locations', label: 'Zones', icon: MapPin, description: 'Branch locations' },
            { id: 'events', label: 'WarRoom', icon: Calendar, description: 'Events & tournaments' },
            { id: 'protocol', label: 'Rules', icon: Shield, description: 'Server protocol rules' },
            { id: 'story', label: 'History', icon: History, description: 'Story & timeline' },
            { id: 'services', label: 'Services', icon: Wrench, description: 'Service cards editor' },
            { id: 'whyus', label: 'VS', icon: Swords, description: 'Competitive advantages' },
            { id: 'seo', label: 'SEO', icon: Globe, description: 'Sitemap & meta' },
            { id: 'skillcheck', label: 'Quiz', icon: Gamepad2, description: 'Skill check questions' },
        ],
    },
    {
        title: 'Profile',
        emoji: '👤',
        items: [
            { id: 'owner', label: 'Boss', icon: User, description: 'Owner profile & photo' },
            { id: 'reviews', label: 'Reviews', icon: Star, description: 'Customer reviews' },
        ],
    },
];

// Flat list for search
const ALL_TABS = TAB_GROUPS.flatMap(g => g.items.map(t => ({ ...t, group: g.title })));

// ─── DEVMENU COMPONENT ──────────────────────────────────────────────

const DevMenu: React.FC<DevMenuProps> = ({ isOpen, onClose }) => {
    const { language, setLanguage, allLanguages, isBrainrot, setBrainrot, isCorporate, setCorporate } = useAppContext();
    const [activeTab, setActiveTab] = useState<TabId>('sections');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Collapsible groups — all open by default
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Shared state
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
    const [adminMessages, setAdminMessages] = useState<string[]>([]);
    const [dailyFeed, setDailyFeed] = useState<{ user: string, msg: string }[]>([]);
    const [aiSettings, setAiSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
    const [skillerState, setSkillerState] = useState<SkillerState | null>(null);
    const [dbLogs, setDbLogs] = useState<LogEntry[]>([]);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            refreshData();
            getCurrentUser().then(setCurrentUser);

            if (localStorage.getItem('sz_sync_gmb_intent') === 'true') {
                setActiveTab('reviews');
            }
        }
    }, [isOpen, language]);

    // Listen for devmenu:close from SectionsTab quick-nav
    useEffect(() => {
        const handler = () => onClose();
        window.addEventListener('devmenu:close', handler);
        return () => window.removeEventListener('devmenu:close', handler);
    }, [onClose]);

    // Hide Crisp when DevMenu is open
    useEffect(() => {
        const w = window as any;
        if (!w.$crisp) return;
        if (isOpen) {
            w.$crisp.push(['do', 'chat:hide']);
        } else {
            w.$crisp.push(['do', 'chat:show']);
        }
    }, [isOpen]);

    // Keyboard shortcut: Escape to close, Ctrl+K to focus search
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('devmenu-search')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const refreshData = async () => {
        const [history, admin, feed, ai] = await Promise.all([
            getChatHistory(),
            getAdminMessages(),
            getDailyAiFeed(),
            getAiSettings()
        ]);
        const safeSessions = history.reverse().map((s: any) => {
            let msgs = s.messages || [];
            if (typeof msgs === 'string') { try { msgs = JSON.parse(msgs); } catch { msgs = []; } }
            if (!Array.isArray(msgs)) msgs = [];
            return {
                id: s.id,
                date: s.updated_at || s.started_at || s.date || new Date().toISOString(),
                messages: msgs,
                user_nickname: s.user_nickname,
                session_fingerprint: s.session_fingerprint,
            };
        });
        setChatHistory(safeSessions);
        setAdminMessages(admin);
        setDailyFeed(feed);
        setAiSettings(ai);
        setSkillerState(getSkillerState());
    };

    const [saveToast, setSaveToast] = useState<string | null>(null);

    const addLog = useCallback((msg: string, type: 'info' | 'error' | 'success' = 'info') => {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        setDbLogs(prev => [{ msg, type, time }, ...prev].slice(0, 50));
        if (type === 'success' || type === 'error') {
            setSaveToast(msg);
            setTimeout(() => setSaveToast(null), 8000);
        }
    }, []);

    const handleLogout = async () => {
        await signOut();
        onClose();
        window.location.reload();
    };

    const toggleGroup = (title: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    };

    // Filter tabs by search
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return TAB_GROUPS;
        const q = searchQuery.toLowerCase();
        return TAB_GROUPS.map(group => ({
            ...group,
            items: group.items.filter(
                t => t.label.toLowerCase().includes(q) ||
                    (t.description || '').toLowerCase().includes(q) ||
                    group.title.toLowerCase().includes(q)
            ),
        })).filter(g => g.items.length > 0);
    }, [searchQuery]);

    if (!isOpen) return null;

    // Find active tab info
    const activeTabInfo = ALL_TABS.find(t => t.id === activeTab);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'brain':
                return <BrainTab addLog={addLog} aiSettings={aiSettings} setAiSettings={setAiSettings} skillerState={skillerState} />;
            case 'skiller':
                return <SkillerTab />;
            case 'visuals':
                return <VisualsTab addLog={addLog} generatedImages={generatedImages} setGeneratedImages={setGeneratedImages} />;
            case 'feed':
                return <FeedTab addLog={addLog} adminMessages={adminMessages} setAdminMessages={setAdminMessages} dailyFeed={dailyFeed} setDailyFeed={setDailyFeed} />;
            case 'chats':
                return <ChatsTab addLog={addLog} chatHistory={chatHistory} setChatHistory={setChatHistory} />;
            case 'seo':
                return <SeoTab />;
            case 'story':
                return <HistoryTab addLog={addLog} />;
            case 'protocol':
                return <ProtocolTab addLog={addLog} />;
            case 'locations':
                return <LocationsTab addLog={addLog} />;
            case 'events':
                return <EventsTab addLog={addLog} />;
            case 'owner':
                return <OwnerProfileTab addLog={addLog} />;
            case 'reviews':
                return <ReviewsTab addLog={addLog} />;
            case 'services':
                return <ServicesTab addLog={addLog} />;
            case 'whyus':
                return <WhyUsTab addLog={addLog} />;
            case 'skillcheck':
                return <SkillCheckTab addLog={addLog} />;
            case 'gallery':
                return <GalleryTab addLog={addLog} />;
            case 'analytics':
                return <AnalyticsTab addLog={addLog} />;
            case 'content':
                return <ContentTab addLog={addLog} />;
            case 'sections':
                return <SectionsTab addLog={addLog} />;
            case 'press':
                return <PressTab addLog={addLog} />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex">
            {/* ─── SIDEBAR ─── */}
            <aside
                className={`${sidebarOpen ? 'w-60' : 'w-14'} flex-shrink-0 bg-zinc-950 border-r border-white/5 flex flex-col transition-all duration-200 ease-out`}
            >
                {/* Sidebar Header */}
                <div className={`p-3 border-b border-white/5 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    {sidebarOpen && (
                        <div className="flex items-center gap-2 min-w-0">
                            <Terminal className="w-5 h-5 text-sz-red flex-shrink-0" />
                            <span className="text-sm font-bold text-white font-orbitron uppercase truncate">Root</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-gray-500 hover:text-white p-1 rounded transition-colors flex-shrink-0"
                    >
                        {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>
                </div>

                {/* Search — only when sidebar open */}
                {sidebarOpen && (
                    <div className="px-3 pt-3 pb-1">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                            <input
                                id="devmenu-search"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search tabs... (Ctrl+K)"
                                className="w-full bg-black/50 border border-white/5 focus:border-red-500/40 rounded-md pl-7 pr-2 py-1.5 text-[11px] text-white font-mono outline-none placeholder:text-gray-700 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Sidebar Navigation */}
                <nav className="flex-1 overflow-y-auto custom-scrollbar py-1">
                    {filteredGroups.map(group => {
                        const isCollapsed = collapsedGroups.has(group.title) && !searchQuery;
                        const hasActiveTab = group.items.some(t => t.id === activeTab);

                        return (
                            <div key={group.title} className="mb-0.5">
                                {sidebarOpen ? (
                                    <button
                                        onClick={() => toggleGroup(group.title)}
                                        className={`w-full flex items-center justify-between px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-colors group/header ${hasActiveTab ? 'text-gray-400' : 'text-gray-600 hover:text-gray-400'
                                            }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <span>{group.emoji}</span>
                                            <span>{group.title}</span>
                                            <span className="text-gray-700 font-normal">({group.items.length})</span>
                                        </span>
                                        {!searchQuery && (
                                            isCollapsed
                                                ? <ChevronRight className="w-3 h-3 text-gray-700 group-hover/header:text-gray-500" />
                                                : <ChevronDown className="w-3 h-3 text-gray-700 group-hover/header:text-gray-500" />
                                        )}
                                    </button>
                                ) : (
                                    <div className="h-px bg-white/5 mx-2 my-2" />
                                )}

                                {(!isCollapsed || searchQuery) && group.items.map(tab => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                                            title={!sidebarOpen ? `${tab.label} — ${tab.description}` : undefined}
                                            className={`w-full flex items-center gap-2.5 transition-all relative group/tab
                                                ${sidebarOpen ? 'px-4 py-2' : 'px-0 py-2 justify-center'}
                                                ${isActive
                                                    ? 'text-white bg-red-500/8'
                                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                                                }`}
                                        >
                                            {/* Active indicator */}
                                            {isActive && (
                                                <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-sz-red rounded-r" />
                                            )}
                                            <tab.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sz-red' : ''}`} />
                                            {sidebarOpen && (
                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="text-xs font-semibold truncate leading-tight">{tab.label}</div>
                                                    {tab.description && (
                                                        <div className="text-[9px] text-gray-600 truncate leading-tight mt-0.5 group-hover/tab:text-gray-500 transition-colors">
                                                            {tab.description}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* No results */}
                    {searchQuery && filteredGroups.length === 0 && sidebarOpen && (
                        <div className="px-4 py-6 text-center text-[10px] text-gray-600 font-mono italic">
                            No tabs match "{searchQuery}"
                        </div>
                    )}
                </nav>

                {/* Quick Settings */}
                {sidebarOpen && (
                    <div className="border-t border-white/5 p-3 space-y-2">
                        <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">Quick Settings</span>
                        {/* Language */}
                        <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-gray-500 shrink-0" />
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value as any)}
                                className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 font-mono focus:border-sz-red outline-none"
                            >
                                {allLanguages.map(lang => (
                                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        {/* Brainrot */}
                        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setBrainrot(!isBrainrot)}>
                            <div className={`w-7 h-4 rounded-full flex items-center transition-colors ${isBrainrot ? 'bg-purple-500' : 'bg-white/10'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${isBrainrot ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono group-hover:text-white transition-colors">
                                {isBrainrot ? '🧠 BRAINROT ON' : 'Gen Z Mode'}
                            </span>
                        </label>
                        {/* Corporate */}
                        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setCorporate(!isCorporate)}>
                            <div className={`w-7 h-4 rounded-full flex items-center transition-colors ${isCorporate ? 'bg-blue-500' : 'bg-white/10'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${isCorporate ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono group-hover:text-white transition-colors">
                                {isCorporate ? '🏢 KORPORÁT ON' : 'Corporate Mode'}
                            </span>
                        </label>
                        {/* Crisp Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                defaultChecked={false}
                                onChange={e => {
                                    const w = window as any;
                                    if (w.$crisp) {
                                        if (e.target.checked) {
                                            w.$crisp.push(['do', 'chat:show']);
                                        } else {
                                            w.$crisp.push(['do', 'chat:hide']);
                                        }
                                    }
                                }}
                                className="w-3 h-3 rounded bg-black/50 border border-white/10 accent-cyan-500"
                            />
                            <span className="text-[10px] text-gray-400 font-mono group-hover:text-white transition-colors">
                                💬 Show Crisp
                            </span>
                        </label>
                    </div>
                )}

                {/* Sidebar Footer */}
                <div className={`border-t border-white/5 p-3 ${sidebarOpen ? '' : 'flex justify-center'}`}>
                    {sidebarOpen ? (
                        <div className="space-y-2">
                            <div className="text-[10px] text-gray-600 font-mono truncate px-1 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                                {currentUser?.email || 'SYSTEM'}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-red-500 hover:text-white uppercase px-2 py-1.5 border border-red-500/20 hover:bg-red-500 rounded transition-all"
                                >
                                    <LogOut className="w-3 h-3" /> Out
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-white uppercase px-2 py-1.5 border border-white/10 hover:bg-white/10 rounded transition-all"
                                >
                                    <X className="w-3 h-3" /> Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 items-center">
                            <button onClick={handleLogout} title="Sign Out" className="text-red-500 hover:text-white p-1.5 rounded transition-colors">
                                <LogOut className="w-4 h-4" />
                            </button>
                            <button onClick={onClose} title="Close" className="text-gray-400 hover:text-white p-1.5 rounded transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <div className="h-12 bg-zinc-950 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {activeTabInfo && (
                            <>
                                <activeTabInfo.icon className="w-4 h-4 text-sz-red" />
                                <h2 className="text-sm font-bold text-white font-orbitron uppercase tracking-wide">{activeTabInfo.label}</h2>
                                {activeTabInfo.description && (
                                    <span className="text-[10px] text-gray-600 font-mono hidden sm:inline">— {activeTabInfo.description}</span>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-600 font-mono uppercase">
                            {new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-zinc-900/50 p-6 custom-scrollbar">
                    {renderTabContent()}
                </div>

                {/* ─── PERSISTENT SYSTEM LOGS ─── */}
                {dbLogs.length > 0 && (
                    <div className="border-t border-white/10 bg-black/80 flex-shrink-0">
                        <div className="p-2 px-4 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3" /> System_Log ({dbLogs.length})
                            </span>
                            <button onClick={() => setDbLogs([])} className="text-[10px] text-gray-600 hover:text-white uppercase">Clear</button>
                        </div>
                        <div className="px-4 pb-3 font-mono text-[11px] max-h-32 overflow-y-auto space-y-0.5 custom-scrollbar">
                            {dbLogs.slice(0, 20).map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-gray-600 shrink-0">[{log.time}]</span>
                                    <span className={log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-green-500' : 'text-zinc-400'}>{log.msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* ─── SAVE TOAST ─── */}
            {saveToast && (
                <div className="fixed top-4 right-4 z-[300] animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-green-500/30 flex items-center gap-2 font-mono uppercase">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        {saveToast}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevMenu;
