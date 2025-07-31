// src/components/organization-profile/OrganizationTabs.jsx - Updated for template design

import React from 'react';
import { 
  Globe, Building, Users, Rocket, TrendingUp, Star, DollarSign, 
  HandHeart, BarChart3, Heart, Award, BookOpen, Microscope, 
  Building2, Flag, Briefcase, Target, Camera
} from 'lucide-react';

const iconMap = {
  Globe, Building, Users, Rocket, TrendingUp, Star, DollarSign,
  HandHeart, BarChart3, Heart, Award, BookOpen, Microscope,
  Building2, Flag, Briefcase, Target, Camera
};

const OrganizationTabs = ({ activeTab, setActiveTab, tabs, config = {} }) => {
  const getTabGradient = (isActive) => {
    if (!isActive) return '';
    
    const gradient = config.primaryGradient || 'from-blue-500 to-indigo-600';
    return `bg-gradient-to-r ${gradient} text-white shadow-lg`;
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <div className="flex items-center gap-2 mb-8 p-2 bg-slate-100 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => {
          const IconComponent = iconMap[tab.icon] || Building;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-bold transition-all duration-300 whitespace-nowrap rounded-xl flex items-center gap-2 ${
                isActive 
                  ? getTabGradient(true)
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <IconComponent size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrganizationTabs;