// src/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import ProfileLayout from './components/ProfileLayout.jsx';
import ProfileNav from './components/ProfileNav.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import UpcomingDeadlines from './components/UpcomingDeadlines.jsx';
import { Clock, Compass, Lightbulb, BarChart } from './components/Icons.jsx';

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
    const [
      profileResult,
      savedGrantsResult,
      recommendedFundersResult,
      trendingGrantsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('saved_grants').select(`id, grants(*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name)))`).eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.rpc('get_recommended_funders', { p_user_id: userId }),
      supabase.rpc('get_trending_grants')
    ]);

    if (profileResult.error) console.error('Error fetching profile:', profileResult.error);
    else setProfile(profileResult.data);
    
    if (savedGrantsResult.error) console.error('Error fetching saved grants:', savedGrantsResult.error);
    else {
        const formattedSaved = savedGrantsResult.data.map(item => ({...item.grants, save_id: item.id, foundationName: item.grants.funders?.name, funderLogoUrl: item.grants.funders?.logo_url, funderSlug: item.grants.funders?.slug, fundingAmount: item.grants.max_funding_amount, dueDate: item.grants.deadline, grantType: item.grants.grant_type, categories: item.grants.grant_categories.map(gc => gc.categories), locations: item.grants.grant_locations.map(gl => gl.locations)}));
        setSavedGrants(formattedSaved);
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

  const handleTrendingGrantClick = async (grantId) => {
    const { data, error } = await supabase.from('grants').select(`*, funders(*), grant_categories(categories(*)), grant_locations(locations(*))`).eq('id', grantId).single();
    if (error) {
        console.error('Error fetching grant details:', error);
        return;
    }
    const formattedGrant = { ...data, foundationName: data.funders?.name, funderLogoUrl: data.funders?.logo_url, funderSlug: data.funders?.slug, fundingAmount: data.max_funding_amount || data.funding_amount_text, dueDate: data.deadline, grantType: data.grant_type, categories: data.grant_categories.map(gc => gc.categories), locations: data.grant_locations.map(gl => gl.locations) };
    openDetail(formattedGrant);
  };


  if (loading || !profile) {
    return <div className="flex justify-center items-center h-screen"><p>Loading dashboard...</p></div>;
  }
  
  const leftColumnContent = <ProfileNav user={session?.user} profile={profile} />;
  
  // FIXED: Added handleUnsaveGrant to the context provided to the Outlet
  const mainColumnContent = <Outlet context={{ session, profile, savedGrants, onOpenGrantDetail: openDetail, handleUnsaveGrant }} />;
  
  const getInitials = (name) => { if (!name) return '?'; const words = name.split(' '); if (words.length > 1 && words[1]) return (words[0][0] + words[1][0]).toUpperCase(); if (words.length > 0 && words[0]) return words[0].substring(0, 2).toUpperCase(); return '?'; };
  
  const rightColumnContent = ( 
    <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-4">
            <div className="flex items-center mb-3 px-2">
                <Clock size={16} className="text-amber-600 mr-2" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Upcoming Deadlines</h3>
            </div>
            <UpcomingDeadlines savedGrants={savedGrants} />
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-4"> 
            <div className="flex items-center mb-3 px-2">
                <Compass size={16} className="text-sky-600 mr-2" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Discover</h3> 
            </div>
            <div className="space-y-4"> 
                <div> 
                    <h4 className="font-semibold text-sm text-slate-600 mb-2 px-2">Recommended Funders</h4> 
                    {recommendedFunders.length > 0 ? ( 
                        recommendedFunders.map(funder => ( 
                            <Link to={`/funders/${funder.slug}`} key={funder.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50"> 
                                {funder.logo_url ? <img src={funder.logo_url} alt={`${funder.name} logo`} className="h-8 w-8 rounded-full object-contain border"/> : <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 items-center justify-center font-bold text-sm">{getInitials(funder.name)}</div>} 
                                <span className="text-sm font-medium text-slate-700">{funder.name}</span> 
                            </Link> 
                        )) 
                    ) : (
                        <div className="text-center py-4 px-2">
                            <Lightbulb size={24} className="mx-auto text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500">Save grants to get personalized funder recommendations.</p>
                        </div>
                    )} 
                </div> 
                <div className="border-t border-slate-200/80 pt-4"> 
                    <h4 className="font-semibold text-sm text-slate-600 mb-2 px-2">Trending Grants</h4> 
                    {trendingGrants.length > 0 ? ( 
                        trendingGrants.map(grant => (
                            <button 
                                key={grant.id} 
                                onClick={() => handleTrendingGrantClick(grant.id)}
                                className="w-full text-left block p-2 rounded-lg hover:bg-slate-50"
                            > 
                                <p className="text-sm font-medium text-slate-700 truncate">{grant.title}</p> 
                                <p className="text-xs text-slate-500">{grant.save_count} saves this week</p> 
                            </button> 
                        )) 
                    ) : (
                        <div className="text-center py-4 px-2">
                            <BarChart size={24} className="mx-auto text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500">No trending grants this week. Check back soon!</p>
                        </div>
                    )} 
                </div> 
            </div> 
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 font-sans text-slate-800 flex flex-col">
      <ProfileLayout 
        leftColumn={leftColumnContent}
        mainColumn={mainColumnContent}
        rightColumn={rightColumnContent}
      />
      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} />
      )}
    </div>
  );
}