// src/components/MyOrganizationPage.jsx - Clean Rewrite for New Database Structure
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Users, Shield, MapPin, Globe, Building2, Edit, AlertTriangle, LogOut, 
    Search, Crown, UserPlus, UserMinus, Settings, Star, MessageSquare, 
    BarChart3, ClipboardList, TrendingUp, Mail, Plus 
} from 'lucide-react';
import Avatar from './Avatar.jsx';
import StreamlinedOrganizationSetupPage from './OrganizationSetupPage.jsx';

// Permission system inline
const PERMISSIONS = {
    EDIT_ORGANIZATION: 'edit_organization',
    MANAGE_MEMBERS: 'manage_members',
    MANAGE_ADMINS: 'manage_admins'
};

const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MEMBER: 'member'
};

const hasPermission = (userRole, permission, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return true;
    
    const rolePermissions = {
        [ROLES.SUPER_ADMIN]: [PERMISSIONS.EDIT_ORGANIZATION, PERMISSIONS.MANAGE_MEMBERS, PERMISSIONS.MANAGE_ADMINS],
        [ROLES.ADMIN]: [PERMISSIONS.MANAGE_MEMBERS],
        [ROLES.MEMBER]: []
    };
    
    return rolePermissions[userRole]?.includes(permission) || false;
};

const getRoleDisplayName = (role, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return 'Omega Admin';
    const roleNames = {
        [ROLES.SUPER_ADMIN]: 'Super Admin',
        [ROLES.ADMIN]: 'Admin', 
        [ROLES.MEMBER]: 'Member'
    };
    return roleNames[role] || 'Member';
};

