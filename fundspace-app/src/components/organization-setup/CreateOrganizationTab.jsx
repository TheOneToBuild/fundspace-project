// src/components/organization-setup/CreateOrganizationTab.jsx - Clean production version
import React, { useState, useCallback, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

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

export default function CreateOrganizationTab({ session, onSuccess, onError }) {
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('createOrgFormData');
        try {
            return saved ? JSON.parse(saved) : {
                name: '',
                type: '',
                description: '',
                website: '',
                location: '',
                contact_email: session?.user?.email || '',
                ein: ''
            };
        } catch {
            return {
                name: '',
                type: '',
                description: '',
                website: '',
                location: '',
                contact_email: session?.user?.email || '',
                ein: ''
            };
        }
    });

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('createOrgFormData', JSON.stringify(formData));
        } catch (err) {
            console.warn('Failed to save form data to localStorage:', err);
        }
    }, [formData]);

    const clearFormData = useCallback(() => {
        try {
            localStorage.removeItem('createOrgFormData');
        } catch (err) {
            console.warn('Failed to clear form data from localStorage:', err);
        }
    }, []);

    const updateField = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const validateForm = useCallback(() => {
        const errors = [];

        if (!formData.name?.trim()) {
            errors.push('Organization name is required');
        }
        if (!formData.type) {
            errors.push('Organization type is required');
        }
        if (!formData.description?.trim()) {
            errors.push('Description is required');
        }
        if (!formData.website?.trim()) {
            errors.push('Website is required');
        } else {
            // Simple URL validation - just check for basic domain format
            const website = formData.website.trim();
            if (!website.includes('.') || website.includes(' ')) {
                errors.push('Please enter a valid website (e.g., example.com)');
            }
        }
        if (!formData.location?.trim()) {
            errors.push('Location is required');
        }
        if (formData.type === 'nonprofit' && !formData.ein?.trim()) {
            errors.push('EIN is required for nonprofit organizations');
        }

        return errors;
    }, [formData]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            onError(validationErrors[0]);
            return;
        }

        setCreating(true);
        
        try {
            const userId = session?.user?.id;
            if (!userId) {
                throw new Error('You must be logged in to create an organization');
            }

            // Prepare organization data
            let websiteUrl = formData.website.trim();
            // Add https:// if no protocol specified
            if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
                websiteUrl = 'https://' + websiteUrl;
            }
            
            // Generate a slug from the organization name
            const slug = formData.name.trim()
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .trim('-'); // Remove leading/trailing hyphens
            
            const orgData = {
                name: formData.name.trim(),
                type: formData.type,
                slug: slug,
                description: formData.description.trim(),
                website: websiteUrl,
                location: formData.location.trim(),
                contact_email: formData.contact_email?.trim() || session.user.email,
                ein: formData.ein?.trim() || null,
                admin_profile_id: userId,
                image_url: null,
                is_verified: false
            };

            // Create organization
            const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert(orgData)
                .select()
                .single();

            if (orgError) {
                throw new Error(`Failed to create organization: ${orgError.message}`);
            }

            // Create organization membership for the creator as super_admin
            const membershipData = {
                profile_id: userId,
                organization_id: newOrg.id,
                organization_type: newOrg.type,
                role: 'super_admin',
                membership_type: 'staff',
                is_public: true
            };

            // Keep as is - INSERT operations can remain direct
            const { error: membershipError } = await supabase
                .from('organization_memberships')
                .insert(membershipData);

            // Update user profile with organization info
            const profileUpdates = {
                organization_choice: 'create',
                selected_organization_id: newOrg.id,
                selected_organization_type: newOrg.type,
                organization_name: newOrg.name
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId);

            if (profileError) {
                console.warn('Organization created but profile update failed:', profileError);
            }

            // Trigger refresh callbacks for UI updates
            try {
                if (window.refreshDashboardOrganizationData) {
                    window.refreshDashboardOrganizationData();
                }
                if (window.refreshMemberProfileData) {
                    window.refreshMemberProfileData();
                }
                if (window.refreshMyOrganizationPage) {
                    window.refreshMyOrganizationPage();
                }
            } catch (refreshError) {
                console.warn('Error triggering refresh callbacks:', refreshError);
            }

            clearFormData();
            onSuccess(`Successfully created ${newOrg.name}! You're now the admin of this organization.`);

        } catch (err) {
            onError(err.message || 'Failed to create organization. Please try again.');
        } finally {
            setCreating(false);
        }
    }, [formData, session, onSuccess, onError, clearFormData, validateForm]);

    const isFormValid = useCallback(() => {
        const validationErrors = validateForm();
        return validationErrors.length === 0;
    }, [validateForm]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="Enter organization name"
                        disabled={creating}
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
                                onClick={() => updateField('type', type.id)}
                                disabled={creating}
                                className={`p-3 border rounded-lg text-left transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                    formData.type === type.id
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

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description *
                    </label>
                    <textarea
                        rows={3}
                        required
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-vertical"
                        placeholder="Brief description of your organization's mission and activities"
                        disabled={creating}
                    />
                </div>

                {/* Website */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Website *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="example.com or https://example.com"
                        disabled={creating}
                    />
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Headquarters Location *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="San Francisco, CA"
                        disabled={creating}
                    />
                </div>

                {/* EIN for Nonprofits */}
                {formData.type === 'nonprofit' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            EIN (Tax ID) *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.ein}
                            onChange={(e) => updateField('ein', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="12-3456789"
                            disabled={creating}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Required for nonprofit organizations
                        </p>
                    </div>
                )}

                {/* Contact Email */}
                <div className={formData.type === 'nonprofit' ? '' : 'md:col-span-2'}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Contact Email
                    </label>
                    <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => updateField('contact_email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="contact@example.org"
                        disabled={creating}
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                    type="submit"
                    disabled={creating || !isFormValid()}
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
    );
}