// src/components/ProfileLayout.jsx
import React from 'react';
import DashboardHeader from './DashboardHeader';
import Footer from './Footer'; 
import ProfileNav from './ProfileNav.jsx';
import UpcomingDeadlines from './UpcomingDeadlines.jsx';
import { FileText, Bell, BarChart3, TrendingUp } from './Icons.jsx';

const RightSidebar = ({ savedGrants, trendingGrants, handleTrendingGrantClick }) => {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold mb-2 text-slate-800 text-sm">Quick Actions</h3>
            <div className="space-y-1">
                <button className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex items-center text-sm transition-colors text-slate-700">
                    <FileText size={16} className="text-slate-500" />
                    <span className="ml-2">Share an update</span>
                </button>
                <button className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex items-center text-sm transition-colors text-slate-700">
                    <Bell size={16} className="text-slate-500" />
                    <span className="ml-2">Set grant alerts</span>
                </button>
                <button className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex items-center text-sm transition-colors text-slate-700">
                    <BarChart3 size={16} className="text-slate-500" />
                    <span className="ml-2">View analytics</span>
                </button>
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm mb-2">Upcoming Deadlines</h3>
            <UpcomingDeadlines savedGrants={savedGrants} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-3 text-slate-800 text-sm">Trending This Week</h3>
          <div className="space-y-2">
            {trendingGrants?.slice(0, 3).map((grant) => (
              <button key={grant.id} onClick={() => handleTrendingGrantClick(grant.id)} className="w-full text-left p-2 hover:bg-slate-50 rounded-lg group">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 line-clamp-2">{grant.title}</p>
                <div className="flex items-center mt-1 text-xs text-slate-500">
                  <TrendingUp size={14} className="mr-1.5" />
                  <span>{grant.save_count || 0} saves</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
};

export default function ProfileLayout({ 
  children,
  profile,
  user,
  savedGrants,
  trendingGrants,
  handleTrendingGrantClick,
  notifications,
  unreadCount,
  onNotificationPanelToggle
}) {
  // --- MODIFIED: Changed column spans for a wider main content area ---
  const columnSpans = { left: 'lg:col-span-2', main: 'lg:col-span-8', right: 'lg:col-span-2' };

  return (
    <div className="flex flex-col">
      <DashboardHeader 
          notifications={notifications} 
          unreadCount={unreadCount}
          onPanelToggle={onNotificationPanelToggle}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <aside className={columnSpans.left}>
            <div className="lg:sticky lg:top-24">
              <ProfileNav user={user} profile={profile} />
            </div>
          </aside>

          <main className={columnSpans.main}>
            {children}
          </main>

          <aside className={columnSpans.right}>
             <div className="lg:sticky lg:top-24">
              <RightSidebar 
                savedGrants={savedGrants} 
                trendingGrants={trendingGrants} 
                handleTrendingGrantClick={handleTrendingGrantClick}
              />
            </div>
          </aside>

        </div>
      </div>
      <Footer /> 
    </div>
  );
}