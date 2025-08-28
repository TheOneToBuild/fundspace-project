// src/RoadmapPage.jsx

import React, { useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Map, CheckCircle2, Rocket, Users, Bot, BarChart3, Globe, Sparkles, ArrowRight, Search, Target, Layers, Filter, FileText } from './components/Icons.jsx';
import { LayoutContext } from './App.jsx';

const fade = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.75 } } };
const Section = ({ children, className = 'py-28 md:py-40' }) => (
  <motion.section
    className={`relative w-full ${className}`}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ staggerChildren: 0.18 }}
  >{children}</motion.section>
);
const Pill = ({ children, color='blue' }) => {
  const map = { blue:'bg-blue-100 text-blue-700', emerald:'bg-emerald-100 text-emerald-700', violet:'bg-violet-100 text-violet-700', rose:'bg-rose-100 text-rose-700', slate:'bg-slate-100 text-slate-700', orange:'bg-orange-100 text-orange-700', indigo:'bg-indigo-100 text-indigo-700' };
  return <span className={`inline-flex items-center uppercase tracking-wide text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-sm ${map[color]}`}>{children}</span>;
};

const ROADMAP_PHASES = [
  {
    icon: CheckCircle2,
    color: 'from-green-500 to-emerald-500',
    label: 'Foundation',
    status: 'Complete',
    title: 'Unified Grant Index',
    text: 'Launched a robust, AI-powered database of Bay Area grants, with community submissions and smart filters to surface the right opportunities.',
    features: ['Grant database', 'AI aggregation', 'Community sourcing', 'Powerful search']
  },
  {
    icon: Rocket,
    color: 'from-blue-500 to-indigo-500',
    label: 'Personalization',
    status: 'Next',
    title: 'Personal Dashboards',
    text: 'Personalized dashboards for nonprofits to save, track, and manage grantswith deadline radar, alerts, and collaborative review.',
    features: ['User accounts', 'Grant tracking', 'Deadline radar', 'Search alerts']
  },
  {
    icon: Bot,
    color: 'from-purple-500 to-pink-500',
    label: 'AI Suite',
    status: 'Planned',
    title: 'AI Grantseeker Tools',
    text: 'AI Proposal Assistant, eligibility matching, and funder analytics to help nonprofits focus on what matters most.',
    features: ['AI Proposal Assist', 'Eligibility matching', 'Funder analytics', 'Smart recommendations']
  },
  {
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-500',
    label: 'Funder Suite',
    status: 'Planned',
    title: 'Funder Analytics & Pipeline',
    text: 'Dedicated dashboards for funders to track applications, impact, and feedbackbuilding a more transparent ecosystem.',
    features: ['Funder dashboard', 'Pipeline tracking', 'Impact analytics', 'Applicant feedback']
  },
  {
    icon: Users,
    color: 'from-orange-500 to-amber-500',
    label: 'Community',
    status: 'Planned',
    title: 'Collaboration Hub',
    text: 'Forums, directories, and events to foster collaboration and knowledge sharing across the Bay Area social sector.',
    features: ['Community forums', 'Collaboration directory', 'Event calendar', 'Resource library']
  },
  {
    icon: Globe,
    color: 'from-slate-500 to-gray-500',
    label: 'Expansion',
    status: 'Future',
    title: 'National Rollout',
    text: 'Scaling the Fundspace model to new regions, empowering more changemakers with the tools to unlock capital and impact.',
    features: ['Multi-region support', 'Scaled infrastructure', 'Regional customization', 'National network']
  }
];

const PHASE_BG = [
  'from-green-50 to-emerald-100',
  'from-blue-50 to-indigo-100',
  'from-purple-50 to-pink-100',
  'from-emerald-50 to-teal-100',
  'from-orange-50 to-amber-100',
  'from-slate-50 to-gray-100',
];

const PHASE_BORDER = [
  'border-green-200',
  'border-blue-200',
  'border-purple-200',
  'border-emerald-200',
  'border-orange-200',
  'border-slate-200',
];

const PHASE_TEXT = [
  'text-green-700',
  'text-blue-700',
  'text-purple-700',
  'text-emerald-700',
  'text-orange-700',
  'text-slate-700',
];

