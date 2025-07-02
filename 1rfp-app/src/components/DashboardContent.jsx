// src/components/DashboardContent.jsx
import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import DashboardGrantCard from './DashboardGrantCard.jsx';
import GrantDetailModal from '../GrantDetailModal.jsx'; 
import { BookmarkIcon } from './Icons.jsx';

export default function DashboardContent() {
  // Get the profile data passed from the parent ProfilePage
  const { profile, savedGrants, session, handleUnsaveGrant, openDetail } = useOutletContext(); 
  
  // A more friendly and styled greeting component
  const WelcomeHeader = ({ profile }) => {
    // Get the user's first name, or default to "there"
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    
    // Get and format the current date
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
      <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 rounded-xl shadow-md border border-slate-200/80">
        <div className="flex items-center">
            <span className="text-4xl mr-4" role="img" aria-label="Waving hand">👋</span>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Hi {firstName},</h2>
                <p className="text-slate-500 mt-1">Happy {dateString}!</p>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <WelcomeHeader profile={profile} />
      
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">My Grant Feed</h2>
        <p className="text-slate-500 mt-1">Your most recently saved grants.</p>
      </div>

      {savedGrants && savedGrants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedGrants.map((grant) => (
                <DashboardGrantCard 
                    key={grant.id} 
                    grant={grant}
                    onUnsave={() => handleUnsaveGrant(grant.id)}
                    onOpenDetailModal={() => openDetail(grant)}
                />
            ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full mb-4">
                <BookmarkIcon />
            </div>
            <h3 className="text-xl font-semibold mt-4">Your Feed is Empty</h3>
            <p className="text-slate-500 mt-2">Start exploring and save grants to see them here.</p>
            <Link to="/" className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                Explore Grants
            </Link>
        </div>
      )}
    </div>
  );
}
