// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';

// --- Import your helper components ---
import ScrollToTop from './components/ScrollToTop.jsx';

// --- Import all your page components ---
import './components/skeleton-animations.css';
import GrantsPageContent from './GrantsPageContent.jsx';
import ExploreFunders from './ExploreFunders.jsx';
import ExploreNonprofits from './ExploreNonprofits.jsx';
import CommunitySpotlightPage from './CommunitySpotlightPage.jsx';
import AboutUsPage from './AboutUsPage.jsx';
import ContactUsPage from './ContactUsPage.jsx';
import HowItWorksPage from './HowItWorksPage.jsx';
import ForNonprofitsPage from './ForNonprofitsPage.jsx';
import ForFundersPage from './ForFundersPage.jsx';
import RoadmapPage from './RoadmapPage.jsx';
import FaqPage from './FaqPage.jsx';
import BlogPage from './BlogPage.jsx';
import GrantWritingTipsPage from './GrantWritingTipsPage.jsx';
import SubmitGrantPage from './SubmitGrantPage.jsx';
import FunderProfilePage from './FunderProfilePage.jsx';

// --- Import your assets and icons ---
import headerLogoImage from './assets/1rfp-logo.png';
import footerLogoImage from './assets/1rfp-footer-logo.png';
// Add Menu and X for the mobile navigation
import { Facebook, Twitter, Linkedin, Youtube, Instagram, PlusCircle, Menu, X } from './components/Icons.jsx';

// A helper component for navigation links to handle the active state styling
const AppNavLink = ({ to, children, activeClassName, ...props }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `transition-colors ${isActive ? activeClassName : 'text-slate-700 hover:text-blue-600'}`
      }
      {...props}
    >
      {children}
    </NavLink>
  );
};

