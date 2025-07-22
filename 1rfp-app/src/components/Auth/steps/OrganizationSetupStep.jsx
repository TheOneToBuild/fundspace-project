// src/components/Auth/steps/OrganizationSetupStep.jsx - Integrated with Fixed SignUpWizard
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import { ChevronDown, Search, Building2, Users, X, CheckCircle, Upload, MapPin } from 'lucide-react';

export default function OrganizationSetupStep({ formData, setFormData }) {
  const [existingOrganizations, setExistingOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [taxonomyOptions, setTaxonomyOptions] = useState([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState(formData.taxonomyCode || '');
  const [showForm, setShowForm] = useState(!!formData.taxonomyCode);
  
  // New state for categories and locations
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(formData.focusAreas || []);
  const [selectedLocations, setSelectedLocations] = useState(formData.serviceAreas || []);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(formData.newOrganization?.logoPreview || null);

  // Search states
  const [categorySearch, setCategorySearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);

  // Skip this step entirely for community members
  if (formData.organizationChoice === 'community') {
    return null;
  }

  // Enhanced taxonomy options with comprehensive examples for ALL categories
  const getTaxonomyExamples = (code) => {
    const examples = {
      // Foundation examples with exact database codes
      'foundation.private.family': 'Ford Foundation, Gates Foundation, Hewlett Foundation, Packard Foundation, Walton Family Foundation, Getty Foundation',
      'foundation.private.independent': 'Robert Wood Johnson Foundation, MacArthur Foundation, Andrew W. Mellon Foundation, Kresge Foundation, Open Society Foundations, Carnegie Corporation',
      'foundation.community': 'Silicon Valley Community Foundation, Marin Community Foundation, New York Community Trust',
      'foundation.corporate': 'Walmart Foundation, Google.org, Microsoft Philanthropies, Bank of America Foundation',
      
      // Government examples with exact database codes
      'government.federal': 'EPA, Department of Education, USAID, NIH, FEMA',
      'government.federal.agency': 'Federal agencies and departments, USAID, Department of Health',
      'government.state': 'California Department of Health, State Universities, State Environmental Agencies',
      'government.state.department': 'State government departments, State health agencies, DMV',
      'government.city': 'City Council, School Districts, Municipal Departments',
      'government.city.department': 'Municipal departments and services, Public works, Parks and recreation',
      
      // Education examples with exact database codes
      'education.university.research': 'Stanford University, UC Berkeley, MIT, Caltech',
      'education.university.teaching': 'Cal State Universities, Teaching-focused colleges, Liberal arts colleges',
      'education.university.department': 'Engineering departments, Business schools, Medical schools',
      'education.university.medical': 'UCSF School of Medicine, Stanford Medical School, Harvard Medical School',
      'education.k12.district.public': 'San Francisco Unified, Oakland Unified, Palo Alto Unified',
      'education.k12.school.charter': 'KIPP Schools, Success Academy, Green Dot Public Schools',
      
      // Healthcare examples with exact database codes
      'healthcare.hospital.public': 'UCSF Medical Center, SF General Hospital, County hospitals',
      'healthcare.clinic.fqhc': 'Community Health Centers, Federally Qualified Health Centers, Rural clinics',
      'healthcare.mental_health.center': 'Mental health clinics, Counseling centers, Therapy organizations',
      
      // Religious examples with exact database codes
      'religious.church.denomination': 'Catholic Charities, Lutheran Services, Methodist churches',
      'religious.interfaith.council': 'Interfaith Council, United Religions Initiative, Multi-faith organizations',
      
      // For-profit examples with exact database codes
      'forprofit.startup': 'Tech startups, Early-stage companies, Venture-backed startups',
      'forprofit.startup.social': 'Social impact startups, Mission-driven startups, B2B social platforms',
      'forprofit.socialenterprise': 'TOMS Shoes, Grameen Bank, Social ventures',
      'forprofit.socialenterprise.bcorp': 'Patagonia, Ben & Jerry\'s, Warby Parker, Allbirds',
      'forprofit.corporation.csr': 'Microsoft CSR, Google sustainability, Corporate foundations',
      'forprofit.corporation': 'Apple, Google, Microsoft, Meta',
      'forprofit.smallbusiness': 'Local businesses, Family businesses, Small enterprises',
      
      // Nonprofit examples (removed association and grassroots)
      'nonprofit.501c3': 'Red Cross, Habitat for Humanity, United Way, Salvation Army',
      'nonprofit.501c4': 'ACLU, NAACP, Sierra Club, League of Women Voters',
      'nonprofit.501c5': 'AFL-CIO, Teamsters Union, Farm Bureau, Labor unions',
      'nonprofit.501c6': 'Chamber of Commerce, Trade associations, Business leagues',
      'nonprofit.501c7': 'Country clubs, Hobby clubs, Social clubs, Recreation clubs',
      'nonprofit.501c8': 'Knights of Columbus, Masonic lodges, Fraternal orders',
      'nonprofit.501c10': 'Fraternal societies (no insurance), Domestic fraternal societies',
      'nonprofit.501c19': 'American Legion, VFW, Veterans organizations, War veterans groups'
    };
    return examples[code] || '';
  };

  // Popular suggestions
  const popularCategories = [
    'Education', 'Health', 'Environment', 'Social Services',
    'Arts & Culture', 'Community Development', 'Research'
  ];

  const popularLocations = [
    'San Francisco, CA', 'Oakland, CA', 'San Jose, CA', 'Berkeley, CA',
    'California', 'Bay Area', 'United States', 'Global'
  ];

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  }, []);

  const fetchExistingOrganizations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, tagline, description, location, type, image_url')
        .eq('type', formData.organizationType)
        .order('name');
      
      if (error) throw error;
      setExistingOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setExistingOrganizations([]);
    }
  }, [formData.organizationType]);

  const fetchTaxonomyOptions = useCallback(async () => {
    if (!formData.organizationType || formData.organizationType === 'community-member') {
      setTaxonomyOptions([]);
      return;
    }
    
    setLoadingTaxonomy(true);
    try {
      const { data, error } = await supabase
        .from('organization_taxonomies')
        .select('code, name, description, display_name, level, parent_code, sort_order')
        .eq('organization_type', formData.organizationType)
        .eq('level', 2)
        .not('code', 'in', '("nonprofit.association","nonprofit.grassroots")') // Exclude association and grassroots
        .order('sort_order');

      if (error) throw error;
      
      // Filter out any remaining association or grassroots entries and duplicates
      const filteredOptions = (data || []).filter(option => {
        const codeString = option.code.toLowerCase();
        return !codeString.includes('association') && 
               !codeString.includes('grassroots');
      });
      
      // Remove duplicate foundation types
      const uniqueOptions = filteredOptions.filter((option, index, self) => {
        return index === self.findIndex(t => t.display_name === option.display_name);
      });
      
      setTaxonomyOptions(uniqueOptions);
    } catch (error) {
      console.error('Error fetching taxonomy options:', error);
      setTaxonomyOptions([]);
    } finally {
      setLoadingTaxonomy(false);
    }
  }, [formData.organizationType]);

  // Effects
  useEffect(() => {
    fetchCategories();
    fetchLocations();
    
    if (formData.organizationChoice === 'join') {
      fetchExistingOrganizations();
    } else if (formData.organizationChoice === 'create') {
      fetchTaxonomyOptions();
    }
  }, [formData.organizationChoice, fetchExistingOrganizations, fetchTaxonomyOptions, fetchCategories, fetchLocations]);

  useEffect(() => {
    const filtered = existingOrganizations.filter(org =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredOrganizations(filtered);
  }, [searchTerm, existingOrganizations]);

  // Search filtering effects
  useEffect(() => {
    if (categorySearch.trim()) {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      );
      // Show popular categories first if they match search
      const popular = categories.filter(cat => 
        popularCategories.includes(cat.name) && 
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      );
      const others = filtered.filter(cat => !popularCategories.includes(cat.name));
      setFilteredCategories([...popular, ...others]);
    } else {
      // Show popular categories first
      const popular = categories.filter(cat => popularCategories.includes(cat.name));
      const others = categories.filter(cat => !popularCategories.includes(cat.name));
      setFilteredCategories([...popular, ...others]);
    }
  }, [categorySearch, categories]);

  useEffect(() => {
    if (locationSearch.trim()) {
      const filtered = locations.filter(loc =>
        loc.name.toLowerCase().includes(locationSearch.toLowerCase())
      );
      // Show popular locations first if they match search
      const popular = locations.filter(loc => 
        popularLocations.includes(loc.name) && 
        loc.name.toLowerCase().includes(locationSearch.toLowerCase())
      );
      const others = filtered.filter(loc => !popularLocations.includes(loc.name));
      setFilteredLocations([...popular, ...others]);
    } else {
      // Show popular locations first
      const popular = locations.filter(loc => popularLocations.includes(loc.name));
      const others = locations.filter(loc => !popularLocations.includes(loc.name));
      setFilteredLocations([...popular, ...others]);
    }
  }, [locationSearch, locations]);

  // Handler functions
  const handleExistingOrgSelect = useCallback((org) => {
    setFormData(prev => ({
      ...prev,
      selectedOrgData: org
    }));
  }, [setFormData]);

  const handleTaxonomySelect = useCallback((taxonomyCode) => {
    setSelectedTaxonomy(taxonomyCode);
    setFormData(prev => ({
      ...prev,
      taxonomyCode: taxonomyCode
    }));
    setShowForm(true);
  }, [setFormData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      newOrganization: {
        ...prev.newOrganization,
        [field]: value
      }
    }));
  }, [setFormData]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
      
      // Update formData with logo
      setFormData(prev => ({
        ...prev,
        newOrganization: {
          ...prev.newOrganization,
          logo: file,
          logoPreview: e.target.result
        }
      }));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({
      ...prev,
      newOrganization: {
        ...prev.newOrganization,
        logo: null,
        logoPreview: null
      }
    }));
  };

  const handleCategorySearch = (category) => {
    const newSelected = selectedCategories.includes(category.id)
      ? selectedCategories.filter(id => id !== category.id)
      : [...selectedCategories, category.id];
    
    setSelectedCategories(newSelected);
    setFormData(prev => ({
      ...prev,
      focusAreas: newSelected
    }));
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const handleLocationSearch = (location) => {
    const newSelected = selectedLocations.includes(location.id)
      ? selectedLocations.filter(id => id !== location.id)
      : [...selectedLocations, location.id];
    
    setSelectedLocations(newSelected);
    setFormData(prev => ({
      ...prev,
      serviceAreas: newSelected
    }));
    setLocationSearch('');
    setShowLocationDropdown(false);
  };

  // Add custom category
  const addCustomCategory = async (name) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: name.trim() })
        .select()
        .single();
      
      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      const newSelected = [...selectedCategories, data.id];
      setSelectedCategories(newSelected);
      setFormData(prev => ({
        ...prev,
        focusAreas: newSelected
      }));
      setCategorySearch('');
      setShowCategoryDropdown(false);
    } catch (error) {
      console.error('Error adding custom category:', error);
      alert('Error adding custom category. Please try again.');
    }
  };

  // Add custom location
  const addCustomLocation = async (name) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({ name: name.trim() })
        .select()
        .single();
      
      if (error) throw error;
      
      setLocations(prev => [...prev, data]);
      const newSelected = [...selectedLocations, data.id];
      setSelectedLocations(newSelected);
      setFormData(prev => ({
        ...prev,
        serviceAreas: newSelected
      }));
      setLocationSearch('');
      setShowLocationDropdown(false);
    } catch (error) {
      console.error('Error adding custom location:', error);
      alert('Error adding custom location. Please try again.');
    }
  };

  const getPillColor = (index, type = 'category') => {
    const categoryColors = [
      'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800', 'bg-yellow-100 text-yellow-800', 'bg-indigo-100 text-indigo-800'
    ];
    const locationColors = [
      'bg-emerald-100 text-emerald-800', 'bg-cyan-100 text-cyan-800', 'bg-lime-100 text-lime-800',
      'bg-rose-100 text-rose-800', 'bg-violet-100 text-violet-800', 'bg-amber-100 text-amber-800'
    ];
    
    const colors = type === 'category' ? categoryColors : locationColors;
    return colors[index % colors.length];
  };

  const getOrgTypeDisplayName = (type) => {
    const typeMap = {
      'nonprofit': 'Nonprofit', 'government': 'Government', 'foundation': 'Foundation', 
      'for-profit': 'For-Profit', 'education': 'Educational Institution', 'healthcare': 'Healthcare Organization',
      'religious': 'Religious Organization', 'international': 'International Organization'
    };
    return typeMap[type] || type;
  };

  const getOrgTypeIcon = (type) => {
    const iconMap = {
      'nonprofit': '🏛️', 'government': '🏛️', 'foundation': '💰', 'for-profit': '🏢',
      'education': '🎓', 'healthcare': '🏥', 'religious': '⛪', 'international': '🌍'
    };
    return iconMap[type] || '🏢';
  };

  // Join Existing Organization
  if (formData.organizationChoice === 'join') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Join Your Organization
          </h2>
          <p className="text-gray-600">
            Connect with your {getOrgTypeDisplayName(formData.organizationType).toLowerCase()} organization
          </p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search for ${getOrgTypeDisplayName(formData.organizationType).toLowerCase()} organizations...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredOrganizations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => handleExistingOrgSelect(org)}
                className={`w-full p-4 border rounded-lg text-left transition-all ${
                  formData.selectedOrgData?.id === org.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{org.name}</div>
                    {org.tagline && (
                      <div className="text-sm text-gray-600 mt-1">{org.tagline}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Create New Organization
  if (formData.organizationChoice === 'create') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Set up your {getOrgTypeDisplayName(formData.organizationType).toLowerCase()}
          </h2>
          <p className="text-gray-600">
            Let's get your organization profile ready for the platform
          </p>
        </div>

        {/* Taxonomy Selection */}
        {!showForm && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What type of {getOrgTypeDisplayName(formData.organizationType).toLowerCase()} are you?
              </h3>
            </div>

            {loadingTaxonomy ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading options...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taxonomyOptions.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => handleTaxonomySelect(option.code)}
                    className="p-6 border-2 border-gray-200 rounded-lg text-left hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                        <span className="text-lg">{getOrgTypeIcon(formData.organizationType)}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {option.display_name}
                        </h4>
                        {option.description && (
                          <p className="text-sm text-gray-600 leading-relaxed mb-2">
                            {option.description}
                          </p>
                        )}
                        {getTaxonomyExamples(option.code) && (
                          <p className="text-xs text-blue-600 leading-relaxed">
                            <strong>Examples:</strong> {getTaxonomyExamples(option.code)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Organization Form */}
        {showForm && (
          <div className="space-y-8">
            {/* Selected taxonomy display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">
                      {taxonomyOptions.find(t => t.code === selectedTaxonomy)?.display_name}
                    </h4>
                    <p className="text-sm text-green-700">Organization type selected</p>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={selectedTaxonomy}
                    onChange={(e) => handleTaxonomySelect(e.target.value)}
                    className="appearance-none bg-white border border-green-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {taxonomyOptions.map(option => (
                      <option key={option.code} value={option.code}>
                        {option.display_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-green-600 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <h4 className="font-medium text-gray-900">Organization Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Name */}
                <div className="md:col-span-2">
                  <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    id="orgName"
                    placeholder="Enter your organization name"
                    value={formData.newOrganization?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="orgDescription"
                    rows={4}
                    placeholder="Describe your organization's mission and activities"
                    value={formData.newOrganization?.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Logo Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-lg" />
                          <button
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <Upload className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer file:cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Website and Location */}
                <div>
                  <label htmlFor="orgWebsite" className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="orgWebsite"
                    placeholder="https://yourorganization.org"
                    value={formData.newOrganization?.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="orgLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="orgLocation"
                    placeholder="San Francisco, CA"
                    value={formData.newOrganization?.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Contact Email */}
                <div className="md:col-span-2">
                  <label htmlFor="orgEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="orgEmail"
                    placeholder="info@yourorganization.org"
                    value={formData.newOrganization?.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Focus Areas - Search Interface */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Areas (You can select more than one)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Choose the areas your organization focuses on or supports
                  </p>
                  
                  {/* Selected Categories Pills */}
                  {selectedCategories.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedCategories.map((categoryId, index) => {
                        const category = categories.find(c => c.id === categoryId);
                        return category ? (
                          <span
                            key={categoryId}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPillColor(index, 'category')}`}
                          >
                            {category.name}
                            <button
                              type="button"
                              onClick={() => handleCategorySearch(category)}
                              className="ml-2 hover:text-gray-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Category Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or add focus areas..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      onFocus={() => setShowCategoryDropdown(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                    
                    {/* Category Dropdown */}
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {categorySearch.trim() && !filteredCategories.some(c => c.name.toLowerCase() === categorySearch.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => addCustomCategory(categorySearch)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 text-blue-600 border-b border-gray-100"
                          >
                            + Add "{categorySearch}"
                          </button>
                        )}
                        {filteredCategories.slice(0, 10).map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategorySearch(category)}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                              selectedCategories.includes(category.id) ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            {category.name}
                            {popularCategories.includes(category.name) && (
                              <span className="ml-2 text-xs text-gray-500">• Popular</span>
                            )}
                          </button>
                        ))}
                        {filteredCategories.length === 0 && categorySearch.trim() && (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No matching categories found. You can add "{categorySearch}" above.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Areas - Search Interface */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communities Served (You can select more than one)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Choose the geographic areas your organization serves
                  </p>
                  
                  {/* Selected Locations Pills */}
                  {selectedLocations.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedLocations.map((locationId, index) => {
                        const location = locations.find(l => l.id === locationId);
                        return location ? (
                          <span
                            key={locationId}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPillColor(index, 'location')}`}
                          >
                            {location.name}
                            <button
                              type="button"
                              onClick={() => handleLocationSearch(location)}
                              className="ml-2 hover:text-gray-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Location Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or add service areas..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      onFocus={() => setShowLocationDropdown(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                    
                    {/* Location Dropdown */}
                    {showLocationDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {locationSearch.trim() && !filteredLocations.some(l => l.name.toLowerCase() === locationSearch.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => addCustomLocation(locationSearch)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 text-green-600 border-b border-gray-100"
                          >
                            + Add "{locationSearch}"
                          </button>
                        )}
                        {filteredLocations.slice(0, 10).map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => handleLocationSearch(location)}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                              selectedLocations.includes(location.id) ? 'bg-green-50 text-green-700' : ''
                            }`}
                          >
                            {location.name}
                            {popularLocations.includes(location.name) && (
                              <span className="ml-2 text-xs text-gray-500">• Popular</span>
                            )}
                          </button>
                        ))}
                        {filteredLocations.length === 0 && locationSearch.trim() && (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No matching locations found. You can add "{locationSearch}" above.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Organization Details */}
                <div>
                  <label htmlFor="orgBudget" className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Budget
                  </label>
                  <select
                    id="orgBudget"
                    value={formData.newOrganization?.budget || ''}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label htmlFor="orgStaff" className="block text-sm font-medium text-gray-700 mb-2">
                    Staff Size
                  </label>
                  <select
                    id="orgStaff"
                    value={formData.newOrganization?.staffCount || ''}
                    onChange={(e) => handleInputChange('staffCount', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select staff size</option>
                    <option value="1-5">1-5 staff</option>
                    <option value="6-15">6-15 staff</option>
                    <option value="16-50">16-50 staff</option>
                    <option value="51-100">51-100 staff</option>
                    <option value="101-500">101-500 staff</option>
                    <option value="500+">500+ staff</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="orgFounded" className="block text-sm font-medium text-gray-700 mb-2">
                    Year Founded
                  </label>
                  <input
                    type="number"
                    id="orgFounded"
                    min="1800"
                    max={new Date().getFullYear()}
                    placeholder="e.g., 2010"
                    value={formData.newOrganization?.yearFounded || ''}
                    onChange={(e) => handleInputChange('yearFounded', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="orgTagline" className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    id="orgTagline"
                    placeholder="A brief memorable phrase"
                    value={formData.newOrganization?.tagline || ''}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
      </div>
    );
  }

  return null;
}