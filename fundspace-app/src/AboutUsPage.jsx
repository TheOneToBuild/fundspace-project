// src/AboutUsPage.jsx
import React, { useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Briefcase, Heart, Home, AlertTriangle, Coffee, Building, Sparkles, TrendingUp, Star, Clock, Target, Zap, Bot, Shield, Search, ArrowRight, ChevronDown, ExternalLink } from './components/Icons.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { LayoutContext } from './App.jsx';
import PublicPageLayout from './components/PublicPageLayout.jsx';

const STATIC_MEDIA = {
    collage: [
        'https://plus.unsplash.com/premium_photo-1705882849674-e8ecc5e53f6e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Tech education
        'https://images.pexels.com/photos/6995106/pexels-photo-6995106.jpeg', // Community collaboration
        'https://images.unsplash.com/photo-1527484912758-6e8bf56b18c3?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Community garden
        'https://images.pexels.com/photos/9543414/pexels-photo-9543414.jpeg', // Youth development
        'https://images.unsplash.com/photo-1615856210162-9ae33390b1a2?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Arts collective
    ],
    map: 'https://videos.pexels.com/video-files/8320073/8320073-uhd_2560_1440_25fps.mp4', // San Francisco skyline
    hero: 'https://videos.pexels.com/video-files/7402746/7402746-hd_1080_1920_30fps.mp4' // Grant search/technology
};

const advisoryBoard = [
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTljW8umHXU4FCVp6-HEuPasRa0jvvrTiCs_qtuiv0Y09LPSPhS',
    linkedinUrl: null
  },
  {
    name: 'Hana Ma',
    title: 'Senior Program Officer, Sobrato Philanthropies',
    imageUrl: 'https://media.licdn.com/dms/image/v2/D4E03AQFLpGmrPIPhJw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1698185669765?e=1757548800&v=beta&t=E0SzY2HFu542nR4AWlTFDkl5X8fkCBI5P-arsHwhcYM',
    linkedinUrl: 'https://www.linkedin.com/in/hanahsiao/'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZ4BvrhXf_ybRp8LzBO--xU8JcvJPGghLWe3OWeDIbG0FpCqFyWtxPxhdN0r8XQzBI4W0&usqp=CAU',
    linkedinUrl: null
  },
  {
    name: 'Yen Pang',
    title: "Director of Contracts Administration and Compliance, SFO",
    imageUrl: 'https://media.licdn.com/dms/image/v2/C5603AQFAMGYFJIyhzA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1600903357926?e=1756944000&v=beta&t=t_MdadgWSG5ei1r_su5CiUgwnUQ167iWvefbSAogAIY',
    linkedinUrl: 'https://www.linkedin.com/in/yenpang/'
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREOLCZbSXQ6XO8DDxUsATFbrGsLXOH8oOIhYwCDPui3tZ9pRniUEcOMjHNfr3f-mJ3mBE&usqp=CAU',
    linkedinUrl: null
  },
  {
    name: 'Advisory Board Member',
    title: 'To be announced',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTIlcun59hjzIIjphLcoczCdFuaSyOpwDpFyHtp1R9WTq-MfqlfCtP4jTjJf94buMJfHw&usqp=CAU',
    linkedinUrl: null
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

  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
    return () => {
      setPageBgColor('bg-white');
    };
  }, [setPageBgColor]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* HERO SECTION - Community-Focused */}
      <section className="text-center mb-20 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-amber-300 to-orange-400 rounded-full opacity-20 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-r from-rose-300 to-pink-400 rounded-full opacity-20 animate-bounce" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
          <div className="absolute bottom-10 left-1/3 w-12 h-12 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-full opacity-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '3s'}}></div>
        </div>
        
        <div className="relative bg-white/90 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-blue-200 shadow-xl">
          <div className="mb-6">
            <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
              👋 Hey there, changemaker!
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="text-slate-800">Built by Community. </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              For Community.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-700 mb-8 max-w-4xl mx-auto leading-relaxed">
            We've been in your shoes—staying up late scrolling through endless grant databases, 
            bookmarking opportunities that disappear, and wondering if there's a better way to connect with funders and fellow change-makers. 
            <span className="font-semibold text-blue-700"> Spoiler alert: there is! ✨</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/grants" className="inline-flex items-center justify-center px-8 py-3.5 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto">
              🔍 Discover Funding & Connect
            </a>
            <a href="/signup" className="inline-flex items-center justify-center px-8 py-3.5 font-semibold rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200/70 transition-colors duration-300 w-full sm:w-auto">
              🤝 Join Our Community
            </a>
          </div>
        </div>
      </section>

      {/* MISSION SECTION - Keep images but update messaging */}
      <StorySection>
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl">
          <motion.div variants={fadeIn} className="text-left">
            <div className="inline-block bg-gradient-to-br from-purple-100 to-blue-100 p-4 rounded-2xl mb-6 border border-purple-200">
              <Bot className="h-10 w-10 text-purple-600" />
            </div>
            
            <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-8">Who We Are</h2>
            
            {/* Updated mission statement */}
            <div className="bg-white p-8 rounded-3xl mb-8 text-slate-900 shadow-xl border border-slate-200">
              <h3 className="text-2xl md:text-3xl font-bold leading-loose">
                Our mission is to <span className="bg-green-200 px-1 py-0.5 rounded mx-1">democratize</span> <span className="bg-purple-200 px-1 py-0.5 rounded mx-1">access</span> to <span className="bg-orange-200 px-1 py-0.5 rounded mx-1">funding</span> — so dreamers can <span className="bg-yellow-200 px-1 py-0.5 rounded mx-1">dream bigger</span> 💭, builders can <span className="bg-pink-200 px-1 py-0.5 rounded mx-1">build faster</span> 🏗️, and <span className="bg-blue-200 px-1 py-0.5 rounded mx-1">momentum</span> is never lost to bureaucracy 🏃‍♂️💨.
              </h3>
            </div>
            
            <div className="text-lg text-slate-600 space-y-6 leading-relaxed">
              <p>We believe that funding should be accessible, not aspirational. This is our foundational promise. The ‘grants’ part of what we do is our commitment to connecting you directly with the capital needed to fuel your work. We provide the platform and the financial tools to open doors that were once closed.</p>
              
              <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-2xl border border-red-100">
                <p className="text-slate-700 font-semibold text-xl mb-2">Our Philosophy: Accessible Capital, Powerful Community

</p>
              </div>
              
              <p>But we also know that the most powerful resource of all is people. A grant can fund a project, but only a community can sustain a movement. That’s why we’ve built more than a database; we’ve cultivated a living ecosystem of Bay Area changemakers. Here, progress is powered by connection. Whether you're building a company, leading a nonprofit, or looking to fund the future, you have a place here. Let's ensure no great idea is ever left behind.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 mb-1">Connect & Discover</h4>
                  <p className="text-sm text-slate-600">Find opportunities and the people behind them</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 mb-1">Collaborate & Build</h4>
                  <p className="text-sm text-slate-600">Spend time creating impact, not hunting alone</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                  <Target className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 mb-1">Celebrate & Amplify</h4>
                  <p className="text-sm text-slate-600">Share wins and learn from each other's journeys</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Expanded image grid to fill the entire mission section */}
          <motion.div 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
            className="grid grid-cols-4 grid-rows-8 gap-3 h-full min-h-[800px]"
          >
            {/* Large hero video - spans 2x3 in top left */}
            <motion.div variants={fadeIn} className="col-span-2 row-span-3 rounded-xl bg-cover bg-center shadow-lg border-2 border-white overflow-hidden">
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
            
            {/* Top right section */}
            <motion.div variants={fadeIn} className="col-span-1 row-span-2 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[1]})`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[2]})`}}></motion.div>
            
            {/* Second row right */}
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[3]})`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[4]})`}}></motion.div>
            
            {/* Third row - below hero video */}
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url(${STATIC_MEDIA.collage[0]})`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg')`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-2 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=1740&auto=format&fit=crop')`}}></motion.div>
            
            {/* Fourth row */}
            <motion.div variants={fadeIn} className="col-span-1 row-span-2 rounded-xl bg-cover bg-center shadow-lg border-2 border-white">   <video
                src="https://videos.pexels.com/video-files/8120416/8120416-hd_1080_1920_25fps.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-xl"
                style={{ minHeight: 0, minWidth: 0 }}
              /></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1740&auto=format&fit=crop')`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-2 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1740&auto=format&fit=crop')`}}></motion.div>
            
            {/* Fifth row */}
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=687&auto=format&fit=crop')`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-2 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white overflow-hidden">
              <video
                src="https://videos.pexels.com/video-files/4808694/4808694-uhd_2560_1440_24fps.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-xl"
                style={{ minHeight: 0, minWidth: 0 }}
              />
            </motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.unsplash.com/photo-1600298881974-6be191ceeda1?q=80&w=1740&auto=format&fit=crop')`}}></motion.div>
            
            {/* Sixth row */}
            <motion.div variants={fadeIn} className="col-span-2 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://plus.unsplash.com/premium_photo-1661544605271-d7da82ccaeb2?q=80&w=1740&auto=format&fit=crop')`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-2 rounded-xl bg-cover bg-center shadow-lg border-2 border-white">             <video
                src="https://videos.pexels.com/video-files/4668117/4668117-uhd_1440_2732_25fps.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-xl"
                style={{ minHeight: 0, minWidth: 0 }}
              /></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg')`}}></motion.div>
            
            {/* Seventh row - Added missing image */}
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg')`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.pexels.com/photos/106052/pexels-photo-106052.jpeg')`}}></motion.div>
            <motion.div variants={fadeIn} className="col-span-1 row-span-1 rounded-xl bg-cover bg-center shadow-lg border-2 border-white" style={{backgroundImage: `url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1740&auto=format&fit=crop')`}}></motion.div>
            
          </motion.div>
        </div>
      </StorySection>

      {/* TEAM SECTION - More Personal */}
      <StorySection>
        <div className="text-center mb-16">
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-slate-800">Meet the </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Dreamers</span>
            <span className="text-slate-800"> Behind the </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Magic</span>
          </motion.h2>
          <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay:0.2}}} className="text-lg text-slate-600 max-w-3xl mx-auto">
            Our advisory board comes from nonprofits, government, and foundations who believe the Bay Area deserves funding infrastructure that brings people together.
          </motion.p>
        </div>
        
        <motion.div 
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full"
        >
          {advisoryBoard.map((member, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
            >
              {/* Fun background decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-50 -translate-y-10 translate-x-10"></div>
              
              <div className="text-center relative">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover border-4 border-amber-100 shadow-lg"
                  />
                  {member.linkedinUrl && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs font-bold">in</span>
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium text-lg mb-4">{member.title}</p>
                
                {member.linkedinUrl ? (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100"
                  >
                    👋 Say hello on LinkedIn
                  </a>
                ) : (
                  <p className="text-slate-500 text-sm bg-slate-50 px-4 py-2 rounded-full inline-block">
                    🎉 Joining the party soon!
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </StorySection>

      {/* BAY AREA SECTION - Keep as is */}
      <StorySection>
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl">
          <motion.div variants={fadeIn}>
            <video
              src={STATIC_MEDIA.map}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-96 md:h-[480px] object-cover rounded-3xl shadow-2xl border-4 border-white"
              alt="San Francisco Bay Area"
            />
          </motion.div>
          <motion.div variants={{...fadeIn, transition: {...fadeIn.transition, delay:0.2}}}>
            <div className="inline-block bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-2xl mb-6 border border-rose-200">
              <Heart className="h-10 w-10 text-rose-600" />
            </div>
            
            <div className="text-lg text-slate-700 space-y-6 leading-relaxed">
              <p>
               We've built our work around a deep commitment to the people and places we call home. We don't just work here—we live here, and we care about our community.
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                <p className="font-semibold text-slate-800 mb-4 text-xl flex items-center">
                  <span className="text-2xl mr-2">🌉</span>
                  All 9 counties, one community:
                </p>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  {[
                    '🌊 Alameda', '🏔️ Contra Costa', '🌲 Marin', '🍇 Napa', 
                    '🏙️ San Francisco', '✈️ San Mateo', '💻 Santa Clara', '🌾 Solano', '🍷 Sonoma'
                  ].map(county => (
                    <div key={county} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                      <span className="font-medium">{county}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <p className="text-blue-700 font-semibold">
                Because when Bay Area changemakers succeed, our entire region thrives. 🌟
              </p>
            </div>
          </motion.div>
        </div>
      </StorySection>

      {/* CALL TO ACTION - Community focused */}
      <StorySection className="bg-gradient-to-br from-sky-200 via-blue-100 to-purple-200 text-slate-800 rounded-3xl shadow-2xl">
        <div className="text-center max-w-4xl px-8">
          <motion.div variants={fadeIn} className="mb-6">
            <span className="text-6xl">🚀</span>
          </motion.div>
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Join Our Community?
          </motion.h2>
          <motion.p variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.2}}} className="text-xl mb-8 opacity-90 leading-relaxed">
            Join Bay Area changemakers, funders, and nonprofit leaders who've discovered that 
            finding funding is so much better when you're not doing it alone. 
            <strong className="text-blue-700"> Come for the grants, stay for the community! 🤝</strong>
          </motion.p>
          
          <motion.div 
            variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.4}}}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="/grants" 
              className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              🔍 Start Connecting Today
            </a>
            <a 
              href="/signup" 
              className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full text-slate-700 bg-white/80 hover:bg-white backdrop-blur-sm border border-slate-200 hover:border-slate-300 transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-xl"
            >
              🎯 Join Free Today
            </a>
          </motion.div>
          
          <motion.p 
            variants={{...fadeIn, transition: {...fadeIn.transition, delay: 0.6}}}
            className="text-sm opacity-70 mt-6 text-slate-600"
          >
            No credit card required. No spam. Just connections, collaboration, and lots of funding opportunities. 📧✨
          </motion.p>
        </div>
      </StorySection>
    </div>
  );
};

export default AboutUsPage;