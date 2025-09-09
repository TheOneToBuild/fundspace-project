// src/components/omega-admin/OmegaAdminUsers.jsx - Working Version
import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
    Users, 
    Search, 
    Filter, 
    AlertTriangle,
    ArrowLeft,
    Crown,
    Eye,
    TrendingUp,
    UserCheck,
    MapPin,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    MoreVertical
} from 'lucide-react';
import Avatar from '../Avatar.jsx';
import { isPlatformAdmin } from '../../utils/permissions.js';

const ITEMS_PER_PAGE = 20;

export default function OmegaAdminUsers() {
    const { profile } = useOutletContext();
    const [searchParams] = useSearchParams();
    const filter = searchParams.get('filter') || 'all';
    
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [stats, setStats] = useState({
        total: 0,
        activeUsers: 0,
        completedOnboarding: 0,
        omegaAdmins: 0
    });

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);
    const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

    useEffect(() => {
        if (isOmegaAdmin) {
            fetchUsers();
        }
    }, [isOmegaAdmin]);

    useEffect(() => {
        applyFilters();
    }, [users, filter, searchQuery, currentPage]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');

            // Query only fields that exist in the profiles table
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    title,
                    organization_name,
                    role,
                    location,
                    is_omega_admin,
                    bio,
                    onboarding_completed,
                    signup_step_completed,
                    updated_at
                `)
                .order('updated_at', { ascending: false });

            if (usersError) {
                console.error('Error details:', usersError);
                throw usersError;
            }

            setUsers(usersData || []);
            
            // Calculate stats using available data
            const stats = {
                total: usersData?.length || 0,
                activeUsers: usersData?.filter(user => user.updated_at).length || 0,
                completedOnboarding: usersData?.filter(user => user.onboarding_completed).length || 0,
                omegaAdmins: usersData?.filter(user => user.is_omega_admin).length || 0
            };

            setStats(stats);

        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...users];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(user =>
                user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.location?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply filter-based filters
        switch (filter) {
            case 'active_today':
                // Show users with updated profiles recently
                filtered = filtered.filter(user => user.updated_at);
                break;
            case 'new_this_week':
                // Show users who haven't completed onboarding (likely new)
                filtered = filtered.filter(user => !user.onboarding_completed);
                break;
            case 'omega_admins':
                filtered = filtered.filter(user => user.is_omega_admin);
                break;
            case 'all':
            default:
                // No additional filtering
                break;
        }

        setTotalUsers(filtered.length);
        
        // Paginate
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
        setFilteredUsers(filtered.slice(startIndex, endIndex));

        // Reset to first page if current page is out of bounds
        if (currentPage > 1 && startIndex >= filtered.length) {
            setCurrentPage(1);
        }
    };

    const getFilterTitle = () => {
        switch (filter) {
            case 'active_today':
                return 'Active Users';
            case 'new_this_week':
                return 'New Users';
            case 'omega_admins':
                return 'Omega Admins';
            default:
                return 'All Users';
        }
    };

    const getFilterDescription = () => {
        switch (filter) {
            case 'active_today':
                return 'Users with profile activity';
            case 'new_this_week':
                return 'Users who haven\'t completed onboarding';
            case 'omega_admins':
                return 'Platform administrators with omega access';
            default:
                return 'All registered platform users';
        }
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
                            This page is only accessible to Omega Admins.
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
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center mb-2">
                            <Users className="w-8 h-8 mr-3" />
                            <h1 className="text-3xl font-bold">{getFilterTitle()}</h1>
                        </div>
                        <p className="text-purple-100">{getFilterDescription()}</p>
                    </div>
                    <Link 
                        to="/profile/omega-admin"
                        className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Link 
                    to="/profile/omega-admin/users"
                    className={`bg-white p-6 rounded-xl border transition-all ${
                        filter === 'all' 
                            ? 'border-blue-300 shadow-md' 
                            : 'border-slate-200 hover:border-blue-200 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : stats.total.toLocaleString()}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Total Users</p>
                </Link>

                <Link 
                    to="/profile/omega-admin/users?filter=active_today"
                    className={`bg-white p-6 rounded-xl border transition-all ${
                        filter === 'active_today' 
                            ? 'border-green-300 shadow-md' 
                            : 'border-slate-200 hover:border-green-200 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : stats.activeUsers.toLocaleString()}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Active Users</p>
                </Link>

                <Link 
                    to="/profile/omega-admin/users?filter=new_this_week"
                    className={`bg-white p-6 rounded-xl border transition-all ${
                        filter === 'new_this_week' 
                            ? 'border-purple-300 shadow-md' 
                            : 'border-slate-200 hover:border-purple-200 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <UserCheck className="w-8 h-8 text-purple-600" />
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : (stats.total - stats.completedOnboarding).toLocaleString()}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">New Users</p>
                </Link>

                <Link 
                    to="/profile/omega-admin/users?filter=omega_admins"
                    className={`bg-white p-6 rounded-xl border transition-all ${
                        filter === 'omega_admins' 
                            ? 'border-yellow-300 shadow-md' 
                            : 'border-slate-200 hover:border-yellow-200 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <Crown className="w-8 h-8 text-yellow-600" />
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : stats.omegaAdmins.toLocaleString()}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Omega Admins</p>
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search users by name, title, organization, or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>
                </div>
                
                {searchQuery && (
                    <div className="mt-4 text-sm text-slate-600">
                        Found {totalUsers} user{totalUsers !== 1 ? 's' : ''} matching "{searchQuery}"
                    </div>
                )}
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Users ({totalUsers.toLocaleString()})
                        </h2>
                        {totalPages > 1 && (
                            <div className="text-sm text-slate-500">
                                Page {currentPage} of {totalPages}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-slate-500 mt-2">Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                            {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-200">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {/* Avatar */}
                                            <div className="relative">
                                                <Avatar 
                                                    src={user.avatar_url} 
                                                    fullName={user.full_name} 
                                                    size="lg" 
                                                />
                                                {user.is_omega_admin && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                                        <Crown size={12} className="text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="font-semibold text-slate-800">
                                                        {user.full_name || 'Unknown User'}
                                                    </h3>
                                                    {user.is_omega_admin && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            <Crown size={10} className="mr-1" />
                                                            Omega Admin
                                                        </span>
                                                    )}
                                                </div>
                                                {user.title && (
                                                    <p className="text-sm text-slate-600">{user.title}</p>
                                                )}
                                                {user.organization_name && (
                                                    <p className="text-sm text-slate-600">{user.organization_name}</p>
                                                )}
                                                <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                                                    {user.location && (
                                                        <span className="flex items-center">
                                                            <MapPin size={12} className="mr-1" />
                                                            {user.location}
                                                        </span>
                                                    )}
                                                    {user.role && (
                                                        <span className="flex items-center">
                                                            <Users size={12} className="mr-1" />
                                                            {user.role}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center">
                                                        <CheckCircle size={12} className="mr-1" />
                                                        {user.onboarding_completed ? 'Onboarding Complete' : 'Onboarding Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-2">
                                            <Link
                                                to={`/profile/members/${user.id}`}
                                                className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-md hover:bg-slate-200 transition-colors"
                                            >
                                                <Eye size={12} className="mr-1" />
                                                View Profile
                                            </Link>
                                            
                                            <button className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-md hover:bg-slate-200 transition-colors">
                                                <MoreVertical size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center space-x-2 p-6 border-t border-slate-200">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} className="mr-1" />
                                    Previous
                                </button>
                                
                                <div className="flex items-center space-x-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const page = index + 1;
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-3 py-2 text-sm rounded-md ${
                                                        page === currentPage
                                                            ? 'bg-purple-600 text-white'
                                                            : 'border border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (
                                            page === currentPage - 2 ||
                                            page === currentPage + 2
                                        ) {
                                            return <span key={page} className="px-2 text-slate-400">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight size={16} className="ml-1" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}