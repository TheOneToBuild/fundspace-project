import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Building2, CheckCircle, PlusCircle, Users, Shield } from 'lucide-react';
import CreateOrganizationModal from './CreateOrganizationModal.jsx';

// EDITED: Now accepts onJoinSuccess as a prop
export default function EnhancedOrganizationSetupPage({ onJoinSuccess }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (!query) {
                setResults([]);
                return;
            }
            setLoading(true);
            setError('');
            
            const [nonprofitRes, funderRes] = await Promise.all([
                supabase.from('nonprofits').select('id, name, admin_profile_id').ilike('name', `%${query}%`).limit(5),
                supabase.from('funders').select('id, name, admin_profile_id').ilike('name', `%${query}%`).limit(5)
            ]);

            if (nonprofitRes.error || funderRes.error) {
                setError('Failed to fetch organizations.');
            } else {
                const nonprofits = nonprofitRes.data.map(item => ({ ...item, type: 'nonprofit' }));
                const funders = funderRes.data.map(item => ({ ...item, type: 'funder' }));
                setResults([...nonprofits, ...funders]);
            }
            
            setLoading(false);
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);
  
    const handleClaim = async (orgId, orgType) => {
        setMessage('');
        setError('');
        
        const { error: rpcError } = await supabase.rpc('request_claim_organization', {
            organization_id_param: orgId,
            organization_type_param: orgType
        });

        if (rpcError) {
            setError(`Error: ${rpcError.message}`);
        } else {
            setMessage('Claim request submitted successfully! An admin will review it shortly.');
            setResults(currentResults => 
                currentResults.map(r => r.id === orgId && r.type === orgType ? { ...r, claimRequested: true } : r)
            );
        }
    };

    const handleJoin = async (orgId, orgType) => {
        setMessage('');
        setError('');
        
        const { error: joinError } = await supabase.rpc('join_organization', {
            organization_id_param: orgId,
            organization_type_param: orgType
        });

        if (joinError) {
            setError(`Error joining organization: ${joinError.message}`);
        } else {
            // EDITED: Call the success callback to trigger a soft refresh
            if (onJoinSuccess) {
                onJoinSuccess();
            }
        }
    };
    
    return (
        <>
            <CreateOrganizationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    if (onJoinSuccess) onJoinSuccess();
                }}
            />

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
                 <h1 className="text-2xl font-bold text-slate-800">Join or Claim Your Organization</h1>
                <p className="mt-2 text-slate-600">
                    Search for your organization to join as a member or claim admin access. If you can't find it, you can create a new profile.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center mb-2">
                            <Users className="w-5 h-5 text-blue-600 mr-2" />
                            <h3 className="font-semibold text-blue-800">Join as Member</h3>
                        </div>
                        <p className="text-sm text-blue-700">
                            Join your organization to connect with colleagues and be listed as a team member. No admin permissions.
                        </p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center mb-2">
                            <Shield className="w-5 h-5 text-green-600 mr-2" />
                            <h3 className="font-semibold text-green-800">Claim as Admin</h3>
                        </div>
                        <p className="text-sm text-green-700">
                            Claim admin access to manage your organization's profile, edit details, and approve members. Requires approval.
                        </p>
                    </div>
                </div>

                {message && <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg">{message}</div>}
                {error && <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">{error}</div>}

                <div className="mt-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for your nonprofit or foundation..."
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                        autoComplete="off"
                    />
                </div>

                <div className="mt-4 min-h-[200px]">
                    {loading && <div className="text-center text-slate-500 py-4">Searching...</div>}
                    
                    {!loading && results.length > 0 && (
                        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                            {results.map(org => (
                                <div key={`${org.type}-${org.id}`} className="flex items-center justify-between p-4">
                                    <div className="flex items-center">
                                        <Building2 className="text-slate-500 mr-3 w-5 h-5"/>
                                        <div>
                                            <span className="font-medium text-slate-700">{org.name}</span>
                                            <span className="text-xs text-slate-400 ml-2 capitalize">({org.type})</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {org.admin_profile_id ? (
                                            <>
                                                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                                                    <CheckCircle className="mr-1.5 w-4 h-4" />
                                                    Has Admin
                                                </span>
                                                <button onClick={() => handleJoin(org.id, org.type)} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                                                    <Users className="w-4 h-4 mr-1 inline" /> Join
                                                </button>
                                            </>
                                        ) : org.claimRequested ? (
                                            <>
                                                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full">Claim Pending</span>
                                                <button onClick={() => handleJoin(org.id, org.type)} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                                                    <Users className="w-4 h-4 mr-1 inline" /> Join
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleJoin(org.id, org.type)} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                                                    <Users className="w-4 h-4 mr-1 inline" /> Join
                                                </button>
                                                <button onClick={() => handleClaim(org.id, org.type)} className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow-sm transition-colors">
                                                    <Shield className="w-4 h-4 mr-1 inline" /> Claim
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && searchQuery.length > 0 && results.length === 0 && (
                        <div className="text-center py-8 bg-slate-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-slate-700">No Match Found</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto">No organizations were found matching your search. You can create a new profile for your organization.</p>
                            <button onClick={() => setIsModalOpen(true)} className="mt-4 inline-flex items-center px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 shadow-sm transition-colors">
                                <PlusCircle className="w-5 h-5 mr-2"/>
                                Create New Organization Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}