// src/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import ProfileLayout from './components/ProfileLayout.jsx';
import ProfileNav from './components/ProfileNav.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendedFunders, setRecommendedFunders] = useState([]);
  const [trendingGrants, setTrendingGrants] = useState([]);
  const [savedGrants, setSavedGrants] = useState([]);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const navigate = useNavigate();
  
  const fetchLayoutData = useCallback(async (userId) => {
    const [ profileResult, savedGrantsResult, recommendedFundersResult, trendingGrantsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('saved_grants').select(`id, grants(*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name)))`).eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.rpc('get_recommended_funders', { p_user_id: userId }),
      supabase.rpc('get_trending_grants')
    ]);

    if (profileResult.error) console.error('Error fetching profile:', profileResult.error);
    else setProfile(profileResult.data);
    
    if (savedGrantsResult.error) {
        console.error('Error fetching saved grants:', savedGrantsResult.error);
    } else {
        const formattedData = savedGrantsResult.data.map(item => ({ ...item.grants, save_id: item.id, foundationName: item.grants.funders?.name || 'Unknown Funder', funderLogoUrl: item.grants.funders?.logo_url || null, funderSlug: item.grants.funders?.slug || null, fundingAmount: item.grants.max_funding_amount || item.grants.funding_amount_text || 'Not specified', dueDate: item.grants.deadline, grantType: item.grants.grant_type, categories: item.grants.grant_categories.map(gc => gc.categories), locations: item.grants.grant_locations.map(gl => gl.locations) }));
        setSavedGrants(formattedData);
    }
    
    if (recommendedFundersResult.error) console.error('Error fetching recs:', recommendedFundersResult.error);
    else setRecommendedFunders(recommendedFundersResult.data);
    
    if (trendingGrantsResult.error) console.error('Error fetching trends:', trendingGrantsResult.error);
    else setTrendingGrants(trendingGrantsResult.data);

    setLoading(false);
  }, []);

  useEffect(() => {
    const checkSessionAndLoad = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/login');
      else {
        setSession(session);
        fetchLayoutData(session.user.id);
      }
    };
    checkSessionAndLoad();
  }, [navigate, fetchLayoutData]);

  const handleUnsaveGrant = async (grantId) => {
    if (!session) return;
    const itemToUnsave = savedGrants.find(g => g.id === grantId);
    if (!itemToUnsave) return;
    await supabase.from('saved_grants').delete().eq('id', itemToUnsave.save_id);
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

  if (loading || !profile) {
    return <div className="flex justify-center items-center h-screen"><p>Loading dashboard...</p></div>;
  }
  
  const leftColumnContent = <ProfileNav user={session?.user} profile={profile} />;

  const mainColumnContent = (
    // Pass everything the children might need through the context
    <Outlet context={{ session, profile, savedGrants, handleUnsaveGrant, openDetail }} />
  );

  const getInitials = (name) => { if (!name) return '?'; const words = name.split(' '); if (words.length > 1 && words[1]) return (words[0][0] + words[1][0]).toUpperCase(); if (words.length > 0 && words[0]) return words[0].substring(0, 2).toUpperCase(); return '?'; };
  const rightColumnContent = ( <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200"> <h3 className="font-bold text-slate-800 mb-4">Discover</h3> <div className="space-y-4"> <div> <h4 className="font-semibold text-sm text-slate-600 mb-2">Recommended Funders</h4> {recommendedFunders.length > 0 ? ( recommendedFunders.map(funder => ( <Link to={`/funders/${funder.slug}`} key={funder.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100"> {funder.logo_url ? <img src={funder.logo_url} alt={`${funder.name} logo`} className="h-8 w-8 rounded-full object-contain border"/> : <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 items-center justify-center font-bold text-sm">{getInitials(funder.name)}</div>} <span className="text-sm font-medium text-slate-700">{funder.name}</span> </Link> )) ) : <p className="text-xs text-slate-400 mt-1">Save some grants to see recommendations.</p>} </div> <div className="border-t border-slate-200 pt-4"> <h4 className="font-semibold text-sm text-slate-600 mb-2">Trending Grants</h4> {trendingGrants.length > 0 ? ( trendingGrants.map(grant => ( <Link to={`/grants/${grant.slug}`} key={grant.id} className="block p-2 rounded-lg hover:bg-slate-100"> <p className="text-sm font-medium text-slate-700 truncate">{grant.grant_name}</p> <p className="text-xs text-slate-500">{grant.save_count} saves this week</p> </Link> )) ) : <p className="text-xs text-slate-400 mt-1">No trending grants this week.</p>} </div> </div> </div> );

  return (
    <>
      <ProfileLayout 
        leftColumn={leftColumnContent}
        mainColumn={mainColumnContent}
        rightColumn={rightColumnContent}
      />
      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} />
      )}
    </>
  );
}
