// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';

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
import FunderProfilePage from './FunderProfilePage.jsx'; // Our new page

// --- Import your assets and icons ---
import headerLogoImage from './assets/1rfp-logo.png';
import footerLogoImage from './assets/1rfp-footer-logo.png';
import { Facebook, Twitter, Linkedin, Youtube, Instagram, PlusCircle } from './components/Icons.jsx';

// A helper component for navigation links to handle the active state styling
const AppNavLink = ({ to, children, activeClassName, ...props }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-sm md:text-base font-medium transition-colors ${isActive ? activeClassName : 'text-slate-700 hover:text-blue-600'}`
      }
      {...props}
    >
      {children}
    </NavLink>
  );
};

// Layout component to wrap all pages with the header and footer
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 font-sans text-slate-800">
    <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link to="/" aria-label="1RFP Home"><img src={headerLogoImage} alt="1RFP Logo" className="h-12 md:h-14 w-auto" /></Link>
        <nav className="hidden md:flex items-center space-x-4 md:space-x-6">
          <AppNavLink to="/" activeClassName="text-blue-600 font-semibold">Find Grants</AppNavLink>
          <AppNavLink to="/funders" activeClassName="text-green-600 font-semibold">Explore Funders</AppNavLink>
          <AppNavLink to="/nonprofits" activeClassName="text-purple-600 font-semibold">Explore Nonprofits</AppNavLink>
          <AppNavLink to="/spotlight" activeClassName="text-rose-600 font-semibold">Spotlight</AppNavLink>
        </nav>
        <div className="hidden md:flex">
          <Link to="/submit-grant" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm">
            <PlusCircle size={16} className="mr-2" />
            Submit Grant
          </Link>
        </div>
      </div>
    </header>

    <main>
      {children}
    </main>

    <footer className="text-black py-12">
      <div className="container mx-auto px-6">
          {/* Footer content remains the same, but using <Link> */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={footerLogoImage} alt="1RFP Logo" className="h-14 mb-4 w-auto" />
              <p className="text-base">Streamlining grant discovery for a better Bay Area.</p>
            </div>
            <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">Product</h4>
              <ul className="space-y-2 text-base">
                <li><Link to="/how-it-works" className="text-black hover:text-blue-600 transition-colors">How 1RFP Works</Link></li>
                <li><Link to="/for-nonprofits" className="text-black hover:text-blue-600 transition-colors">For Nonprofits</Link></li>
                <li><Link to="/for-funders" className="text-black hover:text-blue-600 transition-colors">For Funders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">Resources</h4>
              <ul className="space-y-2 text-base">
                 <li><Link to="/blog" className="text-black hover:text-blue-600 transition-colors">Blog</Link></li>
                 <li><Link to="/grant-writing-tips" className="text-black hover:text-blue-600 transition-colors">Grant Writing Tips</Link></li>
                 <li><Link to="/submit-grant" className="text-black hover:text-blue-600 transition-colors">Submit a Grant</Link></li>
              </ul>
            </div>
             <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">Company</h4>
              <ul className="space-y-2 text-base">
                <li><Link to="/about" className="text-black hover:text-blue-600 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-black hover:text-blue-600 transition-colors">Contact Us</Link></li>
                <li><Link to="/roadmap" className="text-black hover:text-blue-600 transition-colors">Platform Roadmap</Link></li>
                <li><Link to="/faq" className="text-black hover:text-blue-600 transition-colors">FAQ</Link></li>
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

// Main App Component with all the routes
export default function App() {
  return (
    <BrowserRouter>
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
          
          {/* THIS IS OUR NEW DYNAMIC ROUTE */}
          <Route path="/funders/:funderSlug" element={<FunderProfilePage />} />

        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}