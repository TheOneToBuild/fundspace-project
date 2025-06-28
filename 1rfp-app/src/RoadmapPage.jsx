// src/RoadmapPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Map, CheckCircle2, Rocket, Users, Bot, BarChart3, Globe } from './components/Icons.jsx';

const STATIC_MEDIA = {
    shapes: [
        'https://picsum.photos/seed/roadmap-shape-1/400/400',
        'https://picsum.photos/seed/roadmap-shape-2/400/400',
        'https://picsum.photos/seed/roadmap-shape-3/400/400',
    ]
};

const roadmapData = [
  {
    phase: 'Phase I: Foundation',
    title: 'Core Platform & Grant Database',
    description: 'Launch the 1RFP platform with a robust, searchable database of Bay Area grants. This includes our AI aggregation engine, community-sourcing model, and powerful search and filtering tools.',
    status: 'Complete',
    icon: CheckCircle2,
    color: 'green'
  },
  {
    phase: 'Phase II: Personalization',
    title: 'User Accounts & Grant Tracking',
    description: 'Introduce free user accounts for nonprofits, enabling features like a personalized dashboard to save and track grant opportunities, manage deadlines, and receive alerts for saved searches.',
    status: 'Next Up',
    icon: Rocket,
    color: 'blue'
  },
  {
    phase: 'Phase III: Advanced Nonprofit Suite',
    title: 'AI-Powered Grantseeking Tools',
    description: 'Develop a suite of advanced tools to give nonprofits a competitive edge. This includes an AI Proposal Assistant, an AI Eligibility Verifier to match nonprofits with the right grants, and in-depth Funder Trend Analysis.',
    status: 'Planned',
    icon: Bot,
    color: 'slate'
  },
  {
    phase: 'Phase IV: Premium Funder Suite',
    title: 'Analytics & Pipeline Management',
    description: 'Build a dedicated dashboard for funders to review their application pipeline, track the impact of their grants, receive anonymous applicant feedback, and gain insights into the Bay Area funding ecosystem.',
    status: 'Planned',
    icon: BarChart3,
    color: 'slate'
  },
  {
    phase: 'Phase V: Community & Collaboration',
    title: 'Deepening Bay Area Connections',
    description: 'Launch the 1RFP Community Hub, featuring forums for discussion, a directory for finding nonprofit collaborators, and resources for local workshops and events to foster a more connected social sector.',
    status: 'Planned',
    icon: Users,
    color: 'slate'
  },
  {
    phase: 'Phase VI: National Expansion',
    title: 'Scaling the Model',
    description: 'Replicate our successful model and technology to bring the power of 1RFP to new metropolitan areas, empowering nonprofit sectors across the country.',
    status: 'Future',
    icon: Globe,
    color: 'slate'
  }
];

const AnimatedShape = ({ className, imageUrl }) => (
    <motion.div
        className={`absolute hidden md:block z-0 rounded-full bg-center bg-cover ${className}`}
        style={{ backgroundImage: `url(${imageUrl})` }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        whileHover={{ scale: 1.1, opacity: 0.2 }}
    />
);

const RoadmapItem = ({ item, isLast }) => {
  const Icon = item.icon;
  const colors = {
    green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-100' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100' },
    slate: { bg: 'bg-slate-500', text: 'text-slate-600', border: 'border-slate-100' }
  };
  const theme = colors[item.color];

  return (
    <motion.div 
      className="relative flex items-start group"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
    >
      {!isLast && <div className="absolute left-6 top-6 h-full w-0.5 bg-gradient-to-b from-blue-200 to-purple-200"></div>}
      
      <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${theme.bg} shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>

      <div className="ml-8 flex-1 rounded-lg p-6 bg-white/50 group-hover:bg-white transition-colors duration-300 border border-transparent group-hover:border-slate-200 group-hover:shadow-xl">
        <p className={`text-sm font-bold uppercase tracking-wider ${theme.text}`}>{item.phase}: {item.status}</p>
        <h3 className="mt-1 text-xl font-bold text-slate-800">{item.title}</h3>
        <p className="mt-2 text-slate-600 font-sans">{item.description}</p>
      </div>
    </motion.div>
  );
};

const RoadmapPage = () => {
  return (
    <div className="relative bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 py-16 md:py-24 overflow-hidden">
      <AnimatedShape className="w-64 h-64 top-1/4 left-10" imageUrl={STATIC_MEDIA.shapes[0]} />
      <AnimatedShape className="w-80 h-80 top-1/2 right-[-100px]" imageUrl={STATIC_MEDIA.shapes[1]} />
      <AnimatedShape className="w-48 h-48 bottom-1/4 left-[-50px]" imageUrl={STATIC_MEDIA.shapes[2]} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="inline-block bg-blue-100 p-3 rounded-full mb-4"
          >
            <Map className="h-8 w-8 text-blue-600" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4"
          >
            Our Platform Roadmap
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-sans"
          >
            We're building the future of grantseeking. Here's a look at our journey and what's next on the horizon.
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            {roadmapData.map((item, index) => (
              <RoadmapItem key={item.phase} item={item} isLast={index === roadmapData.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;