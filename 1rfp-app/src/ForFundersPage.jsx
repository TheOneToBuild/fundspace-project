// src/ForFundersPage.jsx
import React from 'react';
import { Target, ScatterChart, LayoutGrid, Handshake, CheckCircle2, BarChart3, UploadCloud, PieChart, Search } from './components/Icons.jsx';

// The component now accepts navigateToPage as a prop
const ForFundersPage = ({ navigateToPage }) => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      {/* --- Hero Section --- */}
      <div className="py-20 md:py-28 px-4">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
              Connect with Your Community. <span className="text-green-600">Amplify Your Impact.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-xl">
              1RFP offers a powerful new way for foundations to discover mission-aligned nonprofits, streamline outreach, and gain unparalleled insights into the Bay Area's funding landscape.
            </p>
          </div>
          <div>
            <img 
              src="https://placehold.co/800x600/cce3de/047857?text=Strategic+Philanthropy&font=inter"
              alt="Data visualization for strategic philanthropy"
              className="rounded-xl shadow-lg w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* --- How It Works for Funders Section --- */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">A More Efficient Way to Fund</h2>
            <p className="text-lg text-slate-500 mt-2 max-w-2xl mx-auto">Our platform simplifies every step of the outreach and discovery process.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
              <div className="inline-block bg-green-100 p-3 rounded-full mb-4">
                <UploadCloud size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold">1. List Your RFP</h3>
              <p className="text-slate-600 mt-2">Easily publish your grant opportunities to our platform, ensuring they are seen by a targeted audience of active Bay Area nonprofits.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
              <div className="inline-block bg-green-100 p-3 rounded-full mb-4">
                <Target size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold">2. Reach Aligned Nonprofits</h3>
              <p className="text-slate-600 mt-2">Our smart categorization and filtering tools mean your RFP gets in front of the organizations whose missions truly align with your goals.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
              <div className="inline-block bg-green-100 p-3 rounded-full mb-4">
                <PieChart size={32} />
              </div>
              <h3 className="text-xl font-bold">3. Gain Valuable Insights</h3>
              <p className="text-slate-600 mt-2">Our upcoming Funder Dashboard will provide analytics on your applicant pool and the broader funding landscape to inform your strategy.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- Section to explore nonprofits --- */}
      <div className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-8 md:p-12 text-center max-w-4xl mx-auto">
            <div className="inline-block bg-purple-100 p-3 rounded-full mb-4">
              <Search className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Discover Your Next Great Partner</h2>
            <p className="text-lg text-slate-600 mt-4 leading-relaxed">
              Our Nonprofit Directory is a powerful tool for discovering the incredible organizations driving change across the Bay Area. Search by focus area and location to find the grassroots innovators who are perfectly aligned with your mission.
            </p>
            <div className="mt-6">
                {/* UPDATED: This button now calls the new navigation function with a scroll target */}
                <button onClick={() => navigateToPage('nonprofits', 'nonprofit-intro')} className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105">
                  Explore Bay Area Nonprofits
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Dashboard Preview Section --- */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-bold text-green-600">COMING SOON</span>
            <h2 className="text-3xl font-bold text-slate-800 mt-1">The Funder Dashboard</h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              We're developing a suite of powerful tools designed specifically for grantmakers, including:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center"><CheckCircle2 className="h-6 w-6 text-green-600 mr-3" /><span>Analytics on your RFP's reach and applicant demographics.</span></li>
              <li className="flex items-center"><CheckCircle2 className="h-6 w-6 text-green-600 mr-3" /><span>Tools to track and manage your application pipeline.</span></li>
              <li className="flex items-center"><CheckCircle2 className="h-6 w-6 text-green-600 mr-3" /><span>Data visualizations of the Bay Area's funding needs.</span></li>
            </ul>
          </div>
          <div className="bg-slate-200 rounded-lg shadow-xl border border-slate-300 p-8 h-80 flex items-center justify-center">
             <div className="text-center text-slate-500">
                <BarChart3 size={48} className="mx-auto" />
                <p className="mt-4 font-medium">Conceptual Funder Dashboard</p>
             </div>
          </div>
        </div>
      </div>

      {/* --- CTA Section --- */}
      <div className="text-center py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="inline-block bg-green-100 p-3 rounded-full mb-4">
            <Handshake className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Let's Build a Better Bay Area, Together.</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">If you're a funder interested in learning more about partnership opportunities or our upcoming features, we would love to connect.</p>
          <button onClick={() => navigateToPage('contact')} className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105">
            Get in Touch
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForFundersPage;