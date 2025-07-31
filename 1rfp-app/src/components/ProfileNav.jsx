import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { isPlatformAdmin } from '../utils/permissions.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Users, LayoutDashboard, BarChart2, FileText, Building, Bookmark, Bell, Settings, Search, ChevronsRight, Crown, Briefcase, Handshake
} from 'lucide-react';

// Main Component
export default function ProfileNav() {
    const { profile } = useOutletContext();
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, connectionsCount: 0 });
    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    // --- DATA FETCHING & LOGIC (Unchanged) ---
    const fetchProfileStats = useCallback(async () => {
        if (!profile?.id) return;
        try {
            const [followersResult, followingResult, connectionsResult] = await Promise.all([
                supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
                supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
                supabase.from('user_connections').select('*', { count: 'exact', head: true }).or(`and(requester_id.eq.${profile.id},status.eq.accepted),and(recipient_id.eq.${profile.id},status.eq.accepted)`)
            ]);
            setStats({
                followersCount: followersResult.count || 0,
                followingCount: followingResult.count || 0,
                connectionsCount: connectionsResult.count || 0,
            });
        } catch (err) {
            console.error('Error fetching profile stats:', err);
        }
    }, [profile?.id]);

    useEffect(() => {
        fetchProfileStats();
        const channel = supabase.channel(`profile-stats-changes:${profile?.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'followers', filter: `or(follower_id.eq.${profile?.id},following_id.eq.${profile?.id})` }, fetchProfileStats)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_connections', filter: `or(requester_id.eq.${profile?.id},recipient_id.eq.${profile?.id})` }, fetchProfileStats)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [profile?.id, fetchProfileStats]);

    // --- NAVIGATION STRUCTURE ---
    const navItems = [
        {
            section: 'Community',
            links: [
                { icon: <Home size={20} />, text: "Hello World", to: "/profile" },
                { icon: <Handshake size={20} />, text: "Hello Community", to: "/profile/hello-community" },
                { icon: <Search size={20} />, text: "Discover People", to: "/profile/members" },
            ]
        },
        {
            section: 'Profile',
            links: [
                { icon: <Users size={20} />, text: "My Connections", to: "/profile/connections", badge: stats.connectionsCount },
                { icon: <Briefcase size={20} />, text: "My Organization", to: "/profile/my-organization", hide: isOmegaAdmin },
                { icon: <Bookmark size={20} />, text: "Saved Grants", to: "/profile/saved-grants" },
                { icon: <Bell size={20} />, text: "Notifications", to: "/profile/notifications" },
                { icon: <Settings size={20} />, text: "Settings", to: "/profile/settings" },
            ]
        },
        {
            section: 'Admin',
            hide: !isOmegaAdmin,
            links: [
                { icon: <LayoutDashboard size={20} />, text: "Dashboard", to: "/profile/omega-admin" },
                { icon: <BarChart2 size={20} />, text: "Analytics", to: "/profile/omega-admin/analytics" },
                { icon: <FileText size={20} />, text: "Manage Claims", to: "/profile/omega-admin/claims" },
                { icon: <Building size={20} />, text: "Manage Orgs", to: "/profile/omega-admin/organizations" },
            ]
        }
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: isExpanded ? 270 : 80 }}
            className="flex flex-col h-full bg-white border-r border-slate-200 shadow-sm rounded-xl" // FIX: Added rounded-xl
        >
            {/* Header */}
            <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} p-4 h-[65px] border-b border-slate-200`}>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="font-bold text-lg text-slate-700"
                        >
                            My Profile
                        </motion.span>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronsRight size={20} />
                    </motion.div>
                </button>
            </div>

            {/* Profile Card */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <ProfileCard profile={profile} stats={stats} navigate={navigate} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Avatar when collapsed */}
            <AnimatePresence>
                {!isExpanded && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, transition: { delay: 0.2 } }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="p-4"
                    >
                        <Avatar profile={profile} />
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
                {navItems.map((section, sIndex) => (
                    !section.hide && (
                        <div key={sIndex}>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.h3
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, transition: { delay: 0.2 } }}
                                        exit={{ opacity: 0 }}
                                        className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                                    >
                                        {section.section}
                                    </motion.h3>
                                )}
                            </AnimatePresence>
                            <div className="space-y-1">
                                {section.links.map((link, lIndex) => (
                                    !link.hide && <NavItem key={lIndex} {...link} isExpanded={isExpanded} />
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </nav>
        </motion.aside>
    );
}

// --- SUB-COMPONENTS ---

function NavItem({ to, icon, text, badge, isExpanded }) {
    const navLinkClass = ({ isActive }) =>
        `group relative flex items-center h-10 px-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

    return (
        <NavLink to={to} className={navLinkClass} end={to === "/profile/omega-admin" || to === "/profile"} title={!isExpanded ? text : ''}> {/* FIX: Added title attribute for hover tooltip */}
            {icon}
            <AnimatePresence>
                {isExpanded && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.2 } }}
                        exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }}
                        className="ml-3 font-medium text-sm overflow-hidden whitespace-nowrap"
                    >
                        {text}
                    </motion.span>
                )}
            </AnimatePresence>

            {isExpanded && badge > 0 && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, transition: { delay: 0.3 } }}
                    className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold"
                >
                    {badge}
                </motion.span>
            )}
            {/* FIX: Removed the custom tooltip text in minimized view */}
        </NavLink>
    );
}

function ProfileCard({ profile, stats, navigate }) {
    return (
        <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col items-center text-center">
                <Avatar profile={profile} size="large" />
                <h2 className="text-lg font-semibold text-slate-800 mt-2">{profile?.full_name || 'Your Name'}</h2>
                <p className="text-sm text-slate-500">{profile?.title || 'No title specified'}</p>
            </div>
            {/* FIX: Changed stats layout from grid to flex for better spacing */}
            <div className="flex justify-around items-center mt-4 pt-4 border-t border-slate-100">
                <StatButton label="Connections" value={stats.connectionsCount} onClick={() => navigate('/profile/connections')} />
                <StatButton label="Followers" value={stats.followersCount} onClick={() => navigate('/profile/followers')} />
                <StatButton label="Following" value={stats.followingCount} onClick={() => navigate('/profile/following')} />
            </div>
        </div>
    );
}

function StatButton({ label, value, onClick }) {
    return (
        // FIX: Adjusted padding and font sizes to prevent text from being squished
        <button onClick={onClick} className="flex flex-col items-center text-center hover:bg-slate-50 rounded-lg p-2 transition-colors w-20">
            <p className="text-xl font-bold text-slate-800">{value}</p>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-normal">{label}</p>
        </button>
    );
}

function Avatar({ profile, size = 'medium' }) {
    const sizeClasses = {
        medium: 'w-10 h-10 text-base',
        large: 'w-16 h-16 text-2xl',
    };
    return (
        <div className={`relative ${sizeClasses}[size]`}>
            <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span className="font-bold text-slate-600">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
        </div>
    );
}