import React from 'react';
import Select, { components } from 'react-select';
import { Check } from 'lucide-react';

const CategoryFilterInput = ({ 
  categoryOptions, 
  categoryFilter, 
  setCategoryFilter, 
  customSelectStyles, 
  handleMultiSelectChange 
}) => {
  // Custom input component that shows a search icon
  const CustomInput = (props) => (
    <components.Input 
      {...props} 
      placeholder="Type to search categories..."
    />
  );

  // Custom option component to highlight search matches
  const CustomOption = (props) => {
    const { data, isSelected, innerRef, innerProps } = props;
    
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className={`px-3 py-2 cursor-pointer transition-colors duration-150 ${
          isSelected 
            ? 'bg-blue-500 text-white' 
            : 'hover:bg-blue-50 text-gray-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <span>{data.label}</span>
          {isSelected && <Check size={14} />}
        </div>
      </div>
    );
  };

  // Custom menu component with better styling
  const CustomMenu = (props) => (
    <components.Menu {...props}>
      <div className="py-1 max-h-60 overflow-auto">
        {props.children}
      </div>
    </components.Menu>
  );

  const getSelectedValues = (filter, options) => {
    if (!filter) return [];
    if (Array.isArray(filter)) {
      return options.filter(opt => filter.includes(opt.value));
    }
    return options.find(opt => opt.value === filter) || [];
  };

  return (
    <div className="min-w-[180px]">
      <Select
        id="category-filter"
        isMulti
        options={categoryOptions}
        value={getSelectedValues(categoryFilter, categoryOptions)}
        onChange={handleMultiSelectChange(setCategoryFilter)}
        placeholder="Search categories..."
        classNamePrefix="filter-pill"
        components={{
          Input: CustomInput,
          Option: CustomOption,
          Menu: CustomMenu,
          DropdownIndicator: () => null, // Remove dropdown arrow
          IndicatorSeparator: () => null, // Remove separator
        }}
        styles={{
          ...customSelectStyles,
          control: (base, state) => ({
            ...base,
            borderRadius: '9999px',
            minHeight: '44px',
            maxHeight: '44px',
            paddingLeft: '20px',
            paddingRight: '20px',
            fontWeight: 500,
            fontSize: '15px',
            boxShadow: 'none',
            borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
            background: '#fff',
            cursor: 'text', // Change cursor to text for search feel
          }),
          placeholder: (base) => ({ 
            ...base, 
            color: '#64748b', 
            fontWeight: 400,
            fontStyle: 'italic'
          }),
          input: (base) => ({
            ...base,
            color: '#374151',
          }),
          menu: (base) => ({
            ...base,
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          }),
          option: () => ({}), // Handled by CustomOption
          multiValue: (base) => ({
            ...base,
            backgroundColor: '#dbeafe',
            borderRadius: '6px',
            border: '1px solid #bfdbfe',
          }),
          multiValueLabel: (base) => ({ 
            ...base, 
            color: '#1e40af',
            fontSize: '12px',
            fontWeight: '500'
          }),
          multiValueRemove: (base) => ({ 
            ...base, 
            color: '#1e40af',
            '&:hover': { 
              backgroundColor: '#bfdbfe',
              color: '#1e40af'
            }
          }),
        }}
        isClearable
        isSearchable={true}
        filterOption={(option, inputValue) => {
          return option.label.toLowerCase().includes(inputValue.toLowerCase());
        }}
        menuIsOpen={undefined} // Let react-select handle open/close
        noOptionsMessage={({ inputValue }) => 
          inputValue ? `No categories found for "${inputValue}"` : "Start typing to search categories"
        }
      />
    </div>
  );
};

const FilterBar = ({
  isMobileVisible,
  categoryFilter,
  setCategoryFilter,
  availableCategories,
  // ... other props like location, grant type, etc. would go here
}) => {
  if (!isMobileVisible) {
    return null;
  }

  const categoryOptions = (availableCategories || []).map(cat => ({
    value: typeof cat === 'string' ? cat : cat.name,
    label: typeof cat === 'string' ? cat : cat.name,
  }));

  const customSelectStyles = {
    // Define any shared custom styles here if needed
  };

  const handleMultiSelectChange = (setter) => (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setter(values);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-b-2xl shadow-lg border-t border-slate-200 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        {/* Other filters would go here */}
        
        {/* Enhanced Category Filter */}
        {setCategoryFilter && (
          <CategoryFilterInput
            categoryOptions={categoryOptions}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            customSelectStyles={customSelectStyles}
            handleMultiSelectChange={handleMultiSelectChange}
          />
        )}

        {/* Placeholder for other filters */}
        <div className="text-slate-400 text-sm italic">Other filters here...</div>
      </div>
    </div>
  );
};

export default FilterBar;