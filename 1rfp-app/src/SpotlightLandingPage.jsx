// src/SpotlightLandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { countySpotlightData } from './spotlightData.js'; // Ensure this path is correct

const CountyCard = ({ slug, county }) => (
  <Link 
    to={`/spotlight/${slug}`}
    className="group block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 border border-slate-200"
  >
    <div className="relative h-48">
      <img src={county.heroImage} alt={`A view of ${county.communityName}`} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
      <h3 className="absolute bottom-4 left-4 text-white text-2xl font-bold text-shadow-md">{county.communityName}</h3>
    </div>
    <div className="p-6 bg-white">
      <p className="text-slate-600 line-clamp-3">{county.description}</p>
    </div>
  </Link>
);

const SpotlightLandingPage = () => {
  useEffect(() => {
    document.title = '1RFP - Community Spotlights';
  }, []);

  const countySlugs = Object.keys(countySpotlightData);

  return (
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">Community Spotlights</h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Explore the unique philanthropic landscapes of the 9 Bay Area counties. Discover the key organizations and foundations driving change in each community.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {countySlugs.map(slug => (
            <CountyCard key={slug} slug={slug} county={countySpotlightData[slug]} />
          ))}
        </div>
      </div>
    </div>
  );
};

// You might need to add this to your main App.jsx imports if it's not already there
import { useEffect } from 'react';

export default SpotlightLandingPage;