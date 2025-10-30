import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react'; // Assuming ChevronDown is used for dropdown indicator

const AutocompleteInput = ({ items, selectedItems, onSelectionChange, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get the single selected category (first item in array, or empty string)
  // This component seems to be designed for single-select, but `onSelectionChange` takes an array.
  // We'll assume it's intended to manage a single selected item for display purposes.
  const selectedItem = selectedItems?.[0] || '';

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    const name = typeof item === 'string' ? item : item.name;
    const label = typeof item === 'object' ? (item.label || item.displayName || item.name) : name;
    return label?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle item selection - single select only
  const handleItemSelect = (item) => {
    const itemName = typeof item === 'string' ? item : item.name;
    onSelectionChange([itemName]); // Always pass array with single item (just the name)
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle clearing selection
  const handleClear = () => {
    onSelectionChange([]);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          handleItemSelect(filteredItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered items change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  // Display value: show selected item or search term
  const displayValue = selectedItem && !isOpen ? selectedItem : searchTerm;
  const displayPlaceholder = selectedItem ? selectedItem : placeholder;

  return (
    <div className="flex-1 relative" ref={dropdownRef}>
      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          // Clear selection when typing
          if (selectedItem) {
            onSelectionChange([]);
          }
        }}
        onFocus={() => {
          setIsOpen(true);
          // If there's a selected item, clear it and show search
          if (selectedItem) {
            setSearchTerm('');
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={displayPlaceholder}
        className="w-full flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-medium truncate"
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-[9999] min-w-[300px]">
          {filteredItems.length > 0 ? (
            <div className="py-2">
              {filteredItems.map((item, index) => {
                const itemName = typeof item === 'string' ? item : item.name;
                const itemLabel = typeof item === 'object' ? (item.label || item.displayName || item.name) : itemName;
                const itemCount = typeof item === 'object' ? item.count : '';
                
                return (
                  <button
                    key={itemName}
                    onClick={() => handleItemSelect(item)}
                    className={`w-full text-left px-6 py-3 text-base transition-colors duration-150 flex items-center justify-between ${
                      index === highlightedIndex
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-blue-50 text-gray-900'
                    }`}
                  >
                    <span>{itemLabel}</span>
                    {itemCount && (
                      <span className={`text-sm font-medium ${
                        index === highlightedIndex ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        ({itemCount}) 
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-4 text-base text-gray-500">
              {searchTerm ? `No results found for "${searchTerm}"` : "Start typing to search"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;