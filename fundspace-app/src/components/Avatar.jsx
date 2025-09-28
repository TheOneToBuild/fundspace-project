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
  const [imageLoading, setImageLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    const newSrc = src?.trim();
    
    if (!newSrc || newSrc === '') {
      setImageSrc(null);
      setImageError(false);
      setImageLoading(false);
      return;
    }

    if (newSrc !== imageSrc) {
      setImageError(false);
      setImageLoading(true);
      setImageSrc(newSrc);
      
      const img = new Image();
      img.onload = () => {
        setImageLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        console.warn('Avatar image failed to load:', newSrc);
        setImageLoading(false);
        setImageError(true);
      };
      img.src = newSrc;
    }
  }, [src, imageSrc]);

  const sizeConfig = {
    xs: { 
      size: 'w-6 h-6',
      text: 'text-xs', 
      status: 'w-2 h-2 -bottom-0.5 -right-0.5'
    },
    sm: { 
      size: 'w-8 h-8',
      text: 'text-sm', 
      status: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5'
    },
    md: { 
      size: 'w-10 h-10',
      text: 'text-base', 
      status: 'w-3 h-3 -bottom-0.5 -right-0.5'
    },
    lg: { 
      size: 'w-16 h-16',
      text: 'text-lg', 
      status: 'w-4 h-4 -bottom-1 -right-1'
    },
    xl: { 
      size: 'w-20 h-20',
      text: 'text-xl', 
      status: 'w-5 h-5 -bottom-1 -right-1'
    },
    '2xl': { 
      size: 'w-24 h-24',
      text: 'text-2xl', 
      status: 'w-6 h-6 -bottom-1 -right-1'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  const getInitials = (name) => {
    if (!name) return '?';
    
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  const shouldShowImage = imageSrc && !imageError && !imageLoading;

  const containerClasses = [
    'relative',
    'inline-block',
    config.size,
    'rounded-full',
    'overflow-hidden',
    'flex-shrink-0',
    onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
    className
  ].filter(Boolean).join(' ');

  const initialsClasses = [
    'w-full',
    'h-full',
    'rounded-full',
    'flex',
    'items-center',
    'justify-center',
    getBackgroundColor(fullName),
    'text-white',
    'font-semibold',
    config.text,
    'select-none'
  ].join(' ');

  const imageClasses = [
    'w-full',
    'h-full',
    'object-cover',
    'rounded-full'
  ].join(' ');

  const statusClasses = [
    'absolute',
    config.status,
    'rounded-full',
    'border-2',
    'border-white',
    isOnline ? 'bg-green-500' : 'bg-slate-400'
  ].join(' ');

  return (
    <div className={containerClasses} onClick={onClick}>
      {shouldShowImage ? (
        <img
          src={imageSrc}
          alt={fullName || 'Avatar'}
          className={imageClasses}
          loading="lazy"
        />
      ) : (
        <div className={initialsClasses}>
          {imageLoading ? (
            <div className="animate-pulse">
              {getInitials(fullName)}
            </div>
          ) : (
            getInitials(fullName)
          )}
        </div>
      )}

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