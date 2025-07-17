import React from 'react';
import { Globe, Building, ClipboardList, Users, Star, TrendingUp } from '../Icons.jsx';

export default function FunderProfileTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Globe },
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'grants', label: 'Active Grants', icon: ClipboardList },
    { id: 'grantees', label: 'Our Grantees', icon: Users },
    { id: 'kudos', label: 'Community Kudos', icon: Star },
    { id: 'impact', label: 'Impact Stories', icon: TrendingUp },
    { id: 'team', label: 'Team', icon: Users }
  ];

  return (
    <div className="sticky top-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}