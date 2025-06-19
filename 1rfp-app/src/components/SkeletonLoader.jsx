// components/SkeletonLoader.jsx
import React from 'react';

// Base Skeleton component for consistent styling
const SkeletonBase = ({ className = '', width, height, isCircle = false, animate = true }) => {
  const baseClasses = `${animate ? 'animate-pulse' : ''} bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] ${animate ? 'animate-[shimmer_1.5s_ease-in-out_infinite]' : ''}`;
  const shapeClasses = isCircle ? 'rounded-full' : 'rounded';
  const sizeClasses = width ? `w-[${width}]` : 'w-full';
  const heightClasses = height ? `h-[${height}]` : 'h-4';

  return (
    <div 
      className={`${baseClasses} ${shapeClasses} ${sizeClasses} ${heightClasses} ${className}`}
      style={{ 
        width: width || undefined, 
        height: height || undefined,
        background: animate ? 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)' : '#f1f5f9',
        backgroundSize: animate ? '200% 100%' : 'auto',
        animation: animate ? 'shimmer 1.5s ease-in-out infinite' : 'none'
      }}
    />
  );
};

// Funder Card Skeleton
export const FunderCardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 h-full">
      {/* Header with Logo and Name */}
      <div className="flex items-start gap-4 mb-4">
        <SkeletonBase width="64px" height="64px" isCircle={true} />
        <div className="flex-1">
          <SkeletonBase width="180px" height="20px" className="mb-2" />
          <SkeletonBase width="100px" height="16px" />
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <SkeletonBase height="16px" className="mb-2" />
        <SkeletonBase height="16px" className="mb-2" />
        <SkeletonBase width="75%" height="16px" />
      </div>

      {/* Key Info List */}
      <div className="space-y-3 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start">
            <SkeletonBase width="16px" height="16px" className="mr-2.5 mt-0.5" />
            <SkeletonBase width="60%" height="14px" />
          </div>
        ))}
      </div>

      {/* Grant Types */}
      <div className="pt-4 border-t border-slate-100 mb-4">
        <SkeletonBase width="120px" height="12px" className="mb-2" />
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <SkeletonBase key={i} width="80px" height="24px" className="rounded-full" />
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      <div className="pt-4 border-t border-slate-100 mb-6">
        <SkeletonBase width="100px" height="12px" className="mb-2" />
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <SkeletonBase key={i} width={`${60 + (i * 20)}px`} height="24px" className="rounded-full" />
          ))}
        </div>
      </div>

      {/* Button */}
      <SkeletonBase height="40px" className="rounded-lg" />
    </div>
  );
};

// Funder Profile Skeleton
export const FunderProfileSkeleton = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <SkeletonBase width="150px" height="16px" />
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg divide-y divide-slate-200">
          {/* Header Section */}
          <div className="flex items-start gap-6 mb-6 pb-6">
            <SkeletonBase width="96px" height="96px" isCircle={true} />
            <div className="flex-1">
              <SkeletonBase width="300px" height="32px" className="mb-3" />
              <SkeletonBase width="120px" height="20px" />
            </div>
          </div>

          {/* Description Section */}
          <div className="py-6">
            <div className="mb-6">
              <SkeletonBase height="16px" className="mb-2" />
              <SkeletonBase height="16px" className="mb-2" />
              <SkeletonBase width="80%" height="16px" />
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start">
                  <SkeletonBase width="18px" height="18px" className="mr-3 mt-1" />
                  <SkeletonBase width="70%" height="16px" />
                </div>
              ))}
            </div>
          </div>

          {/* Grant Types Section */}
          <div className="py-6">
            <SkeletonBase width="150px" height="16px" className="mb-3" />
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
                <SkeletonBase key={i} width={`${80 + (i * 15)}px`} height="28px" className="rounded-full" />
              ))}
            </div>
          </div>

          {/* Application Process Section */}
          <div className="py-6">
            <SkeletonBase width="180px" height="16px" className="mb-3" />
            <div className="bg-slate-50 p-4 rounded-md border">
              <SkeletonBase height="16px" className="mb-2" />
              <SkeletonBase height="16px" className="mb-2" />
              <SkeletonBase width="85%" height="16px" />
            </div>
          </div>

          {/* Focus Areas Section */}
          <div className="py-6">
            <SkeletonBase width="120px" height="16px" className="mb-3" />
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <SkeletonBase key={i} width={`${70 + (i * 20)}px`} height="28px" className="rounded-full" />
              ))}
            </div>
          </div>

          {/* Key Personnel Section */}
          <div className="py-6">
            <SkeletonBase width="140px" height="16px" className="mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex">
                  <SkeletonBase width="40%" height="16px" className="mr-4" />
                  <SkeletonBase width="60%" height="16px" />
                </div>
              ))}
            </div>
          </div>

          {/* Past Grantees Section */}
          <div className="py-6">
            <SkeletonBase width="200px" height="16px" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                  <SkeletonBase width="80%" height="16px" className="mb-2" />
                  <SkeletonBase height="14px" className="mb-1" />
                  <SkeletonBase width="60%" height="14px" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Grants Section */}
          <div className="py-6">
            <SkeletonBase width="180px" height="16px" className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <GrantCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Website Button */}
          <div className="pt-8">
            <SkeletonBase width="200px" height="44px" className="rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Grant Card Skeleton
export const GrantCardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <SkeletonBase height="20px" className="mb-2" />
        <SkeletonBase width="70%" height="16px" />
      </div>

      {/* Content */}
      <div className="mb-4">
        <SkeletonBase height="14px" className="mb-2" />
        <SkeletonBase height="14px" className="mb-2" />
        <SkeletonBase width="80%" height="14px" />
      </div>

      {/* Meta info */}
      <div className="space-y-2 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center">
            <SkeletonBase width="16px" height="16px" className="mr-2" />
            <SkeletonBase width="60%" height="14px" />
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonBase key={i} width={`${50 + (i * 20)}px`} height="20px" className="rounded-full" />
        ))}
      </div>

      {/* Button */}
      <SkeletonBase height="36px" className="rounded-md" />
    </div>
  );
};

// Search Results Skeleton
export const SearchResultsSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <FunderCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Add CSS for shimmer animation (to be included in your main CSS file)
export const shimmerCSS = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
`;

export default {
  FunderCardSkeleton,
  FunderProfileSkeleton,
  GrantCardSkeleton,
  SearchResultsSkeleton,
  SkeletonBase
};