
import React, { useState } from 'react';
// Added X to the imports from lucide-react to fix 'Cannot find name X' error
import { ChevronDown, ScanFace, ShieldCheck, Activity, Brain, X } from 'lucide-react';
import HeroPresentation from './HeroPresentation';
import { useAppContext } from '../context/AppContext';
import { getUserProfile, saveUserProfile } from '../utils/devTools';

const Hero: React.FC = () => {
  const { t } = useAppContext();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const startScan = () => {
    setIsScanning(true);
    setScanResult(null);

    // Safety timeout — forcefully dismiss overlay after 10s no matter what
    const safety = setTimeout(() => { setIsScanning(false); }, 10000);

    setTimeout(async () => {
      const classes = ["Elite Fragger", "Tactical Master", "Grind Overlord", "Neon Wanderer", "Neural Nomad"];
      const result = classes[Math.floor(Math.random() * classes.length)];

      try {
        const profile = await getUserProfile();
        profile.interactionCount += 5;
        await saveUserProfile(profile);
      } catch { /* DB fail is fine — scan still works */ }

      setScanResult(result);
      setIsScanning(false);
      clearTimeout(safety);
    }, 3000);
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-light-bg dark:bg-dark-bg transition-colors duration-300">

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 bg-dark-bg">
        <div className="absolute inset-0 bg-motherboard opacity-20 dark:opacity-30"></div>
        <div className="absolute inset-0 motherboard-energy opacity-30 dark:opacity-50 pointer-events-none"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sz-red/5 dark:bg-sz-red/10 blur-[150px] rounded-full z-0 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sz-red/5 dark:bg-sz-red/5 blur-[120px] rounded-full z-0 animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-light-bg/90 via-light-bg/50 to-light-bg dark:from-dark-bg/90 dark:via-dark-bg/50 dark:to-dark-bg z-0"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto w-full">
        <div className="mb-8 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <button
            onClick={startScan}
            className="group px-4 py-1 border border-sz-red/30 bg-sz-red/10 rounded-sm text-sz-red font-mono text-xs md:text-sm tracking-[0.2em] uppercase shadow-[0_0_10px_rgba(227,30,36,0.2)] flex items-center gap-3 hover:bg-sz-red hover:text-white transition-all"
          >
            <ScanFace className="w-4 h-4 group-hover:scale-125 transition-transform" />
            {scanResult ? `ID: ${scanResult}` : 'Initialize_Neural_Scan'}
          </button>
        </div>

        {/* Interactive Presentation Component */}
        <div className="mb-16 min-h-[300px]">
          <HeroPresentation />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 mt-8">
          <button
            onClick={() => {
              const techSection = document.getElementById('tech');
              if (techSection) techSection.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-10 py-4 bg-sz-red hover:bg-white hover:text-black text-white font-orbitron font-bold text-lg transition-all clip-angle tracking-wider shadow-[0_0_20px_rgba(227,30,36,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            {t('hero_cta')}
          </button>

          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-black/50 px-4 py-2 rounded-sm border border-black/5 dark:border-white/5 backdrop-blur-sm shadow-sm">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-bg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs">👽</div>
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-bg bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-xs">👾</div>
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-bg bg-zinc-400 dark:bg-zinc-600 flex items-center justify-center text-xs">🤖</div>
            </div>
            <span className="text-sm font-medium"><span className="text-black dark:text-white font-bold">18 179</span> {t('hero_players')}</span>
          </div>
        </div>
      </div>

      {/* Full Screen Scan Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-sz-red/20 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-1 bg-sz-red shadow-[0_0_30px_#E31E24] animate-[scan_3s_ease-in-out_infinite]"></div>
          </div>
          <style>{`
                  @keyframes scan {
                      0% { transform: translateY(0); }
                      50% { transform: translateY(100vh); }
                      100% { transform: translateY(0); }
                  }
              `}</style>
          <div className="relative">
            <div className="w-64 h-64 border-2 border-sz-red rounded-full flex items-center justify-center animate-pulse">
              <div className="w-48 h-48 border border-sz-red/30 rounded-full flex items-center justify-center animate-spin-slow">
                <Brain className="w-20 h-20 text-sz-red" />
              </div>
            </div>
            <div className="absolute -inset-8 border border-sz-red/20 rounded-full animate-ping"></div>
          </div>
          <div className="mt-12 text-center">
            <div className="text-sz-red font-orbitron font-black text-2xl uppercase tracking-[0.3em] animate-pulse">Neural_Sync_Active</div>
            <div className="mt-2 text-white font-mono text-xs uppercase tracking-widest opacity-70">Skenování biometrických dat a match history...</div>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="fixed top-24 right-8 z-[60] bg-black/90 border border-sz-red p-6 rounded shadow-[0_0_30px_rgba(227,30,36,0.4)] animate-in slide-in-from-right duration-500 max-w-sm">
          <button onClick={() => setScanResult(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-sz-red/20 border border-sz-red flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-sz-red" /></div>
            <div>
              <div className="text-gray-500 text-[10px] font-mono uppercase">Neural_ID: Found</div>
              <div className="text-white font-orbitron font-bold uppercase">{scanResult}</div>
            </div>
          </div>
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex justify-between items-center text-[10px] font-mono"><span className="text-gray-500 uppercase">Skill_Tier</span> <span className="text-sz-red font-bold">LEGENDARY</span></div>
            <div className="flex justify-between items-center text-[10px] font-mono"><span className="text-gray-500 uppercase">Status</span> <span className="text-green-500 font-bold flex items-center gap-1"><Activity className="w-3 h-3" /> VERIFIED</span></div>
          </div>
        </div>
      )}

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-bounce text-sz-red opacity-70">
        <ChevronDown className="w-8 h-8" />
      </div>
    </div>
  );
};

export default Hero;
