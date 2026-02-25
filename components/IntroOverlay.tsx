
import React, { useState, useEffect } from 'react';
import { Power } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface IntroOverlayProps {
    onComplete: () => void;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);
    const { t } = useAppContext();
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        // Sequence timing
        const s1 = setTimeout(() => setStep(1), 1000); // Logo
        const s2 = setTimeout(() => setStep(2), 2500); // Line 1
        const s3 = setTimeout(() => setStep(3), 4000); // Line 2
        const s4 = setTimeout(() => setStep(4), 6000); // Line 3 (Red)
        const s5 = setTimeout(() => setStep(5), 8000); // Button/Enter

        return () => {
            clearTimeout(s1);
            clearTimeout(s2);
            clearTimeout(s3);
            clearTimeout(s4);
            clearTimeout(s5);
        };
    }, []);

    const handleEnter = () => {
        setFadeOut(true);
        setTimeout(onComplete, 800); // Wait for fade out transition
    };

    return (
        <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Background grid effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            
            <div className="relative z-10 max-w-4xl w-full px-6 text-center">
                {/* Logo */}
                <div className={`mb-12 transition-all duration-1000 transform ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                     {!logoError ? (
                         <img 
                            src="/SkillZone_logo_white.png" 
                            alt="SkillZone" 
                            className="h-24 md:h-32 w-auto object-contain mx-auto animate-pulse"
                            onError={() => setLogoError(true)}
                         />
                     ) : (
                         <img 
                            src="/SkillZone_logo_white.png" 
                            alt="SkillZone" 
                            className="h-24 md:h-32 w-auto object-contain mx-auto animate-pulse"
                         />
                     )}
                </div>

                {/* Slogan Sequence */}
                <div className="font-orbitron font-black text-3xl md:text-6xl uppercase tracking-tight leading-tight">
                    <div className={`transition-all duration-700 ${step >= 2 ? 'opacity-100 blur-0' : 'opacity-0 blur-lg'}`}>
                        <span className="text-white">{t('intro_s1')}</span>
                    </div>
                    <div className={`transition-all duration-700 delay-100 ${step >= 3 ? 'opacity-100 blur-0' : 'opacity-0 blur-lg'}`}>
                        <span className="text-gray-500 text-2xl md:text-4xl font-sans font-bold">{t('intro_s2')}</span>
                    </div>
                    <div className={`mt-4 transition-all duration-300 transform ${step >= 4 ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 -translate-x-10'}`}>
                        <span className="text-sz-red text-glow block transform -skew-x-12">{t('intro_s3')}</span>
                    </div>
                </div>

                {/* Enter Button */}
                <div className={`mt-16 transition-all duration-1000 ${step >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                    <button 
                        onClick={handleEnter}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-sz-red text-sz-red hover:bg-sz-red hover:text-white transition-all font-orbitron font-bold tracking-widest uppercase"
                    >
                        <Power className="w-5 h-5 group-hover:animate-pulse" />
                        <span>{t('intro_enter')}</span>
                        
                        {/* Button Glow Effect */}
                        <div className="absolute inset-0 bg-sz-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </div>
            </div>

            {/* Footer Loading Bar */}
            <div className="absolute bottom-10 left-0 w-full px-10">
                <div className="h-1 bg-zinc-900 w-full max-w-md mx-auto rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-sz-red transition-all duration-[8000ms] ease-linear"
                        style={{ width: step >= 5 ? '100%' : '0%' }}
                    ></div>
                </div>
                <div className="text-center mt-2 font-mono text-xs text-gray-600 uppercase">
                    {step < 5 ? t('intro_load') : t('intro_ready')}
                </div>
            </div>
        </div>
    );
};

export default IntroOverlay;
