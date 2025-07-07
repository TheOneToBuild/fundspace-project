// Updated ProfileNav.jsx with Omega Admin section
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Star } from 'lucide-react';
import Avatar from './Avatar.jsx'; 
import { isPlatformAdmin } from '../utils/permissions.js';

export default function ProfileNav({ user, profile }) {
    const navLinkClass = ({ isActive }) => 
        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive 
            ? 'bg-blue-100 text-blue-700 font-semibold' 
            : 'text-slate-600 hover:bg-slate-100'
        }`;

    const omegaNavLinkClass = ({ isActive }) => 
        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold' 
            : 'text-purple-700 hover:bg-purple-50'
        }`;

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    return (
        <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200 text-center">
                <div className="w-20 h-20 mx-auto mb-3 ring-4 ring-blue-200 rounded-full">
                    <Avatar src={profile?.avatar_url} fullName={profile?.full_name} size="lg" />
                </div>
                <p className="font-bold text-lg text-slate-800 truncate w-full">{profile?.full_name || user?.email}</p>
                <p className="text-sm text-slate-500">{profile?.organization_name || profile?.role || 'Community Member'}</p>
                <div className="mt-2 space-y-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                        Active now
                    </span>
                    {/* Omega Admin Badge */}
                    {isOmegaAdmin && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium">
                            <Star className="w-3 h-3 mr-1" />
                            Platform Admin
                        </div>
                    )}
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
                    <NavLink to="/profile/my-organization" className={navLinkClass}><span>🏢</span><span>My Organization</span></NavLink>
                    <NavLink to="/profile/settings" className={navLinkClass}><span>⚙️</span><span>Settings</span></NavLink>
                </nav>
            </div>
            
            {/* Omega Admin Section */}
            {isOmegaAdmin && (
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md border border-purple-200">
                    <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                            <Star className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-purple-800">Platform Admin</h3>
                    </div>
                    <nav className="space-y-1">
                        <NavLink to="/profile/omega-admin" end className={omegaNavLinkClass}>
                            <span>🚀</span>
                            <span>Admin Dashboard</span>
                        </NavLink>
                        <NavLink to="/profile/omega-admin/claims" className={omegaNavLinkClass}>
                            <span>✋</span>
                            <span>Review Claims</span>
                        </NavLink>
                        <NavLink to="/profile/omega-admin/analytics" className={omegaNavLinkClass}>
                            <span>📊</span>
                            <span>Platform Analytics</span>
                        </NavLink>
                    </nav>
                </div>
            )}
        </div>
    );
};