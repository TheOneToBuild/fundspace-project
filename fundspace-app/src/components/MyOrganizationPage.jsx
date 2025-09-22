// src/components/MyOrganizationPage.jsx - Updated to allow omega admins to create/join organizations
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AlertTriangle, Crown } from 'lucide-react';
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

    // NEW: Expose refresh function globally for organization joins
    useEffect(() => {
        window.refreshMyOrganizationPage = () => {
            checkMembership();
            fetchOrganizationData();
        };
        return () => {
            delete window.refreshMyOrganizationPage;
        };
    }, [checkMembership, fetchOrganizationData]);

    // Loading state with expanded layout
    if (loading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="bg-white h-64 rounded-xl shadow-sm border border-slate-200"></div>
                    <div className="bg-white h-96 rounded-xl shadow-sm border border-slate-200"></div>
                </div>
            </div>
        );
    }

    // Error state with expanded layout
    if (error && !organization) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Organization Not Found</h1>
                    <p className="text-slate-600 mb-6">{error}</p>
                </div>
            </div>
        );
    }

    // ✅ UPDATED: No organization state - allow ALL users (including omega admins) to access setup
    if (!organization) {
        return (
            <StreamlinedOrganizationSetupPage 
                profile={profile}
                session={session}
                onComplete={() => {
                    fetchOrganizationData();
                }}
            />
        );
    }

    // ✅ UPDATED: Remove the omega admin restriction block entirely
    // Previously there was a special case that prevented omega admins without memberships 
    // from accessing normal organization functionality - this has been removed

    // Main organization page layout
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
                <OrganizationHeader
                    organization={organization}
                    members={members}
                    userMembership={userMembership}
                    userRole={userRole}
                    isOmegaAdmin={isOmegaAdmin}
                    onEditOrganization={(updatedOrg) => updateOrganization(updatedOrg)}
                    onLeaveOrganization={() => setIsConfirmingLeave(true)}
                    onDeleteOrganization={() => setIsConfirmingDelete(true)}
                    canViewAnalytics={canViewAnalytics}
                    error={error}
                    setError={setError}
                />

                <OrganizationTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    organization={organization}
                    userMembership={userMembership}
                    isOmegaAdmin={isOmegaAdmin}
                    canViewAnalytics={canViewAnalytics}
                />

                <OrganizationTabContent
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    organization={organization}
                    members={members}
                    userMembership={userMembership}
                    session={session}
                    isOmegaAdmin={isOmegaAdmin}
                    canViewAnalytics={canViewAnalytics}
                />
            </div>

            {/* Leave Organization Modal */}
            <LeaveOrganizationModal
                isOpen={isConfirmingLeave}
                onClose={() => setIsConfirmingLeave(false)}
                organization={organization}
                userRole={userRole}
                onConfirm={async () => {
                    const success = await executeLeave();
                    if (success) {
                        setIsConfirmingLeave(false);
                        // Navigate to profile or refresh the page to show setup
                        navigate('/profile/my-organization', { replace: true });
                    }
                }}
                loading={loading}
            />

            {/* Delete Organization Modal */}
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