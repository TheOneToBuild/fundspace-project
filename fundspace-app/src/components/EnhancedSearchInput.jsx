// src/components/EnhancedSearchInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from './Icons.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions.js';

const EnhancedSearchInput = ({ 
  searchTerm,
  onSuggestionSelect, // This is the primary handler for all selections.
  onSearchChange, // This prop is now properly handled as a fallback.
  funders = [],
  placeholder = "Search funders, focus areas, locations...",
  className = "",
  showRecentSearches = true,
  showTrendingSearches = true
}) => {
  const [inputValue, setInputValue] = useState(searchTerm || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef(null);
  const debouncedInputValue = useDebounce(inputValue, 300);
  const { suggestions } = useSearchSuggestions(debouncedInputValue, funders);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage when the component mounts.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) { console.warn('Failed to parse recent searches:', e); }
  }, []);

  // When the parent's searchTerm changes (e.g., filters cleared), update the input.
  useEffect(() => {
    if (searchTerm !== inputValue) {
      setInputValue(searchTerm || '');
    }
  }, [searchTerm]);

  // When the user stops typing, this effect runs.
  useEffect(() => {
    // Only trigger a search if the debounced value is different from the parent's state.
    // This prevents re-triggering a search with the same term after clicking a suggestion.
    if (debouncedInputValue !== searchTerm) {
       const handler = onSuggestionSelect || onSearchChange;
       if (handler) {
         // Treat debounced typing as a standard text search.
         handler({ text: debouncedInputValue, type: 'text' });
       }
    }
  }, [debouncedInputValue]);

  const saveToRecentSearches = (term) => {
    if (!term || term.length < 2) return;
    try {
      const updated = [term, ...recentSearches.filter(item => item !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) { console.warn('Failed to save recent searches:', e); }
  };
  
  // This is the single, unified function that handles ANY suggestion selection.
  const handleSelection = (suggestion) => {
    setInputValue(suggestion.text);
    saveToRecentSearches(suggestion.text);
    
    // Use the primary onSuggestionSelect handler if it exists.
    const handler = onSuggestionSelect || onSearchChange;
    if (handler) {
      handler(suggestion);
    }
    
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events to register first.
    setTimeout(() => setIsFocused(false), 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      handleSelection({ text: inputValue, type: 'text' });
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setInputValue('');
    const handler = onSuggestionSelect || onSearchChange;
    if (handler) {
        handler({ text: '', type: 'text' });
    }
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const trendingSearches = [ "Healthcare", "Education", "Environment", "Arts & Culture", "Social Justice" ];
  const showDropdown = isFocused && (suggestions.length > 0 || (inputValue.length < 2 && (recentSearches.length > 0 || showTrendingSearches)));

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-slate-400" />
        </div>
        <input
          ref={inputRef} type="text" value={inputValue}
          onChange={handleInputChange} onFocus={handleInputFocus} onBlur={handleInputBlur} onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          autoComplete="off"
        />
        {inputValue && (
          <button type="button" onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 transition-colors" aria-label="Clear search">
            <X size={18} className="text-slate-400" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto" role="listbox">
            <>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`} type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelection(suggestion); }}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center transition-colors group cursor-pointer text-slate-700`}
                >
                   <span className="mr-3 text-lg">{suggestion.icon}</span>
                   <div className="flex-1 min-w-0">
                     <div className="font-medium truncate">{suggestion.text}</div>
                     <div className="text-xs text-slate-500">{suggestion.subtitle}</div>
                   </div>
                </button>
              ))}

              {inputValue.length < 2 && recentSearches.length > 0 && showRecentSearches && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">Recent Searches<button type="button" onMouseDown={(e) => { e.preventDefault(); clearRecentSearches(); }} className="text-slate-400 hover:text-slate-600 text-xs font-normal normal-case">Clear</button></div>
                  {recentSearches.map((term, index) => (
                    <button
                      key={`recent-${index}`} type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelection({ text: term, type: 'text' }); }}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center transition-colors cursor-pointer text-slate-700`}
                    >
                      <Clock size={16} className="mr-3 text-slate-400" /><span>{term}</span>
                    </button>
                  ))}
                </div>
              )}

              {inputValue.length < 2 && suggestions.length === 0 && recentSearches.length === 0 && showTrendingSearches && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100"><TrendingUp size={12} className="inline mr-1" />Trending Searches</div>
                  {trendingSearches.map((term, index) => (
                    <button
                      key={`trending-${index}`} type="button"
                      // CORRECTED: This now sends a suggestion of type 'text' instead of 'category'
                      onMouseDown={(e) => { e.preventDefault(); handleSelection({ text: term, type: 'text' }); }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center transition-colors cursor-pointer text-slate-700 focus:outline-none focus:bg-blue-50"
                    >
                      <TrendingUp size={16} className="mr-3 text-slate-400" /><span>{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchInput;
