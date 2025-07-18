// Complete MyOrganizationPage.jsx with Organization Posts Integration
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Shield, MapPin, Globe, Building2, Edit, AlertTriangle, LogOut, Search, Crown, UserPlus, UserMinus, Settings, Star, MessageSquare, BarChart3, ClipboardList, TrendingUp } from 'lucide-react';
import Avatar from './Avatar.jsx';
import EnhancedOrganizationSetupPage from './OrganizationSetupPage.jsx';
import OmegaAdminOrgSelector from './OmegaAdminOrgSelector.jsx';
import AdminManagementModal from './AdminManagementModal.jsx';
import SocialMetricsCard from './SocialMetricsCard.jsx';
import OrganizationPosts from './OrganizationPosts.jsx';
// Import our permission utilities
import { hasPermission, PERMISSIONS, ROLES, getRoleDisplayName, getRoleBadgeColor, canManageUser } from '../utils/permissions.js';

export default function MyOrganizationPage() {
    const { profile, session } = useOutletContext();
    
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userMembership, setUserMembership] = useState(null);
    const [isConfirmingLeave, setConfirmingLeave] = useState(false);
    
    // Search and filter controls
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    
    // Modal state for admin management
    const [selectedMember, setSelectedMember] = useState(null);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null);

    // NEW: Tab state for managing different sections
    const [activeTab, setActiveTab] = useState('overview');

    // Check if user is Omega Admin
    const isOmegaAdmin = profile?.is_omega_admin === true;

    // NEW: Enhanced Tab configuration based on organization type - MOVED TO TOP LEVEL
    const getTabsForOrganizationType = useCallback((orgType, canViewAnalytics) => {
        const baseTabs = [
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'team', label: 'Team', icon: Users }
        ];

        // Add analytics tab for admins
        if (canViewAnalytics) {
            baseTabs.splice(1, 0, { id: 'analytics', label: 'Analytics', icon: BarChart3 });
        }

        // Add organization-type specific tabs
        if (orgType === 'nonprofit') {
            return [
                ...baseTabs,
                { id: 'programs', label: 'Programs', icon: ClipboardList },
                { id: 'impact', label: 'Impact Stories', icon: TrendingUp },
                { id: 'supporters', label: 'Supporters', icon: Star }
            ];
        } else if (orgType === 'funder') {
            return [
                ...baseTabs,
                { id: 'grants', label: 'Active Grants', icon: ClipboardList },
                { id: 'grantees', label: 'Our Grantees', icon: Users },
                { id: 'impact', label: 'Impact Stories', icon: TrendingUp }
            ];
        }

        return baseTabs;
    }, []);

    // Calculate permissions early
    const userRole = userMembership?.role;
    const canEditOrg = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);
    const canManageMembers = hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin);
    const canManageAdmins = hasPermission(userRole, PERMISSIONS.MANAGE_ADMINS, isOmegaAdmin);
    const canViewAnalytics = ['super_admin', 'admin'].includes(userRole) || isOmegaAdmin;
    const canSubmitUpdates = ['super_admin', 'admin'].includes(userRole) || isOmegaAdmin;
    const canLeave = !isOmegaAdmin && userMembership;

    // Tabs configuration - now always calculated
    const tabs = useMemo(() => 
        getTabsForOrganizationType(userMembership?.organization_type, canViewAnalytics), 
        [userMembership?.organization_type, canViewAnalytics, getTabsForOrganizationType]
    );

    // Filter and search members - moved up
    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            const matchesSearch = !searchQuery || 
                member.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.profiles?.title?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || member.role === roleFilter;
            
            return matchesSearch && matchesRole;
        });
    }, [members, searchQuery, roleFilter]);

    // Enhanced team member organization for Team tab - moved up
    const organizedMembers = useMemo(() => {
        const filtered = filteredMembers;

        // Organize into sections
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

    const checkMembership = useCallback(async () => {
        console.log('=== MEMBERSHIP CHECK STARTED ===');
        setConfirmingLeave(false); 

        if (!session?.user?.id || !profile) {
            console.log('❌ No session or profile, skipping membership check');
            setLoading(false);
            return;
        }

        console.log('Debug info:', {
            'session.user.id': session?.user?.id,
            'profile.id': profile?.id,
            'isOmegaAdmin': isOmegaAdmin
        });

        setLoading(true);
        setError('');

        // For Omega Admins, show the organization selector instead
        if (isOmegaAdmin) {
            console.log('👑 User is Omega Admin, skipping membership check');
            setLoading(false);
            return;
        }

        try {
            // Check new membership system
            const { data: memberships, error: membershipError } = await supabase
                .from('organization_memberships')
                .select('*')
                .eq('profile_id', profile.id)
                .order('joined_at', { ascending: false })
                .limit(1);

            console.log('Membership query result:', {
                memberships,
                membershipError,
                'profile.id used in query': profile.id,
                'query timestamp': new Date().toISOString()
            });

            if (membershipError) {
                console.error('❌ Membership check error:', membershipError);
                setError('Error checking membership');
                setLoading(false);
                return;
            }

            // If we found a membership, use it
            if (memberships && memberships.length > 0) {
                console.log('✅ Found membership:', memberships[0]);
                setUserMembership(memberships[0]);
                setLoading(false);
                return;
            }

            // Check for legacy admin status
            if (profile.managed_nonprofit_id || profile.managed_funder_id) {
                console.log('📋 Found legacy admin membership');
                setUserMembership({ 
                    role: 'super_admin',
                    organization_id: profile.managed_nonprofit_id || profile.managed_funder_id, 
                    organization_type: profile.managed_nonprofit_id ? 'nonprofit' : 'funder'
                });
                setLoading(false);
                return;
            }

            // No membership found - clear all organization state
            console.log('❌ No membership found - clearing organization state');
            setUserMembership(null);
            setOrganization(null);
            setMembers([]);
            setLoading(false);

        } catch (err) {
            console.error('❌ Error in checkMembership:', err);
            setError('Error checking membership');
            // Also clear state on error
            setUserMembership(null);
            setOrganization(null);
            setMembers([]);
            setLoading(false);
        }
    }, [profile, session?.user?.id, isOmegaAdmin]);

    const fetchOrganizationData = useCallback(async () => {
        if (!userMembership) return;

        try {
            setLoading(true);
            
            // Determine table name based on organization type
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

    // ENHANCED: Fixed leave organization function with automatic redirect
    const executeLeave = async () => {
        if (!userMembership) return;

        try {
            setLoading(true);
            setError('');

            console.log('Leaving organization...', {
                userId: session.user.id,
                organizationId: userMembership.organization_id
            });

            const { error: deleteError } = await supabase
                .from('organization_memberships')
                .delete()
                .eq('profile_id', session.user.id)
                .eq('organization_id', userMembership.organization_id);

            if (deleteError) {
                console.error('Error leaving organization:', deleteError);
                setError('Error leaving organization: ' + deleteError.message);
                setConfirmingLeave(false);
                setLoading(false);
                return;
            }

            console.log('Successfully left organization');

            // Immediately clear the user membership state
            setUserMembership(null);
            setOrganization(null);
            setMembers([]);
            setConfirmingLeave(false);
            
            // Wait a moment for database consistency
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Double-check by calling checkMembership
            await checkMembership();

        } catch (err) {
            console.error('Unexpected error leaving organization:', err);
            setError('An unexpected error occurred while leaving the organization.');
            setConfirmingLeave(false);
            setLoading(false);
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

        try {
            if (action === 'promote') {
                // Promote member to admin
                const { error } = await supabase
                    .from('organization_memberships')
                    .update({ role: ROLES.ADMIN })
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await fetchOrganizationData(); // Refresh

            } else if (action === 'demote') {
                // Demote admin/super_admin to member
                const { error } = await supabase
                    .from('organization_memberships')
                    .update({ role: ROLES.MEMBER })
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await fetchOrganizationData(); // Refresh

            } else if (action === 'remove') {
                // Remove member from organization
                const { error } = await supabase
                    .from('organization_memberships')
                    .delete()
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await fetchOrganizationData(); // Refresh
            }
        } catch (err) {
            console.error('Error managing member:', err);
            setError(`Error ${action}ing member: ${err.message}`);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-slate-500">Loading organization details...</div>;
    }

    // For Omega Admins, show organization selector
    if (isOmegaAdmin) {
        return <OmegaAdminOrgSelector />;
    }

    // If no membership, show setup page
    if (!userMembership) {
        return <EnhancedOrganizationSetupPage onJoinSuccess={checkMembership} />;
    }
    
    if (!organization) {
        return <div className="p-6 text-center text-slate-500">Loading organization details...</div>;
    }
    
    // NEW: Render team member card without join date
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
            <div key={member.profile_id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
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
                    </div>
                </div>

                {/* Member Actions */}
                {canManageMembers && member.profile_id !== profile.id && (
                    <div className="flex items-center space-x-2">
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
        );
    };

    // NEW: Render team section
    const renderTeamSection = (title, members, emptyMessage) => {
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

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {/* Organization Header with integrated About Us */}
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
                        {canLeave && (
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

                {/* About Us section - moved here and simplified */}
                {organization.description && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <p className="text-slate-600 leading-relaxed">{organization.description}</p>
                    </div>
                )}

                {/* NEW: Enhanced Tab Navigation */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
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
                <div>
                    {/* Removed bg-white, rounded-xl, shadow-sm, border, and added p-6 to match post card padding */}
                    <OrganizationPosts
                        organization={organization}
                        organizationType={userMembership.organization_type}
                        userRole={userRole}
                        isOmegaAdmin={isOmegaAdmin}
                        profile={profile}
                        className="p-6" // Maintains padding to match post cards
                    />
                </div>
            )}

            {/* NEW: Analytics Tab - Only for Admins */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Social Engagement Section - Moved from Overview */}
                    <SocialMetricsCard 
                        organization={organization} 
                        organizationType={userMembership.organization_type}
                        userRole={userRole}
                        isOmegaAdmin={isOmegaAdmin}
                    />
                    
                    {/* Additional Analytics Components */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Profile Performance</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Profile Views (30 days)</span>
                                    <span className="font-semibold">1,234</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Followers Growth</span>
                                    <span className="font-semibold text-green-600">+12%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Engagement Trends</h3>
                            <p className="text-slate-600">Detailed engagement analytics and trends...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW: Enhanced Team Tab with organized sections */}
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
                                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Roles</option>
                                <option value={ROLES.SUPER_ADMIN}>Super Admins</option>
                                <option value={ROLES.ADMIN}>Admins</option>
                                <option value={ROLES.MEMBER}>Members</option>
                            </select>
                        </div>
                    </div>

                    {/* NEW: Organized Team Sections - No joined dates */}
                    <div className="space-y-8">
                        {renderTeamSection("Leadership", organizedMembers.leadership, "No leadership members found")}
                        {renderTeamSection("Staff", organizedMembers.staff, "No staff members found")}
                        {renderTeamSection("Board Members", organizedMembers.boardMembers, "No board members found")}
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
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Programs & Services</h2>
                            <p className="text-slate-600">Manage your organization's programs and services.</p>
                        </div>
                    )}
                    
                    {activeTab === 'impact' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Impact Stories</h2>
                            <p className="text-slate-600">Share and manage your organization's impact stories.</p>
                        </div>
                    )}
                    
                    {activeTab === 'supporters' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Supporters & Donors</h2>
                            <p className="text-slate-600">Manage relationships with your supporters and donors.</p>
                        </div>
                    )}
                </>
            )}

            {userMembership.organization_type === 'funder' && (
                <>
                    {activeTab === 'grants' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Active Grants</h2>
                            <p className="text-slate-600">Manage your active grant opportunities.</p>
                        </div>
                    )}
                    
                    {activeTab === 'grantees' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Our Grantees</h2>
                            <p className="text-slate-600">View and manage your current and past grantees.</p>
                        </div>
                    )}
                    
                    {activeTab === 'impact' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Impact Stories</h2>
                            <p className="text-slate-600">Showcase the impact of your funding.</p>
                        </div>
                    )}
                </>
            )}

            {/* UPDATED: Confirmation Modal for Leaving Organization */}
            {isConfirmingLeave && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Leave Organization</h3>
                        <div className="mb-6">
                            <p className="text-slate-600 mb-4">
                                Are you sure you want to leave {organization.name}? You'll need to be re-invited to rejoin.
                            </p>
                            {userRole === ROLES.SUPER_ADMIN && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-800 text-sm">
                                        <strong>Note:</strong> You are leaving as a Super Admin. Make sure other admins are available to manage the organization if needed.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setConfirmingLeave(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeLeave}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Leaving...
                                    </>
                                ) : (
                                    'Leave Organization'
                                )}
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