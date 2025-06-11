// src/CommunitySpotlightPage.jsx
import React from 'react';
import { communitySpotlightData as spotlight } from './spotlightData.js';
import { Users, DollarSign, Calendar, ExternalLink, Award, ClipboardCheck, MapPin } from './components/Icons.jsx';

// An icon map to easily render icons based on the data
const iconMap = {
  Users: <Users size={24} className="text-rose-500" />,
  DollarSign: <DollarSign size={24} className="text-green-500" />,
  Calendar: <Calendar size={24} className="text-blue-500" />,
};

// Main Component for the Spotlight Page
const CommunitySpotlightPage = () => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      {/* --- Hero Section --- */}
      <div className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-white text-center px-4">
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        <img src={spotlight.heroImage} alt={`${spotlight.communityName} hero image`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-20 max-w-4xl mx-auto">
          <p className="text-lg font-semibold tracking-widest uppercase text-rose-300 mb-2">{spotlight.month} {spotlight.year} Spotlight</p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-shadow-lg">
            {spotlight.communityName}, <span className="font-light">{spotlight.countyName}</span>
          </h1>
          <p className="text-xl md:text-2xl font-light text-slate-200 text-shadow-md">{spotlight.tagline}</p>
        </div>
      </div>

      {/* --- Community Intro Section --- */}
      <div className="container mx-auto -mt-20 relative z-30 px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12 border border-slate-200">
          <p className="text-slate-600 text-lg leading-relaxed mb-8">{spotlight.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center border-t border-slate-200 pt-8">
            {spotlight.stats.map(stat => (
              <div key={stat.label}>
                <div className="flex items-center justify-center mb-2">{iconMap[stat.icon]}</div>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Nonprofits Section --- */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Spotlight on Local Nonprofits</h2>
            <p className="text-lg text-slate-500 mt-2">Organizations making a tangible impact in {spotlight.communityName}.</p>
            <div className="mt-4 w-24 h-1 bg-purple-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {spotlight.featuredNonprofits.map(nonprofit => (
              <div key={nonprofit.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
                <img src={nonprofit.imageUrl} alt={nonprofit.name} className="h-48 w-full object-cover" />
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900">{nonprofit.name}</h3>
                  <p className="text-purple-600 font-medium text-sm mb-4">Founded in {nonprofit.yearFounded}</p>
                  
                  <div className="my-2">
                      <h4 className="font-semibold text-slate-700 text-sm mb-1">About</h4>
                      <p className="text-slate-600 text-sm leading-relaxed">{nonprofit.about}</p>
                  </div>

                  <div className="my-4">
                      <h4 className="font-semibold text-slate-700 text-sm mb-1">Mission</h4>
                      <blockquote className="border-l-4 border-purple-200 pl-4">
                          <p className="text-slate-600 text-sm italic leading-relaxed">{nonprofit.mission}</p>
                      </blockquote>
                  </div>

                  <div className="my-4">
                      <h4 className="font-semibold text-slate-700 text-sm mb-2">Key Programs:</h4>
                      <ul className="space-y-1">
                          {nonprofit.keyPrograms.map(prog => <li key={prog} className="text-sm text-slate-600 flex items-start"><Award size={14} className="text-purple-400 mr-2 mt-0.5 flex-shrink-0" />{prog}</li>)}
                      </ul>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mt-auto pt-4 border-t border-slate-100"><span className="font-semibold">Impact Highlight:</span> {nonprofit.impactStory}</p>
                  
                  <a href={nonprofit.website} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    Learn Their Story <ExternalLink size={16} className="ml-2" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Funders Section --- */}
      <section className="pb-16 md:pb-24">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Spotlight on Community Funders</h2>
                  <p className="text-lg text-slate-500 mt-2">Foundations committed to supporting {spotlight.communityName}.</p>
                  <div className="mt-4 w-24 h-1 bg-green-500 mx-auto rounded-full"></div>
              </div>
              <div className="grid md:grid-cols-3 gap-8 items-stretch">
                  {spotlight.featuredFunders.map(funder => (
                      <div key={funder.id} className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
                           <div className="flex items-start mb-4">
                              <img src={funder.logoUrl} alt={`${funder.name} logo`} className="h-16 w-16 rounded-full mr-4 border-2 border-white shadow-md"/>
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">{funder.name}</h3>
                                {/* NEW: Funder Type Pill */}
                                <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{funder.funderType}</span>
                              </div>
                          </div>
                          <div className="space-y-4 flex-grow flex flex-col">
                            <p className="text-slate-600 text-sm leading-relaxed"><span className="font-semibold text-slate-700">Funding Philosophy:</span> {funder.philosophy}</p>
                            
                            {/* NEW: Displaying richer data with icons */}
                            <div className="space-y-3 pt-4 border-t border-slate-200">
                                <div className="flex items-start">
                                    <MapPin size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <p className="text-slate-600 text-sm"><span className="font-semibold">Geographic Scope:</span> {funder.geographicScope}</p>
                                </div>
                                <div className="flex items-start">
                                    <DollarSign size={16} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <p className="text-slate-600 text-sm"><span className="font-semibold">Annual Giving:</span> {funder.annualGiving}</p>
                                </div>
                                <div className="flex items-start">
                                    <ClipboardCheck size={16} className="text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <p className="text-slate-600 text-sm"><span className="font-semibold">Process:</span> {funder.grantmakingProcess}</p>
                                </div>
                                <div className="flex items-start">
                                    <Award size={16} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <p className="text-slate-600 text-sm"><span className="font-semibold">Notable Grant:</span> {funder.notableGrant}</p>
                                </div>
                            </div>
                          </div>
                          
                           <div className="mt-4 pt-4 border-t border-slate-200">
                              <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Key Focus Areas:</p>
                              <div className="flex flex-wrap gap-2">
                                  {funder.focusAreas.map(area => <span key={area} className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">{area}</span>)}
                              </div>
                          </div>
                          <a href={funder.website} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              View Their Grants <ExternalLink size={16} className="ml-2" />
                          </a>
                      </div>
                  ))}
              </div>
          </div>
      </section>
    </div>
  );
};

export default CommunitySpotlightPage;