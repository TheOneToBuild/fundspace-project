// src/components/DashboardFeed.jsx
import React, { useState } from 'react';
import GrantsPageContent from '../GrantsPageContent.jsx';
import ExploreFunders from '../ExploreFunders.jsx';
import ExploreNonprofits from '../ExploreNonprofits.jsx';

const TABS = [
  { name: 'Explore Grants', component: GrantsPageContent },
  { name: 'Explore Funders', component: ExploreFunders },
  { name: 'Explore Nonprofits', component: ExploreNonprofits },
];

const WelcomeHeader = ({ profile }) => {
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
      <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 rounded-xl shadow-sm border border-slate-200/80 mb-8">
        <div className="flex items-center">
            <span className="text-4xl mr-4" role="img" aria-label="Waving hand">👋</span>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Hi {firstName},</h2>
                <p className="text-slate-500 mt-1">Happy {dateString}</p>
            </div>
        </div>
      </div>
    );
};

export default function DashboardFeed({ profile }) {
    const [activeTab, setActiveTab] = useState(TABS[0].name);

    const ActiveComponent = TABS.find(tab => tab.name === activeTab)?.component;

    return (
        <div className="space-y-6">
            <WelcomeHeader profile={profile} />
            
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.name
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                            aria-current={activeTab === tab.name ? 'page' : undefined}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4">
                {/* We render the chosen page component, passing the 'dashboard' context */}
                {ActiveComponent ? <ActiveComponent context="dashboard" /> : null}
            </div>
        </div>
    );
}