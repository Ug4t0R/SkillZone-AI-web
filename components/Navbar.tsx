
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { AppView } from '../types';
import { useAppContext } from '../context/AppContext';
import { Language } from '../context/AppContext';
import { SectionConfig } from '../services/sectionConfig';
import { getFlagSvgUrl, LANG_FLAG_CODES } from '../utils/flags';

// Short code for each language
const LANG_CODES: Record<Language, string> = {
  cs: 'CS', sk: 'SK', en: 'EN', de: 'DE', pl: 'PL', ru: 'RU', ua: 'UA', vi: 'VN',
};

interface NavbarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  sections: any;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView, sections }) => {
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
    <nav className="fixed w-full z-50 glass-nav transition-colors duration-300">
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


          </div>

          <div className="hidden xl:flex items-center min-w-0">
            <div className="ml-4 flex items-baseline space-x-2 2xl:space-x-4 flex-shrink min-w-0">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`${currentView === link.id ? 'text-sz-red border-b-2 border-sz-red' : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
                    } transition-colors px-1.5 py-2 text-[11px] 2xl:text-sm font-bold uppercase tracking-wide font-orbitron whitespace-nowrap`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-gray-300 dark:border-white/10 flex-shrink-0">

              {/* Language Flag Dropdown */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 text-sm font-bold font-mono text-gray-600 dark:text-gray-300 hover:text-sz-red transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                  aria-label={language === 'cs' ? 'Změnit jazyk' : 'Change language'}
                  aria-expanded={langDropdownOpen}
                >
                  <img src={getFlagSvgUrl(language)} alt={language} className="w-5 h-4 rounded-sm object-cover" />
                  <span className="text-[10px] tracking-wider">{LANG_CODES[language]}</span>
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
                          <img src={getFlagSvgUrl(lang)} alt={lang} className="w-7 h-5 rounded-sm object-cover" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">{LANG_CODES[lang]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title={theme === 'dark' ? 'Světelný režim' : 'Tmavý režim'}
                aria-label={theme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* 3-way Mode Toggle: Normal / Gen Z / Corporate (icon-only) */}
              <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full p-0.5 border border-gray-200 dark:border-white/10">
                <button
                  onClick={() => { setBrainrot(false); setCorporate(false); }}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${!isBrainrot && !isCorporate
                    ? 'bg-white dark:bg-zinc-700 shadow-sm scale-110'
                    : 'opacity-50 hover:opacity-80'
                  }`}
                  title="Normal mode"
                  aria-label="Normální režim"
                >
                  ⚡
                </button>
                <button
                  onClick={() => { setBrainrot(!isBrainrot); setCorporate(false); }}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isBrainrot
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm shadow-purple-500/30 scale-110'
                    : 'opacity-50 hover:opacity-80'
                  }`}
                  title="Gen Z Brainrot Mode"
                  aria-label="Gen Z režim"
                >
                  🧠
                </button>
                <button
                  onClick={() => { setCorporate(!isCorporate); setBrainrot(false); }}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isCorporate
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-sm shadow-blue-500/30 scale-110'
                    : 'opacity-50 hover:opacity-80'
                  }`}
                  title="Corporate Mode"
                  aria-label="Korporátní režim"
                >
                  🏢
                </button>
              </div>
            </div>

            {(!sections || sections.booking) && (
              <button
                onClick={() => handleNavClick('booking')}
                className="ml-4 bg-sz-red hover:bg-sz-red-dark text-white px-4 py-2 font-bold text-xs 2xl:text-sm transition-all clip-angle uppercase tracking-widest hover:shadow-[0_0_15px_rgba(227,30,36,0.5)]"
              >
                {t('nav_booking')}
              </button>
            )}
          </div>

          <div className="-mr-2 flex xl:hidden items-center gap-2">
            {/* Mobile: Flag button */}
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="text-base p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={language === 'cs' ? 'Změnit jazyk' : 'Change language'}
              aria-expanded={langDropdownOpen}
            >
              <img src={getFlagSvgUrl(language)} alt={language} className="w-6 h-4 rounded-sm object-cover" />
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 min-w-[44px] min-h-[44px] rounded-md text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none"
              aria-label={isOpen ? 'Zavřít menu' : 'Otevřít menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6 text-sz-red" /> : <Menu className="h-6 w-6 text-sz-red" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="xl:hidden bg-light-bg dark:bg-card-bg border-b border-sz-red/30">
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
                      <img src={getFlagSvgUrl(lang)} alt={lang} className="w-8 h-6 rounded-sm object-cover" />
                      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{LANG_CODES[lang]}</span>
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
              {/* 3-way Mobile Mode Toggle (icon-only) */}
              <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full p-0.5">
                <button
                  onClick={() => { setBrainrot(false); setCorporate(false); setIsOpen(false); }}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-base transition-all ${!isBrainrot && !isCorporate
                    ? 'bg-white dark:bg-zinc-700 shadow-sm scale-110'
                    : 'opacity-50'
                  }`}
                  aria-label="Normální režim"
                >
                  ⚡
                </button>
                <button
                  onClick={() => { setBrainrot(!isBrainrot); setCorporate(false); setIsOpen(false); }}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-base transition-all ${isBrainrot
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm scale-110'
                    : 'opacity-50'
                  }`}
                  aria-label="Gen Z režim"
                >
                  🧠
                </button>
                <button
                  onClick={() => { setCorporate(!isCorporate); setBrainrot(false); setIsOpen(false); }}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-base transition-all ${isCorporate
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-sm scale-110'
                    : 'opacity-50'
                  }`}
                  aria-label="Korporátní režim"
                >
                  🏢
                </button>
              </div>
            </div>
            {/* Gen Z mode status bar in mobile */}
            {isBrainrot && (
              <div className="px-3 py-2 text-[10px] font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 uppercase tracking-widest" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
                💀 brainrot mode active • aura: immaculate 💀
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

