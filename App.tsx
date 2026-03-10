
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
const LocationDetail = React.lazy(() => import('./components/locations/LocationDetail'));
const RentalWizard = React.lazy(() => import('./components/rentals/RentalWizard'));
const ReservationStatus = React.lazy(() => import('./components/rentals/ReservationStatus'));
import SkeletonLoader from './components/SkeletonLoader';
import { useAppContext } from './context/AppContext';
import { useSections } from './services/sectionConfig';
import { getViewForPath, pushRoute } from './services/routeConfig';
import { usePageMeta } from './hooks/usePageMeta';
import { getCurrentUser, signOut, getSupabase } from './services/supabaseClient';
import { initGA4, trackPageView } from './services/ga4';
import { initGTM } from './services/gtm';
import { initAnalytics, trackView } from './services/analytics';
import { getSetting, checkSupabaseHealth, onHealthChange } from './services/webDataService';
import MaintenanceMode from './components/MaintenanceMode';
import ComingSoon from './components/ComingSoon';
import { LOCATIONS_CS } from './data/locations';

// ─── Error Boundary for lazy game modals ─────────────────────────────
class GameErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.error('[GameErrorBoundary]', err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center gap-4 text-center p-6">
          <p className="text-red-500 font-orbitron text-xl">⚠️ Něco se pokazilo</p>
          <p className="text-gray-400 font-mono text-sm">Hra se nepodařila načíst.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); this.props.onClose(); }}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
          >Zavřít</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load heavy components for better initial load performance
const DevMenu = React.lazy(() => import('./components/DevMenu'));
const VoucherPage = React.lazy(() => import('./components/VoucherPage'));
const VoucherRedeemPage = React.lazy(() => import('./components/VoucherRedeemPage'));
const ChatAssistant = React.lazy(() => import('./components/ChatAssistant'));
const SkillCheck = React.lazy(() => import('./components/SkillCheck'));
const AimChallenge = React.lazy(() => import('./components/AimChallenge'));
const ReactionChallenge = React.lazy(() => import('./components/ReactionChallenge'));

// SEO Stealth Promo Landing Pages
const ArenaPromo = React.lazy(() => import('./components/seo/ArenaPromo'));
const MvpPromo = React.lazy(() => import('./components/seo/MvpPromo'));
const CybersportPromo = React.lazy(() => import('./components/seo/CybersportPromo'));
const SecretPages = React.lazy(() => import('./components/SecretPages'));
const Contact = React.lazy(() => import('./components/Contact'));

