// Updated executeLeave function for hooks/useOrganizationData.js (Document 5)
const executeLeave = async () => {
    if (!userMembership) return;

    try {
        setLoading(true);
        setError('');

        // Step 1: Delete from main organization_memberships table
        const { error: deleteError } = await supabase
            .from('organization_memberships')
            .delete()
            .eq('profile_id', session.user.id)
            .eq('organization_id', userMembership.organization_id);

        if (deleteError) {
            setError('Error leaving organization: ' + deleteError.message);
            return;
        }

        // Step 2: CRITICAL FIX - Also delete from the cache table
        const { error: cacheDeleteError } = await supabase
            .from('organization_membership_cache')
            .delete()
            .eq('profile_id', session.user.id)
            .eq('organization_id', userMembership.organization_id);

        if (cacheDeleteError) {
            console.warn('Warning: Failed to clean cache, but main membership deleted:', cacheDeleteError);
            // Don't fail the whole operation for cache cleanup issues
        }

        // Step 3: Update profile to clear organization references
        await supabase
            .from('profiles')
            .update({
                organization_choice: null,
                selected_organization_id: null,
                selected_organization_type: null,
                organization_name: null, // ADDED: Clear profile organization name too
                updated_at: new Date()
            })
            .eq('id', session.user.id);

        // Step 4: Try to refresh the cache if there's a function for it
        try {
            await supabase.rpc('refresh_org_cache');
        } catch (refreshError) {
            console.warn('Cache refresh failed (this may be normal):', refreshError);
        }

        setUserMembership(null);
        setOrganization(null);
        setMembers([]);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await checkMembership();
    } catch (err) {
        setError('An unexpected error occurred while leaving the organization.');
    } finally {
        setLoading(false);
    }
};