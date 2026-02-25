// DevMenu Brain (Neural) Tab Component
import React, { useState } from 'react';
import { Brain, Cpu, Save, RotateCcw, Send, Settings, BookOpen, Plus, Trash2, MapPin, Tag, ShieldOff } from 'lucide-react';
import { AiSettings, SkillerState, BranchInfo, KeywordRule } from '../../types';
import { saveAiSettings, resetAiSettings, getAiSettings, DEFAULT_AI_SETTINGS, getDailyMessageCount } from '../../utils/devTools';
import { sendMessageToGemini } from '../../services/geminiService';
import RichTextEditor from './RichTextEditor';

interface BrainTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
    aiSettings: AiSettings;
    setAiSettings: (s: AiSettings) => void;
    skillerState: SkillerState | null;
}

const BrainTab: React.FC<BrainTabProps> = ({ addLog, aiSettings, setAiSettings, skillerState }) => {
    const [testPrompt, setTestPrompt] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [isTestingAi, setIsTestingAi] = useState(false);

    const handleSaveAi = async () => {
        await saveAiSettings(aiSettings);
        addLog("AI Brain parameters and Manual updated.", 'success');
    };

    const manual = aiSettings.manual || DEFAULT_AI_SETTINGS.manual!;

    const updateManual = (key: keyof typeof manual, value: any) => {
        setAiSettings({ ...aiSettings, manual: { ...manual, [key]: value } });
    };

    const addFaq = () => {
        updateManual('faq', [...manual.faq, { questionPattern: '', answerGuide: '' }]);
    };

    const updateFaq = (index: number, field: 'questionPattern' | 'answerGuide', value: string) => {
        const newFaq = [...manual.faq];
        newFaq[index][field] = value;
        updateManual('faq', newFaq);
    };

    const removeFaq = (index: number) => {
        updateManual('faq', manual.faq.filter((_, i) => i !== index));
    };

    // Branches
    const branches = manual.branches || [];
    const addBranch = () => updateManual('branches', [...branches, { name: '', address: '', hours: '', note: '' }]);
    const updateBranch = (i: number, field: keyof BranchInfo, val: string) => {
        const next = [...branches]; next[i] = { ...next[i], [field]: val }; updateManual('branches', next);
    };
    const removeBranch = (i: number) => updateManual('branches', branches.filter((_, j) => j !== i));

    // Keywords
    const keywords = manual.keywords || [];
    const addKeyword = () => updateManual('keywords', [...keywords, { trigger: '', reaction: '' }]);
    const updateKeyword = (i: number, field: keyof KeywordRule, val: string) => {
        const next = [...keywords]; next[i] = { ...next[i], [field]: val }; updateManual('keywords', next);
    };
    const removeKeyword = (i: number) => updateManual('keywords', keywords.filter((_, j) => j !== i));

    // Taboo
    const taboo = manual.taboo || [];
    const [newTaboo, setNewTaboo] = useState('');
    const addTaboo = () => { if (newTaboo.trim()) { updateManual('taboo', [...taboo, newTaboo.trim()]); setNewTaboo(''); } };
    const removeTaboo = (i: number) => updateManual('taboo', taboo.filter((_, j) => j !== i));

    const handleAiTest = async () => {
        if (!testPrompt.trim()) return;
        setIsTestingAi(true);
        addLog("Testing Skiller Neural Path...", 'info');
        try {
            const resp = await sendMessageToGemini(testPrompt, []);
            setTestResponse(resp);
        } catch (e) {
            addLog("AI Test failed.", 'error');
        }
        setIsTestingAi(false);
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
            {/* Settings */}
            <div className="space-y-6">
                <div className="bg-zinc-800/50 p-6 rounded-lg border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 font-orbitron flex items-center gap-2 uppercase">
                        <Brain className="w-5 h-5 text-sz-red" /> Brain_Configuration
                    </h3>

                    <div className="space-y-4">
                        <div className="bg-sz-red/10 border border-sz-red/30 p-3 rounded flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-sz-red" />
                                <span className="text-xs font-bold text-white uppercase tracking-tighter">Daily Usage Tracker</span>
                            </div>
                            <span className="text-sm font-mono text-sz-red font-bold">{getDailyMessageCount()} / 100</span>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Model_Override</label>
                            <select
                                className="w-full bg-black border border-white/10 p-2 text-white text-sm"
                                value={aiSettings.model}
                                onChange={e => setAiSettings({ ...aiSettings, model: e.target.value })}
                            >
                                <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                                <option value="gemini-3-pro-preview">Gemini 3 Pro (Smart)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block flex justify-between">
                                Temperature <span>{aiSettings.temperature}</span>
                            </label>
                            <input
                                type="range" min="0" max="1" step="0.1"
                                className="w-full accent-sz-red"
                                value={aiSettings.temperature}
                                onChange={e => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">System_Prompt</label>
                            <RichTextEditor
                                value={aiSettings.systemPrompt}
                                onChange={v => setAiSettings({ ...aiSettings, systemPrompt: v })}
                                placeholder="System prompt..."
                                minHeight="260px"
                                codeMode
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSaveAi} className="flex-1 py-3 bg-sz-red text-white font-bold uppercase rounded flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> Apply Changes
                            </button>
                            <button onClick={async () => { await resetAiSettings(); setAiSettings(DEFAULT_AI_SETTINGS); }} className="p-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Console */}
            <div className="space-y-6">
                <div className="bg-black/40 rounded-lg border border-white/10 flex flex-col h-full">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-800/30">
                        <h3 className="text-sm font-bold text-white font-orbitron uppercase">Neural_Debugger</h3>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${skillerState?.batteryLevel! > 50 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-[10px] text-gray-500 font-mono">{skillerState?.batteryLevel}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-4 font-mono text-xs space-y-4 h-[400px] overflow-y-auto custom-scrollbar bg-black">
                        <div className="text-zinc-600 italic">--- System Ready. Model: {aiSettings.model} ---</div>
                        {testPrompt && (
                            <div className="text-blue-400">
                                <span className="text-zinc-700">DEBUG_INPUT:</span> {testPrompt}
                            </div>
                        )}
                        {isTestingAi && (
                            <div className="text-sz-red animate-pulse italic">Thinking...</div>
                        )}
                        {testResponse && (
                            <div className="p-3 bg-sz-red/10 border border-sz-red/20 text-sz-red rounded">
                                <span className="text-zinc-500 block mb-1">SKILLER_OUTPUT:</span>
                                {testResponse}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/40">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type debug query..."
                                className="flex-1 bg-zinc-800 border border-white/5 px-4 py-3 text-white text-sm focus:outline-none focus:border-sz-red"
                                value={testPrompt}
                                onChange={e => setTestPrompt(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAiTest()}
                            />
                            <button
                                onClick={handleAiTest}
                                disabled={isTestingAi}
                                className="bg-sz-red hover:bg-sz-red-dark text-white p-3 rounded disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Skiller Manual Settings */}
                <div className="bg-zinc-800/50 p-6 rounded-lg border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 font-orbitron flex items-center gap-2 uppercase">
                        <BookOpen className="w-5 h-5 text-sz-red" /> Skiller_Manual
                    </h3>
                    <p className="text-xs text-gray-400 mb-6">Definujte, jak se The Skiller chová. Vše se automaticky sestaví do system promptu na pozadí.</p>

                    <div className="space-y-6">
                        {/* Core Personality */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Základní Osobnost (Tone of Voice)</label>
                            <textarea
                                className="w-full bg-black border border-white/10 p-3 text-white text-sm min-h-[80px] focus:border-sz-red rounded"
                                value={manual.corePersonality}
                                onChange={e => updateManual('corePersonality', e.target.value)}
                                placeholder="Např: Jsi drzý, sebevědomý, používáš slang..."
                            />
                        </div>

                        {/* Unknown Topics */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Odpověď na neznámá témata</label>
                            <textarea
                                className="w-full bg-black border border-white/10 p-3 text-white text-sm min-h-[60px] focus:border-sz-red rounded"
                                value={manual.unknownTopicResponse}
                                onChange={e => updateManual('unknownTopicResponse', e.target.value)}
                            />
                        </div>

                        {/* ─── BRANCHES ─── */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs text-sz-red uppercase font-bold flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> Pobočky SkillZone
                                </label>
                                <button onClick={addBranch} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Přidat
                                </button>
                            </div>
                            <div className="space-y-3">
                                {branches.map((b, i) => (
                                    <div key={i} className="bg-black/50 p-3 rounded border border-white/5 space-y-2 relative group">
                                        <button onClick={() => removeBranch(i)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="grid grid-cols-2 gap-2 pr-6">
                                            <input value={b.name} onChange={e => updateBranch(i, 'name', e.target.value)}
                                                className="bg-zinc-900 border border-white/10 p-2 text-sm text-white rounded focus:border-sz-red"
                                                placeholder="Název (Žižkov)" />
                                            <input value={b.hours} onChange={e => updateBranch(i, 'hours', e.target.value)}
                                                className="bg-zinc-900 border border-white/10 p-2 text-sm text-amber-300 rounded focus:border-sz-red"
                                                placeholder="Otevírací doba" />
                                        </div>
                                        <input value={b.address} onChange={e => updateBranch(i, 'address', e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/10 p-2 text-sm text-gray-300 rounded focus:border-sz-red"
                                            placeholder="Adresa" />
                                        <input value={b.note || ''} onChange={e => updateBranch(i, 'note', e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/10 p-2 text-xs text-gray-500 rounded focus:border-sz-red"
                                            placeholder="Poznámka (volitelné): hardware, rok otevření..." />
                                    </div>
                                ))}
                                {branches.length === 0 && <div className="text-center text-xs text-gray-600 py-3 italic">Žádné pobočky. Přidej první.</div>}
                            </div>
                        </div>

                        {/* ─── KEYWORDS ─── */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs text-sz-red uppercase font-bold flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" /> Klíčová slova → Reakce
                                </label>
                                <button onClick={addKeyword} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Přidat
                                </button>
                            </div>
                            <div className="space-y-2">
                                {keywords.map((k, i) => (
                                    <div key={i} className="bg-black/50 p-3 rounded border border-white/5 space-y-2 relative group">
                                        <button onClick={() => removeKeyword(i)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="pr-6">
                                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Pokud zmíní:</span>
                                            <input value={k.trigger} onChange={e => updateKeyword(i, 'trigger', e.target.value)}
                                                className="w-full bg-zinc-900 border border-white/10 p-2 text-sm text-yellow-400 rounded focus:border-sz-red"
                                                placeholder="konkurence / jiná herna / lag ..." />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Reaguj takto:</span>
                                            <textarea value={k.reaction} onChange={e => updateKeyword(i, 'reaction', e.target.value)}
                                                className="w-full bg-zinc-900 border border-white/10 p-2 text-sm text-green-400 min-h-[50px] rounded focus:border-sz-red resize-none"
                                                placeholder="Odsekni, že máme nejlepší net v Praze..." />
                                        </div>
                                    </div>
                                ))}
                                {keywords.length === 0 && <div className="text-center text-xs text-gray-600 py-3 italic">Žádná klíčová slova.</div>}
                            </div>
                        </div>

                        {/* ─── TABOO ─── */}
                        <div className="pt-4 border-t border-white/10">
                            <label className="text-xs text-sz-red uppercase font-bold flex items-center gap-1.5 mb-3">
                                <ShieldOff className="w-3.5 h-3.5" /> Tabu témata
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {taboo.map((t, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded border border-red-500/20">
                                        {t}
                                        <button onClick={() => removeTaboo(i)} className="text-red-600 hover:text-red-300 ml-1">&times;</button>
                                    </span>
                                ))}
                                {taboo.length === 0 && <span className="text-gray-600 text-xs italic">Žádná tabu témata.</span>}
                            </div>
                            <div className="flex gap-2">
                                <input value={newTaboo} onChange={e => setNewTaboo(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addTaboo()}
                                    className="flex-1 bg-black border border-white/10 p-2 text-sm text-white rounded focus:border-sz-red"
                                    placeholder="Nové téma (Enter pro přidání)" />
                                <button onClick={addTaboo} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* ─── FAQ ─── */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs text-sz-red uppercase font-bold">Instrukce k častým dotazům (FAQ)</label>
                                <button onClick={addFaq} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Přidat Pravidlo
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {manual.faq.map((f, i) => (
                                    <div key={i} className="bg-black/50 p-3 rounded border border-white/5 relative group">
                                        <button onClick={() => removeFaq(i)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="mb-2 pr-6">
                                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Když uživatel napíše něco jako:</span>
                                            <input
                                                className="w-full bg-zinc-900 border border-white/10 p-2 text-sm text-yellow-500 focus:border-sz-red rounded"
                                                value={f.questionPattern}
                                                onChange={e => updateFaq(i, 'questionPattern', e.target.value)}
                                                placeholder="Kde najdu SkillZone?"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Odpověz v tomto smyslu:</span>
                                            <textarea
                                                className="w-full bg-zinc-900 border border-white/10 p-2 text-sm text-green-400 min-h-[60px] focus:border-sz-red rounded"
                                                value={f.answerGuide}
                                                onChange={e => updateFaq(i, 'answerGuide', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {manual.faq.length === 0 && <div className="text-center text-xs text-gray-500 py-4 italic">Žádná pravidla pro časté dotazy.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrainTab;
