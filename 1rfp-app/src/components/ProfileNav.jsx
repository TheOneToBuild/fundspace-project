// src/components/ProfileNav.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { isPlatformAdmin } from '../utils/permissions.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Users, LayoutDashboard, BarChart2, FileText, Building, Bookmark, Bell, Settings, Search, ChevronsRight, Crown, Briefcase, Handshake, Globe
} from 'lucide-react';

// Main Component
export default function ProfileNav() {
    const { profile } = useOutletContext();
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, connectionsCount: 0 });
    const [organizationName, setOrganizationName] = useState('');
    const [organizationSlug, setOrganizationSlug] = useState('');
    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);
    const sidebarRef = useRef(null);

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isExpanded) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

    // --- DATA FETCHING & LOGIC ---
    const fetchOrganizationData = useCallback(async (profileId) => {
        if (!profileId) return { name: '', slug: '' };
        try {
            const { data } = await supabase
                .from('organization_memberships')
                .select('organizations!inner(name, slug)')
                .eq('profile_id', profileId)
                .order('joined_at', { ascending: false })
                .limit(1)
                .single();
            return {
                name: data?.organizations?.name || '',
                slug: data?.organizations?.slug || ''
            };
        } catch (error) {
            console.error('Error fetching organization data:', error);
            return { name: '', slug: '' };
        }
    }, []);

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
        if (profile?.id) {
            Promise.all([
                fetchOrganizationData(profile.id),
                fetchProfileStats()
            ]).then(([orgData]) => {
                setOrganizationName(orgData.name);
                setOrganizationSlug(orgData.slug);
            });
        }
    }, [profile?.id, fetchOrganizationData, fetchProfileStats]);

    // Navigation configuration
    const navItems = [
        {
            section: 'Community',
            links: [
                { icon: <Home size={20} />, text: "Home", to: "/profile" },
                { icon: <Globe size={20} />, text: "Hello World", to: "/profile/hello-world" },
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
            ref={sidebarRef}
            initial={false}
            animate={{ width: isExpanded ? 270 : 80 }}
            className="flex flex-col h-full bg-white border-r border-slate-200 shadow-sm rounded-xl"
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
                        <ProfileCard profile={profile} stats={stats} organizationName={organizationName} organizationSlug={organizationSlug} navigate={navigate} />
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
                        className="p-4 flex justify-center"
                    >
                        <button onClick={() => setIsExpanded(true)} className="hover:scale-105 transition-transform">
                            <Avatar profile={profile} />
                        </button>
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
        `group relative flex items-center justify-start h-10 px-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

    return (
        <NavLink 
            to={to} 
            className={navLinkClass} 
            // FIXED: Removed the problematic end prop that was causing routing issues
            // Only use end for specific admin routes that truly need exact matching
            end={to === "/profile/omega-admin"}
            title={!isExpanded ? text : ''}
        >
            <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                {icon}
            </div>
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
        </NavLink>
    );
}

function ProfileCard({ profile, stats, organizationName, organizationSlug, navigate }) {
    const handleOrganizationClick = () => {
        if (organizationSlug) {
            navigate(`/organizations/${organizationSlug}`);
        } else {
            // Fallback to my-organization page if no slug
            navigate('/profile/my-organization');
        }
    };

    return (
        <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col items-center text-center">
                <Avatar profile={profile} size="large" />
                <h2 className="text-lg font-semibold text-blue-600 mt-2">{profile?.full_name || 'Your Name'}</h2>
                <p className="text-sm text-slate-500">{profile?.title || 'No title specified'}</p>
                {organizationName && (
                    <button 
                        onClick={handleOrganizationClick}
                        className="text-xs text-slate-400 mt-1 hover:text-blue-500 hover:underline transition-colors cursor-pointer"
                    >
                        {organizationName}
                    </button>
                )}
            </div>
            {/* Enhanced stats section with vibrant colors and animations */}
            <div className="flex justify-around items-center mt-4 pt-4 border-t border-slate-100">
                <StatButton 
                    label="Connections" 
                    value={stats.connectionsCount} 
                    onClick={() => navigate('/profile/connections')}
                    color="emerald"
                    icon="🤝"
                />
                <StatButton 
                    label="Followers" 
                    value={stats.followersCount} 
                    onClick={() => navigate('/profile/followers')}
                    color="purple"
                    icon="👥"
                />
                <StatButton 
                    label="Following" 
                    value={stats.followingCount} 
                    onClick={() => navigate('/profile/following')}
                    color="blue"
                    icon="👤"
                />
            </div>
        </div>
    );
}

function StatButton({ label, value, onClick, color, icon }) {
    const colorClasses = {
        emerald: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200 border-emerald-200",
        purple: "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 border-purple-200",
        blue: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border-blue-200"
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center p-2 rounded-lg border transition-all duration-200 cursor-pointer group ${colorClasses[color]}`}
        >
            <div className="text-lg mb-1">{icon}</div>
            <span className="text-sm font-bold">{value || 0}</span>
            <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">{label}</span>
        </motion.button>
    );
}

function Avatar({ profile, size = "medium" }) {
    const sizeClasses = {
        small: "w-8 h-8 text-sm",
        medium: "w-10 h-10 text-sm", 
        large: "w-16 h-16 text-lg"
    };
    
    const initials = profile?.full_name
        ?.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??';

    if (profile?.avatar_url) {
        return (
            <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Profile'}
                className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-lg`}
            />
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg`}>
            {initials}
        </div>
    );
}