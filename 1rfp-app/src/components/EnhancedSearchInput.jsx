// src/components/EnhancedSearchInput.jsx - FIXED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from './Icons.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions.js';

const EnhancedSearchInput = ({ 
  searchTerm, 
  onSearchChange, 
  onSuggestionSelect,
  funders = [],
  placeholder = "Search funders, focus areas, locations...",
  className = "",
  showRecentSearches = true,
  showTrendingSearches = true
}) => {
  const [inputValue, setInputValue] = useState(searchTerm || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const isInternalChange = useRef(false);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce the search term to reduce API calls
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const { suggestions, isLoading } = useSearchSuggestions(debouncedSearchTerm, funders);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse recent searches:', e);
    }
  }, []);

  // Update parent component when debounced value changes
  useEffect(() => {
    // Only notify parent if this was an internal change (user typing)
    if (isInternalChange.current && debouncedSearchTerm !== searchTerm) {
      console.log('Updating parent with debounced term:', debouncedSearchTerm);
      onSearchChange(debouncedSearchTerm);
    }
    isInternalChange.current = false; // Reset flag
  }, [debouncedSearchTerm, onSearchChange, searchTerm]);

  // FIXED: Sync input with external searchTerm changes (like Clear All)
  useEffect(() => {
    console.log('External searchTerm prop changed to:', searchTerm, 'Current input:', inputValue);
    // Only sync if this isn't from our own change
    if (!isInternalChange.current) {
      console.log('Syncing input to external prop:', searchTerm);
      setInputValue(searchTerm || '');
    }
  }, [searchTerm, inputValue]);

  const saveToRecentSearches = (term) => {
    if (!term || term.length < 2) return;
    
    try {
      const updated = [term, ...recentSearches.filter(item => item !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent searches:', e);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    console.log('Input changed to:', value);
    isInternalChange.current = true; // Mark as internal change
    setInputValue(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200); // Increased delay to ensure clicks register
  };

  const handleSuggestionClick = (suggestion) => {
    console.log('Suggestion clicked:', suggestion);
    let searchValue = suggestion.text;
    
    isInternalChange.current = true; // Mark as internal change
    setInputValue(searchValue);
    setShowSuggestions(false);
    saveToRecentSearches(searchValue);
    
    // Notify parent component immediately
    onSearchChange(searchValue);
    
    // If callback provided for specific suggestion handling
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    
    inputRef.current?.blur();
  };

  // FIXED: Make recent search clicks work properly
  const handleRecentSearchClick = (term) => {
    console.log('Recent search clicked:', term);
    isInternalChange.current = true; // Mark as internal change
    setInputValue(term);
    onSearchChange(term);
    saveToRecentSearches(term);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // FIXED: Make trending searches clickable
  const handleTrendingSearchClick = (term) => {
    console.log('Trending search clicked:', term);
    isInternalChange.current = true; // Mark as internal change
    setInputValue(term);
    onSearchChange(term);
    saveToRecentSearches(term);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    console.log('Clearing search');
    isInternalChange.current = true; // Mark as internal change
    setInputValue('');
    onSearchChange('');
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recentSearches');
    } catch (e) {
      console.warn('Failed to clear recent searches:', e);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    const allSuggestions = [
      ...suggestions,
      ...(inputValue.length < 2 ? recentSearches.map(term => ({
        type: 'recent',
        text: term,
        subtitle: 'Recent search',
        icon: '🕒'
      })) : [])
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && allSuggestions[selectedSuggestionIndex]) {
          handleSuggestionClick(allSuggestions[selectedSuggestionIndex]);
        } else if (inputValue.trim()) {
          saveToRecentSearches(inputValue);
          setShowSuggestions(false);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const trendingSearches = [
    "Healthcare", "Education", "Environment", "Arts & Culture", "Social Justice"
  ];

  const showDropdown = showSuggestions && isFocused && (
    suggestions.length > 0 || 
    (inputValue.length < 2 && (recentSearches.length > 0 || showTrendingSearches))
  );

  const allSuggestions = [
    ...suggestions,
    ...(inputValue.length < 2 ? recentSearches.map(term => ({
      type: 'recent',
      text: term,
      subtitle: 'Recent search',
      icon: '🕒'
    })) : [])
  ];

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-slate-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg
            placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 
            focus:border-green-500 transition-all duration-200
            ${isFocused ? 'ring-2 ring-green-500 border-green-500' : ''}
          `}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        
        {inputValue && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <X size={18} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-slate-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600 mr-2"></div>
              Searching...
            </div>
          ) : (
            <>
              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center
                        transition-colors group cursor-pointer
                        ${selectedSuggestionIndex === index ? 'bg-green-50 text-green-700' : 'text-slate-700'}
                      `}
                      role="option"
                      aria-selected={selectedSuggestionIndex === index}
                    >
                      <span className="mr-3 text-lg">{suggestion.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{suggestion.text}</div>
                        <div className="text-xs text-slate-500">{suggestion.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches - FIXED */}
              {inputValue.length < 2 && recentSearches.length > 0 && showRecentSearches && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    Recent Searches
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearRecentSearches}
                      className="text-slate-400 hover:text-slate-600 text-xs font-normal normal-case"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((term, index) => (
                    <button
                      key={`recent-${index}`}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                      onClick={() => handleRecentSearchClick(term)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center
                        transition-colors cursor-pointer
                        ${selectedSuggestionIndex === suggestions.length + index ? 'bg-green-50 text-green-700' : 'text-slate-700'}
                      `}
                    >
                      <Clock size={16} className="mr-3 text-slate-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Searches - FIXED */}
              {inputValue.length < 2 && suggestions.length === 0 && recentSearches.length === 0 && showTrendingSearches && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <TrendingUp size={12} className="inline mr-1" />
                    Trending Searches
                  </div>
                  {trendingSearches.map((term, index) => (
                    <button
                      key={`trending-${index}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleTrendingSearchClick(term)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center transition-colors cursor-pointer text-slate-700 focus:outline-none focus:bg-green-50"
                    >
                      <TrendingUp size={16} className="mr-3 text-slate-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {inputValue.length >= 2 && suggestions.length === 0 && !isLoading && (
                <div className="px-4 py-6 text-center text-slate-500">
                  <Search size={24} className="mx-auto mb-2 text-slate-300" />
                  <div className="font-medium">No suggestions found</div>
                  <div className="text-sm">Try a different search term</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchInput;