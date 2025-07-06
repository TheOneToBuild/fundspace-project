// src/components/ProfileNav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import Avatar from './Avatar.jsx'; 

export default function ProfileNav({ user, profile }) {
    const navLinkClass = ({ isActive }) => 
        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive 
            ? 'bg-blue-100 text-blue-700 font-semibold' 
            : 'text-slate-600 hover:bg-slate-100'
        }`;

    return (
        <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200 text-center">
                <div className="w-20 h-20 mx-auto mb-3 ring-4 ring-blue-200 rounded-full">
                    <Avatar src={profile?.avatar_url} fullName={profile?.full_name} size="lg" />
                </div>
                <p className="font-bold text-lg text-slate-800 truncate w-full">{profile?.full_name || user?.email}</p>
                <p className="text-sm text-slate-500">{profile?.organization_name || profile?.role || 'Community Member'}</p>
                 <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                        Active now
                    </span>
                </div>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xl font-bold text-slate-800">47</p>
                        <p className="text-xs text-slate-500">Colleagues</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-800">23</p>
                        <p className="text-xs text-slate-500">In Network</p>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200">
                <nav className="space-y-1">
                    <NavLink to="/profile" end className={navLinkClass}><span>🏠</span><span>Dashboard</span></NavLink>
                    <NavLink to="/profile/members" className={navLinkClass}><span>👥</span><span>Explore Members</span></NavLink>
                    <NavLink to="/profile/saved-grants" className={navLinkClass}><span>📑</span><span>Saved Grants</span></NavLink>
                    <NavLink to="/profile/my-organization" className={navLinkClass}><span>🏢</span><span>My Organization</span></NavLink> {/* ADDED: The new link */}
                    <NavLink to="/profile/settings" className={navLinkClass}><span>⚙️</span><span>Settings</span></NavLink>
                </nav>
            </div>
        </div>
    );
};