// src/components/MyOrganizationPage.jsx - Updated with proper edit profile link
import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AlertTriangle, Crown, ExternalLink } from 'lucide-react';
import StreamlinedOrganizationSetupPage from './OrganizationSetupPage.jsx';
import OrganizationHeader from './organization/OrganizationHeader.jsx';
import OrganizationTabs from './organization/OrganizationTabs.jsx';
import OrganizationTabContent from './organization/OrganizationTabContent.jsx';
import LeaveOrganizationModal from './organization/LeaveOrganizationModal.jsx';
import DeleteOrganizationModal from './organization/DeleteOrganizationModal.jsx';
import { useOrganizationData } from '../hooks/useOrganizationData.js';
import { hasPermission, PERMISSIONS } from '../utils/organizationPermissions.js';

export default function MyOrganizationPage() {
    const { profile, session } = useOutletContext();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    
    const {
        organization,
        members,
        userMembership,
        loading,
        error,
        setError,
        checkMembership,
        fetchOrganizationData,
        executeLeave,
        executeDeleteOrganization,
        updateOrganization
    } = useOrganizationData(profile, session);

    const isOmegaAdmin = profile?.is_omega_admin === true;
    const userRole = userMembership?.role;
    const canViewAnalytics = ['super_admin', 'admin'].includes(userRole) || isOmegaAdmin;
    const canEditOrg = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);

    // Handle edit public profile navigation
    const handleEditPublicProfile = () => {
        if (organization?.slug) {
            // Navigate to the public profile page in edit mode
            navigate(`/organizations/${organization.slug}?edit=true`);
        } else {
            setError('Organization slug not found. Please contact support.');
        }
    };

    // Handle view public profile navigation
    const handleViewPublicProfile = () => {
        if (organization?.slug) {
            // Open in new tab
            window.open(`/organizations/${organization.slug}`, '_blank');
        } else {
            setError('Organization slug not found. Please contact support.');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-500">Loading organization details...</span>
            </div>
        );
    }

    // Omega admin interface
    if (isOmegaAdmin) {
        return (
            <div className="text-center py-12">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Omega Admin Access</h2>
                <p className="text-slate-600">As an Omega Admin, you have access to all organizations on the platform.</p>
            </div>
        );
    }

    // No membership - show setup page
    if (!userMembership) {
        return <StreamlinedOrganizationSetupPage onJoinSuccess={checkMembership} />;
    }
    
    // No organization found
    if (!organization) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Organization Not Found</h2>
                <p className="text-slate-600">The organization associated with your membership could not be found.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {/* Organization Header with Edit Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <OrganizationHeader 
                    organization={organization}
                    userMembership={userMembership}
                    profile={profile}
                    onUpdate={updateOrganization}
                    onLeave={() => setIsConfirmingLeave(true)}
                    onDelete={() => setIsConfirmingDelete(true)}
                    setError={setError}
                />
                
                {/* Management Actions Bar */}
                {canEditOrg && (
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900">Public Profile Management</h3>
                                <p className="text-sm text-slate-600">Manage how your organization appears to the public</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleViewPublicProfile}
                                    className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Public Profile
                                </button>
                                <button
                                    onClick={handleEditPublicProfile}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Edit Public Profile
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Navigation & Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <OrganizationTabs 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    userMembership={userMembership}
                    canViewAnalytics={canViewAnalytics}
                />
                
                <OrganizationTabContent 
                    activeTab={activeTab}
                    organization={organization}
                    members={members}
                    userMembership={userMembership}
                    profile={profile}
                    onMemberAction={fetchOrganizationData}
                    setError={setError}
                />
            </div>

            {/* Modals */}
            <LeaveOrganizationModal 
                isOpen={isConfirmingLeave}
                onClose={() => setIsConfirmingLeave(false)}
                organization={organization}
                userRole={userMembership?.role}
                onConfirm={async () => {
                    await executeLeave();
                    setIsConfirmingLeave(false);
                }}
                loading={loading}
            />

            <DeleteOrganizationModal 
                isOpen={isConfirmingDelete}
                onClose={() => setIsConfirmingDelete(false)}
                organization={organization}
                members={members}
                onConfirm={executeDeleteOrganization}
                loading={loading}
                setError={setError}
            />
        </div>
    );
}