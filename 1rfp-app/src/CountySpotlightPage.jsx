import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { countySpotlightData } from './spotlightData.js';
import { Users, DollarSign, MapPin, Loader, ArrowRight } from './components/Icons.jsx';
import OrganizationCard from './components/OrganizationCard.jsx';
import PublicPageLayout from './components/PublicPageLayout.jsx';

const CountySpotlightPage = () => {
  const { countySlug } = useParams(); 
  const [spotlight, setSpotlight] = useState(null);
  const [nonprofits, setNonprofits] = useState([]);
  const [funders, setFunders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const spotlightData = countySpotlightData[countySlug];
    if (!spotlightData) {
      setLoading(false);
      return;
    }
    
    setSpotlight(spotlightData);
    document.title = `1RFP - Spotlight on ${spotlightData.communityName}`;

    const fetchSpotlightData = async () => {
      setLoading(true);
      try {
        let citiesToQuery;
        let countyNameForQuery = spotlightData.communityName;

        if (countySlug === 'san-francisco') {
          citiesToQuery = ['San Francisco, CA'];
        } else {
          citiesToQuery = spotlightData.featuredCities.map(city => `${city.name}, CA`);
        }

        const [nonprofitRes, funderRes] = await Promise.all([
          supabase
            .from('nonprofits')
            .select('*, nonprofit_categories(categories(name))')
            .in('location', citiesToQuery)
            .limit(3),
          supabase
            .from('funders')
            .select('*, funder_type:funder_type_id(name), funder_categories(categories(name)), funder_funding_locations!inner(locations!inner(name))')
            .eq('funder_funding_locations.locations.name', countyNameForQuery)
            .limit(3)
        ]);
        
        if (nonprofitRes.error) throw nonprofitRes.error;
        const formattedNonprofits = (nonprofitRes.data || []).map(np => ({ 
          ...np, 
          imageUrl: np.image_url, 
          focusAreas: np.nonprofit_categories.map(npc => npc.categories.name) 
        }));
        setNonprofits(formattedNonprofits);

        if (funderRes.error) throw funderRes.error;
        let localFunders = (funderRes.data || []).map(f => ({ 
          ...f, 
          funderType: f.funder_type?.name, 
          focus_areas: f.funder_categories.map(fc => fc.categories.name), 
          funding_locations: [countyNameForQuery] 
        }));
        
        let combinedFunders = [...localFunders];
        if (localFunders.length < 3) {
          const remainingLimit = 3 - localFunders.length;
          const { data: regionalFundersData, error: regionalError } = await supabase
            .from('funders')
            .select('*, funder_type:funder_type_id(name), funder_categories(categories(name)), funder_funding_locations!inner(locations!inner(name))')
            .eq('funder_funding_locations.locations.name', 'All Bay Area Counties')
            .limit(remainingLimit);

          if (regionalError) console.warn("Could not fetch regional funders:", regionalError);

          if (regionalFundersData) {
            const formattedRegionalFunders = regionalFundersData.map(f => ({ 
              ...f, 
              funderType: f.funder_type?.name, 
              focus_areas: f.funder_categories.map(fc => fc.categories.name), 
              funding_locations: ['All Bay Area Counties'] 
            }));
            const existingIds = new Set(combinedFunders.map(f => f.id));
            const uniqueRegionalFunders = formattedRegionalFunders.filter(f => !existingIds.has(f.id));
            combinedFunders.push(...uniqueRegionalFunders);
          }
        }
        
        setFunders(combinedFunders.slice(0, 3));

      } catch (error) {
        console.error("Error fetching spotlight data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (spotlightData) {
      fetchSpotlightData();
    }
  }, [countySlug]);

  const iconMap = {
    Users: <Users size={24} className="text-rose-500" />,
    DollarSign: <DollarSign size={24} className="text-green-500" />,
    MapPin: <MapPin size={24} className="text-blue-500" />,
  };
  
  if (!spotlight && !loading) {
    return (
      <PublicPageLayout bgColor="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Community Spotlight Not Found</h1>
          <p className="text-slate-600 mt-2">The county slug "{countySlug}" is not valid.</p>
          <Link to="/spotlight" className="text-blue-600 hover:underline mt-4 inline-block">View All Spotlights</Link>
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout bgColor="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      <div>
        <div className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-white text-center px-4">
          <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
          {spotlight && <img src={spotlight.heroImage} alt={`${spotlight.communityName} hero image`} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="relative z-20 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-shadow-lg">{spotlight?.communityName}</h1>
            <p className="text-xl md:text-2xl font-light text-slate-200 text-shadow-md">{spotlight?.tagline}</p>
          </div>
        </div>
        <div className="container mx-auto -mt-20 relative z-30 px-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12 border border-slate-200">
            <p className="text-slate-600 text-lg leading-relaxed mb-8">{spotlight?.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center border-t border-slate-200 pt-8">
              {spotlight?.stats.map(stat => (
                <div key={stat.label}>
                  <div className="flex items-center justify-center mb-2">{iconMap[stat.icon]}</div>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-sm text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20"><Loader size={40} className="mx-auto text-purple-400 animate-spin" /></div>
        ) : (
          <>
            <section className="py-16 md:py-24">
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Spotlight on Local Nonprofits</h2>
                  <p className="text-lg text-slate-500 mt-2">Organizations making a tangible impact in {spotlight.communityName}.</p>
                  <div className="mt-4 w-24 h-1 bg-purple-500 mx-auto rounded-full"></div>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                  {nonprofits.length > 0 ? (
                    nonprofits.map(nonprofit => (
                      <OrganizationCard 
                        key={nonprofit.id} 
                        organization={nonprofit} 
                        linkTo={`/nonprofits/${nonprofit.slug}`}
                        buttonText="View Profile"
                      />
                    ))
                  ) : (
                    <p className="text-center text-slate-500 col-span-3">No specific nonprofits found for this spotlight yet.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="pb-16 md:pb-24">
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Spotlight on Community Funders</h2>
                  <p className="text-lg text-slate-500 mt-2">Foundations committed to supporting {spotlight.communityName}.</p>
                  <div className="mt-4 w-24 h-1 bg-green-500 mx-auto rounded-full"></div>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                  {funders.length > 0 ? (
                    funders.map(funder => (
                      <OrganizationCard 
                        key={funder.id} 
                        organization={funder} 
                        linkTo={`/funders/${funder.slug}`}
                        buttonText="View Grants"
                      />
                    ))
                  ) : (
                    <p className="text-center text-slate-500 col-span-3">No specific funders found for this spotlight yet.</p>
                  )}
                </div>
              </div>
            </section>

            {spotlight?.featuredCities && spotlight.featuredCities.length > 0 && (
              <section className="pb-16 md:pb-24 bg-slate-100 py-16">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Explore Cities in {spotlight.communityName}</h2>
                    <p className="text-lg text-slate-500 mt-2">Drill down to see a dedicated spotlight for major cities.</p>
                    <div className="mt-4 w-24 h-1 bg-rose-500 mx-auto rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {spotlight.featuredCities.map(city => (
                      <Link 
                        key={city.slug}
                        to={`/spotlight/${countySlug}/${city.slug}`}
                        className="group bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-between transform hover:scale-105"
                      >
                        <div>
                          <div className="flex items-center">
                            <MapPin size={20} className="mr-3 text-rose-500" />
                            <h3 className="text-xl font-bold text-slate-800">{city.name}</h3>
                          </div>
                        </div>
                        <ArrowRight size={20} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PublicPageLayout>
  );
};

export default CountySpotlightPage;