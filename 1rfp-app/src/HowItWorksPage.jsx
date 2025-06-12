// src/HowItWorksPage.jsx
import React from 'react';
import { Bot, Users, Search, Award, Heart, SlidersHorizontal, Bell, Handshake } from './components/Icons.jsx';

const HowItWorksPage = () => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      {/* --- Hero Section --- */}
      <div className="text-center py-20 md:py-28 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Smarter Grantseeking Starts Here.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            1RFP combines cutting-edge technology with the power of community to create the most efficient and comprehensive grant discovery platform for the Bay Area.
          </p>
        </div>
      </div>

      {/* --- The 1RFP Engine Section --- */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">The 1RFP Engine</h2>
            <p className="text-lg text-slate-500 mt-2 max-w-2xl mx-auto">Our unique hybrid approach ensures the data you see is timely, relevant, and comprehensive.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-4 mb-3">
                <Bot className="h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-800">AI-Powered Data Aggregation</h3>
              </div>
              <p className="text-slate-600">Our AI-powered engine works 24/7 to scan thousands of publicly available sources—including foundation websites, 990 tax forms, and press releases. It intelligently extracts key information to build a robust and structured data architecture.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-4 mb-3">
                <Users className="h-8 w-8 text-purple-600" />
                <h3 className="text-xl font-bold text-slate-800">Community-Powered Accuracy</h3>
              </div>
              <p className="text-slate-600">We know that AI isn't perfect. That's why our community is our greatest asset. Users can suggest edits and submit new grant opportunities, ensuring our data is constantly being refined and validated by people on the ground.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-4 mb-3">
                <SlidersHorizontal className="h-8 w-8 text-green-600" />
                <h3 className="text-xl font-bold text-slate-800">Smart Categorization</h3>
              </div>
              <p className="text-slate-600">Data is only as useful as it is organized. Our system analyzes grant descriptions and funder missions to apply relevant tags and categories, from "Youth Development" to "Environmental Justice," making it easy to find exactly what you're looking for.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-4 mb-3">
                <Bell className="h-8 w-8 text-amber-600" />
                <h3 className="text-xl font-bold text-slate-800">Deadline & Update Tracking</h3>
              </div>
              <p className="text-slate-600">Never miss an opportunity. The 1RFP engine continuously monitors sources for changes, updating grant statuses, new application windows, and upcoming deadlines, forming the foundation for our future user alert system.</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- How To Use 1RFP Section --- */}
      {/* UPDATED: Removed bg-white from this section */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Your Grantseeking Toolkit</h2>
            <p className="text-lg text-slate-500 mt-2">Find what you need in just a few clicks.</p>
          </div>
          <div className="space-y-16">
            {/* Step 1: Find Grants */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="font-bold text-blue-600">STEP 1</span>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Find Your Next Grant</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">Use our powerful, intuitive search and filter bar to narrow down hundreds of opportunities. Filter by category, location, funding amount, and more to find the grants that are a perfect fit for your mission.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop" alt="People collaborating around a laptop to find grants" className="rounded-lg shadow-xl border border-slate-200" />
            </div>
            {/* Step 2: Explore Funders */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2232&auto=format&fit=crop" alt="Professional meeting to research potential funders" className="rounded-lg shadow-xl border border-slate-200 md:order-last" />
              <div>
                <span className="font-bold text-green-600">STEP 2</span>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Research Potential Funders</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">Move beyond the grant to understand the funder. Our Funder Directory provides key insights into a foundation's giving history, focus areas, and average grant size, helping you build a more strategic fundraising pipeline.</p>
              </div>
            </div>
            {/* Step 3: Discover Nonprofits */}
             <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="font-bold text-purple-600">STEP 3</span>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Connect with the Community</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">Explore the landscape of other nonprofits in your field. Use our Nonprofit Directory to identify potential collaborators, understand the ecosystem, and see where your organization fits into the bigger picture of social change in the Bay Area.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop" alt="Community members connecting and collaborating" className="rounded-lg shadow-xl border border-slate-200" />
            </div>
          </div>
        </div>
      </div>
      
      {/* --- For Funders Section --- */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl border border-slate-200 text-center">
              <div className="inline-block bg-green-100 p-3 rounded-full mb-4">
                <Handshake className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">A New Way for Funders to Connect</h2>
              <p className="text-lg text-slate-600 mt-4 leading-relaxed">
                1RFP isn't just for grantseekers. We provide a unique platform for foundations to discover innovative, mission-aligned nonprofits across the Bay Area. Amplify your RFPs, gain insights into the funding landscape, and connect with the grassroots organizations that are driving change.
              </p>
              <div className="mt-6">
                <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-200 ease-in-out shadow-md">
                  Learn More (Coming Soon)
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* --- The Vision Section (For Investors) --- */}
      <div className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
            <Heart className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">More Than a Database. An Ecosystem.</h2>
          <p className="text-lg text-slate-600 mt-4 leading-relaxed">
            Our vision for 1RFP extends beyond a simple search tool. We are building the central nervous system for the Bay Area's social impact sector. By creating network effects and proprietary data insights, we aim to unlock new levels of efficiency and collaboration. Future plans include predictive grant matching, advanced analytics for funders, and a dynamic community hub to foster partnerships—creating a self-sustaining ecosystem that powers positive change.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;