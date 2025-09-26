// src/components/GrantsPortalPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { hasPermission, PERMISSIONS } from '../utils/permissions.js';

// Components
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

// Hooks and utilities
import { filterGrantsWithTaxonomy } from '../filtering.js';
import { sortGrants } from '../sorting.js';
import usePaginatedFilteredData from '../hooks/usePaginatedFilteredData.js';
import { refreshGrantBookmarkCounts } from '../utils/grantUtils.js';
import { GRANT_STATUSES } from '../constants.js';
import { parseMaxFundingAmount } from '../utils.js';

const GrantsPortalPage = () => {
  const { profile, session } = useOutletContext();
  
  // Access control state
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userMembership, setUserMembership] = useState(null);
  
  // Data state
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedGrantIds, setSavedGrantIds] = useState(new Set());
  
  // UI state
  const [activeTab, setActiveTab] = useState('explore');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  // Check user permissions and membership
  useEffect(() => {
    const checkAccess = async () => {
      if (!profile) return;
      
      setCheckingAccess(true);
      
      try {
        // Check if user has portal access
        const canAccessPortal = hasPermission(profile, PERMISSIONS.PORTAL_ACCESS);
        setHasAccess(canAccessPortal);
        
        // Get user's organization membership if they have access
        if (canAccessPortal && session?.user?.id) {
          const { data: membership } = await supabase
            .from('organization_memberships')
            .select(`
              *,
              organizations (*)
            `)
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

  // Load grants data
  useEffect(() => {
    const fetchGrants = async () => {
      if (!hasAccess) return;
      
      setLoading(true);
      
      try {
        const { data: grantsData, error: grantsError } = await supabase
          .from('grants_with_taxonomy')
          .select('*')
          .order('id', { ascending: false });

        if (grantsError) {
          console.error('Error fetching grants:', grantsError);
          setGrants([]);
        } else {
          // Get organization IDs and fetch organizations separately
          const orgIds = [...new Set(grantsData?.map(g => g.organization_id).filter(Boolean))];
          
          let orgsData = [];
          if (orgIds.length > 0) {
            const { data: organizationsData } = await supabase
              .from('organizations')
              .select('id, name, image_url, banner_image_url, slug')
              .in('id', orgIds);
            orgsData = organizationsData || [];
          }

          const formattedData = grantsData?.map(grant => {
            const orgData = orgsData.find(o => o.id === grant.organization_id);
            
            return {
              ...grant,
              foundationName: grant.funder_name || orgData?.name || 'Unknown Funder',
              funderSlug: grant.funder_slug || orgData?.slug || null,
              fundingAmount: grant.max_funding_amount || grant.funding_amount_text || 'Not specified',
              dueDate: grant.deadline,
              grantType: grant.grant_type,
              eligibility_criteria: grant.eligibility_criteria,
              categories: grant.category_names ? grant.category_names.map((name, idx) => ({ id: idx, name })) : [],
              locations: grant.location_names ? grant.location_names.map((name, idx) => ({ id: idx, name })) : [],
            };
          }) || [];

          setGrants(formattedData);
        }
      } catch (error) {
        console.error('Error in fetchGrants:', error);
        setGrants([]);
      }
      
      setLoading(false);
    };

    fetchGrants();
  }, [hasAccess]);

  // Load saved grants for current user
  useEffect(() => {
    const loadSavedGrants = async () => {
      if (!session?.user?.id) {
        setSavedGrantIds(new Set());
        return;
      }

      try {
        const { data } = await supabase
          .from('saved_grants')
          .select('grant_id')
          .eq('user_id', session.user.id);

        setSavedGrantIds(new Set(data?.map(sg => sg.grant_id) || []));
      } catch (error) {
        console.error('Error loading saved grants:', error);
        setSavedGrantIds(new Set());
      }
    };

    loadSavedGrants();
  }, [session?.user?.id]);

  // Modal handlers
  const openDetail = useCallback((grant) => {
    setSelectedGrant(grant);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedGrant(null);
    setIsDetailModalOpen(false);
  }, []);

  // Grant save/unsave handlers
  const handleSaveGrant = useCallback(async (grantId) => {
    if (!session?.user?.id || !grantId) return;

    try {
      await supabase.from('saved_grants').insert({
        user_id: session.user.id,
        grant_id: grantId
      });

      setSavedGrantIds(prev => new Set(prev.add(grantId)));
      await refreshGrantBookmarkCounts([grantId]);
    } catch (error) {
      console.error('Error saving grant:', error);
    }
  }, [session?.user?.id]);

  const handleUnsaveGrant = useCallback(async (grantId) => {
    if (!session?.user?.id || !grantId) return;

    try {
      await supabase
        .from('saved_grants')
        .delete()
        .match({ user_id: session.user.id, grant_id: grantId });

      setSavedGrantIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(grantId);
        return newSet;
      });
      await refreshGrantBookmarkCounts([grantId]);
    } catch (error) {
      console.error('Error unsaving grant:', error);
    }
  }, [session?.user?.id]);

  // Filter handler
  const handleFilterByCategory = useCallback((categoryName) => {
    // This would be implemented based on your filtering logic
    console.log('Filter by category:', categoryName);
  }, []);

  // Format currency helper
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

  // Filter bar props for ExploreFundsTab
  const filterBarProps = {
    totalCount: grants.length,
    availableCategories: [...new Set(grants.flatMap(g => g.category_names || []))],
    availableLocations: [...new Set(grants.flatMap(g => g.location_names || []))],
    loading
  };

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