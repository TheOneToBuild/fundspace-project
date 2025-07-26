// src/RoadmapPage.jsx
import React, { useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Map, CheckCircle2, Rocket, Users, Bot, BarChart3, Globe, Sparkles, ArrowRight, Search, Target } from './components/Icons.jsx';
import { LayoutContext } from './App.jsx';

const roadmapData = [
  {
    phase: 'Phase I: Foundation',
    title: 'Core Platform & Grant Database',
    description: 'Launch the 1RFP platform with a robust, searchable database of Bay Area grants. This includes our AI aggregation engine, community-sourcing model, and powerful search and filtering tools.',
    status: 'Complete',
    icon: CheckCircle2,
    color: 'green',
    features: ['Grant database', 'Search & filters', 'AI data aggregation', 'Community submissions']
  },
  {
    phase: 'Phase II: Personalization',
    title: 'User Accounts & Grant Tracking',
    description: 'Introduce free user accounts for nonprofits, enabling features like a personalized dashboard to save and track grant opportunities, manage deadlines, and receive alerts for saved searches.',
    status: 'Next Up',
    icon: Rocket,
    color: 'blue',
    features: ['User accounts', 'Grant tracking', 'Deadline management', 'Search alerts']
  },
  {
    phase: 'Phase III: Advanced Nonprofit Suite',
    title: 'AI-Powered Grantseeking Tools',
    description: 'Develop a suite of advanced tools to give nonprofits a competitive edge. This includes an AI Proposal Assistant, an AI Eligibility Verifier to match nonprofits with the right grants, and in-depth Funder Trend Analysis.',
    status: 'Planned',
    icon: Bot,
    color: 'purple',
    features: ['AI Proposal Assistant', 'Eligibility matching', 'Funder analytics', 'Smart recommendations']
  },
  {
    phase: 'Phase IV: Premium Funder Suite',
    title: 'Analytics & Pipeline Management',
    description: 'Build a dedicated dashboard for funders to review their application pipeline, track the impact of their grants, receive anonymous applicant feedback, and gain insights into the Bay Area funding ecosystem.',
    status: 'Planned',
    icon: BarChart3,
    color: 'emerald',
    features: ['Funder dashboard', 'Pipeline tracking', 'Impact analytics', 'Applicant feedback']
  },
  {
    phase: 'Phase V: Community & Collaboration',
    title: 'Deepening Bay Area Connections',
    description: 'Launch the 1RFP Community Hub, featuring forums for discussion, a directory for finding nonprofit collaborators, and resources for local workshops and events to foster a more connected social sector.',
    status: 'Planned',
    icon: Users,
    color: 'orange',
    features: ['Community forums', 'Collaboration directory', 'Event calendar', 'Resource library']
  },
  {
    phase: 'Phase VI: National Expansion',
    title: 'Scaling the Model',
    description: 'Replicate our successful model and technology to bring the power of 1RFP to new metropolitan areas, empowering nonprofit sectors across the country.',
    status: 'Future',
    icon: Globe,
    color: 'slate',
    features: ['Multi-region support', 'Scaled infrastructure', 'Regional customization', 'National network']
  }
];

const RoadmapItem = ({ item, index, isLast }) => {
  const Icon = item.icon;
  
  const colorConfig = {
    green: {
      bg: 'from-green-500 to-emerald-500',
      card: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800'
    },
    blue: {
      bg: 'from-blue-500 to-indigo-500',
      card: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    purple: {
      bg: 'from-purple-500 to-pink-500',
      card: 'from-purple-50 to-pink-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800'
    },
    emerald: {
      bg: 'from-emerald-500 to-teal-500',
      card: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800'
    },
    orange: {
      bg: 'from-orange-500 to-amber-500',
      card: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800'
    },
    slate: {
      bg: 'from-slate-500 to-gray-500',
      card: 'from-slate-50 to-gray-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      badge: 'bg-slate-100 text-slate-800'
    }
  };

  const theme = colorConfig[item.color];

  const statusConfig = {
    'Complete': { label: '✅ Complete', color: 'bg-green-100 text-green-800' },
    'Next Up': { label: '🚀 Next Up', color: 'bg-blue-100 text-blue-800' },
    'Planned': { label: '📋 Planned', color: 'bg-purple-100 text-purple-800' },
    'Future': { label: '🔮 Future', color: 'bg-slate-100 text-slate-800' }
  };

  return (
    <motion.div 
      className="relative flex items-start group"
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      {/* Connecting Line */}
      {!isLast && (
        <div className="absolute left-8 top-16 h-24 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300 z-0"></div>
      )}
      
      {/* Icon Circle */}
      <motion.div 
        className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${theme.bg} shadow-xl border-4 border-white`}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Icon className="h-8 w-8 text-white" />
      </motion.div>

      {/* Content Card */}
      <motion.div 
        className={`ml-6 flex-1 bg-gradient-to-br ${theme.card} backdrop-blur-sm p-6 md:p-8 rounded-3xl border ${theme.border} shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105`}
        whileHover={{ y: -5 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[item.status].color}`}>
              {statusConfig[item.status].label}
            </span>
            <p className={`text-sm font-bold uppercase tracking-wider mt-2 ${theme.text}`}>
              {item.phase}
            </p>
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">
          {item.title}
        </h3>
        
        <p className="text-slate-600 leading-relaxed mb-6">
          {item.description}
        </p>

        {/* Feature List */}
        <div className="grid grid-cols-2 gap-2">
          {item.features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${theme.bg}`}></div>
              <span className="text-slate-600 font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const RoadmapPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);

  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50');
    return () => {
      setPageBgColor('bg-white');
    };
  }, [setPageBgColor]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* HERO SECTION */}
      <section className="text-center mb-16 relative">
        {/* Magical background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/60 shadow-2xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center border border-indigo-200 shadow-lg"
          >
            <Map className="h-10 w-10 text-indigo-600" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4"
          >
            <span className="text-slate-900">Our </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Roadmap
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="text-lg md:text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            We're building the future of grant discovery for Bay Area nonprofits. Here's our journey from a simple database to an intelligent ecosystem that empowers social impact.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> Every phase brings us closer to our vision.</span>
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="/grants" className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-full text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Search className="mr-2" size={18} />
              Try Current Platform
            </a>
            <a href="/contact" className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-full text-purple-700 bg-purple-100 hover:bg-purple-200/70 transition-colors duration-300">
              <Target className="mr-2" size={18} />
              Share Feedback
            </a>
          </motion.div>
        </div>
      </section>

      {/* ROADMAP TIMELINE */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="space-y-12">
          {roadmapData.map((item, index) => (
            <RoadmapItem 
              key={item.phase} 
              item={item} 
              index={index}
              isLast={index === roadmapData.length - 1} 
            />
          ))}
        </div>
      </section>

      {/* BOTTOM CTA SECTION */}
      <section className="mt-20">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-2xl max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Us on This Journey
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            1RFP is more than a platform—it's a movement to make social impact more accessible and effective. Your feedback helps shape our roadmap and ensures we're building what the community needs.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <Search className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Explore Now</h3>
              <p className="text-sm opacity-80 mb-4">Try our current platform and discover grants in your area.</p>
              <a 
                href="/grants" 
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
              >
                Browse Grants
              </a>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <Target className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Share Feedback</h3>
              <p className="text-sm opacity-80 mb-4">Help us prioritize features that matter most to you.</p>
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
              >
                Contact Us
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <Users className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Build Community</h3>
              <p className="text-sm opacity-80 mb-4">Submit grants and help grow our comprehensive database.</p>
              <a 
                href="/submit-grant" 
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
              >
                Submit Grant
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RoadmapPage;