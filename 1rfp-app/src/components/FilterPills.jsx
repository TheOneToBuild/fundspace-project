// src/components/FilterPills.jsx
import React from 'react';
import { X } from 'lucide-react';

const FilterPills = ({ activeFilters, onRemoveFilter }) => {
  // activeFilters is an array of objects like:
  // { key: 'searchTerm', label: 'Search: "community"', value: 'community' }
  // { key: 'categoryFilter', label: 'Category: Education', value: 'Education' }

  if (!activeFilters || activeFilters.length === 0) {
    return null; // Don't render if no filters are active
  }

  const getPillColorClasses = (filterKey) => {
    switch (filterKey) {
      case 'searchTerm':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'locationFilter':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'categoryFilter':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'grantTypeFilter':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'grantStatusFilter':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'minFunding':
      case 'maxFunding':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'focusAreaFilter':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'minBudget':
      case 'maxBudget':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'minStaff':
      case 'maxStaff':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      // Add more cases for other filter types as needed
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 text-sm font-medium">
      {/* Optional: Add a label for active filters if space allows and it's always visible */}
      {/* <span className="text-slate-600 mr-2">Active:</span> */}
      {activeFilters.map((filter) => (
        <span
          key={filter.key}
          className={`inline-flex items-center px-3 py-1 rounded-full border ${getPillColorClasses(filter.key)} whitespace-nowrap`}
        >
          {filter.label}
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className={`ml-2 p-0.5 rounded-full bg-opacity-30 hover:bg-opacity-50 focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors`}
            aria-label={`Remove filter ${filter.label}`}
          >
            <X size={12} className="text-white fill-current" /> {/* Use text-white for icon color */}
          </button>
        </span>
      ))}
    </div>
  );
};

export default FilterPills;