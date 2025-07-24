// components/organization/OrganizationTabs.jsx
import React from 'react';
import { 
    Building2, Users, BarChart3, ClipboardList, TrendingUp, Star 
} from 'lucide-react';
import { getTabsForOrganizationType } from '../../utils/organizationPermissions.js';

const IconMap = {
    Building2,
    Users,
    BarChart3,
    ClipboardList,
    TrendingUp,
    Star
};

export default function OrganizationTabs({ 
    activeTab, 
    setActiveTab, 
    userMembership, 
    canViewAnalytics = false,
    isEditing = false 
}) {
    const tabs = getTabsForOrganizationType(
        userMembership?.organization_type, 
        canViewAnalytics
    );

    return (
        <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                    const Icon = IconMap[tab.icon];
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={isEditing}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}