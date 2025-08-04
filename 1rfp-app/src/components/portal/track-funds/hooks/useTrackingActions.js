// src/components/portal/track-funds/hooks/useTrackingActions.js
import { useCallback } from 'react';
import { supabase } from '../../../../supabaseClient.js';

export const useTrackingActions = (session, userMembership, refreshCallbacks) => {
  
  // Function to mark a grant as applied
  const markAsApplied = useCallback(async (grantId, notes = '') => {
    if (!session?.user?.id) return false;

    try {
      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('grant_applications')
        .select('id')
        .eq('grant_id', grantId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existingApplication) {
        console.log('Already applied to this grant');
        return false;
      }

      const organizationId = userMembership?.organizations?.id || null;
      
      const { data, error } = await supabase
        .from('grant_applications')
        .insert({
          grant_id: grantId,
          user_id: session.user.id,
          organization_id: organizationId,
          status: 'submitted',
          applied_date: new Date().toISOString(),
          notes: notes || 'Marked as applied via portal'
        })
        .select()
        .single();

      if (error) {
        console.error('Error marking as applied:', error);
        return false;
      }

      // Refresh applications data if callback provided
      if (refreshCallbacks?.loadApplications) {
        refreshCallbacks.loadApplications();
      }
      
      console.log('Successfully marked as applied');
      return true;
      
    } catch (error) {
      console.error('Error in markAsApplied:', error);
      return false;
    }
  }, [session?.user?.id, userMembership, refreshCallbacks]);

  // Function to mark a grant as received/awarded
  const markAsReceived = useCallback(async (grantId, awardAmount = null, notes = '') => {
    if (!session?.user?.id) return false;

    try {
      // Check if already received
      const { data: existingAward } = await supabase
        .from('grant_awards')
        .select('id')
        .eq('grant_id', grantId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existingAward) {
        console.log('Already received this grant');
        return false;
      }

      const organizationId = userMembership?.organizations?.id || null;
      
      const { data, error } = await supabase
        .from('grant_awards')
        .insert({
          grant_id: grantId,
          user_id: session.user.id,
          organization_id: organizationId,
          award_amount: awardAmount,
          award_date: new Date().toISOString(),
          status: 'active',
          notes: notes || 'Marked as received via portal'
        })
        .select()
        .single();

      if (error) {
        console.error('Error marking as received:', error);
        return false;
      }

      // Refresh received data if callback provided
      if (refreshCallbacks?.loadReceivedGrants) {
        refreshCallbacks.loadReceivedGrants();
      }
      
      console.log('Successfully marked as received');
      return true;
      
    } catch (error) {
      console.error('Error in markAsReceived:', error);
      return false;
    }
  }, [session?.user?.id, userMembership, refreshCallbacks]);

  // Function to remove application status
  const removeApplication = useCallback(async (applicationId) => {
    try {
      const { error } = await supabase
        .from('grant_applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error('Error removing application:', error);
        return false;
      }

      // Refresh applications data if callback provided
      if (refreshCallbacks?.loadApplications) {
        refreshCallbacks.loadApplications();
      }
      
      console.log('Successfully removed application');
      return true;
      
    } catch (error) {
      console.error('Error in removeApplication:', error);
      return false;
    }
  }, [refreshCallbacks]);

  // Function to remove award status
  const removeAward = useCallback(async (awardId) => {
    try {
      const { error } = await supabase
        .from('grant_awards')
        .delete()
        .eq('id', awardId);

      if (error) {
        console.error('Error removing award:', error);
        return false;
      }

      // Refresh received data if callback provided
      if (refreshCallbacks?.loadReceivedGrants) {
        refreshCallbacks.loadReceivedGrants();
      }
      
      console.log('Successfully removed award');
      return true;
      
    } catch (error) {
      console.error('Error in removeAward:', error);
      return false;
    }
  }, [refreshCallbacks]);

  return {
    markAsApplied,
    markAsReceived,
    removeApplication,
    removeAward
  };
};