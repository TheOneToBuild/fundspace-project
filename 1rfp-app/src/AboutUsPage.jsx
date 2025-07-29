// src/AboutUsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Briefcase, Heart, Home, AlertTriangle, Coffee, Building, Sparkles, TrendingUp, Star, Clock, Target, Zap, Bot, Shield, Search, ArrowRight, ChevronDown } from './components/Icons.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import ScrollArrow from './components/ScrollArrow.jsx';
import AdvisoryCard from './AdvisoryCard.jsx';
import { LayoutContext } from './App.jsx';
import PublicPageLayout from './components/PublicPageLayout.jsx';

const STATIC_MEDIA = {
    collage: [
        'https://plus.unsplash.com/premium_photo-1705882849674-e8ecc5e53f6e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Tech education
        'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=687&auto=format&fit=crop', // Community collaboration
        'https://images.unsplash.com/photo-1527484912758-6e8bf56b18c3?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Community garden
        'https://plus.unsplash.com/premium_photo-1661544605271-d7da82ccaeb2?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Youth development
        'https://images.unsplash.com/photo-1615856210162-9ae33390b1a2?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Arts collective
    ],
    map: 'https://videos.pexels.com/video-files/8320073/8320073-uhd_2560_1440_25fps.mp4', // San Francisco skyline
    hero: 'https://videos.pexels.com/video-files/6893839/6893839-uhd_2560_1440_25fps.mp4' // Grant search/technology
};

const advisoryBoard = [
  {
    name: 'Jeremy Nguyen',
    title: 'Advisory Board, Chan Zuckerberg Initiative',
    imageUrl: 'https://media.licdn.com/dms/image/v2/D5603AQET5tsjlPDvOA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1705692479717?e=1756339200&v=beta&t=pUrtqQOE_DKvBg_ZXfiIYqckGn5cNs54CvTGFc7Zwu4',
    bio: 'Jeremy brings 10 years of experience advancing social impact through data-driven strategies and cross-sector collaboration. At the Chan Zuckerberg Initiative and CSBio Community Foundation, he led community-focused initiatives and educational programs that expanded access, built partnerships, and increased equity across the Bay Area. Previously at Stanford University, he supported research-practice partnerships to inform systems change in education, healthcare, and public services.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqqinZ4zpaXzMpNsJ6Y4KWdXy6ZG_t-LCqlg&s',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZ4BvrhXf_ybRp8LzBO--xU8JcvJPGghLWe3OWeDIbG0FpCqFyWtxPxhdN0r8XQzBI4W0&usqp=CAU',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  },
  {
    name: 'Yen Pang',
    title: "Advisory Board, San Mateo County Manager's Office",
    imageUrl: 'https://media.licdn.com/dms/image/v2/C5603AQFAMGYFJIyhzA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1600903357926?e=1756944000&v=beta&t=t_MdadgWSG5ei1r_su5CiUgwnUQ167iWvefbSAogAIY',
    bio: 'Yen Pang brings a decade of experience advancing equity and opportunity through data-driven policy, strategic implementation, and public sector innovation. At the San Mateo County Manager\'s Office, Yen led the Measure K redesign—overseeing its implementation and evaluation to ensure more effective, transparent, and community-informed use of public funds. Her work has strengthened local governance and deepened impact across education, health, and social services.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREOLCZbSXQ6XO8DDxUsATFbrGsLXOH8oOIhYwCDPui3tZ9pRniUEcOMjHNfr3f-mJ3mBE&usqp=CAU',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTIlcun59hjzIIjphLcoczCdFuaSyOpwDpFyHtp1R9WTq-MfqlfCtP4jTjJf94buMJfHw&usqp=CAU',
    bio: 'We are excited to announce the remaining members of our esteemed advisory board soon. Stay tuned for more experts from both sides of the funding table.'
  }
];

const StorySection = ({ children, className = '' }) => ( 
    <motion.div 
        className={`w-full flex flex-col justify-center items-center py-16 md:py-20 relative overflow-hidden ${className}`} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.2 }} 
        transition={{ staggerChildren: 0.3 }}
    >
        {children}
    </motion.div>
);

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } };

const AnimatedGradientShape = ({ className, initial, animate, gradient }) => (
    <motion.div 
        className={`absolute hidden md:block rounded-full z-0 ${className} ${gradient}`} 
        initial={initial} 
        animate={animate} 
        transition={{
            duration: Math.random() * 10 + 10, 
            ease: 'easeInOut', 
            repeat: Infinity, 
            repeatType: 'reverse',
        }}
    />
);

const AboutUsPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
    return () => {
      setPageBgColor('bg-white');
    };
  }, [setPageBgColor]);

  const formatCurrency = (amount) => `$${(amount / 1000000).toFixed(0)}M+`;
  const formatNumber = (num) => num.toLocaleString() + '+';
  const formatPercentage = (num) => `${num}%`;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* HERO SECTION */}
      <section className="text-center mb-16 relative">
        {/* Magical background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-rose-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-slate-900">Built by Community. </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              For Community.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            1RFP is the Bay Area's intelligent grant discovery platform. We believe that connecting purpose with progress shouldn't be this hard.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> Technology should empower, not burden.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/grants" className="inline-flex items-center justify-center px-8 py-3.5 font-semibold rounded-full text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto">
              Explore Grants <Search className="ml-2" size={20} />
            </a>
            <a href="/signup" className="inline-flex items-center justify-center px-8 py-3.5 font-semibold rounded-full text-purple-700 bg-purple-100 hover:bg-purple-200/70 transition-colors duration-300 w-full sm:w-auto">
              Join Our Network <ArrowRight className="ml-2" size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* IMPACT STATS SECTION */}
      <StorySection>
        <div className="text-center mb-12 relative">
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="text-slate-800">A Region of Unmatched </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Potential</span>
            <span className="text-slate-800">.<br />A Community with </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Unmet Needs</span>
            <span className="text-slate-800">.</span>
          </motion.h2>
          <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.2}}} className="text-lg md:text-xl text-slate-600 mt-6 max-w-4xl mx-auto leading-relaxed">
            The Bay Area is a global innovation hub with incredible wealth and human capital. Yet prosperity exists alongside deep-seated community challenges. Our platform begins by understanding both the resources and the need.
          </motion.p>
        </div>

        <motion.div 
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-12 w-full max-w-6xl"
        >
          <motion.div variants={fadeIn} className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center border border-sky-200">
              <Users className="h-8 w-8 text-sky-600" />
            </div>
            <AnimatedCounter targetValue={7700000} formatValue={formatNumber} className="text-3xl sm:text-4xl font-bold text-sky-600" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">Bay Area Residents</p>
          </motion.div>

          <motion.div variants={fadeIn} className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center border border-rose-200">
              <Heart className="h-8 w-8 text-rose-600" />
            </div>
            <AnimatedCounter targetValue={25000} formatValue={formatNumber} className="text-3xl sm:text-4xl font-bold text-rose-600" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">Nonprofits</p>
          </motion.div>

          <motion.div variants={fadeIn} className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center border border-amber-200">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <AnimatedCounter targetValue={8000} formatValue={formatNumber} className="text-3xl sm:text-4xl font-bold text-amber-600" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">Foundations</p>
          </motion.div>

          <motion.div variants={fadeIn} className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center border border-emerald-200">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
            <AnimatedCounter targetValue={87500000} duration={3000} formatValue={formatCurrency} className="text-3xl sm:text-4xl font-bold text-emerald-600" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">Available Annually</p>
          </motion.div>

          <motion.div variants={fadeIn} className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center border border-red-200">
              <Home className="h-8 w-8 text-red-600" />
            </div>
            <AnimatedCounter targetValue={38000} formatValue={formatNumber} className="text-3xl sm:text-4xl font-bold text-red-600" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">People Experiencing Homelessness</p>
          </motion.div>

          <motion.div variants={fadeIn} className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center border border-orange-200">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <AnimatedCounter targetValue={20} formatValue={formatPercentage} className="text-3xl sm:text-4xl font-bold text-orange-600" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">Residents Living in Poverty</p>
          </motion.div>

          <motion.div variants={fadeIn} className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center border border-indigo-200">
              <Building className="h-8 w-8 text-indigo-600" />
            </div>
            <AnimatedCounter targetValue={45} formatValue={formatPercentage} className="text-3xl sm:text-4xl font-bold text-indigo-600" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">Renters Who Are Rent-Burdened</p>
          </motion.div>

          <motion.div variants={fadeIn} className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center border border-blue-200">
              <Coffee className="h-8 w-8 text-blue-600" />
            </div>
            <AnimatedCounter targetValue={25} formatValue={formatPercentage} className="text-3xl sm:text-4xl font-bold text-blue-600" />
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2">Households Facing Food Insecurity</p>
          </motion.div>
        </motion.div>
      </StorySection>
      
      {/* MISSION SECTION */}
      <StorySection>
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl">
          <motion.div variants={fadeIn} className="text-left">
            <div className="inline-block bg-gradient-to-br from-purple-100 to-blue-100 p-4 rounded-2xl mb-6 border border-purple-200">
              <Bot className="h-10 w-10 text-purple-600" />
            </div>
            
            <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-8">Our Mission</h2>
            
            {/* Hero Mission Statement */}
            <div className="bg-gradient-to-r from-purple-100 via-blue-100 to-teal-100 p-8 rounded-3xl mb-8 text-slate-900 shadow-xl border border-slate-200">
              <h3 className="text-2xl md:text-3xl font-bold leading-tight">
                To democratize access to funding — so dreamers can dream bigger 💭, builders can build faster 🏗️, and momentum is never lost to bureaucracy 🏃‍♂️💨.
              </h3>
            </div>
            
            <div className="text-lg text-slate-600 space-y-6 leading-relaxed">
              <p>The numbers tell a story of disconnected resources. Critical funding information is scattered across thousands of foundation websites, outdated databases, and word-of-mouth networks. Nonprofits lose countless hours prospecting instead of focusing on their missions. Funders struggle to discover emerging organizations and innovative solutions.</p>
              
              <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-2xl border border-red-100">
                <p className="text-slate-700 font-semibold text-xl mb-2">This inefficiency is a tax on progress.</p>
                <p className="text-slate-600">It slows the very work that aims to uplift our communities.</p>
              </div>
              
              <p>1RFP was created to solve this problem. We use AI not as a replacement for human connection, but as a tool to foster deeper relationships, stronger partnerships, and faster resource flows to where they're needed most.</p>
              
              {/* Mission Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 mb-1">Dream Bigger</h4>
                  <p className="text-sm text-slate-600">Discover opportunities you never knew existed</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 mb-1">Build Faster</h4>
                  <p className="text-sm text-slate-600">Spend time on mission, not grant hunting</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                  <Target className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 mb-1">Never Lose Momentum</h4>
                  <p className="text-sm text-slate-600">Cut through red tape with intelligent matching</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
            className="grid grid-cols-3 grid-rows-3 gap-3 aspect-[4/3]"
          >
            <motion.div variants={fadeIn} className="col-span-2 row-span-2 rounded-xl bg-cover bg-center shadow-lg border-2 border-white overflow-hidden">
              <video
                src={STATIC_MEDIA.hero}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-xl"
                style={{ minHeight: 0, minWidth: 0 }}
              />
            </motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[1]})`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-2 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[2]})`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[3]})`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[4]})`}}></motion.div>
          </motion.div>
        </div>
      </StorySection>
    
      {/* ADVISORY BOARD SECTION */}
      <StorySection>
        <div className="text-center mb-16">
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-slate-800">Guided by </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Experience</span>
          </motion.h2>
          <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay:0.2}}} className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our advisory board brings deep experience from both sides of the funding table—from nonprofit leadership to foundation program management.
          </motion.p>
        </div>
        
        <motion.div 
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl"
        >
          {advisoryBoard.map((member, index) => (
            <AdvisoryCard 
              key={index}
              member={member}
              isExpanded={index === expandedIndex}
              onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </StorySection>

      {/* BAY AREA COMMITMENT SECTION */}
      <StorySection>
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl">
          <motion.div variants={fadeIn}>
            <video
              src={STATIC_MEDIA.map}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-96 md:h-[480px] object-cover rounded-2xl shadow-2xl border-4 border-white"
              alt="San Francisco Bay Area"
            />
          </motion.div>
          <motion.div variants={{...fadeIn, transition: {...fadeIn.transition, delay:0.2}}}>
            <div className="inline-block bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-2xl mb-6 border border-rose-200">
              <Heart className="h-10 w-10 text-rose-600" />
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-6">Committed to Home</h2>
            <div className="text-lg text-slate-600 space-y-6 leading-relaxed">
              <p>
                1RFP is exclusively for and about the 9-county San Francisco Bay Area. This local focus is our greatest strength. It allows us to build deeper relationships, provide more relevant data, and truly understand the nuanced challenges and opportunities our communities face.
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-6 rounded-2xl border border-blue-100">
                <p className="font-semibold text-slate-700 mb-4 text-lg">Serving all Bay Area counties:</p>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  {['Alameda', 'Contra Costa', 'Marin', 'Napa', 'San Francisco', 'San Mateo', 'Santa Clara', 'Solano', 'Sonoma'].map(county => (
                    <div key={county} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{county}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </StorySection>

      {/* CALL TO ACTION SECTION */}
      <StorySection className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl">
        <div className="text-center max-w-4xl px-8">
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Funding Search?
          </motion.h2>
          <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.2}}} className="text-xl mb-8 opacity-90">
            Join Bay Area organizations already using 1RFP to find funding faster and focus on what matters most: their mission.
          </motion.p>
          
          <motion.div 
            variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.4}}}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="/grants" 
              className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full text-purple-700 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              <Search className="mr-2" size={20} />
              Start Exploring Grants
            </a>
            <a 
              href="/signup" 
              className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300 w-full sm:w-auto"
            >
              <Sparkles className="mr-2" size={20} />
              Create Free Account
            </a>
          </motion.div>
        </div>
      </StorySection>
    </div>
  );
};

export default AboutUsPage;