import React, { useState, useEffect } from 'react';

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

export default function LocationSelector({ location, onChange, loading }) {
  // Determine the initial state based on the incoming 'location' prop
  const isInitialCustom = location && !BAY_AREA_LOCATIONS.includes(location);
  const initialSelectValue = isInitialCustom ? 'other' : location || '';

  // NEW: State to manage the dropdown's value internally
  const [selectValue, setSelectValue] = useState(initialSelectValue);
  
  // State to hold the value of the custom text input
  const [customLocation, setCustomLocation] = useState(isInitialCustom ? location : '');

  // This effect syncs the component if the location prop changes from the outside
  useEffect(() => {
    const isPropCustom = location && !BAY_AREA_LOCATIONS.includes(location);
    setSelectValue(isPropCustom ? 'other' : location || '');
    setCustomLocation(isPropCustom ? location : '');
  }, [location]);
  
  const handleSelectChange = (e) => {
    const value = e.target.value;
    // UPDATE: We now set the internal state to control the UI
    setSelectValue(value);

    if (value === 'other') {
      // When "Other" is selected, clear the old location and wait for custom input
      onChange('');
      setCustomLocation('');
    } else {
      // If a Bay Area county is selected, update the parent state
      onChange(value);
    }
  };

  const handleCustomInputChange = (e) => {
    const value = e.target.value;
    setCustomLocation(value);
    // Update the parent state in real-time as the user types
    onChange(value);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800">Your Location</h3>
      <p className="text-xs text-slate-500 mb-4">
        Select your community from the list, or choose "Other" to add your own.
      </p>
      
      <select
        value={selectValue}
        onChange={handleSelectChange}
        disabled={loading}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>Select your location...</option>
        {BAY_AREA_LOCATIONS.map(county => (
          <option key={county} value={county}>{county}</option>
        ))}
        <option value="other">Other...</option>
      </select>

      {/* This condition now works correctly because it depends on our internal state */}
      {selectValue === 'other' && (
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700 block mb-1">
            Enter Custom Location
          </label>
          <input
            type="text"
            value={customLocation}
            onChange={handleCustomInputChange}
            placeholder="e.g., Los Angeles, CA"
            disabled={loading}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}