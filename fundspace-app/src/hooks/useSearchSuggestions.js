// src/hooks/useSearchSuggestions.js
import { useState, useEffect, useMemo } from 'react';

export const useSearchSuggestions = (searchTerm, funders, maxSuggestions = 5) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const funderSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase();
    const matches = [];

    funders.forEach(funder => {
      // Match funder names
      if (funder.name && funder.name.toLowerCase().includes(term)) {
        matches.push({
          type: 'funder',
          text: funder.name,
          subtitle: 'Organization',
          slug: funder.slug,
          icon: '🏢'
        });
      }

      // Match focus areas
      if (funder.focus_areas) {
        funder.focus_areas.forEach(area => {
          if (area.toLowerCase().includes(term) && !matches.some(m => m.text === area)) {
            matches.push({
              type: 'focus_area',
              text: area,
              subtitle: 'Focus Area',
              icon: '🎯'
            });
          }
        });
      }

      // Match locations
      if (funder.location && funder.location.toLowerCase().includes(term) && 
          !matches.some(m => m.text === funder.location)) {
        matches.push({
          type: 'location',
          text: funder.location,
          subtitle: 'Location',
          icon: '📍'
        });
      }

      // Match grant types
      if (funder.grant_types) {
        funder.grant_types.forEach(type => {
          if (type.toLowerCase().includes(term) && !matches.some(m => m.text === type)) {
            matches.push({
              type: 'grant_type',
              text: type,
              subtitle: 'Grant Type',
              icon: '💰'
            });
          }
        });
      }
    });

    return matches.slice(0, maxSuggestions);
  }, [searchTerm, funders, maxSuggestions]);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      setSuggestions(funderSuggestions);
      setIsLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm, funderSuggestions.length]);

  return { suggestions, isLoading };
};