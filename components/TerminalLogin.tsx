
import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, Cpu, Globe, X } from 'lucide-react';
import { signInWithGoogle, signOut } from '../services/supabaseClient';

interface TerminalLoginProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const AUTHORIZED_EMAIL = 'tomas@skillzone.cz';

const TerminalLogin: React.FC<TerminalLoginProps> = ({ onSuccess, onCancel }) => {
    const [step, setStep] = useState(0);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const logs = [
        "> INITIALIZING BOOT SEQUENCE...",
        "> LOADING NETWORK_PROTOCOLS.DLL",
        "> ESTABLISHING SECURE TUNNEL...",
        "> HANDSHAKE COMPLETE.",
        "> PROTOCOL: GOOGLE_OAUTH_ONLY"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            if (step < logs.length - 1) setStep(s => s + 1);
            else clearInterval(timer);
        }, 200);
        return () => clearInterval(timer);
    }, [step]);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        setError(null);
        try {
            await signInWithGoogle();
            // Redirect happens via Supabase, page will reload
        } catch (err: any) {
            setError("LINK_FAILURE: " + err.message);
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4 font-mono">
            {/* Scanline Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 bg-[length:100%_2px,3px_100%] opacity-50"></div>
            
            <div className="max-w-md w-full bg-zinc-900 border-2 border-green-500/30 p-8 shadow-[0_0_50px_rgba(34,197,94,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20"></div>
                
                <div className="flex items-center justify-between mb-8 text-green-500">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-6 h-6 animate-pulse" />
                        <h2 className="text-xl font-bold tracking-[0.2em] uppercase">Root_Gate_v5.0</h2>
                    </div>
                    <button onClick={onCancel} className="text-zinc-600 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-1 mb-8 min-h-[100px] border-l border-green-500/20 pl-4">
                    {logs.slice(0, step + 1).map((log, i) => (
                        <div key={i} className="text-green-500/80 text-[10px] md:text-xs">
                            {log}
                        </div>
                    ))}
                </div>

                {step === logs.length - 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="space-y-4">
                            <button 
                                onClick={handleGoogleLogin}
                                disabled={isLoggingIn}
                                className="w-full bg-white text-black hover:bg-green-500 hover:text-black font-black py-4 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 border border-white group-hover:scale-110 transition-transform duration-300 pointer-events-none opacity-20"></div>
                                {isLoggingIn ? <Cpu className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                                CONNECT_VIA_NEURAL_LINK
                            </button>
                            
                            <div className="text-center">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse">
                                    [ Authorized_Personnel_Only ]
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold bg-red-500/10 p-3 border border-red-500/20 animate-pulse">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                {error.toUpperCase()}
                            </div>
                        )}

                        <button 
                            type="button"
                            onClick={onCancel}
                            className="w-full py-2 text-[10px] text-zinc-700 hover:text-zinc-400 font-bold uppercase tracking-widest transition-colors"
                        >
                            [ ABORT_MISSION ]
                        </button>
                    </div>
                )}

                {/* Decorative bottom element */}
                <div className="mt-8 pt-4 border-t border-green-500/5 flex justify-between items-center text-[8px] text-zinc-700 font-mono">
                    <span>IP_LOGGING: ACTIVE</span>
                    <span>ENCRYPTION: AES-256</span>
                </div>
            </div>
        </div>
    );
};

export default TerminalLogin;
