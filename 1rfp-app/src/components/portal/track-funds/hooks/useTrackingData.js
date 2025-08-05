// src/components/portal/track-funds/hooks/useTrackingData.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../../supabaseClient.js';
import { refreshGrantBookmarkCounts } from '../../../../utils/grantUtils.js';

export const useTrackingData = (session, userMembership) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    saved: [],
    applications: [],
    received: []
  });

  // Helper function to build grant data with all necessary joins
  const buildGrantData = async (baseData, grantIds) => {
    if (!grantIds || grantIds.length === 0) return [];

    try {
      // Get basic grant data
      const { data: grantsData, error: grantsError } = await supabase
        .from('grants')
        .select('*')
        .in('id', grantIds);

      if (grantsError) {
        console.error('Error fetching grants:', grantsError);
        return [];
      }

      // Get organization data
      const orgIds = [...new Set(grantsData?.map(g => g.organization_id).filter(Boolean) || [])];
      let orgsData = [];
      if (orgIds.length > 0) {
        const { data: organizationsData } = await supabase
          .from('organizations')
          .select('id, name, image_url, banner_image_url, slug')
          .in('id', orgIds);
        orgsData = organizationsData || [];
      }

      // Get categories and locations
      const { data: categoriesData } = await supabase
        .from('grant_categories')
        .select('grant_id, categories(id, name)')
        .in('grant_id', grantIds);

      const { data: locationsData } = await supabase
        .from('grant_locations')
        .select('grant_id, locations(id, name)')
        .in('grant_id', grantIds);

      // Get bookmark counts
      const bookmarkCounts = await refreshGrantBookmarkCounts(grantIds);

      // Format data
      return baseData.map(item => {
        const grantData = grantsData?.find(g => g.id === item.grant_id);
        if (!grantData) return null;

        const orgData = orgsData?.find(o => o.id === grantData.organization_id);
        const grantCategories = (categoriesData || []).filter(gc => gc.grant_id === item.grant_id);
        const grantLocations = (locationsData || []).filter(gl => gl.grant_id === item.grant_id);

        return {
          ...grantData,
          ...item,
          foundationName: orgData?.name || 'Unknown Organization',
          funderLogoUrl: orgData?.image_url || null,
          fundingAmount: grantData.max_funding_amount || grantData.funding_amount_text || 'Not specified',
          dueDate: grantData.deadline,
          grantType: grantData.grant_type,
          categories: grantCategories.map(gc => gc.categories).filter(Boolean),
          locations: grantLocations.map(gl => gl.locations).filter(Boolean),
          eligibility_criteria: grantData.eligibility_criteria,
          save_count: bookmarkCounts[item.grant_id] || 0,
          organization: {
            image_url: orgData?.image_url || null,
            banner_image_url: orgData?.banner_image_url || null,
            name: orgData?.name || 'Unknown Organization'
          }
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('Error in buildGrantData:', error);
      return [];
    }
  };

  // Load saved grants (individual user level) - with filtering for already applied grants
  const loadSavedGrants = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data: savedGrantsData, error } = await supabase
        .from('saved_grants')
        .select('id, grant_id, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved grants:', error);
        setData(prev => ({ ...prev, saved: [] }));
        return;
      }

      if (!savedGrantsData || savedGrantsData.length === 0) {
        setData(prev => ({ ...prev, saved: [] }));
        return;
      }

      // Get existing applications to filter out grants that have already been applied to
      let applicationsQuery = supabase
        .from('grant_applications')
        .select('grant_id');

      // Match the same query logic as loadApplications
      if (userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) && userMembership?.organizations?.id) {
        applicationsQuery = applicationsQuery.eq('organization_id', userMembership.organizations.id);
      } else {
        applicationsQuery = applicationsQuery.eq('user_id', session.user.id);
      }

      const { data: existingApplications } = await applicationsQuery;
      const appliedGrantIds = new Set(existingApplications?.map(app => app.grant_id) || []);

      // Filter out grants that have already been applied to
      const availableSavedGrants = savedGrantsData.filter(sg => !appliedGrantIds.has(sg.grant_id));

      if (availableSavedGrants.length === 0) {
        setData(prev => ({ ...prev, saved: [] }));
        return;
      }

      const grantIds = availableSavedGrants.map(sg => sg.grant_id);
      const baseData = availableSavedGrants.map(sg => ({
        grant_id: sg.grant_id,
        save_id: sg.id,
        saved_date: sg.created_at
      }));

      const formattedData = await buildGrantData(baseData, grantIds);
      setData(prev => ({ ...prev, saved: formattedData }));
    } catch (error) {
      console.error('Error in loadSavedGrants:', error);
      setData(prev => ({ ...prev, saved: [] }));
    }
  }, [session?.user?.id, userMembership]);

  // Load applications (organization level if admin, individual if not)
  const loadApplications = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      let query = supabase
        .from('grant_applications')
        .select('id, grant_id, status, applied_date, notes, user_id, organization_id');

      // If user has admin access, show organization-wide applications
      if (userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) && userMembership?.organizations?.id) {
        query = query.eq('organization_id', userMembership.organizations.id);
      } else {
        query = query.eq('user_id', session.user.id);
      }

      const { data: applicationsData, error } = await query.order('applied_date', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setData(prev => ({ ...prev, applications: [] }));
          return;
        }
        setData(prev => ({ ...prev, applications: [] }));
        return;
      }

      if (!applicationsData || applicationsData.length === 0) {
        setData(prev => ({ ...prev, applications: [] }));
        return;
      }

      const grantIds = applicationsData.map(app => app.grant_id);
      const baseData = applicationsData.map(app => ({
        grant_id: app.grant_id,
        application_id: app.id,
        application_status: app.status,
        applied_date: app.applied_date,
        application_notes: app.notes
      }));

      const formattedData = await buildGrantData(baseData, grantIds);
      setData(prev => ({ ...prev, applications: formattedData }));
    } catch (error) {
      console.error('Error in loadApplications:', error);
      setData(prev => ({ ...prev, applications: [] }));
    }
  }, [session?.user?.id, userMembership]);

  // Load received grants (organization level if admin, individual if not)
  const loadReceivedGrants = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      let query = supabase
        .from('grant_awards')
        .select('id, grant_id, award_amount, award_date, status, notes');

      if (userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) && userMembership?.organizations?.id) {
        query = query.eq('organization_id', userMembership.organizations.id);
      } else {
        query = query.eq('user_id', session.user.id);
      }

      const { data: receivedData, error } = await query.order('award_date', { ascending: false });

      if (error) {
        console.error('Error fetching received grants:', error);
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setData(prev => ({ ...prev, received: [] }));
          return;
        }
        setData(prev => ({ ...prev, received: [] }));
        return;
      }

      if (!receivedData || receivedData.length === 0) {
        setData(prev => ({ ...prev, received: [] }));
        return;
      }

      const grantIds = receivedData.map(award => award.grant_id);
      const baseData = receivedData.map(award => ({
        grant_id: award.grant_id,
        award_id: award.id,
        award_amount: award.award_amount,
        award_date: award.award_date,
        award_status: award.status,
        award_notes: award.notes
      }));

      const formattedData = await buildGrantData(baseData, grantIds);
      setData(prev => ({ ...prev, received: formattedData }));
    } catch (error) {
      console.error('Error in loadReceivedGrants:', error);
      setData(prev => ({ ...prev, received: [] }));
    }
  }, [session?.user?.id, userMembership]);

  // Load data based on section
  const loadSectionData = useCallback(async (section) => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      switch (section) {
        case 'saved':
          await loadSavedGrants();
          break;
        case 'applications':
          await loadApplications();
          break;
        case 'received':
          await loadReceivedGrants();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${section} data:`, error);
    } finally {
      setLoading(false);
    }
  }, [loadSavedGrants, loadApplications, loadReceivedGrants, session?.user?.id]);

  return {
    data,
    loading,
    loadSectionData,
    loadSavedGrants,
    loadApplications,
    loadReceivedGrants
  };
};