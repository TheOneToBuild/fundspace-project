// src/CountySpotlightPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from './supabaseClient.js';
import { countySpotlightData } from './spotlightData.js';
import { Users, DollarSign, MapPin, Loader, ExternalLink, Map, ArrowRight, Search, Sparkles, Heart, Building, TrendingUp } from './components/Icons.jsx';
import OrganizationCard from './components/OrganizationCard.jsx';
import { LayoutContext } from './App.jsx';

const CountySpotlightPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);
  const { countySlug } = useParams(); 
  const [spotlight, setSpotlight] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [fundProviders, setFundProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-rose-50 to-orange-50');
    return () => {
      setPageBgColor('bg-white');
    };
  }, [setPageBgColor]);

  const handleFilterChange = () => {};

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
        const countyNameForQuery = spotlightData.communityName.split(' ')[0];

        const [nonprofitRes, funderRes] = await Promise.all([
            supabase
              .from('nonprofits')
              .select('*, nonprofit_categories(categories(name))')
              .ilike('location', `%${countyNameForQuery}%`)
              .limit(3),
            supabase
              .from('funders')
              .select('*, funder_type:funder_type_id(name), funder_categories(categories(name)), funder_funding_locations(locations(name))')
              .ilike('location', `%${countyNameForQuery}%`)
              .limit(3)
        ]);
        
        if (nonprofitRes.error) throw nonprofitRes.error;
        const formattedOrganizations = (nonprofitRes.data || []).map(np => ({ 
          ...np, 
          imageUrl: np.image_url, 
          focus_areas: np.nonprofit_categories.map(npc => npc.categories.name),
          type: 'nonprofit'
        }));
        setOrganizations(formattedOrganizations);

        if (funderRes.error) throw funderRes.error;
        const formattedFundProviders = (funderRes.data || []).map(f => ({ 
          ...f, 
          funderType: f.funder_type?.name, 
          focus_areas: f.funder_categories.map(fc => fc.categories.name), 
          funding_locations: f.funder_funding_locations.map(ffl => ffl.locations.name),
          type: 'foundation'
        }));
        setFundProviders(formattedFundProviders);

      } catch (error) {
        console.error("Error fetching live spotlight data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpotlightData();
  }, [countySlug]);

  const iconMap = {
    Users: <Users size={32} className="text-blue-500" />,
    DollarSign: <DollarSign size={32} className="text-emerald-500" />,
    MapPin: <MapPin size={32} className="text-rose-500" />,
    Building: <Building size={32} className="text-purple-500" />,
  };

  const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } };
  
  if (!spotlight && !loading) {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl border border-white/60 shadow-2xl max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Search className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-3">Community Spotlight Not Found</h1>
                <p className="text-slate-600 mb-6">The county slug "{countySlug}" is not valid.</p>
                <Link 
                    to="/spotlight" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
                >
                    <ArrowRight className="mr-2" size={16} />
                    View All Spotlights
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 z-10"></div>
        {spotlight && (
          <img 
            src={spotlight.heroImage} 
            alt={`${spotlight.communityName} hero image`} 
            className="absolute inset-0 w-full h-full object-cover" 
          />
        )}
        <div className="relative z-20 max-w-6xl mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            {spotlight?.communityName}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="text-xl md:text-2xl font-light text-white/90 max-w-3xl mx-auto leading-relaxed"
          >
            {spotlight?.tagline}
          </motion.p>
        </div>
      </section>

      {/* COMMUNITY INTRO SECTION */}
      <section className="container mx-auto px-4 -mt-32 relative z-30 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-white/60"
        >
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-10 text-center max-w-4xl mx-auto">
            {spotlight?.description}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center border-t border-slate-200 pt-10">
            {spotlight?.stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-300 shadow-lg">
                  {iconMap[stat.icon]}
                </div>
                <p className="text-4xl font-bold text-slate-800 mb-2">{stat.value}</p>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
      
      {loading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader size={32} className="text-purple-600 animate-spin" />
          </div>
          <p className="text-slate-600">Loading community data...</p>
        </div>
      ) : (
        <>
          {/* ORGANIZATIONS SECTION */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-slate-800">Local </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Organizations</span>
                </h2>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                  Organizations making a tangible impact in {spotlight.communityName}.
                </p>
              </motion.div>
              
              <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                {organizations.length > 0 ? (
                  organizations.map((organization, index) => (
                    <motion.div
                      key={organization.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <OrganizationCard
                        organization={organization}
                        handleFilterChange={handleFilterChange}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="col-span-3 text-center py-12"
                  >
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-white/60 shadow-lg max-w-md mx-auto">
                      <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No specific organizations found for this spotlight yet.</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {organizations.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center mt-12"
                >
                  <a 
                    href="/organizations" 
                    className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Users className="mr-2" size={20} />
                    Explore All Organizations
                  </a>
                </motion.div>
              )}
            </div>
          </section>

          {/* FUND PROVIDERS SECTION */}
          <section className="py-16 md:py-24 bg-white/60 backdrop-blur-sm">
            <div className="container mx-auto px-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-slate-800">Community </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Fund Providers</span>
                </h2>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                  Organizations committed to supporting {spotlight.communityName}.
                </p>
              </motion.div>
              
              <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                {fundProviders.length > 0 ? (
                  fundProviders.map((provider, index) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <OrganizationCard
                        organization={provider}
                        handleFilterChange={handleFilterChange}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="col-span-3 text-center py-12"
                  >
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-white/60 shadow-lg max-w-md mx-auto">
                      <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No specific fund providers found for this spotlight yet.</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {fundProviders.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center mt-12"
                >
                  <a 
                    href="/organizations?prefilter=foundation" 
                    className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Building className="mr-2" size={20} />
                    Explore All Fund Providers
                  </a>
                </motion.div>
              )}
            </div>
          </section>

          {/* FEATURED CITIES SECTION */}
          {spotlight?.featuredCities && spotlight.featuredCities.length > 0 && (
            <section className="py-16 md:py-24">
              <div className="container mx-auto px-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-16"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="h-8 w-8 text-rose-600" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    <span className="text-slate-800">Explore Cities in </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600">{spotlight.communityName}</span>
                  </h2>
                  <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                    Drill down to see dedicated spotlights for major cities in this county.
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {spotlight.featuredCities.map((city, index) => (
                    <motion.div
                      key={city.slug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Link 
                        to={`/spotlight/${countySlug}/${city.slug}`}
                        className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-between transform hover:scale-105 border border-white/60"
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-orange-100 rounded-xl flex items-center justify-center mr-4 border border-rose-200">
                            <MapPin className="h-6 w-6 text-rose-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:to-orange-600 transition-all duration-300">
                            {city.name}
                          </h3>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all duration-300" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* BOTTOM CTA SECTION */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Discover More in {spotlight?.communityName}
                </h2>
                <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                  Explore the full ecosystem of organizations and funding opportunities in this vibrant Bay Area community.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a 
                    href="/grants" 
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 hover:bg-gray-100 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Search className="mr-2" size={20} />
                    Find Local Grants
                  </a>
                  <a 
                    href="/spotlight" 
                    className="inline-flex items-center justify-center px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold transition-all duration-300"
                  >
                    <Map className="mr-2" size={20} />
                    View All Spotlights
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default CountySpotlightPage;