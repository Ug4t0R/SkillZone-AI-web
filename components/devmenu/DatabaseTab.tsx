// DevMenu Database Tab Component
import React, { useState } from 'react';
import {
    CloudUpload, CloudDownload, Copy, Database, Globe, Settings,
    Check, Trash2, Activity
} from 'lucide-react';
import { uploadToSupabase, downloadFromSupabase } from '../../utils/dbMigration';
import { getSqlSchema } from '../../utils/sqlGenerator';
import {
    getSupabaseEnvs, saveSupabaseEnv, deleteSupabaseEnv, getActiveEnvId,
    saveSupabaseConfig, SupabaseEnv
} from '../../services/supabaseClient';
import { LogEntry } from './types';

interface DatabaseTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
    dbLogs: LogEntry[];
    setDbLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
    refreshData: () => void;
}

const DatabaseTab: React.FC<DatabaseTabProps> = ({ addLog, dbLogs, setDbLogs, refreshData }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [sqlCopied, setSqlCopied] = useState(false);
    const [envs, setEnvs] = useState<SupabaseEnv[]>(getSupabaseEnvs());
    const [activeEnvId, setActiveEnvId] = useState<string>(getActiveEnvId());
    const [isManagingEnvs, setIsManagingEnvs] = useState(false);
    const [newEnvName, setNewEnvName] = useState('');
    const [newEnvUrl, setNewEnvUrl] = useState('');
    const [newEnvKey, setNewEnvKey] = useState('');

    const handleUploadData = async () => {
        setIsSyncing(true);
        addLog("INITIATING SYNC SEQUENCE (PUSH)...", 'info');
        try {
            await uploadToSupabase((msg, type) => addLog(msg, type || 'info'));
        } catch (e: any) {
            addLog(`CRITICAL FAILURE: ${e.message}`, 'error');
        }
        setIsSyncing(false);
    };

    const handleDownloadData = async () => {
        setIsDownloading(true);
        addLog("INITIATING DOWNLOAD SEQUENCE (PULL)...", 'info');
        try {
            await downloadFromSupabase((msg, type) => addLog(msg, type || 'info'));
            refreshData();
        } catch (e: any) {
            addLog(`DOWNLOAD FAILURE: ${e.message}`, 'error');
        }
        setIsDownloading(false);
    };

    const handleCopySql = () => {
        const sql = getSqlSchema();
        navigator.clipboard.writeText(sql).then(() => {
            setSqlCopied(true);
            addLog("SQL Schema copied.", 'success');
            setTimeout(() => setSqlCopied(false), 2000);
        });
    };

    const handleSwitchEnv = (env: SupabaseEnv) => {
        saveSupabaseConfig(env.url, env.key);
        setActiveEnvId(env.id);
        addLog(`Switched to: ${env.name}`, 'info');
        refreshData();
    };

    const handleCreateEnv = () => {
        if (!newEnvName || !newEnvUrl || !newEnvKey) return;
        const newEnv: SupabaseEnv = {
            id: 'env-' + Date.now(),
            name: newEnvName,
            url: newEnvUrl,
            key: newEnvKey
        };
        saveSupabaseEnv(newEnv);
        setEnvs(getSupabaseEnvs());
        setNewEnvName(''); setNewEnvUrl(''); setNewEnvKey('');
        setIsManagingEnvs(false);
        addLog("New environment profile created.", 'success');
    };

    const handleDeleteEnv = (id: string) => {
        if (id === 'prod-default') return;
        deleteSupabaseEnv(id);
        setEnvs(getSupabaseEnvs());
        addLog("Environment profile deleted.", 'info');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sync Actions */}
                <div className="bg-zinc-800/50 p-6 border border-white/5 rounded-lg flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-orbitron">
                        <CloudUpload className="text-sz-red w-5 h-5" /> SYNC_CONTROL
                    </h3>
                    <div className="space-y-4 flex-1">
                        <button onClick={handleUploadData} disabled={isSyncing} className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold uppercase rounded flex items-center justify-center gap-2 transition-all">
                            <CloudUpload className="w-4 h-4" /> {isSyncing ? "Syncing..." : "Push Local to DB"}
                        </button>
                        <button onClick={handleDownloadData} disabled={isDownloading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold uppercase rounded flex items-center justify-center gap-2 transition-all">
                            <CloudDownload className="w-4 h-4" /> {isDownloading ? "Fetching..." : "Pull DB to Local"}
                        </button>
                        <button onClick={handleCopySql} className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold uppercase rounded flex items-center justify-center gap-2 transition-all">
                            <Copy className="w-4 h-4" /> {sqlCopied ? "SQL Copied!" : "Export SQL Schema"}
                        </button>
                    </div>
                </div>

                {/* Env Management */}
                <div className="bg-zinc-800/50 p-6 border border-white/5 rounded-lg flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-orbitron">
                            <Globe className="text-blue-400 w-5 h-5" /> ENVIRONMENTS
                        </h3>
                        <button onClick={() => setIsManagingEnvs(!isManagingEnvs)} className="p-1 hover:text-white text-gray-400">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2 flex-1">
                        {envs.map(env => (
                            <div key={env.id} className={`p-3 rounded border flex justify-between items-center transition-all ${activeEnvId === env.id ? 'border-sz-red bg-sz-red/5' : 'border-white/5 hover:bg-white/5'}`}>
                                <div onClick={() => handleSwitchEnv(env)} className="cursor-pointer flex-1">
                                    <div className="text-sm font-bold text-white uppercase">{env.name}</div>
                                    <div className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">{env.url}</div>
                                </div>
                                {activeEnvId === env.id ? <Check className="w-4 h-4 text-sz-red" /> : (
                                    env.id !== 'prod-default' && (
                                        <button onClick={() => handleDeleteEnv(env.id)} className="p-1 text-gray-600 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )
                                )}
                            </div>
                        ))}
                        {isManagingEnvs && (
                            <div className="pt-4 border-t border-white/10 mt-4 space-y-2 animate-in slide-in-from-top-2">
                                <input type="text" placeholder="Env Name" className="w-full bg-black/50 border border-white/10 p-2 text-xs text-white" value={newEnvName} onChange={e => setNewEnvName(e.target.value)} />
                                <input type="text" placeholder="Supabase URL" className="w-full bg-black/50 border border-white/10 p-2 text-xs text-white" value={newEnvUrl} onChange={e => setNewEnvUrl(e.target.value)} />
                                <input type="password" placeholder="Anon Key" className="w-full bg-black/50 border border-white/10 p-2 text-xs text-white" value={newEnvKey} onChange={e => setNewEnvKey(e.target.value)} />
                                <button onClick={handleCreateEnv} className="w-full py-2 bg-sz-red text-white text-xs font-bold uppercase rounded">Save Profile</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DB Logs */}
            <div className="bg-black/40 rounded border border-white/10">
                <div className="p-3 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Activity className="w-3 h-3" /> System_Logs</span>
                    <button onClick={() => setDbLogs([])} className="text-[10px] text-gray-600 hover:text-white uppercase">Clear</button>
                </div>
                <div className="p-4 font-mono text-[11px] h-48 overflow-y-auto space-y-1 custom-scrollbar bg-black">
                    {dbLogs.length === 0 && <div className="text-zinc-800 italic">No activity recorded...</div>}
                    {dbLogs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-gray-600 shrink-0">[{log.time}]</span>
                            <span className={log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-green-500' : 'text-zinc-400'}>{log.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DatabaseTab;
