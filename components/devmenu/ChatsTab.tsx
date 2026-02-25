// DevMenu Chats/Sessions Tab Component
import React, { useState } from 'react';
import { MessageCircle, CloudDownload, Activity, Copy } from 'lucide-react';
import { getSupabase } from '../../services/supabaseClient';
import { TABLES } from '../../services/webDataService';
import { ChatSession } from './types';

interface ChatsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
    chatHistory: ChatSession[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const ChatsTab: React.FC<ChatsTabProps> = ({ addLog, chatHistory, setChatHistory }) => {
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

    const loadCloudSessions = async () => {
        const supabase = getSupabase();
        addLog("Fetching sessions from Cloud...", 'info');
        const { data, error } = await supabase
            .from(TABLES.CHAT_SESSIONS)
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(50);

        if (error) {
            addLog(`Cloud Fetch Error: ${error.message}`, 'error');
        } else if (data) {
            const sessions: ChatSession[] = data.map((d: any) => {
                // Safely parse messages — could be string, null, or array
                let msgs = d.messages || [];
                if (typeof msgs === 'string') {
                    try { msgs = JSON.parse(msgs); } catch { msgs = []; }
                }
                if (!Array.isArray(msgs)) msgs = [];
                return {
                    id: d.id,
                    date: d.updated_at || d.started_at || new Date().toISOString(),
                    messages: msgs,
                    user_nickname: d.user_nickname,
                    session_fingerprint: d.session_fingerprint,
                };
            });
            setChatHistory(sessions);
            addLog(`${sessions.length} Cloud sessions loaded.`, 'success');
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-zinc-800/50 p-4 rounded border border-white/5">
                <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2 uppercase">
                    <MessageCircle className="w-5 h-5 text-sz-red" /> Interaction_Logs
                </h3>
                <button
                    onClick={loadCloudSessions}
                    className="bg-sz-red text-white px-4 py-2 text-xs font-bold uppercase rounded flex items-center gap-2"
                >
                    <CloudDownload className="w-4 h-4" /> Load from Cloud
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Sidebar: Session List */}
                <div className="w-1/3 bg-black/40 border border-white/5 rounded-lg overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {chatHistory.map(session => (
                        <div
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            className={`p-3 rounded border cursor-pointer transition-all ${selectedSession?.id === session.id ? 'border-sz-red bg-sz-red/10' : 'border-white/5 hover:bg-white/5'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{session.id}</span>
                                <span className="text-[10px] font-mono text-sz-red">{session.messages.length} msg</span>
                            </div>
                            <div className="text-xs text-white font-bold">{new Date(session.date).toLocaleString()}</div>
                            {(session as any).user_nickname && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] bg-sz-red/20 text-sz-red px-1.5 py-0.5 rounded font-bold">{(session as any).user_nickname}</span>
                                    {(session as any).session_fingerprint && <span className="text-[9px] text-gray-600 font-mono">{(session as any).session_fingerprint}</span>}
                                </div>
                            )}
                        </div>
                    ))}
                    {chatHistory.length === 0 && <div className="text-center py-20 text-zinc-700 font-mono italic">No logs found.</div>}
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-black/40 border border-white/5 rounded-lg overflow-y-auto custom-scrollbar p-6 flex flex-col">
                    {selectedSession ? (
                        <div className="space-y-6">
                            <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-end">
                                <div>
                                    <h4 className="text-xl font-bold text-white font-orbitron uppercase">{selectedSession.id}</h4>
                                    <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Capture_Time: {new Date(selectedSession.date).toISOString()}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const json = JSON.stringify(selectedSession, null, 2);
                                        navigator.clipboard.writeText(json);
                                        addLog("Session JSON copied to clipboard.", 'success');
                                    }}
                                    className="p-2 text-gray-400 hover:text-white" title="Copy JSON"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {(Array.isArray(selectedSession.messages) ? selectedSession.messages : []).map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] p-3 rounded text-sm font-mono ${m.role === 'user' ? 'bg-zinc-800 border border-white/10 text-white' : 'bg-sz-red/10 border border-sz-red/30 text-sz-red'}`}>
                                            <span className="text-[9px] block mb-1 opacity-50 uppercase tracking-tighter">{m.role === 'user' ? 'GUEST_INPUT' : 'SKILLER_REPLY'}</span>
                                            {m.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 font-mono uppercase tracking-[0.3em]">
                            <Activity className="w-12 h-12 mb-4 opacity-20" />
                            Select_Session_To_Inspect
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatsTab;
