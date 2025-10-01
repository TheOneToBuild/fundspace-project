// src/components/omega-admin/OmegaAdminGrants.jsx - Grant Management for Omega Admins
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
    FileCheck, 
    Search, 
    Filter, 
    AlertTriangle,
    ArrowLeft,
    Calendar,
    DollarSign,
    Building2,
    Eye,
    Clock,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    MapPin,
    Users,
    Star
} from 'lucide-react';
import { getGrantsWithDetails, getLocationData } from '../../utils/rpcClientFunctions';
import { isPlatformAdmin } from '../../utils/permissions.js';

const ITEMS_PER_PAGE = 20;

export default function OmegaAdminGrants() {
    const { profile } = useOutletContext();
    
    const [grants, setGrants] = useState([]);
    const [filteredGrants, setFilteredGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalGrants, setTotalGrants] = useState(0);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
        totalValue: 0
    });
    const [dropdownOpen, setDropdownOpen] = useState(null);

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);
    const totalPages = Math.ceil(totalGrants / ITEMS_PER_PAGE);

    useEffect(() => {
        if (isOmegaAdmin) {
            fetchGrants();
        }
    }, [isOmegaAdmin]);

    useEffect(() => {
        applyFilters();
    }, [grants, searchQuery, statusFilter, currentPage]);

    const fetchGrants = async () => {
        try {
            setLoading(true);
            setError('');

            // Use RPC function to fetch grants with organization details
            const grantsData = await getGrantsWithDetails({ 
                limit: 1000,
                offset: 0
            });

            setGrants(grantsData || []);
            
            // Calculate stats
            const now = new Date();
            const activeGrants = grantsData?.filter(grant => 
                grant.deadline && new Date(grant.deadline) > now
            ) || [];
            
            const expiredGrants = grantsData?.filter(grant => 
                grant.deadline && new Date(grant.deadline) <= now
            ) || [];

            const totalValue = activeGrants?.reduce((sum, grant) => {
                const amount = grant.max_funding_amount || 0;
                return sum + (typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount);
            }, 0) || 0;

            const stats = {
                total: grantsData?.length || 0,
                active: activeGrants.length,
                expired: expiredGrants.length,
                totalValue: totalValue
            };

            setStats(stats);

        } catch (err) {
            console.error('Error fetching grants:', err);
            setError('Failed to load grants: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...grants];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(grant =>
                grant.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                grant.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                grant.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                grant.grant_type?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        const now = new Date();
        switch (statusFilter) {
            case 'active':
                filtered = filtered.filter(grant => 
                    grant.deadline && new Date(grant.deadline) > now
                );
                break;
            case 'expired':
                filtered = filtered.filter(grant => 
                    grant.deadline && new Date(grant.deadline) <= now
                );
                break;
            case 'no_deadline':
                filtered = filtered.filter(grant => !grant.deadline);
                break;
            case 'all':
            default:
                // No additional filtering
                break;
        }

        setTotalGrants(filtered.length);
        
        // Paginate
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
        setFilteredGrants(filtered.slice(startIndex, endIndex));

        // Reset to first page if current page is out of bounds
        if (currentPage > 1 && startIndex >= filtered.length) {
            setCurrentPage(1);
        }
    };

    const formatAmount = (amount) => {
        if (!amount) return 'Not specified';
        
        // If amount is already a formatted string, return it
        if (typeof amount === 'string' && amount.includes('$')) {
            return amount;
        }
        
        // If it's a number, format it
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return 'Not specified';
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount);
    };

    const getGrantStatus = (grant) => {
        if (!grant.deadline) return { status: 'no_deadline', label: 'No Deadline', color: 'gray' };
        
        const now = new Date();
        const deadline = new Date(grant.deadline);
        
        if (deadline <= now) {
            return { status: 'expired', label: 'Expired', color: 'red' };
        } else {
            return { status: 'active', label: 'Active', color: 'green' };
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
            {/* Banner matches OmegaAdminUsers */}
            <div className="relative rounded-2xl overflow-hidden" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1576478015047-73879da665da?q=80&w=1326&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative px-8 py-12 lg:px-12 lg:py-16">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center mb-4">
                                <FileCheck className="w-10 h-10 mr-3 text-white" />
                                <h1 className="text-4xl lg:text-5xl font-bold text-white">Grant Management</h1>
                            </div>
                            <p className="text-xl text-white/90 mb-2">Monitor and manage all platform grant opportunities</p>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Grants - clickable */}
                <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`bg-white p-6 rounded-xl border transition-all focus:outline-none ${statusFilter === 'all' ? 'border-blue-400 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <FileCheck className="w-8 h-8 text-blue-600" />
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : stats.total.toLocaleString()}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Total Grants</p>
                </button>

                {/* Active Grants - clickable */}
                <button
                    type="button"
                    onClick={() => setStatusFilter('active')}
                    className={`bg-white p-6 rounded-xl border transition-all focus:outline-none ${statusFilter === 'active' ? 'border-green-400 shadow-md' : 'border-slate-200 hover:border-green-300'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : stats.active.toLocaleString()}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Active Grants</p>
                </button>

                {/* Expired Grants - clickable */}
                <button
                    type="button"
                    onClick={() => setStatusFilter('expired')}
                    className={`bg-white p-6 rounded-xl border transition-all focus:outline-none ${statusFilter === 'expired' ? 'border-red-400 shadow-md' : 'border-slate-200 hover:border-red-300'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-8 h-8 text-red-600" />
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : stats.expired.toLocaleString()}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Expired Grants</p>
                </button>

                {/* Total Value - not clickable */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-8 h-8 text-purple-600" />
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? '...' : formatAmount(stats.totalValue)}
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Total Value</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search grants by title, description, or organization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-slate-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="all">All Grants</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="no_deadline">No Deadline</option>
                        </select>
                    </div>
                </div>
                
                {searchQuery && (
                    <div className="mt-4 text-sm text-slate-600">
                        Found {totalGrants} grant{totalGrants !== 1 ? 's' : ''} matching "{searchQuery}"
                    </div>
                )}
            </div>

            {/* Grants List */}
            <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Grants ({totalGrants.toLocaleString()})
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
                        <p className="text-slate-500 mt-2">Loading grants...</p>
                    </div>
                ) : filteredGrants.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                            {searchQuery ? 'No grants found matching your search.' : 'No grants found.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-200">
                            {filteredGrants.map((grant) => {
                                const status = getGrantStatus(grant);
                                return (
                                    <div key={grant.id} className="p-6 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                {/* Grant Header */}
                                                <div className="flex items-start space-x-4">
                                                    {/* Organization Logo */}
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                                                        {grant.organizations?.image_url ? (
                                                            <img 
                                                                src={grant.organizations.image_url} 
                                                                alt={grant.organizations.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <Building2 size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Grant Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center space-x-3 mb-1">
                                                                    <h3 className="font-semibold text-slate-800 truncate">
                                                                        {grant.title || 'Untitled Grant'}
                                                                    </h3>
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        status.color === 'green' 
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : status.color === 'red'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {status.label}
                                                                    </span>
                                                                </div>
                                                                
                                                                <p className="text-sm text-slate-600 mb-2">
                                                                    By {grant.organizations?.name || 'Unknown Organization'}
                                                                </p>
                                                                
                                                                {grant.description && (
                                                                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                                                        {grant.description}
                                                                    </p>
                                                                )}
                                                                
                                                                <div className="flex items-center space-x-6 text-xs text-slate-500">
                                                                    <span className="flex items-center">
                                                                        <DollarSign size={12} className="mr-1" />
                                                                        {formatAmount(grant.max_funding_amount)}
                                                                    </span>
                                                                    
                                                                    {grant.deadline && (
                                                                        <span className="flex items-center">
                                                                            <Calendar size={12} className="mr-1" />
                                                                            Deadline: {new Date(grant.deadline).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                    
                                                                    {grant.grant_type && (
                                                                        <span className="flex items-center">
                                                                            <Star size={12} className="mr-1" />
                                                                            {grant.grant_type}
                                                                        </span>
                                                                    )}
                                                                    
                                                                    <span className="flex items-center">
                                                                        <Clock size={12} className="mr-1" />
                                                                        Added {grant.date_added ? new Date(grant.date_added).toLocaleDateString() : 'Unknown'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2 ml-4">
                                                {grant.application_url ? (
                                                    <a
                                                        href={grant.application_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-md hover:bg-slate-200 transition-colors"
                                                    >
                                                        <Eye size={12} className="mr-1" />
                                                        View Grant
                                                    </a>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-md cursor-not-allowed">
                                                        <Eye size={12} className="mr-1" />
                                                        No Link Available
                                                    </span>
                                                )}
                                                
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDropdownOpen(dropdownOpen === grant.id ? null : grant.id);
                                                        }}
                                                        className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-md hover:bg-slate-200 transition-colors"
                                                    >
                                                        <MoreVertical size={12} />
                                                    </button>
                                                    
                                                    {dropdownOpen === grant.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-slate-200 z-10">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteGrant(grant.id);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                            >
                                                                Delete Grant
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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