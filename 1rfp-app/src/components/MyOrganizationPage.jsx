import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Shield, MapPin, Globe, Building2, Edit, AlertTriangle, LogOut } from 'lucide-react';
import Avatar from './Avatar.jsx';
import EnhancedOrganizationSetupPage from './OrganizationSetupPage.jsx';

export default function MyOrganizationPage() {
    const { profile, session } = useOutletContext();
    
    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userMembership, setUserMembership] = useState(null);
    const [isConfirmingLeave, setConfirmingLeave] = useState(false);

    const checkMembership = useCallback(async () => {
        setConfirmingLeave(false); 

        if (!session?.user?.id || !profile) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        if (profile.managed_nonprofit_id || profile.managed_funder_id) {
            setUserMembership({ role: 'admin', organization_id: profile.managed_nonprofit_id || profile.managed_funder_id, organization_type: profile.managed_nonprofit_id ? 'nonprofit' : 'funder' });
        } else {
            const { data: memberships } = await supabase.from('organization_memberships').select('*').eq('profile_id', profile.id).limit(1);
            if (memberships && memberships.length > 0) {
                setUserMembership(memberships[0]);
            } else {
                setUserMembership(null);
                setOrganization(null);
                setMembers([]);
            }
        }
    }, [profile, session]);

    useEffect(() => {
        checkMembership();
    }, [checkMembership]);

    const fetchOrganizationData = useCallback(async () => {
        if (!userMembership) {
            setLoading(false);
            return;
        }
        
        try {
            const orgTable = userMembership.organization_type === 'nonprofit' ? 'nonprofits' : 'funders';
            const { data: orgData, error: orgError } = await supabase.from(orgTable).select('*').eq('id', userMembership.organization_id).single();
            if (orgError) throw orgError;
            setOrganization(orgData);

            const { data: membersData, error: membersError } = await supabase.rpc('get_organization_members', {
                organization_id_param: userMembership.organization_id,
                organization_type_param: userMembership.organization_type
            });
            if (membersError) throw membersError;
            setMembers(membersData || []);

        } catch (err) {
            console.error('Error fetching organization data:', err);
            setError('Failed to load organization data.');
        } finally {
            setLoading(false);
        }
    }, [userMembership]);

    useEffect(() => {
        fetchOrganizationData();
    }, [fetchOrganizationData]);

    const executeLeave = async () => {
        if (!userMembership || userMembership.role === 'admin') return;

        const { error: deleteError } = await supabase
            .from('organization_memberships')
            .delete()
            .eq('profile_id', session.user.id);

        if (deleteError) {
            setError('Error leaving organization: ' + deleteError.message);
            setConfirmingLeave(false);
        } else {
            checkMembership();
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-slate-500">Loading...</div>;
    }

    if (!userMembership) {
        return <EnhancedOrganizationSetupPage onJoinSuccess={checkMembership} />;
    }
    
    if (!organization) {
        return <div className="p-6 text-center text-slate-500">Loading organization details...</div>;
    }
    
    const isAdmin = userMembership.role === 'admin';

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <Avatar src={organization.logo_url} fullName={organization.name} size="lg" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{organization.name}</h1>
                            <p className="text-slate-600 mt-1">{organization.tagline}</p>
                            <div className="flex items-center mt-2 text-sm text-slate-500">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isAdmin ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {isAdmin ? <Shield className="w-3 h-3 mr-1.5" /> : <Users className="w-3 h-3 mr-1.5" />}
                                    {isAdmin ? 'Admin' : 'Member'}
                                </span>
                                {organization.location && <span className="ml-4 flex items-center"><MapPin className="w-4 h-4 mr-1.5" />{organization.location}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        {organization.slug && (
                            <Link to={`/${userMembership.organization_type === 'nonprofit' ? 'nonprofits' : 'funders'}/${organization.slug}`} target="_blank" className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                                <Globe className="w-4 h-4 mr-2" /> View Public Profile
                            </Link>
                        )}
                        
                        {isAdmin ? (
                            <Link to="/profile/my-organization/edit" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                                <Edit className="w-4 h-4 mr-2" /> Edit Organization
                            </Link>
                        ) : isConfirmingLeave ? (
                            <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                <span className="text-sm font-medium text-red-800">Are you sure?</span>
                                <button onClick={executeLeave} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700">
                                    Yes, Leave
                                </button>
                                <button onClick={() => setConfirmingLeave(false)} className="px-3 py-1 bg-white text-slate-700 text-xs font-bold rounded-md border border-slate-300 hover:bg-slate-100">
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmingLeave(true)} className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                                <LogOut className="w-4 h-4 mr-2"/>
                                Leave Organization
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION ORDER EDITED --- */}

            {/* "About Us" section moved here */}
            {organization.description && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">About Us</h2>
                    <p className="text-slate-600 leading-relaxed">{organization.description}</p>
                    {organization.website && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <a href={organization.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                                <Globe className="w-4 h-4 mr-2" /> Visit Website
                            </a>
                        </div>
                    )}
                </div>
            )}
            
            {/* "Team Members" section moved here */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" /> Team Members ({members.length})
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                        <Link to={`/profile/members/${member.id}`} key={member.id} className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 mr-3">
                                    <Avatar src={member.avatar_url} fullName={member.full_name} size="md" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900 truncate">{member.full_name || 'Anonymous User'}</p>
                                    <p className="text-sm text-slate-500 truncate">{member.title || 'Team Member'}</p>
                                    <div className="flex items-center mt-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${member.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {member.role === 'admin' ? 'Admin' : 'Member'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}