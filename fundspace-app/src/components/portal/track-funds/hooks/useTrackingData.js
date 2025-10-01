// src/components/portal/track-funds/hooks/useTrackingData.js
import { useState, useCallback } from 'react';
import { getUserTrackedGrants } from '../../../../utils/rpcClientFunctions.js';

export const useTrackingData = (session, userMembership) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    saved: [],
    applications: [],
    received: []
  });
  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const organizationId = userMembership?.organization_id || null;
      const result = await getUserTrackedGrants(session.user.id, organizationId);
      
      setData({
        saved: result.saved || [],
        applications: result.applications || [],
        received: result.received || []
      });
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setData({ saved: [], applications: [], received: [] });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, userMembership?.organization_id]);

  return {
    loading,
    data,
    fetchData
  };
};