// src/components/CreateOrganizationModal.jsx - Enhanced with Organization Type Selection
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Upload, Building2, Heart, Sparkles, User, CheckCircle } from 'lucide-react';

const ORGANIZATION_CATEGORIES = [
  {
    id: 'nonprofit',
    name: 'Nonprofit',
    description: 'Tax-exempt organizations serving public good',
    icon: Heart,
    color: 'bg-rose-50 border-rose-200 text-rose-700'
  },
  {
    id: 'government', 
    name: 'Government',
    description: 'Public sector agencies and departments',
    icon: Building2,
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    id: 'foundation',
    name: 'Foundation',
    description: 'Philanthropic grant-making organizations',
    icon: Sparkles,
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
  {
    id: 'for-profit',
    name: 'For-Profit',
    description: 'Companies with social impact missions',
    icon: Building2,
    color: 'bg-green-50 border-green-200 text-green-700'
  }
];

export default function CreateOrganizationModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1); // 1: Category, 2: Type, 3: Details
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [availableTypes, setAvailableTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        tagline: '',
        description: '',
        website: '',
        location: '',
        contactEmail: '',
        logoFile: null,
        logoPreview: null,
        // Funder-specific fields
        totalFundingAnnually: '',
        averageGrantSize: '',
        // Nonprofit-specific fields
        budget: '',
        staffCount: '',
        yearFounded: '',
        ein: ''
    });

    // Fetch available types when category changes
    useEffect(() => {
        if (selectedCategory && selectedCategory !== 'nonprofit') {
            fetchFunderTypes();
        }
    }, [selectedCategory]);

    const fetchFunderTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('funder_types')
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            setAvailableTypes(data || []);
        } catch (err) {
            console.error('Error fetching funder types:', err);
            setAvailableTypes([]);
        }
    };

    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedTypeId('');
        if (categoryId === 'nonprofit') {
            setStep(3); // Skip type selection for nonprofits
        } else {
            setStep(2); // Go to type selection for funders
        }
    };

    const handleTypeSelect = (typeId) => {
        setSelectedTypeId(typeId);
        setStep(3);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setError('File size must be less than 2MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            setFormData(prev => ({
                ...prev,
                logoFile: file
            }));

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    logoPreview: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadLogo = async () => {
        if (!formData.logoFile) return null;

        try {
            const fileExt = formData.logoFile.name.split('.').pop();
            const fileName = `org-logo-${Math.random()}.${fileExt}`;
            const filePath = `organization-logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, formData.logoFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading logo:', error);
            throw error;
        }
    };

    const createOrganization = async () => {
        setLoading(true);
        setError('');

        try {
            // Upload logo if provided
            let logoUrl = null;
            if (formData.logoFile) {
                logoUrl = await uploadLogo();
            }

            const isNonprofit = selectedCategory === 'nonprofit';
            const table = isNonprofit ? 'nonprofits' : 'funders';
            
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Prepare organization data
            const orgData = {
                name: formData.name,
                tagline: formData.tagline,
                description: formData.description,
                location: formData.location,
                website: formData.website,
                contact_email: formData.contactEmail,
                admin_profile_id: user.id,
                ...(isNonprofit ? {
                    image_url: logoUrl,
                    budget: formData.budget,
                    staff_count: formData.staffCount ? parseInt(formData.staffCount) : null,
                    year_founded: formData.yearFounded ? parseInt(formData.yearFounded) : null,
                    ein: formData.ein
                } : {
                    logo_url: logoUrl,
                    funder_type_id: selectedTypeId ? parseInt(selectedTypeId) : null,
                    total_funding_annually: formData.totalFundingAnnually,
                    average_grant_size: formData.averageGrantSize
                })
            };

            // Create organization
            const { data: newOrg, error: orgError } = await supabase
                .from(table)
                .insert(orgData)
                .select()
                .single();

            if (orgError) throw orgError;

            // Create organization membership
            const { error: membershipError } = await supabase
                .from('organization_memberships')
                .insert({
                    profile_id: user.id,
                    organization_id: newOrg.id,
                    organization_type: isNonprofit ? 'nonprofit' : 'funder',
                    role: 'super_admin'
                });

            if (membershipError) throw membershipError;

            // Reset form
            resetForm();
            onSuccess(newOrg);
            onClose();

        } catch (err) {
            console.error('Error creating organization:', err);
            setError(err.message || 'Failed to create organization. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setSelectedCategory('');
        setSelectedTypeId('');
        setFormData({
            name: '',
            tagline: '',
            description: '',
            website: '',
            location: '',
            contactEmail: '',
            logoFile: null,
            logoPreview: null,
            totalFundingAnnually: '',
            averageGrantSize: '',
            budget: '',
            staffCount: '',
            yearFounded: '',
            ein: ''
        });
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const goBack = () => {
        if (step === 3 && selectedCategory === 'nonprofit') {
            setStep(1);
        } else if (step === 3) {
            setStep(2);
        } else if (step === 2) {
            setStep(1);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Create New Organization</h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Step {step} of 3 - {
                                step === 1 ? 'Choose Category' :
                                step === 2 ? 'Select Type' :
                                'Organization Details'
                            }
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Category Selection */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">What type of organization are you creating?</h3>
                                <p className="text-slate-600">This helps us customize the form for your needs</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ORGANIZATION_CATEGORIES.map((category) => {
                                    const IconComponent = category.icon;
                                    const isSelected = selectedCategory === category.id;
                                    
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategorySelect(category.id)}
                                            className={`p-6 rounded-lg border-2 transition-all text-left relative hover:shadow-md ${
                                                isSelected
                                                    ? `${category.color} border-opacity-100 shadow-md`
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <IconComponent className={`w-6 h-6 mt-1 ${isSelected ? '' : 'text-slate-600'}`} />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">{category.name}</h3>
                                                    <p className="text-sm opacity-75 mt-1">{category.description}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle className="w-5 h-5 text-green-600 absolute top-3 right-3" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Type Selection (for funders only) */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select your organization type</h3>
                                <p className="text-slate-600">Choose the most specific type that describes your organization</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                {availableTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type.id)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                                            selectedTypeId === type.id.toString()
                                                ? 'bg-blue-50 border-blue-300 text-blue-900'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{type.name}</span>
                                            {selectedTypeId === type.id.toString() && (
                                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Organization Details */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Organization Details</h3>
                                <p className="text-slate-600">Tell us about your organization</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Logo Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Organization Logo (optional)
                                        </label>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 relative">
                                                {formData.logoPreview ? (
                                                    <img src={formData.logoPreview} alt="Logo" className="w-full h-full rounded-lg object-cover" />
                                                ) : (
                                                    <Upload className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Basic Info */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Your organization name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                                        <input
                                            type="text"
                                            value={formData.tagline}
                                            onChange={(e) => handleInputChange('tagline', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Brief tagline or mission statement"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="City, State"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://yourorg.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                                        <input
                                            type="email"
                                            value={formData.contactEmail}
                                            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="contact@yourorg.com"
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Tell us about your organization's mission and work"
                                        />
                                    </div>

                                    {/* Conditional Fields Based on Category */}
                                    {selectedCategory === 'nonprofit' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Annual Budget</label>
                                                    <input
                                                        type="text"
                                                        value={formData.budget}
                                                        onChange={(e) => handleInputChange('budget', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="e.g., $500K - $1M"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Staff Count</label>
                                                    <input
                                                        type="number"
                                                        value={formData.staffCount}
                                                        onChange={(e) => handleInputChange('staffCount', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Year Founded</label>
                                                    <input
                                                        type="number"
                                                        value={formData.yearFounded}
                                                        onChange={(e) => handleInputChange('yearFounded', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="2010"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">EIN (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.ein}
                                                        onChange={(e) => handleInputChange('ein', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="12-3456789"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedCategory !== 'nonprofit' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Annual Funding</label>
                                                <input
                                                    type="text"
                                                    value={formData.totalFundingAnnually}
                                                    onChange={(e) => handleInputChange('totalFundingAnnually', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="e.g., $1M - $5M"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Average Grant Size</label>
                                                <input
                                                    type="text"
                                                    value={formData.averageGrantSize}
                                                    onChange={(e) => handleInputChange('averageGrantSize', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="e.g., $25K - $100K"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                    <div className="flex space-x-3">
                        {step > 1 && (
                            <button
                                onClick={goBack}
                                type="button"
                                className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                ← Back
                            </button>
                        )}
                    </div>
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={handleClose}
                            type="button"
                            className="px-5 py-2 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        
                        {step === 3 && (
                            <button
                                onClick={createOrganization}
                                disabled={loading || !formData.name}
                                type="button"
                                className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 shadow-sm"
                            >
                                {loading ? 'Creating...' : 'Create Organization'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}