const RoadmapPhase = ({ phase, idx, isLast }) => {
  const Icon = phase.icon;
  const bg = PHASE_BG[idx % PHASE_BG.length];
  const border = PHASE_BORDER[idx % PHASE_BORDER.length];
  const text = PHASE_TEXT[idx % PHASE_TEXT.length];
  return (
    <motion.div
      variants={fade}
      className="relative flex items-start group"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-8 top-16 h-24 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300 z-0" />
      )}
      {/* Icon */}
      <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${phase.color} shadow-xl border-4 border-white`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      {/* Card */}
      <div className={`ml-6 flex-1 bg-gradient-to-br ${bg} backdrop-blur-sm p-6 md:p-8 rounded-3xl border ${border} shadow-xl group-hover:scale-105 transition-all duration-300`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 ${text}`}>
              {phase.label}
            </span>
            <p className={`text-sm font-bold uppercase tracking-wider mt-2 ${text}`}>
              {phase.status}
            </p>
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">{phase.title}</h3>
        <p className="text-slate-600 leading-relaxed mb-6">{phase.text}</p>
        <div className="grid grid-cols-2 gap-2">
          {phase.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${phase.color}`}></div>
              <span className={text + ' font-medium'}>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const FEATURE_CLUSTERS = [
  {
    icon: Layers,
    color: 'from-emerald-500 to-teal-600',
    title: 'Unified Grant Index',
    text: 'Continuously refreshed Bay Area grant & capital listings with semantic tagging and focus area taxonomy.'
  },
  {
    icon: Filter,
    color: 'from-indigo-500 to-violet-600',
    title: 'Smart Matching',
    text: 'Relevance scoring learns from your profile & community wins to highlight high-probability opportunities.'
  },
  {
    icon: FileText,
    color: 'from-orange-500 to-amber-600',
    title: 'Reusable Asset Library',
    text: 'Store core narratives, budgets, logic models, and adapt quickly with AI-assisted versioning.'
  },
  {
    icon: BarChart3,
    color: 'from-sky-500 to-indigo-600',
    title: 'Impact Story Engine',
    text: 'Convert KPIs & outcomes into funder-ready visuals and renewal narratives.'
  },
  {
    icon: Bot,
    color: 'from-purple-500 to-fuchsia-600',
    title: 'AI Proposal Assist',
    text: 'Draft sections, refine tone, and tailor language to funder priorities while retaining authenticity.'
  },
  {
    icon: Users,
    color: 'from-sky-500 to-cyan-600',
    title: 'Peer Intelligence',
    text: 'See anonymized patterns & connect with past awardees open to collaborative feedback.'
  }
];

const FeatureCard = ({ icon: Icon, color, title, text }) => (
  <motion.div variants={fade} className="group relative rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 p-8 flex flex-col gap-5 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
    <div className={`absolute -top-20 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${color}`} />
    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color} text-white shadow-lg`}>
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 leading-snug">{title}</h3>
    <p className="text-slate-600 text-sm leading-relaxed flex-1">{text}</p>
  </motion.div>
);

const RoadmapPage = () => {
  const { setPageBgColor } = useContext(LayoutContext);
  useEffect(() => {
    setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
    return () => setPageBgColor('bg-white');
  }, [setPageBgColor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* HERO */}
      <Section className="pt-32 md:pt-40 pb-32 bg-[#f9f6f4] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-32 w-[520px] h-[520px] bg-gradient-to-tr from-blue-300 via-indigo-300 to-violet-300 blur-3xl opacity-25" />
          <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-gradient-to-tr from-emerald-300 via-teal-300 to-sky-300 blur-3xl opacity-25" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-8 bg-white rounded-3xl flex items-center justify-center border border-blue-200 shadow-lg">
            <Map className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-slate-900">The Fundspace </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">Roadmap</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            From a simple index to a connected ecosystemhere's how we're building the future of funding for Bay Area changemakers. Every phase is shaped by your feedback and our shared mission.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/grants" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">Browse Grants <Search className="ml-2 h-5 w-5" /></a>
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">Share Feedback <ArrowRight className="ml-2 h-5 w-5" /></a>
          </div>
        </div>
      </Section>

      {/* TIMELINE */}
      <Section className="bg-white pt-24 pb-32 md:pt-36 md:pb-40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <Pill color="slate">THE JOURNEY</Pill>
            <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">From Index to Ecosystem</h2>
            <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">Each phase unlocks new ways for organizations and funders to connect, collaborate, and scale impact.</p>
          </div>
          <div className="space-y-14">
            {ROADMAP_PHASES.map((phase, i) => (
              <RoadmapPhase key={phase.label} phase={phase} idx={i} isLast={i === ROADMAP_PHASES.length - 1} />
            ))}
          </div>
        </div>
      </Section>

      {/* FEATURE CLUSTERS */}
      <Section className="bg-[#f9f6f4] pt-24 pb-32 md:pt-36 md:pb-40">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
          <Pill color="blue">CORE FEATURES</Pill>
          <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">What Powers Fundspace</h2>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">Replace tabs and spreadsheets with an integrated suite purpose-built for community organizations.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_CLUSTERS.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} color={f.color} title={f.title} text={f.text} />
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 py-32 md:py-44 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -left-24 w-[420px] h-[420px] bg-gradient-to-tr from-blue-200 via-indigo-200 to-violet-200 blur-3xl opacity-35" />
          <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-gradient-to-tr from-emerald-200 via-teal-200 to-sky-200 blur-3xl opacity-40" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-10 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-lg">
            <Sparkles className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-[1.05]">Help Shape the Future of Funding</h2>
          <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-12">Fundspace is built with and for the community. Your feedback, ideas, and partnership help us unlock new possibilities for every changemaker.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">Share Your Ideas <ArrowRight className="ml-2 h-5 w-5" /></a>
            <a href="/grants" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">Browse Grants <Search className="ml-2 h-5 w-5" /></a>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default RoadmapPage;