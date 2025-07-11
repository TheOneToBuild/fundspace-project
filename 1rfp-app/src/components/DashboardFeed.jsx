// src/components/DashboardFeed.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import WelcomeHeader from './WelcomeHeader.jsx';
import CreatePost from './CreatePost.jsx';
import GrantsPageContent from '../GrantsPageContent.jsx';
import ExploreFunders from '../ExploreFunders.jsx';
import ExploreNonprofits from '../ExploreNonprofits.jsx';

const TABS = [
  { name: 'Explore Grants', component: GrantsPageContent },
  { name: 'Explore Funders', component: ExploreFunders },
  { name: 'Explore Nonprofits', component: ExploreNonprofits },
];

export default function DashboardFeed() {
    const { profile } = useOutletContext(); // Get profile from parent layout
    const [activeTab, setActiveTab] = useState(TABS[0].name);

    const ActiveComponent = TABS.find(tab => tab.name === activeTab)?.component;

    return (
        <div className="space-y-6">
            <WelcomeHeader profile={profile} />
            
            {/* Explicitly set CreatePost to hello-world channel */}
            <CreatePost 
                profile={profile} 
                channel="hello-world"
            />
            
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