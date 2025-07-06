// src/components/AdminClaimsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Check, X, Clock, User, Building2 } from 'lucide-react';

export default function AdminClaimsPage() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        setError('');
        
        // Fetch pending claims and join with profiles to get user names
        const { data, error: fetchError } = await supabase
            .from('claim_requests')
            .select(`
                id,
                created_at,
                organization_id,
                organization_type,
                status,
                profiles ( id, full_name )
            `) // MODIFIED: Removed 'email' from this line
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (fetchError) {
            setError(fetchError.message);
            console.error(fetchError);
        } else {
            // Fetch organization names for each claim
            const claimsWithOrgNames = await Promise.all(
                data.map(async (claim) => {
                    const fromTable = claim.organization_type === 'nonprofit' ? 'nonprofits' : 'funders';
                    const { data: orgData, error: orgError } = await supabase
                        .from(fromTable)
                        .select('name')
                        .eq('id', claim.organization_id)
                        .single();
                    
                    return {
                        ...claim,
                        organization_name: orgError ? 'Unknown' : orgData.name,
                    };
                })
            );
            setClaims(claimsWithOrgNames);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const handleApprove = async (claimId) => {
        const { error: rpcError } = await supabase.rpc('approve_claim_request', { request_id_param: claimId });
        if (rpcError) {
            alert(`Error: ${rpcError.message}`);
        } else {
            // Refresh list on success
            fetchClaims();
        }
    };

    const handleReject = async (claimId) => {
        const reason = prompt("Please provide a reason for rejection (optional):");
        const { error: rpcError } = await supabase.rpc('reject_claim_request', { 
            request_id_param: claimId,
            reviewer_notes_param: reason
        });

        if (rpcError) {
            alert(`Error: ${rpcError.message}`);
        } else {
            // Refresh list on success
            fetchClaims();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Admin: Claim Requests</h1>
                    <p className="text-slate-600 mt-1">Review and process pending organization claims.</p>
                </header>

                <main className="bg-white rounded-xl shadow-md border border-slate-200">
                    <div className="p-4 border-b border-slate-200">
                        <h2 className="font-semibold text-slate-700">Pending Requests ({claims.length})</h2>
                    </div>
                    {loading && <div className="p-6 text-center text-slate-500">Loading requests...</div>}
                    {error && <div className="p-6 text-center text-red-600">{error}</div>}
                    
                    {!loading && claims.length === 0 && (
                        <div className="p-6 text-center text-slate-500">
                            No pending requests. All clear! ✨
                        </div>
                    )}

                    {!loading && claims.length > 0 && (
                        <ul className="divide-y divide-slate-200">
                            {claims.map(claim => (
                                <li key={claim.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center text-sm font-semibold text-slate-800 mb-2">
                                            <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                                            <span>{claim.organization_name}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-500 mb-1">
                                            <User className="w-3 h-3 mr-2" />
                                            {/* MODIFIED: Removed email display since we are not fetching it */}
                                            <span>Claim by: {claim.profiles.full_name}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-500">
                                            <Clock className="w-3 h-3 mr-2" />
                                            <span>Requested on: {new Date(claim.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => handleReject(claim.id)}
                                            className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                                            title="Reject Claim"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(claim.id)}
                                            className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                                            title="Approve Claim"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
            </div>
        </div>
    );
}