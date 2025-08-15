// components/organization/OrganizationTabContent.jsx
import React from 'react';
import { 
    MessageSquare, Plus, Users, ClipboardList, Star 
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import TeamManagement from './TeamManagement.jsx';
import OrganizationPostsManager from '../organization-profile/OrganizationPostsManager.jsx';

export default function OrganizationTabContent({ 
    activeTab, 
    organization, 
    members, 
    userMembership, 
    profile, 
    onMemberAction, 
    setError 
}) {
    const { session } = useOutletContext();

    const renderOverviewTab = () => (
        <div className="p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Organization Updates</h3>
                <p className="text-sm text-slate-600 mt-1">Share updates, announcements, and engage with your community.</p>
            </div>
            
            <OrganizationPostsManager 
                organization={organization}
                session={session}
                userMembership={userMembership}
                currentUserProfile={profile}
            />
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
            
        case 'our-grantees':
            return renderPlaceholderTab(
                'Our Grantees',
                'View and manage organizations that have received your grants.',
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            );
            
        default:
            return renderPlaceholderTab(
                'Coming Soon',
                'This feature is under development.',
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            );
    }
}