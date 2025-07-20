// src/components/auth/steps/OrganizationSetupStep.jsx - Enhanced with Granular Details
import React, { useState, useEffect } from 'react';
import { Users, Building2, Upload, Search, X } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export default function OrganizationSetupStep({ formData, updateFormData }) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [availableFunderTypes, setAvailableFunderTypes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch funder types when component mounts (for create flow)
  useEffect(() => {
    if (formData.organizationType !== 'nonprofit') {
      fetchFunderTypes();
    }
  }, [formData.organizationType]);

  const fetchFunderTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('funder_types')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setAvailableFunderTypes(data || []);
    } catch (err) {
      console.error('Error fetching funder types:', err);
      setAvailableFunderTypes([]);
    }
  };

  // Real-time organization search
  const searchOrganizations = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Don't search if we already have a selected organization with the same name
    if (selectedOrganization && selectedOrganization.name === query) {
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    setShowDropdown(true);
    
    try {
      let results = [];

      // Determine which table(s) to search based on user's organization type
      const shouldSearchNonprofits = formData.organizationType === 'nonprofit';
      const shouldSearchFunders = ['government', 'foundation', 'for-profit'].includes(formData.organizationType);

      // Search nonprofits table if applicable
      if (shouldSearchNonprofits) {
        const { data: nonprofitResults, error: npError } = await supabase
          .from('nonprofits')
          .select('id, name, description, location, image_url')
          .ilike('name', `%${query}%`)
          .limit(5);

        if (!npError && nonprofitResults) {
          results.push(...nonprofitResults.map(org => ({ ...org, type: 'nonprofit', type_display: 'Nonprofit' })));
        }
      }

      // Search funders table if applicable
      if (shouldSearchFunders) {
        // First get the funder_type_ids we want to filter by
        let allowedFunderTypeNames = [];
        
        if (formData.organizationType === 'government') {
          allowedFunderTypeNames = [
            'City Government', 
            'State Government', 
            'Federal Government', 
            'County Government',
            'Government Agency'
          ];
        } else if (formData.organizationType === 'foundation') {
          allowedFunderTypeNames = [
            'Private Foundation',
            'Community Foundation', 
            'Corporate Foundation',
            'Family Foundation',
            'Operating Foundation'
          ];
        } else if (formData.organizationType === 'for-profit') {
          allowedFunderTypeNames = [
            'Corporate',
            'For-Profit',
            'Social Enterprise',
            'B-Corporation'
          ];
        }

        // Get the funder type IDs for these names
        const { data: funderTypes } = await supabase
          .from('funder_types')
          .select('id, name')
          .in('name', allowedFunderTypeNames);

        const allowedFunderTypeIds = funderTypes?.map(ft => ft.id) || [];

        if (allowedFunderTypeIds.length > 0) {
          // Now search funders with the filtered type IDs
          const { data: funderResults, error: funderError } = await supabase
            .from('funders')
            .select('id, name, description, location, logo_url, funder_types(name)')
            .ilike('name', `%${query}%`)
            .in('funder_type_id', allowedFunderTypeIds)
            .limit(5);

          if (!funderError && funderResults) {
            results.push(...funderResults.map(org => ({ 
              ...org, 
              type: 'funder', 
              image_url: org.logo_url,
              type_display: org.funder_types?.name || 'Funder'
            })));
          }
        }
      }

      // If no specific type selected yet, search both (fallback)
      if (!shouldSearchNonprofits && !shouldSearchFunders) {
        const [nonprofitResults, funderResults] = await Promise.all([
          supabase
            .from('nonprofits')
            .select('id, name, description, location, image_url')
            .ilike('name', `%${query}%`)
            .limit(3),
          supabase
            .from('funders')
            .select('id, name, description, location, logo_url, funder_types(name)')
            .ilike('name', `%${query}%`)
            .limit(3)
        ]);

        results = [
          ...(nonprofitResults.data || []).map(org => ({ ...org, type: 'nonprofit', type_display: 'Nonprofit' })),
          ...(funderResults.data || []).map(org => ({ 
            ...org, 
            type: 'funder', 
            image_url: org.logo_url,
            type_display: org.funder_types?.name || 'Funder'
          }))
        ];
      }

      setSearchResults(results);
      
    } catch (error) {
      console.error('Error searching organizations:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.organizationChoice === 'join') {
        searchOrganizations(formData.existingOrganization);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.existingOrganization, formData.organizationChoice, formData.organizationType]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      try {
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `org-logo-${Math.random()}.${fileExt}`;
        const filePath = `organization-logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        updateFormData('newOrganization.image', publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file. Please try again.');
      }
    }
  };

  const selectOrganization = (org) => {
    // Clear search results and hide dropdown immediately
    setSearchResults([]);
    setSearchLoading(false);
    setShowDropdown(false);
    
    // Set selected organization data
    setSelectedOrganization(org);
    updateFormData('existingOrganization', org.name);
    updateFormData('selectedOrgData', org);
  };

  // Initialize newOrganization object if it doesn't exist
  const ensureNewOrganizationObject = () => {
    if (!formData.newOrganization) {
      updateFormData('newOrganization', {
        name: '',
        tagline: '',
        description: '',
        location: '',
        website: '',
        contactEmail: '',
        image: null,
        funderTypeId: '',
        totalFundingAnnually: '',
        averageGrantSize: '',
        budget: '',
        staffCount: '',
        yearFounded: '',
        ein: ''
      });
    }
  };

  // Helper to update nested organization data
  const updateNewOrgField = (field, value) => {
    ensureNewOrganizationObject();
    updateFormData(`newOrganization.${field}`, value);
  };

  // If user hasn't selected organization choice yet, show choice selection
  if (!formData.organizationChoice) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join or create? 🏢</h1>
          <p className="text-slate-600">Connect with your organization</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => updateFormData('organizationChoice', 'join')}
            className="w-full p-6 rounded-lg border-2 transition-all text-left hover:border-blue-300 hover:shadow-md bg-white border-slate-200"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Join existing organization</h3>
                <p className="text-sm text-slate-600">Find and connect with your team</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => {
              updateFormData('organizationChoice', 'create');
              ensureNewOrganizationObject();
            }}
            className="w-full p-6 rounded-lg border-2 transition-all text-left hover:border-green-300 hover:shadow-md bg-white border-slate-200"
          >
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Create new organization</h3>
                <p className="text-sm text-slate-600">Be the founding admin</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // If user chose to join existing organization
  if (formData.organizationChoice === 'join') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find your organization 🔍</h1>
          <p className="text-slate-600">
            {formData.organizationType === 'nonprofit' && 'Search for your nonprofit organization'}
            {formData.organizationType === 'government' && 'Search for your government agency'}
            {formData.organizationType === 'foundation' && 'Search for your foundation'}
            {formData.organizationType === 'for-profit' && 'Search for your organization'}
            {!formData.organizationType && 'Search for your team'}
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Organization name *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.existingOrganization}
                onChange={(e) => {
                  updateFormData('existingOrganization', e.target.value);
                  setSelectedOrganization(null);
                }}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={
                  formData.organizationType === 'foundation' ? 'Start typing foundation name...' :
                  formData.organizationType === 'government' ? 'Start typing agency name...' :
                  formData.organizationType === 'nonprofit' ? 'Start typing nonprofit name...' :
                  formData.organizationType === 'for-profit' ? 'Start typing organization name...' :
                  'Start typing organization name...'
                }
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((org) => (
                  <button
                    key={`${org.type}-${org.id}`}
                    onClick={() => selectOrganization(org)}
                    className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-center space-x-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                      {org.image_url ? (
                        <img src={org.image_url} alt={org.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{org.name}</div>
                      <div className="text-sm text-slate-500">{org.location}</div>
                      <div className="text-xs text-blue-600">{org.type_display}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Organization */}
            {selectedOrganization && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    {selectedOrganization.image_url ? (
                      <img src={selectedOrganization.image_url} alt={selectedOrganization.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-green-800">{selectedOrganization.name}</div>
                    <div className="text-sm text-green-600">✓ Selected</div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-1">
              We'll send a request to join this organization
            </p>
          </div>

          {/* Switch to create option */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                <strong>Can't find your organization?</strong>
              </p>
              <button
                onClick={() => {
                  updateFormData('organizationChoice', 'create');
                  ensureNewOrganizationObject();
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create one here
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user chose to create new organization
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create your organization 🚀</h1>
        <p className="text-slate-600">You'll be the Super Admin</p>
      </div>
      
      <div className="space-y-6">
        {/* Organization Type Selection (for funders) */}
        {formData.organizationType !== 'nonprofit' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Organization Type *
            </label>
            <select
              value={formData.newOrganization?.funderTypeId || ''}
              onChange={(e) => updateNewOrgField('funderTypeId', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            >
              <option value="">Select organization type...</option>
              {availableFunderTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Choose the most specific type that describes your organization</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Organization logo (optional)
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 relative">
                  {formData.newOrganization?.image ? (
                    <>
                      <img 
                        src={formData.newOrganization.image} 
                        alt="Logo" 
                        className="w-full h-full rounded-lg object-cover" 
                      />
                      <button
                        onClick={() => updateNewOrgField('image', null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-600
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>
            
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Organization name *
              </label>
              <input
                type="text"
                required
                value={formData.newOrganization?.name || ''}
                onChange={(e) => updateNewOrgField('name', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Your organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tagline (optional)
              </label>
              <input
                type="text"
                value={formData.newOrganization?.tagline || ''}
                onChange={(e) => updateNewOrgField('tagline', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Brief tagline or mission statement"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location (optional)
              </label>
              <input
                type="text"
                value={formData.newOrganization?.location || ''}
                onChange={(e) => updateNewOrgField('location', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="City, State"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Website (optional)
              </label>
              <input
                type="url"
                value={formData.newOrganization?.website || ''}
                onChange={(e) => updateNewOrgField('website', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://yourorg.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Email (optional)
              </label>
              <input
                type="email"
                value={formData.newOrganization?.contactEmail || ''}
                onChange={(e) => updateNewOrgField('contactEmail', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="contact@yourorg.com"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.newOrganization?.description || ''}
                onChange={(e) => updateNewOrgField('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Tell us about your organization's mission and work"
              />
            </div>

            {/* Conditional Fields Based on Organization Type */}
            {formData.organizationType === 'nonprofit' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Annual Budget</label>
                    <input
                      type="text"
                      value={formData.newOrganization?.budget || ''}
                      onChange={(e) => updateNewOrgField('budget', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., $500K - $1M"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Staff Count</label>
                    <input
                      type="number"
                      value={formData.newOrganization?.staffCount || ''}
                      onChange={(e) => updateNewOrgField('staffCount', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Year Founded</label>
                    <input
                      type="number"
                      value={formData.newOrganization?.yearFounded || ''}
                      onChange={(e) => updateNewOrgField('yearFounded', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2010"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">EIN (optional)</label>
                    <input
                      type="text"
                      value={formData.newOrganization?.ein || ''}
                      onChange={(e) => updateNewOrgField('ein', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="12-3456789"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.organizationType !== 'nonprofit' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Annual Funding</label>
                  <input
                    type="text"
                    value={formData.newOrganization?.totalFundingAnnually || ''}
                    onChange={(e) => updateNewOrgField('totalFundingAnnually', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., $1M - $5M"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Average Grant Size</label>
                  <input
                    type="text"
                    value={formData.newOrganization?.averageGrantSize || ''}
                    onChange={(e) => updateNewOrgField('averageGrantSize', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., $25K - $100K"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Switch to join option */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <strong>Already have an organization?</strong>
            </p>
            <button
              onClick={() => updateFormData('organizationChoice', 'join')}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Join one here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}