// src/components/EditOrganizationPage.jsx
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

    const orgType = profile.managed_nonprofit_id ? 'nonprofits' : 'funders';
    const orgId = profile.managed_nonprofit_id || profile.managed_funder_id;
    const categoryJoinTable = orgType === 'nonprofits' ? 'nonprofit_categories' : 'funder_categories';

    const fetchOrganizationData = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);

        const { data, error } = await supabase
            .from(orgType)
            .select(`*, ${categoryJoinTable}(categories(id, name))`)
            .eq('id', orgId)
            .single();
        
        const { data: allCatsData } = await supabase.from('categories').select('id, name').order('name');
        if(allCatsData) setAllCategories(allCatsData);

        if (error) {
            setError('Failed to load organization data.');
        } else {
            setOrganization(data);
            const currentCategoryIds = data[categoryJoinTable]?.map(join => join.categories.id) || [];
            setSelectedCategoryIds(currentCategoryIds);
        }
        setLoading(false);
    }, [orgId, orgType, categoryJoinTable]);

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

    // ADDED: This handler updates the master category list when a new one is created.
    const handleCategoryAdded = (newCategory) => {
        setAllCategories(current => [...current, newCategory]);
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        const { error: categoryError } = await supabase.rpc('update_organization_categories', {
            org_id: orgId,
            org_type: orgType,
            category_ids: selectedCategoryIds
        });

        if (categoryError) {
            setError(`Failed to save focus areas: ${categoryError.message}`);
            setSaving(false);
            return;
        }

        const { id, created_at, admin_profile_id, [categoryJoinTable]: categories, ...updateData } = organization;

        const { error: updateError } = await supabase.from(orgType).update(updateData).eq('id', orgId);

        if (updateError) {
            setError(`Failed to save changes: ${updateError.message}`);
        } else {
            setMessage('Changes saved successfully!');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-6 text-center">Loading organization editor...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
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
            
            <form onSubmit={handleSaveChanges} className="space-y-8 divide-y divide-slate-200">
                {/* General Information Section */}
                <div className="pt-8 space-y-4">
                     <h3 className="text-lg font-semibold text-slate-700">General Information</h3>
                    <div><label htmlFor="name" className="text-sm font-medium text-slate-700 block mb-1">Organization Name *</label><input id="name" name="name" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organization.name || ''} onChange={handleInputChange} /></div>
                    {organization.hasOwnProperty('tagline') && ( <div><label htmlFor="tagline" className="text-sm font-medium text-slate-700 block mb-1">Tagline</label><input id="tagline" name="tagline" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organization.tagline || ''} onChange={handleInputChange} /></div>)}
                    <div><label htmlFor="website" className="text-sm font-medium text-slate-700 block mb-1">Website</label><input id="website" name="website" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="url" value={organization.website || ''} onChange={handleInputChange} placeholder="https://..." /></div>
                    <div><label htmlFor="location" className="text-sm font-medium text-slate-700 block mb-1">Location</label><input id="location" name="location" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organization.location || ''} onChange={handleInputChange} placeholder="e.g., San Francisco, CA" /></div>
                    <div><label htmlFor="description" className="text-sm font-medium text-slate-700 block mb-1">Description</label><textarea id="description" name="description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows="5" value={organization.description || ''} onChange={handleInputChange}></textarea></div>
                </div>

                {/* Branding & Images Section */}
                <div className="pt-8 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700">Branding & Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-sm font-medium text-slate-700 block mb-2">Logo</label><ImageUploader bucket="organization_images" currentImageUrl={organization.logo_url} onUploadSuccess={(url) => handleImageUploadSuccess('logo_url', url)} /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-2">Header Image (for profile page)</label><ImageUploader bucket="organization_images" currentImageUrl={organization.image_url} onUploadSuccess={(url) => handleImageUploadSuccess('image_url', url)} /></div>
                    </div>
                </div>
                
                {/* Organization Details Section */}
                <div className="pt-8 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700">Organization Details</h3>
                    <FocusAreaEditor allCategories={allCategories} selectedIds={selectedCategoryIds} onChange={setSelectedCategoryIds} onCategoryAdded={handleCategoryAdded} />

                    {orgType === 'nonprofits' && ( <div className="pt-4"><label htmlFor="ein" className="text-sm font-medium text-slate-700 block mb-1">EIN (Tax ID)</label><input id="ein" name="ein" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organization.ein || ''} onChange={handleInputChange} /></div> )}
                    {orgType === 'funders' && ( <div className="pt-4"><label htmlFor="average_grant_size" className="text-sm font-medium text-slate-700 block mb-1">Average Grant Size</label><input id="average_grant_size" name="average_grant_size" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organization.average_grant_size || ''} onChange={handleInputChange} /></div> )}
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