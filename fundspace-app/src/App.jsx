import React, { useState, useEffect, createContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Outlet, useOutletContext, useLocation, Navigate, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import { supabase } from './supabaseClient';
import { clearAllNotifications, markAllAsRead } from './utils/notificationCleanup';
import HomePage from './HomePage.jsx';
import GrantsPageContent from './GrantsPageContent.jsx';
import ExploreOrganizations from './ExploreOrganizations.jsx';
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
import ExploreMembersPage from './ExploreMembersPage.jsx';
import MemberProfilePage from './MemberProfilePage.jsx';
import HomeDashboard from './components/HomeDashboard.jsx';
import HelloWorldChannel from './components/HelloWorldChannel.jsx';
import HelloCommunityRoute from './components/HelloCommunityRoute.jsx';
import FollowersPage from './components/FollowersPage.jsx';
import FollowingPage from './components/FollowingPage.jsx';
import OmegaAdminDashboard from './components/OmegaAdminDashboard.jsx';
import OmegaAdminAnalytics from './components/OmegaAdminAnalytics.jsx';
import OmegaAdminOrgSelector from './components/OmegaAdminOrgSelector.jsx';
import OmegaAdminEditOrg from './components/OmegaAdminEditOrg.jsx';
import OmegaAdminManageMembers from './components/OmegaAdminManageMembers.jsx';
import MyOrganizationPage from './components/MyOrganizationPage.jsx';
import OrganizationProfilePage from './pages/OrganizationProfilePage.jsx';
import SignUpWizard from './components/auth/SignUpWizard.jsx';
import OnboardingWizard from './components/OnboardingWizard.jsx';
import AuthButton from './components/AuthButton.jsx';
import Footer from './components/Footer.jsx';
import DashboardHeader from './components/DashboardHeader.jsx';
import PublicHeader from './components/PublicHeader.jsx';
import './components/skeleton-animations.css';
import headerLogoImage from './assets/fundspace-logo2.png';
import { PlusCircle, Menu, X } from './components/Icons.jsx';
import NotificationsPage from './components/NotificationsPage.jsx';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import AuthLayout from './components/auth/AuthLayout';
import ConnectionsPage from './components/ConnectionsPage.jsx';
import GrantsPortalPage from './components/GrantsPortalPage.jsx';

export const LayoutContext = createContext({ setPageBgColor: () => {} });

const AuthRedirect = ({ children }) => {
  const { session, profile, loading } = useOutletContext();
  const location = useLocation();
  
  if (loading) return children;
  
  // Only redirect logged-in users who are specifically on the homepage with no query parameters
  if (session && profile && location.pathname === '/' && location.search === '') {
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

function ResetPasswordPage() {
  const navigate = useNavigate();

  const handleResetSuccess = () => {
    navigate('/login', { 
      state: { message: 'Password updated successfully! You can now sign in.' }
    });
  };

  return (
    <AuthLayout>
      <ResetPasswordForm onResetSuccess={handleResetSuccess} />
    </AuthLayout>
  );
}

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

  // FIXED: Proper real-time subscription cleanup for notifications
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const channel = supabase.channel(`profile-notifications:${session.user.id}`);
    
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${session.user.id}` 
      }, async (payload) => {
        try {
          const { data: actor } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.actor_id)
            .single();
            
          if (actor) {
            setNotifications(current => [{ ...payload.new, actor_id: actor }, ...current]);
            setUnreadCount(current => current + 1);
          }
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      })
      .subscribe((status) => {
        // Only log errors, not successful connections
        if (status === 'CHANNEL_ERROR') {
          console.error('Notifications subscription error');
        }
      });
    
    return () => {
      // FIXED: Properly unsubscribe and remove channel
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  }, [session?.user?.id]);

  const outletContext = { session, profile, loading, notifications, unreadCount, markNotificationsAsRead, handleClearAllNotifications, handleViewPost, refreshProfile };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Outlet context={outletContext} />}>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUpWizard /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<AuthRedirect><HomePage /></AuthRedirect>} />
            <Route path="grants" element={<GrantsPageContent />} />
            <Route path="organizations" element={<ExploreOrganizations />} />
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
              <Route index element={<HomeDashboard />} />
              <Route path="hello-world" element={<HelloWorldChannel />} />
              <Route path="grants" element={<GrantsPageContent hideHero={true} isProfileView={true} />} />
              <Route path="organizations" element={<ExploreOrganizations isProfileView={true} />} />
              <Route path="members" element={<ExploreMembersPage />} />
              <Route path="grants-portal" element={<GrantsPortalPage />} />
              <Route path="hello-community" element={<HelloCommunityRoute />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="followers" element={<FollowersPage />} />
              <Route path="following" element={<FollowingPage />} />
              <Route path="connections" element={<ConnectionsPage />} />
              <Route path="my-organization" element={<MyOrganizationPage />} />
              <Route path="omega-admin" element={<OmegaAdminDashboard />} />
              <Route path="omega-admin/analytics" element={<OmegaAdminAnalytics />} />
              <Route path="omega-admin/organizations" element={<OmegaAdminOrgSelector />} />
              <Route path="omega-admin/organizations/edit/:orgType/:orgId" element={<OmegaAdminEditOrg />} />
              <Route path="omega-admin/organizations/members/:orgType/:orgId" element={<OmegaAdminManageMembers />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="members/:profileId" element={<MemberProfilePage />} />
            </Route>
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}