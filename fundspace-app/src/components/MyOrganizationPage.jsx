// src/components/MyOrganizationPage.jsx - Updated with refresh capability
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

    // No organization state - setup page uses its own layout
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

    // Omega Admin display with expanded layout
    if (isOmegaAdmin && !userMembership) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Omega Admin Access</h1>
                    <p className="text-slate-600 mb-6">
                        You have administrative access to view and manage this organization as an Omega Admin.
                    </p>
                </div>
            </div>
        );
    }

    // Main organization page with fully expanded layout
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Organization Header */}
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
        </div>
    );
}