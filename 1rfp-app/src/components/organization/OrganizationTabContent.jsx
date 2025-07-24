// components/organization/OrganizationTabContent.jsx
import React from 'react';
import { 
    MessageSquare, Plus, Users, BarChart3, TrendingUp, 
    ClipboardList, Star 
} from 'lucide-react';
import TeamManagement from './TeamManagement.jsx';

export default function OrganizationTabContent({ 
    activeTab, 
    organization, 
    members, 
    userMembership, 
    profile, 
    onMemberAction, 
    setError 
}) {
    const renderOverviewTab = () => (
        <div className="p-6">
            <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Organization Updates</h3>
                <p className="text-slate-600 mb-6">
                    Share updates, announcements, and engage with your community.
                </p>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                </button>
            </div>
        </div>
    );

    const renderAnalyticsTab = () => (
        <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Total Members</p>
                            <p className="text-2xl font-bold text-slate-900">{members.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Profile Views</p>
                            <p className="text-2xl font-bold text-slate-900">1,234</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Engagement</p>
                            <p className="text-2xl font-bold text-slate-900">+12%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <p className="text-sm text-slate-600">
                    More analytics features will be available soon, including engagement metrics, 
                    post statistics, and member activity tracking.
                </p>
            </div>
        </div>
    );

    const renderTeamTab = () => (
        <TeamManagement 
            members={members}
            userMembership={userMembership}
            profile={profile}
            onMemberAction={onMemberAction}
            setError={setError}
        />
    );

    const renderPlaceholderTab = (title, description, icon) => (
        <div className="p-6">
            <div className="text-center py-12">
                {icon}
                <h2 className="text-lg font-semibold text-slate-800 mb-2">{title}</h2>
                <p className="text-slate-600">{description}</p>
            </div>
        </div>
    );

    // Route to appropriate tab content
    switch (activeTab) {
        case 'overview':
            return renderOverviewTab();
            
        case 'analytics':
            return renderAnalyticsTab();
            
        case 'team':
            return renderTeamTab();
            
        case 'programs':
            return renderPlaceholderTab(
                'Programs & Services',
                'Manage your organization\'s programs and services.',
                <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            );
            
        case 'impact':
            return renderPlaceholderTab(
                'Impact Stories',
                userMembership?.organization_type === 'foundation' 
                    ? 'Showcase the impact of your funding.'
                    : 'Share and manage your organization\'s impact stories.',
                <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            );
            
        case 'supporters':
            return renderPlaceholderTab(
                'Supporters & Donors',
                'Manage relationships with your supporters and donors.',
                <Star className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            );
            
        case 'grants':
            return renderPlaceholderTab(
                'Active Grants',
                'Manage your active grant opportunities.',
                <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            );
            
        case 'grantees':
            return renderPlaceholderTab(
                'Our Grantees',
                'View and manage your current and past grantees.',
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            );
            
        default:
            return renderOverviewTab();
    }
}