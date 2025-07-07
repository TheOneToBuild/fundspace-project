// src/App.jsx - UPDATED WITH OMEGA ADMIN FUNCTIONALITY
import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Outlet, useOutletContext, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import { supabase } from './supabaseClient';

// --- Import Page Components ---
import GrantsPageContent from './GrantsPageContent.jsx';
import ExploreFunders from './ExploreFunders.jsx';
import ExploreNonprofits from './ExploreNonprofits.jsx';
import SpotlightLandingPage from './SpotlightLandingPage.jsx';
import CountySpotlightPage from './CountySpotlightPage.jsx';
import CitySpotlightPage from './CitySpotlightPage.jsx';
import AboutUsPage from './AboutUsPage.jsx';
import ContactUsPage from './ContactUsPage.jsx';
import HowItWorksPage from './HowItWorksPage.jsx';
import ForNonprofitsPage from './ForNonprofitsPage.jsx';
import ForFundersPage from './ForFundersPage.jsx';
import RoadmapPage from './RoadmapPage.jsx';
import FaqPage from './FaqPage.jsx';
import SubmitGrantPage from './SubmitGrantPage.jsx';
import FunderProfilePage from './FunderProfilePage.jsx';
import NonprofitProfilePage from './NonprofitProfilePage.jsx';
import LoginPage from './LoginPage.jsx';
import ProfilePage from './ProfilePage.jsx';
import SettingsPage from './SettingsPage.jsx';
import SavedGrantsPage from './SavedGrantsPage.jsx';
import ExploreMembersPage from './ExploreMembersPage.jsx';
import MemberProfilePage from './MemberProfilePage.jsx';
import DashboardHomePage from './components/DashboardHomePage.jsx';
// --- OMEGA ADMIN IMPORTS ---
import OmegaAdminDashboard from './components/OmegaAdminDashboard.jsx';
import OmegaAdminAnalytics from './components/OmegaAdminAnalytics.jsx';
import AdminClaimsPage from './components/AdminClaimsPage.jsx';
// --- ORGANIZATION IMPORTS ---
import MyOrganizationPage from './components/MyOrganizationPage.jsx';
import EditOrganizationPage from './components/EditOrganizationPage.jsx';

// --- Import Shared Components ---
import AuthButton from './components/AuthButton.jsx';
import Footer from './components/Footer.jsx';
import DashboardHeader from './components/DashboardHeader.jsx';
import './components/skeleton-animations.css';

// --- Import Assets & Icons ---
import headerLogoImage from './assets/1rfp-logo.png';
import { PlusCircle, Menu } from './components/Icons.jsx';

export const LayoutContext = createContext({
  setPageBgColor: () => {},
});

// --- Layout for PUBLIC pages (Header for logged-out users) ---
const PublicHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mainNavLinks = [
    { to: "/", text: "Find Grants", active: "text-blue-600 font-semibold" },
    { to: "/funders", text: "Explore Funders", active: "text-green-600 font-semibold" },
    { to: "/nonprofits", text: "Explore Nonprofits", active: "text-purple-600 font-semibold" },
    { to: "/spotlight", text: "Spotlight", active: "text-rose-600 font-semibold" },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link to="/" aria-label="1RFP Home">
          <img src={headerLogoImage} alt="1RFP Logo" className="h-12 md:h-14 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center space-x-4 md:space-x-6">
          {mainNavLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `transition-colors ${isActive ? link.active : 'text-slate-700 hover:text-blue-600'}`}>
              <span className="text-sm md:text-base font-medium">{link.text}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <AuthButton />
          <Link to="/submit-grant" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm">
            <PlusCircle size={16} className="mr-2" />
            Submit Grant
          </Link>
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu" className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

// --- Main App Layout (conditionally renders header) ---
const AppLayout = () => {
    const { session, profile, notifications, unreadCount, markNotificationsAsRead } = useOutletContext();
    const outletContext = { session, profile, notifications, unreadCount, markNotificationsAsRead };
    
    const [pageBgColor, setPageBgColor] = useState('bg-white');

    return (
        <LayoutContext.Provider value={{ setPageBgColor }}>
            <div className={`min-h-screen ${pageBgColor} font-sans text-slate-800 flex flex-col`}>
                {session && profile ? (
                    <DashboardHeader
                        profile={profile}
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onPanelToggle={markNotificationsAsRead}
                    />
                ) : (
                    <PublicHeader />
                )}
                <main className="flex-grow">
                    <Outlet context={outletContext} />
                </main>
                <Footer session={session} />
            </div>
        </LayoutContext.Provider>
    );
};

// --- Main App Component with Final Routing Structure ---
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchSessionData = async (session) => {
    if (session) {
      const [profileRes, notificationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('notifications').select('*, actor_id(*)', { count: 'exact' }).eq('user_id', session.user.id).order('created_at', { ascending: false })
      ]);
      
      if (profileRes.data) setProfile(profileRes.data);
      if (notificationsRes.data) {
        setNotifications(notificationsRes.data);
        setUnreadCount(notificationsRes.data.filter(n => !n.is_read).length);
      }
    } else {
      setProfile(null);
      setNotifications([]);
      setUnreadCount(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    const getInitialSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await fetchSessionData(session);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      fetchSessionData(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const channel = supabase.channel(`profile-notifications:${session.user.id}`);
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, async (payload) => {
          const { data: actor } = await supabase.from('profiles').select('*').eq('id', payload.new.actor_id).single();
          if (actor) {
            const newNotification = { ...payload.new, actor_id: actor };
            setNotifications(current => [newNotification, ...current]);
            setUnreadCount(current => current + 1);
          }
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [session]);

  const markNotificationsAsRead = async () => {
    if (unreadCount > 0 && session) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
      setUnreadCount(0);
      setNotifications(current => current.map(n => ({ ...n, is_read: true })));
    }
  };

  const outletContext = { session, profile, loading, notifications, unreadCount, markNotificationsAsRead };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<Outlet context={outletContext} />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<GrantsPageContent />} />
            <Route path="funders" element={<ExploreFunders />} />
            <Route path="nonprofits" element={<ExploreNonprofits />} />
            <Route path="spotlight" element={<SpotlightLandingPage />} />
            <Route path="spotlight/:countySlug" element={<CountySpotlightPage />} />
            <Route path="spotlight/:countySlug/:citySlug" element={<CitySpotlightPage />} />
            <Route path="about" element={<AboutUsPage />} />
            <Route path="contact" element={<ContactUsPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="for-nonprofits" element={<ForNonprofitsPage />} />
            <Route path="for-funders" element={<ForFundersPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="submit-grant" element={<SubmitGrantPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="funders/:funderSlug" element={<FunderProfilePage />} />
            <Route path="nonprofits/:slug" element={<NonprofitProfilePage />} />
            
            <Route path="profile" element={<ProfilePage />}>
              <Route index element={<DashboardHomePage />} />
              <Route path="grants" element={<GrantsPageContent hideHero={true} isProfileView={true} />} />
              <Route path="funders" element={<ExploreFunders isProfileView={true} />} />
              <Route path="nonprofits" element={<ExploreNonprofits isProfileView={true} />} />
              <Route path="members" element={<ExploreMembersPage />} />
              <Route path="members/:profileId" element={<MemberProfilePage />} />
              <Route path="saved-grants" element={<SavedGrantsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              
              {/* --- ORGANIZATION ROUTES --- */}
              <Route path="my-organization" element={<MyOrganizationPage />} />
              <Route path="my-organization/edit" element={<EditOrganizationPage />} />
              
              {/* --- OMEGA ADMIN ROUTES --- */}
              <Route path="omega-admin" element={<OmegaAdminDashboard />} />
              <Route path="omega-admin/analytics" element={<OmegaAdminAnalytics />} />
              <Route path="omega-admin/claims" element={<AdminClaimsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}