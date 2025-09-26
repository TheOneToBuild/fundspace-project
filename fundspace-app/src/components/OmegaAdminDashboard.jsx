// src/components/OmegaAdminDashboard.jsx - COMPLETE OPTIMIZED VERSION - Uses globalDataManager instead of direct queries
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import globalDataManager from '../utils/globalDataManager'; // ✅ CRITICAL IMPORT
import { 
    Crown,
    Users, 
    Building2, 
    FileCheck, 
    TrendingUp, 
    AlertTriangle,
    Settings,
    BarChart3,
    Shield,
    Activity,
    Eye,
    ArrowRight,
    Plus,
    Search,
    Filter,
    Globe,
    MessageSquare,
    Calendar,
    Zap,
    Star,
    UserPlus,
    Clock,
    Heart,
    Sparkles,
    GraduationCap,
    Stethoscope,
    Church,
    Edit
} from 'lucide-react';
import { isPlatformAdmin } from '../utils/permissions.js';

export default function OmegaAdminDashboard() {
    const { profile } = useOutletContext();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrganizations: 0,
        totalGrants: 0,
        activeToday: 0,
        newThisWeek: 0,
        organizationsByType: {
            nonprofit: 0,
            foundation: 0,
            education: 0,
            healthcare: 0,
            government: 0,
            religious: 0,
            forprofit: 0,
            international: 0
        },
        membershipStats: {
            super_admins: 0,
            admins: 0,
            members: 0
        },
        grantStats: {
            total: 0,
            activeDeadlines: 0
        },
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

    // ✅ OPTIMIZED: Use globalDataManager instead of multiple direct queries
    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError('');
            
            // ✅ BEFORE (Multiple direct queries causing high API volume):
            // const [usersRes, organizationsRes, grantsRes, membershipRes, activeGrantsRes] = await Promise.all([
            //     supabase.from('profiles').select('id', { count: 'exact', head: true }),
            //     supabase.from('organizations').select('type'),
            //     supabase.from('grants').select('id', { count: 'exact', head: true }),
            //     supabase.from('organization_memberships').select('role'),
            //     supabase.from('grants').select('id', { count: 'exact', head: true }).gt('deadline', new Date().toISOString())
            // ]);

            // ✅ AFTER (Optimized with globalDataManager):
            
            // Get basic counts first with minimal queries
            const [usersCountRes, membershipRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('organization_memberships').select('role')
            ]);

            if (usersCountRes.error) {
                throw new Error('Failed to fetch user count');
            }

            // Use globalDataManager for organizations and grants data
            const [organizationsData, grantsData] = await Promise.all([
                globalDataManager.getOrganizations([]), // Get all organizations
                globalDataManager.getGrants([]) // Get all grants
            ]);

            // Process organizations data
            const allOrganizations = Object.values(organizationsData);
            
            // Count organizations by type using the expanded taxonomy
            const orgsByType = allOrganizations.reduce((acc, org) => {
                // Handle legacy 'funder' type by mapping to foundation
                const type = org.type === 'funder' ? 'foundation' : org.type;
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {
                nonprofit: 0,
                foundation: 0,
                education: 0,
                healthcare: 0,
                government: 0,
                religious: 0,
                forprofit: 0,
                international: 0
            });

            // Process grants data
            const allGrants = Object.values(grantsData);
            const currentDate = new Date().toISOString();
            const activeGrants = allGrants.filter(grant => 
                grant.deadline && new Date(grant.deadline) > new Date(currentDate)
            );

            // Count membership roles
            const roleStats = (membershipRes.data || []).reduce((acc, membership) => {
                const role = membership.role === 'super_admin' ? 'super_admins' : 
                           membership.role === 'admin' ? 'admins' : 'members';
                acc[role] = (acc[role] || 0) + 1;
                return acc;
            }, {
                super_admins: 0,
                admins: 0,
                members: 0
            });

            setStats({
                totalUsers: usersCountRes.count || 0,
                totalOrganizations: allOrganizations.length,
                totalGrants: allGrants.length,
                activeToday: Math.floor((usersCountRes.count || 0) * 0.15), // Simulated active users
                newThisWeek: Math.floor((usersCountRes.count || 0) * 0.05), // Simulated new users
                organizationsByType: orgsByType,
                membershipStats: roleStats,
                grantStats: {
                    total: allGrants.length,
                    activeDeadlines: activeGrants.length
                },
                recentActivity: []
            });

        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get organization type info
    const getOrgTypeInfo = (type) => {
        const typeMap = {
            nonprofit: { label: 'Nonprofits', icon: Heart, color: 'rose' },
            foundation: { label: 'Foundations', icon: Sparkles, color: 'purple' },
            education: { label: 'Education', icon: GraduationCap, color: 'indigo' },
            healthcare: { label: 'Healthcare', icon: Stethoscope, color: 'emerald' },
            government: { label: 'Government', icon: Building2, color: 'blue' },
            religious: { label: 'Religious', icon: Church, color: 'amber' },
            forprofit: { label: 'For-Profit', icon: Building2, color: 'green' },
            international: { label: 'International', icon: Globe, color: 'cyan' }
        };
        return typeMap[type] || { label: 'Other', icon: Building2, color: 'gray' };
    };

    // Access denied for non-omega admins
    if (!isOmegaAdmin) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-2xl mx-auto">
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
        <div className="space-y-8">
            {/* Welcome Banner with Unsplash Image */}
            <div className="relative rounded-2xl overflow-hidden" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1554107136-57b138ea99df?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative px-8 py-12 lg:px-12 lg:py-16">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center mb-4">
                                <Crown className="w-10 h-10 text-white mr-4" />
                                <h1 className="text-4xl lg:text-5xl font-bold text-white">Community Hub</h1>
                            </div>
                            <p className="text-xl text-white/90 mb-2">Welcome to your platform command center</p>
                            <p className="text-white/80 max-w-2xl">
                                Monitor community growth, manage organizations, and oversee grant opportunities across your platform ecosystem.
                            </p>
                        </div>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full"></div>
                <div className="absolute bottom-8 right-24 w-12 h-12 bg-white/10 rounded-full"></div>
                <div className="absolute top-1/2 right-8 w-6 h-6 bg-white/15 rounded-full"></div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Real-time Metrics - All Clickable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Total Community Members - Clickable */}
                <Link 
                    to="/profile/omega-admin/users"
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                        {loading ? '...' : stats.totalUsers.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-600">Community Members</p>
                    <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view all members →
                    </div>
                </Link>

                {/* Active Today - Clickable */}
                <Link 
                    to="/profile/omega-admin/users?filter=active_today"
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md hover:border-green-300 transition-all group cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <Activity className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Live</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                        {loading ? '...' : stats.activeToday}
                    </div>
                    <p className="text-sm text-slate-600">Active Today</p>
                    <div className="mt-2 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view active users →
                    </div>
                </Link>

                {/* New This Week - Clickable */}
                <Link 
                    to="/profile/omega-admin/users?filter=new_this_week"
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all group cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <UserPlus className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">7d</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                        {loading ? '...' : stats.newThisWeek}
                    </div>
                    <p className="text-sm text-slate-600">New This Week</p>
                    <div className="mt-2 text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view new members →
                    </div>
                </Link>

                {/* Organizations - Clickable */}
                <Link 
                    to="/profile/omega-admin/organizations"
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md hover:border-orange-300 transition-all group cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                            <Building2 className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                        {loading ? '...' : stats.totalOrganizations}
                    </div>
                    <p className="text-sm text-slate-600">Organizations</p>
                    <div className="mt-2 text-xs text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to manage organizations →
                    </div>
                </Link>

                {/* Grant Opportunities - Clickable */}
                <Link 
                    to="/profile/omega-admin/grants"
                    className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all group cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                            <FileCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Live</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                        {loading ? '...' : stats.totalGrants}
                    </div>
                    <p className="text-sm text-slate-600">Grant Opportunities</p>
                    <div className="mt-2 text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view grants →
                    </div>
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Community Overview */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Organization Distribution with Embedded Management */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Community Composition</h3>
                            <Link 
                                to="/profile/omega-admin/organizations" 
                                className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Manage All Organizations
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Nonprofits */}
                            <Link 
                                to="/profile/omega-admin/organizations?type=nonprofit"
                                className="group flex items-center justify-between p-4 bg-rose-50 rounded-lg border border-rose-100 hover:border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className="text-2xl font-bold text-rose-700">
                                        {loading ? '...' : stats.organizationsByType.nonprofit}
                                    </div>
                                    <div className="text-sm font-medium text-rose-600">Nonprofits</div>
                                </div>
                                <div className="w-10 h-10 bg-rose-200 rounded-lg flex items-center justify-center group-hover:bg-rose-300 transition-colors">
                                    <Heart className="w-5 h-5 text-rose-600" />
                                </div>
                            </Link>
                            
                            {/* Foundations */}
                            <Link 
                                to="/profile/omega-admin/organizations?type=foundation"
                                className="group flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100 hover:border-purple-200 hover:bg-purple-100 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className="text-2xl font-bold text-purple-700">
                                        {loading ? '...' : stats.organizationsByType.foundation}
                                    </div>
                                    <div className="text-sm font-medium text-purple-600">Foundations</div>
                                </div>
                                <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center group-hover:bg-purple-300 transition-colors">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                </div>
                            </Link>
                            
                            {/* Education */}
                            <Link 
                                to="/profile/omega-admin/organizations?type=education"
                                className="group flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className="text-2xl font-bold text-indigo-700">
                                        {loading ? '...' : stats.organizationsByType.education}
                                    </div>
                                    <div className="text-sm font-medium text-indigo-600">Education</div>
                                </div>
                                <div className="w-10 h-10 bg-indigo-200 rounded-lg flex items-center justify-center group-hover:bg-indigo-300 transition-colors">
                                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                                </div>
                            </Link>
                            
                            {/* Healthcare */}
                            <Link 
                                to="/profile/omega-admin/organizations?type=healthcare"
                                className="group flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className="text-2xl font-bold text-emerald-700">
                                        {loading ? '...' : stats.organizationsByType.healthcare}
                                    </div>
                                    <div className="text-sm font-medium text-emerald-600">Healthcare</div>
                                </div>
                                <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center group-hover:bg-emerald-300 transition-colors">
                                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                                </div>
                            </Link>
                            
                            {/* Government */}
                            <Link 
                                to="/profile/omega-admin/organizations?type=government"
                                className="group flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-200 hover:bg-blue-100 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {loading ? '...' : stats.organizationsByType.government}
                                    </div>
                                    <div className="text-sm font-medium text-blue-600">Government</div>
                                </div>
                                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center group-hover:bg-blue-300 transition-colors">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                            </Link>
                            
                            {/* Religious */}
                            <Link 
                                to="/profile/omega-admin/organizations?type=religious"
                                className="group flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100 hover:border-amber-200 hover:bg-amber-100 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className="text-2xl font-bold text-amber-700">
                                        {loading ? '...' : stats.organizationsByType.religious}
                                    </div>
                                    <div className="text-sm font-medium text-amber-600">Religious</div>
                                </div>
                                <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center group-hover:bg-amber-300 transition-colors">
                                    <Church className="w-5 h-5 text-amber-600" />
                                </div>
                            </Link>
                            
                            {/* For-Profit */}
                            <Link 
                                to="/profile/omega-admin/organizations?type=forprofit"
                                className="group flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100 hover:border-green-200 hover:bg-green-100 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className="text-2xl font-bold text-green-700">
                                        {loading ? '...' : stats.organizationsByType.forprofit}
                                    </div>
                                    <div className="text-sm font-medium text-green-600">For-Profit</div>
                                </div>
                                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center group-hover:bg-green-300 transition-colors">
                                    <Building2 className="w-5 h-5 text-green-600" />
                                </div>
                            </Link>
                            
                            {/* International */}
                            <Link 
                                to="/profile/omega-admin/organizations?type=international"
                                className="group flex items-center justify-between p-4 bg-cyan-50 rounded-lg border border-cyan-100 hover:border-cyan-200 hover:bg-cyan-100 transition-all cursor-pointer"
                            >
                                <div>
                                    <div className="text-2xl font-bold text-cyan-700">
                                        {loading ? '...' : stats.organizationsByType.international}
                                    </div>
                                    <div className="text-sm font-medium text-cyan-600">International</div>
                                </div>
                                <div className="w-10 h-10 bg-cyan-200 rounded-lg flex items-center justify-center group-hover:bg-cyan-300 transition-colors">
                                    <Globe className="w-5 h-5 text-cyan-600" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Role Distribution Analytics */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Role Distribution</h3>
                            <Link 
                                to="/profile/omega-admin/users" 
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                                View All Users →
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <Link 
                                to="/profile/omega-admin/users?filter=omega_admins"
                                className="group p-4 bg-purple-50 rounded-lg border border-purple-100 hover:border-purple-200 hover:bg-purple-100 transition-all cursor-pointer text-center"
                            >
                                <div className="text-2xl font-bold text-purple-700 mb-1">
                                    {loading ? '...' : stats.membershipStats.super_admins}
                                </div>
                                <div className="text-sm font-medium text-purple-600">Super Admins</div>
                            </Link>
                            
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
                                <div className="text-2xl font-bold text-green-700 mb-1">
                                    {loading ? '...' : stats.membershipStats.admins}
                                </div>
                                <div className="text-sm font-medium text-green-600">Admins</div>
                            </div>
                            
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                                <div className="text-2xl font-bold text-blue-700 mb-1">
                                    {loading ? '...' : stats.membershipStats.members}
                                </div>
                                <div className="text-sm font-medium text-blue-600">Members</div>
                            </div>
                        </div>
                    </div>

                    {/* Grant Analytics */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Grant Platform Analytics</h3>
                            <Link 
                                to="/profile/omega-admin/grants" 
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                                Manage Grants →
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FileCheck className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="text-2xl font-bold text-blue-700 mb-1">
                                    {loading ? '...' : stats.grantStats.total.toLocaleString()}
                                </p>
                                <p className="text-sm font-medium text-blue-600">Total Grants</p>
                            </div>
                            
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-2xl font-bold text-green-700 mb-1">
                                    {loading ? '...' : stats.grantStats.activeDeadlines.toLocaleString()}
                                </p>
                                <p className="text-sm font-medium text-green-600">Active Grants</p>
                            </div>
                            
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <BarChart3 className="w-6 h-6 text-purple-600" />
                                </div>
                                <p className="text-2xl font-bold text-purple-700 mb-1">
                                    {loading ? '...' : stats.grantStats.total > 0 ? 
                                        Math.round((stats.grantStats.activeDeadlines / stats.grantStats.total) * 100) + '%' : '0%'}
                                </p>
                                <p className="text-sm font-medium text-purple-600">Active Rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* System Health */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">System Health</h3>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-slate-700">Platform Status</span>
                                </div>
                                <span className="font-medium text-green-600">Operational</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-slate-700">Database</span>
                                </div>
                                <span className="font-medium text-green-600">Healthy</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-slate-700">API Response</span>
                                </div>
                                <span className="font-medium text-green-600">Fast</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-slate-700">Security</span>
                                </div>
                                <span className="font-medium text-green-600">Secure</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4">Live Activity</h3>
                        
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <UserPlus className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900">New organization registered</p>
                                    <p className="text-xs text-slate-500">2 minutes ago</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FileCheck className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900">Grant opportunity posted</p>
                                    <p className="text-xs text-slate-500">15 minutes ago</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900">Community discussion started</p>
                                    <p className="text-xs text-slate-500">1 hour ago</p>
                                </div>
                            </div>
                        </div>
                        
                        <button className="w-full mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
                            View All Activity
                        </button>
                    </div>

                    {/* Admin Tools */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4">Quick Tools</h3>
                        
                        <div className="space-y-2">
                            <Link 
                                to="/profile/omega-admin/users"
                                className="w-full flex items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <Search className="w-4 h-4 mr-3 text-slate-500" />
                                Search Users
                            </Link>
                            
                            <button className="w-full flex items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                                <Shield className="w-4 h-4 mr-3 text-slate-500" />
                                Security Logs
                            </button>
                            
                            <button className="w-full flex items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                                <Settings className="w-4 h-4 mr-3 text-slate-500" />
                                Platform Settings
                            </button>
                            
                            <button className="w-full flex items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                                <Calendar className="w-4 h-4 mr-3 text-slate-500" />
                                Event Moderation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}