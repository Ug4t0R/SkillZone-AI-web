
import React, { useState } from 'react';
import { Instagram, Twitch, MessageCircle, User, Gamepad2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionConfig } from '../services/sectionConfig';
import { AppView } from '../types';

interface FooterProps {
    sections?: SectionConfig;
    onNavigate?: (view: AppView) => void;
}

const Footer: React.FC<FooterProps> = ({ sections, onNavigate }) => {
    const { t, setBrainrot } = useAppContext();
    const [logoError, setLogoError] = useState(false);
    const [versionClicks, setVersionClicks] = useState(0);

    const handleVersionClick = () => {
        const newCount = versionClicks + 1;
        setVersionClicks(newCount);
        if (newCount === 5) {
            if (setBrainrot) setBrainrot(true);
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to see the brainrot
            setVersionClicks(0);
        }
    };

    const handleNav = (view: AppView) => {
        onNavigate?.(view);
        window.scrollTo(0, 0);
    };

    const arrow = '-->';

    return (
        <footer id="footer" className="bg-black border-t border-white/10 pt-16 pb-14">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Brand */}
                    <div>
                        <div className="mb-6">
                            {!logoError ? (
                                <img
                                    src="/SkillZone_logo_white.png"
                                    alt="SkillZone"
                                    loading="lazy"
                                    className="h-12 w-auto object-contain"
                                    style={{ maxWidth: '200px' }}
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <img
                                    src="/SkillZone_logo_white.png"
                                    alt="SkillZone"
                                    loading="lazy"
                                    className="h-12 w-auto object-contain"
                                    style={{ maxWidth: '200px' }}
                                />
                            )}
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed mb-4">
                            {t('footer_desc')}
                        </p>
                        <div className="text-gray-500 text-xs border-l-2 border-sz-red pl-3 py-1 bg-zinc-900/50">
                            <div className="flex items-center gap-2 mb-1 text-white font-bold">
                                <User className="w-3 h-3" />
                                {t('footer_boss_label')}
                            </div>
                            {t('footer_boss_text')}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase tracking-wider">{t('footer_quick')}</h4>
                        <ul className="space-y-2 text-gray-400 text-sm font-mono">
                            {(!sections || sections.locations) && (
                                <li><button onClick={() => handleNav('locations')} className="hover:text-sz-red transition-colors">{arrow} {t('nav_locations')}</button></li>
                            )}
                            {(!sections || sections.techspecs) && (
                                <li><a href="#tech" className="hover:text-sz-red transition-colors">{arrow} {t('tech_title')}</a></li>
                            )}
                            {(!sections || sections.booking) && (
                                <li><button onClick={() => handleNav('booking')} className="hover:text-sz-red transition-colors">{arrow} {t('nav_booking')}</button></li>
                            )}
                            {(!sections || sections.history) && (
                                <li><button onClick={() => handleNav('history')} className="hover:text-sz-red transition-colors">{arrow} {t('nav_story')}</button></li>
                            )}
                            <li>
                                <button onClick={() => handleNav('reservation-status')} className="hover:text-sz-red transition-colors text-left flex items-center gap-1 group">
                                    <span className="text-sz-red opacity-0 group-hover:opacity-100 transition-opacity">►</span> Stav mé rezervace
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('skillcheck:open'))}
                                    className="hover:text-sz-red transition-colors text-left flex items-center gap-1 group"
                                >
                                    <Gamepad2 className="w-3 h-3 group-hover:text-sz-red transition-colors" />
                                    <span>Skill Check</span>
                                    <span className="text-[8px] bg-sz-red/20 text-sz-red px-1.5 py-0.5 rounded-sm font-bold uppercase">Quiz</span>
                                </button>
                            </li>
                            <li><button onClick={() => handleNav('contact')} className="hover:text-sz-red transition-colors">{arrow} Kontakt</button></li>
                        </ul>
                    </div>

                    {/* Socials */}
                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase tracking-wider">Socials</h4>
                        <div className="flex gap-4">
                            <a href="https://instagram.com/skillzone.cz" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-sm border border-white/10 flex items-center justify-center hover:bg-sz-red hover:border-sz-red hover:text-white transition-all text-gray-400">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://twitch.tv/skillzonetv" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-sm border border-white/10 flex items-center justify-center hover:bg-[#9146FF] hover:border-[#9146FF] hover:text-white transition-all text-gray-400">
                                <Twitch className="w-5 h-5" />
                            </a>
                            <a href="https://wa.me/420777766112" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-sm border border-white/10 flex items-center justify-center hover:bg-[#25D366] hover:border-[#25D366] hover:text-white transition-all text-gray-400">
                                <MessageCircle className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col items-center justify-center text-gray-600 text-xs font-mono relative">
                    <p>&copy; {new Date().getFullYear()} SkillZone.cz. {t('footer_rights')}</p>
                    <p className="mt-1 text-gray-600">
                        {t('footer_boss_label') ? '' : ''}{/* spacer */}
                        Problém v provozovně? <a href="tel:+420777766112" className="text-sz-red hover:underline">777 766 112</a>
                    </p>
                    <button
                        onClick={handleVersionClick}
                        className="mt-2 text-gray-700 hover:text-sz-red transition-colors text-[11px] cursor-pointer"
                        title="SkillZone Build Version"
                    >
                        v26.03.02
                    </button>
                    {versionClicks > 0 && versionClicks < 5 && (
                        <div className="absolute -bottom-4 text-[9px] text-sz-red animate-pulse">
                            {5 - versionClicks}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
