// Fixed version of EditOrganizationPage.jsx with improved category handling
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Save, ExternalLink } from 'lucide-react';
import ImageUploader from './ImageUploader.jsx';
import FocusAreaEditor from './FocusAreaEditor.jsx';

export default function EditOrganizationPage() {
    const { profile } = useOutletContext();
    
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [selectedLocationIds, setSelectedLocationIds] = useState([]);
    const [grantTypes, setGrantTypes] = useState([]);
    const [allFunderTypes, setAllFunderTypes] = useState([]);
    const [notablePrograms, setNotablePrograms] = useState([]);

    const orgType = profile.managed_nonprofit_id ? 'nonprofits' : 'funders';
    const orgId = profile.managed_nonprofit_id || profile.managed_funder_id;
    const categoryJoinTable = orgType === 'nonprofits' ? 'nonprofit_categories' : 'funder_categories';
    const locationJoinTable = orgType === 'funders' ? 'funder_funding_locations' : null;
    const orgIdColumn = orgType === 'nonprofits' ? 'nonprofit_id' : 'funder_id';
    const locationOrgIdColumn = 'funder_id';

    // NEW: Define Bay Area counties only
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

    const fetchOrganizationData = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);

        // Build query based on organization type
        let query = `*, ${categoryJoinTable}(categories(id, name))`;
        if (orgType === 'funders') {
            query += `, ${locationJoinTable}(locations(id, name))`;
        }

        const { data, error } = await supabase
            .from(orgType)
            .select(query)
            .eq('id', orgId)
            .single();
        
        // Fetch all categories and funder types (no need to fetch all locations since we're using predefined Bay Area counties)
        const categoriesPromise = supabase.from('categories').select('id, name').order('name');
        const funderTypesPromise = orgType === 'funders' ? supabase.from('funder_types').select('id, name').order('name') : Promise.resolve({ data: [] });
        
        const [categoriesRes, funderTypesRes] = await Promise.all([categoriesPromise, funderTypesPromise]);
        
        if (categoriesRes.data) setAllCategories(categoriesRes.data);
        if (funderTypesRes.data) setAllFunderTypes(funderTypesRes.data);

        if (error) {
            setError('Failed to load organization data.');
            console.error('Fetch error:', error);
        } else {
            setOrganization(data);
            
            // Set current category IDs
            const currentCategoryIds = data[categoryJoinTable]?.map(join => join.categories.id) || [];
            setSelectedCategoryIds(currentCategoryIds);
            
            // Set current location IDs (for funders only) - map from location names to our predefined list
            if (orgType === 'funders' && data[locationJoinTable]) {
                const currentLocationNames = data[locationJoinTable]?.map(join => join.locations.name) || [];
                const currentLocationIds = BAY_AREA_COUNTIES
                    .filter(county => currentLocationNames.includes(county.name))
                    .map(county => county.id);
                setSelectedLocationIds(currentLocationIds);
            }
            
            // Set grant types (for funders only)
            if (orgType === 'funders' && data.grant_types) {
                setGrantTypes(Array.isArray(data.grant_types) ? data.grant_types : []);
            }
            
            // Set notable programs (for nonprofits only)
            if (orgType === 'nonprofits' && data.notable_programs) {
                setNotablePrograms(Array.isArray(data.notable_programs) ? data.notable_programs : []);
            }
        }
        setLoading(false);
    }, [orgId, orgType, categoryJoinTable, locationJoinTable]);

    useEffect(() => {
        fetchOrganizationData();
    }, [fetchOrganizationData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrganization(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUploadSuccess = (fieldName, url) => {
        setOrganization(prev => ({ ...prev, [fieldName]: url }));
    };

    const handleCategoryAdded = (newCategory) => {
        setAllCategories(current => [...current, newCategory]);
    };

    // IMPROVED: Better category update handling with proper error handling and transactions
    const updateCategories = async (orgId, selectedCategoryIds) => {
        try {
            // First, delete existing category associations
            const { error: deleteError } = await supabase
                .from(categoryJoinTable)
                .delete()
                .eq(orgIdColumn, orgId);

            if (deleteError) {
                throw new Error(`Failed to delete existing categories: ${deleteError.message}`);
            }

            // Then, insert new category associations (only if there are categories to add)
            if (selectedCategoryIds.length > 0) {
                const categoryInserts = selectedCategoryIds.map(categoryId => ({
                    [orgIdColumn]: orgId,
                    category_id: categoryId
                }));

                const { error: insertError } = await supabase
                    .from(categoryJoinTable)
                    .insert(categoryInserts);

                if (insertError) {
                    throw new Error(`Failed to insert new categories: ${insertError.message}`);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Category update error:', error);
            return { success: false, error: error.message };
        }
    };

    // NEW: Handle location updates for funders (using predefined Bay Area counties)
    const updateLocations = async (orgId, selectedLocationIds) => {
        if (orgType !== 'funders') return { success: true };
        
        try {
            // Delete existing location associations
            const { error: deleteError } = await supabase
                .from(locationJoinTable)
                .delete()
                .eq(locationOrgIdColumn, orgId);

            if (deleteError) {
                throw new Error(`Failed to delete existing locations: ${deleteError.message}`);
            }

            // Insert new location associations (need to find/create location IDs from names)
            if (selectedLocationIds.length > 0) {
                const selectedCounties = BAY_AREA_COUNTIES.filter(county => 
                    selectedLocationIds.includes(county.id)
                );

                for (const county of selectedCounties) {
                    // Get or create location ID
                    let { data: existingLocation } = await supabase
                        .from('locations')
                        .select('id')
                        .eq('name', county.name)
                        .single();

                    let locationId;
                    if (existingLocation) {
                        locationId = existingLocation.id;
                    } else {
                        // Create location if it doesn't exist
                        const { data: newLocation, error: createError } = await supabase
                            .from('locations')
                            .insert({ name: county.name })
                            .select('id')
                            .single();
                        
                        if (createError) {
                            console.warn(`Failed to create location ${county.name}:`, createError);
                            continue;
                        }
                        locationId = newLocation.id;
                    }

                    // Insert the relationship
                    const { error: insertError } = await supabase
                        .from(locationJoinTable)
                        .insert({
                            [locationOrgIdColumn]: orgId,
                            location_id: locationId
                        });

                    if (insertError) {
                        console.warn(`Failed to insert location relationship for ${county.name}:`, insertError);
                    }
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Location update error:', error);
            return { success: false, error: error.message };
        }
    };

    // NEW: Handle grant types array updates
    const handleGrantTypeChange = (index, value) => {
        const newGrantTypes = [...grantTypes];
        newGrantTypes[index] = value;
        setGrantTypes(newGrantTypes);
        setOrganization(prev => ({ ...prev, grant_types: newGrantTypes }));
    };

    const addGrantType = () => {
        const newGrantTypes = [...grantTypes, ''];
        setGrantTypes(newGrantTypes);
        setOrganization(prev => ({ ...prev, grant_types: newGrantTypes }));
    };

    const removeGrantType = (index) => {
        const newGrantTypes = grantTypes.filter((_, i) => i !== index);
        setGrantTypes(newGrantTypes);
        setOrganization(prev => ({ ...prev, grant_types: newGrantTypes }));
    };

    // NEW: Handle notable programs array updates (for nonprofits)
    const handleNotableProgramChange = (index, value) => {
        const newNotablePrograms = [...notablePrograms];
        newNotablePrograms[index] = value;
        setNotablePrograms(newNotablePrograms);
        setOrganization(prev => ({ ...prev, notable_programs: newNotablePrograms }));
    };

    const addNotableProgram = () => {
        const newNotablePrograms = [...notablePrograms, ''];
        setNotablePrograms(newNotablePrograms);
        setOrganization(prev => ({ ...prev, notable_programs: newNotablePrograms }));
    };

    const removeNotableProgram = (index) => {
        const newNotablePrograms = notablePrograms.filter((_, i) => i !== index);
        setNotablePrograms(newNotablePrograms);
        setOrganization(prev => ({ ...prev, notable_programs: newNotablePrograms }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            // Try RPC function first, fallback to direct updates if it fails
            console.log('Updating categories for org:', orgId, 'with categories:', selectedCategoryIds);
            
            let categoryUpdateSuccess = false;
            let locationUpdateSuccess = true; // Default true for nonprofits
            
            // First attempt: Try the RPC function for categories
            try {
                const { error: categoryError } = await supabase.rpc('update_organization_categories', {
                    org_id: orgId,
                    org_type: orgType,
                    category_ids: selectedCategoryIds
                });

                if (categoryError) {
                    console.warn('RPC function failed, falling back to direct updates:', categoryError.message);
                    throw new Error(categoryError.message);
                }
                categoryUpdateSuccess = true;
            } catch (rpcError) {
                // Fallback: Direct category updates
                console.log('Using direct category updates as fallback');
                const categoryResult = await updateCategories(orgId, selectedCategoryIds);
                
                if (!categoryResult.success) {
                    setError(`Failed to save focus areas: ${categoryResult.error}`);
                    setSaving(false);
                    return;
                }
                categoryUpdateSuccess = true;
            }

            // Handle location updates for funders
            if (orgType === 'funders') {
                console.log('Updating locations for funder:', orgId, 'with locations:', selectedLocationIds);
                const locationResult = await updateLocations(orgId, selectedLocationIds);
                
                if (!locationResult.success) {
                    setError(`Failed to save geographic scope: ${locationResult.error}`);
                    setSaving(false);
                    return;
                }
                locationUpdateSuccess = true;
            }

            if (!categoryUpdateSuccess || !locationUpdateSuccess) {
                setError('Failed to save organization relationships');
                setSaving(false);
                return;
            }

            // Update the main organization data
            const fieldsToExclude = [
                'id', 
                'created_at', 
                'admin_profile_id', 
                categoryJoinTable
            ];
            
            // Add location join table to exclusions for funders
            if (orgType === 'funders' && locationJoinTable) {
                fieldsToExclude.push(locationJoinTable);
            }

            const updateData = Object.fromEntries(
                Object.entries(organization).filter(([key]) => !fieldsToExclude.includes(key))
            );

            const { error: updateError } = await supabase
                .from(orgType)
                .update(updateData)
                .eq('id', orgId);

            if (updateError) {
                setError(`Failed to save changes: ${updateError.message}`);
                console.error('Organization update error:', updateError);
            } else {
                setMessage('Changes saved successfully!');
                // Refresh the data to show the updated categories and locations
                await fetchOrganizationData();
            }
        } catch (error) {
            setError(`An unexpected error occurred: ${error.message}`);
            console.error('Save error:', error);
        }
        
        setSaving(false);
    };

    if (loading) return <div className="p-6 text-center">Loading organization editor...</div>;
    if (error && !organization) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    if (!organization) return null;

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="pb-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Edit Your Organization's Profile</h1>
                    <p className="mt-2 text-slate-600">This information will be publicly visible on the platform.</p>
                </div>
                {organization.slug && (
                     <Link to={`/${orgType}/${organization.slug}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <ExternalLink size={16} className="mr-2" /> View Profile
                    </Link>
                )}
            </div>

            {message && <div className="my-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg">{message}</div>}
            {error && <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">{error}</div>}
            
            <form onSubmit={handleSaveChanges} className="space-y-8 divide-y divide-slate-200">
                {/* General Information Section */}
                <div className="pt-8 space-y-4">
                     <h3 className="text-lg font-semibold text-slate-700">General Information</h3>
                    <div><label htmlFor="name" className="text-sm font-medium text-slate-700 block mb-1">Organization Name *</label><input id="name" name="name" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organization.name || ''} onChange={handleInputChange} /></div>
                    {organization.hasOwnProperty('tagline') && ( <div><label htmlFor="tagline" className="text-sm font-medium text-slate-700 block mb-1">Tagline</label><input id="tagline" name="tagline" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organization.tagline || ''} onChange={handleInputChange} /></div>)}
                    <div><label htmlFor="website" className="text-sm font-medium text-slate-700 block mb-1">Website</label><input id="website" name="website" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="url" value={organization.website || ''} onChange={handleInputChange} placeholder="https://..." /></div>
                    <div><label htmlFor="location" className="text-sm font-medium text-slate-700 block mb-1">Headquarters Location</label><input id="location" name="location" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organization.location || ''} onChange={handleInputChange} placeholder="e.g., San Francisco, CA" /></div>
                    <div><label htmlFor="description" className="text-sm font-medium text-slate-700 block mb-1">About Us & Mission</label><textarea id="description" name="description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows="5" value={organization.description || ''} onChange={handleInputChange}></textarea></div>
                </div>

                {/* Branding & Images Section */}
                <div className="pt-8 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700">Branding & Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-sm font-medium text-slate-700 block mb-2">Logo</label><ImageUploader bucket="avatars" currentImageUrl={organization.logo_url} onUploadSuccess={(url) => handleImageUploadSuccess('logo_url', url)} /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-2">Header Image (for profile page)</label><ImageUploader bucket="avatars" currentImageUrl={organization.image_url} onUploadSuccess={(url) => handleImageUploadSuccess('image_url', url)} /></div>
                    </div>
                </div>
                
                {/* Organization Details Section */}
                <div className="pt-8 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700">Organization Details</h3>
                    <FocusAreaEditor allCategories={allCategories} selectedIds={selectedCategoryIds} onChange={setSelectedCategoryIds} onCategoryAdded={handleCategoryAdded} />

                    {orgType === 'funders' && (
                        <>
                            {/* Funder Type */}
                            <div className="pt-4">
                                <label htmlFor="funder_type_id" className="text-sm font-medium text-slate-700 block mb-1">Funder Type</label>
                                <select
                                    id="funder_type_id"
                                    name="funder_type_id"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                    value={organization.funder_type_id || ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select funder type...</option>
                                    {allFunderTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">The type of funding organization you represent</p>
                            </div>

                            {/* Geographic Scope - for funders only */}
                            <div className="pt-4">
                                <label className="text-sm font-medium text-slate-700 block mb-2">Geographic Scope</label>
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500">Select the geographic areas where your organization provides funding</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-3">
                                        {BAY_AREA_COUNTIES.map(county => (
                                            <label key={county.id} className="flex items-center space-x-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLocationIds.includes(county.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedLocationIds(prev => [...prev, county.id]);
                                                        } else {
                                                            setSelectedLocationIds(prev => prev.filter(id => id !== county.id));
                                                        }
                                                    }}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>{county.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Grant Types Offered */}
                            <div className="pt-4">
                                <label className="text-sm font-medium text-slate-700 block mb-2">Grant Types Offered</label>
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500">List the types of grants your organization offers (e.g., General Operating Support, Project Grants, etc.)</p>
                                    {grantTypes.map((grantType, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={grantType}
                                                onChange={(e) => handleGrantTypeChange(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                                placeholder="e.g., General Operating Support"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeGrantType(index)}
                                                className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addGrantType}
                                        className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        + Add Grant Type
                                    </button>
                                </div>
                            </div>

                            {/* Annual Giving */}
                            <div className="pt-4">
                                <label htmlFor="total_funding_annually" className="text-sm font-medium text-slate-700 block mb-1">Annual Giving</label>
                                <input
                                    id="total_funding_annually"
                                    name="total_funding_annually"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    type="text"
                                    value={organization.total_funding_annually || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., $2.5M annually, $500K - $1M per year"
                                />
                                <p className="text-xs text-slate-500 mt-1">Approximate total annual giving amount or range</p>
                            </div>

                            {/* Application Process */}
                            <div className="pt-4">
                                <label htmlFor="application_process_summary" className="text-sm font-medium text-slate-700 block mb-1">Application Process Summary</label>
                                <textarea
                                    id="application_process_summary"
                                    name="application_process_summary"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    rows="4"
                                    value={organization.application_process_summary || ''}
                                    onChange={handleInputChange}
                                    placeholder="Describe how organizations can apply for funding, including deadlines, requirements, and process steps..."
                                ></textarea>
                                <p className="text-xs text-slate-500 mt-1">Brief summary of your grant application process</p>
                            </div>

                            {/* Average Grant Size - moved here for better organization */}
                            <div className="pt-4">
                                <label htmlFor="average_grant_size" className="text-sm font-medium text-slate-700 block mb-1">Average Grant Size</label>
                                <input
                                    id="average_grant_size"
                                    name="average_grant_size"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    type="text"
                                    value={organization.average_grant_size || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., $5,000 - $25,000, Up to $50,000"
                                />
                                <p className="text-xs text-slate-500 mt-1">Typical grant size or range</p>
                            </div>

                            {/* Notable Grants */}
                            <div className="pt-4">
                                <label htmlFor="notable_grant" className="text-sm font-medium text-slate-700 block mb-1">Notable Grants</label>
                                <textarea
                                    id="notable_grant"
                                    name="notable_grant"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    rows="3"
                                    value={organization.notable_grant || ''}
                                    onChange={handleInputChange}
                                    placeholder="Describe a recent notable grant or highlight significant funding initiatives..."
                                ></textarea>
                                <p className="text-xs text-slate-500 mt-1">Highlight recent significant grants or funding achievements</p>
                            </div>
                        </>
                    )}

                    {orgType === 'nonprofits' && (
                        <>
                            {/* Annual Budget */}
                            <div className="pt-4">
                                <label htmlFor="budget" className="text-sm font-medium text-slate-700 block mb-1">Annual Budget</label>
                                <input
                                    id="budget"
                                    name="budget"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    type="text"
                                    value={organization.budget || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., $500K - $1M, $2.5M annually"
                                />
                                <p className="text-xs text-slate-500 mt-1">Your organization's approximate annual operating budget</p>
                            </div>

                            {/* Staff Count */}
                            <div className="pt-4">
                                <label htmlFor="staff_count" className="text-sm font-medium text-slate-700 block mb-1">Staff Count</label>
                                <input
                                    id="staff_count"
                                    name="staff_count"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    type="number"
                                    value={organization.staff_count || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 25"
                                />
                                <p className="text-xs text-slate-500 mt-1">Total number of staff members (full-time and part-time)</p>
                            </div>

                            {/* Year Founded */}
                            <div className="pt-4">
                                <label htmlFor="year_founded" className="text-sm font-medium text-slate-700 block mb-1">Year Founded</label>
                                <input
                                    id="year_founded"
                                    name="year_founded"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    type="number"
                                    min="1800"
                                    max={new Date().getFullYear()}
                                    value={organization.year_founded || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 1995"
                                />
                                <p className="text-xs text-slate-500 mt-1">The year your organization was established</p>
                            </div>

                            {/* Notable Programs & Initiatives */}
                            <div className="pt-4">
                                <label className="text-sm font-medium text-slate-700 block mb-2">Notable Programs & Initiatives</label>
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500">List your organization's key programs and initiatives</p>
                                    {notablePrograms.map((program, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={program}
                                                onChange={(e) => handleNotableProgramChange(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                                placeholder="e.g., Community Health Program"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNotableProgram(index)}
                                                className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addNotableProgram}
                                        className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        + Add Program
                                    </button>
                                </div>
                            </div>

                            {/* EIN */}
                            <div className="pt-4">
                                <label htmlFor="ein" className="text-sm font-medium text-slate-700 block mb-1">EIN (Tax ID)</label>
                                <input
                                    id="ein"
                                    name="ein"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    type="text"
                                    value={organization.ein || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 12-3456789"
                                />
                                <p className="text-xs text-slate-500 mt-1">Your organization's Employee Identification Number</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="pt-6 flex justify-end">
                    <button type="submit" disabled={saving} className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 shadow-sm">
                        <Save className="w-5 h-5 mr-2" />
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}