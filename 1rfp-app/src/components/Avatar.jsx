// src/components/Avatar.jsx - Fixed Avatar Display Component
import React, { useState, useEffect } from 'react';

const Avatar = ({ 
  src, 
  fullName, 
  size = 'md', 
  className = '',
  onClick = null,
  showOnlineStatus = false,
  isOnline = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset error state when src changes
  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [src]);

  // Size configurations
  const sizeConfig = {
    xs: { 
      container: 'w-6 h-6', 
      text: 'text-xs', 
      status: 'w-2 h-2 bottom-0 right-0',
      border: 'border'
    },
    sm: { 
      container: 'w-8 h-8', 
      text: 'text-sm', 
      status: 'w-2.5 h-2.5 bottom-0 right-0',
      border: 'border'
    },
    md: { 
      container: 'w-10 h-10', 
      text: 'text-base', 
      status: 'w-3 h-3 bottom-0 right-0',
      border: 'border-2'
    },
    lg: { 
      container: 'w-16 h-16', 
      text: 'text-lg', 
      status: 'w-4 h-4 bottom-0.5 right-0.5',
      border: 'border-2'
    },
    xl: { 
      container: 'w-20 h-20', 
      text: 'text-xl', 
      status: 'w-5 h-5 bottom-1 right-1',
      border: 'border-2'
    },
    '2xl': { 
      container: 'w-24 h-24', 
      text: 'text-2xl', 
      status: 'w-6 h-6 bottom-1 right-1',
      border: 'border-2'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Generate initials from full name
  const getInitials = (name) => {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent background color based on name
  const getBackgroundColor = (name) => {
    if (!name) return 'bg-slate-500';
    
    const colors = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.warn('Avatar image failed to load:', src);
    setImageError(true);
    setImageLoading(false);
  };

  // Check if we should show the image
  const shouldShowImage = src && !imageError && src.trim() !== '';

  const containerClasses = `
    relative inline-block ${config.container} rounded-full overflow-hidden
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `;

  const initialsClasses = `
    ${config.container} rounded-full flex items-center justify-center
    ${getBackgroundColor(fullName)} text-white font-semibold ${config.text}
    select-none
  `;

  const imageClasses = `
    ${config.container} rounded-full object-cover
    ${config.border} border-white
    ${imageLoading ? 'opacity-0' : 'opacity-100'}
    transition-opacity duration-200
  `;

  const statusClasses = `
    absolute ${config.status} rounded-full ${config.border} border-white
    ${isOnline ? 'bg-green-500' : 'bg-slate-400'}
  `;

  return (
    <div className={containerClasses} onClick={onClick}>
      {shouldShowImage ? (
        <>
          {/* Loading placeholder while image loads */}
          {imageLoading && (
            <div className={initialsClasses}>
              <div className="animate-pulse">
                {getInitials(fullName)}
              </div>
            </div>
          )}
          
          {/* Actual image */}
          <img
            src={src}
            alt={fullName || 'Avatar'}
            className={imageClasses}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        </>
      ) : (
        // Fallback initials
        <div className={initialsClasses}>
          {getInitials(fullName)}
        </div>
      )}

      {/* Online status indicator */}
      {showOnlineStatus && (
        <div 
          className={statusClasses}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;