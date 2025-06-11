// src/GrantWritingTipsPage.jsx
import React from 'react';
import { Search, FileText, Target, Lightbulb, TrendingUp, Copy, Calculator, CheckCircle2 } from './components/Icons.jsx';

const tipsData = [
  {
    icon: FileText,
    title: 'Read the Guidelines. Twice.',
    description: 'This is the golden rule. Missing a small detail in the Request for Proposal (RFP) is the fastest way to get disqualified. Pay close attention to eligibility, deadlines, formatting, and required attachments. Make a checklist and review it before submitting.'
  },
  {
    icon: Target,
    title: 'Tell a Compelling Story',
    description: 'Funders are people who want to connect with your mission. Beyond the data, tell a powerful story about the problem you\'re solving and the people you serve. Use real-life (anonymized) examples to make your proposal memorable and moving.'
  },
  {
    icon: Lightbulb,
    title: 'The Problem Statement is Everything',
    description: 'Clearly and concisely define the specific community need your project will address. Use data to back up your claims. A funder needs to understand not just what you do, but *why* it is so critically important right now.'
  },
  {
    icon: TrendingUp,
    title: 'Show Your Impact with SMART Goals',
    description: 'Don\'t just say you\'ll "help people." Define how you will measure success. Use goals that are Specific, Measurable, Achievable, Relevant, and Time-bound (SMART). This shows you are thoughtful, strategic, and results-oriented.'
  },
  {
    icon: Copy,
    title: 'Tailor, Don\'t Copy-Paste',
    description: 'Funders can spot a generic, copy-pasted proposal from a mile away. Tailor every proposal to the specific funder. Use their language, reference their mission and past projects, and explicitly state why *your* project aligns with *their* funding priorities.'
  },
  {
    icon: Calculator,
    title: 'Build a Clear & Justified Budget',
    description: 'Your budget tells a story. Every line item should be reasonable and clearly connected to your proposed activities. Be sure to include personnel costs, direct program costs, and a fair percentage for administrative overhead.'
  },
  {
    icon: CheckCircle2,
    title: 'Proofread Like Your Funding Depends On It',
    description: 'Because it does. Typos and grammatical errors signal a lack of attention to detail. Read your proposal out loud. Have a colleague (or two!) review it with fresh eyes before you click submit. A polished proposal shows a polished organization.'
  }
];

const GrantWritingTipsPage = () => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      {/* --- Hero Section --- */}
      {/* UPDATED: Removed bg-white for a consistent background */}
      <div className="text-center py-20 md:py-28 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            From Draft to Done Deal
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            A practical guide to writing grant proposals that get noticed. Here are our top tips for success.
          </p>
        </div>
      </div>

      {/* --- Tips Section --- */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">
            {tipsData.map((tip, index) => (
              <div key={index} className="grid md:grid-cols-[auto,1fr] gap-6 md:gap-8 items-start">
                {/* Number and Icon */}
                <div className="flex items-center md:flex-col md:items-center">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {index + 1}
                  </div>
                </div>
                {/* Content */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <tip.icon className="h-6 w-6 text-blue-500" />
                        <h2 className="text-2xl font-bold text-slate-800">{tip.title}</h2>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CTA Section --- */}
      <div className="text-center py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Ready to Find the Perfect Grant?</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">Your powerful proposal deserves the right audience. Use 1RFP to find funders who align with your unique mission.</p>
          <a href="#" onClick={() => window.location.reload()} className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105">
            Start Searching Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default GrantWritingTipsPage;