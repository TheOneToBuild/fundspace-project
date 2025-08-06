// hooks/useOrganizationData.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function useOrganizationData(profile, session) {
    const navigate = useNavigate();
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [userMembership, setUserMembership] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const checkMembership = useCallback(async () => {
        if (!session?.user?.id || !profile) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        if (profile?.is_omega_admin === true) {
            setLoading(false);
            return;
        }

        try {
            const { data: memberships, error: membershipError } = await supabase
                .from('organization_memberships')
                .select('*')
                .eq('profile_id', profile.id)
                .order('joined_at', { ascending: false })
                .limit(1);

            if (membershipError) {
                setError('Error checking membership');
                setLoading(false);
                return;
            }

            if (memberships && memberships.length > 0) {
                setUserMembership(memberships[0]);
            } else {
                setUserMembership(null);
                setOrganization(null);
                setMembers([]);
            }
        } catch (err) {
            setError('Error checking membership');
            setUserMembership(null);
            setOrganization(null);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, [profile, session?.user?.id]);

    const fetchOrganizationData = useCallback(async () => {
        if (!userMembership) return;

        try {
            setLoading(true);
            
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', userMembership.organization_id)
                .single();

            if (orgError || !orgData) {
                setError('Organization not found');
                setLoading(false);
                return;
            }

            setOrganization({ 
                ...orgData, 
                type: userMembership.organization_type,
                logo_url: orgData.image_url,
                tagline: orgData.tagline || '', 
                description: orgData.description || '', 
                location: orgData.location || '', 
                website: orgData.website || '', 
                contact_email: orgData.contact_email || '',
            });

            // FIXED: Added organizational_role to the query
            const { data: memberData, error: memberError } = await supabase
                .from('organization_memberships')
                .select(`
                    *,
                    profiles (
                        id,
                        full_name,
                        avatar_url,
                        title,
                        is_omega_admin,
                        organizational_role
                    )
                `)
                .eq('organization_id', userMembership.organization_id)
                .eq('organization_type', userMembership.organization_type)
                .order('role', { ascending: false })
                .order('joined_at', { ascending: true });

            if (!memberError) {
                setMembers(memberData || []);
            }
        } catch (err) {
            setError('Error loading organization data');
        } finally {
            setLoading(false);
        }
    }, [userMembership]);

    const executeLeave = async () => {
        if (!userMembership) return;

        try {
            setLoading(true);
            setError('');

            const { error: deleteError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('profile_id', session.user.id)
                .eq('organization_id', userMembership.organization_id);

            if (deleteError) {
                setError('Error leaving organization: ' + deleteError.message);
                return;
            }

            await supabase
                .from('profiles')
                .update({
                    organization_choice: null,
                    selected_organization_id: null,
                    selected_organization_type: null,
                    updated_at: new Date()
                })
                .eq('id', session.user.id);

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

    const executeDeleteOrganization = async (confirmText) => {
        if (!organization || confirmText !== organization.name) {
            setError('Please enter the organization name exactly to confirm deletion.');
            return false;
        }

        try {
            setLoading(true);
            setError('');

            // Step 1: Delete all organization memberships
            const { error: membershipError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('organization_id', organization.id);

            if (membershipError) {
                throw new Error('Failed to remove organization members: ' + membershipError.message);
            }

            // Step 2: Delete organization posts (if any)
            await supabase
                .from('organization_posts')
                .delete()
                .eq('organization_id', organization.id);

            // Step 3: Delete the organization itself
            const { error: orgError } = await supabase
                .from('organizations')
                .delete()
                .eq('id', organization.id);

            if (orgError) {
                throw new Error('Failed to delete organization: ' + orgError.message);
            }

            // Step 4: Update user profile to clear organization references
            await supabase
                .from('profiles')
                .update({
                    organization_choice: null,
                    selected_organization_id: null,
                    selected_organization_type: null,
                    updated_at: new Date()
                })
                .eq('id', session.user.id);

            // Success - navigate away
            alert('Organization deleted successfully.');
            navigate('/profile');
            return true;
        } catch (err) {
            console.error('Delete organization error:', err);
            setError(err.message || 'An unexpected error occurred while deleting the organization.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateOrganization = async (updateData) => {
        if (!organization) return false;

        try {
            setLoading(true);
            setError('');

            const { error: updateError } = await supabase
                .from('organizations')
                .update({
                    ...updateData,
                    updated_at: new Date()
                })
                .eq('id', organization.id);

            if (updateError) {
                setError('Failed to save changes. Please try again.');
                return false;
            }

            setOrganization(prev => ({
                ...prev,
                ...updateData
            }));

            return true;
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkMembership();
    }, [checkMembership]);

    useEffect(() => {
        if (userMembership) {
            fetchOrganizationData();
        }
    }, [fetchOrganizationData]);

    return {
        organization,
        members,
        userMembership,
        loading,
        error,
        setError,
        checkMembership,
        fetchOrganizationData,
        executeLeave,
        executeDeleteOrganization,
        updateOrganization
    };
}