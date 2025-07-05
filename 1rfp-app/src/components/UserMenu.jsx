import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Avatar from './Avatar.jsx';
import { User, LogOut, Home } from './Icons'; // Import the Home icon

export default function UserMenu({ profile }) {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [userMenuRef]);

    return (
        <div className="relative" ref={userMenuRef}>
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="block focus:outline-none rounded-full">
                <Avatar src={profile?.avatar_url} fullName={profile?.full_name} size="sm" />
            </button>
            {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                    </div>
                    <div className="py-1">
                        {/* NEW: Link to the dashboard homepage */}
                        <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <Home size={14} className="mr-2" /> Dashboard
                        </Link>
                        <Link to="/profile/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <User size={14} className="mr-2" /> Profile Settings
                        </Link>
                    </div>
                    <div className="border-t border-slate-100 py-1">
                        <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <LogOut size={14} className="mr-2" /> Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}