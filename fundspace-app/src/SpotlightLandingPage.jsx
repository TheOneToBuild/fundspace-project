// src/SpotlightLandingPage.jsx
import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { countySpotlightData } from './spotlightData.js';
import { MapPin, Users, Briefcase, TrendingUp, ArrowRight, Sparkles, Search, Heart } from './components/Icons.jsx';
import { LayoutContext } from './App.jsx';

const CountyCard = ({ slug, county, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
  >
    <Link 
      to={`/spotlight/${slug}`}
      className="group block rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-3 border border-white/60 bg-white/80 backdrop-blur-sm"
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={county.heroImage} 
          alt={`A view of ${county.communityName}`} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-500"></div>
        <div className="absolute top-4 right-4">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all duration-300">
            <ArrowRight className="h-5 w-5 text-white transform group-hover:translate-x-0.5 transition-transform duration-300" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-white/80" />
            <span className="text-white/80 text-sm font-medium">Bay Area County</span>
          </div>
          <h3 className="text-white text-2xl md:text-3xl font-bold leading-tight">
            {county.communityName}
          </h3>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-slate-600 leading-relaxed line-clamp-3 mb-4">
          {county.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Organizations</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>Funders</span>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors duration-300">
            <span>Explore</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

const SpotlightLandingPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);

  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-rose-50 to-orange-50');
    document.title = 'Fundspace - Community Spotlights';
    return () => {
      setPageBgColor('bg-white');
    };
  }, [setPageBgColor]);

  const countySlugs = Object.keys(countySpotlightData);

  const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* HERO SECTION */}
      <section className="text-center mb-16 relative">
        {/* Magical background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-rose-400 to-pink-600 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-orange-400 to-red-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-orange-100 rounded-3xl flex items-center justify-center border border-rose-200 shadow-lg"
          >
            <MapPin className="h-10 w-10 text-rose-600" />
          </motion.div>
          
          <motion.h1 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4"
          >
            <span className="text-slate-900">Community </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-orange-600 to-yellow-600">
              Spotlights
            </span>
          </motion.h1>
          
          <motion.p 
            variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.2}}}
            initial="hidden"
            animate="visible"
            className="text-lg md:text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            Explore the unique philanthropic landscapes of the 9 Bay Area counties. Discover the key organizations and fund providers driving change in each community.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 font-semibold"> Every county has its own story of impact.</span>
          </motion.p>

          <motion.div 
            variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.4}}}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="/organizations" 
              className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-full text-white bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Search className="mr-2" size={18} />
              Explore All Organizations
            </a>
            <a 
              href="/grants" 
              className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-full text-orange-700 bg-orange-100 hover:bg-orange-200/70 transition-colors duration-300"
            >
              <TrendingUp className="mr-2" size={18} />
              Browse Grants
            </a>
          </motion.div>
        </div>
      </section>

      {/* COUNTY GRID SECTION */}
      <section>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Discover Each County's Impact
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From San Francisco's urban innovation to Napa's community resilience, each county has a unique ecosystem of organizations creating positive change.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {countySlugs.map((slug, index) => (
            <CountyCard 
              key={slug} 
              slug={slug} 
              county={countySpotlightData[slug]} 
              index={index}
            />
          ))}
        </div>
      </section>

      {/* BOTTOM INFO SECTION */}
      <section className="mt-20">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <Heart className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bay Area. Built by Community.
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Each spotlight tells the story of passionate organizations, generous fund providers, and communities working together to create a better future for the Bay Area.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <Users className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Local Organizations</h3>
              <p className="text-sm opacity-80">Discover grassroots organizations making a difference in each county.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <Sparkles className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Funding Opportunities</h3>
              <p className="text-sm opacity-80">Find county-specific grants and funding sources for your mission.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SpotlightLandingPage;