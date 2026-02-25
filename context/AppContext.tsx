
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, brainrotOverrides, corporateOverrides } from '../translations';
import { loadContentOverrides, getContentOverride } from '../services/contentService';

type Theme = 'dark' | 'light';
export type Language = 'cs' | 'sk' | 'en' | 'de' | 'pl' | 'ru' | 'ua' | 'vi';

const ALL_LANGUAGES: Language[] = ['cs', 'sk', 'en', 'de', 'pl', 'ru', 'ua', 'vi'];

// Map browser locale codes to our language keys
const BROWSER_LOCALE_MAP: Record<string, Language> = {
  cs: 'cs',
  sk: 'sk',
  en: 'en',
  de: 'de',
  pl: 'pl',
  ru: 'ru',
  uk: 'ua',
  vi: 'vi',
};

function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'cs';
  // Check navigator.languages first (ordered by preference), then navigator.language
  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const locale of candidates) {
    const code = locale.split('-')[0].toLowerCase();
    if (code in BROWSER_LOCALE_MAP) return BROWSER_LOCALE_MAP[code];
  }
  return 'cs'; // Default to Czech
}

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  nextLanguage: () => void;
  allLanguages: Language[];
  t: (key: keyof typeof translations['cs']) => string;
  isBrainrot: boolean;
  setBrainrot: (v: boolean) => void;
  isCorporate: boolean;
  setCorporate: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme Logic — default dark
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }
    return 'dark';
  });

  // Language Logic — check localStorage first, then detect from browser
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lang');
      if (saved && ALL_LANGUAGES.includes(saved as Language)) return saved as Language;
    }
    return detectBrowserLanguage();
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', language);
    const htmlLang = language === 'ua' ? 'uk' : language;
    document.documentElement.lang = htmlLang;
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setLanguage = (lang: Language) => setLanguageState(lang);

  const nextLanguage = () => {
    setLanguageState(prev => {
      const idx = ALL_LANGUAGES.indexOf(prev);
      return ALL_LANGUAGES[(idx + 1) % ALL_LANGUAGES.length];
    });
  };

  // Brainrot mode
  const [isBrainrot, setBrainrotRaw] = useState(false);
  // Corporate mode
  const [isCorporate, setCorporateRaw] = useState(false);

  // Mutually exclusive: turning one on turns the other off
  const setBrainrot = (v: boolean) => { setBrainrotRaw(v); if (v) setCorporateRaw(false); };
  const setCorporate = (v: boolean) => { setCorporateRaw(v); if (v) setBrainrotRaw(false); };

  // Load editable content overrides from Supabase
  const [contentReady, setContentReady] = useState(false);
  useEffect(() => {
    loadContentOverrides().then(() => setContentReady(true));
  }, []);

  const t = (key: keyof typeof translations['cs']) => {
    // When brainrot mode is active, check overrides first
    if (isBrainrot && key in brainrotOverrides) {
      return brainrotOverrides[key] as string;
    }
    // When corporate mode is active, check overrides
    if (isCorporate && key in corporateOverrides) {
      return corporateOverrides[key] as string;
    }
    // Check Supabase content overrides
    const override = getContentOverride(key, language);
    if (override !== undefined) return override;
    return translations[language]?.[key] || translations['en']?.[key] || translations['cs'][key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, setLanguage, nextLanguage, allLanguages: ALL_LANGUAGES, t, isBrainrot, setBrainrot, isCorporate, setCorporate }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
