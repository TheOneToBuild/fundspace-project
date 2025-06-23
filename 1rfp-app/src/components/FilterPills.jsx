// src/components/FilterPills.jsx
import React from 'react';
import { X } from 'lucide-react';

const FilterPills = ({ activeFilters, onRemoveFilter }) => {
  // activeFilters is now an array of objects like:
  // { key: 'searchTerm', label: 'Search: "community"' }
  // OR for multi-select:
  // { key: 'geographicScopeFilter', value: 'Marin County', label: 'Scope: Marin County' }

  if (!activeFilters || activeFilters.length === 0) {
    return null;
  }

  const getPillColorClasses = (filterKey) => {
    switch (filterKey) {
      case 'searchTerm':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'locationFilter':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'categoryFilter':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'grantTypeFilter':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'funderTypeFilter':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'grantStatusFilter':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minFunding':
      case 'maxFunding':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'focusAreaFilter':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'geographicScopeFilter':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'minBudget':
      case 'maxBudget':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'minStaff':
      case 'maxStaff':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 text-sm font-medium">
      {activeFilters.map((filter, index) => (
        <span
          // Use a more robust key that includes the value for multi-select items
          key={`${filter.key}-${filter.value || index}`}
          className={`inline-flex items-center px-3 py-1 rounded-full border ${getPillColorClasses(filter.key)} whitespace-nowrap`}
        >
          {filter.label}
          <button
            // Pass both the key and the specific value to remove for multi-select filters
            onClick={() => onRemoveFilter(filter.key, filter.value)}
            className={`ml-2 p-0.5 rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors`}
            aria-label={`Remove filter ${filter.label}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
};

export default FilterPills;