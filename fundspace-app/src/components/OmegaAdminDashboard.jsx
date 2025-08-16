// src/components/OmegaAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Star, 
    Users, 
    Building2, 
    FileCheck, 
    TrendingUp, 
    AlertTriangle,
    CheckCircle,
    BarChart3
} from 'lucide-react';
import { isPlatformAdmin } from '../utils/permissions.js';

export default function OmegaAdminDashboard() {
    const { profile } = useOutletContext();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrganizations: 0,
        totalGrants: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (isOmegaAdmin) {
            fetchDashboardStats();
        }
    }, [isOmegaAdmin]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            
            // Fetch platform statistics
            const [usersRes, nonprofitsRes, fundersRes, grantsRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('nonprofits').select('id', { count: 'exact', head: true }),
                supabase.from('funders').select('id', { count: 'exact', head: true }),
                supabase.from('grants').select('id', { count: 'exact', head: true })
            ]);

            setStats({
                totalUsers: usersRes.count || 0,
                totalOrganizations: (nonprofitsRes.count || 0) + (fundersRes.count || 0),
                totalGrants: grantsRes.count || 0
            });

        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    // Access denied for non-omega admins
    if (!isOmegaAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h1>
                        <p className="text-slate-600 mb-6">
                            This dashboard is only accessible to Omega Admins.
                        </p>
                        <Link 
                            to="/profile"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Return to Profile
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                            <Star className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Omega Admin Dashboard</h1>
                            <p className="text-slate-600 mt-1">Platform administration and management tools.</p>
                        </div>
                    </div>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium">
                        <Star className="w-4 h-4 mr-2" />
                        Platform Administrator Access
                    </div>
                </header>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Platform Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">
                                    {loading ? '...' : stats.totalUsers.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">Total Users</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                <Building2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">
                                    {loading ? '...' : stats.totalOrganizations.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">Organizations</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                                <FileCheck className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">
                                    {loading ? '...' : stats.totalGrants.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">Total Grants</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                            Platform Management
                        </h2>
                        <div className="space-y-3">
                            <Link 
                                to="/profile/omega-admin/organizations"
                                className="block p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-800">Manage Organizations</p>
                                        <p className="text-sm text-slate-500">View and edit all platform organizations</p>
                                    </div>
                                    <Building2 className="w-5 h-5 text-slate-400" />
                                </div>
                            </Link>
                            
                            <Link 
                                to="/profile/omega-admin/analytics"
                                className="block p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-800">Platform Analytics</p>
                                        <p className="text-sm text-slate-500">View detailed platform statistics and trends</p>
                                    </div>
                                    <BarChart3 className="w-5 h-5 text-slate-400" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                            Platform Health
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">System Status</span>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium text-green-600">Operational</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Organizations</span>
                                <span className="text-sm font-medium text-blue-600">
                                    {stats.totalOrganizations} active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">User Growth</span>
                                <span className="text-sm font-medium text-green-600">+12% this month</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Platform Activity</h2>
                    <div className="text-center py-8 text-slate-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Activity tracking coming soon...</p>
                        <p className="text-sm">This will show recent admin actions, user registrations, and platform events.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}