// src/components/Auth/steps/OrganizationSetupStep.jsx - Fixed for correct updateFormData usage
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Building2, Search, X, ChevronLeft } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { getTaxonomiesByType, buildTaxonomyTree, getDefaultCapabilities } from '../../../utils/taxonomyUtils';

export default function OrganizationSetupStep({ formData, updateFormData }) {
  // Existing state
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [availableFunderTypes, setAvailableFunderTypes] = useState([]); // REMOVED - not needed with taxonomy
  const [showDropdown, setShowDropdown] = useState(false);

  // New taxonomy state
  const [taxonomyStep, setTaxonomyStep] = useState(1); // 1 = taxonomy selection, 2 = organization details
  const [selectedTaxonomy, setSelectedTaxonomy] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState([]);
  const [taxonomies, setTaxonomies] = useState([]);
  const [taxonomyTree, setTaxonomyTree] = useState([]);

  // REMOVED: Fetch funder types - we don't need this anymore with taxonomy system

  // Load taxonomies when organization type changes
  useEffect(() => {
    const loadTaxonomies = async () => {
      if (formData.organizationType && formData.organizationChoice === 'create') {
        try {
          const data = await getTaxonomiesByType(formData.organizationType);
          setTaxonomies(data);
          setTaxonomyTree(buildTaxonomyTree(data));
        } catch (error) {
          console.error('Error loading taxonomies:', error);
        }
      }
    };
    
    loadTaxonomies();
  }, [formData.organizationType, formData.organizationChoice]);

  // REMOVED: fetchFunderTypes - using taxonomy system instead

  // FIXED: Handle organization choice selection
  const handleOrganizationChoiceSelect = useCallback((choice) => {
    updateFormData('organizationChoice', choice);
    setTaxonomyStep(1); // Reset taxonomy step
  }, [updateFormData]);

  // FIXED: Handle taxonomy selection
  const handleTaxonomySelect = async (taxonomyCode) => {
    setSelectedTaxonomy(taxonomyCode);
    
    try {
      // Get default capabilities for this taxonomy
      const defaultCapabilities = await getDefaultCapabilities(taxonomyCode);
      setSelectedCapabilities(defaultCapabilities);
      
      // FIXED: Update form data using individual field updates
      updateFormData('taxonomyCode', taxonomyCode);
      updateFormData('capabilities', defaultCapabilities);
      updateFormData('newOrganization.taxonomyCode', taxonomyCode);
      updateFormData('newOrganization.capabilities', defaultCapabilities);
      
      // Move to organization details step
      setTaxonomyStep(2);
    } catch (error) {
      console.error('Error loading default capabilities:', error);
      // Still proceed to next step even if capabilities fail to load
      setTaxonomyStep(2);
    }
  };

  // FIXED: Handle organization selection
  const handleOrganizationSelect = useCallback((organization) => {
    setSelectedOrganization(organization);
    setShowDropdown(false);
    
    // FIXED: Update individual fields instead of object
    updateFormData('selectedOrgData.id', organization.id);
    updateFormData('selectedOrgData.name', organization.name);
    updateFormData('selectedOrgData.type', organization.type);
    updateFormData('selectedOrgData.type_display', organization.type_display);
  }, [updateFormData]);

  const clearSelection = useCallback(() => {
    setSelectedOrganization(null);
    updateFormData('selectedOrgData', null);
  }, [updateFormData]);

  // Real-time organization search
  const searchOrganizations = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Don't search if we already have a selected organization with the same name
    if (selectedOrganization && selectedOrganization.name === query) {
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

        if (nonprofitResults.data) {
          results.push(...nonprofitResults.data.map(org => ({ ...org, type: 'nonprofit', type_display: 'Nonprofit' })));
        }
        if (funderResults.data) {
          results.push(...funderResults.data.map(org => ({ 
            ...org, 
            type: 'funder', 
            image_url: org.logo_url,
            type_display: org.funder_types?.name || 'Funder'
          })));
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching organizations:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Taxonomy Selector Component
  const TaxonomySelector = () => {
    if (taxonomyTree.length === 0) {
      return <div className="text-center py-8 text-slate-500">Loading taxonomy options...</div>;
    }

    return (
      <div className="space-y-3">
        {taxonomyTree.map(rootTaxonomy => (
          <div key={rootTaxonomy.code}>
            {/* Root level (always just one for the organization type) */}
            <div className="space-y-2">
              {rootTaxonomy.children?.map(taxonomy => (
                <div key={taxonomy.code}>
                  {/* Level 2 taxonomies */}
                  <button
                    onClick={() => handleTaxonomySelect(taxonomy.code)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      selectedTaxonomy === taxonomy.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-medium text-slate-800">
                      {taxonomy.display_name}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {taxonomy.description}
                    </div>
                    
                    {/* Level 3 taxonomies (if any) */}
                    {taxonomy.children?.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-slate-200">
                        <div className="text-xs text-slate-500 mb-2">Specific types:</div>
                        <div className="space-y-1">
                          {taxonomy.children.map(childTaxonomy => (
                            <button
                              key={childTaxonomy.code}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaxonomySelect(childTaxonomy.code);
                              }}
                              className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {childTaxonomy.display_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                  
                  {/* Show children as separate options if no grandchildren */}
                  {taxonomy.children?.length > 0 && taxonomy.children.every(child => !child.children?.length) && (
                    <div className="ml-6 mt-2 space-y-2">
                      {taxonomy.children.map(childTaxonomy => (
                        <button
                          key={childTaxonomy.code}
                          onClick={() => handleTaxonomySelect(childTaxonomy.code)}
                          className={`w-full text-left p-3 border rounded-lg transition-all ${
                            selectedTaxonomy === childTaxonomy.code
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-medium text-slate-700 text-sm">
                            {childTaxonomy.display_name}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {childTaxonomy.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Organization Choice Selection */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Do you want to join an existing organization or create a new one?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Join Existing */}
          <button
            onClick={() => handleOrganizationChoiceSelect('join')}
            className={`p-6 border-2 rounded-xl text-left transition-all ${
              formData.organizationChoice === 'join'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center mb-3">
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <span className="font-semibold text-slate-800">Join Existing</span>
            </div>
            <p className="text-sm text-slate-600">
              Connect with an organization that's already on the platform
            </p>
          </button>

          {/* Create New */}
          <button
            onClick={() => handleOrganizationChoiceSelect('create')}
            className={`p-6 border-2 rounded-xl text-left transition-all ${
              formData.organizationChoice === 'create'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center mb-3">
              <Building2 className="h-6 w-6 text-green-600 mr-3" />
              <span className="font-semibold text-slate-800">Create New</span>
            </div>
            <p className="text-sm text-slate-600">
              Set up a new organization profile on the platform
            </p>
          </button>
        </div>
      </div>

      {/* Join Existing Organization Flow */}
      {formData.organizationChoice === 'join' && (
        <div className="space-y-4">
          <h4 className="font-medium text-slate-800">Search for your organization</h4>
          
          {/* Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Start typing your organization name..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => searchOrganizations(e.target.value)}
                defaultValue={selectedOrganization?.name || ''}
              />
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-slate-500">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((org) => (
                    <button
                      key={`${org.type}-${org.id}`}
                      onClick={() => handleOrganizationSelect(org)}
                      className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex items-start space-x-3">
                        {org.image_url && (
                          <img 
                            src={org.image_url} 
                            alt={org.name} 
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 truncate">{org.name}</div>
                          <div className="text-sm text-slate-500 mt-1 line-clamp-2">{org.description}</div>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {org.type_display}
                            </span>
                            {org.location && (
                              <span className="text-xs text-slate-500">{org.location}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    No organizations found. Try a different search term.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Organization */}
          {selectedOrganization && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedOrganization.image_url && (
                    <img 
                      src={selectedOrganization.image_url} 
                      alt={selectedOrganization.name} 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium text-slate-800">{selectedOrganization.name}</div>
                    <div className="text-sm text-slate-600">{selectedOrganization.type_display}</div>
                  </div>
                </div>
                <button
                  onClick={clearSelection}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create New Organization Flow */}
      {formData.organizationChoice === 'create' && (
        <div className="space-y-6">
          {/* Step 1: Taxonomy Selection */}
          {taxonomyStep === 1 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  What type of {formData.organizationType} organization are you creating?
                </h3>
                <p className="text-sm text-slate-600">
                  This helps us customize your experience and connect you with relevant opportunities.
                </p>
              </div>
              <TaxonomySelector />
            </div>
          )}

          {/* Step 2: Organization Details */}
          {taxonomyStep === 2 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Create Your Organization Profile
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Selected: {taxonomies.find(t => t.code === selectedTaxonomy)?.display_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTaxonomyStep(1);
                    setSelectedTaxonomy('');
                    setSelectedCapabilities([]);
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Change Type
                </button>
              </div>

              {/* Organization Details Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    id="organizationName"
                    value={formData.newOrganization?.name || ''}
                    onChange={(e) => updateFormData('newOrganization.name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your organization name"
                  />
                </div>

                <div>
                  <label htmlFor="organizationDescription" className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="organizationDescription"
                    rows={3}
                    value={formData.newOrganization?.description || ''}
                    onChange={(e) => updateFormData('newOrganization.description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Briefly describe your organization's mission and work"
                  />
                </div>

                {/* REMOVED: Redundant organization type selection - user already selected this in step 2 */}
                
                {/* Show selected capabilities */}
                {selectedCapabilities.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Default Capabilities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCapabilities.map(capability => (
                        <span
                          key={capability}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      These capabilities were automatically selected based on your organization type. You can customize them later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}