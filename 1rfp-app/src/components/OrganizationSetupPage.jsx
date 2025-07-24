// src/components/OrganizationSetupPage.jsx - Enhanced with Taxonomy & Focus Areas
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Building2, Users, Plus, ArrowRight, Star, MapPin, Globe, Mail, X, ChevronDown } from 'lucide-react';

function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

export default function StreamlinedOrganizationSetupPage({ onJoinSuccess }) {
    const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // Create organization form state
    const [createForm, setCreateForm] = useState({
        name: '',
        type: '',
        taxonomy_code: '',
        description: '',
        website: '',
        location: '',
        ein: '',
        contact_email: ''
    });
    const [creating, setCreating] = useState(false);

    // Focus areas and supported locations state
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [taxonomyOptions, setTaxonomyOptions] = useState([]);

    // UI state
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [locationSearch, setLocationSearch] = useState('');

    // Organization types based on your database schema
    const ORGANIZATION_TYPES = [
        { id: 'nonprofit', label: 'Nonprofit Organization', icon: '🏛️', description: 'Tax-exempt organizations serving public benefit' },
        { id: 'foundation', label: 'Foundation', icon: '💰', description: 'Grantmaking organizations and foundations' },
        { id: 'government', label: 'Government Agency', icon: '🏛️', description: 'Public sector organizations and agencies' },
        { id: 'for-profit', label: 'For-Profit Company', icon: '🏢', description: 'Private companies and businesses' },
        { id: 'education', label: 'Educational Institution', icon: '🎓', description: 'Schools, universities, and educational organizations' },
        { id: 'healthcare', label: 'Healthcare Organization', icon: '🏥', description: 'Hospitals, clinics, and healthcare providers' },
        { id: 'religious', label: 'Religious Organization', icon: '⛪', description: 'Churches, temples, and faith-based organizations' },
        { id: 'international', label: 'International Organization', icon: '🌍', description: 'Global and international organizations' }
    ];

    // Bay Area counties for supported locations
    const BAY_AREA_COUNTIES = [
        'Alameda County',
        'Contra Costa County', 
        'Marin County',
        'Napa County',
        'San Francisco County',
        'San Mateo County',
        'Santa Clara County',
        'Solano County',
        'Sonoma County'
    ];

    // Popular focus areas
    const POPULAR_CATEGORIES = [
        'Housing', 'Education', 'Health', 'Environment', 
        'Arts & Culture', 'Social Services', 'Youth Programs', 
        'Senior Services', 'Community Development'
    ];

    // Fetch categories for focus areas
    const fetchCategories = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }, []);

    // Fetch taxonomy options based on organization type
    const fetchTaxonomyOptions = useCallback(async (orgType) => {
        if (!orgType) return;

        try {
            const { data, error } = await supabase
                .from('organization_taxonomies')
                .select('*')
                .eq('organization_type', orgType)
                .eq('is_active', true)
                .order('level, sort_order');

            if (error) throw error;
            setTaxonomyOptions(data || []);
        } catch (err) {
            console.error('Error fetching taxonomy options:', err);
            setTaxonomyOptions([]);
        }
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (!query || query.length < 2) {
                setSearchResults([]);
                return;
            }
            
            setLoading(true);
            setError('');
            
            try {
                const { data, error: searchError } = await supabase
                    .from('organizations')
                    .select('id, name, type, description, location, website, image_url')
                    .ilike('name', `%${query}%`)
                    .limit(10);

                if (searchError) {
                    console.error('Search error:', searchError);
                    setError('Failed to search organizations');
                } else {
                    setSearchResults(data || []);
                }
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to search organizations');
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (createForm.type) {
            fetchTaxonomyOptions(createForm.type);
        }
    }, [createForm.type, fetchTaxonomyOptions]);

    // Join an existing organization
    const handleJoinOrganization = async (organization) => {
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('You must be logged in to join an organization');
            }

            const membershipData = {
                profile_id: session.user.id,
                organization_id: organization.id,
                organization_type: organization.type,
                role: 'member',
                membership_type: 'staff',
                is_public: true
            };

            const { error: membershipError } = await supabase
                .from('organization_memberships')
                .insert(membershipData);

            if (membershipError) {
                throw new Error(`Failed to join organization: ${membershipError.message}`);
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    organization_choice: 'join',
                    selected_organization_id: organization.id,
                    selected_organization_type: organization.type,
                    updated_at: new Date()
                })
                .eq('id', session.user.id);

            setMessage(`Successfully joined ${organization.name}!`);
            
            setTimeout(() => {
                if (onJoinSuccess) {
                    onJoinSuccess();
                }
            }, 1500);

        } catch (err) {
            console.error('Join organization error:', err);
            setError(err.message || 'Failed to join organization');
        } finally {
            setLoading(false);
        }
    };

    // Create a new organization
    const handleCreateOrganization = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');
        setMessage('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('You must be logged in to create an organization');
            }

            // Validate required fields
            if (!createForm.name.trim() || !createForm.type || !createForm.description.trim() || 
                !createForm.website.trim() || !createForm.location.trim()) {
                throw new Error('Name, type, description, website, and headquarters location are required');
            }

            // Validate EIN for nonprofits
            if (createForm.type === 'nonprofit' && !createForm.ein.trim()) {
                throw new Error('EIN number is required for nonprofit organizations');
            }

            // Validate taxonomy selection
            if (!createForm.taxonomy_code) {
                throw new Error('Please select a specific organization category');
            }

            // Validate focus areas
            if (selectedCategories.length === 0) {
                throw new Error('Please select at least one focus area');
            }

            // Create organization in unified table
            const orgData = {
                name: createForm.name.trim(),
                type: createForm.type,
                taxonomy_code: createForm.taxonomy_code,
                description: createForm.description.trim(),
                website: createForm.website.trim(),
                location: createForm.location.trim(),
                contact_email: createForm.contact_email.trim() || null,
                ein: createForm.type === 'nonprofit' ? createForm.ein.trim() : null,
                admin_profile_id: session.user.id,
                image_url: null,
                is_verified: false,
                extended_data: {
                    focus_areas: selectedCategories,
                    supported_locations: selectedLocations
                }
            };

            const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert(orgData)
                .select()
                .single();

            if (orgError) {
                throw new Error(`Failed to create organization: ${orgError.message}`);
            }

            // Create organization membership for creator (as super_admin)
            const membershipData = {
                profile_id: session.user.id,
                organization_id: newOrg.id,
                organization_type: newOrg.type,
                role: 'super_admin',
                membership_type: 'staff',
                is_public: true
            };

            const { error: membershipError } = await supabase
                .from('organization_memberships')
                .insert(membershipData);

            if (membershipError) {
                throw new Error(`Organization created but failed to set up membership: ${membershipError.message}`);
            }

            // Create category relationships
            if (selectedCategories.length > 0) {
                const categoryData = selectedCategories.map(categoryId => ({
                    organization_id: newOrg.id,
                    category_id: categoryId
                }));

                const { error: categoryError } = await supabase
                    .from('organization_categories')
                    .insert(categoryData);

                if (categoryError) {
                    console.warn('Failed to create category relationships:', categoryError);
                }
            }

            // Update profile with organization info
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    organization_choice: 'create',
                    selected_organization_id: newOrg.id,
                    selected_organization_type: newOrg.type,
                    updated_at: new Date()
                })
                .eq('id', session.user.id);

            setMessage(`Successfully created ${newOrg.name}! You are now the organization's administrator.`);
            
            setTimeout(() => {
                if (onJoinSuccess) {
                    onJoinSuccess();
                }
            }, 1500);

        } catch (err) {
            console.error('Create organization error:', err);
            setError(err.message || 'Failed to create organization');
        } finally {
            setCreating(false);
        }
    };

    const getOrgTypeIcon = (type) => {
        const orgType = ORGANIZATION_TYPES.find(t => t.id === type);
        return orgType?.icon || '🏢';
    };

    // Handle category selection
    const handleCategorySelect = (categoryId) => {
        if (!selectedCategories.includes(categoryId)) {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
        setCategorySearch('');
        setShowCategoryDropdown(false);
    };

    const removeCategorySelection = (categoryId) => {
        setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    };

    // Handle location selection
    const handleLocationSelect = (location) => {
        if (!selectedLocations.includes(location)) {
            setSelectedLocations([...selectedLocations, location]);
        }
        setLocationSearch('');
        setShowLocationDropdown(false);
    };

    const removeLocationSelection = (location) => {
        setSelectedLocations(selectedLocations.filter(loc => loc !== location));
    };

    // Filter categories for dropdown
    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    // Sort categories with popular ones first
    const sortedCategories = [
        ...filteredCategories.filter(cat => POPULAR_CATEGORIES.includes(cat.name)),
        ...filteredCategories.filter(cat => !POPULAR_CATEGORIES.includes(cat.name))
    ];

    // Filter locations for dropdown
    const filteredLocations = BAY_AREA_COUNTIES.filter(loc =>
        loc.toLowerCase().includes(locationSearch.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Join Your Organization</h1>
                <p className="text-slate-600">
                    Find your organization to connect with colleagues, or create a new organization profile if it doesn't exist yet.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('join')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                            activeTab === 'join'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        <Users className="w-5 h-5 mx-auto mb-1" />
                        Join Existing Organization
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                            activeTab === 'create'
                                ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        <Plus className="w-5 h-5 mx-auto mb-1" />
                        Create New Organization
                    </button>
                </div>

                {/* Messages */}
                {message && (
                    <div className="p-4 bg-green-50 border-b border-green-200">
                        <div className="text-green-800">{message}</div>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                        <div className="text-red-800">{error}</div>
                    </div>
                )}

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'join' ? (
                        <div className="space-y-6">
                            {/* Search Section */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Search for your organization
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Enter organization name..."
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Search Results */}
                            <div className="space-y-4">
                                {loading && searchQuery && (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-slate-500 mt-2">Searching...</p>
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-medium text-slate-900">Found Organizations ({searchResults.length})</h3>
                                        {searchResults.map((org) => (
                                            <div
                                                key={org.id}
                                                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                                                        {org.image_url ? (
                                                            <img 
                                                                src={org.image_url} 
                                                                alt={org.name}
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            getOrgTypeIcon(org.type)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-slate-900">{org.name}</h4>
                                                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                                                            <span className="capitalize">{org.type.replace('-', ' ')}</span>
                                                            {org.location && (
                                                                <span className="flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1" />
                                                                    {org.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {org.description && (
                                                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                                {org.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleJoinOrganization(org)}
                                                    disabled={loading}
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Join
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {searchQuery && searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
                                    <div className="text-center py-12 bg-slate-50 rounded-lg">
                                        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 mb-2">No organizations found</h3>
                                        <p className="text-slate-600 mb-4">
                                            No organizations match your search for "{searchQuery}".
                                        </p>
                                        <button
                                            onClick={() => {
                                                setActiveTab('create');
                                                setCreateForm(prev => ({ ...prev, name: searchQuery }));
                                            }}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create "{searchQuery}"
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Create Organization Form */
                        <form onSubmit={handleCreateOrganization} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-slate-900 mb-4">Create New Organization</h3>
                                <p className="text-slate-600 mb-6">
                                    You'll become the administrator of this organization and can invite team members later.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Organization Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Organization Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Enter organization name"
                                    />
                                </div>

                                {/* Organization Type */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Organization Type *
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {ORGANIZATION_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => {
                                                    setCreateForm(prev => ({ ...prev, type: type.id, taxonomy_code: '' }));
                                                    setTaxonomyOptions([]);
                                                }}
                                                className={`p-3 border rounded-lg text-left transition-all hover:shadow-sm ${
                                                    createForm.type === type.id
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-start space-x-2">
                                                    <span className="text-lg">{type.icon}</span>
                                                    <div>
                                                        <div className="font-medium text-sm">{type.label}</div>
                                                        <div className="text-xs text-slate-500 mt-1">{type.description}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Taxonomy Selection */}
                                {createForm.type && taxonomyOptions.length > 0 && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Specific Category *
                                        </label>
                                        <select
                                            required
                                            value={createForm.taxonomy_code}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, taxonomy_code: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        >
                                            <option value="">Select specific category...</option>
                                            {taxonomyOptions.map((taxonomy) => (
                                                <option key={taxonomy.code} value={taxonomy.code}>
                                                    {taxonomy.display_name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Choose the most specific category that describes your organization
                                        </p>
                                    </div>
                                )}

                                {/* Focus Areas - Required */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Focus Areas *
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Select the main areas your organization focuses on (at least one required)
                                    </p>
                                    
                                    {/* Selected Categories */}
                                    {selectedCategories.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {selectedCategories.map(categoryId => {
                                                const category = categories.find(c => c.id === categoryId);
                                                return category ? (
                                                    <span
                                                        key={categoryId}
                                                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                                    >
                                                        {category.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCategorySelection(categoryId)}
                                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}

                                    {/* Category Dropdown */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-left flex items-center justify-between"
                                        >
                                            <span className={selectedCategories.length > 0 ? 'text-slate-900' : 'text-slate-500'}>
                                                {selectedCategories.length > 0 
                                                    ? `${selectedCategories.length} focus area${selectedCategories.length > 1 ? 's' : ''} selected`
                                                    : 'Select focus areas...'
                                                }
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </button>

                                        {showCategoryDropdown && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                <div className="p-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Search focus areas..."
                                                        value={categorySearch}
                                                        onChange={(e) => setCategorySearch(e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {sortedCategories.map((category) => (
                                                        <button
                                                            key={category.id}
                                                            type="button"
                                                            onClick={() => handleCategorySelect(category.id)}
                                                            disabled={selectedCategories.includes(category.id)}
                                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                POPULAR_CATEGORIES.includes(category.name) ? 'font-medium' : ''
                                                            }`}
                                                        >
                                                            {category.name}
                                                            {selectedCategories.includes(category.id) && (
                                                                <span className="ml-2 text-green-600">✓</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Geographic Areas Served */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Geographic Areas Served
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Select the Bay Area counties where your organization provides services (optional)
                                    </p>
                                    
                                    {/* Selected Locations */}
                                    {selectedLocations.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {selectedLocations.map(location => (
                                                <span
                                                    key={location}
                                                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                                                >
                                                    {location}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLocationSelection(location)}
                                                        className="ml-2 text-green-600 hover:text-green-800"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Location Dropdown */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-left flex items-center justify-between"
                                        >
                                            <span className={selectedLocations.length > 0 ? 'text-slate-900' : 'text-slate-500'}>
                                                {selectedLocations.length > 0 
                                                    ? `${selectedLocations.length} location${selectedLocations.length > 1 ? 's' : ''} selected`
                                                    : 'Select service areas...'
                                                }
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </button>

                                        {showLocationDropdown && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                <div className="p-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Search counties..."
                                                        value={locationSearch}
                                                        onChange={(e) => setLocationSearch(e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredLocations.map((location) => (
                                                        <button
                                                            key={location}
                                                            type="button"
                                                            onClick={() => handleLocationSelect(location)}
                                                            disabled={selectedLocations.includes(location)}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {location}
                                                            {selectedLocations.includes(location) && (
                                                                <span className="ml-2 text-green-600">✓</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description - Required */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-vertical"
                                        placeholder="Brief description of your organization's mission and activities"
                                    />
                                </div>

                                {/* Website - Required */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Website *
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={createForm.website}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, website: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="https://example.org"
                                    />
                                </div>

                                {/* Headquarters Location - Required */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Headquarters Location *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.location}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="San Francisco, CA"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Where is your organization headquartered?
                                    </p>
                                </div>

                                {/* EIN for Nonprofits - Required */}
                                {createForm.type === 'nonprofit' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            EIN (Tax ID) *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={createForm.ein}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, ein: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                            placeholder="12-3456789"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            Required for nonprofit organizations
                                        </p>
                                    </div>
                                )}

                                {/* Contact Email */}
                                <div className={createForm.type === 'nonprofit' ? '' : 'md:col-span-2'}>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={createForm.contact_email}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, contact_email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="contact@example.org"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-4 border-t border-slate-200">
                                <button
                                    type="submit"
                                    disabled={creating || !createForm.name.trim() || !createForm.type || 
                                             !createForm.description.trim() || !createForm.website.trim() || 
                                             !createForm.location.trim() || selectedCategories.length === 0 ||
                                             (createForm.type === 'nonprofit' && !createForm.ein.trim())}
                                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {creating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Creating Organization...
                                        </>
                                    ) : (
                                        <>
                                            <Building2 className="w-4 h-4 mr-2" />
                                            Create Organization
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Click outside to close dropdowns */}
            {(showCategoryDropdown || showLocationDropdown) && (
                <div 
                    className="fixed inset-0 z-5" 
                    onClick={() => {
                        setShowCategoryDropdown(false);
                        setShowLocationDropdown(false);
                    }}
                />
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                        <Users className="w-6 h-6 text-blue-600 mr-3" />
                        <h3 className="font-semibold text-blue-900">Joining an Organization</h3>
                    </div>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li>• Connect with your colleagues and team members</li>
                        <li>• Access organization-specific features and content</li>
                        <li>• Participate in internal discussions and updates</li>
                        <li>• Be listed as a team member on the organization profile</li>
                    </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                        <Star className="w-6 h-6 text-green-600 mr-3" />
                        <h3 className="font-semibold text-green-900">Creating an Organization</h3>
                    </div>
                    <ul className="text-sm text-green-800 space-y-2">
                        <li>• Become the organization administrator</li>
                        <li>• Invite and manage team members</li>
                        <li>• Create a public organization profile</li>
                        <li>• Share updates and engage with the community</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}