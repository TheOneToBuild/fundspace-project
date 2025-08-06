// components/organization/OrganizationTabContent.jsx
import React from 'react';
import { 
    MessageSquare, Plus, Users, ClipboardList, Star 
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

    const renderTeamTab = () => (
        <TeamManagement 
            members={members}
            userMembership={userMembership}
            profile={profile}
            onMemberAction={onMemberAction}
            setError={setError}
            organization={organization}
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
            
        case 'team':
            return renderTeamTab();
            
        case 'programs':
            return renderPlaceholderTab(
                'Programs & Services',
                'Manage your organization\'s programs and services.',
                <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
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