// src/components/ProfileLayout.jsx - REDESIGNED: Full-width layout without sidebar
import React from 'react';

export default function ProfileLayout({ 
  user, 
  profile, 
  children
}) {
  return (
    <div className="min-h-full flex flex-col">
      {/* Full-width container without sidebar */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Full-width main content */}
        <main className="flex flex-col min-h-full">
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}