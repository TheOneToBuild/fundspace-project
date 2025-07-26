// src/hooks/useOrganizationData.js - Complete with Instant Events Integration
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    notifyOrganizationJoined, 
    notifyOrganizationLeft, 
    notifyOrganizationUpdated 
} from '../utils/organizationEvents';

export function useOrganizationData(profile, session) {
    const navigate = useNavigate();
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [userMembership, setUserMembership] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    console.log('🎯 useOrganizationData hook initialized for profile:', profile?.id);

    const checkMembership = useCallback(async () => {
        if (!session?.user?.id || !profile) {
            console.log('❌ No session or profile, skipping membership check');
            setLoading(false);
            return;
        }

        console.log('🔍 Checking membership for profile:', profile.id);
        setLoading(true);
        setError('');

        if (profile?.is_omega_admin === true) {
            console.log('👑 Omega admin detected, skipping membership check');
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
                console.error('❌ Membership check error:', membershipError);
                setError('Error checking membership');
                setLoading(false);
                return;
            }

            if (memberships && memberships.length > 0) {
                console.log('✅ Found membership:', memberships[0]);
                setUserMembership(memberships[0]);
            } else {
                console.log('📝 No membership found');
                setUserMembership(null);
                setOrganization(null);
                setMembers([]);
            }
        } catch (err) {
            console.error('❌ Membership check error:', err);
            setError('Error checking membership');
        } finally {
            setLoading(false);
        }
    }, [profile, session?.user?.id]);

    const fetchOrganizationData = useCallback(async () => {
        if (!userMembership) {
            console.log('📝 No user membership, skipping organization data fetch');
            return;
        }

        console.log('🔍 Fetching organization data for membership:', userMembership);

        try {
            setLoading(true);
            
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', userMembership.organization_id)
                .single();

            if (orgError || !orgData) {
                console.error('❌ Organization not found:', orgError);
                setError('Organization not found');
                setLoading(false);
                return;
            }

            console.log('✅ Found organization:', orgData);
            
            const enrichedOrgData = { 
                ...orgData, 
                type: userMembership.organization_type,
                logo_url: orgData.image_url,
                tagline: orgData.tagline || '', 
                description: orgData.description || '', 
                location: orgData.location || '', 
                website: orgData.website || '', 
                contact_email: orgData.contact_email || '',
            };
            
            setOrganization(enrichedOrgData);

            // Fetch organization members
            const { data: memberData, error: memberError } = await supabase
                .from('organization_memberships')
                .select(`
                    *,
                    profiles (
                        id,
                        full_name,
                        avatar_url,
                        title,
                        is_omega_admin
                    )
                `)
                .eq('organization_id', userMembership.organization_id)
                .order('joined_at', { ascending: false });

            if (memberError) {
                console.error('❌ Error fetching members:', memberError);
                setError('Error loading organization members');
            } else {
                console.log('✅ Found members:', memberData?.length || 0);
                setMembers(memberData || []);
            }

        } catch (err) {
            console.error('❌ Error fetching organization data:', err);
            setError('Error loading organization data');
        } finally {
            setLoading(false);
        }
    }, [userMembership]);

    // Enhanced leave organization function with instant events
    const executeLeave = useCallback(async () => {
        if (!userMembership || !profile?.id) {
            console.log('❌ Cannot leave: no membership or profile');
            return false;
        }

        console.log('👋 Leaving organization:', userMembership.organization_id);
        setLoading(true);
        setError('');

        try {
            const { error: deleteError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('profile_id', profile.id)
                .eq('organization_id', userMembership.organization_id);

            if (deleteError) {
                console.error('❌ Error leaving organization:', deleteError);
                setError('Failed to leave organization');
                return false;
            }

            console.log('✅ Successfully left organization');
            
            // 🚀 INSTANT EVENT: Notify organization left
            notifyOrganizationLeft(profile.id, userMembership.organization_id);

            // Clear state
            setUserMembership(null);
            setOrganization(null);
            setMembers([]);

            return true;
        } catch (err) {
            console.error('❌ Unexpected error leaving organization:', err);
            setError('Unexpected error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    }, [userMembership, profile?.id]);

    // Enhanced delete organization function with instant events
    const executeDeleteOrganization = useCallback(async () => {
        if (!organization || !userMembership || !profile?.id) {
            console.log('❌ Cannot delete: missing organization, membership, or profile');
            return false;
        }

        console.log('🗑️ Deleting organization:', organization.id);
        setLoading(true);
        setError('');

        try {
            // Delete organization memberships first
            const { error: membershipsError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('organization_id', organization.id);

            if (membershipsError) {
                console.error('❌ Error deleting memberships:', membershipsError);
                setError('Failed to delete organization memberships');
                return false;
            }

            // Delete the organization
            const { error: orgError } = await supabase
                .from('organizations')
                .delete()
                .eq('id', organization.id);

            if (orgError) {
                console.error('❌ Error deleting organization:', orgError);
                setError('Failed to delete organization');
                return false;
            }

            console.log('✅ Successfully deleted organization');
            
            // 🚀 INSTANT EVENT: Notify organization left (since it's deleted)
            notifyOrganizationLeft(profile.id, organization.id);

            // Clear state
            setUserMembership(null);
            setOrganization(null);
            setMembers([]);

            return true;
        } catch (err) {
            console.error('❌ Unexpected error deleting organization:', err);
            setError('Unexpected error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    }, [organization, userMembership, profile?.id]);

    // Enhanced update organization function with instant events
    const updateOrganization = useCallback(async (updateData) => {
        if (!organization || !userMembership || !profile?.id) {
            console.log('❌ Cannot update: missing organization, membership, or profile');
            return false;
        }

        console.log('📝 Updating organization:', organization.id, updateData);
        setLoading(true);
        setError('');

        try {
            const { data: updatedOrg, error: updateError } = await supabase
                .from('organizations')
                .update(updateData)
                .eq('id', organization.id)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Error updating organization:', updateError);
                setError('Failed to update organization');
                return false;
            }

            console.log('✅ Successfully updated organization:', updatedOrg);
            
            // Update local state
            const enrichedOrgData = { 
                ...updatedOrg, 
                type: userMembership.organization_type,
                logo_url: updatedOrg.image_url,
                tagline: updatedOrg.tagline || '', 
                description: updatedOrg.description || '', 
                location: updatedOrg.location || '', 
                website: updatedOrg.website || '', 
                contact_email: updatedOrg.contact_email || '',
            };
            
            setOrganization(enrichedOrgData);
            
            // 🚀 INSTANT EVENT: Notify organization updated
            notifyOrganizationUpdated(profile.id, enrichedOrgData);

            return true;
        } catch (err) {
            console.error('❌ Unexpected error updating organization:', err);
            setError('Unexpected error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    }, [organization, userMembership, profile?.id]);

    // Enhanced join organization function with instant events (for use in other components)
    const joinOrganization = useCallback(async (organizationData) => {
        if (!profile?.id || !session?.user?.id) {
            console.log('❌ Cannot join: no profile or session');
            return false;
        }

        console.log('🤝 Joining organization:', organizationData);
        setLoading(true);
        setError('');

        try {
            const membershipData = {
                profile_id: profile.id,
                organization_id: organizationData.id,
                organization_type: organizationData.type,
                role: 'member',
                membership_type: 'staff',
                is_public: true
            };

            const { error: membershipError } = await supabase
                .from('organization_memberships')
                .insert(membershipData);

            if (membershipError) {
                console.error('❌ Error joining organization:', membershipError);
                setError('Failed to join organization');
                return false;
            }

            console.log('✅ Successfully joined organization');
            
            // Update membership state
            setUserMembership({
                ...membershipData,
                joined_at: new Date().toISOString()
            });

            // 🚀 INSTANT EVENT: Notify organization joined
            notifyOrganizationJoined(profile.id, organizationData);

            // Refresh organization data
            await checkMembership();

            return true;
        } catch (err) {
            console.error('❌ Unexpected error joining organization:', err);
            setError('Unexpected error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    }, [profile?.id, session?.user?.id, checkMembership]);

    // Enhanced create organization function with instant events
    const createOrganization = useCallback(async (orgData, focusAreas, supportedLocations) => {
        if (!profile?.id || !session?.user?.id) {
            console.log('❌ Cannot create: no profile or session');
            return false;
        }

        console.log('🏗️ Creating organization:', orgData);
        setLoading(true);
        setError('');

        try {
            // Create organization
            const createData = {
                ...orgData,
                admin_profile_id: profile.id,
                is_verified: false,
                extended_data: {
                    focus_areas: focusAreas || [],
                    supported_locations: supportedLocations || []
                }
            };

            const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert(createData)
                .select()
                .single();

            if (orgError) {
                console.error('❌ Error creating organization:', orgError);
                setError('Failed to create organization');
                return false;
            }

            console.log('✅ Successfully created organization:', newOrg);

            // Create membership for creator (as super_admin)
            const membershipData = {
                profile_id: profile.id,
                organization_id: newOrg.id,
                organization_type: newOrg.type,
                role: 'super_admin',
                membership_type: 'staff',
                is_public: true
            };

            const { error: membershipError } = await supabase
                .from('organization_memberships')
                .insert(membershipData);

            if (membershipError) {
                console.error('❌ Error creating membership:', membershipError);
                setError('Organization created but failed to set up membership');
                return false;
            }

            console.log('✅ Successfully created membership');

            // Update local state
            setUserMembership({
                ...membershipData,
                joined_at: new Date().toISOString()
            });

            // 🚀 INSTANT EVENT: Notify organization joined (created and joined)
            notifyOrganizationJoined(profile.id, newOrg);

            // Refresh organization data
            await checkMembership();

            return newOrg;
        } catch (err) {
            console.error('❌ Unexpected error creating organization:', err);
            setError('Unexpected error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    }, [profile?.id, session?.user?.id, checkMembership]);

    // Effect to check membership when profile changes
    useEffect(() => {
        console.log('🔄 Profile changed, checking membership...');
        checkMembership();
    }, [checkMembership]);

    // Effect to fetch organization data when membership changes
    useEffect(() => {
        console.log('🔄 Membership changed, fetching organization data...');
        fetchOrganizationData();
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
        updateOrganization,
        joinOrganization,
        createOrganization
    };
}