// src/components/ProfileNav.jsx - Compact Version with Real-Time Follow Updates
import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { isPlatformAdmin } from '../utils/permissions.js';

export default function ProfileNav() {
    const { profile } = useOutletContext();
    const [stats, setStats] = useState({
        followersCount: 0,
        followingCount: 0
    });
    const [loading, setLoading] = useState(true);

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (profile?.id) {
            fetchProfileStats();
        }
    }, [profile?.id]);

    // NEW: Listen for real-time follow updates
    useEffect(() => {
        if (!profile?.id) return;

        const handleFollowUpdate = (event) => {
            const { action, followerId, followingId } = event.detail;
            
            console.log('🔄 ProfileNav received follow update:', { action, followerId, followingId, currentUserId: profile.id });
            
            // Only update if this affects the current user
            if (followerId === profile.id || followingId === profile.id) {
                console.log('📊 Updating follow stats for current user');
                
                setStats(prevStats => {
                    const newStats = { ...prevStats };
                    
                    if (followerId === profile.id) {
                        // Current user followed someone else
                        if (action === 'follow') {
                            newStats.followingCount += 1;
                        } else if (action === 'unfollow') {
                            newStats.followingCount = Math.max(0, newStats.followingCount - 1);
                        }
                    }
                    
                    if (followingId === profile.id) {
                        // Someone followed/unfollowed the current user
                        if (action === 'follow') {
                            newStats.followersCount += 1;
                        } else if (action === 'unfollow') {
                            newStats.followersCount = Math.max(0, newStats.followersCount - 1);
                        }
                    }
                    
                    console.log('📈 Updated stats:', { 
                        previous: prevStats, 
                        new: newStats,
                        action,
                        followerId,
                        followingId 
                    });
                    
                    return newStats;
                });
            }
        };

        // Add event listener for follow updates
        window.addEventListener('followUpdate', handleFollowUpdate);

        // Cleanup event listener
        return () => {
            window.removeEventListener('followUpdate', handleFollowUpdate);
        };
    }, [profile?.id]);

    const fetchProfileStats = async () => {
        try {
            setLoading(true);
            
            // Fetch followers count (users following this profile)
            const { count: followersCount, error: followersError } = await supabase
                .from('followers')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', profile.id);

            if (followersError) {
                console.error('Error fetching followers count:', followersError);
            }

            // Fetch following count (users this profile is following)
            const { count: followingCount, error: followingError } = await supabase
                .from('followers')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', profile.id);

            if (followingError) {
                console.error('Error fetching following count:', followingError);
            }

            const newStats = {
                followersCount: followersCount || 0,
                followingCount: followingCount || 0
            };

            console.log('📊 Initial profile stats loaded:', newStats);
            setStats(newStats);

        } catch (err) {
            console.error('Error fetching profile stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const navLinkClass = ({ isActive }) =>
        `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            isActive 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`;

    const communityNavLinkClass = ({ isActive }) =>
        `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            isActive 
                ? 'bg-indigo-400 text-white shadow-sm' 
                : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
        }`;

    return (
        <div className="space-y-3">
            {/* Compact Profile Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-3">
                        <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg font-bold text-slate-600">
                                    {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
                    </div>
                    <h2 className="text-base font-bold text-slate-800 mb-1">
                        {profile?.full_name || 'Your Name'}
                    </h2>
                    <p className="text-xs text-slate-600 mb-3 leading-tight">
                        {profile?.organization_name && (
                            <span className="font-medium">{profile.organization_name}</span>
                        )}
                    </p>
                </div>
                
                {/* Compact Stats - ENHANCED: Now with real-time updates */}
                <div className="flex justify-center space-x-6 border-t border-slate-100 pt-3">
                    <div className="text-center">
                        <p className="text-lg font-bold text-blue-600 transition-all duration-300">
                            {loading ? '...' : stats.followersCount}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Followers</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-purple-600 transition-all duration-300">
                            {loading ? '...' : stats.followingCount}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Following</p>
                    </div>
                </div>
            </div>

            {/* Compact Community Feeds */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-blue-200 rounded-md flex items-center justify-center">
                        <span className="text-xs">🌱</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">Community Feeds</h3>
                </div>
                <nav className="space-y-1">
                    <NavLink to="/profile" end className={communityNavLinkClass}>
                        <div className="w-6 h-6 bg-purple-200 rounded-md flex items-center justify-center text-xs shadow-sm">
                            👋
                        </div>
                        <span className="flex-1 font-medium">Hello World</span>
                    </NavLink>
                    
                    <NavLink to="/profile/hello-community" className={communityNavLinkClass}>
                        <div className="w-6 h-6 bg-pink-200 rounded-md flex items-center justify-center text-xs shadow-sm">
                            🤝
                        </div>
                        <span className="flex-1 font-medium">Hello Community</span>
                    </NavLink>
                    
                    <div className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed">
                        <div className="w-6 h-6 bg-orange-200 rounded-md flex items-center justify-center text-xs opacity-60">
                            🏢
                        </div>
                        <span className="flex-1">Hello Workplace</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Soon</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed">
                        <div className="w-6 h-6 bg-teal-200 rounded-md flex items-center justify-center text-xs opacity-60">
                            👥
                        </div>
                        <span className="flex-1">Hello Team</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Soon</span>
                    </div>
                </nav>
            </div>
            
            {/* Compact Your Profile Section */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-purple-200 rounded-md flex items-center justify-center">
                        <span className="text-xs">👤</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">Your Profile</h3>
                </div>
                <nav className="space-y-1">
                    <NavLink to="/profile/members" className={navLinkClass}>
                        <div className="w-6 h-6 bg-green-200 rounded-md flex items-center justify-center text-xs shadow-sm">
                            👥
                        </div>
                        <span className="font-medium">Explore Members</span>
                    </NavLink>
                    
                    <NavLink to="/profile/saved-grants" className={navLinkClass}>
                        <div className="w-6 h-6 bg-yellow-200 rounded-md flex items-center justify-center text-xs shadow-sm">
                            📑
                        </div>
                        <span className="font-medium">Saved Grants</span>
                    </NavLink>
                    
                    {!isOmegaAdmin && (
                        <NavLink to="/profile/my-organization" className={navLinkClass}>
                            <div className="w-6 h-6 bg-red-200 rounded-md flex items-center justify-center text-xs shadow-sm">
                                🏢
                            </div>
                            <span className="font-medium">My Organization</span>
                        </NavLink>
                    )}
                    
                    <NavLink to="/profile/settings" className={navLinkClass}>
                        <div className="w-6 h-6 bg-gray-300 rounded-md flex items-center justify-center text-xs shadow-sm">
                            ⚙️
                        </div>
                        <span className="font-medium">Settings</span>
                    </NavLink>
                </nav>
            </div>

            {/* Compact Omega Admin Navigation */}
            {isOmegaAdmin && (
                <div className="bg-purple-900 p-3 rounded-xl shadow-sm border border-purple-700">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-5 h-5 bg-yellow-400 rounded-md flex items-center justify-center">
                            <span className="text-purple-900 text-xs font-bold">👑</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">Omega Admin</h3>
                    </div>
                    <nav className="space-y-1">
                        <NavLink to="/profile/omega-admin" end className={({ isActive }) =>
                            `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive 
                                    ? 'bg-white text-purple-900 shadow-sm' 
                                    : 'text-purple-100 hover:bg-purple-800'
                            }`
                        }>
                            <div className="w-6 h-6 bg-lime-300 rounded-md flex items-center justify-center text-xs shadow-sm">
                                👑
                            </div>
                            <span className="font-medium">Admin Dashboard</span>
                        </NavLink>
                        
                        <NavLink to="/profile/omega-admin/analytics" className={({ isActive }) =>
                            `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive 
                                    ? 'bg-white text-purple-900 shadow-sm' 
                                    : 'text-purple-100 hover:bg-purple-800'
                            }`
                        }>
                            <div className="w-6 h-6 bg-fuchsia-300 rounded-md flex items-center justify-center text-xs shadow-sm">
                                📊
                            </div>
                            <span className="font-medium">Analytics</span>
                        </NavLink>
                        
                        <NavLink to="/profile/omega-admin/claims" className={({ isActive }) =>
                            `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive 
                                    ? 'bg-white text-purple-900 shadow-sm' 
                                    : 'text-purple-100 hover:bg-purple-800'
                            }`
                        }>
                            <div className="w-6 h-6 bg-red-300 rounded-md flex items-center justify-center text-xs shadow-sm">
                                📋
                            </div>
                            <span className="font-medium">Manage Claims</span>
                        </NavLink>
                        
                        <NavLink to="/profile/omega-admin/organizations" className={({ isActive }) =>
                            `flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive 
                                    ? 'bg-white text-purple-900 shadow-sm' 
                                    : 'text-purple-100 hover:bg-purple-800'
                            }`
                        }>
                            <div className="w-6 h-6 bg-emerald-400 rounded-md flex items-center justify-center text-xs shadow-sm">
                                🏢
                            </div>
                            <span className="font-medium">Manage Organizations</span>
                        </NavLink>
                    </nav>
                </div>
            )}
        </div>
    );
}