const getRoleBadgeColor = (role, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return 'bg-purple-100 text-purple-800 border-purple-200';
    const colors = {
        [ROLES.SUPER_ADMIN]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        [ROLES.ADMIN]: 'bg-blue-100 text-blue-800 border-blue-200',
        [ROLES.MEMBER]: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const canManageUser = (currentUserRole, targetRole, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return true;
    if (currentUserRole === ROLES.SUPER_ADMIN) return true;
    if (currentUserRole === ROLES.ADMIN && targetRole === ROLES.MEMBER) return true;
    return false;
};

export default function MyOrganizationPage() {
    const { profile, session } = useOutletContext();
    
    // State management
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userMembership, setUserMembership] = useState(null);
    const [isConfirmingLeave, setConfirmingLeave] = useState(false);
    
    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('overview');
    
    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editingData, setEditingData] = useState({});
    const [saving, setSaving] = useState(false);

    // Permissions
    const isOmegaAdmin = profile?.is_omega_admin === true;
    const userRole = userMembership?.role;
    const canEditOrg = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);
    const canManageMembers = hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin);
    const canManageAdmins = hasPermission(userRole, PERMISSIONS.MANAGE_ADMINS, isOmegaAdmin);
    const canViewAnalytics = ['super_admin', 'admin'].includes(userRole) || isOmegaAdmin;
    const canLeave = !isOmegaAdmin && userMembership;

    // Organization type helpers
    const getOrgTypeIcon = (type) => {
        const iconMap = {
            'nonprofit': '🏛️',
            'foundation': '💰',
            'government': '🏛️',
            'for-profit': '🏢',
            'education': '🎓',
            'healthcare': '🏥',
            'religious': '⛪',
            'international': '🌍'
        };
        return iconMap[type] || '🏢';
    };

    const getOrgTypeLabel = (type) => {
        const labelMap = {
            'nonprofit': 'Nonprofit Organization',
            'foundation': 'Foundation',
            'government': 'Government Agency',
            'for-profit': 'For-Profit Company',
            'education': 'Educational Institution',
            'healthcare': 'Healthcare Organization',
            'religious': 'Religious Organization',
            'international': 'International Organization'
        };
        return labelMap[type] || type;
    };

    // Tab configuration
    const tabs = useMemo(() => {
        if (!userMembership?.organization_type) return [];
        
        const baseTabs = [
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'team', label: 'Team', icon: Users }
        ];

        if (canViewAnalytics) {
            baseTabs.splice(1, 0, { id: 'analytics', label: 'Analytics', icon: BarChart3 });
        }

        if (userMembership.organization_type === 'nonprofit') {
            return [
                ...baseTabs,
                { id: 'programs', label: 'Programs', icon: ClipboardList },
                { id: 'impact', label: 'Impact Stories', icon: TrendingUp },
                { id: 'supporters', label: 'Supporters', icon: Star }
            ];
        } else if (userMembership.organization_type === 'foundation') {
            return [
                ...baseTabs,
                { id: 'grants', label: 'Active Grants', icon: ClipboardList },
                { id: 'grantees', label: 'Our Grantees', icon: Users },
                { id: 'impact', label: 'Impact Stories', icon: TrendingUp }
            ];
        }

        return baseTabs;
    }, [userMembership?.organization_type, canViewAnalytics]);

    // Filter members
    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            const matchesSearch = !searchQuery || 
                member.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.profiles?.title?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || member.role === roleFilter;
            
            return matchesSearch && matchesRole;
        });
    }, [members, searchQuery, roleFilter]);

    // Organize members by role
    const organizedMembers = useMemo(() => {
        const filtered = filteredMembers;

        const leadership = filtered.filter(m => 
            ['super_admin', 'admin'].includes(m.role) || 
            m.profiles?.title?.toLowerCase().includes('director') ||
            m.profiles?.title?.toLowerCase().includes('ceo') ||
            m.profiles?.title?.toLowerCase().includes('president')
        );

        const boardMembers = filtered.filter(m => 
            m.profiles?.title?.toLowerCase().includes('board') ||
            m.profiles?.title?.toLowerCase().includes('trustee')
        );

        const staff = filtered.filter(m => 
            !leadership.includes(m) && !boardMembers.includes(m)
        );

        return { leadership, staff, boardMembers };
    }, [filteredMembers]);

    // Check membership
    const checkMembership = useCallback(async () => {
        if (!session?.user?.id || !profile) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        setConfirmingLeave(false);

        if (isOmegaAdmin) {
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
    }, [profile, session?.user?.id, isOmegaAdmin]);

    // Fetch organization data
    const fetchOrganizationData = useCallback(async () => {
        if (!userMembership) return;

        try {
            setLoading(true);
            
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', userMembership.organization_id)
                .single();

            if (orgError) {
                setError('Error loading organization data');
                setLoading(false);
                return;
            }

            if (!orgData) {
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
                admin_profile_id: orgData.admin_profile_id
            });

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

            if (!memberError) {
                setMembers(memberData || []);
            }

        } catch (err) {
            setError('Error loading organization data');
        } finally {
            setLoading(false);
        }
    }, [userMembership]);

    // Leave organization
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
                setConfirmingLeave(false);
                setLoading(false);
                return;
            }

            const { error: profileUpdateError } = await supabase
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
            setConfirmingLeave(false);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await checkMembership();

        } catch (err) {
            setError('An unexpected error occurred while leaving the organization.');
            setConfirmingLeave(false);
            setLoading(false);
        }
    };

    // Handle member actions
    const handleMemberAction = async (member, action) => {
        if (!userMembership) return;

        const currentUserRole = userMembership.role;
        const targetRole = member.role;
        
        if (!canManageUser(currentUserRole, targetRole, isOmegaAdmin)) {
            setError('You do not have permission to manage this user.');
            return;
        }

        try {
            if (action === 'promote') {
                const { error } = await supabase
                    .from('organization_memberships')
                    .update({ role: ROLES.ADMIN })
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await fetchOrganizationData();

            } else if (action === 'demote') {
                const { error } = await supabase
                    .from('organization_memberships')
                    .update({ role: ROLES.MEMBER })
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await fetchOrganizationData();

            } else if (action === 'remove') {
                const { error } = await supabase
                    .from('organization_memberships')
                    .delete()
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await fetchOrganizationData();
            }
        } catch (err) {
            setError(`Error ${action}ing member: ${err.message}`);
        }
    };

    // Editing functions
    const startEditing = () => {
        setIsEditing(true);
        setEditingData({
            name: organization.name || '',
            tagline: organization.tagline || '',
            description: organization.description || '',
            website: organization.website || '',
            location: organization.location || '',
            contact_email: organization.contact_email || ''
        });
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditingData({});
        setError('');
    };

    const saveChanges = async () => {
        if (!canEditOrg) return;

        try {
            setSaving(true);
            setError('');

            const updateData = {
                name: editingData.name,
                tagline: editingData.tagline || null,
                description: editingData.description || null,
                website: editingData.website || null,
                location: editingData.location || null,
                contact_email: editingData.contact_email || null,
                updated_at: new Date()
            };

            const { error: updateError } = await supabase
                .from('organizations')
                .update(updateData)
                .eq('id', organization.id);

            if (updateError) {
                setError('Failed to save changes. Please try again.');
                setSaving(false);
                return;
            }

            setOrganization(prev => ({
                ...prev,
                ...updateData
            }));

            setIsEditing(false);
            setEditingData({});

        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Effects
    useEffect(() => {
        checkMembership();
    }, [checkMembership]);

    useEffect(() => {
        if (userMembership) {
            fetchOrganizationData();
        }
    }, [fetchOrganizationData]);

    // Render team member card
    const renderTeamMemberCard = (member) => {
        const getRoleIcon = (role) => {
            switch (role) {
                case 'super_admin': return <Crown className="text-yellow-500" size={16} />;
                case 'admin': return <Shield className="text-blue-500" size={16} />;
                case 'member': return <Users className="text-green-500" size={16} />;
                default: return <Users className="text-slate-400" size={16} />;
            }
        };

        return (
            <div key={member.profile_id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                    <Avatar 
                        src={member.profiles?.avatar_url} 
                        fullName={member.profiles?.full_name} 
                        size="md" 
                    />
                    <div>
                        <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-slate-800">{member.profiles?.full_name || 'Unknown User'}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role, member.profiles?.is_omega_admin)}`}>
                                {getRoleIcon(member.role)}
                                <span className="ml-1">{getRoleDisplayName(member.role, member.profiles?.is_omega_admin)}</span>
                            </span>
                        </div>
                        {member.profiles?.title && (
                            <p className="text-sm text-slate-500">{member.profiles.title}</p>
                        )}
                        <p className="text-xs text-slate-400">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {canManageMembers && member.profile_id !== profile.id && (
                    <div className="flex items-center space-x-2">
                        {member.role === ROLES.MEMBER && canManageAdmins && (
                            <button
                                onClick={() => handleMemberAction(member, 'promote')}
                                className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                                title="Promote to Admin"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        )}
                        {(member.role === ROLES.ADMIN || member.role === ROLES.SUPER_ADMIN) && canManageAdmins && (
                            <button
                                onClick={() => handleMemberAction(member, 'demote')}
                                className="text-orange-600 hover:text-orange-800 p-1 rounded transition-colors"
                                title="Demote to Member"
                            >
                                <UserMinus className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => handleMemberAction(member, 'remove')}
                            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                            title="Remove from Organization"
                        >
                            <UserMinus className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Render team section
    const renderTeamSection = (title, members) => {
        if (members.length === 0) return null;

        return (
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    {title} ({members.length})
                </h3>
                <div className="space-y-3">
                    {members.map(member => renderTeamMemberCard(member))}
                </div>
            </div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-500">Loading organization details...</span>
            </div>
        );
    }

    // Omega admin interface
    if (isOmegaAdmin) {
        return (
            <div className="text-center py-12">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Omega Admin Access</h2>
                <p className="text-slate-600">As an Omega Admin, you have access to all organizations on the platform.</p>
            </div>
        );
    }

    // No membership - show setup page
    if (!userMembership) {
        return <StreamlinedOrganizationSetupPage onJoinSuccess={checkMembership} />;
    }
    
    // No organization found
    if (!organization) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Organization Not Found</h2>
                <p className="text-slate-600">The organization associated with your membership could not be found.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {/* Organization Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {organization.logo_url ? (
                                <img 
                                    src={organization.logo_url} 
                                    alt={organization.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl">{getOrgTypeIcon(organization.type)}</span>
                            )}
                        </div>
                        
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editingData.name}
                                        onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                                        className="text-2xl font-bold text-slate-800 bg-white border border-slate-300 rounded px-3 py-1 w-full max-w-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Organization Name"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={editingData.tagline}
                                        onChange={(e) => setEditingData(prev => ({ ...prev, tagline: e.target.value }))}
                                        className="text-slate-600 bg-white border border-slate-300 rounded px-3 py-1 w-full max-w-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Organization tagline"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800">{organization.name}</h1>
                                    {organization.tagline && <p className="text-slate-600 mt-1">{organization.tagline}</p>}
                                    <div className="flex items-center mt-2 text-sm text-slate-500 flex-wrap gap-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole, isOmegaAdmin)}`}>
                                            {userRole === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1.5" />}
                                            {userRole === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1.5" />}
                                            {userRole === ROLES.MEMBER && <Users className="w-3 h-3 mr-1.5" />}
                                            {isOmegaAdmin && <Star className="w-3 h-3 mr-1.5" />}
                                            {getRoleDisplayName(userRole, isOmegaAdmin)}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span className="flex items-center">
                                            <span className="mr-1">{getOrgTypeIcon(organization.type)}</span>
                                            {getOrgTypeLabel(organization.type)}
                                        </span>
                                        {organization.location && (
                                            <>
                                                <span className="text-slate-400">•</span>
                                                <span className="flex items-center">
                                                    <MapPin className="w-4 h-4 mr-1.5" />
                                                    {organization.location}
                                                </span>
                                            </>
                                        )}
                                        {organization.website && (
                                            <>
                                                <span className="text-slate-400">•</span>
                                                <span className="flex items-center">
                                                    <Globe className="w-4 h-4 mr-1.5" />
                                                    <a 
                                                        href={organization.website} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        Website
                                                    </a>
                                                </span>
                                            </>
                                        )}
                                        {organization.contact_email && (
                                            <>
                                                <span className="text-slate-400">•</span>
                                                <span className="flex items-center">
                                                    <Mail className="w-4 h-4 mr-1.5" />
                                                    <a 
                                                        href={`mailto:${organization.contact_email}`}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        Contact
                                                    </a>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        {isEditing ? (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={cancelEditing}
                                    disabled={saving}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveChanges}
                                    disabled={saving || !editingData.name?.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Settings className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <>
                                {canEditOrg && (
                                    <button
                                        onClick={startEditing}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                                    >
                                        <Edit size={16} className="mr-2" />
                                        Edit Organization
                                    </button>
                                )}
                                {canLeave && (
                                    <button
                                        onClick={() => setConfirmingLeave(true)}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} className="mr-2" />
                                        Leave Organization
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* About section */}
                {isEditing ? (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">About This Organization</label>
                        <textarea
                            value={editingData.description}
                            onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Describe your organization's mission, activities, and goals..."
                        />
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                value={editingData.location}
                                onChange={(e) => setEditingData(prev => ({ ...prev, location: e.target.value }))}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Location"
                            />
                            <input
                                type="url"
                                value={editingData.website}
                                onChange={(e) => setEditingData(prev => ({ ...prev, website: e.target.value }))}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Website URL"
                            />
                            <input
                                type="email"
                                value={editingData.contact_email}
                                onChange={(e) => setEditingData(prev => ({ ...prev, contact_email: e.target.value }))}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Contact Email"
                            />
                        </div>
                    </div>
                ) : (
                    organization.description && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h3 className="text-sm font-medium text-slate-700 mb-2">About</h3>
                            <p className="text-slate-600 leading-relaxed">{organization.description}</p>
                        </div>
                    )
                )}

                {/* Tab Navigation */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    disabled={isEditing}
                                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Organization Updates</h3>
                        <p className="text-slate-600 mb-6">
                            Share updates, announcements, and engage with your community.
                        </p>
                        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Post
                        </button>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Total Members</p>
                                    <p className="text-2xl font-bold text-slate-900">{members.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Profile Views</p>
                                    <p className="text-2xl font-bold text-slate-900">1,234</p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Engagement</p>
                                    <p className="text-2xl font-bold text-slate-900">+12%</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">Team Members ({members.length})</h2>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                                <option value="all">All Roles</option>
                                <option value={ROLES.SUPER_ADMIN}>Super Admins</option>
                                <option value={ROLES.ADMIN}>Admins</option>
                                <option value={ROLES.MEMBER}>Members</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {renderTeamSection("Leadership", organizedMembers.leadership)}
                        {renderTeamSection("Staff", organizedMembers.staff)}
                        {renderTeamSection("Board Members", organizedMembers.boardMembers)}
                    </div>

                    {filteredMembers.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            {searchQuery || roleFilter !== 'all' ? 'No members match your search criteria.' : 'No members found.'}
                        </div>
                    )}
                </div>
            )}

            {/* Organization-specific tabs */}
            {userMembership.organization_type === 'nonprofit' && (
                <>
                    {activeTab === 'programs' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-center py-12">
                                <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-slate-800 mb-2">Programs & Services</h2>
                                <p className="text-slate-600">Manage your organization's programs and services.</p>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'impact' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-center py-12">
                                <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-slate-800 mb-2">Impact Stories</h2>
                                <p className="text-slate-600">Share and manage your organization's impact stories.</p>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'supporters' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-center py-12">
                                <Star className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-slate-800 mb-2">Supporters & Donors</h2>
                                <p className="text-slate-600">Manage relationships with your supporters and donors.</p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {userMembership.organization_type === 'foundation' && (
                <>
                    {activeTab === 'grants' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-center py-12">
                                <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-slate-800 mb-2">Active Grants</h2>
                                <p className="text-slate-600">Manage your active grant opportunities.</p>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'grantees' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-slate-800 mb-2">Our Grantees</h2>
                                <p className="text-slate-600">View and manage your current and past grantees.</p>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'impact' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-center py-12">
                                <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-slate-800 mb-2">Impact Stories</h2>
                                <p className="text-slate-600">Showcase the impact of your funding.</p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Leave Organization Confirmation Modal */}
            {isConfirmingLeave && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
                            <h3 className="text-lg font-semibold text-slate-800">Leave Organization</h3>
                        </div>
                        <div className="mb-6">
                            <p className="text-slate-600 mb-4">
                                Are you sure you want to leave <strong>{organization.name}</strong>? 
                            </p>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <p className="text-orange-800 text-sm">
                                    <strong>Note:</strong> You'll lose access to organization features and will need to be re-invited to rejoin.
                                </p>
                            </div>
                            {userRole === ROLES.SUPER_ADMIN && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 text-sm">
                                        <strong>Warning:</strong> You are a Super Admin. Make sure other admins can manage the organization before leaving.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setConfirmingLeave(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeLeave}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Leaving...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Leave Organization
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}