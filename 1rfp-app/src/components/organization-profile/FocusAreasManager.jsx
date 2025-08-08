// src/components/organization-profile/FocusAreasManager.jsx
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import FormField, { FormInput } from './shared/FormField.jsx';

const FocusAreaPill = ({ area, onRemove = null, editable = false }) => {
  const gradients = [
    'from-amber-100 to-orange-100 text-amber-700 border-orange-200', 
    'from-emerald-100 to-teal-100 text-emerald-700 border-teal-200', 
    'from-rose-100 to-pink-100 text-rose-700 border-rose-200', 
    'from-blue-100 to-indigo-100 text-blue-700 border-indigo-200'
  ];
  const gradient = gradients[area.length % gradients.length];
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border bg-gradient-to-r ${gradient} ${editable ? 'pr-1' : ''}`}>
      {area}
      {editable && onRemove && (
        <button
          onClick={() => onRemove(area)}
          className="ml-2 p-0.5 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

const FocusAreasManager = ({ 
  focusAreas = [], 
  onChange, 
  editable = false,
  className = '' 
}) => {
  const [newFocusArea, setNewFocusArea] = useState('');

  const addFocusArea = () => {
    if (newFocusArea.trim() && !focusAreas.includes(newFocusArea.trim())) {
      onChange([...focusAreas, newFocusArea.trim()]);
      setNewFocusArea('');
    }
  };

  const removeFocusArea = (areaToRemove) => {
    onChange(focusAreas.filter(area => area !== areaToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFocusArea();
    }
  };

  return (
    <div className={className}>
      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
        Focus Areas
      </h4>
      
      {/* Display Focus Areas */}
      {focusAreas.length > 0 ? (
        <div className="flex flex-wrap gap-3 mb-4">
          {focusAreas.map((area) => (
            <FocusAreaPill 
              key={area} 
              area={area} 
              onRemove={editable ? removeFocusArea : null}
              editable={editable}
            />
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-sm mb-4">
          {editable ? "No focus areas added yet" : "No focus areas specified"}
        </div>
      )}

      {/* Add New Focus Area (only in edit mode) */}
      {editable && (
        <FormField 
          label="Add Focus Area" 
          labelColor="emerald-400"
          className="mb-0"
        >
          <div className="flex gap-2">
            <FormInput
              value={newFocusArea}
              onChange={(e) => setNewFocusArea(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Education, Healthcare, Environment"
              className="flex-1"
            />
            <button
              onClick={addFocusArea}
              disabled={!newFocusArea.trim()}
              className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </FormField>
      )}
    </div>
  );
};

export default FocusAreasManager;
export { FocusAreaPill };