// src/components/DashboardHeader.jsx - REDESIGNED: Integrated horizontal navigation
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, X, PlusCircle, Bell, User, ChevronDown, Home, LogOut, 
  Globe, Handshake, Search, Users, Building, Settings, FileText
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import GlobalSearch from './GlobalSearch.jsx';
import headerLogoImage from '../assets/fundspace-logo2.png';
import { isPlatformAdmin } from '../utils/permissions.js';
import { getOrganizationForProfileNav } from '../utils/membershipQueries.js';

export default function DashboardHeader({ profile }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isCommunityMenuOpen, setIsCommunityMenuOpen] = useState(false);
    const [stats, setStats] = useState({ followersCount: 0, followingCount: 0, connectionsCount: 0 });
    const [hasOrganizationAccess, setHasOrganizationAccess] = useState(false);
    
    const navigate = useNavigate();
    const userMenuRef = useRef(null);
    const communityMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    
    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    // Fetch profile stats
    const fetchProfileStats = useCallback(async () => {
        if (!profile?.id) return;
        
        try {
            const [followersRes, followingRes, connectionsRes] = await Promise.all([
                supabase.from('followers').select('id').eq('following_id', profile.id),
                supabase.from('followers').select('id').eq('follower_id', profile.id),
                supabase.from('connections').select('id').or(`user_id.eq.${profile.id},connected_user_id.eq.${profile.id}`).eq('status', 'accepted')
            ]);

            setStats({
                followersCount: followersRes.data?.length || 0,
                followingCount: followingRes.data?.length || 0,
                connectionsCount: connectionsRes.data?.length || 0
            });
        } catch (error) {
            console.error('Error fetching profile stats:', error);
        }
    }, [profile?.id]);

    // Check organization access
    const checkOrganizationAccess = useCallback(async () => {
        if (!profile?.id) return;
        
        try {
            const { data } = await supabase
                .from('memberships')
                .select('id')
                .eq('user_id', profile.id)
                .eq('status', 'active')
                .limit(1);
            
            setHasOrganizationAccess(data && data.length > 0);
        } catch (error) {
            console.error('Error checking organization access:', error);
        }
    }, [profile?.id]);

    useEffect(() => {
        fetchProfileStats();
        checkOrganizationAccess();
    }, [fetchProfileStats, checkOrganizationAccess]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (communityMenuRef.current && !communityMenuRef.current.contains(event.target)) {
                setIsCommunityMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Navigation items
    const mainNavItems = [
        { 
            label: 'Home', 
            to: '/profile', 
            icon: <Home size={16} />,
            exact: true
        },
        { 
            label: 'Community', 
            icon: <Globe size={16} />,
            dropdown: [
                { label: 'Hello World', to: '/profile/hello-world', icon: <Globe size={14} /> },
                { label: 'Hello Community', to: '/profile/hello-community', icon: <Handshake size={14} /> }
            ]
        },
        { 
            label: 'Discover', 
            to: '/profile/members', 
            icon: <Search size={16} /> 
        },
        { 
            label: 'Connections', 
            to: '/profile/connections', 
            icon: <Users size={16} />
        },
        { 
            label: 'Organization', 
            to: '/profile/my-organization', 
            icon: <Building size={16} />,
            hide: isOmegaAdmin
        }
    ];

    // Add Grants Portal if user has access
    if ((isOmegaAdmin || hasOrganizationAccess)) {
        mainNavItems.splice(1, 0, {
            label: 'Grants Portal',
            to: '/profile/grants-portal',
            icon: <FileText size={16} />
        });
    }

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200">
                <div className="w-full max-w-none px-6 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
                    
                    {/* Left side - Logo */}
                    <div className="flex items-center">
                        <Link to="/profile" aria-label="fundspace Home">
                            <img src={headerLogoImage} alt="Fundspace Logo" className="h-10 sm:h-12 w-auto" />
                        </Link>
                    </div>

                    {/* Center - Main Navigation (hidden on mobile) */}
                    <nav className="hidden lg:flex items-center space-x-6">
                        {mainNavItems.map((item) => {
                            if (item.hide) return null;
                            
                            return (
                                <div key={item.label} className="relative">
                                    {item.dropdown ? (
                                        <div ref={communityMenuRef}>
                                            <button
                                                onClick={() => setIsCommunityMenuOpen(!isCommunityMenuOpen)}
                                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                                <ChevronDown size={14} className="text-slate-400" />
                                            </button>
                                            
                                            {isCommunityMenuOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                                                    {item.dropdown.map((dropdownItem) => (
                                                        <NavLink
                                                            key={dropdownItem.to}
                                                            to={dropdownItem.to}
                                                            onClick={() => setIsCommunityMenuOpen(false)}
                                                            className={({ isActive }) =>
                                                                `flex items-center space-x-2 w-full text-left px-4 py-2 text-sm transition-colors ${
                                                                    isActive 
                                                                        ? 'bg-blue-50 text-blue-600' 
                                                                        : 'text-slate-700 hover:bg-slate-100'
                                                                }`
                                                            }
                                                        >
                                                            {dropdownItem.icon}
                                                            <span>{dropdownItem.label}</span>
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <NavLink
                                            to={item.to}
                                            end={item.exact}
                                            className={({ isActive }) =>
                                                `flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                    isActive 
                                                        ? 'bg-blue-100 text-blue-600' 
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                                }`
                                            }
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                            {item.badge && item.badge > 0 && (
                                                <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Right side - Search, Actions and Profile */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        
                        {/* Search Bar (hidden on mobile) */}
                        <div className="hidden md:block">
                            <div className="w-64 lg:w-80">
                                <GlobalSearch />
                            </div>
                        </div>

                        {/* Submit Grant Button */}
                        <Link 
                            to="/submit-grant" 
                            className="inline-flex items-center justify-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            <PlusCircle size={16} className="mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Submit Grant</span>
                            <span className="sm:hidden">Submit</span>
                        </Link>

                        {/* Notifications */}
                        <Link 
                            to="/profile/notifications"
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                        </Link>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={userMenuRef}>
                            <button 
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                                aria-label="Profile Menu"
                            >
                                {profile?.avatar_url ? (
                                    <img 
                                        src={profile.avatar_url} 
                                        alt={profile.display_name || 'Profile'} 
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                                        <User size={16} className="text-slate-600" />
                                    </div>
                                )}
                                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                            </button>
                            
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {profile?.full_name || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {profile?.email}
                                        </p>
                                    </div>
                                    <div className="py-1">
                                        <Link 
                                            to="/profile" 
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            <Home size={14} className="mr-2" /> Dashboard
                                        </Link>
                                        <Link 
                                            to="/profile/settings" 
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            <Settings size={14} className="mr-2" /> Settings
                                        </Link>
                                        {/* Stats display in dropdown */}
                                        <div className="px-4 py-2 border-t border-slate-100">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>{stats.connectionsCount} Connections</span>
                                                <span>{stats.followersCount} Followers</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-100 py-1">
                                        <button 
                                            onClick={handleLogout}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            <LogOut size={14} className="mr-2" /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="md:hidden border-t border-slate-200 p-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-25" onClick={closeMobileMenu}></div>
                    
                    <div 
                        ref={mobileMenuRef}
                        className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <span className="text-lg font-semibold text-slate-900">Menu</span>
                            <button
                                onClick={closeMobileMenu}
                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center space-x-3">
                                {profile?.avatar_url ? (
                                    <img 
                                        src={profile.avatar_url} 
                                        alt={profile.display_name || 'Profile'} 
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-slate-600" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        {profile?.full_name || 'User'}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {profile?.email}
                                    </p>
                                </div>
                            </div>
                            {/* Stats in mobile */}
                            <div className="flex justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                                <span>{stats.connectionsCount} Connections</span>
                                <span>{stats.followersCount} Followers</span>
                                <span>{stats.followingCount} Following</span>
                            </div>
                        </div>

                        {/* Mobile Navigation */}
                        <div className="p-4 space-y-2">
                            {mainNavItems.map((item) => {
                                if (item.hide) return null;
                                
                                return (
                                    <div key={item.label}>
                                        {item.dropdown ? (
                                            <>
                                                <div className="px-3 py-2 text-sm font-medium text-slate-900 bg-slate-50 rounded-lg">
                                                    {item.label}
                                                </div>
                                                {item.dropdown.map((dropdownItem) => (
                                                    <Link
                                                        key={dropdownItem.to}
                                                        to={dropdownItem.to}
                                                        onClick={closeMobileMenu}
                                                        className="flex items-center space-x-3 w-full px-6 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg"
                                                    >
                                                        {dropdownItem.icon}
                                                        <span>{dropdownItem.label}</span>
                                                    </Link>
                                                ))}
                                            </>
                                        ) : (
                                            <Link
                                                to={item.to}
                                                onClick={closeMobileMenu}
                                                className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                                {item.badge && item.badge > 0 && (
                                                    <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                            
                            <div className="pt-4 border-t border-slate-200 space-y-2">
                                <Link 
                                    to="/submit-grant"
                                    onClick={closeMobileMenu}
                                    className="flex items-center justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                >
                                    <PlusCircle size={16} className="mr-2" />
                                    Submit Grant
                                </Link>
                                
                                <Link 
                                    to="/profile/notifications"
                                    onClick={closeMobileMenu}
                                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                                >
                                    <Bell size={16} />
                                    <span>Notifications</span>
                                </Link>
                                
                                <Link 
                                    to="/profile/settings"
                                    onClick={closeMobileMenu}
                                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                                >
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </Link>

                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                                >
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}