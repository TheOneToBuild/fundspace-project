// src/FaqPage.jsx

import React, { useEffect, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle, Users, Shield, Search, MessageSquare, Sparkles, ArrowRight, CheckCircle2, BarChart3, Target, Layers, Filter, FileText, Bot
} from './components/Icons.jsx';
import { LayoutContext } from './App.jsx';

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } };
const Section = ({ children, className = 'py-24 md:py-36' }) => (
  <motion.section
    className={`relative w-full ${className}`}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ staggerChildren: 0.18 }}
  >{children}</motion.section>
);

const FaqCard = ({ icon: Icon, question, answer, color }) => (
  <motion.div variants={fade} className="group relative rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 p-8 flex flex-col gap-5 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
    <div className={`absolute -top-20 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${color}`} />
    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color} text-white shadow-lg`}>
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 leading-snug">{question}</h3>
    <p className="text-slate-600 text-base leading-relaxed flex-1">{answer}</p>
  </motion.div>
);

const FAQS = [
  {
    icon: HelpCircle,
    color: 'from-blue-500 via-indigo-500 to-violet-500',
    question: 'What is Fundspace?',
    answer: 'Fundspace is a modern platform connecting Bay Area nonprofits and funders. We centralize grant discovery, streamline readiness, and help you move from scattered opportunities to a strategic funding engine.'
  },
  {
    icon: Users,
    color: 'from-emerald-500 via-teal-500 to-cyan-500',
    question: 'Who can use Fundspace?',
    answer: 'Any nonprofit, funder, or community builder in the Bay Area. Our core tools are free for 501(c)(3) organizations. Funders and partners can access advanced analytics and collaboration features.'
  },
  {
    icon: Shield,
    color: 'from-purple-500 via-fuchsia-500 to-pink-600',
    question: 'Is Fundspace really free for nonprofits?',
    answer: 'Yes. Discovery, search, and core readiness tools are free for Bay Area nonprofits. We believe access to opportunity should never be paywalled.'
  },
  {
    icon: Search,
    color: 'from-blue-500 to-indigo-600',
    question: 'How does grant discovery work?',
    answer: 'Our AI-powered engine and community submissions keep our database fresh. Smart filters and relevance scores help you find the best-fit opportunities in minutes.'
  },
  {
    icon: FileText,
    color: 'from-orange-500 to-amber-600',
    question: 'Can I track and manage my applications?',
    answer: 'Yes! Our dashboard lets you save grants, track deadlines, and manage your pipeline. Reusable asset libraries and reminders help you stay on top of every cycle.'
  },
  {
    icon: BarChart3,
    color: 'from-sky-500 via-blue-500 to-indigo-500',
    question: 'How do you keep data accurate?',
    answer: 'We combine automated scans of public sources with community-powered updates. See something missing? Submit a grant or suggest an edit—our team reviews every update.'
  },
  {
    icon: Target,
    color: 'from-emerald-500 to-teal-600',
    question: 'How do I get my organization or Fundspace listed?',
    answer: 'Nonprofit and funder profiles are generated from public data. To update or add a listing, use our Contact or Submit Grant forms. We’re building self-serve tools for direct management soon.'
  },
  {
    icon: Bot,
    color: 'from-purple-500 to-fuchsia-600',
    question: 'What’s coming next?',
    answer: 'We’re building AI proposal assist, advanced analytics, and new collaboration spaces. Check our Roadmap for upcoming features and let us know what you want to see!'
  }
];

const WORKFLOW = [
  {
    icon: Search,
    color: 'from-blue-500 to-indigo-600',
    title: 'Find Aligned Grants',
    text: 'Smart discovery surfaces the best-fit opportunities for your mission, focus area, and geography.'
  },
  {
    icon: Layers,
    color: 'from-emerald-500 to-teal-600',
    title: 'Build Reusable Assets',
    text: 'Centralize your narratives, budgets, and logic models—ready to adapt for every cycle.'
  },
  {
    icon: Filter,
    color: 'from-indigo-500 to-violet-600',
    title: 'Match & Track',
    text: 'Use filters, relevance scores, and a personal dashboard to manage your pipeline and deadlines.'
  },
  {
    icon: BarChart3,
    color: 'from-sky-500 to-indigo-600',
    title: 'Showcase Impact',
    text: 'Turn outcomes into visuals and stories that strengthen renewals and attract new partners.'
  }
];

const FaqPage = () => {
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
            <HelpCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-slate-900">Fundspace FAQ</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about using Fundspace to unlock capital, build capacity, and scale your impact. Can’t find your answer? <a href="/contact" className="text-blue-600 font-semibold hover:underline">Contact us</a>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/grants" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">Browse Grants <Search className="ml-2 h-5 w-5" /></a>
            <a href="/login?view=signup" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">Create Free Account <ArrowRight className="ml-2 h-5 w-5" /></a>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS / WORKFLOW */}
      <Section className="bg-white pt-24 pb-32 md:pt-36 md:pb-40">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
          <span className="inline-flex items-center uppercase tracking-wide text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-sm bg-blue-100 text-blue-700">HOW FUNDSPACE WORKS</span>
          <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">From Discovery to Impact</h2>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">A connected workflow that takes you from your first search to a resilient, multi-year funding engine.</p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {WORKFLOW.map((step, i) => (
            <FaqCard key={i} icon={step.icon} color={step.color} question={step.title} answer={step.text} />
          ))}
        </div>
      </Section>

      {/* FAQ CARDS */}
      <Section className="bg-[#f9f6f4] pt-24 pb-32 md:pt-36 md:pb-40">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center mb-16">
          <span className="inline-flex items-center uppercase tracking-wide text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-sm bg-purple-100 text-purple-700">FREQUENTLY ASKED</span>
          <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Your Questions, Answered</h2>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {FAQS.map((faq, i) => (
            <FaqCard key={i} icon={faq.icon} color={faq.color} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 py-32 md:py-44 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -left-24 w-[420px] h-[420px] bg-gradient-to-tr from-blue-200 via-indigo-200 to-violet-200 blur-3xl opacity-35" />
          <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-gradient-to-tr from-emerald-200 via-teal-200 to-sky-200 blur-3xl opacity-40" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-10 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-lg">
            <Sparkles className="h-10 w-10 text-indigo-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-[1.05]">Still Have Questions?</h2>
          <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-12">Our team is here to help. Whether you’re a nonprofit looking for funding or a funder wanting to maximize your impact, we’d love to connect.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">Contact Us <MessageSquare className="ml-2 h-5 w-5" /></a>
            <a href="/submit-grant" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all">Submit a Grant <CheckCircle2 className="ml-2 h-5 w-5" /></a>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default FaqPage;