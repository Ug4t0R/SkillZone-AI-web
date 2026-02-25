
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import { AppView } from './types';

// Lazy load almost everything except Navbar and Hero for maximum initial load performance
const Locations = React.lazy(() => import('./components/Locations'));
const TechSpecs = React.lazy(() => import('./components/TechSpecs'));
const WhyUs = React.lazy(() => import('./components/WhyUs'));
const Pricing = React.lazy(() => import('./components/Pricing'));
const HistorySection = React.lazy(() => import('./components/History'));
const Footer = React.lazy(() => import('./components/Footer'));
const LiveFeed = React.lazy(() => import('./components/LiveFeed'));
const BookingSelection = React.lazy(() => import('./components/BookingSelection'));
const CyberSeparator = React.lazy(() => import('./components/CyberSeparator'));
const Services = React.lazy(() => import('./components/Services'));
const Reviews = React.lazy(() => import('./components/Reviews'));
const CrispChat = React.lazy(() => import('./components/CrispChat'));
const ContactWidget = React.lazy(() => import('./components/ContactWidget'));
const OwnerProfile = React.lazy(() => import('./components/OwnerProfile'));
const ServerProtocol = React.lazy(() => import('./components/ServerProtocol'));
const WarRoom = React.lazy(() => import('./components/WarRoom'));
const Gallery = React.lazy(() => import('./components/Gallery'));
const PressSection = React.lazy(() => import('./components/PressSection'));
const TerminalLogin = React.lazy(() => import('./components/TerminalLogin'));
const BrainrotMode = React.lazy(() => import('./components/BrainrotMode'));
const CorporateMode = React.lazy(() => import('./components/CorporateMode'));
const SkillerAvatar = React.lazy(() => import('./components/SkillerAvatar'));
const CookieBanner = React.lazy(() => import('./components/CookieBanner'));
const TeamSection = React.lazy(() => import('./components/TeamSection'));
const AllLocationsMap = React.lazy(() => import('./components/AllLocationsMap'));
import SkeletonLoader from './components/SkeletonLoader';
import { useAppContext } from './context/AppContext';
import { useSections } from './services/sectionConfig';
import { getViewForPath, pushRoute } from './services/routeConfig';
import { usePageMeta } from './hooks/usePageMeta';
import { getCurrentUser, signOut, getSupabase } from './services/supabaseClient';
import { initGA4, trackPageView } from './services/ga4';
import { initAnalytics, trackView } from './services/analytics';
import { getSetting, checkSupabaseHealth, onHealthChange } from './services/webDataService';
import MaintenanceMode from './components/MaintenanceMode';
import ComingSoon from './components/ComingSoon';

// Lazy load heavy components for better initial load performance
const DevMenu = React.lazy(() => import('./components/DevMenu'));
const VoucherPage = React.lazy(() => import('./components/VoucherPage'));
const VoucherRedeemPage = React.lazy(() => import('./components/VoucherRedeemPage'));
const ChatAssistant = React.lazy(() => import('./components/ChatAssistant'));
const SkillCheck = React.lazy(() => import('./components/SkillCheck'));
const AimChallenge = React.lazy(() => import('./components/AimChallenge'));

// SEO Stealth Promo Landing Pages
const ArenaPromo = React.lazy(() => import('./components/seo/ArenaPromo'));
const MvpPromo = React.lazy(() => import('./components/seo/MvpPromo'));
const CybersportPromo = React.lazy(() => import('./components/seo/CybersportPromo'));

