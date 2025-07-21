// src/components/Auth/steps/OrganizationSetupStep.jsx - Complete Final Version
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import { ChevronDown, Search, Building2, Users, Globe, DollarSign, Calendar, MapPin, Upload, X } from 'lucide-react';

export default function OrganizationSetupStep({ formData, updateFormData }) {
  const [existingOrganizations, setExistingOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [taxonomyOptions, setTaxonomyOptions] = useState([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState('');

  // Get taxonomy examples and descriptions
  const getTaxonomyDetails = (taxonomyCode) => {
    const taxonomyMap = {
      // Nonprofit
      'nonprofit.501c3.direct_service': {
        examples: 'Food banks, homeless shelters, youth programs',
        description: 'Organizations providing direct services to communities'
      },
      'nonprofit.501c3.advocacy': {
        examples: 'Policy advocacy groups, civil rights organizations',
        description: 'Organizations focused on policy change and advocacy'
      },
      'nonprofit.501c3.research': {
        examples: 'Think tanks, research institutes',
        description: 'Organizations conducting research and analysis'
      },
      'nonprofit.501c4.advocacy': {
        examples: 'Political advocacy organizations, lobbying groups',
        description: 'Political advocacy with fewer restrictions than 501(c)(3)'
      },
      'nonprofit.501c6.association': {
        examples: 'Professional associations, chambers of commerce',
        description: 'Professional and trade associations'
      },
      'nonprofit.association.trade': {
        examples: 'Industry trade associations, business leagues',
        description: 'Organizations representing specific industries'
      },
      'nonprofit.grassroots.community': {
        examples: 'Neighborhood groups, community organizing',
        description: 'Grassroots community-based organizations'
      },
      'nonprofit.grassroots.mutual_aid': {
        examples: 'Mutual aid societies, community support networks',
        description: 'Organizations providing mutual aid and community support'
      },
      
      // Government
      'government.federal.agency': {
        examples: 'EPA, NIH, Department of Education, HHS',
        description: 'Federal agencies and departments'
      },
      'government.federal.independent': {
        examples: 'NSF, NEA, Peace Corps',
        description: 'Independent federal agencies'
      },
      'government.state.department': {
        examples: 'State health departments, environmental agencies',
        description: 'State-level government departments'
      },
      'government.state.university': {
        examples: 'UC system, CSU system, state universities',
        description: 'State university systems and institutions'
      },
      'government.county.agency': {
        examples: 'County health departments, social services',
        description: 'County-level government agencies'
      },
      'government.city.department': {
        examples: 'City planning, parks and recreation',
        description: 'Municipal departments and services'
      },
      'government.tribal.nation': {
        examples: 'Tribal governments, sovereign nations',
        description: 'Federally recognized tribal nations'
      },
      
      // Foundation - Private
      'foundation.private.independent': {
        examples: 'Robert Wood Johnson Foundation, MacArthur Foundation',
        description: 'Independent private foundations not controlled by families'
      },
      'foundation.private.family': {
        examples: 'Gates Foundation, Walton Family Foundation',
        description: 'Foundations established and controlled by wealthy families'
      },
      'foundation.private.converting': {
        examples: 'California Endowment, Permanente Medical Group',
        description: 'Foundations created from hospital or health plan conversions'
      },
      
      // Foundation - Community & Corporate
      'foundation.community.regional': {
        examples: 'Silicon Valley Community Foundation, Marin Community Foundation',
        description: 'Community foundations serving specific regions'
      },
      'foundation.corporate.direct': {
        examples: 'Apple giving programs, Google.org',
        description: 'Corporate direct giving and social impact programs'
      },
      'foundation.corporate.sponsored': {
        examples: 'Wells Fargo Foundation, Bank of America Foundation',
        description: 'Separate foundations sponsored by corporations'
      },
      
      // For-profit
      'forprofit.startup.social': {
        examples: 'B-Corp startups, social impact tech companies',
        description: 'Startups with explicit social impact missions'
      },
      'forprofit.socialenterprise.bcorp': {
        examples: 'Certified B-Corporations, benefit corporations',
        description: 'Companies certified to meet social and environmental standards'
      },
      'forprofit.corporation.csr': {
        examples: 'Corporate social responsibility programs',
        description: 'Large corporations with formal CSR initiatives'
      },
      'forprofit.cooperative.worker': {
        examples: 'Worker-owned cooperatives, employee-owned businesses',
        description: 'Businesses owned and operated by workers'
      },
      
      // Education
      'education.university.research': {
        examples: 'Stanford, UC Berkeley, research universities',
        description: 'Research-focused universities (R1, R2 institutions)'
      },
      'education.university.teaching': {
        examples: 'Teaching-focused universities, liberal arts colleges',
        description: 'Universities primarily focused on undergraduate teaching'
      },
      'education.k12.district.public': {
        examples: 'SFUSD, Oakland Unified, public school districts',
        description: 'Public school districts'
      },
      'education.k12.school.charter': {
        examples: 'KIPP schools, charter school networks',
        description: 'Charter schools and charter management organizations'
      },
      'education.private.religious': {
        examples: 'Catholic schools, Jewish day schools',
        description: 'Private schools with religious affiliation'
      },
      
      // Healthcare
      'healthcare.hospital.public': {
        examples: 'UCSF Medical Center, county hospitals',
        description: 'Publicly funded hospitals and health systems'
      },
      'healthcare.clinic.fqhc': {
        examples: 'Federally Qualified Health Centers, community clinics',
        description: 'Community-based primary care centers'
      },
      'healthcare.mental_health.center': {
        examples: 'Community mental health centers, counseling organizations',
        description: 'Organizations providing mental health services'
      },
      
      // Religious
      'religious.church.denomination': {
        examples: 'Catholic churches, Methodist churches, synagogues',
        description: 'Religious congregations affiliated with denominations'
      },
      'religious.interfaith.council': {
        examples: 'Interfaith councils, multi-faith organizations',
        description: 'Organizations bringing together multiple faith traditions'
      }
    };
    
    return taxonomyMap[taxonomyCode] || { examples: '', description: '' };
  };

  // Fetch existing organizations for "Join Existing" option
  const fetchExistingOrganizations = useCallback(async () => {
    try {
      const organizationType = formData.organizationType;
      
      if (organizationType === 'nonprofit') {
        const { data, error } = await supabase
          .from('nonprofits')
          .select('id, name, description, location, taxonomy_code, tagline, image_url')
          .order('name');
        
        if (error) throw error;
        setExistingOrganizations(data?.map(org => ({ ...org, type: 'nonprofit' })) || []);
      } else if (['government', 'foundation', 'for-profit'].includes(organizationType)) {
        const { data, error } = await supabase
          .from('funders')
          .select('id, name, description, location, taxonomy_code, logo_url')
          .ilike('taxonomy_code', `${organizationType === 'for-profit' ? 'forprofit' : organizationType}%`)
          .order('name');
        
        if (error) throw error;
        setExistingOrganizations(data?.map(org => ({ ...org, type: 'funder', image_url: org.logo_url })) || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, [formData.organizationType]);

  // Fetch taxonomy options based on organization type
  const fetchTaxonomyOptions = useCallback(async () => {
    if (!formData.organizationType || formData.organizationType === 'community-member') return;
    
    setLoadingTaxonomy(true);
    try {
      const organizationType = formData.organizationType;
      
      const { data, error } = await supabase
        .from('organization_taxonomies')
        .select('code, name, description, display_name, level, parent_code')
        .eq('organization_type', organizationType)
        .eq('level', 2) // Get level 2 (specific types, not root level)
        .order('sort_order');

      if (error) throw error;
      setTaxonomyOptions(data || []);
    } catch (error) {
      console.error('Error fetching taxonomy options:', error);
    } finally {
      setLoadingTaxonomy(false);
    }
  }, [formData.organizationType]);

  useEffect(() => {
    fetchExistingOrganizations();
    fetchTaxonomyOptions();
  }, [fetchExistingOrganizations, fetchTaxonomyOptions]);

  useEffect(() => {
    const filtered = existingOrganizations.filter(org =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredOrganizations(filtered);
  }, [searchTerm, existingOrganizations]);

  const handleOrganizationChoice = useCallback((choice) => {
    updateFormData('organizationChoice', choice);
  }, [updateFormData]);

  const handleExistingOrgSelect = useCallback((org) => {
    updateFormData('selectedOrgData', org);
  }, [updateFormData]);

  const handleTaxonomySelect = useCallback((taxonomyCode) => {
    setSelectedTaxonomy(taxonomyCode);
    updateFormData('taxonomyCode', taxonomyCode);
  }, [updateFormData]);

  const handleInputChange = useCallback((field, value) => {
    updateFormData(`newOrganization.${field}`, value);
  }, [updateFormData]);

  // Skip this step entirely for community members
  if (formData.organizationType === 'community-member') {
    return null;
  }

  // Get the display name for the organization type
  const getOrgTypeDisplayName = (type) => {
    const typeMap = {
      'nonprofit': 'Nonprofit',
      'government': 'Government',
      'foundation': 'Foundation', 
      'for-profit': 'For-Profit',
      'education': 'Educational Institution',
      'healthcare': 'Healthcare Organization',
      'religious': 'Religious Organization'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Organization Setup
        </h2>
        <p className="text-gray-600">
          Do you want to join an existing organization or create a new one?
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handleOrganizationChoice('join')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            formData.organizationChoice === 'join'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center mb-3">
            <Users className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold">Join Existing</h3>
          </div>
          <p className="text-gray-600">
            Connect with an organization that's already on the platform
          </p>
        </button>

        <button
          onClick={() => handleOrganizationChoice('create')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            formData.organizationChoice === 'create'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center mb-3">
            <Building2 className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold">Create New</h3>
          </div>
          <p className="text-gray-600">
            Set up a new organization profile on the platform
          </p>
        </button>
      </div>

      {/* Join Existing Organization */}
      {formData.organizationChoice === 'join' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Find Your Organization</h3>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Organization List */}
          <div className="max-h-80 overflow-y-auto space-y-3">
            {filteredOrganizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleExistingOrgSelect(org)}
                className={`w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  formData.selectedOrgData?.id === org.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {org.image_url && (
                    <img 
                      src={org.image_url} 
                      alt={org.name} 
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{org.name}</div>
                    {org.tagline && (
                      <div className="text-sm text-gray-600 mt-1">{org.tagline}</div>
                    )}
                    {org.description && (
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {org.description.substring(0, 120)}...
                      </div>
                    )}
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {getOrgTypeDisplayName(formData.organizationType)}
                      </span>
                      {org.location && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {org.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredOrganizations.length === 0 && searchTerm && (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No organizations found matching "{searchTerm}"</p>
              <p className="text-sm mt-2">Consider creating a new organization instead.</p>
            </div>
          )}
        </div>
      )}

      {/* Create New Organization */}
      {formData.organizationChoice === 'create' && (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold">Create Your Organization Profile</h3>

          {/* Organization Type Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              What type of {getOrgTypeDisplayName(formData.organizationType).toLowerCase()} organization are you creating? *
            </label>
            <p className="text-sm text-gray-600">
              This helps us customize your experience and connect you with relevant opportunities.
            </p>
            
            {loadingTaxonomy ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading options...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {taxonomyOptions.map((option) => {
                  const details = getTaxonomyDetails(option.code);
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => handleTaxonomySelect(option.code)}
                      className={`w-full p-4 border rounded-lg text-left transition-all ${
                        selectedTaxonomy === option.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{option.display_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{details.description}</p>
                          {details.examples && (
                            <p className="text-xs text-gray-500 mt-2">
                              <span className="font-medium">Examples:</span> {details.examples}
                            </p>
                          )}
                        </div>
                        {selectedTaxonomy === option.code && (
                          <div className="ml-3 flex-shrink-0">
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Organization Details Form - Show when taxonomy is selected */}
          {selectedTaxonomy && (
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Organization Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    id="orgName"
                    value={formData.newOrganization?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your organization name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="orgTagline" className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    id="orgTagline"
                    value={formData.newOrganization?.tagline || ''}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    placeholder="Brief tagline or mission statement"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="orgDescription"
                    value={formData.newOrganization?.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your organization's mission, work, and impact"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="orgWebsite" className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    id="orgWebsite"
                    value={formData.newOrganization?.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourorganization.org"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="orgLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    id="orgLocation"
                    value={formData.newOrganization?.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="orgBudget" className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Annual Budget
                  </label>
                  <select
                    id="orgBudget"
                    value={formData.newOrganization?.budget || ''}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select budget range</option>
                    <option value="Under $100K">Under $100K</option>
                    <option value="$100K - $500K">$100K - $500K</option>
                    <option value="$500K - $1M">$500K - $1M</option>
                    <option value="$1M - $5M">$1M - $5M</option>
                    <option value="$5M - $10M">$5M - $10M</option>
                    <option value="Over $10M">Over $10M</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="orgYearFounded" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Year Founded
                  </label>
                  <input
                    type="number"
                    id="orgYearFounded"
                    value={formData.newOrganization?.yearFounded || ''}
                    onChange={(e) => handleInputChange('yearFounded', e.target.value)}
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="orgStaffCount" className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Staff Count
                  </label>
                  <select
                    id="orgStaffCount"
                    value={formData.newOrganization?.staffCount || ''}
                    onChange={(e) => handleInputChange('staffCount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select staff size</option>
                    <option value="1-5">1-5 employees</option>
                    <option value="6-20">6-20 employees</option>
                    <option value="21-50">21-50 employees</option>
                    <option value="51-100">51-100 employees</option>
                    <option value="101-500">101-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="orgContactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="orgContactEmail"
                    value={formData.newOrganization?.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="contact@yourorganization.org"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}