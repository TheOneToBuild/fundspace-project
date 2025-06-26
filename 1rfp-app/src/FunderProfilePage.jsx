// src/FunderProfilePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Loader, ArrowLeft, ArrowRight, ExternalLink, MapPin, DollarSign, IconBriefcase, MessageSquare, ClipboardList, Users as SimilarIcon, ClipboardCheck, List, Award, Users, Tag, Lightbulb } from './components/Icons.jsx';
import { getPillClasses, getGrantTypePillClasses, formatDate, getFunderTypePillClasses } from './utils.js';
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import FunderCard from './components/FunderCard.jsx';

const FunderProfilePage = () => {
  const { funderSlug } = useParams();
  const navigate = useNavigate();
  const [funder, setFunder] = useState(null);
  const [allFunders, setAllFunders] = useState([]);
  const [funderGrants, setFunderGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  const openDetail = useCallback((grant) => {
    const fetchFullGrantData = async () => {
        const { data, error } = await supabase
            .from('grants')
            .select(`*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name))`)
            .eq('id', grant.id)
            .single();

        if (error) {
            console.error("Error fetching full grant details:", error);
            setSelectedGrant(grant);
        } else {
            const formattedGrant = {
                ...data,
                foundationName: data.funders?.name || 'Unknown Funder', 
                funderLogoUrl: data.funders?.logo_url || null,
                funderSlug: data.funders?.slug || null,
                fundingAmount: data.max_funding_amount || data.funding_amount_text || 'Not specified',
                dueDate: data.deadline,
                grantType: data.grant_type,
                eligibility_criteria: data.eligibility_criteria,
                categories: data.grant_categories.map(gc => gc.categories),
                locations: data.grant_locations.map(gl => gl.locations)
            };
            setSelectedGrant(formattedGrant);
        }
        setIsDetailModal(true);
    };
    fetchFullGrantData();
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedGrant(null);
    setIsDetailModal(false);
  }, []);
  
  const getInitials = (name) => {
      if (!name) return '?';
      const words = name.split(' ');
      if (words.length > 1) {
          return (words[0][0] + words[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const fetchFunderData = async () => {
      if (!funderSlug) return;
      setLoading(true);
      setError(null);
      
      try {
        // --- CORRECTED AND RE-STRUCTURED DATA FETCHING LOGIC ---

        // 1. First, get ONLY the main funder's ID. This is a fast query.
        const { data: funderIdData, error: funderIdError } = await supabase
            .from('funders')
            .select('id')
            .eq('slug', funderSlug)
            .single();

        if (funderIdError) throw funderIdError;
        const funderId = funderIdData.id;
        
        // 2. Now, run the three main queries in parallel.
        const [funderRes, allFundersRes, grantsRes] = await Promise.all([
            // Get the full details for the current funder using its ID
            supabase
              .from('funders')
              .select('*, funder_categories(categories(name)), funder_type:funder_type_id(name), funder_funding_locations(locations(id, name))')
              .eq('id', funderId)
              .single(),
            // Get all funders for the "similar" section
            supabase
              .from('funders')
              .select('*, funder_categories(categories(name)), funder_type:funder_type_id(name), funder_funding_locations(locations(id, name))'),
            // Get all grants specifically for this funder using its ID
            supabase
              .from('grants')
              .select(`*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name))`)
              .eq('funder_id', funderId)
              .order('deadline', { ascending: true, nullsFirst: false })
        ]);

        if (funderRes.error) throw funderRes.error;
        if (allFundersRes.error) console.warn("Could not fetch all funders:", allFundersRes.error.message);
        if (grantsRes.error) console.warn("Could not fetch grants for funder:", grantsRes.error.message);
        
        const funderData = funderRes.data;
        if (funderData) {
            funderData.focus_areas = funderData.funder_categories.map(fc => fc.categories.name);
            funderData.funding_locations = funderData.funder_funding_locations.map(ffl => ffl.locations.name);
        }
        setFunder(funderData);

        if (allFundersRes.data) {
             const formattedAllFunders = allFundersRes.data.map(f => ({ ...f, focus_areas: f.funder_categories.map(fc => fc.categories.name), funding_locations: f.funder_funding_locations.map(ffl => ffl.locations.name) }));
            setAllFunders(formattedAllFunders);
        }
        
        // Correctly format the grants data
        const formattedGrants = (grantsRes.data || []).map(grant => ({ ...grant, foundationName: grant.funders?.name || funderData.name, funderLogoUrl: grant.funders?.logo_url || funderData.logo_url, funderSlug: grant.funders?.slug || funderData.slug, fundingAmount: grant.max_funding_amount || grant.funding_amount_text || 'Not specified', dueDate: grant.deadline, grantType: grant.grant_type, eligibility_criteria: grant.eligibility_criteria, categories: grant.grant_categories.map(gc => gc.categories), locations: grant.grant_locations.map(gl => gl.locations) }));
        setFunderGrants(formattedGrants);

      } catch (err) {
        console.error('Error fetching funder data:', err);
        setError('Could not load funder profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchFunderData();
  }, [funderSlug]);
  
  const similarFunders = useMemo(() => {
    if (!funder || !allFunders.length) return [];
    return allFunders
      .filter(f => f.id !== funder.id)
      .map(otherFunder => ({ ...otherFunder, similarityScore: otherFunder.focus_areas.filter(area => funder.focus_areas.includes(area)).length }))
      .filter(f => f.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3);
  }, [funder, allFunders]);
  
  const handleSimilarFunderFilterClick = useCallback((key, value) => {
    navigate('/funders', { state: { prefilledFilter: { key, value } } });
  }, [navigate]);

  useEffect(() => {
    if (funder) document.title = `1RFP - ${funder.name}`;
  }, [funder]);

  if (loading) return ( <div className="text-center py-20"><Loader size={40} className="mx-auto text-green-400 mb-3 animate-spin" /><p>Loading Funder Profile...</p></div> );
  if (error || !funder) return ( <div className="text-center py-20"><p className="text-red-600">{error || "Funder not found."}</p><Link to="/funders" className="mt-4 inline-flex items-center text-blue-600 hover:underline"><ArrowLeft size={16} className="mr-1" />Back</Link></div> );

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-8xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link to="/funders" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              Back to All Funders
            </Link>
            <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Back to All Grants
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex-shrink-0">
                        {funder.logo_url ? (
                            <img src={funder.logo_url} alt={`${funder.name} logo`} className="h-24 w-24 rounded-full object-contain border border-slate-200 p-2" />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl border-4 border-blue-200">
                                {getInitials(funder.name)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-800">{funder.name}</h1>
                        {funder.funder_type?.name && (
                            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full mt-3 inline-block ${getFunderTypePillClasses(funder.funder_type.name)}`}>
                                {funder.funder_type.name}
                            </span>
                        )}
                    </div>
                </div>
              </section>

              <section>
                 <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6 flex items-center">
                    <Lightbulb size={20} className="mr-3 text-yellow-500" />
                    Funding Philosophy
                 </h4>
                 <div className="bg-white p-6 rounded-xl border border-slate-200 text-base text-slate-600 leading-relaxed">
                    {funder.description}
                 </div>
              </section>
              
              {funder.application_process_summary && (
                   <section>
                      <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6 flex items-center">
                        <ClipboardCheck size={20} className="mr-3 text-blue-500" />
                        Application Process
                      </h4>
                      <p className="text-slate-600 leading-relaxed bg-white p-6 rounded-xl border border-slate-200">{funder.application_process_summary}</p>
                   </section>
              )}
              {funder.key_personnel && funder.key_personnel.length > 0 && (
                  <section>
                    <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6 flex items-center">
                        <Users size={20} className="mr-3 text-indigo-500" />
                        Key Personnel
                    </h4>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">{funder.key_personnel.map((p, i) => (<div key={i} className="flex"><div className="font-semibold w-2/5">{p.name}</div><div className="text-slate-600 w-3/5">{p.title}</div></div>))}</div>
                  </section>
              )}
              {funder.past_grantees && (
                  <section>
                    <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6 flex items-center">
                        <Award size={20} className="mr-3 text-amber-500" />
                        Spotlight on Past Grantees
                    </h4>
                    <div className="bg-white border border-slate-200 p-6 rounded-xl"><p className="text-slate-600 leading-relaxed">{funder.past_grantees}</p></div>
                  </section>
              )}
              
              {funderGrants.length > 0 && (
                  <section>
                    <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6 flex items-center">
                        <List size={20} className="mr-3 text-green-500" />
                        Recently Listed Grants from {funder.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{funderGrants.map(g => (<GrantCard key={g.id} grant={g} onOpenDetailModal={openDetail} />))}</div>
                  </section>
              )}
              
              {similarFunders.length > 0 && (
                <section>
                    <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6 flex items-center">
                        <SimilarIcon size={20} className="mr-3 text-purple-500" />
                        Similar Foundations
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{similarFunders.map(sf => (<FunderCard key={sf.id} funder={sf} handleFilterChange={handleSimilarFunderFilterClick} />))}</div>
                </section>
              )}
            </div>

            <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-8 space-y-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                        <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">At a Glance</h4>
                        <div className="space-y-4 text-base">
                            <div className="flex items-start"><MapPin size={18} className="mr-3 mt-1 text-blue-500 flex-shrink-0" /><div><span className="font-semibold">Headquarters:</span> {funder.location || 'Not specified'}</div></div>
                            {funder.funding_locations && funder.funding_locations.length > 0 && (
                                <div className="flex items-start">
                                    <IconBriefcase size={18} className="mr-3 mt-1 text-purple-500 flex-shrink-0" />
                                    <div><span className="font-semibold">Geographic Scope:</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {funder.funding_locations.map(location => (
                                                <span key={location} className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getPillClasses(location)}`}>{location}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start"><DollarSign size={18} className="mr-3 mt-1 text-green-500 flex-shrink-0" /><div><span className="font-semibold">Annual Giving:</span> {funder.total_funding_annually || 'Not specified'}</div></div>
                            <div className="flex items-start"><MessageSquare size={18} className="mr-3 mt-1 text-orange-500 flex-shrink-0" /><div><span className="font-semibold">Avg. Grant Size:</span> {funder.average_grant_size || 'Not specified'}</div></div>
                            {funder.notable_grant && (<div className="flex items-start"><Award size={18} className="mr-3 mt-1 text-amber-500 flex-shrink-0" /><div><span className="font-semibold">Notable Grant:</span> {funder.notable_grant}</div></div>)}
                        </div>
                    </div>
                                        
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg space-y-6">
                        {funder.grant_types && funder.grant_types.length > 0 && (
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6">Grant Types Offered</h4>
                                <div className="flex flex-wrap gap-2">{funder.grant_types.map(type => (<span key={type} className={`text-sm font-medium px-3 py-1.5 rounded-full border ${getGrantTypePillClasses(type)}`}>{type}</span>))}</div>
                            </div>
                        )}
                        {funder.focus_areas && funder.focus_areas.length > 0 && (
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-6 flex items-center">
                                    <Tag size={18} className="mr-3 text-pink-500" />
                                    Focus Areas
                                </h4>
                                <div className="flex flex-wrap gap-2">{funder.focus_areas.map(a => (<span key={a} className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getPillClasses(a)}`}>{a}</span>))}</div>
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                        <a href={funder.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 border rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700">Visit Official Website <ExternalLink size={16} className="ml-2" /></a>
                    </div>
                </div>
            </div>
            
          </div>
        </div>
      </div>
      {isDetailModalOpen && selectedGrant && (<GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} />)}
    </>
  );
};

export default FunderProfilePage;