// Layout component to wrap all pages with the header and footer
const AppLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define all navigation links in one place for easier management
  const mainNavLinks = [
    { to: "/", text: "Find Grants", active: "text-blue-600 font-semibold" },
    { to: "/funders", text: "Explore Funders", active: "text-green-600 font-semibold" },
    { to: "/nonprofits", text: "Explore Nonprofits", active: "text-purple-600 font-semibold" },
    { to: "/spotlight", text: "Spotlight", active: "text-rose-600 font-semibold" },
  ];

  const productLinks = [
    { to: "/how-it-works", text: "How 1RFP Works" },
    { to: "/for-nonprofits", text: "For Nonprofits" },
    { to: "/for-funders", text: "For Funders" },
  ];

  const resourceLinks = [
    { to: "/blog", text: "Blog" },
    { to: "/grant-writing-tips", text: "Grant Writing Tips" },
    { to: "/submit-grant", text: "Submit a Grant" },
  ];

  const companyLinks = [
    { to: "/about", text: "About Us" },
    { to: "/contact", text: "Contact Us" },
    { to: "/roadmap", text: "Platform Roadmap" },
    { to: "/faq", text: "FAQ" },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 font-sans text-slate-800">
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link to="/" aria-label="1RFP Home" onClick={() => setIsMobileMenuOpen(false)}>
            <img src={headerLogoImage} alt="1RFP Logo" className="h-12 md:h-14 w-auto" />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4 md:space-x-6">
            {mainNavLinks.map(link => (
              <AppNavLink key={link.to} to={link.to} activeClassName={link.active}>
                <span className="text-sm md:text-base font-medium">{link.text}</span>
              </AppNavLink>
            ))}
          </nav>

          <div className="hidden md:flex">
            <Link to="/submit-grant" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm">
              <PlusCircle size={16} className="mr-2" />
              Submit Grant
            </Link>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* --- UPDATED Mobile Menu Panel --- */}
      <div 
        className={`fixed inset-0 z-50 transition-transform transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
      >
        <div 
          className="absolute inset-0 bg-black/40" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        <div className="relative w-80 max-w-[80vw] h-full bg-white ml-auto shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <span className="font-bold text-lg text-slate-800">Navigation</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              aria-label="Close menu"
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6">
            <nav className="flex flex-col space-y-4">
              {mainNavLinks.map(link => (
                <AppNavLink key={link.to} to={link.to} activeClassName={link.active} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="text-lg font-medium">{link.text}</span>
                </AppNavLink>
              ))}
            </nav>

            <div className="border-t border-slate-200 my-6"></div>

            <div className="flex flex-col space-y-4">
                <div>
                    <h4 className="font-semibold text-slate-500 text-sm uppercase tracking-wider mb-3">Product</h4>
                    {productLinks.map(link => (
                        <AppNavLink key={link.to} to={link.to} activeClassName="font-bold text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>
                            <span className="block py-2 text-base font-medium text-slate-600 hover:text-blue-600">{link.text}</span>
                        </AppNavLink>
                    ))}
                </div>
                <div>
                    <h4 className="font-semibold text-slate-500 text-sm uppercase tracking-wider mb-3">Resources</h4>
                    {resourceLinks.map(link => (
                        <AppNavLink key={link.to} to={link.to} activeClassName="font-bold text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>
                            <span className="block py-2 text-base font-medium text-slate-600 hover:text-blue-600">{link.text}</span>
                        </AppNavLink>
                    ))}
                </div>
                <div>
                    <h4 className="font-semibold text-slate-500 text-sm uppercase tracking-wider mb-3">Company</h4>
                    {companyLinks.map(link => (
                        <AppNavLink key={link.to} to={link.to} activeClassName="font-bold text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>
                            <span className="block py-2 text-base font-medium text-slate-600 hover:text-blue-600">{link.text}</span>
                        </AppNavLink>
                    ))}
                </div>
            </div>
          </div>

          <div className="p-6 mt-auto border-t border-slate-200">
            <Link 
              to="/submit-grant" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex w-full items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm"
            >
              <PlusCircle size={20} className="mr-2" />
              Submit Grant
            </Link>
          </div>
        </div>
      </div>

      <main>
        {children}
      </main>

      <footer className="text-black py-12">
        {/* Footer content remains the same */}
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={footerLogoImage} alt="1RFP Logo" className="h-14 mb-4 w-auto" />
              <p className="text-base">Streamlining grant discovery for a better Bay Area.</p>
            </div>
            <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">Product</h4>
              <ul className="space-y-2 text-base">
                {productLinks.map(link => (
                    <li key={link.to}><Link to={link.to} className="text-black hover:text-blue-600 transition-colors">{link.text}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">Resources</h4>
              <ul className="space-y-2 text-base">
                 {resourceLinks.map(link => (
                    <li key={link.to}><Link to={link.to} className="text-black hover:text-blue-600 transition-colors">{link.text}</Link></li>
                 ))}
              </ul>
            </div>
             <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">Company</h4>
              <ul className="space-y-2 text-base">
                {companyLinks.map(link => (
                    <li key={link.to}><Link to={link.to} className="text-black hover:text-blue-600 transition-colors">{link.text}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center border-t border-black/20">
            <p className="text-base mb-4 sm:mb-0">&copy; {new Date().getFullYear()} 1RFP. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="#" aria-label="Facebook" className="text-black hover:text-blue-600 transition-colors"><Facebook size={18} /></a>
              <a href="#" aria-label="Twitter" className="text-black hover:text-blue-600 transition-colors"><Twitter size={18} /></a>
              <a href="#" aria-label="LinkedIn" className="text-black hover:text-blue-600 transition-colors"><Linkedin size={18} /></a>
              <a href="#" aria-label="Instagram" className="text-black hover:text-blue-600 transition-colors"><Instagram size={18} /></a>
              <a href="#" aria-label="YouTube" className="text-black hover:text-blue-600 transition-colors"><Youtube size={18} /></a>
            </div>
          </div>
      </div>
    </footer>
  </div>
);
}

// Main App Component with all the routes
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          <Route path="/" element={<GrantsPageContent />} />
          <Route path="/funders" element={<ExploreFunders />} />
          <Route path="/nonprofits" element={<ExploreNonprofits />} />
          <Route path="/spotlight" element={<CommunitySpotlightPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/for-nonprofits" element={<ForNonprofitsPage />} />
          <Route path="/for-funders" element={<ForFundersPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/grant-writing-tips" element={<GrantWritingTipsPage />} />
          <Route path="/submit-grant" element={<SubmitGrantPage />} />
          
          <Route path="/funders/:funderSlug" element={<FunderProfilePage />} />

        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
