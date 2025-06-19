// src/FunderProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Loader, ArrowLeft, ExternalLink, MapPin, DollarSign, IconBriefcase, MessageSquare, ClipboardList, Users, ClipboardCheck, List, Award } from './components/Icons.jsx';
import { getPillClasses, formatDate, getGrantTypePillClasses } from './utils.js';
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';

const FunderProfilePage = () => {
  const { funderSlug } = useParams();
  const [funder, setFunder] = useState(null);
  const [funderGrants, setFunderGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  const openDetail = useCallback((grant) => {
    setSelectedGrant(grant);
    setIsDetailModal(true);
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
    const fetchFunder = async () => {
      if (!funderSlug) return;
      setLoading(true);
      setError(null);
      setFunderGrants([]);
      try {
        const { data, error } = await supabase.from('funders').select('*').eq('slug', funderSlug).single();
        if (error) throw error;
        setFunder(data);
      } catch (err) {
        console.error('Error fetching funder profile:', err);
        setError('Could not load funder profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchFunder();
  }, [funderSlug]);
  
  useEffect(() => {
    const fetchFunderGrants = async () => {
        if (!funder || !funder.name) return;
        try {
            const { data, error } = await supabase.from('grants').select('*').eq('foundation_name', funder.name).order('due_date', { ascending: true });
            if (error) throw error;
            const formattedGrants = (data || []).map(grant => ({
                ...grant,
                foundationName: grant.foundation_name,
                fundingAmount: grant.funding_amount_text,
                dueDate: grant.due_date,
                dateAdded: grant.date_added,
                grantType: grant.grant_type,
                startDate: grant.start_date,
            }));
            setFunderGrants(formattedGrants);
        } catch (err) {
            console.error('Error fetching grants for funder:', err);
        }
    };
    fetchFunderGrants();
  }, [funder]);

  useEffect(() => {
    if (funder) document.title = `1RFP - ${funder.name}`;
  }, [funder]);

  if (loading) return ( <div className="text-center py-20"><Loader size={40} className="mx-auto text-green-400 mb-3 animate-spin" /><p>Loading Funder Profile...</p></div> );
  if (error || !funder) return ( <div className="text-center py-20"><p className="text-red-600">{error || "Funder not found."}</p><Link to="/funders" className="mt-4 inline-flex items-center text-blue-600 hover:underline"><ArrowLeft size={16} className="mr-1" />Back</Link></div> );

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link to="/funders" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              Back to All Funders
            </Link>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg divide-y divide-slate-200">
            <div className="flex items-start gap-6 mb-6 pb-6">
                <div className="flex-shrink-0">
                    {funder.logo_url ? (
                        <img src={funder.logo_url} alt={`${funder.name} logo`} className="h-24 w-24 rounded-full object-contain border border-slate-200 p-2" />
                    ) : (
                        <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl border-4 border-blue-200">
                            {getInitials(funder.name)}
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-800">{funder.name}</h1>
                    {funder.funder_type && (
                        <span className="text-sm font-semibold bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full mt-2 inline-block">
                            {funder.funder_type}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="py-6">
                <p className="text-base text-slate-600 mb-6 leading-relaxed">
                    <span className="font-semibold text-slate-700">Funding Philosophy: </span>
                    {funder.description}
                </p>
                <div className="space-y-4 text-base">
                    <div className="flex items-start"><MapPin size={18} className="mr-3 mt-1 text-blue-500 flex-shrink-0" /><div><span className="font-semibold">Geographic Scope:</span> {funder.location}</div></div>
                    <div className="flex items-start"><DollarSign size={18} className="mr-3 mt-1 text-green-500 flex-shrink-0" /><div><span className="font-semibold">Annual Giving:</span> {funder.total_funding_annually || 'Not specified'}</div></div>
                    <div className="flex items-start"><MessageSquare size={18} className="mr-3 mt-1 text-orange-500 flex-shrink-0" /><div><span className="font-semibold">Avg. Grant Size:</span> {funder.average_grant_size || 'Not specified'}</div></div>
                    {funder.notable_grant && (
                        <div className="flex items-start"><Award size={18} className="mr-3 mt-1 text-amber-500 flex-shrink-0" /><div><span className="font-semibold">Notable Grant:</span> {funder.notable_grant}</div></div>
                    )}
                </div>
            </div>
            
            {funder.grant_types && funder.grant_types.length > 0 && (
                <div className="py-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">Grant Types Offered</h4>
                    <div className="flex flex-wrap gap-2">
                        {funder.grant_types.map(type => (
                             <span key={type} className={`text-sm font-medium px-3 py-1.5 rounded-full border ${getGrantTypePillClasses(type)}`}>
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
            {funder.application_process_summary && (
                 <div className="py-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider flex items-center mb-3"><ClipboardCheck size={16} className="mr-2 opacity-70" />Application Process</h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-md border">{funder.application_process_summary}</p>
                 </div>
            )}
            
            {funder.focus_areas && funder.focus_areas.length > 0 && (
                <div className="py-6"><h4 className="text-sm font-semibold uppercase tracking-wider mb-3">Focus Areas</h4><div className="flex flex-wrap gap-2">{funder.focus_areas.map(a => (<span key={a} className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getPillClasses(a)}`}>{a}</span>))}</div></div>
            )}

            {funder.key_personnel && funder.key_personnel.length > 0 && (
                <div className="py-6"><h4 className="text-sm font-semibold uppercase tracking-wider flex items-center mb-4"><Users size={16} className="mr-2 opacity-70" />Key Personnel</h4><div className="space-y-3">{funder.key_personnel.map((p, i) => (<div key={i} className="flex"><div className="font-semibold w-2/5">{p.name}</div><div className="text-slate-600 w-3/5">{p.title}</div></div>))}</div></div>
            )}

            {funder.past_grantees && funder.past_grantees.length > 0 && (
                <div className="py-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider flex items-center mb-4">
                        <Award size={16} className="mr-2 opacity-70" />
                        Spotlight on Past Grantees
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {funder.past_grantees.map((grantee, index) => (
                            <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                <p className="font-semibold text-slate-800">{grantee.name}</p>
                                {grantee.description && <p className="text-sm text-slate-600 mt-1">{grantee.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {funderGrants.length > 0 && (
                <div className="py-6"><h4 className="text-sm font-semibold uppercase tracking-wider flex items-center mb-4"><List size={16} className="mr-2 opacity-70" />Recently Listed Grants</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">{funderGrants.map(g => (<GrantCard key={g.id} grant={g} onOpenDetailModal={openDetail} />))}</div></div>
            )}

             <div className="pt-8"><a href={funder.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full md:w-auto px-6 py-3 border rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700">Visit Official Website <ExternalLink size={16} className="ml-2" /></a></div>
          </div>
        </div>
      </div>
      {isDetailModalOpen && selectedGrant && (<GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} />)}
    </>
  );
};

export default FunderProfilePage;