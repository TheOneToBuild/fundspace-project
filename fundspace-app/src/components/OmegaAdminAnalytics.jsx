// src/components/OmegaAdminAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Star, 
    BarChart3, 
    TrendingUp, 
    Users, 
    Building2, 
    AlertTriangle,
    Calendar,
    PieChart
} from 'lucide-react';
import { isPlatformAdmin } from '../utils/permissions.js';

export default function OmegaAdminAnalytics() {
    const { profile } = useOutletContext();
    const [analytics, setAnalytics] = useState({
        userGrowth: [],
        organizationStats: {
            nonprofits: 0,
            funders: 0
        },
        membershipStats: {
            super_admins: 0,
            admins: 0,
            members: 0
        },
        grantStats: {
            total: 0,
            activeDeadlines: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (isOmegaAdmin) {
            fetchAnalytics();
        }
    }, [isOmegaAdmin]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            
            // Fetch organization breakdown
            const [nonprofitsRes, fundersRes] = await Promise.all([
                supabase.from('nonprofits').select('id', { count: 'exact', head: true }),
                supabase.from('funders').select('id', { count: 'exact', head: true })
            ]);

            // Fetch membership role breakdown
            const { data: membershipData } = await supabase
                .from('organization_memberships')
                .select('role');

            // Count roles
            const roleStats = membershipData?.reduce((acc, membership) => {
                acc[membership.role] = (acc[membership.role] || 0) + 1;
                return acc;
            }, {});

            // Fetch grant statistics
            const [grantsRes, activeGrantsRes] = await Promise.all([
                supabase.from('grants').select('id', { count: 'exact', head: true }),
                supabase.from('grants').select('id', { count: 'exact', head: true }).gt('deadline', new Date().toISOString())
            ]);

            setAnalytics({
                organizationStats: {
                    nonprofits: nonprofitsRes.count || 0,
                    funders: fundersRes.count || 0
                },
                membershipStats: {
                    super_admins: roleStats?.super_admin || 0,
                    admins: roleStats?.admin || 0,
                    members: roleStats?.member || 0
                },
                grantStats: {
                    total: grantsRes.count || 0,
                    activeDeadlines: activeGrantsRes.count || 0
                }
            });

        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Failed to load analytics data');
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
                            This page is only accessible to Omega Admins.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl text-white">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Platform Analytics</h1>
                        <p className="text-purple-100 mt-1">Comprehensive platform statistics and insights</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {/* Organization Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                        Organization Breakdown
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                                <span className="text-slate-600">Nonprofits</span>
                            </div>
                            <span className="font-semibold text-slate-800">
                                {loading ? '...' : analytics.organizationStats.nonprofits.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                                <span className="text-slate-600">Funders</span>
                            </div>
                            <span className="font-semibold text-slate-800">
                                {loading ? '...' : analytics.organizationStats.funders.toLocaleString()}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">Total Organizations</span>
                                <span className="font-bold text-lg text-slate-800">
                                    {loading ? '...' : (analytics.organizationStats.nonprofits + analytics.organizationStats.funders).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-purple-600" />
                        Role Distribution
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                                <span className="text-slate-600">Super Admins</span>
                            </div>
                            <span className="font-semibold text-slate-800">
                                {loading ? '...' : analytics.membershipStats.super_admins.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                                <span className="text-slate-600">Admins</span>
                            </div>
                            <span className="font-semibold text-slate-800">
                                {loading ? '...' : analytics.membershipStats.admins.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                                <span className="text-slate-600">Members</span>
                            </div>
                            <span className="font-semibold text-slate-800">
                                {loading ? '...' : analytics.membershipStats.members.toLocaleString()}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">Total Memberships</span>
                                <span className="font-bold text-lg text-slate-800">
                                    {loading ? '...' : (
                                        analytics.membershipStats.super_admins + 
                                        analytics.membershipStats.admins + 
                                        analytics.membershipStats.members
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grant Statistics */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                    Grant Platform Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                            {loading ? '...' : analytics.grantStats.total.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-500">Total Grants</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                            {loading ? '...' : analytics.grantStats.activeDeadlines.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-500">Active Grants</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <PieChart className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                            {loading ? '...' : analytics.grantStats.activeDeadlines > 0 ? 
                                Math.round((analytics.grantStats.activeDeadlines / analytics.grantStats.total) * 100) + '%' : '0%'}
                        </p>
                        <p className="text-sm text-slate-500">Active Rate</p>
                    </div>
                </div>
            </div>

            {/* Future Analytics Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">User Growth Trends</h2>
                    <div className="text-center py-8 text-slate-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Growth charts coming soon...</p>
                        <p className="text-sm">This will show user registration trends over time.</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Platform Activity</h2>
                    <div className="text-center py-8 text-slate-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Activity metrics coming soon...</p>
                        <p className="text-sm">This will show platform usage and engagement data.</p>
                    </div>
                </div>
            </div>

            {/* System Health */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">System Health Monitor</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <p className="font-medium text-green-800">Database</p>
                        <p className="text-sm text-green-600">Healthy</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <p className="font-medium text-green-800">API</p>
                        <p className="text-sm text-green-600">Operational</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <p className="font-medium text-green-800">Storage</p>
                        <p className="text-sm text-green-600">Available</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                        <p className="font-medium text-blue-800">Performance</p>
                        <p className="text-sm text-blue-600">Optimized</p>
                    </div>
                </div>
            </div>
        </div>
    );
}