// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Outlet } from 'react-router-dom';
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

// --- Import Shared Components ---
import AuthButton from './components/AuthButton.jsx';
import Footer from './components/Footer.jsx';
import './components/skeleton-animations.css';

// --- Import Assets & Icons ---
import headerLogoImage from './assets/1rfp-logo.png';
import { PlusCircle, Menu, X } from './components/Icons.jsx';


// --- Layout for PUBLIC pages (includes main header and footer) ---
const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link to={session ? "/profile" : "/"} aria-label="1RFP Home">
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

      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};


// --- Main App Component with Final Routing Structure ---
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Group 1: Public pages using the main AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<GrantsPageContent />} /> 
          <Route path="/funders" element={<ExploreFunders />} />
          <Route path="/nonprofits" element={<ExploreNonprofits />} />
          <Route path="/spotlight" element={<SpotlightLandingPage />} />
          <Route path="/spotlight/:countySlug" element={<CountySpotlightPage />} />
          <Route path="/spotlight/:countySlug/:citySlug" element={<CitySpotlightPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/for-nonprofits" element={<ForNonprofitsPage />} />
          <Route path="/for-funders" element={<ForFundersPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/submit-grant" element={<SubmitGrantPage />} />
          <Route path="/funders/:funderSlug" element={<FunderProfilePage />} />
          <Route path="/nonprofits/:slug" element={<NonprofitProfilePage />} />
        </Route>

        {/* Group 2: Standalone login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Group 3: Protected routes with the 3-column profile layout */}
        <Route path="/profile" element={<ProfilePage />}>
          <Route index element={<DashboardHomePage />} />
          
          <Route path="grants" element={<GrantsPageContent hideHero={true} isProfileView={true} />} />
          <Route path="funders" element={<ExploreFunders />} />
          <Route path="nonprofits" element={<ExploreNonprofits />} />

          <Route path="members" element={<ExploreMembersPage />} />
          <Route path="members/:profileId" element={<MemberProfilePage />} />
          <Route path="saved-grants" element={<SavedGrantsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
