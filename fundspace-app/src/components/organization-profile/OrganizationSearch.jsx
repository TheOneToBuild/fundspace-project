// src/components/organization-profile/OrganizationSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, Check } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

const OrganizationSearch = ({ 
  selectedOrganizations = [], 
  onOrganizationsChange, 
  placeholder = "Search for funding organizations...",
  maxSelections = 5 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() && searchTerm.length >= 2) {
        searchOrganizations(searchTerm);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchOrganizations = async (query) => {
    try {
      setIsSearching(true);
      
      // Search across all organizations (both funders and nonprofits)
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type, tagline, image_url')
        .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
        .limit(10)
        .order('name');

      if (error) throw error;

      // Filter out already selected organizations
      const selectedIds = selectedOrganizations.map(org => org.id);
      const filteredResults = (data || []).filter(org => !selectedIds.includes(org.id));
      
      setSearchResults(filteredResults);
      setShowDropdown(filteredResults.length > 0);
    } catch (err) {
      console.error('Error searching organizations:', err);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectOrganization = (organization) => {
    if (selectedOrganizations.length >= maxSelections) {
      return; // Don't add if at max limit
    }

    const newSelectedOrgs = [...selectedOrganizations, organization];
    onOrganizationsChange(newSelectedOrgs);
    setSearchTerm('');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleRemoveOrganization = (organizationId) => {
    const newSelectedOrgs = selectedOrganizations.filter(org => org.id !== organizationId);
    onOrganizationsChange(newSelectedOrgs);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Organizations */}
      {selectedOrganizations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOrganizations.map((org) => (
            <div
              key={org.id}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
            >
              {org.image_url && (
                <img
                  src={org.image_url}
                  alt={org.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              )}
              <span className="font-medium text-blue-900">{org.name}</span>
              <button
                onClick={() => handleRemoveOrganization(org.id)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleInputFocus}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder={selectedOrganizations.length >= maxSelections 
              ? `Maximum ${maxSelections} organizations selected` 
              : placeholder
            }
            disabled={selectedOrganizations.length >= maxSelections}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
            {searchResults.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelectOrganization(org)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center gap-3"
                type="button"
              >
                {org.image_url ? (
                  <img
                    src={org.image_url}
                    alt={org.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-slate-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{org.name}</p>
                  {org.tagline && (
                    <p className="text-sm text-slate-600 truncate">{org.tagline}</p>
                  )}
                  <p className="text-xs text-slate-500 capitalize">{org.type}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showDropdown && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4 text-center text-slate-500">
            No organizations found for "{searchTerm}"
          </div>
        )}
      </div>

      {/* Helper Text */}
      {selectedOrganizations.length < maxSelections && (
        <p className="text-xs text-slate-500">
          Search and select up to {maxSelections} funding organizations. 
          {selectedOrganizations.length > 0 && ` ${maxSelections - selectedOrganizations.length} remaining.`}
        </p>
      )}
    </div>
  );
};

export default OrganizationSearch;