// src/components/auth/steps/LocationStep.jsx - Updated for Phase 1
import React from 'react';

const BAY_AREA_LOCATIONS = [
  'Alameda County', 
  'Contra Costa County', 
  'Marin County', 
  'Napa County',
  'San Francisco County', 
  'San Mateo County', 
  'Santa Clara County', 
  'Solano County', 
  'Sonoma County'
];

export default function LocationStep({ formData, updateFormData }) {
  const selectLocation = (location) => {
    // Single selection - store as array for consistency
    updateFormData('location', [location]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Which community are you part of? 🏡</h1>
        <p className="text-slate-600">Select your Bay Area community</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {BAY_AREA_LOCATIONS.map((location) => {
          const isSelected = formData.location?.includes(location);
          
          return (
            <button
              key={location}
              onClick={() => selectLocation(location)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all hover:shadow-md ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              {location}
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Selected:</strong> {formData.location?.length > 0 ? formData.location[0] : 'None'}
        </p>
        {formData.location?.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            You can always update this later in your profile settings
          </p>
        )}
      </div>
    </div>
  );
}