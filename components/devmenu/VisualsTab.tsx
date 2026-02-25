// DevMenu Visual Forge Tab Component
import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, RefreshCw, Cpu, CloudDownload, Copy, Eye, EyeOff, Zap } from 'lucide-react';
import { generateAiImage } from '../../services/geminiService';
import { getAnimationsEnabled, setAnimationsEnabled } from '../../utils/storage/animations';

interface VisualsTabProps {
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
    generatedImages: string[];
    setGeneratedImages: React.Dispatch<React.SetStateAction<string[]>>;
}

const VisualsTab: React.FC<VisualsTabProps> = ({ addLog, generatedImages, setGeneratedImages }) => {
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [animationsOn, setAnimationsOn] = useState(getAnimationsEnabled());

    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) return;
        setIsGeneratingImage(true);
        addLog(`Fusing pixels for: ${imagePrompt}`, 'info');
        const result = await generateAiImage(imagePrompt);
        if (result) {
            setGeneratedImages(prev => [result, ...prev]);
            addLog("Vizuál vygenerován úspěšně.", 'success');
        } else {
            addLog("Generování obrázku selhalo.", 'error');
        }
        setIsGeneratingImage(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="bg-zinc-800/50 p-6 border border-sz-red/20 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center gap-2 uppercase">
                    <ImageIcon className="text-sz-red w-5 h-5" /> AI_Visual_Forge
                </h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Prompt: Elite gaming trophy, neon red, high detail..."
                        className="flex-1 bg-black border border-white/10 p-3 text-white text-sm focus:border-sz-red outline-none"
                        value={imagePrompt}
                        onChange={e => setImagePrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGenerateImage()}
                    />
                    <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !imagePrompt}
                        className="px-6 bg-sz-red hover:bg-sz-red-dark text-white font-bold uppercase rounded flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGeneratingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Forge
                    </button>
                </div>
            </div>

            {/* Animation Controls */}
            <div className="bg-zinc-800/50 p-6 border border-sz-red/20 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4 font-orbitron flex items-center gap-2 uppercase">
                    <Zap className="text-sz-red w-5 h-5" /> Scroll_Animations
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-300 text-sm">Gaming scroll efekty</p>
                        <p className="text-gray-600 text-xs font-mono mt-1">Glitch-in, slide-up, scale-in, stagger</p>
                    </div>
                    <button
                        onClick={() => {
                            const next = !animationsOn;
                            setAnimationsOn(next);
                            setAnimationsEnabled(next);
                            addLog(next ? 'Animace zapnuty — reload pro aplikaci.' : 'Animace vypnuty — reload pro aplikaci.', next ? 'success' : 'info');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded border font-bold text-sm uppercase font-mono transition-all ${animationsOn
                                ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                : 'border-white/10 bg-black text-gray-500 hover:border-white/30'
                            }`}
                    >
                        {animationsOn ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {animationsOn ? 'ON' : 'OFF'}
                    </button>
                </div>
                {!animationsOn && (
                    <p className="mt-3 text-yellow-500/70 text-xs font-mono border-l-2 border-yellow-500/30 pl-3">
                        ⚠ Animace jsou vypnuty. Změna se projeví po refreshi stránky.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedImages.map((url, i) => (
                    <div key={i} className="group relative bg-black rounded overflow-hidden border border-white/10 hover:border-sz-red/50 transition-all">
                        <img src={url} className="w-full h-auto" alt="Generated" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button onClick={() => {
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `skillzone-ai-${Date.now()}.png`;
                                link.click();
                            }} className="p-2 bg-sz-red text-white rounded"><CloudDownload className="w-5 h-5" /></button>
                            <button onClick={() => {
                                navigator.clipboard.writeText(url);
                                addLog("Odkaz na obrázek zkopírován.", 'info');
                            }} className="p-2 bg-zinc-700 text-white rounded"><Copy className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
                {generatedImages.length === 0 && !isGeneratingImage && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 text-zinc-700 font-mono italic">
                        Forge is cold. Enter a prompt to start melting pixels.
                    </div>
                )}
                {isGeneratingImage && (
                    <div className="aspect-video bg-zinc-800/50 rounded flex flex-col items-center justify-center animate-pulse border border-sz-red/20">
                        <Cpu className="w-10 h-10 text-sz-red animate-spin mb-4" />
                        <span className="text-xs font-mono text-sz-red uppercase tracking-widest">Synthesizing_Pixels...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualsTab;
