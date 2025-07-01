// src/SavedGrantsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useOutletContext, Link } from 'react-router-dom'; // <-- Import useOutletContext
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';

const BookmarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;

// This component now just renders the main content for saved grants.
export default function SavedGrantsPage() {
  const { session } = useOutletContext(); // <-- Get session from parent route
  const [loading, setLoading] = useState(true);
  const [savedGrants, setSavedGrants] = useState([]);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  const fetchSavedGrants = useCallback(async (userId) => {
    // ... (fetchSavedGrants logic is the same as before) ...
    setLoading(true);
    const { data, error } = await supabase.from('saved_grants').select(`id, grants(*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name)))`).eq('user_id', userId).order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching saved grants:', error);
    } else {
        const formattedData = data.map(item => ({ ...item.grants, save_id: item.id, foundationName: item.grants.funders?.name || 'Unknown', fundingAmount: item.grants.max_funding_amount || 'Not specified', dueDate: item.grants.deadline, categories: item.grants.grant_categories.map(gc => gc.categories), locations: item.grants.grant_locations.map(gl => gl.locations) }));
        setSavedGrants(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) {
      fetchSavedGrants(session.user.id);
    }
  }, [session, fetchSavedGrants]);

  const handleUnsaveGrant = async (grantId) => {
    // ... (handleUnsaveGrant logic is the same) ...
     const grantToUnsave = savedGrants.find(g => g.id === grantId);
     if (!grantToUnsave) return;
     await supabase.from('saved_grants').delete().match({ user_id: session.user.id, grant_id: grantId });
     setSavedGrants(prev => prev.filter(g => g.id !== grantId));
  };
  
  const openDetail = useCallback((grant) => {
    setSelectedGrant(grant);
    setIsDetailModal(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedGrant(null);
    setIsDetailModal(false);
  }, []);

  return (
    <>
      <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">My Saved Grants ({savedGrants.length})</h2>
              <p className="text-slate-500 mt-1">All the grants you've bookmarked for later.</p>
          </div>
          
          {loading ? (
            <p>Loading saved grants...</p>
          ) : savedGrants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedGrants.map(grant => (
                <GrantCard 
                  key={grant.id} grant={grant} session={session} isSaved={true}
                  onUnsave={() => handleUnsaveGrant(grant.id)}
                  onOpenDetailModal={() => openDetail(grant)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full mb-4"><BookmarkIcon /></div>
              <h3 className="text-xl font-semibold mt-4">No Saved Grants Yet</h3>
              <p className="text-slate-500 mt-2">Start exploring and save grants to see them here.</p>
              <Link to="/" className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Explore Grants</Link>
            </div>
          )}
      </div>
      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} />
      )}
    </>
  );
}