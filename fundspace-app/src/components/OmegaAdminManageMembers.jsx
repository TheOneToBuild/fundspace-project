// src/components/OmegaAdminManageMembers.jsx - FIXED: Use unified organizations table
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
            
            // FIXED: Use unified organizations table
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('id, name, type, slug, tagline, image_url')
                .eq('id', parseInt(orgId, 10))
                .eq('type', orgType)
                .single();

            if (orgError) throw orgError;
            if (!orgData) throw new Error('Organization not found');

            setOrganization({ ...orgData, type: orgType });

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
                .eq('organization_id', parseInt(orgId, 10))
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

            const { error: updateError } = await supabase
                .from('organization_memberships')
                .update({ role: newRole })
                .eq('profile_id', member.profile_id)
                .eq('organization_id', parseInt(orgId, 10))
                .eq('organization_type', orgType);

            if (updateError) throw updateError;

            setSuccess(`Successfully updated ${member.profiles.full_name}'s role to ${getRoleDisplayName(newRole)}`);
            
            // Refresh members list
            fetchOrganizationAndMembers();
            
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

            const { error: removeError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('profile_id', member.profile_id)
                .eq('organization_id', parseInt(orgId, 10))
                .eq('organization_type', orgType);

            if (removeError) throw removeError;

            setSuccess(`Successfully removed ${member.profiles.full_name} from the organization`);
            
            // Refresh members list
            fetchOrganizationAndMembers();
            
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

    const handleConfirmAction = async () => {
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
        let filtered = members;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(member =>
                member.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.profiles?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.role?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(member => member.role === roleFilter);
        }

        // Sort members
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
                    // Custom role ordering: super_admin > admin > member, omega_admin always first
                    const roleOrder = { 'super_admin': 3, 'admin': 2, 'member': 1 };
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
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
                            <h1 className="text-2xl font-bold">Manage Members</h1>
                            <p className="text-purple-100 mt-1">
                                {organization?.name} - {members.length} member{members.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Link 
                        to="/profile/omega-admin/organizations"
                        className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Organizations
                    </Link>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{success}</span>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search members by name, title, or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {/* Role Filter */}
                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-slate-500" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="super_admin">Super Admins</option>
                            <option value="admin">Admins</option>
                            <option value="member">Members</option>
                        </select>
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center space-x-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="role">Sort by Role</option>
                            <option value="name">Sort by Name</option>
                            <option value="joined">Sort by Join Date</option>
                        </select>
                        
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Members ({filteredAndSortedMembers.length})
                    </h2>
                </div>

                {filteredAndSortedMembers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                            {searchQuery || roleFilter !== 'all' 
                                ? 'No members found matching your filters.' 
                                : 'No members found.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {filteredAndSortedMembers.map((member) => (
                            <div key={member.id} className="p-6 hover:bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {/* Avatar */}
                                        <div className="relative">
                                            <Avatar 
                                                src={member.profiles?.avatar_url} 
                                                fullName={member.profiles?.full_name} 
                                                size="lg" 
                                            />
                                            {member.profiles?.is_omega_admin && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <Crown size={12} className="text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Member Info */}
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-slate-800">
                                                    {member.profiles?.full_name || 'Unknown User'}
                                                </h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role, member.profiles?.is_omega_admin)}`}>
                                                    {getRoleDisplayName(member.role, member.profiles?.is_omega_admin)}
                                                </span>
                                            </div>
                                            {member.profiles?.title && (
                                                <p className="text-sm text-slate-600">{member.profiles.title}</p>
                                            )}
                                            <p className="text-xs text-slate-500">
                                                Joined {new Date(member.joined_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!member.profiles?.is_omega_admin && (
                                        <div className="flex items-center space-x-2">
                                            {/* Role Change Buttons */}
                                            {member.role !== 'super_admin' && canPromoteToRole(currentUserRole, 'super_admin', isOmegaAdmin) && (
                                                <button
                                                    onClick={() => openConfirmModal('promote', member, 'super_admin')}
                                                    className="inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs rounded-md hover:bg-yellow-200 transition-colors"
                                                >
                                                    <Crown size={12} className="mr-1" />
                                                    Make Super Admin
                                                </button>
                                            )}
                                            
                                            {member.role !== 'admin' && member.role !== 'super_admin' && canPromoteToRole(currentUserRole, 'admin', isOmegaAdmin) && (
                                                <button
                                                    onClick={() => openConfirmModal('promote', member, 'admin')}
                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 text-xs rounded-md hover:bg-blue-200 transition-colors"
                                                >
                                                    <Shield size={12} className="mr-1" />
                                                    Make Admin
                                                </button>
                                            )}
                                            
                                            {member.role !== 'member' && canDemoteFromRole(currentUserRole, member.role, isOmegaAdmin) && (
                                                <button
                                                    onClick={() => openConfirmModal('demote', member, 'member')}
                                                    className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-800 text-xs rounded-md hover:bg-slate-200 transition-colors"
                                                >
                                                    <UserMinus size={12} className="mr-1" />
                                                    Make Member
                                                </button>
                                            )}

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => openConfirmModal('remove', member)}
                                                className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 text-xs rounded-md hover:bg-red-200 transition-colors"
                                            >
                                                <Trash2 size={12} className="mr-1" />
                                                Remove
                                            </button>
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
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            Confirm Action
                        </h3>
                        
                        <p className="text-slate-600 mb-6">
                            {confirmModal.type === 'remove' && (
                                <>Are you sure you want to remove <strong>{confirmModal.member?.profiles?.full_name}</strong> from this organization?</>
                            )}
                            {confirmModal.type === 'promote' && (
                                <>Are you sure you want to promote <strong>{confirmModal.member?.profiles?.full_name}</strong> to <strong>{getRoleDisplayName(confirmModal.newRole)}</strong>?</>
                            )}
                            {confirmModal.type === 'demote' && (
                                <>Are you sure you want to change <strong>{confirmModal.member?.profiles?.full_name}</strong>'s role to <strong>{getRoleDisplayName(confirmModal.newRole)}</strong>?</>
                            )}
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={closeConfirmModal}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                                    confirmModal.type === 'remove' 
                                        ? 'bg-red-600 hover:bg-red-700' 
                                        : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                            >
                                {confirmModal.type === 'remove' ? 'Remove' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}