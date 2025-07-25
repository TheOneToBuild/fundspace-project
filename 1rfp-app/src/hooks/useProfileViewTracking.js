// src/hooks/useProfileViewTracking.js

import { useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

export const useProfileViewTracking = (organizationId, viewerId) => {
  useEffect(() => {
    if (!organizationId) return;

    const trackView = async () => {
      try {
        // Create a session ID for this page view
        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Get basic browser info without being too invasive
        const referrer = document.referrer;

        await supabase
          .from('profile_views')
          .insert({
            organization_id: organizationId,
            viewer_id: viewerId || null,
            session_id: sessionId,
            referrer: referrer || null,
          });
      } catch (error) {
        // Silently fail - view tracking shouldn't break the page
        console.debug('View tracking error:', error);
      }
    };

    // Track view after a short delay to avoid tracking quick bounces
    const timer = setTimeout(trackView, 2000);
    
    return () => clearTimeout(timer);
  }, [organizationId, viewerId]);

  // This hook doesn't return anything - it just tracks views silently
};