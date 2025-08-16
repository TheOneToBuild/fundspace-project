// src/components/dashboard/WelcomeBanner.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Bell, Plus, Zap, Target, Users, ChevronDown, Palette, Apple, X, Globe, Building, FileText } from 'lucide-react';
import PropTypes from 'prop-types';

const WelcomeBanner = ({ profile, organizationInfo }) => {
    const navigate = useNavigate();
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [theme, setTheme] = useState(() => {
        // Load theme from localStorage or default to 'gradient'
        return localStorage.getItem('welcomeBannerTheme') || 'gradient';
    });

    // Save theme to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('welcomeBannerTheme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'gradient' ? 'apple' : 'gradient');
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
            color: theme === 'gradient' 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg',
            action: () => setShowCreatePopup(true)
        },
        // NEW: Add Grants Portal button - only show for admins or organization members
        ...(profile?.is_omega_admin || organizationInfo ? [{
            icon: FileText,
            label: 'Grants Portal',
            action: () => navigate('/profile/grants-portal'),
            color: theme === 'gradient' 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
        }] : []),
        {
            icon: Calendar,
            label: 'Events',
            action: () => navigate('/profile/events'),
            color: theme === 'gradient' 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        },
        {
            icon: Bell,
            label: 'Notifications',
            action: () => navigate('/profile/notifications'),
            color: theme === 'gradient' 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        }
    ];

    return (
        <>
            <div className="relative overflow-hidden">
                {/* Theme toggle button - moved to top right */}
                <div className="absolute top-4 right-4 z-30">
                    <button
                        onClick={toggleTheme}
                        className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 text-sm ${
                            theme === 'gradient' 
                                ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                    >
                        {theme === 'gradient' ? <Apple size={16} /> : <Palette size={16} />}
                        {theme === 'gradient' ? 'Clean' : 'Gradient'}
                    </button>
                </div>

            {/* Conditional theme rendering */}
            {theme === 'gradient' ? (
                /* GRADIENT THEME */
                <div className="rounded-2xl p-8 relative"
                     style={{
                         background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.8) 0%, rgba(196, 181, 253, 0.8) 50%, rgba(165, 180, 252, 0.8) 100%)'
                     }}>
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
                        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/10 rounded-full blur-lg animate-pulse delay-500"></div>
                    </div>

                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1">
                            {/* Time-based greeting */}
                            <div className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                                <Calendar size={16} />
                                {getTodaysDate()}
                            </div>

                            {/* Main welcome message */}
                            <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
                                {getCurrentTimeGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
                            </h1>

                            {/* Organization and role info */}
                            <div className="text-white/90 text-lg mb-6">
                                {organizationInfo ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={handleOrganizationClick}
                                            className="hover:text-white hover:underline font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                                        >
                                            {organizationInfo.name}
                                        </button>
                                        <span className="text-white/70">•</span>
                                        <span className="text-white/90">{profile?.title || 'Team Member'}</span>
                                    </div>
                                ) : (
                                    <span>Ready to discover new opportunities?</span>
                                )}
                            </div>

                            {/* Quick action buttons */}
                            <div className="flex gap-3 flex-wrap">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={action.action}
                                        className={`${action.color} px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-105 flex items-center gap-2 text-sm`}
                                    >
                                        <action.icon size={16} />
                                        {action.label}
                                        {action.isPopup && <ChevronDown size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom stats bar */}
                    <div className="relative z-10 mt-8 pt-6 border-t border-white/20">
                        <div className="flex items-center text-white/80 text-sm">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    <span>Your Network</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target size={16} />
                                    <span>Active Goals</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap size={16} />
                                    <span>Recent Activity</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* APPLE THEME */
                <div className="bg-white rounded-3xl p-8 relative shadow-lg border border-slate-200/50"
                     style={{
                         background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 100%)',
                         boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                     }}>
                    
                    {/* Subtle backdrop elements */}
                    <div className="absolute inset-0 overflow-hidden opacity-30">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl transform translate-x-48 -translate-y-48"></div>
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-indigo-50 to-blue-50 rounded-full blur-3xl transform -translate-x-36 translate-y-36"></div>
                    </div>

                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1">
                            {/* Time-based greeting */}
                            <div className="text-slate-500 text-sm font-medium mb-3 flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                {getTodaysDate()}
                            </div>

                            {/* Main welcome message */}
                            <h1 className="text-4xl font-light text-slate-900 mb-4 leading-tight tracking-tight">
                                {getCurrentTimeGreeting()}, <span className="font-medium">{profile?.full_name?.split(' ')[0] || 'there'}</span>
                            </h1>

                            {/* Organization and role info */}
                            <div className="text-slate-600 text-lg mb-8 font-light">
                                {organizationInfo ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={handleOrganizationClick}
                                            className="hover:text-slate-900 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                                        >
                                            {organizationInfo.name}
                                        </button>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-600">{profile?.title || 'Team Member'}</span>
                                    </div>
                                ) : (
                                    <span>Ready to discover new opportunities</span>
                                )}
                            </div>

                            {/* Quick action buttons */}
                            <div className="flex gap-3 flex-wrap">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={action.action}
                                        className={`${action.color} px-5 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center gap-2 text-sm hover:scale-105 active:scale-95`}
                                    >
                                        <action.icon size={16} />
                                        {action.label}
                                        {action.isPopup && <ChevronDown size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom stats bar */}
                    <div className="relative z-10 mt-10 pt-6 border-t border-slate-200/50">
                        <div className="flex items-center text-slate-500 text-sm font-medium">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2.5 hover:text-slate-700 transition-colors cursor-pointer">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>Your Network</span>
                                </div>
                                <div className="flex items-center gap-2.5 hover:text-slate-700 transition-colors cursor-pointer">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>Active Goals</span>
                                </div>
                                <div className="flex items-center gap-2.5 hover:text-slate-700 transition-colors cursor-pointer">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Recent Activity</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Create Post Popup */}
        {showCreatePopup && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`rounded-2xl shadow-2xl max-w-md w-full overflow-hidden ${
                    theme === 'gradient' 
                        ? 'bg-white' 
                        : 'bg-white'
                }`}
                     style={{
                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                         background: theme === 'gradient' 
                             ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.95) 0%, rgba(196, 181, 253, 0.95) 50%, rgba(165, 180, 252, 0.95) 100%)'
                             : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 100%)'
                     }}>
                    {/* Header */}
                    <div className={`p-6 relative ${
                        theme === 'gradient' 
                            ? 'text-white' 
                            : 'text-slate-900'
                    }`}>
                        <button
                            onClick={() => setShowCreatePopup(false)}
                            className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${
                                theme === 'gradient'
                                    ? 'hover:bg-white/20 text-white'
                                    : 'hover:bg-slate-100 text-slate-600'
                            }`}
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                                theme === 'gradient'
                                    ? 'bg-white/20'
                                    : 'bg-blue-100'
                            }`}>
                                <Plus size={24} className={theme === 'gradient' ? 'text-white' : 'text-blue-600'} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${
                                    theme === 'gradient' ? 'text-white' : 'text-slate-900'
                                }`}>Create New Post</h3>
                                <p className={`text-sm ${
                                    theme === 'gradient' ? 'text-white/80' : 'text-slate-600'
                                }`}>Share your thoughts with the community</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="space-y-4">
                            {/* Hello World Option */}
                            <button
                                onClick={() => {
                                    navigate('/profile/hello-world?create=true');
                                    setShowCreatePopup(false);
                                }}
                                className={`w-full p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] group ${
                                    theme === 'gradient'
                                        ? 'bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm'
                                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg group-hover:scale-110 transition-transform ${
                                        theme === 'gradient'
                                            ? 'bg-white/30'
                                            : 'bg-blue-500'
                                    }`}>
                                        <Globe size={24} className={theme === 'gradient' ? 'text-white' : 'text-white'} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className={`font-bold text-lg group-hover:opacity-80 ${
                                            theme === 'gradient' ? 'text-white' : 'text-blue-900'
                                        }`}>Hello World</h4>
                                        <p className={`text-sm mt-1 ${
                                            theme === 'gradient' ? 'text-white/80' : 'text-blue-700'
                                        }`}>Share with the global community and connect with people worldwide</p>
                                    </div>
                                    <ChevronDown size={20} className={`rotate-[-90deg] group-hover:translate-x-1 transition-transform ${
                                        theme === 'gradient' ? 'text-white/80' : 'text-blue-600'
                                    }`} />
                                </div>
                            </button>

                            {/* Hello Community Option */}
                            <button
                                onClick={() => {
                                    navigate('/profile/hello-community?create=true');
                                    setShowCreatePopup(false);
                                }}
                                className={`w-full p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] group ${
                                    theme === 'gradient'
                                        ? 'bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm'
                                        : 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg group-hover:scale-110 transition-transform ${
                                        theme === 'gradient'
                                            ? 'bg-white/30'
                                            : 'bg-purple-500'
                                    }`}>
                                        <Building size={24} className={theme === 'gradient' ? 'text-white' : 'text-white'} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className={`font-bold text-lg group-hover:opacity-80 ${
                                            theme === 'gradient' ? 'text-white' : 'text-purple-900'
                                        }`}>Hello Community</h4>
                                        <p className={`text-sm mt-1 ${
                                            theme === 'gradient' ? 'text-white/80' : 'text-purple-700'
                                        }`}>Share with your organization community and team members</p>
                                    </div>
                                    <ChevronDown size={20} className={`rotate-[-90deg] group-hover:translate-x-1 transition-transform ${
                                        theme === 'gradient' ? 'text-white/80' : 'text-purple-600'
                                    }`} />
                                </div>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className={`mt-6 pt-4 border-t ${
                            theme === 'gradient' ? 'border-white/20' : 'border-slate-200'
                        }`}>
                            <p className={`text-center text-xs ${
                                theme === 'gradient' ? 'text-white/60' : 'text-slate-500'
                            }`}>
                                Choose where you'd like to share your post
                            </p>
                        </div>
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