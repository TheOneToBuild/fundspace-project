// src/components/ProfileLayout.jsx - REFINED LAYOUT WITHOUT SIDEBARS
import React from 'react';
import ProfileNav from './ProfileNav';

export default function ProfileLayout({ 
  user, 
  profile, 
  children
}) {
  // Updated column spans - minimal space for collapsed nav, no right sidebar
  const columnSpans = { left: 'lg:col-span-1', main: 'lg:col-span-11' };

  return (
    // ✅ CRITICAL FIX: Full height flex layout
    <div className="min-h-full flex flex-col">
      {/* ✅ CRITICAL FIX: Container now has flex-1 to expand */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* ✅ CRITICAL FIX: Grid now spans 12 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-full">
          
          {/* ProfileNav - responsive width with overlay capability */}
          <aside className={columnSpans.left}>
            <div className="lg:sticky lg:top-24 relative z-50">
              <ProfileNav user={user} profile={profile} />
            </div>
          </aside>

          {/* ✅ Main content area with flex layout */}
          <main className={`${columnSpans.main} flex flex-col min-h-full`}>
            {/* ✅ Children wrapper with flex-1 */}
            <div className="flex-1">
              {children}
            </div>
          </main>

          {/* RightSidebar completely removed */}
        </div>
      </div>
      {/* MODIFIED: Footer is now handled by App.jsx */}
    </div>
  );
}