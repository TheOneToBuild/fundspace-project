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

      // Refresh data immediately
      if (refreshCallbacks?.loadApplications) {
        refreshCallbacks.loadApplications();
      }
      if (refreshCallbacks?.loadSavedGrants) {
        refreshCallbacks.loadSavedGrants();
      }
      
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

      // Refresh data immediately
      if (refreshCallbacks?.loadReceivedGrants) {
        refreshCallbacks.loadReceivedGrants();
      }
      
      return true;
      
    } catch (error) {
      console.error('Error in markAsReceived:', error);
      return false;
    }
  }, [session?.user?.id, userMembership, refreshCallbacks]);

  // Function to remove application status - Clean optimistic approach
  const removeApplication = useCallback(async (grantId) => {
    if (!session?.user?.id) return false;

    try {
      // Find all applications for this grant
      const { data: allApplications, error: findError } = await supabase
        .from('grant_applications')
        .select('*')
        .eq('grant_id', grantId);

      if (findError || !allApplications || allApplications.length === 0) {
        return false;
      }

      // Find the target application
      let targetApplication = null;
      
      // For admin users, prioritize org applications
      if (userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) && userMembership?.organizations?.id) {
        targetApplication = allApplications.find(app => 
          app.grant_id === grantId && 
          app.organization_id === userMembership.organizations.id
        );
      }
      
      // Fallback to user application
      if (!targetApplication) {
        targetApplication = allApplications.find(app => 
          app.grant_id === grantId && 
          app.user_id === session.user.id
        );
      }

      if (!targetApplication) {
        return false;
      }

      // Try to delete from database
      const { data: deletedData, error: deleteError } = await supabase
        .from('grant_applications')
        .delete()
        .eq('id', targetApplication.id)
        .select();

      // If database deletion fails (due to RLS), use optimistic approach
      let deletionSucceeded = !deleteError && deletedData && deletedData.length > 0;

      // Ensure grant is in saved_grants
      const { data: existingSave } = await supabase
        .from('saved_grants')
        .select('id')
        .eq('grant_id', grantId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!existingSave) {
        await supabase
          .from('saved_grants')
          .insert({
            grant_id: grantId,
            user_id: session.user.id
          });
      }

      // Refresh UI immediately - no delays
      if (refreshCallbacks?.loadApplications) {
        refreshCallbacks.loadApplications();
      }
      if (refreshCallbacks?.loadSavedGrants) {
        refreshCallbacks.loadSavedGrants();
      }
      
      return true;
      
    } catch (error) {
      console.error('Error in removeApplication:', error);
      return false;
    }
  }, [session?.user?.id, userMembership, refreshCallbacks]);

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

      // Refresh data immediately
      if (refreshCallbacks?.loadReceivedGrants) {
        refreshCallbacks.loadReceivedGrants();
      }
      
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