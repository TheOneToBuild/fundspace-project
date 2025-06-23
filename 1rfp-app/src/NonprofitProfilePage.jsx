// src/NonprofitProfilePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Loader, ArrowLeft, ArrowRight, ExternalLink, MapPin, DollarSign, Users, Calendar, Award, Users as SimilarIcon, Tag, Heart } from './components/Icons.jsx';
import { getPillClasses } from './utils.js';
import NonprofitCard from './components/NonprofitCard.jsx';

const NonprofitProfilePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [nonprofit, setNonprofit] = useState(null);
  const [allNonprofits, setAllNonprofits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNonprofitData = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      
      try {
        const [nonprofitRes, allNonprofitsRes] = await Promise.all([
          supabase
            .from('nonprofits')
            .select('*, nonprofit_categories(categories(name))')
            .eq('slug', slug)
            .single(),
          supabase
            .from('nonprofits')
            .select('*, nonprofit_categories(categories(name))')
        ]);

        if (nonprofitRes.error) throw nonprofitRes.error;
        if (allNonprofitsRes.error) console.warn("Could not fetch all nonprofits for similarity check:", allNonprofitsRes.error.message);

        const nonprofitData = nonprofitRes.data;
        if (nonprofitData) {
            nonprofitData.focusAreas = nonprofitData.nonprofit_categories.map(npc => npc.categories.name);
        }
        setNonprofit(nonprofitData);

        if (allNonprofitsRes.data) {
             const formattedAllNonprofits = allNonprofitsRes.data.map(np => ({
                ...np,
                focusAreas: np.nonprofit_categories.map(npc => npc.categories.name)
            }));
            setAllNonprofits(formattedAllNonprofits);
        }

      } catch (err) {
        console.error('Error fetching nonprofit data:', err);
        setError('Could not load nonprofit profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchNonprofitData();
  }, [slug]);
  
  const similarNonprofits = useMemo(() => {
    if (!nonprofit || !allNonprofits.length) return [];
    return allNonprofits
      .filter(np => np.id !== nonprofit.id)
      .map(otherNp => ({
        ...otherNp,
        similarityScore: (otherNp.focusAreas || []).filter(area => (nonprofit.focusAreas || []).includes(area)).length
      }))
      .filter(np => np.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3);
  }, [nonprofit, allNonprofits]);
  
  const handleSimilarNonprofitFilterClick = useCallback((key, value) => {
    navigate('/nonprofits', { state: { prefilledFilter: { key, value } } });
  }, [navigate]);

  useEffect(() => {
    if (nonprofit) document.title = `1RFP - ${nonprofit.name}`;
  }, [nonprofit]);

  if (loading) return ( <div className="text-center py-20"><Loader size={40} className="mx-auto text-purple-400 mb-3 animate-spin" /><p>Loading Nonprofit Profile...</p></div> );
  if (error || !nonprofit) return ( <div className="text-center py-20"><p className="text-red-600">{error || "Nonprofit not found."}</p><Link to="/nonprofits" className="mt-4 inline-flex items-center text-blue-600 hover:underline"><ArrowLeft size={16} className="mr-1" />Back</Link></div> );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-8xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link to="/nonprofits" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to All Nonprofits
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="flex-shrink-0 w-full sm:w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                  {nonprofit.imageUrl ? (
                      <img src={nonprofit.imageUrl} alt={`${nonprofit.name} cover image`} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                      <Heart size={48} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-800">{nonprofit.name}</h1>
                  {nonprofit.tagline && <p className="text-lg text-slate-500 mt-2 italic">{nonprofit.tagline}</p>}
                </div>
              </div>
            </section>

            <section>
               <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-600">About the Organization</h4>
               <div className="bg-white p-6 rounded-xl border border-slate-200 text-base text-slate-600 leading-relaxed">
                  {nonprofit.description}
               </div>
            </section>
            
            {similarNonprofits.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold uppercase tracking-wider flex items-center mb-4 text-slate-600">
                    <SimilarIcon size={16} className="mr-2 opacity-70" />
                    Similar Nonprofits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similarNonprofits.map(np => (
                    <NonprofitCard key={np.id} nonprofit={np} handleFilterChange={handleSimilarNonprofitFilterClick} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-slate-600">At a Glance</h4>
                <div className="space-y-4 text-base">
                  <div className="flex items-start"><MapPin size={18} className="mr-3 mt-1 text-blue-500 flex-shrink-0" /><div><span className="font-semibold">Location:</span> {nonprofit.location || 'Not specified'}</div></div>
                  <div className="flex items-start"><DollarSign size={18} className="mr-3 mt-1 text-green-500 flex-shrink-0" /><div><span className="font-semibold">Annual Budget:</span> {nonprofit.budget || 'Not specified'}</div></div>
                  <div className="flex items-start"><Users size={18} className="mr-3 mt-1 text-indigo-500 flex-shrink-0" /><div><span className="font-semibold">Staff Count:</span> {nonprofit.staff_count || 'Not specified'}</div></div>
                  <div className="flex items-start"><Calendar size={18} className="mr-3 mt-1 text-teal-500 flex-shrink-0" /><div><span className="font-semibold">Year Founded:</span> {nonprofit.year_founded || 'Not specified'}</div></div>
                  {nonprofit.impact_metric && <div className="flex items-start"><Award size={18} className="mr-3 mt-1 text-amber-500 flex-shrink-0" /><div><span className="font-semibold">Key Impact:</span> {nonprofit.impact_metric}</div></div>}
                </div>
              </div>
              
              {nonprofit.focusAreas && nonprofit.focusAreas.length > 0 && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                    <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-600"><Tag size={14} className="inline mr-2" />Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">{nonprofit.focusAreas.map(a => (<span key={a} className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getPillClasses(a)}`}>{a}</span>))}</div>
                  </div>
              )}

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                <a href={nonprofit.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 border rounded-lg shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700">
                  Visit Official Website <ExternalLink size={16} className="ml-2" />
                </a>
              </div>
            </div>
          </div>
          
        </div> {/* --- THIS WAS THE MISSING CLOSING TAG --- */}
        
      </div>
    </div>
  );
};

export default NonprofitProfilePage;