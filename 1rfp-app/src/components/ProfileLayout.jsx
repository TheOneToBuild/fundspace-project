// src/components/ProfileLayout.jsx
import React from 'react';
import DashboardHeader from './DashboardHeader';
import Footer from './Footer'; 

export default function ProfileLayout({ leftColumn, mainColumn, rightColumn }) {
  return (
    // MODIFIED: Removed 'min-h-screen' and 'bg-slate-50' to allow the parent
    // component to control the background and overall page height.
    <div className="flex flex-col">
      <DashboardHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <aside className="lg:col-span-3 xl:col-span-2">
            <div className="lg:sticky lg:top-24">
              {leftColumn}
            </div>
          </aside>

          <main className="lg:col-span-9 xl:col-span-7">
            {mainColumn}
          </main>

          <aside className="hidden xl:block xl:col-span-3">
             <div className="xl:sticky xl:top-24">
              {rightColumn}
            </div>
          </aside>

        </div>
      </div>
      <Footer /> 
    </div>
  );
}