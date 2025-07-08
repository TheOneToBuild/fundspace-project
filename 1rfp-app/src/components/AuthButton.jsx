// Update your existing src/components/AuthButton.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { LogOut, User } from './Icons.jsx';

export default function AuthButton({ mobile = false, onClose }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        if (onClose) onClose(); // Close mobile menu if provided
    };

    const handleLinkClick = () => {
        if (onClose) onClose(); // Close mobile menu when navigating
    };

    if (loading) {
        return mobile ? (
            <div className="w-full px-4 py-3 bg-slate-100 rounded-lg animate-pulse">
                <div className="h-4 bg-slate-300 rounded"></div>
            </div>
        ) : (
            <div className="px-4 py-2 bg-slate-100 rounded-lg animate-pulse">
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
                    <Avatar src={profile.avatar_url} fullName={profile.full_name} size="sm" />
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
            <div className="flex items-center space-x-3">
                <Avatar src={profile.avatar_url} fullName={profile.full_name} size="sm" />
                <Link 
                    to="/profile"
                    className="hidden lg:block text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                    {profile.full_name || 'Profile'}
                </Link>
            </div>
        );
    }

    // If user is not logged in
    return mobile ? (
        <Link 
            to="/login"
            onClick={handleLinkClick}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
            Sign In
        </Link>
    ) : (
        <Link 
            to="/login"
            className="px-3 lg:px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-colors"
        >
            Sign In
        </Link>
    );
}