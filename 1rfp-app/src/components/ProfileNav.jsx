// src/components/ProfileNav.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { isPlatformAdmin } from '../utils/permissions.js';

export default function ProfileNav() {
    const { profile } = useOutletContext();
    const [stats, setStats] = useState({
        followersCount: 0,
        favoritesCount: 0
    });
    const [loading, setLoading] = useState(true);

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (profile?.id) {
            fetchProfileStats();
        }
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

            // Fetch funder bookmarks count
            const { count: funderBookmarksCount, error: funderBookmarksError } = await supabase
                .from('funder_bookmarks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);

            if (funderBookmarksError) {
                console.error('Error fetching funder bookmarks count:', funderBookmarksError);
            }

            // Fetch nonprofit bookmarks count
            const { count: nonprofitBookmarksCount, error: nonprofitBookmarksError } = await supabase
                .from('nonprofit_bookmarks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);

            if (nonprofitBookmarksError) {
                console.error('Error fetching nonprofit bookmarks count:', nonprofitBookmarksError);
            }

            // Total favorites = funder bookmarks + nonprofit bookmarks
            const totalFavorites = (funderBookmarksCount || 0) + (nonprofitBookmarksCount || 0);

            setStats({
                followersCount: followersCount || 0,
                favoritesCount: totalFavorites
            });

        } catch (err) {
            console.error('Error fetching profile stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const navLinkClass = ({ isActive }) =>
        `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActive 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;

    return (
        <div className="space-y-4">
            {/* Profile Header */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <div className="text-center">
                    <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-slate-600">
                                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        )}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-1">
                        {profile?.full_name || 'Your Name'}
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        {profile?.title || 'Your Title'} {profile?.organization_name && `at ${profile.organization_name}`}
                    </p>
                </div>
                
                {/* Stats */}
                <div className="flex justify-center space-x-8 border-t border-slate-200 pt-4">
                    <div className="text-center">
                        <p className="text-xl font-bold text-slate-800">
                            {loading ? '...' : stats.followersCount}
                        </p>
                        <p className="text-xs text-slate-500">Followers</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold text-slate-800">
                            {loading ? '...' : stats.favoritesCount}
                        </p>
                        <p className="text-xs text-slate-500">Favorites</p>
                    </div>
                </div>
            </div>
            
            {/* Regular Navigation - Hide "My Organization" for Omega Admins */}
            <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200">
                <nav className="space-y-1">
                    <NavLink to="/profile" end className={navLinkClass}>
                        <span>🏠</span>
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/profile/members" className={navLinkClass}>
                        <span>👥</span>
                        <span>Explore Members</span>
                    </NavLink>
                    <NavLink to="/profile/saved-grants" className={navLinkClass}>
                        <span>📑</span>
                        <span>Saved Grants</span>
                    </NavLink>
                    {/* Hide "My Organization" for Omega Admins since they manage all organizations */}
                    {!isOmegaAdmin && (
                        <NavLink to="/profile/my-organization" className={navLinkClass}>
                            <span>🏢</span>
                            <span>My Organization</span>
                        </NavLink>
                    )}
                    <NavLink to="/profile/settings" className={navLinkClass}>
                        <span>⚙️</span>
                        <span>Settings</span>
                    </NavLink>
                </nav>
            </div>

            {/* Omega Admin Navigation */}
            {isOmegaAdmin && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md border border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-800 mb-3 uppercase tracking-wider">
                        Omega Admin
                    </h3>
                    <nav className="space-y-1">
                        <NavLink to="/profile/omega-admin" end className={navLinkClass}>
                            <span>👑</span>
                            <span>Admin Dashboard</span>
                        </NavLink>
                        <NavLink to="/profile/omega-admin/analytics" className={navLinkClass}>
                            <span>📊</span>
                            <span>Analytics</span>
                        </NavLink>
                        <NavLink to="/profile/omega-admin/claims" className={navLinkClass}>
                            <span>📋</span>
                            <span>Manage Claims</span>
                        </NavLink>
                        <NavLink to="/profile/omega-admin/organizations" className={navLinkClass}>
                            <span>🏢</span>
                            <span>Manage Organizations</span>
                        </NavLink>
                    </nav>
                </div>
            )}
        </div>
    );
}