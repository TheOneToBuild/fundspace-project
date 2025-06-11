// src/RoadmapPage.jsx
import React from 'react';
import { Map, CheckCircle2, Rocket, ClipboardList, BarChart3, Globe } from './components/Icons.jsx';

const roadmapData = [
  {
    phase: 'Phase I',
    title: 'Core Platform & Database',
    description: 'Build a robust, searchable database of Bay Area grants, powered by our AI aggregation engine and community-sourcing model. Launch with powerful filtering and discovery tools.',
    status: 'Complete',
    icon: CheckCircle2,
    color: 'green'
  },
  {
    phase: 'Phase II',
    title: 'Community Hub & User Accounts',
    description: 'Introduce user accounts to save grants and searches. Launch the initial version of our Community Hub with curated resources and a platform for discussion.',
    status: 'Next Up',
    icon: Rocket,
    color: 'blue'
  },
  {
    phase: 'Phase III',
    title: 'Nonprofit Grant Management Suite',
    description: 'Move beyond discovery into management. Build a suite of tools for nonprofits to track application deadlines, assign tasks, and manage their entire grant lifecycle within 1RFP.',
    status: 'Planned',
    icon: ClipboardList,
    color: 'slate'
  },
  {
    phase: 'Phase IV',
    title: 'Funder Analytics & Impact Tracking',
    description: 'Develop a dedicated dashboard for funders to review their application pipeline, track the impact of their grants, and gain insights into the Bay Area funding ecosystem.',
    status: 'Planned',
    icon: BarChart3,
    color: 'slate'
  },
  {
    phase: 'Phase V',
    title: 'Expansion to New Regions',
    description: 'Replicate our successful model and technology to bring the power of 1RFP to new metropolitan areas, empowering nonprofit sectors across the country.',
    status: 'Future',
    icon: Globe,
    color: 'slate'
  }
];

const RoadmapItem = ({ item, isLast }) => {
  const Icon = item.icon;
  const colors = {
    green: { bg: 'bg-green-500', text: 'text-green-600' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600' },
    slate: { bg: 'bg-slate-500', text: 'text-slate-600' }
  };
  const theme = colors[item.color];

  return (
    <div className="relative flex items-start">
      {/* Timeline Line */}
      {!isLast && <div className="absolute left-6 top-6 h-full w-0.5 bg-slate-300"></div>}
      
      {/* Icon */}
      <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${theme.bg}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>

      <div className="ml-6 flex-1">
        <p className={`text-sm font-bold uppercase ${theme.text}`}>{item.phase}: {item.status}</p>
        <h3 className="mt-1 text-xl font-bold text-slate-800">{item.title}</h3>
        <p className="mt-2 text-slate-600">{item.description}</p>
      </div>
    </div>
  );
};

const RoadmapPage = () => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* --- Header --- */}
        <div className="text-center mb-12 md:mb-20">
          <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
            <Map className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Our Platform Roadmap
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            We're building the future of grantseeking. Here's a look at our journey and what's next on the horizon.
          </p>
        </div>

        {/* --- Timeline --- */}
        <div className="max-w-3xl mx-auto">
          <div className="space-y-12">
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