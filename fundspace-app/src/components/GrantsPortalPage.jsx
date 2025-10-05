import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getGrantsWithDetails, toggleSavedGrant } from '../utils/rpcClientFunctions';
import { hasPermission, PERMISSIONS } from '../utils/permissions.js';
import PortalAccessControl from './portal/PortalAccessControl.jsx';
import PortalBanner from './portal/PortalBanner.jsx';
import PortalActionCards from './portal/PortalActionCards.jsx';
import ExploreFundsTab from './portal/ExploreFundsTab.jsx';
import TrackFundsTab from './portal/track-funds/TrackFundsTab.jsx';
import { 
  CreateFundsTab, 
  RequestFundsTab, 
  CommunitiesTab, 
  OrganizationsTab 
} from './portal/PortalPlaceholderTabs.jsx';
import CreateGrantModal from './portal/CreateGrantModal.jsx';
import GrantDetailModal from '../GrantDetailModal.jsx';
import { refreshGrantBookmarkCounts } from '../utils/grantUtils.js';
import { parseMaxFundingAmount } from '../utils.js';

const GrantsPortalPage = () => {
  const { profile, session } = useOutletContext();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userMembership, setUserMembership] = useState(null);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedGrantIds, setSavedGrantIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('explore');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!profile) return;
      setCheckingAccess(true);
      try {
        const canAccessPortal = hasPermission(profile, PERMISSIONS.PORTAL_ACCESS);
        setHasAccess(canAccessPortal);
        if (canAccessPortal && session?.user?.id) {
          const { data: membership } = await supabase
            .from('organization_memberships')
            .select(`*, organizations (*)`)
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();
          setUserMembership(membership);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasAccess(false);
      }
      setCheckingAccess(false);
    };
    checkAccess();
  }, [profile, session?.user?.id]);

  useEffect(() => {
    const fetchGrants = async () => {
      if (!hasAccess) return;
      setLoading(true);
      try {
        const rpcData = await getGrantsWithDetails({
          userId: session?.user?.id,
          limit: 100,
          offset: 0,
          searchTerm: null,
          organizationTypes: null,
          minAmount: null,
          maxAmount: null,
          deadlineAfter: null,
          grantType: null,
          savedOnly: false
        });
        
        const formattedGrants = (rpcData.grants || []).map(grant => ({
          ...grant,
          foundationName: grant.funder_name || grant.organization?.name || 'Unknown Funder',
          funderSlug: grant.funder_slug || grant.organization?.slug || null,
          fundingAmount: grant.max_funding_amount || grant.funding_amount_text || 'Not specified',
          dueDate: grant.deadline,
          grantType: grant.grant_type,
          eligibility_criteria: grant.eligibility_criteria,
          categories: grant.category_names ? grant.category_names.map((name, idx) => ({ id: idx, name })) : [],
          locations: grant.location_names ? grant.location_names.map((name, idx) => ({ id: idx, name })) : [],
          is_saved: grant.is_saved || false
        }));

        setGrants(formattedGrants);
        const savedIds = new Set(formattedGrants.filter(g => g.is_saved).map(g => g.id));
        setSavedGrantIds(savedIds);
      } catch (error) {
        console.error('Error loading grants portal RPC:', error);
        setGrants([]);
        setSavedGrantIds(new Set());
      }
      setLoading(false);
    };
    fetchGrants();
  }, [hasAccess, session?.user?.id]);

  const openDetail = useCallback((grant) => {
    setSelectedGrant(grant);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedGrant(null);
    setIsDetailModalOpen(false);
  }, []);

  const handleSaveGrant = useCallback(async (grantId) => {
    if (!session?.user?.id || !grantId) return;
    setSavedGrantIds(prev => new Set([...prev, grantId]));
    setGrants(prev => prev.map(grant => 
      grant.id === grantId 
        ? { ...grant, is_saved: true, save_count: (grant.save_count || 0) + 1 }
        : grant
    ));
    try {
      await toggleSavedGrant(session.user.id, grantId);
      await refreshGrantBookmarkCounts([grantId]);
    } catch (error) {
      console.error('Error saving grant:', error);
      setSavedGrantIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(grantId);
        return newSet;
      });
      setGrants(prev => prev.map(grant => 
        grant.id === grantId 
          ? { ...grant, is_saved: false, save_count: Math.max((grant.save_count || 1) - 1, 0) }
          : grant
      ));
    }
  }, [session?.user?.id]);

  const handleUnsaveGrant = useCallback(async (grantId) => {
    if (!session?.user?.id || !grantId) return;
    setSavedGrantIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(grantId);
      return newSet;
    });
    setGrants(prev => prev.map(grant => 
      grant.id === grantId 
        ? { ...grant, is_saved: false, save_count: Math.max((grant.save_count || 1) - 1, 0) }
        : grant
    ));
    try {
      await toggleSavedGrant(session.user.id, grantId);
      await refreshGrantBookmarkCounts([grantId]);
    } catch (error) {
      console.error('Error unsaving grant:', error);
      setSavedGrantIds(prev => new Set([...prev, grantId]));
      setGrants(prev => prev.map(grant => 
        grant.id === grantId 
          ? { ...grant, is_saved: true, save_count: (grant.save_count || 0) + 1 }
          : grant
      ));
    }
  }, [session?.user?.id]);

  const handleFilterByCategory = useCallback((categoryName) => {
    console.log('Filter by category:', categoryName);
  }, []);

  const formatCurrency = useCallback((amount) => {
    if (!amount) return 'Not specified';
    const numAmount = parseMaxFundingAmount(amount);
    if (!numAmount) return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  }, []);

  const filterBarProps = useMemo(() => ({
    totalCount: grants.length,
    availableCategories: [...new Set(grants.flatMap(g => g.category_names || []))],
    availableLocations: [...new Set(grants.flatMap(g => g.location_names || []))],
    loading
  }), [grants, loading]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'explore':
        return (
          <ExploreFundsTab
            grants={grants}
            loading={loading}
            session={session}
            savedGrantIds={savedGrantIds}
            handleSaveGrant={handleSaveGrant}
            handleUnsaveGrant={handleUnsaveGrant}
            openDetail={openDetail}
            handleFilterByCategory={handleFilterByCategory}
            filterBarProps={filterBarProps}
            formatCurrency={formatCurrency}
          />
        );
      case 'track':
        return <TrackFundsTab session={session} userMembership={userMembership} />;
      case 'communities':
        return <CommunitiesTab />;
      case 'organizations':
        return <OrganizationsTab />;
      case 'create':
        return <CreateFundsTab />;
      case 'request':
        return <RequestFundsTab />;
      default:
        return null;
    }
  };

  return (
    <PortalAccessControl checkingAccess={checkingAccess} hasAccess={hasAccess}>
      <div className="min-h-screen pb-16">
        <div className="px-2 lg:px-4 py-8">
          <PortalBanner userMembership={userMembership} />
          <PortalActionCards 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            userMembership={userMembership} 
          />
          {renderTabContent()}
        </div>
        <CreateGrantModal 
          showCreateModal={showCreateModal} 
          setShowCreateModal={setShowCreateModal} 
        />
        {isDetailModalOpen && selectedGrant && (
          <GrantDetailModal
            grant={selectedGrant}
            isOpen={isDetailModalOpen}
            onClose={closeDetail}
            session={session}
            isSaved={savedGrantIds.has(selectedGrant.id)}
            onSave={handleSaveGrant}
            onUnsave={handleUnsaveGrant}
          />
        )}
      </div>
    </PortalAccessControl>
  );
};

export default GrantsPortalPage;