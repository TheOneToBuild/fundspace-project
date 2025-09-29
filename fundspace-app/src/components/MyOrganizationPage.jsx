import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AlertTriangle, Crown, Users, Plus } from 'lucide-react';
import StreamlinedOrganizationSetupPage from './OrganizationSetupPage.jsx';
import OrganizationHeader from './organization/OrganizationHeader.jsx';
import OrganizationTabs from './organization/OrganizationTabs.jsx';
import OrganizationTabContent from './organization/OrganizationTabContent.jsx';
import LeaveOrganizationModal from './organization/LeaveOrganizationModal.jsx';
import DeleteOrganizationModal from './organization/DeleteOrganizationModal.jsx';
import { hasPermission, PERMISSIONS } from '../utils/organizationPermissions.js';
import { getOrganizationData, getUserOrganizationMembership } from '../utils/rpcClientFunctions';

const OrganizationJoinPrompt = ({ onStartOnboarding }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="p-12 rounded-xl shadow-sm bg-slate-50">
          <Users className="w-16 h-16 mx-auto text-slate-400 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Join Your Organization</h1>
          <p className="text-slate-600 mb-8">
            Connect with your colleagues and team by joining your organization on Fundspace. You can search for existing organizations or create a new organization profile.
          </p>
          <div className="space-y-4">
            <button
              onClick={onStartOnboarding}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              Find My Organization
            </button>
            <div className="text-sm text-slate-500">
              <p>This will help you search for existing organizations to join or create a new one</p>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Join Existing</h3>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Connect with colleagues</li>
                <li>• Access team features</li>
                <li>• Participate in discussions</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Plus className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">Create New</h3>
              </div>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Become administrator</li>
                <li>• Invite team members</li>
                <li>• Build organization profile</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyOrganizationPage() {
  const { profile, session } = useOutletContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [userMembership, setUserMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOmegaAdmin = profile?.is_omega_admin === true;

  const checkMembership = async () => {
    if (!profile?.id) return;
    try {
      const membershipData = await getUserOrganizationMembership(profile.id);
      if (membershipData && membershipData.length > 0) {
        setUserMembership(membershipData[0]);
        return membershipData[0].organization_id;
      }
      setUserMembership(null);
      return null;
    } catch (error) {
      console.error('Error checking membership:', error);
      setUserMembership(null);
      return null;
    }
  };

  const fetchOrganizationData = async (orgId) => {
    if (!orgId) return;
    try {
      const orgData = await getOrganizationData(orgId, profile?.id);
      if (orgData?.organization) {
        setOrganization(orgData.organization);
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setError('Failed to load organization data');
    }
  };

  const loadPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      const orgId = await checkMembership();
      if (orgId) {
        await fetchOrganizationData(orgId);
      }
    } catch (error) {
      console.error('Error loading page data:', error);
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      loadPageData();
    }
  }, [profile?.id]);

  useEffect(() => {
    window.refreshMyOrganizationPage = loadPageData;
    return () => {
      delete window.refreshMyOrganizationPage;
    };
  }, []);

  const handleStartOnboarding = () => {
    navigate('/onboarding');
  };

  const executeLeave = async () => {
    if (!userMembership) return;
    try {
      await supabase
        .from('organization_memberships')
        .delete()
        .eq('id', userMembership.id);
      setUserMembership(null);
      setOrganization(null);
    } catch (error) {
      console.error('Error leaving organization:', error);
      setError('Failed to leave organization');
    }
  };

  const executeDeleteOrganization = async () => {
    if (!organization?.id) return;
    try {
      await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id);
      setOrganization(null);
      setUserMembership(null);
    } catch (error) {
      console.error('Error deleting organization:', error);
      setError('Failed to delete organization');
    }
  };

  const updateOrganization = async (updates) => {
    if (!organization?.id) return;
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization.id)
        .select()
        .single();
      if (error) throw error;
      setOrganization(data);
    } catch (error) {
      console.error('Error updating organization:', error);
      setError('Failed to update organization');
    }
  };

  const userRole = userMembership?.role;
  const canViewAnalytics = ['super_admin', 'admin'].includes(userRole) || isOmegaAdmin;

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-slate-100 h-64 rounded-xl"></div>
          <div className="bg-slate-100 h-96 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-50 p-8 rounded-xl text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Organization</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!organization && !loading) {
    return (
      <StreamlinedOrganizationSetupPage
        profile={profile}
        session={session}
        onComplete={loadPageData}
      />
    );
  }

  if (isOmegaAdmin && !userMembership) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-50 p-8 rounded-xl text-center">
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {process.env.NODE_ENV === 'development' && organization && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-purple-800 font-semibold mb-2">Organization Page RPC Optimization Active!</h3>
            <p className="text-purple-600 text-sm">
              Organization page loaded with 2 RPC calls instead of 5+ individual API calls.
              Organization: {organization.name}, Members loaded via RPC
            </p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="rounded-xl overflow-hidden">
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
        
        <div className="rounded-xl overflow-hidden">
          <OrganizationTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userMembership={userMembership}
            canViewAnalytics={canViewAnalytics}
          />
          <OrganizationTabContent
            activeTab={activeTab}
            organization={organization}
            userMembership={userMembership}
            profile={profile}
            onMemberAction={loadPageData}
            setError={setError}
          />
        </div>
        
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
          onConfirm={executeDeleteOrganization}
          loading={loading}
          setError={setError}
        />
      </div>
    </div>
  );
}