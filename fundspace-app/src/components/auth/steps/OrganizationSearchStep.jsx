// src/components/auth/steps/OrganizationSearchStep.jsx - New "Find Your Group" Step
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Building2, User, Plus } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export default function OrganizationSearchStep({ formData, updateFormData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all organizations from unified table
  const fetchAllOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, tagline, description, location, type, image_url')
        .order('name');
      
      if (error) throw error;
      setAllOrganizations(data || []);
      setFilteredOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setAllOrganizations([]);
      setFilteredOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrganizations();
  }, [fetchAllOrganizations]);

  // Filter organizations based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrganizations(allOrganizations);
      return;
    }

    const filtered = allOrganizations.filter(org =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.tagline && org.tagline.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredOrganizations(filtered);
  }, [searchTerm, allOrganizations]);

  const handleOrganizationSelect = (org) => {
    updateFormData('organizationChoice', 'join');
    updateFormData('selectedOrgData', org);
    updateFormData('organizationType', org.type);
  };

  const handleCreateNewOrg = () => {
    updateFormData('organizationChoice', 'create');
    updateFormData('selectedOrgData', null);
    // Don't set organizationType yet - we'll do that in the next step
  };

  const handleCommunityMember = () => {
    updateFormData('organizationChoice', 'community');
    updateFormData('organizationType', 'community-member');
    updateFormData('selectedOrgData', null);
  };

  // Get organization type display names
  const getOrgTypeDisplayName = (type) => {
    const typeMap = {
      'nonprofit': 'Nonprofit',
      'government': 'Government',
      'foundation': 'Foundation', 
      'for-profit': 'For-Profit',
      'education': 'Education',
      'healthcare': 'Healthcare',
      'religious': 'Religious',
      'international': 'International'
    };
    return typeMap[type] || type;
  };

  // Get organization type icon
  const getOrgTypeIcon = (type) => {
    const iconMap = {
      'nonprofit': '🏛️',
      'government': '🏛️',
      'foundation': '💰',
      'for-profit': '🏢',
      'education': '🎓',
      'healthcare': '🏥',
      'religious': '⛪',
      'international': '🌍'
    };
    return iconMap[type] || '🏢';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome{formData.fullName ? `, ${formData.fullName.split(' ')[0]}` : ''}! 🎉
        </h1>
        <p className="text-slate-600">
          Let's find your crew and get you connected
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for your organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
          />
        </div>
        <p className="text-sm text-slate-500 mt-2 text-center">
          Try searching for "Red Cross", "Stanford University", or your organization's name
        </p>
      </div>

      {/* Main Options Grid - Fixed layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Create New Organization */}
        <button
          onClick={handleCreateNewOrg}
          className={`p-6 border-2 rounded-xl text-left transition-all hover:shadow-lg group ${
            formData.organizationChoice === 'create'
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-slate-200 hover:border-green-300 bg-white'
          }`}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Create New</h3>
              <p className="text-sm text-slate-600">Organization</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Set up a new organization profile and invite your team to join the platform
          </p>
        </button>

        {/* Join as Community Member */}
        <button
          onClick={handleCommunityMember}
          className={`p-6 border-2 rounded-xl text-left transition-all hover:shadow-lg group ${
            formData.organizationChoice === 'community'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-slate-200 hover:border-blue-300 bg-white'
          }`}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Join Solo</h3>
              <p className="text-sm text-slate-600">Community Member</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Join as an individual advocate, volunteer, or independent professional. You can always join or create an organization later.
          </p>
        </button>
      </div>

      {/* Authorization Prompt for Create New - Combined */}
      {formData.organizationChoice === 'create' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm">ℹ️</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Ready to create your organization
              </p>
              <p className="text-sm text-blue-700 mt-1">
                We'll help you set up your organization profile in the next step. By creating an organization profile, you confirm that you have the proper authority to represent this organization on the platform.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Organization Search Results */}
      {!loading && searchTerm && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Search Results ({filteredOrganizations.length})
          </h3>
          
          {filteredOrganizations.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredOrganizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrganizationSelect(org)}
                  className={`w-full p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                    formData.selectedOrgData?.id === org.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Organization Logo/Icon */}
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {org.image_url ? (
                        <img 
                          src={org.image_url} 
                          alt={org.name} 
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-xl">{getOrgTypeIcon(org.type)}</span>
                      )}
                    </div>
                    
                    {/* Organization Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 mb-1">{org.name}</div>
                      {org.tagline && (
                        <div className="text-sm text-slate-600 mb-2">{org.tagline}</div>
                      )}
                      {org.description && (
                        <div className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {org.description.length > 120 
                            ? `${org.description.substring(0, 120)}...`
                            : org.description
                          }
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                          {getOrgTypeDisplayName(org.type)}
                        </span>
                        {org.location && (
                          <span className="text-xs text-slate-500">
                            📍 {org.location}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Selection Indicator */}
                    {formData.selectedOrgData?.id === org.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <Building2 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No organizations found
              </h3>
              <p className="text-slate-500 mb-4">
                Couldn't find "{searchTerm}" in our directory
              </p>
              <button
                onClick={handleCreateNewOrg}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create "{searchTerm}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Popular Organizations (when no search) */}
      {!loading && !searchTerm && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Popular Organizations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredOrganizations.slice(0, 6).map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSelect(org)}
                className={`p-3 border rounded-lg text-left transition-all hover:shadow-sm ${
                  formData.selectedOrgData?.id === org.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {org.image_url ? (
                      <img 
                        src={org.image_url} 
                        alt={org.name} 
                        className="w-full h-full rounded object-cover"
                      />
                    ) : (
                      <span className="text-sm">{getOrgTypeIcon(org.type)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{org.name}</div>
                    <div className="text-xs text-slate-500">
                      {getOrgTypeDisplayName(org.type)}
                      {org.location && ` • ${org.location}`}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Organization Summary */}
      {formData.selectedOrgData && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Ready to join {formData.selectedOrgData.name}
              </p>
              <p className="text-xs text-green-600">
                You'll be connected with this organization after account creation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Choice Summary */}
      {formData.organizationChoice && formData.organizationChoice !== 'join' && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs">✓</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                {formData.organizationChoice === 'create' 
                  ? 'Ready to create your organization'
                  : 'Joining as a community member'
                }
              </p>
              <p className="text-xs text-blue-600">
                {formData.organizationChoice === 'create'
                  ? "We'll help you set up your organization profile in the next step"
                  : "You'll have access to all community features and discussions"
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}