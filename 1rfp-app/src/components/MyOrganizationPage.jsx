// Updated MyOrganizationPage.jsx with Omega Admin support
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Shield, MapPin, Globe, Building2, Edit, AlertTriangle, LogOut, Search, Crown, UserPlus, UserMinus, Settings, Star } from 'lucide-react';
import Avatar from './Avatar.jsx';
import EnhancedOrganizationSetupPage from './OrganizationSetupPage.jsx';
import OmegaAdminOrgSelector from './OmegaAdminOrgSelector.jsx';
import AdminManagementModal from './AdminManagementModal.jsx';
// Import our new permission utilities
import { hasPermission, PERMISSIONS, ROLES, getRoleDisplayName, getRoleBadgeColor, canManageUser } from '../utils/permissions.js';

export default function MyOrganizationPage() {
    const { profile, session } = useOutletContext();
    
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userMembership, setUserMembership] = useState(null);
    const [isConfirmingLeave, setConfirmingLeave] = useState(false);
    
    // Search and filter controls (from your current code)
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    
    // Modal state for admin management
    const [selectedMember, setSelectedMember] = useState(null);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null);

    // Check if user is Omega Admin
    const isOmegaAdmin = profile?.is_omega_admin === true;

    const checkMembership = useCallback(async () => {
        setConfirmingLeave(false); 

        if (!session?.user?.id || !profile) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        // FIXED: For Omega Admins, show the organization selector instead
        if (isOmegaAdmin) {
            setLoading(false);
            return; // Don't check membership for Omega Admins
        }

        // Check for legacy admin status first (backwards compatibility)
        if (profile.managed_nonprofit_id || profile.managed_funder_id) {
            setUserMembership({ 
                role: 'super_admin',  // Updated to use super_admin instead of admin
                organization_id: profile.managed_nonprofit_id || profile.managed_funder_id, 
                organization_type: profile.managed_nonprofit_id ? 'nonprofit' : 'funder' 
            });
            setLoading(false);
            return;
        }

        // Check new membership system
        const { data: memberships, error: membershipError } = await supabase
            .from('organization_memberships')
            .select('*')
            .eq('profile_id', profile.id);

        if (membershipError) {
            console.error('Error fetching membership:', membershipError);
            setError('Error loading membership information');
            setLoading(false);
            return;
        }

        if (memberships && memberships.length > 0) {
            setUserMembership(memberships[0]); // Take the first membership for now
        } else {
            setUserMembership(null);
        }

        setLoading(false);
    }, [session, profile, isOmegaAdmin]);

    const fetchOrganizationData = useCallback(async () => {
        if (!userMembership) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const table = userMembership.organization_type === 'nonprofit' ? 'nonprofits' : 'funders';
            
            // Fetch organization data
            const { data: orgData, error: orgError } = await supabase
                .from(table)
                .select('*')
                .eq('id', userMembership.organization_id)
                .single();

            if (orgError) {
                setError('Error loading organization data');
                console.error('Organization fetch error:', orgError);
                setLoading(false);
                return;
            }

            setOrganization({ ...orgData, type: userMembership.organization_type });

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
                .eq('organization_type', userMembership.organization_type)
                .order('role', { ascending: false })
                .order('joined_at', { ascending: true });

            if (memberError) {
                console.error('Member fetch error:', memberError);
            } else {
                setMembers(memberData || []);
            }

        } catch (err) {
            setError('Error loading organization data');
            console.error('General fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [userMembership]);

    useEffect(() => {
        checkMembership();
    }, [checkMembership]);

    useEffect(() => {
        if (userMembership) {
            fetchOrganizationData();
        }
    }, [fetchOrganizationData]);

    const executeLeave = async () => {
        if (!userMembership || userMembership.role === 'admin') return;

        const { error: deleteError } = await supabase
            .from('organization_memberships')
            .delete()
            .eq('profile_id', session.user.id);

        if (deleteError) {
            setError('Error leaving organization: ' + deleteError.message);
            setConfirmingLeave(false);
        } else {
            checkMembership();
        }
    };

    // Handle member actions (promote, demote, remove)
    const handleMemberAction = async (member, action) => {
        if (!userMembership) return;

        const userRole = userMembership.role;
        const targetRole = member.role;
        
        // Use new permission system with omega admin support
        if (!canManageUser(userRole, targetRole, isOmegaAdmin)) {
            setError('You do not have permission to manage this user.');
            return;
        }

        // Prevent actions on omega admins (except by other omega admins)
        if (member.profiles.is_omega_admin && !isOmegaAdmin) {
            setError('You cannot manage Omega Admin users.');
            return;
        }

        setSelectedMember(member);
        setModalAction(action);
        setIsAdminModalOpen(true);
    };

    // Filter members based on search and role filter
    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            const matchesSearch = member.profiles.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                member.profiles.title?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || 
                              (roleFilter === 'omega_admin' && member.profiles.is_omega_admin) ||
                              (roleFilter === 'super_admin' && member.role === ROLES.SUPER_ADMIN && !member.profiles.is_omega_admin) ||
                              (roleFilter === 'admin' && member.role === ROLES.ADMIN) ||
                              (roleFilter === 'member' && member.role === ROLES.MEMBER);
            
            return matchesSearch && matchesRole;
        });
    }, [members, searchQuery, roleFilter]);

    if (loading) {
        return <div className="p-6 text-center text-slate-500">Loading...</div>;
    }

    // FIXED: Show Omega Admin organization selector if user is Omega Admin
    if (isOmegaAdmin) {
        return <OmegaAdminOrgSelector />;
    }

    if (!userMembership) {
        return <EnhancedOrganizationSetupPage onJoinSuccess={checkMembership} />;
    }
    
    if (!organization) {
        return <div className="p-6 text-center text-slate-500">Loading organization details...</div>;
    }
    
    // Use new permission system with omega admin support
    const userRole = userMembership.role;
    const canEditOrg = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);
    const canManageMembers = hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin);
    const canManageAdmins = hasPermission(userRole, PERMISSIONS.MANAGE_ADMINS, isOmegaAdmin);

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <Avatar src={organization.logo_url} fullName={organization.name} size="lg" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{organization.name}</h1>
                            <p className="text-slate-600 mt-1">{organization.tagline}</p>
                            <div className="flex items-center mt-2 text-sm text-slate-500">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole, isOmegaAdmin)}`}>
                                    {userRole === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1.5" />}
                                    {userRole === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1.5" />}
                                    {userRole === ROLES.MEMBER && <Users className="w-3 h-3 mr-1.5" />}
                                    {isOmegaAdmin && <Star className="w-3 h-3 mr-1.5" />}
                                    {getRoleDisplayName(userRole, isOmegaAdmin)}
                                </span>
                                {organization.location && <span className="ml-4 flex items-center"><MapPin className="w-4 h-4 mr-1.5" />{organization.location}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        {organization.slug && (
                            <Link to={`/${userMembership.organization_type === 'nonprofit' ? 'nonprofits' : 'funders'}/${organization.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">
                                View Public Profile
                            </Link>
                        )}
                        {canEditOrg && (
                            <Link to="/profile/my-organization/edit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm">
                                <Edit size={16} className="mr-2" />
                                Edit Organization
                            </Link>
                        )}
                        {userRole === ROLES.MEMBER && (
                            <button
                                onClick={() => setConfirmingLeave(true)}
                                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50"
                            >
                                <LogOut size={16} className="mr-2" />
                                Leave Organization
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* About Us section */}
            {organization.description && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">About Us</h2>
                    <p className="text-slate-600 leading-relaxed">{organization.description}</p>
                    {organization.website && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <a href={organization.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                                <Globe className="w-4 h-4 mr-2" /> Visit Website
                            </a>
                        </div>
                    )}
                </div>
            )}
            
            {/* Team Members section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" /> Team Members ({members.length})
                    </h2>
                </div>

                {/* Search and filter controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="all">All Roles</option>
                        <option value="omega_admin">Omega Admins</option>
                        <option value="super_admin">Super Admins</option>
                        <option value="admin">Admins</option>
                        <option value="member">Members</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map((member) => (
                        <div key={member.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <Link to={`/profile/members/${member.profiles.id}`} className="flex items-center flex-1 min-w-0">
                                    <div className="flex-shrink-0 mr-3">
                                        <Avatar src={member.profiles.avatar_url} fullName={member.profiles.full_name} size="md" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-900 truncate">{member.profiles.full_name || 'Anonymous User'}</p>
                                        <p className="text-sm text-slate-500 truncate">{member.profiles.title || 'Team Member'}</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getRoleBadgeColor(member.role, member.profiles.is_omega_admin)}`}>
                                            {member.profiles.is_omega_admin && <Star className="w-3 h-3 mr-1" />}
                                            {!member.profiles.is_omega_admin && member.role === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1" />}
                                            {!member.profiles.is_omega_admin && member.role === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1" />}
                                            {!member.profiles.is_omega_admin && member.role === ROLES.MEMBER && <Users className="w-3 h-3 mr-1" />}
                                            {getRoleDisplayName(member.role, member.profiles.is_omega_admin)}
                                        </span>
                                    </div>
                                </Link>
                                
                                {/* Admin Action Buttons - Updated with Omega Admin support */}
                                {canManageMembers && member.profiles.id !== session.user.id && canManageUser(userRole, member.role, isOmegaAdmin) && !member.profiles.is_omega_admin && (
                                    <div className="flex space-x-1 ml-2">
                                        {member.role === ROLES.MEMBER && canManageAdmins && (
                                            <button
                                                onClick={() => handleMemberAction(member, 'promote')}
                                                className="text-green-600 hover:text-green-800 p-1 rounded"
                                                title="Promote to Admin"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        )}
                                        {(member.role === ROLES.ADMIN || member.role === ROLES.SUPER_ADMIN) && canManageAdmins && (
                                            <button
                                                onClick={() => handleMemberAction(member, 'demote')}
                                                className="text-orange-600 hover:text-orange-800 p-1 rounded"
                                                title="Demote to Member"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleMemberAction(member, 'remove')}
                                            className="text-red-600 hover:text-red-800 p-1 rounded"
                                            title="Remove from Organization"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        {searchQuery || roleFilter !== 'all' ? 'No members match your search criteria.' : 'No members found.'}
                    </div>
                )}
            </div>

            {/* Confirmation Modal for Leaving Organization */}
            {isConfirmingLeave && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Leave Organization</h3>
                        <p className="text-slate-600 mb-6">
                            Are you sure you want to leave {organization.name}? You'll need to be re-invited to rejoin.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setConfirmingLeave(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeLeave}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Leave Organization
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Management Modal */}
            {isAdminModalOpen && selectedMember && (
                <AdminManagementModal
                    member={selectedMember}
                    action={modalAction}
                    organization={organization}
                    onClose={() => {
                        setIsAdminModalOpen(false);
                        setSelectedMember(null);
                        setModalAction(null);
                    }}
                    onSuccess={() => {
                        setIsAdminModalOpen(false);
                        setSelectedMember(null);
                        setModalAction(null);
                        fetchOrganizationData(); // Refresh the member list
                    }}
                />
            )}
        </div>
    );
}