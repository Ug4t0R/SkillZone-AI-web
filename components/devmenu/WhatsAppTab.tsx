// DevMenu WhatsApp Inbox Tab Component
import React, { useState, useEffect } from 'react';
import { MessageSquare, CloudDownload, Activity, Phone, Clock, ChevronRight, Send, RefreshCw, User } from 'lucide-react';
import { getSupabase } from '../../services/supabaseClient';
import { TABLES } from '../../services/webDataService';

interface WhatsAppConversation {
    id: string;
    phone: string;
    name: string | null;
    last_message: string | null;
    last_message_at: string | null;
    unread_count: number;
    created_at: string;
}

interface WhatsAppMessage {
    id: string;
    conversation_id: string;
    direction: 'incoming' | 'outgoing';
    body: string;
    created_at: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
}

interface WhatsAppTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const WhatsAppTab: React.FC<WhatsAppTabProps> = ({ addLog }) => {
    const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<WhatsAppConversation | null>(null);
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const loadConversations = async () => {
        setLoading(true);
        addLog('Fetching WhatsApp conversations...', 'info');
        try {
            const sb = getSupabase();
            const { data, error } = await sb
                .from(TABLES.WHATSAPP_CONVERSATIONS)
                .select('*')
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            setConversations(data || []);
            addLog(`${(data || []).length} conversations loaded.`, 'success');
        } catch (err: any) {
            addLog(`Failed to load conversations: ${err.message}`, 'error');
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        setLoadingMessages(true);
        try {
            const sb = getSupabase();
            const { data, error } = await sb
                .from(TABLES.WHATSAPP_MESSAGES)
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (err: any) {
            addLog(`Failed to load messages: ${err.message}`, 'error');
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const selectConversation = (convo: WhatsAppConversation) => {
        setSelectedConvo(convo);
        loadMessages(convo.id);
    };

    useEffect(() => {
        loadConversations();
    }, []);

    const formatTime = (iso: string | null) => {
        if (!iso) return '—';
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffH = diffMs / (1000 * 60 * 60);

        if (diffH < 24) return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
        if (diffH < 168) return d.toLocaleDateString('cs-CZ', { weekday: 'short' });
        return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center bg-zinc-800/50 p-4 rounded border border-white/5">
                <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2 uppercase">
                    <MessageSquare className="w-5 h-5 text-green-500" /> WhatsApp_Inbox
                </h3>
                <button
                    onClick={loadConversations}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold uppercase rounded flex items-center gap-2 transition-colors"
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                    {loading ? 'Loading...' : 'Sync'}
                </button>
            </div>

            {/* Split Panel */}
            <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
                {/* Left: Conversation List */}
                <div className="w-[340px] flex-shrink-0 bg-black/40 border border-white/5 rounded-lg overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Conversation count */}
                    <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                            {conversations.length} Conversations
                        </span>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {conversations.map(convo => {
                            const isActive = selectedConvo?.id === convo.id;
                            return (
                                <button
                                    key={convo.id}
                                    onClick={() => selectConversation(convo)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all group ${isActive
                                            ? 'border-green-500/40 bg-green-500/10'
                                            : 'border-transparent hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-green-500/20' : 'bg-zinc-800'
                                            }`}>
                                            <User className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-gray-600'}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className={`text-xs font-bold truncate ${isActive ? 'text-green-400' : 'text-white'
                                                    }`}>
                                                    {convo.name || convo.phone}
                                                </span>
                                                <span className="text-[9px] font-mono text-gray-600 flex-shrink-0 ml-2">
                                                    {formatTime(convo.last_message_at)}
                                                </span>
                                            </div>
                                            {convo.name && (
                                                <div className="text-[10px] text-gray-600 font-mono flex items-center gap-1 mb-0.5">
                                                    <Phone className="w-2.5 h-2.5" /> {convo.phone}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <p className="text-[11px] text-gray-500 truncate flex-1">
                                                    {convo.last_message || 'Žádné zprávy'}
                                                </p>
                                                {convo.unread_count > 0 && (
                                                    <span className="bg-green-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                        {convo.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-3 h-3 flex-shrink-0 mt-3 ${isActive ? 'text-green-500' : 'text-gray-700 group-hover:text-gray-500'
                                            } transition-colors`} />
                                    </div>
                                </button>
                            );
                        })}

                        {!loading && conversations.length === 0 && (
                            <div className="text-center py-16 space-y-3">
                                <MessageSquare className="w-10 h-10 text-gray-800 mx-auto" />
                                <p className="text-zinc-700 font-mono text-xs italic">
                                    Žádné konverzace.
                                </p>
                                <p className="text-zinc-800 font-mono text-[10px]">
                                    Tabulka <code className="text-green-600">web_whatsapp_conversations</code> je prázdná nebo neexistuje.
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="text-center py-16">
                                <RefreshCw className="w-6 h-6 text-green-500 mx-auto animate-spin" />
                                <p className="text-zinc-600 font-mono text-xs mt-3">Loading...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Message Thread */}
                <div className="flex-1 bg-black/40 border border-white/5 rounded-lg overflow-hidden flex flex-col">
                    {selectedConvo ? (
                        <>
                            {/* Thread Header */}
                            <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex items-center gap-3 flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white font-orbitron uppercase truncate">
                                        {selectedConvo.name || selectedConvo.phone}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                        <Phone className="w-3 h-3" />
                                        <span>{selectedConvo.phone}</span>
                                        <span className="text-gray-700">•</span>
                                        <Clock className="w-3 h-3" />
                                        <span>Od {new Date(selectedConvo.created_at).toLocaleDateString('cs-CZ')}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => loadMessages(selectedConvo.id)}
                                    className="p-2 text-gray-500 hover:text-green-400 transition-colors"
                                    title="Refresh messages"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                {loadingMessages ? (
                                    <div className="flex-1 flex items-center justify-center py-20">
                                        <RefreshCw className="w-6 h-6 text-green-500 animate-spin" />
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm relative ${msg.direction === 'outgoing'
                                                        ? 'bg-green-600/20 border border-green-500/20 text-green-100 rounded-br-sm'
                                                        : 'bg-zinc-800 border border-white/5 text-white rounded-bl-sm'
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">{msg.body}</p>
                                                <div className={`flex items-center gap-1.5 mt-1 ${msg.direction === 'outgoing' ? 'justify-end' : ''
                                                    }`}>
                                                    <span className="text-[9px] text-gray-600 font-mono">
                                                        {new Date(msg.created_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {msg.direction === 'outgoing' && (
                                                        <span className={`text-[8px] font-mono uppercase ${msg.status === 'read' ? 'text-blue-400' :
                                                                msg.status === 'delivered' ? 'text-gray-500' :
                                                                    msg.status === 'failed' ? 'text-red-500' : 'text-gray-600'
                                                            }`}>
                                                            {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : msg.status === 'failed' ? '✗' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-700 font-mono">
                                        <Send className="w-8 h-8 mb-3 opacity-20" />
                                        <span className="text-xs uppercase tracking-widest">Žádné zprávy v konverzaci</span>
                                    </div>
                                )}
                            </div>

                            {/* Info Footer */}
                            <div className="p-3 border-t border-white/5 bg-zinc-950/50 flex-shrink-0">
                                <p className="text-[10px] text-gray-700 font-mono text-center">
                                    📖 Read-only inbox — odpovídání přes WhatsApp Business API
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 font-mono uppercase tracking-[0.3em]">
                            <Activity className="w-12 h-12 mb-4 opacity-20" />
                            <span className="text-xs">Select_Conversation</span>
                            <span className="text-[10px] text-zinc-800 mt-2 tracking-normal normal-case">
                                Vyber konverzaci vlevo pro zobrazení zpráv
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsAppTab;
