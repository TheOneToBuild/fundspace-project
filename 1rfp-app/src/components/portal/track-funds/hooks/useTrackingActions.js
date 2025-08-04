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

      console.log('Successfully marked as applied');
      
      // Add delay before refreshing to ensure database consistency
      setTimeout(() => {
        if (refreshCallbacks?.loadApplications) {
          refreshCallbacks.loadApplications();
        }
        if (refreshCallbacks?.loadSavedGrants) {
          refreshCallbacks.loadSavedGrants();
        }
      }, 100);
      
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

  // Function to remove application status - SIMPLIFIED DIRECT APPROACH
  const removeApplication = useCallback(async (grantId) => {
    if (!session?.user?.id) {
      console.log('No user session available');
      return false;
    }

    console.log('=== STARTING UNDO APPLICATION FOR GRANT:', grantId, '===');

    try {
      // STEP 1: Find and delete the application directly by grant_id and organization
      console.log('Step 1: Deleting application directly from database');
      
      let deleteQuery = supabase.from('grant_applications').delete();
      
      // For admin users, delete by organization_id and grant_id
      if (userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) && userMembership?.organizations?.id) {
        deleteQuery = deleteQuery
          .eq('grant_id', grantId)
          .eq('organization_id', userMembership.organizations.id);
        console.log('Deleting org application: grant_id =', grantId, 'organization_id =', userMembership.organizations.id);
      } else {
        // For regular users, delete by user_id and grant_id
        deleteQuery = deleteQuery
          .eq('grant_id', grantId)
          .eq('user_id', session.user.id);
        console.log('Deleting user application: grant_id =', grantId, 'user_id =', session.user.id);
      }

      const { data: deletedData, error: deleteError } = await deleteQuery.select();

      if (deleteError) {
        console.error('ERROR: Failed to delete application:', deleteError);
        return false;
      }

      console.log('SUCCESS: Deleted application data:', deletedData);

      // STEP 2: Ensure grant is in saved_grants for the user
      console.log('Step 2: Ensuring grant is in saved_grants');
      
      const { data: existingSave, error: checkSaveError } = await supabase
        .from('saved_grants')
        .select('id')
        .eq('grant_id', grantId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (checkSaveError) {
        console.error('ERROR: Failed to check saved grant:', checkSaveError);
      } else if (!existingSave) {
        console.log('Grant not in saved_grants, adding it');
        const { error: saveError } = await supabase
          .from('saved_grants')
          .insert({
            grant_id: grantId,
            user_id: session.user.id
          });

        if (saveError) {
          console.error('ERROR: Failed to save grant:', saveError);
        } else {
          console.log('SUCCESS: Added grant to saved_grants');
        }
      } else {
        console.log('Grant already in saved_grants:', existingSave);
      }

      // STEP 3: Force refresh with a longer delay
      console.log('Step 3: Refreshing UI after successful database operations');
      
      setTimeout(() => {
        console.log('=== REFRESHING UI AFTER SUCCESSFUL DELETION ===');
        
        if (refreshCallbacks?.loadApplications) {
          refreshCallbacks.loadApplications();
        }
        if (refreshCallbacks?.loadSavedGrants) {
          refreshCallbacks.loadSavedGrants();
        }
      }, 1500); // 1.5 second delay
      
      console.log('=== UNDO APPLICATION COMPLETED SUCCESSFULLY ===');
      return true;
      
    } catch (error) {
      console.error('=== UNDO APPLICATION FAILED ===', error);
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