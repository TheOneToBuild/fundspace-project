// src/components/mentions/MentionDropdown.jsx - FIXED VERSION with Updated Schema
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

export default function MentionDropdown({ 
  query, 
  onSelect, 
  onClose, 
  position,
  selectedIndex = -1,
  onKeyDown 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Use external selectedIndex if provided, otherwise use internal
  const currentSelectedIndex = selectedIndex >= 0 ? selectedIndex : internalSelectedIndex;

  useEffect(() => {
    const searchMentions = async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const searchPattern = `%${query.trim()}%`;
        
        // Search users/profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, title, organization_name, avatar_url, role')
          .or(`full_name.ilike.${searchPattern},title.ilike.${searchPattern},organization_name.ilike.${searchPattern}`)
          .limit(5);

        if (profilesError) {
          console.error('Error searching profiles:', profilesError);
        }

        // FIXED: Search the unified organizations table with all organization types
        const { data: organizations, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name, type, tagline, image_url, slug')
          .ilike('name', searchPattern)
          .limit(5);

        if (orgsError) {
          console.error('Error searching organizations:', orgsError);
        }

        console.log('🔍 MentionDropdown: Search results:', {
          query,
          profiles: profiles?.length || 0,
          organizations: organizations?.length || 0,
          orgData: organizations?.map(org => ({ 
            id: org.id, 
            name: org.name, 
            type: org.type,
            slug: org.slug 
          }))
        });

        // Format results to match expected structure
        const userResults = (profiles || []).map(profile => ({
          id: profile.id,
          name: profile.full_name,
          type: 'user',
          avatar_url: profile.avatar_url,
          title: profile.title,
          organization_name: profile.organization_name,
          role: profile.role
        }));

        // FIXED: Format organization results with correct ID format and proper type mapping
        const orgResults = (organizations || []).map(org => {
          // Create mention ID in the format: orgType-orgId
          const mentionId = `${org.type}-${org.id}`;
          
          // Map organization type to display label
          const getOrgTypeLabel = (type) => {
            const typeLabels = {
              'nonprofit': 'Nonprofit',
              'funder': 'Funder', 
              'foundation': 'Foundation',
              'education': 'Education',
              'healthcare': 'Healthcare',
              'government': 'Government',
              'religious': 'Religious',
              'forprofit': 'For-Profit'
            };
            return typeLabels[type] || 'Organization';
          };

          return {
            id: mentionId, // This is the key fix - proper format for mention ID
            name: org.name,
            type: 'organization',
            avatar_url: org.image_url,
            title: org.tagline || `${getOrgTypeLabel(org.type)} Organization`,
            organization_name: getOrgTypeLabel(org.type),
            role: org.type, // Store the actual org type
            _orgType: org.type, // Additional metadata
            _orgId: org.id,
            _slug: org.slug
          };
        });

        const allResults = [...userResults, ...orgResults];
        
        console.log('🔍 MentionDropdown: Formatted results:', allResults.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          role: r.role
        })));
        
        setSuggestions(allResults);
        setInternalSelectedIndex(-1); // Reset selection when results change
      } catch (error) {
        console.error('Error searching mentions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMentions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!suggestions.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setInternalSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setInternalSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (currentSelectedIndex >= 0 && suggestions[currentSelectedIndex]) {
            handleSelect(suggestions[currentSelectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose && onClose();
          break;
      }
    };

    if (onKeyDown) {
      // Use external key handler if provided
      return;
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, currentSelectedIndex, onClose, onKeyDown]);

  const handleSelect = (suggestion) => {
    console.log('🎯 MentionDropdown: Selected mention:', suggestion);
    
    onSelect && onSelect({
      id: suggestion.id,
      name: suggestion.name,
      type: suggestion.type,
      avatar_url: suggestion.avatar_url,
      title: suggestion.title,
      organization_name: suggestion.organization_name,
      role: suggestion.role
    });
  };

  // Don't show if no query or query too short
  if (!query || query.length < 1) {
    return null;
  }

  // Calculate position with fallbacks
  const dropdownStyle = {
    position: 'absolute',
    top: position?.top || 0,
    left: position?.left || 0,
    zIndex: 1000,
    minWidth: '300px',
    maxWidth: '400px',
    maxHeight: '300px',
    overflow: 'auto',
    backgroundColor: 'white',
    border: '1px solid #e1e5e9',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    fontSize: '14px'
  };

  const getUserTypeLabel = (suggestion) => {
    if (suggestion.type === 'user') {
      if (suggestion.title && suggestion.organization_name) {
        return `${suggestion.title} at ${suggestion.organization_name}`;
      } else if (suggestion.title) {
        return suggestion.title;
      } else if (suggestion.organization_name) {
        return suggestion.organization_name;
      }
      return 'User';
    } else {
      // Organization - use the formatted organization name
      return suggestion.organization_name || 'Organization';
    }
  };

  return (
    <div 
      ref={dropdownRef}
      style={dropdownStyle}
      className="mention-dropdown"
    >
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #e1e5e9',
        fontSize: '12px',
        color: '#65676b',
        backgroundColor: '#f8f9fa'
      }}>
        {loading ? (
          <span>🔍 Searching...</span>
        ) : suggestions.length > 0 ? (
          <span>💬 {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} for "{query}"</span>
        ) : query.length >= 2 ? (
          <span>😔 No results for "{query}"</span>
        ) : (
          <span>✏️ Type to search users and organizations</span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#65676b'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '4px' }}>⏳</div>
          Searching mentions...
        </div>
      )}

      {/* No results state */}
      {!loading && query.length >= 2 && suggestions.length === 0 && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#65676b'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '4px' }}>🔍</div>
          No users or organizations found
        </div>
      )}

      {/* Results */}
      {!loading && suggestions.length > 0 && (
        <div>
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.id}`}
              style={{
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: currentSelectedIndex === index ? '#e3f2fd' : 'transparent',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f0f2f5' : 'none'
              }}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setInternalSelectedIndex(index)}
            >
              {/* Avatar */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#e4e6ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                {suggestion.avatar_url ? (
                  <img 
                    src={suggestion.avatar_url} 
                    alt={suggestion.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span>{suggestion.type === 'user' ? '👤' : '🏢'}</span>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: '600',
                  color: '#1c1e21',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {suggestion.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#65676b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {getUserTypeLabel(suggestion)}
                </div>
              </div>

              {/* Type indicator */}
              <div style={{
                fontSize: '16px',
                opacity: 0.7,
                flexShrink: 0
              }}>
                {suggestion.type === 'user' ? '👤' : '🏢'}
              </div>
            </div>
          ))}
          {/* Footer hint for navigation */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid #e1e5e9',
            fontSize: '11px',
            color: '#8a8d91',
            backgroundColor: '#f8f9fa',
            textAlign: 'center'
          }}>
            ↑↓ to navigate • Enter to select • Esc to close
          </div>
        </div>
      )}
    </div>
  );
}