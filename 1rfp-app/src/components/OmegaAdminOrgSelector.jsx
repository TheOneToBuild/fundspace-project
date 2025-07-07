// src/components/OmegaAdminOrgSelector.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Star, 
    Search, 
    Building2, 
    AlertTriangle,
    ExternalLink,
    Eye,
    Edit
} from 'lucide-react';
import { isPlatformAdmin } from '../utils/permissions.js';

export default function OmegaAdminOrgSelector() {
    const { profile } = useOutletContext();
    const [organizations, setOrganizations] = useState([]);
    const [filteredOrgs, setFilteredOrgs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrgs, setTotalOrgs] = useState(0);
    
    const ITEMS_PER_PAGE = 100;

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (isOmegaAdmin) {
            fetchOrganizations();
        }
    }, [isOmegaAdmin]);

    useEffect(() => {
        // Filter organizations based on search query
        let filtered;
        if (!searchQuery.trim()) {
            filtered = organizations;
        } else {
            filtered = organizations.filter(org =>
                org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                org.location?.toLowerCase().includes(searchQuery.toLowerCase())
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
                org.location?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
        setFilteredOrgs(filtered.slice(startIndex, endIndex));
    }, [currentPage, organizations, searchQuery]);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            
            // Fetch both nonprofits and funders with images
            const [nonprofitsRes, fundersRes] = await Promise.all([
                supabase.from('nonprofits').select('id, name, location, slug, image_url').order('name'),
                supabase.from('funders').select('id, name, location, slug, logo_url').order('name')
            ]);

            if (nonprofitsRes.error) throw nonprofitsRes.error;
            if (fundersRes.error) throw fundersRes.error;

            // Combine and mark type
            const allOrganizations = [
                ...nonprofitsRes.data.map(org => ({ 
                    ...org, 
                    type: 'nonprofit',
                    imageUrl: org.image_url // Map image_url to imageUrl for nonprofits
                })),
                ...fundersRes.data.map(org => ({ 
                    ...org, 
                    type: 'funder',
                    imageUrl: org.logo_url // Map logo_url to imageUrl for funders
                }))
            ];

            // Sort alphabetically
            allOrganizations.sort((a, b) => a.name.localeCompare(b.name));

            setOrganizations(allOrganizations);
            
            // Set initial pagination
            const initialDisplay = allOrganizations.slice(0, ITEMS_PER_PAGE);
            setFilteredOrgs(initialDisplay);
            setTotalOrgs(allOrganizations.length);
        } catch (err) {
            console.error('Error fetching organizations:', err);
            setError('Failed to load organizations');
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

            {/* Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search organizations by name or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Organizations List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-700">
                        Organizations ({totalOrgs.toLocaleString()})
                        {searchQuery && (
                            <span className="text-sm font-normal text-slate-500 ml-2">
                                - Showing {filteredOrgs.length} of {totalOrgs} results
                            </span>
                        )}
                        {!searchQuery && totalOrgs > ITEMS_PER_PAGE && (
                            <span className="text-sm font-normal text-slate-500 ml-2">
                                - Page {currentPage} of {Math.ceil(totalOrgs / ITEMS_PER_PAGE)}
                            </span>
                        )}
                    </h2>
                </div>

                {loading && (
                    <div className="p-6 text-center text-slate-500">
                        Loading organizations...
                    </div>
                )}

                {!loading && filteredOrgs.length === 0 && searchQuery && (
                    <div className="p-6 text-center text-slate-500">
                        No organizations found matching "{searchQuery}"
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="block mx-auto mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                            Clear search to see all organizations
                        </button>
                    </div>
                )}

                {!loading && filteredOrgs.length === 0 && !searchQuery && (
                    <div className="p-6 text-center text-slate-500">
                        No organizations found.
                    </div>
                )}

                {!loading && filteredOrgs.length > 0 && (
                    <div className="divide-y divide-slate-200">
                        {filteredOrgs.map((org) => (
                            <div key={`${org.type}-${org.id}`} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {org.imageUrl ? (
                                                <img 
                                                    src={org.imageUrl} 
                                                    alt={`${org.name} logo`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                            ) : null}
                                            <Building2 
                                                className={`w-6 h-6 text-slate-500 ${org.imageUrl ? 'hidden' : 'block'}`}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-slate-800 mb-1 truncate" title={org.name}>
                                                {org.name}
                                            </h3>
                                            <div className="flex items-center space-x-3 text-sm text-slate-500">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                                    org.type === 'nonprofit' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {org.type === 'nonprofit' ? 'Nonprofit' : 'Funder'}
                                                </span>
                                                {org.location && (
                                                    <span className="truncate">{org.location}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        {/* View Profile Button */}
                                        {org.slug ? (
                                            <a
                                                href={`/${org.type === 'nonprofit' ? 'nonprofits' : 'funders'}/${org.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Profile
                                                <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-400 bg-slate-50 cursor-not-allowed whitespace-nowrap">
                                                <Eye className="w-4 h-4 mr-2" />
                                                No Profile
                                            </span>
                                        )}
                                        
                                        {/* Edit Organization Button */}
                                        <Link
                                            to={`/profile/omega-admin/organizations/edit/${org.type}/${org.id}`}
                                            className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Organization
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && !searchQuery && totalOrgs > ITEMS_PER_PAGE && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalOrgs)} of {totalOrgs.toLocaleString()} organizations
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm text-slate-700">
                                Page {currentPage} of {Math.ceil(totalOrgs / ITEMS_PER_PAGE)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalOrgs / ITEMS_PER_PAGE)))}
                                disabled={currentPage === Math.ceil(totalOrgs / ITEMS_PER_PAGE)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}