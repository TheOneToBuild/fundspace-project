// src/components/AuthButton.jsx - Fixed Signup Link to Use Login Page
import React, { useState, useRef, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Avatar from './Avatar.jsx';
import { LogOut, User, Home } from './Icons.jsx';

export default function AuthButton({ mobile = false, onClose }) {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const navigate = useNavigate();
    
    // Try to use context first, fallback to local state
    let contextData = null;
    try {
        contextData = useOutletContext?.() || {};
    } catch (error) {
        // Context not available, we'll use local state
        console.log('Auth context not available, using local state');
    }
    
    // Local state as fallback
    const [localSession, setLocalSession] = useState(null);
    const [localProfile, setLocalProfile] = useState(null);
    const [loading, setLoading] = useState(!contextData);

    // Use context if available, otherwise use local state
    const session = contextData?.session ?? localSession;
    const profile = contextData?.profile ?? localProfile;

    // Set up local auth state management if context is not available
    useEffect(() => {
        if (contextData?.session !== undefined) {
            // Context is available, don't need local state
            setLoading(false);
            return;
        }

        // No context, manage our own auth state
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setLocalSession(session);
            
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setLocalProfile(profile);
            }
            setLoading(false);
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('AuthButton: Auth state changed:', event, newSession ? 'logged in' : 'logged out');
            setLocalSession(newSession);
            
            if (newSession?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', newSession.user.id)
                    .single();
                setLocalProfile(profile);
            } else {
                setLocalProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [contextData]);

    const handleSignOut = async () => {
        try {
            console.log('🚪 Signing out...');
            await supabase.auth.signOut();
            
            // Clear local state immediately
            setLocalSession(null);
            setLocalProfile(null);
            
            // Close mobile menu if provided
            if (onClose) onClose();
            
            // Force navigation to home page
            navigate('/', { replace: true });
            
            // Force page reload to clear any cached state
            setTimeout(() => {
                window.location.reload();
            }, 100);
            
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleLinkClick = () => {
        if (onClose) onClose(); // Close mobile menu when navigating
        setIsUserMenuOpen(false);
    };

    // NEW: Handler to navigate to login page with signup view
    const handleSignUpClick = () => {
        if (onClose) onClose(); // Close mobile menu
        // Navigate to login page and set signup view via URL parameter
        navigate('/login?view=signup');
    };

    // Handle clicks outside dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Loading state
    if (loading) {
        return mobile ? (
            <div className="w-full px-4 py-3 bg-slate-100 rounded-full animate-pulse">
                <div className="h-4 bg-slate-300 rounded"></div>
            </div>
        ) : (
            <div className="px-4 py-2 bg-slate-100 rounded-full animate-pulse">
                <div className="h-4 w-16 bg-slate-300 rounded"></div>
            </div>
        );
    }

    // If user is logged in
    if (session && profile) {
        return mobile ? (
            <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center space-x-3 px-4 py-3 bg-slate-50 rounded-lg">
                    <Avatar 
                        src={profile.avatar_url} 
                        fullName={profile.full_name} 
                        size="sm" 
                        key={profile.avatar_url} // Force re-render when avatar changes
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {profile.full_name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {session.user.email}
                        </p>
                    </div>
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-2">
                    <Link 
                        to="/profile"
                        onClick={handleLinkClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <User size={16} className="mr-3" />
                        View Profile
                    </Link>
                    
                    <button 
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <LogOut size={16} className="mr-3" />
                        Sign Out
                    </button>
                </div>
            </div>
        ) : (
            // Desktop dropdown version
            <div className="relative" ref={userMenuRef}>
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                    className="flex items-center space-x-2 focus:outline-none rounded-full hover:bg-slate-100 p-1 transition-colors"
                >
                    <Avatar 
                        src={profile.avatar_url} 
                        fullName={profile.full_name} 
                        size="sm" 
                        key={profile.avatar_url} // Force re-render when avatar changes
                    />
                    <span className="hidden lg:block text-sm font-medium text-slate-700">
                        {profile.full_name || 'Profile'}
                    </span>
                </button>
                
                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                                {profile.full_name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {session.user.email}
                            </p>
                        </div>
                        <div className="py-1">
                            <Link 
                                to="/profile" 
                                onClick={handleLinkClick} 
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                                <Home size={14} className="mr-2" /> Dashboard
                            </Link>
                            <Link 
                                to="/profile/settings" 
                                onClick={handleLinkClick} 
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                                <User size={14} className="mr-2" /> Profile Settings
                            </Link>
                        </div>
                        <div className="border-t border-slate-100 py-1">
                            <button 
                                onClick={handleSignOut} 
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                                <LogOut size={14} className="mr-2" /> Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // If user is not logged in - FIXED: Sign Up button navigates to login page with signup view
    return mobile ? (
        <div className="space-y-2">
            <Link 
                to="/login"
                onClick={handleLinkClick}
                className="block w-full px-4 py-2 text-center text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-full hover:bg-blue-50 transition-colors"
            >
                Sign In
            </Link>
            <button 
                onClick={handleSignUpClick}
                className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
            >
                Sign Up
            </button>
        </div>
    ) : (
        <div className="flex items-center space-x-3">
            <Link 
                to="/login"
                className="px-3 lg:px-4 py-2 text-sm font-medium rounded-full text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-colors cursor-pointer"
            >
                Sign In
            </Link>
            <button 
                onClick={handleSignUpClick}
                className="inline-flex items-center justify-center px-3 lg:px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
            >
                Sign Up
            </button>
        </div>
    );
}