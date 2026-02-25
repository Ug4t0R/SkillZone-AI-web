
import React, { useState } from 'react';
import { Instagram, Twitch, Mail, User, Gamepad2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionConfig } from '../services/sectionConfig';
import { AppView } from '../types';

interface FooterProps {
    sections?: SectionConfig;
    onNavigate?: (view: AppView) => void;
}

const Footer: React.FC<FooterProps> = ({ sections, onNavigate }) => {
    const { t } = useAppContext();
    const [logoError, setLogoError] = useState(false);

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
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('skillcheck:open'))}
                                    className="hover:text-sz-red transition-colors text-left flex items-center gap-1 group"
                                >
                                    <Gamepad2 className="w-3 h-3 group-hover:text-sz-red transition-colors" />
                                    <span>Skill Check</span>
                                    <span className="text-[8px] bg-sz-red/20 text-sz-red px-1.5 py-0.5 rounded-sm font-bold uppercase">Quiz</span>
                                </button>
                            </li>
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
                            <a href="mailto:info@skillzone.cz" className="w-11 h-11 rounded-sm border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all text-gray-400">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 text-center text-gray-600 text-xs font-mono">
                    <p>&copy; {new Date().getFullYear()} SkillZone.cz. {t('footer_rights')}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
