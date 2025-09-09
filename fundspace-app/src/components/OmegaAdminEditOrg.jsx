// src/components/OmegaAdminEditOrg.jsx - FIXED: Use unified organizations table
import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
    Star, 
    AlertTriangle, 
    ArrowLeft,
    Save,
    Upload,
    X,
    Plus,
    MapPin,
    Globe,
    Mail,
    Calendar,
    Users,
    DollarSign
} from 'lucide-react';
import { isPlatformAdmin } from '../utils/permissions.js';

export default function OmegaAdminEditOrg() {
    const { profile } = useOutletContext();
    const { orgType, orgId } = useParams();
    
    const [organization, setOrganization] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [selectedLocationIds, setSelectedLocationIds] = useState([]);
    const [grantTypes, setGrantTypes] = useState([]);
    const [notablePrograms, setNotablePrograms] = useState([]);
    
    const isOmegaAdmin = isPlatformAdmin(profile?.is_omega_admin);

    useEffect(() => {
        if (isOmegaAdmin && orgType && orgId) {
            fetchOrganization();
        }
    }, [isOmegaAdmin, orgType, orgId]);

    const fetchOrganization = async () => {
        try {
            setLoading(true);
            setError('');
            
            // FIXED: Use unified organizations table
            const { data, error: fetchError } = await supabase
                .from('organizations')
                .select(`
                    *,
                    organization_categories(categories(id, name)),
                    organization_funding_locations(locations(id, name))
                `)
                .eq('id', parseInt(orgId, 10))
                .eq('type', orgType)
                .single();

            if (fetchError) throw fetchError;
            if (!data) throw new Error('Organization not found');

            // Fetch all categories and locations for dropdowns
            const [categoriesRes, locationsRes] = await Promise.all([
                supabase.from('categories').select('id, name').order('name'),
                supabase.from('locations').select('id, name').order('name')
            ]);
            
            if (categoriesRes.data) setAllCategories(categoriesRes.data);
            if (locationsRes.data) setAllLocations(locationsRes.data);

            setOrganization(data);
            
            // Set categories
            if (data.organization_categories) {
                setSelectedCategoryIds(data.organization_categories.map(item => item.categories.id));
            }
            
            // Set locations (for funders)
            if (orgType === 'funder' && data.organization_funding_locations) {
                setSelectedLocationIds(data.organization_funding_locations.map(item => item.locations.id));
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

            // FIXED: Use unified organizations table
            const { error: updateError } = await supabase
                .from('organizations')
                .update({
                    name: organization.name,
                    tagline: organization.tagline,
                    description: organization.description,
                    website: organization.website,
                    location: organization.location,
                    contact_email: organization.contact_email,
                    image_url: organization.image_url,
                    annual_budget: organization.annual_budget,
                    staff_count: organization.staff_count,
                    year_founded: organization.year_founded,
                    // Type-specific fields
                    ...(orgType === 'funder' && {
                        grant_types: grantTypes,
                        funding_areas: organization.funding_areas
                    }),
                    ...(orgType === 'nonprofit' && {
                        notable_programs: notablePrograms,
                        mission: organization.mission
                    })
                })
                .eq('id', parseInt(orgId, 10))
                .eq('type', orgType);

            if (updateError) throw updateError;

            // Update categories
            if (selectedCategoryIds.length > 0) {
                // Delete existing categories
                await supabase
                    .from('organization_categories')
                    .delete()
                    .eq('organization_id', parseInt(orgId, 10));

                // Insert new categories
                const categoryInserts = selectedCategoryIds.map(categoryId => ({
                    organization_id: parseInt(orgId, 10),
                    category_id: categoryId
                }));

                await supabase
                    .from('organization_categories')
                    .insert(categoryInserts);
            }

            // Update funding locations (for funders)
            if (orgType === 'funder' && selectedLocationIds.length > 0) {
                // Delete existing locations
                await supabase
                    .from('organization_funding_locations')
                    .delete()
                    .eq('organization_id', parseInt(orgId, 10));

                // Insert new locations
                const locationInserts = selectedLocationIds.map(locationId => ({
                    organization_id: parseInt(orgId, 10),
                    location_id: locationId
                }));

                await supabase
                    .from('organization_funding_locations')
                    .insert(locationInserts);
            }

            setMessage('Organization updated successfully!');
            
        } catch (err) {
            console.error('Error saving organization:', err);
            setError('Failed to save changes: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const addGrantType = () => {
        setGrantTypes([...grantTypes, '']);
    };

    const updateGrantType = (index, value) => {
        const updated = [...grantTypes];
        updated[index] = value;
        setGrantTypes(updated);
    };

    const removeGrantType = (index) => {
        setGrantTypes(grantTypes.filter((_, i) => i !== index));
    };

    const addNotableProgram = () => {
        setNotablePrograms([...notablePrograms, '']);
    };

    const updateNotableProgram = (index, value) => {
        const updated = [...notablePrograms];
        updated[index] = value;
        setNotablePrograms(updated);
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
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
                                {organization.name} - {orgType.charAt(0).toUpperCase() + orgType.slice(1)}
                            </p>
                        </div>
                    </div>
                    <Link 
                        to="/profile/omega-admin/organizations"
                        className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Organizations
                    </Link>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            {message && (
                <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                    {message}
                </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveChanges} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Organization Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={organization.name || ''}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tagline
                            </label>
                            <input
                                type="text"
                                name="tagline"
                                value={organization.tagline || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={organization.description || ''}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Website
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="url"
                                    name="website"
                                    value={organization.website || ''}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Contact Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={organization.contact_email || ''}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    name="location"
                                    value={organization.location || ''}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Image URL
                            </label>
                            <input
                                type="url"
                                name="image_url"
                                value={organization.image_url || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Organization Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Organization Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Annual Budget
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    name="annual_budget"
                                    value={organization.annual_budget || ''}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Staff Count
                            </label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    name="staff_count"
                                    value={organization.staff_count || ''}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Year Founded
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    name="year_founded"
                                    value={organization.year_founded || ''}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Categories</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {allCategories.map((category) => (
                            <label key={category.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50">
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
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-slate-700">{category.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Funder-specific fields */}
                {orgType === 'funder' && (
                    <>
                        {/* Funding Locations */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Funding Locations</h2>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {allLocations.map((location) => (
                                    <label key={location.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            checked={selectedLocationIds.includes(location.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedLocationIds([...selectedLocationIds, location.id]);
                                                } else {
                                                    setSelectedLocationIds(selectedLocationIds.filter(id => id !== location.id));
                                                }
                                            }}
                                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-slate-700">{location.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Grant Types */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800">Grant Types</h2>
                                <button
                                    type="button"
                                    onClick={addGrantType}
                                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <Plus size={16} className="mr-1" />
                                    Add Grant Type
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {grantTypes.map((grantType, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <input
                                            type="text"
                                            value={grantType}
                                            onChange={(e) => updateGrantType(index, e.target.value)}
                                            placeholder="Enter grant type"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeGrantType(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Nonprofit-specific fields */}
                {orgType === 'nonprofit' && (
                    <>
                        {/* Mission */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Mission</h2>
                            <textarea
                                name="mission"
                                value={organization.mission || ''}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Enter your organization's mission statement"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        {/* Notable Programs */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800">Notable Programs</h2>
                                <button
                                    type="button"
                                    onClick={addNotableProgram}
                                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <Plus size={16} className="mr-1" />
                                    Add Program
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {notablePrograms.map((program, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <input
                                            type="text"
                                            value={program}
                                            onChange={(e) => updateNotableProgram(index, e.target.value)}
                                            placeholder="Enter program name"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeNotableProgram(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}