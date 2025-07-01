// src/components/ProfileNav.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const BookmarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const NavLink = ({ to, icon, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
            {icon}<span>{children}</span>
        </Link>
    );
};

// --- UPDATED to accept and use the 'profile' prop ---
export default function ProfileNav({ user, profile }) {
    const getInitials = (name) => {
        if (!name) return user?.email?.charAt(0).toUpperCase() || '?';
        const words = name.split(' ');
        if (words.length > 1 && words[1]) return (words[0][0] + words[1][0]).toUpperCase();
        if (words.length > 0 && words[0]) return words[0].substring(0, 2).toUpperCase();
        return '?';
    };

    return (
        <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200">
            <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-3xl mb-3 ring-4 ring-blue-200">
                    {/* Use full_name for initials */}
                    {getInitials(profile?.full_name)}
                </div>
                {/* Display full_name and dynamic role */}
                <p className="font-bold text-lg text-slate-800 truncate w-full">{profile?.full_name || user?.email}</p>
                <p className="text-sm text-slate-500">{profile?.role || 'Community Member'}</p>
            </div>
            <nav className="mt-6 space-y-1">
                <NavLink to="/profile" icon={<HomeIcon />}>Dashboard</NavLink>
                <NavLink to="/profile/saved-grants" icon={<BookmarkIcon />}>Saved Grants</NavLink>
                <NavLink to="/profile/settings" icon={<CogIcon />}>Settings</NavLink>
            </nav>
        </div>
    );
}