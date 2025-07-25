// src/CitySpotlightPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { citySpotlightData } from './spotlightData.js';
import { Users, DollarSign, Calendar, Loader, ArrowLeft } from './components/Icons.jsx';
import OrganizationCard from './components/OrganizationCard.jsx';

const CitySpotlightPage = () => {
  const { countySlug, citySlug } = useParams();
  const [spotlight, setSpotlight] = useState(null);
  const [nonprofits, setNonprofits] = useState([]);
  const [funders, setFunders] = useState([]);
  const [loading, setLoading] = useState(true);

  // No-op for now, can be replaced with real filter logic if needed
  const handleFilterChange = () => {};

  useEffect(() => {
    const spotlightData = citySpotlightData[citySlug];
    if (!spotlightData) {
        setLoading(false);
        return;
    }
    
    setSpotlight(spotlightData);
    document.title = `1RFP - Spotlight on ${spotlightData.communityName}`;

    const fetchCityData = async () => {
      setLoading(true);
      try {
        const cityNameForQuery = spotlightData.communityName; // e.g., "Oakland"

        const [nonprofitRes, funderRes] = await Promise.all([
            supabase
              .from('nonprofits')
              .select('*, nonprofit_categories(categories(name))')
              .ilike('location', `%${cityNameForQuery}%`)
              .limit(3),
            supabase
              .from('funders')
              .select('*, funder_type:funder_type_id(name), funder_categories(categories(name)), funder_funding_locations(locations(name))')
              .ilike('location', `%${cityNameForQuery}%`)
              .limit(3)
        ]);
        
        if (nonprofitRes.error) throw nonprofitRes.error;
        const formattedNonprofits = (nonprofitRes.data || []).map(np => ({ ...np, imageUrl: np.image_url, focusAreas: np.nonprofit_categories.map(npc => npc.categories.name) }));
        setNonprofits(formattedNonprofits);

        if (funderRes.error) throw funderRes.error;
        const formattedFunders = (funderRes.data || []).map(f => ({ ...f, funderType: f.funder_type?.name, focus_areas: f.funder_categories.map(fc => fc.categories.name), funding_locations: f.funder_funding_locations.map(ffl => ffl.locations.name) }));
        setFunders(formattedFunders);

      } catch (error) {
        console.error("Error fetching city spotlight data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCityData();
  }, [citySlug]);

  const iconMap = {
    Users: <Users size={24} className="text-rose-500" />,
    DollarSign: <DollarSign size={24} className="text-green-500" />,
    Calendar: <Calendar size={24} className="text-blue-500" />,
  };
  
  if (!spotlight && !loading) {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold">City Spotlight Not Found</h1>
            <p className="text-slate-600 mt-2">The city slug "{citySlug}" is not valid.</p>
            <Link to={`/spotlight/${countySlug}`} className="text-blue-600 hover:underline mt-4 inline-block">Back to County Spotlight</Link>
        </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to={`/spotlight/${countySlug}`} className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-8">
            <ArrowLeft size={16} className="mr-2" />
            {/* --- This is now more robust --- */}
            Back to {spotlight?.countyName || 'County'} Spotlight
        </Link>
        {spotlight && (
        <>
            {/* --- Hero Section --- */}
            <div className="relative h-[50vh] min-h-[350px] flex items-center justify-center text-white text-center px-4 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
                <img src={spotlight.heroImage} alt={`${spotlight.communityName} hero image`} className="absolute inset-0 w-full h-full object-cover" />
                <div className="relative z-20 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-shadow-lg">{spotlight.communityName}</h1>
                    <p className="text-xl md:text-2xl font-light text-slate-200 text-shadow-md">{spotlight.tagline}</p>
                </div>
            </div>

            {/* --- Community Intro Section --- */}
            <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 border border-slate-200 my-12">
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
        </>
        )}
      
        {loading ? (
            <div className="text-center py-20"><Loader size={40} className="mx-auto text-purple-400 animate-spin" /></div>
        ) : (
            <>
            {/* --- Nonprofits & Funders Sections --- */}
            <section className="pb-16 md:pb-24">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Spotlight on Local Nonprofits</h2>
                  <div className="mt-4 w-24 h-1 bg-purple-500 mx-auto rounded-full"></div>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                    {nonprofits.length > 0 ? nonprofits.map(nonprofit => (
                      <OrganizationCard
                        key={nonprofit.id}
                        organization={nonprofit}
                        handleFilterChange={handleFilterChange}
                        linkTo={`/nonprofits/${nonprofit.slug}`}
                        buttonText="View Profile"
                      />
                    )) : <p className="text-center text-slate-500 col-span-3">No specific nonprofits found for this city yet.</p>}
                </div>
            </section>
            <section className="pb-16 md:pb-24">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Spotlight on Community Funders</h2>
                  <div className="mt-4 w-24 h-1 bg-green-500 mx-auto rounded-full"></div>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                    {funders.length > 0 ? funders.map(funder => (
                      <OrganizationCard
                        key={funder.id}
                        organization={funder}
                        handleFilterChange={handleFilterChange}
                        linkTo={`/funders/${funder.slug}`}
                        buttonText="View Grants"
                      />
                    )) : <p className="text-center text-slate-500 col-span-3">No specific funders found for this city yet.</p>}
                </div>
            </section>
            </>
        )}
      </div>
    </div>
  );
};

export default CitySpotlightPage;