const AUTHORIZED_EMAIL = 'tomas@skillzone.cz';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => localStorage.getItem('skillzone_admin') === 'true');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAimOpen, setIsAimOpen] = useState(false);
  const { isBrainrot, setBrainrot, isCorporate, setCorporate, language } = useAppContext();
  const { sections } = useSections();
  const [teamVisible, setTeamVisible] = useState(() => localStorage.getItem('sz_team_visible') !== 'false');
  const [dbOffline, setDbOffline] = useState(false);
  const [comingSoonDate, setComingSoonDate] = useState<string | null>(null);
  usePageMeta(currentView, language);

  // DB health check on mount
  useEffect(() => {
    checkSupabaseHealth().then(ok => { if (!ok) setDbOffline(true); });
    return onHealthChange(healthy => setDbOffline(!healthy));
  }, []);

  // Load coming soon countdown date
  useEffect(() => {
    if (sections.comingSoon) {
      getSetting<string>('coming_soon_date', '').then(d => setComingSoonDate(d || null));
    }
  }, [sections.comingSoon]);

  // Wrapper: updates React state + browser URL
  const navigateTo = useCallback((view: AppView) => {
    setCurrentView(view);
    pushRoute(view);
  }, []);

  // Track every view change via GA4 + Supabase analytics
  useEffect(() => {
    trackView(currentView);
    trackPageView(`/${currentView === 'home' ? '' : currentView}`, document.title);
  }, [currentView]);

  // Initialize analytics + GA4
  useEffect(() => {
    initAnalytics();
    getSetting<string>('ga4_measurement_id', '').then(id => {
      if (id) initGA4(id);
    });
  }, []);

  // Konami code easter egg: ↑↑↓↓←→←→BA
  useEffect(() => {
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let buffer: string[] = [];
    const onKeyDown = (e: KeyboardEvent) => {
      buffer.push(e.key);
      buffer = buffer.slice(-KONAMI.length);
      if (buffer.join(',') === KONAMI.join(',')) {
        setIsQuizOpen(true);
        buffer = [];
      }
    };
    window.addEventListener('keydown', onKeyDown);
    // Also listen for footer button trigger
    const onQuizOpen = () => setIsQuizOpen(true);
    window.addEventListener('skillcheck:open', onQuizOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('skillcheck:open', onQuizOpen);
    };
  }, []);

  useEffect(() => {
    // ─── GMB OAuth Return Handler ──────────────────────────────────
    // Supabase does NOT persist provider_token! We must grab it from
    // the URL hash IMMEDIATELY before Supabase strips it.
    if (localStorage.getItem('sz_sync_gmb_intent') === 'true') {
      const hash = window.location.hash;
      if (hash.includes('provider_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const providerToken = params.get('provider_token');
        if (providerToken) {
          localStorage.setItem('sz_gmb_provider_token', providerToken);
          console.log('[GMB] Provider token captured from URL hash');
        }
      }
      setIsDevMenuOpen(true);
    }

    const handleRouteChange = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash.replace('#', '') as AppView;

      // First check pathname-based routes via routeConfig
      const viewFromPath = getViewForPath(pathname);
      if (viewFromPath) {
        setCurrentView(viewFromPath);
        return;
      }

      // Fallback to hash-based routing
      const viewFromHash = getViewForPath('/' + hash);
      if (viewFromHash) {
        setCurrentView(viewFromHash);
      }
    };

    // Handle browser back/forward buttons
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange(); // Initial check

    // Strict check on mount
    checkAdminStatus();

    // Real-time auth listener for immediate session killing of unauthorized users
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (session.user.email === AUTHORIZED_EMAIL) {
          setIsAdminLoggedIn(true);
          localStorage.setItem('skillzone_admin', 'true');
        } else {
          console.warn("Unauthorized login attempt detected.");
          await signOut();
          setIsAdminLoggedIn(false);
          localStorage.removeItem('skillzone_admin');
          setIsLoginOpen(false);
        }
      } else if (event === 'SIGNED_OUT') {
        // Only clear admin on explicit sign-out, not on initial null session
        setIsAdminLoggedIn(false);
        localStorage.removeItem('skillzone_admin');
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const checkAdminStatus = async () => {
    const user = await getCurrentUser();
    if (user && user.email === AUTHORIZED_EMAIL) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('skillzone_admin', 'true');
    } else if (user) {
      // Wrong email — force sign out
      await signOut();
      setIsAdminLoggedIn(false);
      localStorage.removeItem('skillzone_admin');
    }
    // If no user at all, don't reset — respect localStorage init
  };

  const handleDevTrigger = async () => {
    const user = await getCurrentUser();
    if (user && user.email === AUTHORIZED_EMAIL) {
      setIsDevMenuOpen(true);
    } else {
      setIsLoginOpen(true);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'booking':
        return <BookingSelection onChangeView={setCurrentView} />;
      case 'locations':
        return <Locations />;
      case 'pricing':
        return <div className="pt-20"><Pricing /></div>;
      case 'history':
        return <div className="pt-20"><HistorySection /></div>;
      case 'services':
        return <div className="pt-20"><Services /><CyberSeparator /><Reviews /></div>;
      case 'gallery':
        return <div className="pt-20"><Gallery /></div>;
      case 'map':
        return <div className="pt-20 min-h-screen"><AllLocationsMap /></div>;
      case 'gift':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <VoucherPage onChangeView={setCurrentView} />
          </Suspense>
        );
      case 'poukaz':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <VoucherRedeemPage onChangeView={setCurrentView} />
          </Suspense>
        );
      case 'arena':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <ArenaPromo onChangeView={setCurrentView} />
          </Suspense>
        );
      case 'mvp':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <MvpPromo onChangeView={setCurrentView} />
          </Suspense>
        );
      case 'cybersport':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <CybersportPromo onChangeView={setCurrentView} />
          </Suspense>
        );
      case 'home':
      default:
        return (
          <>
            <Hero />
            {sections.warroom && <WarRoom />}
            <CyberSeparator />
            {sections.techspecs && <><TechSpecs /><CyberSeparator /></>}
            {sections.whyus && <><WhyUs /><CyberSeparator /></>}
            {sections.services && <><Services /><CyberSeparator /></>}
            {sections.reviews && <><Reviews /><CyberSeparator /></>}
            {sections.press && <><PressSection /><CyberSeparator /></>}
            {sections.history && <><HistorySection /><CyberSeparator /></>}
            {sections.owner && <><OwnerProfile /><CyberSeparator /></>}
            {sections.team && teamVisible && <><TeamSection visible={teamVisible} /><CyberSeparator /></>}
            {sections.gallery && <><Gallery /><CyberSeparator /></>}
            {sections.protocol && <><ServerProtocol /><CyberSeparator /></>}
            {sections.locations && (
              <div className="py-20 flex justify-center bg-light-bg dark:bg-dark-bg transition-colors duration-300">
                <button
                  onClick={() => { setCurrentView('locations'); window.scrollTo(0, 0); }}
                  className="bg-transparent border border-sz-red text-sz-red px-10 py-4 font-orbitron font-bold uppercase hover:bg-sz-red hover:text-white transition-all shadow-[0_0_15px_rgba(227,30,36,0.1)] hover:shadow-[0_0_25px_rgba(227,30,36,0.3)]"
                >
                  {language === 'cs' ? 'Zobrazit Všechny Lokace' : 'View All Locations'}
                </button>
              </div>
            )}
          </>
        );
    }
  };

  // ─── MAINTENANCE MODE (DB offline or ?maintenance preview) ───
  const forcePreview = new URLSearchParams(window.location.search).has('maintenance') && !isAdminLoggedIn;
  if ((dbOffline && !isAdminLoggedIn) || forcePreview) {
    return (
      <>
        <MaintenanceMode />
        {/* Hidden admin access — triple-click bottom-right corner */}
        <button
          onClick={handleDevTrigger}
          className="fixed bottom-2 right-2 w-16 h-16 opacity-0 hover:opacity-5 z-50 cursor-default"
          title=""
          aria-label="Admin"
        />
        {isLoginOpen && (
          <Suspense fallback={null}>
            <TerminalLogin
              onSuccess={() => { setIsLoginOpen(false); setIsDevMenuOpen(true); setIsAdminLoggedIn(true); localStorage.setItem('skillzone_admin', 'true'); }}
              onCancel={() => setIsLoginOpen(false)}
            />
          </Suspense>
        )}
        {isDevMenuOpen && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-sz-red font-orbitron">Loading DevMenu...</div></div>}>
            <DevMenu isOpen={isDevMenuOpen} onClose={() => { setIsDevMenuOpen(false); checkAdminStatus(); }} />
          </Suspense>
        )}
      </>
    );
  }

  // ─── COMING SOON MODE (toggled via DevMenu or ?comingsoon preview) ───
  const forceComingSoon = new URLSearchParams(window.location.search).has('comingsoon') && !isAdminLoggedIn;
  if ((sections.comingSoon && !isAdminLoggedIn) || forceComingSoon) {
    return (
      <>
        <ComingSoon targetDate={comingSoonDate} />
        {/* Hidden admin access — click bottom-right corner */}
        <button
          onClick={handleDevTrigger}
          className="fixed bottom-2 right-2 w-16 h-16 opacity-0 hover:opacity-5 z-50 cursor-default"
          title=""
          aria-label="Admin"
        />
        {isLoginOpen && (
          <Suspense fallback={null}>
            <TerminalLogin
              onSuccess={() => { setIsLoginOpen(false); setIsDevMenuOpen(true); setIsAdminLoggedIn(true); localStorage.setItem('skillzone_admin', 'true'); }}
              onCancel={() => setIsLoginOpen(false)}
            />
          </Suspense>
        )}
        {isDevMenuOpen && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-sz-red font-orbitron">Loading DevMenu...</div></div>}>
            <DevMenu isOpen={isDevMenuOpen} onClose={() => { setIsDevMenuOpen(false); checkAdminStatus(); }} />
          </Suspense>
        )}
      </>
    );
  }

  return (
    <div className={`bg-light-bg dark:bg-dark-bg min-h-screen text-gray-900 dark:text-white font-sans selection:bg-sz-red selection:text-white transition-colors duration-300 relative ${isBrainrot ? 'crazy-mode' : ''}`}>
      <div className="fixed inset-0 bg-motherboard opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-0"></div>

      <div className="relative z-10">
        <Navbar
          currentView={currentView}
          onChangeView={navigateTo}
          adminStatus={isAdminLoggedIn}
          onAdminClick={handleDevTrigger}
          sections={sections}
        />
        <Suspense fallback={<SkeletonLoader />}>
          <main>{renderView()}</main>
          <Footer sections={sections} onNavigate={navigateTo} />

          <CrispChat />
          <ContactWidget />
          {sections.livefeed && <LiveFeed onChatOpen={() => setIsAiChatOpen(true)} />}
          {sections.skiller && <SkillerAvatar onChatOpen={() => setIsAiChatOpen(true)} />}
        </Suspense>
        <Suspense fallback={null}>
          <ChatAssistant isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
        </Suspense>

        {isLoginOpen && (
          <Suspense fallback={null}>
            <TerminalLogin
              onSuccess={() => {
                setIsLoginOpen(false);
                setIsDevMenuOpen(true);
                setIsAdminLoggedIn(true);
                localStorage.setItem('skillzone_admin', 'true');
              }}
              onCancel={() => setIsLoginOpen(false)}
            />
          </Suspense>
        )}
        {isDevMenuOpen && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-sz-red font-orbitron">Loading DevMenu...</div></div>}>
            <DevMenu
              isOpen={isDevMenuOpen}
              onClose={() => {
                setIsDevMenuOpen(false);
                checkAdminStatus();
              }}
            />
          </Suspense>
        )}

        {isQuizOpen && (
          <Suspense fallback={null}>
            <SkillCheck onClose={() => setIsQuizOpen(false)} />
          </Suspense>
        )}

        {isAimOpen && (
          <Suspense fallback={null}>
            <AimChallenge onClose={() => setIsAimOpen(false)} />
          </Suspense>
        )}

        {/* Floating Aim Challenge trigger */}
        {currentView === 'home' && !isAimOpen && !isQuizOpen && !isDevMenuOpen && sections.aimchallenge && (
          <button
            onClick={() => setIsAimOpen(true)}
            className="fixed bottom-16 left-6 z-40 group hidden md:block"
            title="Aim Challenge"
          >
            <div className="bg-zinc-900/90 backdrop-blur-sm border border-sz-red/30 hover:border-sz-red text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-sz-red/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-sz-red group-hover:text-white transition-colors">Aim Challenge</span>
            </div>
          </button>
        )}
      </div>

      <Suspense fallback={null}>
        <CookieBanner />
        <BrainrotMode isActive={isBrainrot} onToggle={() => setBrainrot(false)} />
        <CorporateMode isActive={isCorporate} onToggle={() => setCorporate(false)} />
      </Suspense>
    </div>
  );
};

export default App;
