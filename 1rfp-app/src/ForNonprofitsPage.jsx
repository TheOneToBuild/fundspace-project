// src/ForNonprofitsPage.jsx
import React from 'react';
import { Search, Database, Filter, Briefcase, XCircle, CheckCircle2 } from './components/Icons.jsx';

const ForNonprofitsPage = () => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      {/* --- Hero Section --- */}
      <div className="text-center py-20 md:py-28 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Less Prospecting. <span className="text-blue-600">More Impact.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            1RFP was built to give you back your most valuable resource: time. Stop juggling dozens of websites and databases, and start focusing on what you do best—driving change in your community.
          </p>
          <div className="mt-8">
             <a href="#" onClick={() => window.location.reload()} className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105">
                Explore Live Grants <Search className="ml-2" />
              </a>
          </div>
        </div>
      </div>

      {/* --- Pain / Solution Section --- */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Focus on Your Mission, Not the Paperwork</h2>
            <p className="text-lg text-slate-500 mt-2 max-w-2xl mx-auto">We understand the endless cycle of grantseeking. We built 1RFP to break it.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto items-center">
            {/* The Problem / Solution Columns */}
            <div className="grid grid-cols-1 gap-8">
                <div className="bg-rose-100/40 p-8 rounded-xl border border-rose-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">The Old Way</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start"><XCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" /><span>Endless hours spent searching across dozens of siloed foundation websites.</span></li>
                    <li className="flex items-start"><XCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" /><span>Missing deadlines because opportunities were buried in an inbox or old bookmark.</span></li>
                    <li className="flex items-start"><XCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" /><span>Struggling to find new funders who align with your specific mission and location.</span></li>
                    <li className="flex items-start"><XCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" /><span>Feeling like you're always one step behind the funding curve.</span></li>
                  </ul>
                </div>
                <div className="bg-green-100/40 p-8 rounded-xl border border-green-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">The 1RFP Way</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start"><CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" /><span>One centralized platform with hundreds of Bay Area grants, updated continuously.</span></li>
                    <li className="flex items-start"><CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" /><span>Powerful, intuitive filters to find the perfect grant in minutes, not days.</span></li>
                    <li className="flex items-start"><CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" /><span>Discover new funders and understand their giving patterns to build a smarter pipeline.</span></li>
                    <li className="flex items-start"><CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" /><span>More time to focus on what truly matters: your programs and your community.</span></li>
                  </ul>
                </div>
            </div>
            {/* Image Column */}
            <div className="md:order-first">
              <img 
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop" 
                alt="A diverse group of nonprofit professionals collaborating in a meeting" 
                className="rounded-xl shadow-lg w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Feature Breakdown Section with Collage --- */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">How We Help</h2>
          </div>
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Comprehensive Database</h3>
              <p className="text-slate-600">Our AI and community-powered engine gathers grant opportunities from across the Bay Area into one place.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
                <Filter className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Powerful Filtering</h3>
              <p className="text-slate-600">Zero in on your best-fit grants. Filter by focus area, location, funding amount, and grant type to save time.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Strategic Insights</h3>
              <p className="text-slate-600">Use our Funder and Nonprofit directories to understand the funding landscape and identify potential collaborators.</p>
            </div>
          </div>
          
          {/* Image Collage */}
          <div className="mt-16 max-w-6xl mx-auto h-[600px] grid grid-cols-4 grid-rows-2 gap-4">
              <div className="col-span-2 row-span-2">
                  <img src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=2070&auto=format&fit=crop" alt="Community workshop" className="w-full h-full object-cover rounded-lg shadow-lg" />
              </div>
              <div className="col-span-2 row-span-1">
                  <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop" alt="People connecting at a community event" className="w-full h-full object-cover rounded-lg shadow-lg" />
              </div>
              <div className="col-span-1 row-span-1">
                  <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" alt="Volunteers working together at a food drive" className="w-full h-full object-cover rounded-lg shadow-lg" />
              </div>
              <div className="col-span-1 row-span-1">
                  <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop" alt="Team putting hands together in a circle" className="w-full h-full object-cover rounded-lg shadow-lg" />
              </div>
          </div>
        </div>
      </div>

       {/* --- Pricing / Free Section --- */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-800">Built for Nonprofits. Free, Forever.</h2>
          <p className="text-lg text-slate-600 mt-4 leading-relaxed">
            We are committed to empowering the Bay Area's nonprofit sector. Access to our grant search and discovery tools will always be free for registered 501(c)(3) organizations. No trials, no hidden fees. Just a powerful tool to help you succeed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForNonprofitsPage;