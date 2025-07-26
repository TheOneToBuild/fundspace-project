import React, { useState, useEffect, createContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Outlet, useOutletContext, useLocation, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import { supabase } from './supabaseClient';
import { clearAllNotifications, markAllAsRead } from './utils/notificationCleanup';
import HomePage from './HomePage.jsx';
import GrantsPageContent from './GrantsPageContent.jsx';
import ExploreOrganizations from './ExploreOrganizations.jsx'; // ONLY UNIFIED COMPONENT
import SpotlightLandingPage from './SpotlightLandingPage.jsx';
import CountySpotlightPage from './CountySpotlightPage.jsx';
import CitySpotlightPage from './CitySpotlightPage.jsx';
import AboutUsPage from './AboutUsPage.jsx';
import ContactUsPage from './ContactUsPage.jsx';
import HowItWorksPage from './HowItWorksPage.jsx';
import ForSeekersPage from './ForSeekersPage.jsx';
import ForFundersPage from './ForFundersPage.jsx';
import RoadmapPage from './RoadmapPage.jsx';
import FaqPage from './FaqPage.jsx';
import SubmitGrantPage from './SubmitGrantPage.jsx';
import LoginPage from './LoginPage.jsx';
import ProfilePage from './ProfilePage.jsx';
import SettingsPage from './SettingsPage.jsx';
import SavedGrantsPage from './SavedGrantsPage.jsx';
import ExploreMembersPage from './ExploreMembersPage.jsx';
import MemberProfilePage from './MemberProfilePage.jsx';
import DashboardHomePage from './components/DashboardHomePage.jsx';
import HelloCommunityRoute from './components/HelloCommunityRoute.jsx';
import FollowersPage from './components/FollowersPage.jsx';
import FollowingPage from './components/FollowingPage.jsx';
import OmegaAdminDashboard from './components/OmegaAdminDashboard.jsx';
import OmegaAdminAnalytics from './components/OmegaAdminAnalytics.jsx';
import AdminClaimsPage from './components/AdminClaimsPage.jsx';
import OmegaAdminOrgSelector from './components/OmegaAdminOrgSelector.jsx';
import OmegaAdminEditOrg from './components/OmegaAdminEditOrg.jsx';
import OmegaAdminManageMembers from './components/OmegaAdminManageMembers.jsx';
import MyOrganizationPage from './components/MyOrganizationPage.jsx';
import EditOrganizationPage from './components/EditOrganizationPage.jsx';
import OrganizationProfilePage from './pages/OrganizationProfilePage.jsx';
import SignUpWizard from './components/auth/SignUpWizard.jsx';
import OnboardingWizard from './components/OnboardingWizard.jsx';
import AuthButton from './components/AuthButton.jsx';
import Footer from './components/Footer.jsx';
import DashboardHeader from './components/DashboardHeader.jsx';
import './components/skeleton-animations.css';
import headerLogoImage from './assets/1rfp-logo.png';
import { PlusCircle, Menu, X } from './components/Icons.jsx';

export const LayoutContext = createContext({ setPageBgColor: () => {} });

const AuthRedirect = ({ children }) => {
  const { session, profile, loading } = useOutletContext();
  const location = useLocation();
  if (loading) return children;
  if (session && profile && location.pathname === '/') {
    return <Navigate to="/profile" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { session, profile, loading } = useOutletContext();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { session, profile, loading } = useOutletContext();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (session && profile) {
    return <Navigate to={location.state?.from?.pathname || '/profile'} replace />;
  }
  return children;
};

const PublicHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // UPDATED: Clean navigation with only unified Organizations
  const mainNavLinks = [
    { to: "/grants", text: "Find Grants", active: "text-blue-600 font-semibold" },
    { to: "/organizations", text: "Explore Organizations", active: "text-blue-600 font-semibold" },
    { to: "/spotlight", text: "Spotlight", active: "text-rose-600 font-semibold" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link to="/" aria-label="1RFP Home">
            <img src={headerLogoImage} alt="1RFP Logo" className="h-10 sm:h-12 md:h-14 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {mainNavLinks.map(({ to, text, active }) => (
              <NavLink 
                key={to} 
                to={to} 
                className={({ isActive }) => `text-sm md:text-base font-medium transition-colors ${isActive ? active : 'text-slate-700 hover:text-blue-600'}`}
              >
                {text}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <AuthButton />
            <Link 
              to="/submit-grant" 
              className="inline-flex items-center justify-center px-3 lg:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm"
            >
              <PlusCircle size={16} className="mr-1 lg:mr-2" />
              <span className="hidden lg:inline">Submit Grant</span>
              <span className="lg:hidden">Submit</span>
            </Link>
          </div>
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              aria-label="Open menu" 
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={closeMobileMenu}>
          <div 
            ref={mobileMenuRef}
            className="fixed inset-y-0 right-0 w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <img src={headerLogoImage} alt="1RFP Logo" className="h-8 w-auto" />
              <button 
                onClick={closeMobileMenu}
                className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="py-4">
              {mainNavLinks.map(({ to, text, active }) => (
                <NavLink 
                  key={to} 
                  to={to} 
                  className={({ isActive }) => `block w-full text-left px-4 py-3 transition-colors ${isActive ? `${active} bg-blue-50 border-r-2 border-blue-600` : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'}`}
                  onClick={closeMobileMenu}
                >
                  {text}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-slate-200 p-4 space-y-3">
              <Link 
                to="/submit-grant"
                onClick={closeMobileMenu}
                className="flex items-center justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusCircle size={16} className="mr-2" />
                Submit Grant
              </Link>
              <div className="w-full">
                <AuthButton mobile onClose={closeMobileMenu} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const AppLayout = () => {
  const { session, profile, notifications, unreadCount, markNotificationsAsRead, handleClearAllNotifications, handleViewPost, refreshProfile } = useOutletContext();
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
            onClearAllNotifications={handleClearAllNotifications}
            onViewPost={handleViewPost}
          />
        ) : (
          <PublicHeader />
        )}
        <main className="flex-1">
          <Outlet context={{ session, profile, notifications, unreadCount, markNotificationsAsRead, handleClearAllNotifications, handleViewPost, refreshProfile }} />
        </main>
        <Footer />
      </div>
    </LayoutContext.Provider>
  );
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchSessionData = async (session) => {
    if (!session) {
      setProfile(null);
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      const [profileRes, notificationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('notifications').select(`
          id, type, post_id, organization_post_id, is_read, created_at,
          actor_id:profiles!notifications_actor_id_fkey (id, full_name, avatar_url, title, organization_name)
        `, { count: 'exact' }).eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50)
      ]);
      setProfile(profileRes.data || null);
      setNotifications(notificationsRes.data || []);
      setUnreadCount(notificationsRes.data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (!error && data) setProfile(data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!session?.user?.id) return;
    try {
      const { success } = await clearAllNotifications(session.user.id);
      if (success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleViewPost = async (postId, isOrganizationPost = false) => {
    const selector = isOrganizationPost ? `[data-organization-post-id="${postId}"]` : `[data-post-id="${postId}"]`;
    if (!isOrganizationPost) {
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set('highlight', postId);
      window.history.pushState({}, '', currentUrl);
    }
    setTimeout(() => {
      const postElement = document.querySelector(selector);
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postElement.classList.add('highlight-post');
        setTimeout(() => postElement.classList.remove('highlight-post'), 3000);
      }
    }, 100);
  };

  const markNotificationsAsRead = async () => {
    if (unreadCount === 0 || !session) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
      setUnreadCount(0);
      setNotifications(current => current.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        await fetchSessionData(session);
      } catch (error) {
        console.error('Error getting initial session:', error);
      }
    };
    getInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      fetchSessionData(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel(`profile-notifications:${session.user.id}`);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, async (payload) => {
        try {
          const { data: actor } = await supabase.from('profiles').select('*').eq('id', payload.new.actor_id).single();
          if (actor) {
            setNotifications(current => [{ ...payload.new, actor_id: actor }, ...current]);
            setUnreadCount(current => current + 1);
          }
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  const outletContext = { session, profile, loading, notifications, unreadCount, markNotificationsAsRead, handleClearAllNotifications, handleViewPost, refreshProfile };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Outlet context={outletContext} />}>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUpWizard /></PublicRoute>} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<AuthRedirect><HomePage /></AuthRedirect>} />
            <Route path="grants" element={<GrantsPageContent />} />
            <Route path="organizations" element={<ExploreOrganizations />} />
            {/* REMOVED: funders and nonprofits routes */}
            <Route path="spotlight" element={<SpotlightLandingPage />} />
            <Route path="spotlight/:countySlug" element={<CountySpotlightPage />} />
            <Route path="spotlight/:countySlug/:citySlug" element={<CitySpotlightPage />} />
            <Route path="about" element={<AboutUsPage />} />
            <Route path="contact" element={<ContactUsPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="for-seekers" element={<ForSeekersPage />} />
            <Route path="for-funders" element={<ForFundersPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="submit-grant" element={<SubmitGrantPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="profile/:profileId" element={<MemberProfilePage />} />
            <Route path="organizations/:slug" element={<OrganizationProfilePage />} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}>
              <Route index element={<DashboardHomePage />} />
              <Route path="grants" element={<GrantsPageContent hideHero={true} isProfileView={true} />} />
              <Route path="organizations" element={<ExploreOrganizations isProfileView={true} />} />
              {/* REMOVED: funders and nonprofits profile routes */}
              <Route path="members" element={<ExploreMembersPage />} />
              <Route path="members/:profileId" element={<MemberProfilePage />} />
              <Route path="saved-grants" element={<SavedGrantsPage />} />
              <Route path="hello-community" element={<HelloCommunityRoute />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="followers" element={<FollowersPage />} />
              <Route path="following" element={<FollowingPage />} />
              <Route path="my-organization" element={<MyOrganizationPage />} />
              <Route path="my-organization/edit" element={<EditOrganizationPage />} />
              <Route path="omega-admin" element={<OmegaAdminDashboard />} />
              <Route path="omega-admin/analytics" element={<OmegaAdminAnalytics />} />
              <Route path="omega-admin/claims" element={<AdminClaimsPage />} />
              <Route path="omega-admin/organizations" element={<OmegaAdminOrgSelector />} />
              <Route path="omega-admin/organizations/edit/:orgType/:orgId" element={<OmegaAdminEditOrg />} />
              <Route path="omega-admin/organizations/members/:orgType/:orgId" element={<OmegaAdminManageMembers />} />
            </Route>
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}