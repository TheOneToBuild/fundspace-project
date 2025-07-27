// src/components/ProfileNav.jsx - Cleaned
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { isPlatformAdmin } from '../utils/permissions.js';
import { addOrganizationEventListener } from '../utils/organizationEvents';

const getUserCommunityChannels = (profile) => {
  const channels = [{
    id: 'hello-world', name: 'Hello World', icon: '👋',
    route: '/profile', color: 'purple'
  }];
  channels.push({
    id: 'hello-community', name: 'Hello Community', icon: '🤝',
    route: '/profile/hello-community', color: 'indigo'
  });
  return channels;
};

export default function ProfileNav() {
    const { profile } = useOutletContext();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
    const [organizationInfo, setOrganizationInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (profile?.id) {
            fetchProfileStats();
            fetchOrganizationInfo();
        }
    }, [profile?.id]);

    useEffect(() => {
        if (!profile?.id) return;
        const handleInstantOrgChange = (event) => {
            if (event.detail?.profileId === profile.id) {
                fetchOrganizationInfo();
            }
        };
        window.addEventListener('organizationChanged', handleInstantOrgChange);

        const channel = supabase
            .channel(`organization_memberships_instant:${profile.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_memberships', filter: `profile_id=eq.${profile.id}`},
                (payload) => { setTimeout(() => fetchOrganizationInfo(), 300); }
            ).subscribe();

        const handleWindowFocus = () => {
            setTimeout(() => fetchOrganizationInfo(), 100);
        };
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            window.removeEventListener('organizationChanged', handleInstantOrgChange);
            supabase.removeChannel(channel);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [profile?.id]);

    useEffect(() => {
        if (!profile?.id) return;
        const handleFollowUpdate = (event) => {
            const { action, followerId, followingId } = event.detail;
            if (followerId === profile.id || followingId === profile.id) {
                setStats(prevStats => {
                    const newStats = { ...prevStats };
                    if (followerId === profile.id) {
                        if (action === 'follow') newStats.followingCount += 1;
                        else if (action === 'unfollow') newStats.followingCount = Math.max(0, newStats.followingCount - 1);
                    }
                    if (followingId === profile.id) {
                        if (action === 'follow') newStats.followersCount += 1;
                        else if (action === 'unfollow') newStats.followersCount = Math.max(0, newStats.followersCount - 1);
                    }
                    return newStats;
                });
            }
        };
        window.addEventListener('followUpdate', handleFollowUpdate);
        return () => { window.removeEventListener('followUpdate', handleFollowUpdate); };
    }, [profile?.id]);

    const fetchProfileStats = async () => {
        try {
            setLoading(true);
            const { count: followersCount, error: followersError } = await supabase
                .from('followers').select('*', { count: 'exact', head: true }).eq('following_id', profile.id);
            if (followersError) console.error('Error fetching followers count:', followersError);

            const { count: followingCount, error: followingError } = await supabase
                .from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id);
            if (followingError) console.error('Error fetching following count:', followingError);

            setStats({ followersCount: followersCount || 0, followingCount: followingCount || 0 });
        } catch (err) {
            console.error('Error fetching profile stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizationInfo = useCallback(async () => {
        if (!profile?.id) return;
        try {
            const { data: memberships, error } = await supabase
                .from('organization_memberships')
                .select(`*, organizations!inner(id, name, tagline, type, image_url)`)
                .eq('profile_id', profile.id)
                .order('joined_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('❌ Error fetching organization memberships:', error);
                setOrganizationInfo(null);
                return;
            }

            if (memberships && memberships.length > 0) {
                const membership = memberships[0];
                const org = membership.organizations;
                const orgData = {
                    id: org.id, name: org.name, tagline: org.tagline,
                    type: org.type, image_url: org.image_url,
                    role: membership.role, joinedAt: membership.joined_at
                };
                setOrganizationInfo(orgData);
            } else {
                setOrganizationInfo(null);
            }
        } catch (err) {
            console.error('❌ Error in fetchOrganizationInfo:', err);
            setOrganizationInfo(null);
        }
    }, [profile?.id]);

    const getDisplayOrganization = () => {
        if (organizationInfo) {
            return {
                name: organizationInfo.name, role: organizationInfo.role, type: organizationInfo.type,
                hasManagementAccess: ['super_admin', 'admin'].includes(organizationInfo.role)
            };
        }
        if (profile?.organization_name) {
            return {
                name: profile.organization_name, role: profile.title || 'Member',
                type: profile.organization_type || 'unknown', hasManagementAccess: false
            };
        }
        return null;
    };

    const displayOrg = getDisplayOrganization();
    const communityChannels = getUserCommunityChannels(profile);
    
    const handleFollowersClick = () => navigate('/profile/followers');
    const handleFollowingClick = () => navigate('/profile/following');

    const navLinkClass = ({ isActive }) =>
        `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            isActive ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`;

    const communityNavLinkClass = ({ isActive }) =>
        `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            isActive ? 'bg-indigo-400 text-white shadow-sm' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
        }`;

    return (
        <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-3">
                        <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg font-bold text-slate-600">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
                    </div>
                    <h2 className="text-base font-bold text-slate-800 mb-1">{profile?.full_name || 'Your Name'}</h2>
                    {displayOrg && (
                        <div className="mb-3">
                            <p className="text-xs text-slate-500 transition-all duration-300" title={`${displayOrg.name} (${displayOrg.role})`}>
                                {displayOrg.name}
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex justify-center space-x-6 border-t border-slate-100 pt-3">
                    <button onClick={handleFollowersClick} className="text-center hover:bg-slate-50 rounded-lg p-2 transition-colors cursor-pointer">
                        <p className="text-lg font-bold text-blue-600 transition-all duration-300">{loading ? '...' : stats.followersCount}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Followers</p>
                    </button>
                    <button onClick={handleFollowingClick} className="text-center hover:bg-slate-50 rounded-lg p-2 transition-colors cursor-pointer">
                        <p className="text-lg font-bold text-purple-600 transition-all duration-300">{loading ? '...' : stats.followingCount}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Following</p>
                    </button>
                </div>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-blue-200 rounded-md flex items-center justify-center"><span className="text-xs">🌱</span></div>
                    <h3 className="text-sm font-bold text-slate-700">Community Feeds</h3>
                </div>
                <nav className="space-y-1">
                    {communityChannels.map(channel => (
                        <NavLink key={channel.id} to={channel.route} state={channel.state} end={channel.id === 'hello-world'} className={communityNavLinkClass}>
                            <div className={`w-6 h-6 bg-${channel.color}-200 rounded-md flex items-center justify-center text-xs shadow-sm`}>{channel.icon}</div>
                            <span className="flex-1 font-medium">{channel.name}</span>
                        </NavLink>
                    ))}
                    <div className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed">
                        <div className="w-6 h-6 bg-orange-200 rounded-md flex items-center justify-center text-xs opacity-60">🏢</div>
                        <span className="flex-1">Hello Workplace</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Soon</span>
                    </div>
                    <div className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed">
                        <div className="w-6 h-6 bg-teal-200 rounded-md flex items-center justify-center text-xs opacity-60">👥</div>
                        <span className="flex-1">Hello Team</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Soon</span>
                    </div>
                </nav>
            </div>
            
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-purple-200 rounded-md flex items-center justify-center"><span className="text-xs">👤</span></div>
                    <h3 className="text-sm font-bold text-slate-700">Your Profile</h3>
                </div>
                <nav className="space-y-1">
                    {!isOmegaAdmin && (
                        <NavLink to="/profile/my-organization" className={navLinkClass}>
                            <div className="w-6 h-6 bg-red-200 rounded-md flex items-center justify-center text-xs shadow-sm">🏢</div>
                            <span className="font-medium">My Organization</span>
                            {displayOrg?.hasManagementAccess && (<span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Admin</span>)}
                        </NavLink>
                    )}
                    <NavLink to="/profile/members" className={navLinkClass}>
                        <div className="w-6 h-6 bg-green-200 rounded-md flex items-center justify-center text-xs shadow-sm">👥</div>
                        <span className="font-medium">Explore Members</span>
                    </NavLink>
                    <NavLink to="/profile/saved-grants" className={navLinkClass}>
                        <div className="w-6 h-6 bg-yellow-200 rounded-md flex items-center justify-center text-xs shadow-sm">📑</div>
                        <span className="font-medium">Saved Grants</span>
                    </NavLink>
                    <NavLink to="/profile/notifications" className={navLinkClass}>
                        <div className="w-6 h-6 bg-blue-200 rounded-md flex items-center justify-center text-xs shadow-sm">🔔</div>
                        <span className="font-medium">Notifications</span>
                    </NavLink>
                    <NavLink to="/profile/settings" className={navLinkClass}>
                        <div className="w-6 h-6 bg-gray-300 rounded-md flex items-center justify-center text-xs shadow-sm">⚙️</div>
                        <span className="font-medium">Settings</span>
                    </NavLink>
                </nav>
            </div>

            {isOmegaAdmin && (
                <div className="bg-purple-900 p-3 rounded-xl shadow-sm border border-purple-700">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-5 h-5 bg-yellow-400 rounded-md flex items-center justify-center"><span className="text-purple-900 text-xs font-bold">👑</span></div>
                        <h3 className="text-sm font-bold text-white">Omega Admin</h3>
                    </div>
                    <nav className="space-y-1">
                        <NavLink to="/profile/omega-admin" end className={({ isActive }) => `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-100 hover:bg-purple-800'}`}>
                            <div className="w-6 h-6 bg-lime-300 rounded-md flex items-center justify-center text-xs shadow-sm">👑</div>
                            <span className="font-medium">Admin Dashboard</span>
                        </NavLink>
                        <NavLink to="/profile/omega-admin/analytics" className={({ isActive }) => `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-100 hover:bg-purple-800'}`}>
                            <div className="w-6 h-6 bg-fuchsia-300 rounded-md flex items-center justify-center text-xs shadow-sm">📊</div>
                            <span className="font-medium">Analytics</span>
                        </NavLink>
                        <NavLink to="/profile/omega-admin/claims" className={({ isActive }) => `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-100 hover:bg-purple-800'}`}>
                            <div className="w-6 h-6 bg-red-300 rounded-md flex items-center justify-center text-xs shadow-sm">📋</div>
                            <span className="font-medium">Manage Claims</span>
                        </NavLink>
                        <NavLink to="/profile/omega-admin/organizations" className={({ isActive }) => `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-100 hover:bg-purple-800'}`}>
                            <div className="w-6 h-6 bg-emerald-400 rounded-md flex items-center justify-center text-xs shadow-sm">🏢</div>
                            <span className="font-medium">Manage Organizations</span>
                        </NavLink>
                    </nav>
                </div>
            )}
        </div>
    );
}