import { AUTHORIZED_ADMIN_EMAIL as AUTHORIZED_EMAIL } from './utils/auth';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false); // SECURITY: never trust localStorage — always verify session
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAimOpen, setIsAimOpen] = useState(false);
  const [isReactionOpen, setIsReactionOpen] = useState(false);
  const [vipUnlocked, setVipUnlocked] = useState(false);
  const { isBrainrot, setBrainrot, isCorporate, setCorporate, language } = useAppContext();
  const [isCrispEnabled, setIsCrispEnabled] = useState(() => localStorage.getItem('sz_crisp_enabled') === 'true');

  // PWA shortcut: auto-open game from ?game= URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const game = params.get('game');
    if (game === 'reaction') {
      setIsReactionOpen(true);
      window.history.replaceState({}, '', '/');
    } else if (game === 'aim') {
      setIsAimOpen(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Sync Crisp state when DevMenu toggles it
  useEffect(() => {
    const sync = () => setIsCrispEnabled(localStorage.getItem('sz_crisp_enabled') === 'true');
    window.addEventListener('sz_crisp_changed', sync);
    return () => window.removeEventListener('sz_crisp_changed', sync);
  }, []);
  const { sections, loading: sectionsLoading } = useSections();
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

  // Initialize analytics + GA4 + GTM
  useEffect(() => {
    initAnalytics();
    getSetting<string>('ga4_measurement_id', '').then(id => {
      if (id) initGA4(id);
    });
    // Google Tag Manager
    getSetting<string>('gtm_container_id', '').then(id => {
      if (id) {
        getSetting<boolean>('gtm_enabled', false).then(enabled => {
          if (enabled) initGTM(id);
        });
      }
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
          sessionStorage.setItem('sz_gmb_provider_token', providerToken); // SECURITY: sessionStorage clears on tab close
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
    } else {
      if (user) await signOut(); // Wrong email — force sign out
      setIsAdminLoggedIn(false);
      localStorage.removeItem('skillzone_admin');
      setIsDevMenuOpen(false); // Close it if it was open via fallback
    }
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
        return <Locations onChangeView={setCurrentView} />;
      case 'pricing':
        return <div className="pt-20"><Pricing /></div>;
      case 'history':
        return <div className="pt-20"><HistorySection /></div>;
      case 'services':
        return <div className="pt-20"><Services /><CyberSeparator /><Reviews /></div>;
      case 'rentals':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <RentalWizard onChangeView={setCurrentView} />
          </Suspense>
        );
      case 'reservation-status':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <ReservationStatus onChangeView={setCurrentView} />
          </Suspense>
        );
      case 'gallery':
        return <div className="pt-20"><Gallery /></div>;
      case 'map':
        return <div className="pt-20 min-h-screen"><AllLocationsMap /></div>;

      // BRANCHES
      case 'branch_zizkov':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <LocationDetail
              onChangeView={setCurrentView}
              data={{
                id: 'zizkov',
                title: 'Žižkov',
                description: 'Legendární doupě v Orebitské. Nejstarší a stále nejvytíženější klub e-sportovní scény.',
                subtitle: 'NONSTOP HERNA PRAHA 3',
                heroImage: LOCATIONS_CS.find(l => l.id === 'zizkov')?.imgUrl || '',
                address: 'Orebitská 630/4, 130 00 Praha 3',
                openHours: 'NONSTOP 24/7',
                specs: ['RTX 4070 Ti', '240Hz Monitory', 'Lounge Bar'],
              }}
            />
          </Suspense>
        );
      case 'branch_haje':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <LocationDetail
              onChangeView={setCurrentView}
              data={{
                id: 'haje',
                title: 'Háje',
                description: 'Rozlehlá moderní herna blízko metra Háje s oddělenou VIP místností.',
                subtitle: 'HERNÍ KLUB PRAHA 4',
                heroImage: LOCATIONS_CS.find(l => l.id === 'haje')?.imgUrl || '',
                address: 'Arkalycká 877/4, 149 00 Praha 4',
                openHours: '12:00 – 03:00',
                specs: ['Privátní místnost', 'Závodní simulátor', 'PlayStation zóna'],
              }}
            />
          </Suspense>
        );
      case 'branch_stodulky':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <LocationDetail
              onChangeView={setCurrentView}
              data={{
                id: 'stodulky',
                title: 'Stodůlky',
                description: 'Budoucí Mecca všech hráčů na Praze 5. Připravujeme zcela nový koncept.',
                subtitle: 'PŘIPRAVUJEME',
                heroImage: LOCATIONS_CS.find(l => l.id === 'stodulky')?.imgUrl || '',
                address: 'Mukařovského 1986/7, 155 00 Praha 5',
                openHours: 'Připravujeme na 2026',
                specs: ['Nejnovější HW architektura', 'Gastro zázemí', 'Cybersport zóna'],
              }}
            />
          </Suspense>
        );
      case 'branch_bootcamp':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <LocationDetail
              onChangeView={setCurrentView}
              data={{
                id: 'bootcamp',
                title: 'Bootcamp',
                description: 'Plně soukromá pobočka pro teambuildingy a pětkové týmy.',
                subtitle: 'SOUKROMÝ PRONÁJEM',
                heroImage: LOCATIONS_CS.find(l => l.id === 'bootcamp')?.imgUrl || '',
                address: 'Blahoslavova 2, 130 00 Praha 3',
                openHours: 'Dle rezervace',
                specs: ['10x RTX PC', 'Kuchyňka + Koupelna', 'Spaní pro 6 osob'],
              }}
            />
          </Suspense>
        );

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
      case 'secretpages':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <SecretPages onChangeView={setCurrentView} />
          </Suspense>
        );
      case 'contact':
        return (
          <Suspense fallback={<SkeletonLoader />}>
            <Contact onChangeView={setCurrentView} />
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
              <div className="py-20 flex justify-center bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
                <button
                  onClick={() => { setCurrentView('locations'); window.scrollTo(0, 0); }}
                  className="bg-white dark:bg-transparent border border-sz-red text-sz-red px-10 py-4 font-orbitron font-bold uppercase hover:bg-sz-red hover:text-white dark:hover:bg-sz-red dark:hover:text-white transition-all shadow-md dark:shadow-[0_0_15px_rgba(227,30,36,0.1)] hover:shadow-lg dark:hover:shadow-[0_0_25px_rgba(227,30,36,0.3)]"
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
  const isComingSoonActive = (sections.comingSoon && !isAdminLoggedIn && !vipUnlocked) || forceComingSoon;

  if (sectionsLoading) {
    return <div className="min-h-screen bg-black" />; // Prevent flash while loading settings
  }

  if (isComingSoonActive) {
    return (
      <>
        <ComingSoon
          targetDate={comingSoonDate}
          onUnlock={() => setVipUnlocked(true)}
          onPlayAim={() => setIsAimOpen(true)}
          onPlayReaction={() => setIsReactionOpen(true)}
        />
        {isAimOpen && (
          <GameErrorBoundary onClose={() => setIsAimOpen(false)}>
            <Suspense fallback={null}>
              <AimChallenge onClose={() => setIsAimOpen(false)} />
            </Suspense>
          </GameErrorBoundary>
        )}
        {isReactionOpen && (
          <GameErrorBoundary onClose={() => setIsReactionOpen(false)}>
            <Suspense fallback={null}>
              <ReactionChallenge onClose={() => setIsReactionOpen(false)} />
            </Suspense>
          </GameErrorBoundary>
        )}
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

          {isCrispEnabled && <CrispChat />}
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

        {isReactionOpen && (
          <Suspense fallback={null}>
            <ReactionChallenge onClose={() => setIsReactionOpen(false)} />
          </Suspense>
        )}

        {/* Floating Aim Challenge trigger */}
        {/* Floating game triggers */}
        {currentView === 'home' && !isAimOpen && !isReactionOpen && !isQuizOpen && !isDevMenuOpen && (
          <div className="fixed bottom-16 left-6 z-40 flex flex-col gap-2">
            {sections.aimchallenge && (
              <button
                onClick={() => setIsAimOpen(true)}
                className="group hidden md:block"
                title="Aim Challenge"
              >
                <div className="bg-zinc-900/90 backdrop-blur-sm border border-sz-red/30 hover:border-sz-red text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-sz-red/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-sz-red group-hover:text-white transition-colors">Aim Challenge</span>
                </div>
              </button>
            )}
            <button
              onClick={() => setIsReactionOpen(true)}
              className="group"
              title="Reaction Challenge"
            >
              <div className="bg-zinc-900/90 backdrop-blur-sm border border-yellow-500/30 hover:border-yellow-500 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-yellow-400 group-hover:text-white transition-colors">Reaction</span>
              </div>
            </button>
          </div>
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
