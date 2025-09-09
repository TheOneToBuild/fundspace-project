// src/components/OmegaAdminOrgSelector.jsx - FIXED: Use unified organizations table
import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Star, 
    Search, 
    Users, 
    Edit3, 
    Shield, 
    AlertTriangle,
    Building2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { isPlatformAdmin, getOrgTypeIcon, getOrgTypeLabel } from '../utils/permissions.js';

const ITEMS_PER_PAGE = 12;

export default function OmegaAdminOrgSelector() {
    const { profile } = useOutletContext();
    const [organizations, setOrganizations] = useState([]);
    const [filteredOrgs, setFilteredOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [memberCounts, setMemberCounts] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrgs, setTotalOrgs] = useState(0);
    
    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);
    const totalPages = Math.ceil(totalOrgs / ITEMS_PER_PAGE);

    useEffect(() => {
        if (isOmegaAdmin) {
            fetchOrganizations();
        }
    }, [isOmegaAdmin]);

    // Filter organizations based on search query
    useEffect(() => {
        let filtered;
        if (!searchQuery.trim()) {
            filtered = organizations;
        } else {
            filtered = organizations.filter(org =>
                org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.type?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setTotalOrgs(filtered.length);
        setCurrentPage(1); // Reset to first page when filtering
        
        // Paginate the filtered results
        const startIndex = 0; // Always start from first page when filtering
        const endIndex = Math.min(ITEMS_PER_PAGE, filtered.length);
        setFilteredOrgs(filtered.slice(startIndex, endIndex));
    }, [searchQuery, organizations]);

    // Handle pagination separately
    useEffect(() => {
        let filtered;
        if (!searchQuery.trim()) {
            filtered = organizations;
        } else {
            filtered = organizations.filter(org =>
                org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.type?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
        setFilteredOrgs(filtered.slice(startIndex, endIndex));
    }, [currentPage, organizations, searchQuery]);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            setError('');
            
            // FIXED: Use unified organizations table
            const { data: organizations, error: orgsError } = await supabase
                .from('organizations')
                .select('id, name, type, location, slug, image_url, tagline')
                .order('name');

            if (orgsError) {
                console.error('Error fetching organizations:', orgsError);
                throw orgsError;
            }

            // Transform the data to match the expected format
            const formattedOrgs = (organizations || []).map(org => ({
                ...org,
                // Ensure consistent image field names
                logo_url: org.image_url,
                // Add type-specific formatting if needed
                displayType: getOrgTypeLabel(org.type)
            }));

            setOrganizations(formattedOrgs);
            await fetchMemberCounts(formattedOrgs);
            
        } catch (err) {
            console.error('Error in fetchOrganizations:', err);
            setError('Failed to load organizations: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberCounts = async (orgs) => {
        try {
            const counts = {};
            
            // Fetch member counts for each organization
            await Promise.all(orgs.map(async (org) => {
                const { count, error } = await supabase
                    .from('organization_memberships')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', org.id)
                    .eq('organization_type', org.type);
                
                if (!error) {
                    counts[`${org.type}-${org.id}`] = count || 0;
                }
            }));
            
            setMemberCounts(counts);
        } catch (err) {
            console.error('Error fetching member counts:', err);
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
                        <Star className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Omega Admin: Organization Management</h1>
                        <p className="text-purple-100 mt-1">Select an organization to view or edit</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {organizations.length}
                        </div>
                        <div className="text-sm text-slate-600">Total Organizations</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {organizations.filter(org => org.type === 'nonprofit').length}
                        </div>
                        <div className="text-sm text-slate-600">Nonprofits</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {organizations.filter(org => org.type === 'funder').length}
                        </div>
                        <div className="text-sm text-slate-600">Funders</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {Object.values(memberCounts).reduce((sum, count) => sum + count, 0)}
                        </div>
                        <div className="text-sm text-slate-600">Total Members</div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search organizations by name, location, or type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>
                </div>
                
                {searchQuery && (
                    <div className="mt-4 text-sm text-slate-600">
                        Found {totalOrgs} organization{totalOrgs !== 1 ? 's' : ''} matching "{searchQuery}"
                    </div>
                )}
            </div>

            {/* Organizations Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Organizations {searchQuery ? `(${totalOrgs} results)` : `(${organizations.length} total)`}
                        </h2>
                        
                        {/* Pagination Info */}
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
                        <p className="text-slate-500 mt-2">Loading organizations...</p>
                    </div>
                ) : filteredOrgs.length === 0 ? (
                    <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                            {searchQuery ? 'No organizations found matching your search.' : 'No organizations found.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {filteredOrgs.map((org) => (
                                <div key={`${org.type}-${org.id}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-start space-x-4">
                                        {/* Organization Image */}
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                                            {org.image_url || org.logo_url ? (
                                                <img 
                                                    src={org.image_url || org.logo_url} 
                                                    alt={org.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Building2 size={24} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Organization Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3 className="font-semibold text-slate-800 truncate">
                                                    {org.name}
                                                </h3>
                                                <span className="text-lg">{getOrgTypeIcon(org.type)}</span>
                                            </div>
                                            
                                            <p className="text-xs text-purple-600 font-medium mb-1">
                                                {getOrgTypeLabel(org.type)}
                                            </p>
                                            
                                            {org.tagline && (
                                                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                                    {org.tagline}
                                                </p>
                                            )}
                                            
                                            {org.location && (
                                                <p className="text-xs text-slate-500 mb-2">
                                                    📍 {org.location}
                                                </p>
                                            )}
                                            
                                            <div className="flex items-center space-x-4 text-xs text-slate-500 mb-3">
                                                <span className="flex items-center">
                                                    <Users size={12} className="mr-1" />
                                                    {memberCounts[`${org.type}-${org.id}`] || 0} members
                                                </span>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex space-x-2">
                                                <Link
                                                    to={`/profile/omega-admin/organizations/edit/${org.type}/${org.id}`}
                                                    className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                                                >
                                                    <Edit3 size={12} className="mr-1" />
                                                    Edit
                                                </Link>
                                                <Link
                                                    to={`/profile/omega-admin/organizations/members/${org.type}/${org.id}`}
                                                    className="flex items-center px-3 py-1.5 bg-slate-600 text-white text-xs rounded-md hover:bg-slate-700 transition-colors"
                                                >
                                                    <Shield size={12} className="mr-1" />
                                                    Members
                                                </Link>
                                            </div>
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