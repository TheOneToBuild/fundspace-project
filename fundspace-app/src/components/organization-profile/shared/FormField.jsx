import React from 'react';

const FormField = ({
  label,
  labelColor = 'purple-400',
  icon: Icon,
  children,
  className = ''
}) => {
  return (
    <div className={`group ${className}`}>
      <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r from-${labelColor} to-pink-400`}></div>
        {label}
      </label>
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
        )}
        {children}
      </div>
    </div>
  );
};

// Reusable Input Component
export const FormInput = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  className = '',
  ...props
}) => {
  const hasIcon = !!Icon;
  
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full ${hasIcon ? 'pl-11 pr-4' : 'px-4'} py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white ${className}`}
      {...props}
    />
  );
};

// Reusable Textarea Component
export const FormTextarea = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white resize-none ${className}`}
      {...props}
    />
  );
};

export default FormField;