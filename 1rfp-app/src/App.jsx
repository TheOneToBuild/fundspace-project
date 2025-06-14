// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  PlusCircle, // <-- NEW ICON
} from './components/Icons.jsx';

import ExploreFunders from './ExploreFunders.jsx';
import GrantsPageContent from './GrantsPageContent.jsx';
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
import SubmitGrantPage from './SubmitGrantPage.jsx'; // <-- NEW: IMPORT THE PAGE

import headerLogoImage from './assets/1rfp-logo.png';
import footerLogoImage from './assets/1rfp-footer-logo.png';

// Main App Component
export default function App() {
  const [currentPageView, setCurrentPageView] = useState('grants');

  // A smarter navigation function that can also handle scrolling
  const navigateToPage = (page, targetId = null) => {
    setCurrentPageView(page);
    if (targetId) {
        setTimeout(() => {
            const element = document.getElementById(targetId);
            if (element) {
                const offset = 80;
                const position = element.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: position,
                    behavior: 'smooth'
                });
            }
        }, 100);
    } else {
        window.scrollTo(0, 0);
    }
  };


  useEffect(() => {
    // ... (existing useEffect code remains the same)
    if (currentPageView === 'grants') {
        document.title = '1RFP - Find Your Next Funding Opportunity';
    } else if (currentPageView === 'funders') {
        document.title = '1RFP - Explore Funding Organizations';
    } else if (currentPageView === 'nonprofits') {
        document.title = '1RFP - Explore Nonprofits';
    } else if (currentPageView === 'spotlight') {
        document.title = '1RFP - Community Spotlight';
    } else if (currentPageView === 'about') {
        document.title = '1RFP - About Us';
    } else if (currentPageView === 'contact') {
        document.title = '1RFP - Contact Us';
    } else if (currentPageView === 'how-it-works') {
        document.title = '1RFP - How It Works';
    } else if (currentPageView === 'for-nonprofits') {
        document.title = '1RFP - For Nonprofits';
    } else if (currentPageView === 'for-funders') {
        document.title = '1RFP - For Funders';
    } else if (currentPageView === 'roadmap') {
        document.title = '1RFP - Platform Roadmap';
    } else if (currentPageView === 'faq') {
        document.title = '1RFP - FAQ';
    } else if (currentPageView === 'blog') {
        document.title = '1RFP - Blog';
    } else if (currentPageView === 'grant-writing-tips') {
        document.title = '1RFP - Grant Writing Tips';
    // NEW: ADDED TITLE FOR NEW PAGE
    } else if (currentPageView === 'submit-grant') {
        document.title = '1RFP - Submit a Grant';
    }
  }, [currentPageView]);

   return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 font-sans text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <a href="#" aria-label="1RFP Home" onClick={() => navigateToPage('grants')}><img src={headerLogoImage} alt="1RFP Logo" className="h-12 md:h-14 w-auto" /></a>
          <nav className="hidden md:flex items-center space-x-4 md:space-x-6">
            <a href="#" onClick={() => navigateToPage('grants')} className={`text-sm md:text-base font-medium ${currentPageView === 'grants' ? 'text-blue-600 font-semibold' : 'text-slate-700 hover:text-blue-600'} transition-colors`}>Find Grants</a>
            <a href="#" onClick={() => navigateToPage('funders')} className={`text-sm md:text-base font-medium ${currentPageView === 'funders' ? 'text-green-600 font-semibold' : 'text-slate-700 hover:text-green-600'} transition-colors`}>Explore Funders</a>
            <a href="#" onClick={() => navigateToPage('nonprofits')} className={`text-sm md:text-base font-medium ${currentPageView === 'nonprofits' ? 'text-purple-600 font-semibold' : 'text-slate-700 hover:text-purple-600'} transition-colors`}>Explore Nonprofits</a>
            <a href="#" onClick={() => navigateToPage('spotlight')} className={`text-sm md:text-base font-medium ${currentPageView === 'spotlight' ? 'text-rose-600 font-semibold' : 'text-slate-700 hover:text-rose-600'} transition-colors`}>Spotlight</a>
          </nav>
          {/* NEW: ADDED SUBMIT BUTTON TO HEADER */}
          <div className="hidden md:flex">
            <a href="#" onClick={() => navigateToPage('submit-grant')} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm">
                <PlusCircle size={16} className="mr-2" />
                Submit Grant
            </a>
          </div>
        </div>
      </header>

      {/* RENDER THE CORRECT PAGE BASED ON STATE */}
      {currentPageView === 'grants' && <GrantsPageContent />}
      {currentPageView === 'funders' && <ExploreFunders />}
      {currentPageView === 'nonprofits' && <ExploreNonprofits />}
      {currentPageView === 'spotlight' && <CommunitySpotlightPage />}
      {currentPageView === 'about' && <AboutUsPage navigateToPage={navigateToPage} />}
      {currentPageView === 'contact' && <ContactUsPage />}
      {currentPageView === 'how-it-works' && <HowItWorksPage navigateToPage={navigateToPage} />}
      {currentPageView === 'for-nonprofits' && <ForNonprofitsPage navigateToPage={navigateToPage} />}
      {currentPageView === 'for-funders' && <ForFundersPage navigateToPage={navigateToPage} />}
      {currentPageView === 'roadmap' && <RoadmapPage />}
      {currentPageView === 'faq' && <FaqPage />}
      {currentPageView === 'blog' && <BlogPage />}
      {currentPageView === 'grant-writing-tips' && <GrantWritingTipsPage navigateToPage={navigateToPage} />}
      {currentPageView === 'submit-grant' && <SubmitGrantPage />} {/* <-- NEW: RENDER THE PAGE */}


      <footer className=" text-black py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={footerLogoImage} alt="1RFP Logo" className="h-14 mb-4 w-auto" />
              <p className="text-base">
                Streamlining grant discovery for a better Bay Area.
              </p>
            </div>
            <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">
                Product
              </h4>
              <ul className="space-y-2 text-base">
                {/* ... existing links ... */}
                 <li>
                  <a href="#" onClick={() => navigateToPage('how-it-works')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'how-it-works' ? 'text-blue-600 font-semibold' : ''}`}>
                    How 1RFP Works
                  </a>
                </li>
                <li>
                  <a href="#" onClick={() => navigateToPage('for-nonprofits')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'for-nonprofits' ? 'text-blue-600 font-semibold' : ''}`}>
                    For Nonprofits
                  </a>
                </li>
                <li>
                  <a href="#" onClick={() => navigateToPage('for-funders')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'for-funders' ? 'text-blue-600 font-semibold' : ''}`}>
                    For Funders
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">
                Resources
              </h4>
              <ul className="space-y-2 text-base">
                {/* ... existing links ... */}
                <li>
                    <a href="#" onClick={() => navigateToPage('blog')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'blog' ? 'text-blue-600 font-semibold' : ''}`}>
                        Blog
                    </a>
                </li>
                <li>
                    <a href="#" onClick={() => navigateToPage('grant-writing-tips')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'grant-writing-tips' ? 'text-blue-600 font-semibold' : ''}`}>
                        Grant Writing Tips
                    </a>
                </li>
                {/* NEW: ADDED SUBMIT LINK TO FOOTER */}
                <li>
                    <a href="#" onClick={() => navigateToPage('submit-grant')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'submit-grant' ? 'text-blue-600 font-semibold' : ''}`}>
                        Submit a Grant
                    </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold text-black mb-3 tracking-wider uppercase">
                Company
              </h4>
              <ul className="space-y-2 text-base">
                {/* ... existing links ... */}
                <li>
                  <a href="#" onClick={() => navigateToPage('about')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'about' ? 'text-blue-600 font-semibold' : ''}`}>
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" onClick={() => navigateToPage('contact')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'contact' ? 'text-blue-600 font-semibold' : ''}`}>
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" onClick={() => navigateToPage('roadmap')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'roadmap' ? 'text-blue-600 font-semibold' : ''}`}>
                    Platform Roadmap
                  </a>
                </li>
                <li>
                  <a href="#" onClick={() => navigateToPage('faq')} className={`text-black hover:text-blue-600 transition-colors ${currentPageView === 'faq' ? 'text-blue-600 font-semibold' : ''}`}>
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center border-t border-black/20">
            <p className="text-base mb-4 sm:mb-0">
              &copy; {new Date().getFullYear()} 1RFP. All rights reserved.
            </p>
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