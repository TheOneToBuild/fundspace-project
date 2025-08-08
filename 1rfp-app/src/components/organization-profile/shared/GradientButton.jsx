import React from 'react';

const GradientButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary', // primary, secondary, danger
  size = 'medium', // small, medium, large
  loading = false,
  className = ''
}) => {
  const variants = {
    primary: {
      gradient: 'from-purple-400 to-pink-400',
      accent1: 'from-blue-300 to-indigo-300',
      accent2: 'from-pink-300 to-purple-300'
    },
    secondary: {
      gradient: 'from-blue-400 to-purple-400',
      accent1: 'from-purple-300 to-pink-300',
      accent2: 'from-blue-300 to-purple-300'
    },
    success: {
      gradient: 'from-emerald-400 to-teal-400',
      accent1: 'from-purple-300 to-pink-300',
      accent2: 'from-emerald-200 to-teal-200'
    },
    danger: {
      gradient: 'from-red-400 to-pink-400',
      accent1: 'from-orange-300 to-red-300',
      accent2: 'from-pink-300 to-red-300'
    }
  };

  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-sm',
    large: 'px-8 py-4 text-base'
  };

  const variantConfig = variants[variant];
  const sizeConfig = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative overflow-hidden text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group ${sizeConfig} ${className}`}
    >
      {/* Organic gradient background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-r ${variantConfig.gradient}`}></div>
        <div className={`absolute top-0 left-0 w-8 h-8 bg-gradient-to-br ${variantConfig.accent1} rounded-full blur-lg opacity-60 group-hover:scale-150 transition-transform duration-500`}></div>
        <div className={`absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br ${variantConfig.accent2} rounded-full blur-md opacity-40 group-hover:scale-125 transition-transform duration-700`}></div>
      </div>
      
      {/* Button content */}
      <div className="relative z-10 flex items-center gap-2">
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        )}
        {children}
      </div>
    </button>
  );
};

export default GradientButton;