import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
    notifyOrganizationJoined, 
    notifyOrganizationLeft, 
    notifyOrganizationUpdated 
} from '../utils/organizationEvents';

export function useOrganizationData(profile, session) {
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

            if (membershipError) throw membershipError;

            if (memberships && memberships.length > 0) {
                setUserMembership(memberships[0]);
            } else {
                setUserMembership(null);
                setOrganization(null);
                setMembers([]);
            }
        } catch (err) {
            setError('Error checking membership');
        } finally {
            setLoading(false);
        }
    }, [profile, session?.user?.id]);

    const fetchOrganizationData = useCallback(async () => {
        if (!userMembership) {
            return;
        }

        try {
            setLoading(true);
            
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', userMembership.organization_id)
                .single();

            if (orgError || !orgData) throw (orgError || new Error('Organization not found'));

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

            const { data: memberData, error: memberError } = await supabase
                .from('organization_memberships')
                .select(`*, profiles (id, full_name, avatar_url, title, is_omega_admin)`)
                .eq('organization_id', userMembership.organization_id)
                .order('joined_at', { ascending: false });

            if (memberError) {
                setError('Error loading organization members');
            } else {
                setMembers(memberData || []);
            }
        } catch (err) {
            setError('Error loading organization data');
        } finally {
            setLoading(false);
        }
    }, [userMembership]);

    const executeLeave = useCallback(async () => {
        if (!userMembership || !profile?.id) return false;

        setLoading(true);
        setError('');
        try {
            const { error: deleteError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('profile_id', profile.id)
                .eq('organization_id', userMembership.organization_id);

            if (deleteError) throw deleteError;
            
            notifyOrganizationLeft(profile.id, userMembership.organization_id);

            setUserMembership(null);
            setOrganization(null);
            setMembers([]);
            return true;
        } catch (err) {
            setError('Failed to leave organization');
            return false;
        } finally {
            setLoading(false);
        }
    }, [userMembership, profile?.id]);

    const executeDeleteOrganization = useCallback(async () => {
        if (!organization || !userMembership || !profile?.id) return false;

        setLoading(true);
        setError('');
        try {
            const { error: membershipsError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('organization_id', organization.id);

            if (membershipsError) throw membershipsError;

            const { error: orgError } = await supabase
                .from('organizations')
                .delete()
                .eq('id', organization.id);

            if (orgError) throw orgError;
            
            notifyOrganizationLeft(profile.id, organization.id);

            setUserMembership(null);
            setOrganization(null);
            setMembers([]);
            return true;
        } catch (err) {
            setError('Failed to delete organization');
            return false;
        } finally {
            setLoading(false);
        }
    }, [organization, userMembership, profile?.id]);

    const updateOrganization = useCallback(async (updateData) => {
        if (!organization || !userMembership || !profile?.id) return false;

        setLoading(true);
        setError('');
        try {
            const { data: updatedOrg, error: updateError } = await supabase
                .from('organizations')
                .update(updateData)
                .eq('id', organization.id)
                .select()
                .single();

            if (updateError) throw updateError;
            
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
            notifyOrganizationUpdated(profile.id, enrichedOrgData);
            return true;
        } catch (err) {
            setError('Failed to update organization');
            return false;
        } finally {
            setLoading(false);
        }
    }, [organization, userMembership, profile?.id]);

    const joinOrganization = useCallback(async (organizationData) => {
        if (!profile?.id || !session?.user?.id) return false;

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

            if (membershipError) throw membershipError;
            
            setUserMembership({ ...membershipData, joined_at: new Date().toISOString() });
            notifyOrganizationJoined(profile.id, organizationData);
            await checkMembership();
            return true;
        } catch (err) {
            setError('Failed to join organization');
            return false;
        } finally {
            setLoading(false);
        }
    }, [profile?.id, session?.user?.id, checkMembership]);

    const createOrganization = useCallback(async (orgData, focusAreas, supportedLocations) => {
        if (!profile?.id || !session?.user?.id) return false;

        setLoading(true);
        setError('');
        try {
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

            if (orgError) throw orgError;

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
                setError('Organization created but failed to set up membership');
                return false;
            }

            setUserMembership({ ...membershipData, joined_at: new Date().toISOString() });
            notifyOrganizationJoined(profile.id, newOrg);
            await checkMembership();
            return newOrg;
        } catch (err) {
            setError('Failed to create organization');
            return false;
        } finally {
            setLoading(false);
        }
    }, [profile?.id, session?.user?.id, checkMembership]);

    useEffect(() => {
        checkMembership();
    }, [checkMembership]);

    useEffect(() => {
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