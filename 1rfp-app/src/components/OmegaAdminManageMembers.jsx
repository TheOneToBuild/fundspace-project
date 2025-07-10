// src/components/OmegaAdminManageMembers.jsx - Complete with Super Admin support
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Star, 
    AlertTriangle, 
    ArrowLeft,
    Search,
    Filter,
    Users,
    Shield,
    Crown,
    UserPlus,
    UserMinus,
    Trash2,
    ChevronUp,
    ChevronDown,
    Building2,
    CheckCircle,
    XCircle,
    MoreVertical
} from 'lucide-react';
import Avatar from './Avatar.jsx';
import { 
    isPlatformAdmin, 
    ROLES, 
    getRoleDisplayName, 
    getRoleBadgeColor,
    canPromoteToRole,
    canDemoteFromRole,
    canAccessMemberManagement
} from '../utils/permissions.js';

export default function OmegaAdminManageMembers() {
    const { profile } = useOutletContext();
    const { orgType, orgId } = useParams();
    
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('role'); // 'role', 'name', 'joined'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
    const [currentUserRole, setCurrentUserRole] = useState(null);
    
    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: '', // 'remove', 'promote', 'demote'
        member: null,
        newRole: null
    });

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (isOmegaAdmin && orgType && orgId) {
            fetchOrganizationAndMembers();
        }
    }, [isOmegaAdmin, orgType, orgId]);

    // Get current user's role in this organization
    useEffect(() => {
        const getCurrentUserRole = async () => {
            if (!profile?.id || !orgId || !orgType) return;
            
            // Skip for omega admins since they don't have org memberships
            if (isPlatformAdmin(profile?.is_omega_admin)) {
                setCurrentUserRole('omega_admin');
                return;
            }
            
            try {
                const { data, error } = await supabase
                    .from('organization_memberships')
                    .select('role')
                    .eq('profile_id', profile.id)
                    .eq('organization_id', parseInt(orgId, 10))
                    .eq('organization_type', orgType)
                    .single();
                    
                if (!error && data) {
                    setCurrentUserRole(data.role);
                }
            } catch (err) {
                console.error('Error fetching user role:', err);
            }
        };
        
        getCurrentUserRole();
    }, [profile?.id, orgId, orgType, profile?.is_omega_admin]);

    const fetchOrganizationAndMembers = async () => {
        try {
            setLoading(true);
            setError('');
            
            const tableName = orgType === 'nonprofit' ? 'nonprofits' : 'funders';
            
            // FIXED: Convert orgId to number for database query
            const organizationId = parseInt(orgId, 10);
            
            if (isNaN(organizationId)) {
                throw new Error('Invalid organization ID');
            }
            
            // FIXED: Use correct columns based on the schema
            let selectColumns = 'id, name, slug';
            
            if (orgType === 'nonprofit') {
                // For nonprofits: id, name, tagline, slug, image_url
                selectColumns += ', tagline, image_url';
            } else {
                // For funders: id, name, slug, logo_url (NO tagline column)
                selectColumns += ', logo_url';
            }
            
            const { data: orgData, error: orgError } = await supabase
                .from(tableName)
                .select(selectColumns)
                .eq('id', organizationId) // Use converted number
                .single();

            if (orgError) throw orgError;
            if (!orgData) throw new Error('Organization not found');

            setOrganization({ ...orgData, type: orgType });

            // Fetch organization members - FIXED: Use converted number for organization_id
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
                .eq('organization_id', organizationId) // Use converted number
                .eq('organization_type', orgType)
                .order('role', { ascending: false })
                .order('joined_at', { ascending: true });

            if (memberError) {
                console.error('Member fetch error:', memberError);
                setError('Failed to load organization members');
            } else {
                setMembers(memberData || []);
            }
            
        } catch (err) {
            console.error('Error fetching organization:', err);
            setError('Failed to load organization: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle member role changes
    const handleRoleChange = async (member, newRole) => {
        try {
            setError('');
            setSuccess('');

            // Check permissions before attempting
            if (!canPromoteToRole(currentUserRole, newRole, isOmegaAdmin)) {
                setError('You do not have permission to assign this role.');
                return;
            }

            // FIXED: Convert orgId to number for database query
            const organizationId = parseInt(orgId, 10);

            const { error: updateError } = await supabase
                .from('organization_memberships')
                .update({ role: newRole })
                .eq('profile_id', member.profile_id)
                .eq('organization_id', organizationId); // Use converted number

            if (updateError) throw updateError;

            setSuccess(`Successfully updated ${member.profiles.full_name} to ${getRoleDisplayName(newRole)}`);
            await fetchOrganizationAndMembers();
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
            
        } catch (err) {
            console.error('Error updating member role:', err);
            setError('Failed to update member role: ' + err.message);
        }
    };

    // Handle member removal
    const handleRemoveMember = async (member) => {
        try {
            setError('');
            setSuccess('');

            // Check permissions before attempting
            if (!isOmegaAdmin && currentUserRole !== ROLES.SUPER_ADMIN) {
                setError('You do not have permission to remove members.');
                return;
            }

            // FIXED: Convert orgId to number for database query
            const organizationId = parseInt(orgId, 10);

            const { error: deleteError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('profile_id', member.profile_id)
                .eq('organization_id', organizationId); // Use converted number

            if (deleteError) throw deleteError;

            setSuccess(`Successfully removed ${member.profiles.full_name} from the organization`);
            await fetchOrganizationAndMembers();
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
            
        } catch (err) {
            console.error('Error removing member:', err);
            setError('Failed to remove member: ' + err.message);
        }
    };

    // Confirmation modal handlers
    const openConfirmModal = (type, member, newRole = null) => {
        setConfirmModal({
            isOpen: true,
            type,
            member,
            newRole
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal({
            isOpen: false,
            type: '',
            member: null,
            newRole: null
        });
    };

    const executeAction = async () => {
        const { type, member, newRole } = confirmModal;
        
        if (type === 'remove') {
            await handleRemoveMember(member);
        } else if (type === 'promote' || type === 'demote') {
            await handleRoleChange(member, newRole);
        }
        
        closeConfirmModal();
    };

    // Filter and sort members
    const filteredAndSortedMembers = useMemo(() => {
        let filtered = members.filter(member => {
            const matchesSearch = !searchQuery || 
                member.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.profiles?.title?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || 
                              (roleFilter === 'omega_admin' && member.profiles?.is_omega_admin) ||
                              (roleFilter === 'super_admin' && member.role === ROLES.SUPER_ADMIN && !member.profiles?.is_omega_admin) ||
                              (roleFilter === 'admin' && member.role === ROLES.ADMIN) ||
                              (roleFilter === 'member' && member.role === ROLES.MEMBER);
            
            return matchesSearch && matchesRole;
        });

        // Sort the filtered results
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.profiles?.full_name || '';
                    bValue = b.profiles?.full_name || '';
                    break;
                case 'joined':
                    aValue = new Date(a.joined_at);
                    bValue = new Date(b.joined_at);
                    break;
                case 'role':
                default:
                    // Custom role sorting: omega_admin > super_admin > admin > member
                    const roleOrder = {
                        [ROLES.SUPER_ADMIN]: 3,
                        [ROLES.ADMIN]: 2,
                        [ROLES.MEMBER]: 1
                    };
                    aValue = a.profiles?.is_omega_admin ? 4 : roleOrder[a.role] || 0;
                    bValue = b.profiles?.is_omega_admin ? 4 : roleOrder[b.role] || 0;
                    break;
            }
            
            if (sortOrder === 'desc') {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            } else {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
        });

        return filtered;
    }, [members, searchQuery, roleFilter, sortBy, sortOrder]);

    // Access denied for non-omega admins and non-super admins
    if (!currentUserRole || !canAccessMemberManagement(currentUserRole, isOmegaAdmin)) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h1>
                        <p className="text-slate-600 mb-6">
                            This page is only accessible to Omega Admins and Super Admins.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl text-white">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Loading Organization Members...</h1>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                    <p className="text-slate-500">Loading member details...</p>
                </div>
            </div>
        );
    }

    if (error && !organization) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl text-white">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Organization Not Found</h1>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link 
                        to="/profile/omega-admin/organizations"
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Organizations
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Manage Organization Members</h1>
                            <p className="text-purple-100 mt-1">
                                {organization?.name} ({organization?.type === 'nonprofit' ? 'Nonprofit' : 'Funder'}) • {members.length} members
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            to={`/profile/omega-admin/organizations/edit/${organization?.type}/${organization?.id}`}
                            className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                        >
                            <Building2 className="w-4 h-4 mr-2" />
                            Edit Organization
                        </Link>
                        <Link
                            to="/profile/omega-admin/organizations"
                            className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{success}</span>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <XCircle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members by name, email, or title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Roles</option>
                            <option value="omega_admin">Omega Admins</option>
                            <option value="super_admin">Super Admins</option>
                            <option value="admin">Admins</option>
                            <option value="member">Members</option>
                        </select>
                    </div>

                    {/* Sort Controls */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-600">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="role">Role</option>
                            <option value="name">Name</option>
                            <option value="joined">Join Date</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="mt-4 text-sm text-slate-600">
                    Showing {filteredAndSortedMembers.length} of {members.length} members
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Organization Members</h2>
                </div>

                {filteredAndSortedMembers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        {searchQuery || roleFilter !== 'all' ? 'No members match your search criteria.' : 'No members found.'}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {filteredAndSortedMembers.map((member) => (
                            <div key={member.profile_id} className="p-6 hover:bg-slate-50">
                                <div className="flex items-center justify-between">
                                    {/* Member Info */}
                                    <div className="flex items-center space-x-4 flex-1">
                                        <Avatar 
                                            src={member.profiles?.avatar_url} 
                                            fullName={member.profiles?.full_name} 
                                            size="lg" 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3 className="text-lg font-medium text-slate-800 truncate">
                                                    {member.profiles?.full_name || 'Unknown User'}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role, member.profiles?.is_omega_admin)}`}>
                                                    {member.profiles?.is_omega_admin && <Star className="w-3 h-3 mr-1" />}
                                                    {!member.profiles?.is_omega_admin && member.role === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1" />}
                                                    {!member.profiles?.is_omega_admin && member.role === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1" />}
                                                    {!member.profiles?.is_omega_admin && member.role === ROLES.MEMBER && <Users className="w-3 h-3 mr-1" />}
                                                    {getRoleDisplayName(member.role, member.profiles?.is_omega_admin)}
                                                </span>
                                            </div>
                                            {member.profiles?.title && (
                                                <p className="text-slate-600 truncate">{member.profiles.title}</p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-1">
                                                Joined {new Date(member.joined_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons - Show for manageable members */}
                                    {!member.profiles?.is_omega_admin && currentUserRole && canAccessMemberManagement(currentUserRole, isOmegaAdmin) && (
                                        <div className="flex items-center space-x-2 ml-4">
                                            {/* Promote Buttons */}
                                            {member.role === ROLES.MEMBER && canPromoteToRole(currentUserRole, ROLES.ADMIN, isOmegaAdmin) && (
                                                <button
                                                    onClick={() => openConfirmModal('promote', member, ROLES.ADMIN)}
                                                    className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                    title="Promote to Admin"
                                                >
                                                    <UserPlus className="w-4 h-4 mr-1" />
                                                    Promote
                                                </button>
                                            )}
                                            
                                            {member.role === ROLES.ADMIN && (
                                                <>
                                                    {canPromoteToRole(currentUserRole, ROLES.SUPER_ADMIN, isOmegaAdmin) && (
                                                        <button
                                                            onClick={() => openConfirmModal('promote', member, ROLES.SUPER_ADMIN)}
                                                            className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                                            title="Promote to Super Admin"
                                                        >
                                                            <Crown className="w-4 h-4 mr-1" />
                                                            Super Admin
                                                        </button>
                                                    )}
                                                    {canDemoteFromRole(currentUserRole, member.role, isOmegaAdmin) && (
                                                        <button
                                                            onClick={() => openConfirmModal('demote', member, ROLES.MEMBER)}
                                                            className="inline-flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                                                            title="Demote to Member"
                                                        >
                                                            <UserMinus className="w-4 h-4 mr-1" />
                                                            Demote
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            
                                            {member.role === ROLES.SUPER_ADMIN && canDemoteFromRole(currentUserRole, member.role, isOmegaAdmin) && (
                                                <button
                                                    onClick={() => openConfirmModal('demote', member, ROLES.ADMIN)}
                                                    className="inline-flex items-center px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                                                    title="Demote to Admin"
                                                >
                                                    <UserMinus className="w-4 h-4 mr-1" />
                                                    Demote
                                                </button>
                                            )}

                                            {/* Remove Button - Available to Super Admins and Omega Admins */}
                                            {(isOmegaAdmin || currentUserRole === ROLES.SUPER_ADMIN) && (
                                                <button
                                                    onClick={() => openConfirmModal('remove', member)}
                                                    className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                    title="Remove from Organization"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Omega Admin indicator (no actions) */}
                                    {member.profiles?.is_omega_admin && (
                                        <div className="ml-4">
                                            <span className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg">
                                                <Star className="w-4 h-4 mr-1" />
                                                Platform Admin
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            {confirmModal.type === 'remove' && 'Remove Member'}
                            {confirmModal.type === 'promote' && 'Promote Member'}
                            {confirmModal.type === 'demote' && 'Demote Member'}
                        </h3>
                        
                        <div className="mb-6">
                            {confirmModal.type === 'remove' && (
                                <p className="text-slate-600">
                                    Are you sure you want to remove <strong>{confirmModal.member?.profiles?.full_name}</strong> from {organization?.name}? 
                                    This action cannot be undone.
                                </p>
                            )}
                            {confirmModal.type === 'promote' && (
                                <p className="text-slate-600">
                                    Are you sure you want to promote <strong>{confirmModal.member?.profiles?.full_name}</strong> to{' '}
                                    <strong>{getRoleDisplayName(confirmModal.newRole)}</strong>?
                                </p>
                            )}
                            {confirmModal.type === 'demote' && (
                                <p className="text-slate-600">
                                    Are you sure you want to demote <strong>{confirmModal.member?.profiles?.full_name}</strong> to{' '}
                                    <strong>{getRoleDisplayName(confirmModal.newRole)}</strong>?
                                </p>
                            )}
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={closeConfirmModal}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                                    confirmModal.type === 'remove' 
                                        ? 'bg-red-600 hover:bg-red-700' 
                                        : confirmModal.type === 'promote'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                            >
                                {confirmModal.type === 'remove' && 'Remove Member'}
                                {confirmModal.type === 'promote' && 'Promote'}
                                {confirmModal.type === 'demote' && 'Demote'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}