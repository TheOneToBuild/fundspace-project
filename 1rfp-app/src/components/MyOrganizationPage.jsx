// Updated MyOrganizationPage.jsx with multi-admin system - based on your current code
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Shield, MapPin, Globe, Building2, Edit, AlertTriangle, LogOut, Search, Crown, UserPlus, UserMinus, Settings, Star } from 'lucide-react';
import Avatar from './Avatar.jsx';
import EnhancedOrganizationSetupPage from './OrganizationSetupPage.jsx';
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

    const checkMembership = useCallback(async () => {
        setConfirmingLeave(false); 

        if (!session?.user?.id || !profile) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        // Check for legacy admin status first (backwards compatibility)
        if (profile.managed_nonprofit_id || profile.managed_funder_id) {
            setUserMembership({ 
                role: 'super_admin',  // Updated to use super_admin instead of admin
                organization_id: profile.managed_nonprofit_id || profile.managed_funder_id, 
                organization_type: profile.managed_nonprofit_id ? 'nonprofit' : 'funder',
                is_legacy_admin: true
            });
        } else {
            // Check organization_memberships table for new system
            const { data: memberships } = await supabase
                .from('organization_memberships')
                .select('*')
                .eq('profile_id', profile.id)
                .limit(1);
                
            if (memberships && memberships.length > 0) {
                setUserMembership({...memberships[0], is_legacy_admin: false});
            } else {
                setUserMembership(null);
                setOrganization(null);
                setMembers([]);
            }
        }
    }, [profile, session]);

    useEffect(() => {
        checkMembership();
    }, [checkMembership]);

    const fetchOrganizationData = useCallback(async () => {
        if (!userMembership) {
            setLoading(false);
            return;
        }
        
        try {
            const orgTable = userMembership.organization_type === 'nonprofit' ? 'nonprofits' : 'funders';
            const { data: orgData, error: orgError } = await supabase
                .from(orgTable)
                .select('*')
                .eq('id', userMembership.organization_id)
                .single();
                
            if (orgError) throw orgError;
            setOrganization(orgData);

            const { data: membersData, error: membersError } = await supabase.rpc('get_organization_members', {
                organization_id_param: userMembership.organization_id,
                organization_type_param: userMembership.organization_type
            });
            
            if (membersError) throw membersError;
            setMembers(membersData || []);

        } catch (err) {
            console.error('Error fetching organization data:', err);
            setError('Failed to load organization data.');
        } finally {
            setLoading(false);
        }
    }, [userMembership]);

    useEffect(() => {
        fetchOrganizationData();
    }, [fetchOrganizationData]);

    const executeLeave = async () => {
        // All roles can leave the organization
        if (!userMembership) return;

        // For legacy admins (managed_nonprofit_id/managed_funder_id), we need to clear those fields
        if (userMembership.is_legacy_admin) {
            const updateField = userMembership.organization_type === 'nonprofit' ? 'managed_nonprofit_id' : 'managed_funder_id';
            
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ [updateField]: null })
                .eq('id', session.user.id);
                
            if (profileError) {
                setError('Error leaving organization: ' + profileError.message);
                setConfirmingLeave(false);
                return;
            }
        } else {
            // For new system users, delete from organization_memberships
            const { error: deleteError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('profile_id', session.user.id);

            if (deleteError) {
                setError('Error leaving organization: ' + deleteError.message);
                setConfirmingLeave(false);
                return;
            }
        }

        checkMembership();
    };

    // Admin management functions
    const handleMemberAction = (member, action) => {
        setSelectedMember(member);
        setModalAction(action);
        setIsAdminModalOpen(true);
    };

    const handleActionComplete = () => {
        setIsAdminModalOpen(false);
        setSelectedMember(null);
        setModalAction(null);
        fetchOrganizationData(); // Refresh the member list
    };

    // Enhanced filtering and sorting with new role system
    const filteredAndSortedMembers = useMemo(() => {
        return members
            .sort((a, b) => {
                // Primary sort: Role hierarchy (super_admin > admin > member)
                const roleOrder = { 'super_admin': 1, 'admin': 2, 'member': 3 };
                const aOrder = roleOrder[a.role] || 4;
                const bOrder = roleOrder[b.role] || 4;
                
                if (aOrder !== bOrder) return aOrder - bOrder;
                
                // Secondary sort: Alphabetical by name
                return (a.full_name || '').localeCompare(b.full_name || '');
            })
            .filter(member => {
                // Filter by selected role
                let roleMatch = false;
                if (roleFilter === 'all') {
                    roleMatch = true;
                } else if (roleFilter === 'admin') {
                    // Include both super_admin and admin when filtering for "admin"
                    roleMatch = member.role === 'super_admin' || member.role === 'admin';
                } else {
                    roleMatch = member.role === roleFilter;
                }

                // Filter by search query (case-insensitive search in name and title)
                const searchMatch = !searchQuery ||
                    (member.full_name && member.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (member.title && member.title.toLowerCase().includes(searchQuery.toLowerCase()));
                
                return roleMatch && searchMatch;
            });
    }, [members, searchQuery, roleFilter]);

    if (loading) {
        return <div className="p-6 text-center text-slate-500">Loading...</div>;
    }

    if (!userMembership) {
        return <EnhancedOrganizationSetupPage onJoinSuccess={checkMembership} />;
    }
    
    if (!organization) {
        return <div className="p-6 text-center text-slate-500">Loading organization details...</div>;
    }
    
    // Use new permission system with omega admin support
    const userRole = userMembership.role;
    const isOmegaAdmin = profile?.is_omega_admin || false;
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
                                {/* Enhanced role badge with Omega Admin support */}
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole, isOmegaAdmin)}`}>
                                    {isOmegaAdmin && <Star className="w-3 h-3 mr-1.5" />}
                                    {!isOmegaAdmin && userRole === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1.5" />}
                                    {!isOmegaAdmin && userRole === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1.5" />}
                                    {!isOmegaAdmin && userRole === ROLES.MEMBER && <Users className="w-3 h-3 mr-1.5" />}
                                    {getRoleDisplayName(userRole, isOmegaAdmin)}
                                </span>
                                {organization.location && (
                                    <span className="ml-4 flex items-center">
                                        <MapPin className="w-4 h-4 mr-1.5" />
                                        {organization.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        {organization.slug && (
                            <Link 
                                to={`/${userMembership.organization_type === 'nonprofit' ? 'nonprofits' : 'funders'}/${organization.slug}`} 
                                target="_blank" 
                                className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Globe className="w-4 h-4 mr-2" /> 
                                View Public Profile
                            </Link>
                        )}
                        
                        {/* Only show edit button if user has permission */}
                        {canEditOrg && (
                            <Link 
                                to="/profile/my-organization/edit" 
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                            >
                                <Edit className="w-4 h-4 mr-2" /> 
                                Edit Organization
                            </Link>
                        )}
                        
                        {/* Show leave button for all roles - members, admins, and super admins */}
                        {(userRole === ROLES.MEMBER || userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN) && (
                            <>
                                {isConfirmingLeave ? (
                                    <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                        <span className="text-sm font-medium text-red-800">Are you sure?</span>
                                        <button 
                                            onClick={executeLeave} 
                                            className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700"
                                        >
                                            Yes, Leave
                                        </button>
                                        <button 
                                            onClick={() => setConfirmingLeave(false)} 
                                            className="px-3 py-1 bg-white text-slate-700 text-xs font-bold rounded-md border border-slate-300 hover:bg-slate-100"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setConfirmingLeave(true)} 
                                        className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                    >
                                        <LogOut className="w-4 h-4 mr-2"/>
                                        Leave Organization
                                    </button>
                                )}
                            </>
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
                            <a 
                                href={organization.website} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                                <Globe className="w-4 h-4 mr-2" /> 
                                Visit Website
                            </a>
                        </div>
                    )}
                </div>
            )}
            
            {/* Enhanced Team Members section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                {/* Header with search and filter controls */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" /> 
                        Team Members ({filteredAndSortedMembers.length})
                    </h2>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-48 pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="border border-slate-300 rounded-lg text-sm py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admins Only</option>
                            <option value="member">Members Only</option>
                        </select>
                    </div>
                </div>
                
                {/* Member grid */}
                {filteredAndSortedMembers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAndSortedMembers.map((member) => (
                            <div key={member.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <Link to={`/profile/members/${member.id}`} className="block">
                                    <div className="flex items-center mb-3">
                                        <div className="flex-shrink-0 mr-3">
                                            <Avatar src={member.avatar_url} fullName={member.full_name} size="md" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {member.full_name || 'Anonymous User'}
                                            </p>
                                            <p className="text-sm text-slate-500 truncate">
                                                {member.title || 'Team Member'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                                
                                <div className="flex items-center justify-between">
                                    {/* Enhanced role badge with Omega Admin support */}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(member.role, member.is_omega_admin)}`}>
                                        {member.is_omega_admin && <Star className="w-3 h-3 mr-1" />}
                                        {!member.is_omega_admin && member.role === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1" />}
                                        {!member.is_omega_admin && member.role === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1" />}
                                        {!member.is_omega_admin && member.role === ROLES.MEMBER && <Users className="w-3 h-3 mr-1" />}
                                        {getRoleDisplayName(member.role, member.is_omega_admin)}
                                    </span>
                                    
                                    {/* Admin Action Buttons - Updated with Omega Admin support */}
                                    {canManageMembers && member.id !== session.user.id && canManageUser(userRole, member.role, isOmegaAdmin) && !member.is_omega_admin && (
                                        <div className="flex space-x-1">
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
                                                title="Remove Member"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <h3 className="font-semibold text-slate-700">No Members Found</h3>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </div>

            {/* Admin Management Modal */}
            <AdminManagementModal
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
                member={selectedMember}
                action={modalAction}
                organizationId={userMembership.organization_id}
                organizationType={userMembership.organization_type}
                onActionComplete={handleActionComplete}
            />
        </div>
    );
}