// src/components/ProfileLayout.jsx
import React from 'react';
import DashboardHeader from './DashboardHeader';
import Footer from './Footer'; 

export default function ProfileLayout({ leftColumn, mainColumn, rightColumn }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Now narrower on larger screens */}
          <aside className="lg:col-span-3 xl:col-span-2">
            <div className="lg:sticky lg:top-24">
              {leftColumn}
            </div>
          </aside>

          {/* Center Column: Now wider to fill the space */}
          <main className="lg:col-span-9 xl:col-span-7">
            {mainColumn}
          </main>

          {/* Right Column: Unchanged */}
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
