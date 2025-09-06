// src/components/dashboard/WelcomeBanner.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Bell, Plus, X, Globe, Building, FileText } from 'lucide-react';
import PropTypes from 'prop-types';

const WelcomeBanner = ({ profile, organizationInfo }) => {
    const navigate = useNavigate();
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [imageTheme, setImageTheme] = useState(() => {
        // Load image theme from localStorage or default to 'dark'
        return localStorage.getItem('welcomeBannerImageTheme') || 'dark';
    });

    // Save image theme to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('welcomeBannerImageTheme', imageTheme);
    }, [imageTheme]);

    const toggleImageTheme = () => {
        setImageTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleOrganizationClick = () => {
        if (organizationInfo?.name) {
            // Create a slug from the organization name for navigation
            const orgSlug = organizationInfo.name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .trim();
            
            navigate(`/organizations/${orgSlug}`);
        }
    };

    // Define image themes with different background images
    const imageThemes = {
        dark: {
            backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
            overlay: 'bg-gradient-to-r from-black/60 via-black/40 to-transparent',
            textColor: 'text-white',
            dateColor: 'text-white/80',
            orgColor: 'text-white/90',
            buttonStyle: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20'
        },
        light: {
            backgroundImage: "url('https://cdn.pixabay.com/photo/2022/06/01/02/54/yosemite-7234655_1280.jpg')",
            overlay: 'bg-gradient-to-r from-black/35 via-black/20 to-black/5',
            textColor: 'text-white',
            dateColor: 'text-white/80',
            orgColor: 'text-white/90',
            buttonStyle: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20'
        }
    };

    const currentTheme = imageThemes[imageTheme];

    const getCurrentTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getTodaysDate = () => {
        return new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const quickActions = [
        {
            icon: Plus,
            label: 'Create Post',
            isPopup: true,
            color: currentTheme.buttonStyle,
            action: () => setShowCreatePopup(true)
        },
        // FIXED: Navigate to grants portal page instead of grants page
        ...(profile?.is_omega_admin || organizationInfo ? [{
            icon: FileText,
            label: 'Fund Portal',
            color: currentTheme.buttonStyle,
            action: () => navigate('/profile/grants-portal')
        }] : []),
        {
            icon: Calendar,
            label: 'Events',
            color: currentTheme.buttonStyle,
            action: () => navigate('/events')
        },
        {
            icon: Bell,
            label: 'Notifications',
            color: currentTheme.buttonStyle,
            action: () => navigate('/notifications')
        }
    ];

    // Get the user's display role - FIXED: Use profile.title first, then fallback logic
    const getUserDisplayRole = () => {
        // First priority: Use the user's actual title from their profile
        if (profile?.title) {
            return profile.title;
        }
        
        // Second priority: Use organization role if available
        if (organizationInfo?.role) {
            return organizationInfo.role;
        }
        
        // Final fallback: Use a generic role based on organization type or default
        if (organizationInfo?.type) {
            const typeRoleMap = {
                'nonprofit': 'Nonprofit Professional',
                'foundation': 'Foundation Professional', 
                'funder': 'Funder',
                'education': 'Education Professional',
                'healthcare': 'Healthcare Professional',
                'government': 'Government Professional',
                'religious': 'Religious Organization Member',
                'forprofit': 'Professional'
            };
            return typeRoleMap[organizationInfo.type] || 'Team Member';
        }
        
        return 'Team Member';
    };

    return (
        <>
            <div className="relative overflow-hidden">
                {/* Theme toggle button */}
                <div className="absolute top-4 right-4 z-30">
                    <button
                        onClick={toggleImageTheme}
                        className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 text-sm ${currentTheme.buttonStyle}`}
                    >
                        {imageTheme === 'dark' ? '☀️' : '🌙'}
                        {imageTheme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                </div>

                {/* IMAGE THEME */}
                <div className="rounded-2xl relative overflow-hidden min-h-[350px]">
                    {/* Background image with overlay */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: currentTheme.backgroundImage
                        }}
                    >
                        {/* Overlay for better text readability */}
                        <div className={`absolute inset-0 ${currentTheme.overlay}`}></div>
                    </div>

                    {/* Content overlay */}
                    <div className="relative z-10 p-8">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                {/* Time-based greeting */}
                                <div className={`${currentTheme.dateColor} text-sm font-medium mb-2 flex items-center gap-2`}>
                                    <Calendar size={16} />
                                    {getTodaysDate()}
                                </div>

                                {/* Main welcome message */}
                                <h1 className={`text-3xl font-bold ${currentTheme.textColor} mb-3 leading-tight`}>
                                    {getCurrentTimeGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
                                </h1>

                                {/* Organization and role info - FIXED */}
                                <div className={`${currentTheme.orgColor} text-lg mb-6`}>
                                    {organizationInfo ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={handleOrganizationClick}
                                                className={`hover:opacity-80 font-medium transition-colors cursor-pointer inline-flex items-center gap-1`}
                                            >
                                                {organizationInfo.name}
                                            </button>
                                            <span className="opacity-60">•</span>
                                            <span className="opacity-80">{getUserDisplayRole()}</span>
                                        </div>
                                    ) : (
                                        <span className="opacity-80">Ready to discover new opportunities</span>
                                    )}
                                </div>

                                {/* Quick action buttons */}
                                <div className="flex gap-3 flex-wrap">
                                    {quickActions.map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={action.action}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 text-sm ${action.color}`}
                                        >
                                            <action.icon size={16} />
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Post Popup Modal */}
            {showCreatePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl bg-white relative">
                        <div className="absolute inset-0">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl translate-x-8 -translate-y-8"></div>
                            <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-gradient-to-br from-indigo-200/25 to-cyan-200/25 rounded-full blur-3xl -translate-y-12"></div>
                        </div>
                        
                        {/* Header */}
                        <div className="p-6 relative text-slate-900">
                            <button
                                onClick={() => setShowCreatePopup(false)}
                                className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-slate-100 text-slate-600"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100">
                                    <Plus size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Create New Post</h3>
                                    <p className="text-sm text-slate-600">Share with your community</p>
                                </div>
                            </div>
                        </div>

                        {/* Post Type Options */}
                        <div className="p-6 pt-0 relative space-y-3">
                            {/* Global Feed Option */}
                            <button 
                                onClick={() => {
                                    navigate('/profile/create-post?type=global');
                                    setShowCreatePopup(false);
                                }}
                                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all duration-200 hover:scale-[1.02] group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-blue-100">
                                        <Globe size={20} className="text-blue-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-bold text-lg group-hover:opacity-80 text-slate-900">Global Feed</h4>
                                        <p className="text-sm mt-1 text-slate-600">Share with the entire FundSpace community</p>
                                    </div>
                                </div>
                            </button>

                            {/* Organization Feed Option */}
                            {organizationInfo && (
                                <button 
                                    onClick={() => {
                                        navigate('/profile/create-post?type=organization');
                                        setShowCreatePopup(false);
                                    }}
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-purple-50 hover:bg-purple-100 transition-all duration-200 hover:scale-[1.02] group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-purple-100">
                                            <Building size={20} className="text-purple-600" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <h4 className="font-bold text-lg group-hover:opacity-80 text-purple-900">Hello Community</h4>
                                            <p className="text-sm mt-1 text-purple-700">Share with your organization community and team members</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t border-slate-200 px-6 pb-6">
                            <p className="text-center text-xs text-slate-500">
                                Choose where you'd like to share your post
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

WelcomeBanner.propTypes = {
    profile: PropTypes.object,
    organizationInfo: PropTypes.object
};

export default WelcomeBanner;