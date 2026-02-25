
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Sun, Moon, ShieldCheck, Terminal } from 'lucide-react';
import { AppView } from '../types';
import { useAppContext } from '../context/AppContext';
import { Language } from '../context/AppContext';
import { SectionConfig } from '../services/sectionConfig';

// Flag emoji + short code for each language
const LANG_FLAGS: Record<Language, { flag: string; code: string }> = {
  cs: { flag: '🇨🇿', code: 'CS' },
  sk: { flag: '🇸🇰', code: 'SK' },
  en: { flag: '🇬🇧', code: 'EN' },
  de: { flag: '🇩🇪', code: 'DE' },
  pl: { flag: '🇵🇱', code: 'PL' },
  ru: { flag: '🇷🇺', code: 'RU' },
  ua: { flag: '🇺🇦', code: 'UA' },
  vi: { flag: '🇻🇳', code: 'VN' },
};

interface NavbarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  adminStatus?: boolean;
  onAdminClick: () => void;
  sections?: SectionConfig;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView, adminStatus, onAdminClick, sections }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme, language, setLanguage, allLanguages, t, isBrainrot, setBrainrot, isCorporate, setCorporate } = useAppContext();
  const [logoError, setLogoError] = useState(false);



  // Close lang dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allNavLinks: { name: string; id: AppView; sectionKey?: keyof SectionConfig }[] = [
    { name: t('nav_home'), id: 'home' },
    { name: t('nav_locations'), id: 'locations', sectionKey: 'locations' },
    { name: t('nav_story'), id: 'history', sectionKey: 'history' },
    { name: t('nav_pricing'), id: 'pricing', sectionKey: 'pricing' },
    { name: t('nav_services'), id: 'services', sectionKey: 'services' },
  ];

  // Filter links based on sections config
  const navLinks = sections
    ? allNavLinks.filter(link => !link.sectionKey || sections[link.sectionKey])
    : allNavLinks;

  const handleNavClick = (id: AppView) => {
    onChangeView(id);
    setIsOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLangSelect = (lang: Language) => {
    setLanguage(lang);
    setLangDropdownOpen(false);
  };

  const logoSrc = theme === 'dark' ? '/SkillZone_logo_white.png' : '/SkillZone_logo_red.png';

  return (
    <nav className="fixed w-full z-50 bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur-md border-b border-gray-200 dark:border-sz-red/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Area */}
          <div className="flex-shrink-0 flex items-center cursor-pointer gap-2" onClick={() => handleNavClick('home')}>
            {!logoError ? (
              <img
                src={logoSrc}
                alt="SkillZone"
                className="h-8 md:h-12 w-auto object-contain transition-transform hover:scale-105"
                style={{ maxWidth: '180px' }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <img
                src="/SkillZone_logo_white.png"
                alt="SkillZone"
                className="h-8 md:h-12 w-auto object-contain transition-transform hover:scale-105"
              />
            )}

            {/* Admin Status Indicator */}
            {adminStatus && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full ml-4 animate-pulse">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span className="text-[9px] font-mono font-bold text-green-500 uppercase tracking-tighter">Secure_Tunnel: Active</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center">
            <div className="ml-10 flex items-baseline space-x-6">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`${currentView === link.id ? 'text-sz-red border-b-2 border-sz-red' : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
                    } transition-colors px-3 py-2 text-sm font-bold uppercase tracking-wide font-orbitron`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Toggles & Admin Trigger */}
            <div className="flex items-center gap-3 ml-6 pl-6 border-l border-gray-300 dark:border-white/10">
              <button
                onClick={onAdminClick}
                className={`p-2 rounded-full transition-all ${adminStatus ? 'text-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-gray-500 dark:text-gray-400 hover:text-sz-red'}`}
                title="Root Access"
              >
                <Terminal className="w-4 h-4" />
              </button>

              {/* Language Flag Dropdown */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 text-sm font-bold font-mono text-gray-600 dark:text-gray-300 hover:text-sz-red transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <span className="text-base">{LANG_FLAGS[language].flag}</span>
                  <span className="text-[10px] tracking-wider">{LANG_FLAGS[language].code}</span>
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl shadow-black/20 p-2 z-50 min-w-[200px]">
                    <div className="grid grid-cols-4 gap-1">
                      {allLanguages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLangSelect(lang)}
                          className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all text-center ${language === lang
                            ? 'bg-sz-red/10 ring-1 ring-sz-red text-sz-red'
                            : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
                            }`}
                          title={lang.toUpperCase()}
                        >
                          <span className="text-xl">{LANG_FLAGS[lang].flag}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider">{LANG_FLAGS[lang].code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* 🧠 Gen Z toggle — always visible */}
              <button
                onClick={() => setBrainrot(!isBrainrot)}
                className={`p-2 rounded-full transition-all duration-300 ${isBrainrot
                  ? 'text-yellow-400 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.3)] ring-1 ring-yellow-500/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-yellow-400'
                  }`}
                title={isBrainrot ? 'Disable Gen Z Mode' : 'Enable Gen Z Mode'}
              >
                <span className="text-base">🧠</span>
              </button>

              {/* 🏢 Corporate toggle — always visible */}
              <button
                onClick={() => setCorporate(!isCorporate)}
                className={`p-2 rounded-full transition-all duration-300 ${isCorporate
                  ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-400'
                  }`}
                title={isCorporate ? 'Deaktivovat korporátní režim' : 'Aktivovat korporátní režim'}
              >
                <span className="text-base">🏢</span>
              </button>
            </div>

            {(!sections || sections.booking) && (
              <button
                onClick={() => handleNavClick('booking')}
                className="ml-6 bg-sz-red hover:bg-sz-red-dark text-white px-6 py-2 font-bold text-sm transition-all clip-angle uppercase tracking-widest hover:shadow-[0_0_15px_rgba(227,30,36,0.5)]"
              >
                {t('nav_booking')}
              </button>
            )}
          </div>

          <div className="-mr-2 flex md:hidden items-center gap-2">
            {/* Mobile: Flag button */}
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="text-base p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {LANG_FLAGS[language].flag}
            </button>
            <button
              onClick={onAdminClick}
              className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full ${adminStatus ? 'text-green-500' : 'text-gray-500'}`}
            >
              <Terminal className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 min-w-[44px] min-h-[44px] rounded-md text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6 text-sz-red" /> : <Menu className="h-6 w-6 text-sz-red" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-light-bg dark:bg-card-bg border-b border-sz-red/30">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`${currentView === link.id ? 'text-sz-red bg-gray-200 dark:bg-zinc-900' : 'text-gray-700 dark:text-gray-300'
                  } block w-full text-left px-3 py-3 text-base font-bold font-orbitron border-l-2 border-transparent hover:border-sz-red transition-all`}
              >
                {link.name}
              </button>
            ))}

            {/* Mobile language flag grid — slashed into mobile menu when dropdown is open or always show a compact row */}
            {langDropdownOpen && (
              <div className="px-3 py-2 border-t border-gray-200 dark:border-white/10 mt-2">
                <div className="grid grid-cols-4 gap-2">
                  {allLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => { handleLangSelect(lang); setIsOpen(false); }}
                      className={`flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl transition-all ${language === lang
                        ? 'bg-sz-red/10 ring-1 ring-sz-red'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                    >
                      <span className="text-2xl">{LANG_FLAGS[lang].flag}</span>
                      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{LANG_FLAGS[lang].code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-3 py-3 border-t border-gray-200 dark:border-white/10 mt-2">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              {/* Gen Z toggle in mobile — always visible */}
              <button
                onClick={() => { setBrainrot(!isBrainrot); setIsOpen(false); }}
                className={`flex items-center gap-2 text-sm ${isBrainrot ? 'text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                  }`}
              >
                <span>🧠</span>
                {isBrainrot ? 'Normal' : 'Gen Z'}
              </button>
              {/* Corporate toggle in mobile */}
              <button
                onClick={() => { setCorporate(!isCorporate); setIsOpen(false); }}
                className={`flex items-center gap-2 text-sm ${isCorporate ? 'text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}
              >
                <span>🏢</span>
                {isCorporate ? 'Normal' : 'Korporát'}
              </button>
            </div>
            {/* Gen Z mode status bar in mobile */}
            {isBrainrot && (
              <div className="px-3 py-2 text-[10px] font-bold text-center text-yellow-400/70 uppercase tracking-widest" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                💀 brainrot mode active 💀
              </div>
            )}
            {/* Corporate mode status bar in mobile */}
            {isCorporate && (
              <div className="px-3 py-2 text-[10px] font-bold text-center text-blue-400/70 uppercase tracking-widest" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                🏢 CORPORATE MODE — VÍTEJTE, VÁŽENÝ KLIENTI 🏢
              </div>
            )}
            {(!sections || sections.booking) && (
              <button
                onClick={() => handleNavClick('booking')}
                className="text-white bg-sz-red block w-full text-center px-3 py-3 text-base font-bold font-orbitron mt-2"
              >
                {t('nav_booking')}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

