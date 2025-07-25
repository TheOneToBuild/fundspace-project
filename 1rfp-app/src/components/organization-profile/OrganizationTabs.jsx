// src/components/organization-profile/OrganizationTabs.jsx

import React from 'react';
import { 
  Globe, Building, Users, Rocket, TrendingUp, Star, DollarSign, 
  HandHeart, BarChart3, Heart, Award, BookOpen, Microscope, 
  Building2, Flag, Briefcase 
} from 'lucide-react';

const iconMap = {
  Globe, Building, Users, Rocket, TrendingUp, Star, DollarSign,
  HandHeart, BarChart3, Heart, Award, BookOpen, Microscope,
  Building2, Flag, Briefcase
};

const OrganizationTabs = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div className="sticky top-0 bg-white border-b border-slate-200 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = iconMap[tab.icon] || Building;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default OrganizationTabs;