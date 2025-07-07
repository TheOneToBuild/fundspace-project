// src/components/OmegaAdminEditOrg.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Star, 
    AlertTriangle, 
    Save, 
    ArrowLeft,
    ExternalLink,
    Eye
} from 'lucide-react';
import { isPlatformAdmin } from '../utils/permissions.js';

export default function OmegaAdminEditOrg() {
    const { profile } = useOutletContext();
    const { orgType, orgId } = useParams();
    const navigate = useNavigate();
    
    const [organization, setOrganization] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [allFunderTypes, setAllFunderTypes] = useState([]);
    const [grantTypes, setGrantTypes] = useState([]);
    const [notablePrograms, setNotablePrograms] = useState([]);
    const [selectedLocationIds, setSelectedLocationIds] = useState([]);

    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);
    
    // Define Bay Area counties for funders
    const BAY_AREA_COUNTIES = [
        { id: 'alameda', name: 'Alameda County' },
        { id: 'contra_costa', name: 'Contra Costa County' },
        { id: 'marin', name: 'Marin County' },
        { id: 'napa', name: 'Napa County' },
        { id: 'san_francisco', name: 'San Francisco County' },
        { id: 'san_mateo', name: 'San Mateo County' },
        { id: 'santa_clara', name: 'Santa Clara County' },
        { id: 'solano', name: 'Solano County' },
        { id: 'sonoma', name: 'Sonoma County' },
        { id: 'all_bay_area', name: 'All Bay Area Counties' }
    ];

    useEffect(() => {
        if (isOmegaAdmin && orgType && orgId) {
            fetchOrganization();
        }
    }, [isOmegaAdmin, orgType, orgId]);

    const fetchOrganization = async () => {
        try {
            setLoading(true);
            setError('');
            
            const tableName = orgType === 'nonprofit' ? 'nonprofits' : 'funders';
            const categoryJoinTable = orgType === 'nonprofit' ? 'nonprofit_categories' : 'funder_categories';
            const locationJoinTable = orgType === 'funder' ? 'funder_funding_locations' : null;
            
            // Build comprehensive query
            let query = `*, ${categoryJoinTable}(categories(id, name))`;
            if (orgType === 'funder') {
                query += `, ${locationJoinTable}(locations(id, name))`;
            }
            
            const { data, error: fetchError } = await supabase
                .from(tableName)
                .select(query)
                .eq('id', orgId)
                .single();

            if (fetchError) throw fetchError;
            if (!data) throw new Error('Organization not found');

            // Fetch all categories and funder types for dropdowns
            const [categoriesRes, funderTypesRes] = await Promise.all([
                supabase.from('categories').select('id, name').order('name'),
                orgType === 'funder' ? supabase.from('funder_types').select('id, name').order('name') : Promise.resolve({ data: [] })
            ]);
            
            if (categoriesRes.data) setAllCategories(categoriesRes.data);
            if (funderTypesRes.data) setAllFunderTypes(funderTypesRes.data);

            setOrganization(data);
            
            // Set categories
            if (data[categoryJoinTable]) {
                setSelectedCategoryIds(data[categoryJoinTable].map(item => item.categories.id));
            }
            
            // Set locations (for funders)
            if (orgType === 'funder' && data[locationJoinTable]) {
                setSelectedLocationIds(data[locationJoinTable].map(item => item.locations.id));
            }
            
            // Set grant types (for funders)
            if (orgType === 'funder' && data.grant_types) {
                setGrantTypes(Array.isArray(data.grant_types) ? data.grant_types : []);
            }
            
            // Set notable programs (for nonprofits)
            if (orgType === 'nonprofit' && data.notable_programs) {
                setNotablePrograms(Array.isArray(data.notable_programs) ? data.notable_programs : []);
            }
            
        } catch (err) {
            console.error('Error fetching organization:', err);
            setError('Failed to load organization: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrganization(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        if (!isOmegaAdmin) return;

        try {
            setSaving(true);
            setError('');
            setMessage('');

            const tableName = orgType === 'nonprofit' ? 'nonprofits' : 'funders';
            
            // Prepare update data
            const updateData = { ...organization };
            
            // Handle grant types for funders
            if (orgType === 'funder') {
                updateData.grant_types = grantTypes;
            }
            
            // Handle notable programs for nonprofits
            if (orgType === 'nonprofit') {
                updateData.notable_programs = notablePrograms;
            }
            
            const { error: updateError } = await supabase
                .from(tableName)
                .update(updateData)
                .eq('id', orgId);

            if (updateError) throw updateError;

            // Update categories
            await updateCategories();
            
            // Update locations (for funders only)
            if (orgType === 'funder') {
                await updateLocations();
            }

            setMessage('Organization updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Error updating organization:', err);
            setError('Failed to update organization: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Helper function to update categories
    const updateCategories = async () => {
        const categoryJoinTable = orgType === 'nonprofit' ? 'nonprofit_categories' : 'funder_categories';
        const orgIdColumn = orgType === 'nonprofit' ? 'nonprofit_id' : 'funder_id';
        
        // Delete existing categories
        await supabase.from(categoryJoinTable).delete().eq(orgIdColumn, orgId);
        
        // Insert new categories
        if (selectedCategoryIds.length > 0) {
            const categoryInserts = selectedCategoryIds.map(categoryId => ({
                [orgIdColumn]: orgId,
                category_id: categoryId
            }));
            await supabase.from(categoryJoinTable).insert(categoryInserts);
        }
    };

    // Helper function to update locations (funders only)
    const updateLocations = async () => {
        if (orgType !== 'funder') return;
        
        // Delete existing locations
        await supabase.from('funder_funding_locations').delete().eq('funder_id', orgId);
        
        // Insert new locations
        if (selectedLocationIds.length > 0) {
            const locationInserts = selectedLocationIds.map(locationId => ({
                funder_id: orgId,
                location_id: locationId
            }));
            await supabase.from('funder_funding_locations').insert(locationInserts);
        }
    };

    const handleGrantTypeChange = (index, value) => {
        const newGrantTypes = [...grantTypes];
        newGrantTypes[index] = value;
        setGrantTypes(newGrantTypes);
    };

    const addGrantType = () => {
        setGrantTypes([...grantTypes, '']);
    };

    const removeGrantType = (index) => {
        setGrantTypes(grantTypes.filter((_, i) => i !== index));
    };

    const handleNotableProgramChange = (index, field, value) => {
        const newPrograms = [...notablePrograms];
        newPrograms[index] = { ...newPrograms[index], [field]: value };
        setNotablePrograms(newPrograms);
    };

    const addNotableProgram = () => {
        setNotablePrograms([...notablePrograms, { name: '', description: '' }]);
    };

    const removeNotableProgram = (index) => {
        setNotablePrograms(notablePrograms.filter((_, i) => i !== index));
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

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl text-white">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Loading Organization...</h1>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                    <p className="text-slate-500">Loading organization details...</p>
                </div>
            </div>
        );
    }

    if (error && !organization.id) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl text-white">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Organization Not Found</h1>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link 
                        to="/profile/omega-admin/organizations"
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Organizations
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Organization</h1>
                            <p className="text-purple-100 mt-1">
                                {organization.name} ({orgType === 'nonprofit' ? 'Nonprofit' : 'Funder'})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {organization.slug && (
                            <Link
                                to={`/${orgType === 'nonprofit' ? 'nonprofits' : 'funders'}/${organization.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                        )}
                        <Link
                            to="/profile/omega-admin/organizations"
                            className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>
            </div>

            {message && (
                <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                    {message}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {/* Edit Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={handleSaveChanges} className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                                    Organization Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={organization.name || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            
                            {organization.hasOwnProperty('tagline') && (
                                <div>
                                    <label htmlFor="tagline" className="block text-sm font-medium text-slate-700 mb-1">
                                        Tagline
                                    </label>
                                    <input
                                        type="text"
                                        id="tagline"
                                        name="tagline"
                                        value={organization.tagline || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-1">
                                    Website
                                </label>
                                <input
                                    type="url"
                                    id="website"
                                    name="website"
                                    value={organization.website || ''}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={organization.location || ''}
                                    onChange={handleInputChange}
                                    placeholder="City, State"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            
                            {organization.hasOwnProperty('contact_email') && (
                                <div>
                                    <label htmlFor="contact_email" className="block text-sm font-medium text-slate-700 mb-1">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        id="contact_email"
                                        name="contact_email"
                                        value={organization.contact_email || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
                                    URL Slug
                                </label>
                                <input
                                    type="text"
                                    id="slug"
                                    name="slug"
                                    value={organization.slug || ''}
                                    onChange={handleInputChange}
                                    placeholder="organization-name"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Used in the public profile URL: /{orgType}s/{organization.slug || 'organization-name'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={organization.description || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Describe the organization's mission and activities..."
                        />
                    </div>

                    {/* Categories/Focus Areas */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Focus Areas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-4">
                            {allCategories.map(category => (
                                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategoryIds.includes(category.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                                            } else {
                                                setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                                            }
                                        }}
                                        className="rounded border-slate-300"
                                    />
                                    <span className="text-sm text-slate-700">{category.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Nonprofit-specific fields */}
                    {orgType === 'nonprofit' && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Nonprofit Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="budget" className="block text-sm font-medium text-slate-700 mb-1">
                                        Annual Budget
                                    </label>
                                    <input
                                        type="text"
                                        id="budget"
                                        name="budget"
                                        value={organization.budget || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g., $500K - $1M"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="staff_count" className="block text-sm font-medium text-slate-700 mb-1">
                                        Staff Count
                                    </label>
                                    <input
                                        type="number"
                                        id="staff_count"
                                        name="staff_count"
                                        value={organization.staff_count || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="year_founded" className="block text-sm font-medium text-slate-700 mb-1">
                                        Year Founded
                                    </label>
                                    <input
                                        type="number"
                                        id="year_founded"
                                        name="year_founded"
                                        value={organization.year_founded || ''}
                                        onChange={handleInputChange}
                                        min="1800"
                                        max={new Date().getFullYear()}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="ein" className="block text-sm font-medium text-slate-700 mb-1">
                                        EIN (Tax ID)
                                    </label>
                                    <input
                                        type="text"
                                        id="ein"
                                        name="ein"
                                        value={organization.ein || ''}
                                        onChange={handleInputChange}
                                        placeholder="XX-XXXXXXX"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="impact_metric" className="block text-sm font-medium text-slate-700 mb-1">
                                        Key Impact Metric
                                    </label>
                                    <input
                                        type="text"
                                        id="impact_metric"
                                        name="impact_metric"
                                        value={organization.impact_metric || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Served 500+ families in 2023"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Notable Programs */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Notable Programs & Initiatives
                                </label>
                                {notablePrograms.map((program, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 border border-slate-200 rounded-lg">
                                        <input
                                            type="text"
                                            placeholder="Program name"
                                            value={program.name || ''}
                                            onChange={(e) => handleNotableProgramChange(index, 'name', e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Brief description"
                                                value={program.description || ''}
                                                onChange={(e) => handleNotableProgramChange(index, 'description', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNotableProgram(index)}
                                                className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-lg"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addNotableProgram}
                                    className="px-4 py-2 text-purple-600 hover:bg-purple-50 border border-purple-300 rounded-lg"
                                >
                                    + Add Program
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Funder-specific fields */}
                    {orgType === 'funder' && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Funder Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="total_funding_annually" className="block text-sm font-medium text-slate-700 mb-1">
                                        Total Annual Funding
                                    </label>
                                    <input
                                        type="text"
                                        id="total_funding_annually"
                                        name="total_funding_annually"
                                        value={organization.total_funding_annually || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g., $1M - $5M"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="average_grant_size" className="block text-sm font-medium text-slate-700 mb-1">
                                        Average Grant Size
                                    </label>
                                    <input
                                        type="text"
                                        id="average_grant_size"
                                        name="average_grant_size"
                                        value={organization.average_grant_size || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g., $50K - $100K"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Funder Type */}
                            <div className="mt-4">
                                <label htmlFor="funder_type_id" className="block text-sm font-medium text-slate-700 mb-1">
                                    Funder Type
                                </label>
                                <select
                                    id="funder_type_id"
                                    name="funder_type_id"
                                    value={organization.funder_type_id || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Select funder type...</option>
                                    {allFunderTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Grant Types */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Grant Types Offered
                                </label>
                                {grantTypes.map((grantType, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="e.g., Operating Support, Capital Projects"
                                            value={grantType}
                                            onChange={(e) => handleGrantTypeChange(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeGrantType(index)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-lg"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addGrantType}
                                    className="px-4 py-2 text-purple-600 hover:bg-purple-50 border border-purple-300 rounded-lg"
                                >
                                    + Add Grant Type
                                </button>
                            </div>

                            {/* Geographic Scope */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Geographic Funding Scope
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-4">
                                    {BAY_AREA_COUNTIES.map(county => (
                                        <label key={county.id} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedLocationIds.includes(county.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedLocationIds([...selectedLocationIds, county.id]);
                                                    } else {
                                                        setSelectedLocationIds(selectedLocationIds.filter(id => id !== county.id));
                                                    }
                                                }}
                                                className="rounded border-slate-300"
                                            />
                                            <span className="text-sm text-slate-700">{county.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Application Process Summary */}
                            <div className="mt-4">
                                <label htmlFor="application_process_summary" className="block text-sm font-medium text-slate-700 mb-1">
                                    Application Process Summary
                                </label>
                                <textarea
                                    id="application_process_summary"
                                    name="application_process_summary"
                                    rows={3}
                                    value={organization.application_process_summary || ''}
                                    onChange={handleInputChange}
                                    placeholder="Describe your application process, deadlines, and requirements..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                        <Link
                            to="/profile/omega-admin/organizations"
                            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}