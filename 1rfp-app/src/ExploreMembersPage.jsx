// src/ExploreMembersPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
// REMOVED: The incorrect import for AppLayout

// A simple card component for each member
const MemberCard = ({ member }) => {
    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '?';

    return (
        <Link to={`/members/${member.id}`} className="block bg-white p-5 rounded-xl border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-xl">
                    {getInitials(member.full_name)}
                </div>
                <div>
                    <p className="font-bold text-lg text-slate-800">{member.full_name}</p>
                    <p className="text-sm text-slate-500">{member.organization_name || member.role}</p>
                </div>
            </div>
        </Link>
    );
};

export default function ExploreMembersPage() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            }
        };
        checkSession();
    }, [navigate]);
    
    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('search_profiles', {
                search_term: searchTerm,
                filter_role: roleFilter
            });
            
            if (error) {
                console.error('Error searching profiles:', error);
            } else {
                setMembers(data);
            }
            setLoading(false);
        };

        const timer = setTimeout(() => {
            fetchMembers();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter]);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900">Meet the Community</h1>
                    <p className="mt-4 text-lg text-slate-600">Discover and connect with funders and nonprofits across the Bay Area.</p>
                </div>

                {/* Search and Filter Controls */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or organization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="md:col-span-2 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        <option value="Nonprofit">Nonprofits</option>
                        <option value="Funder">Funders</option>
                        <option value="Community member">Community Members</option>
                    </select>
                </div>

                {/* Members Grid */}
                {loading ? (
                    <p className="text-center text-slate-500 py-16">Loading members...</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {members.map(member => (
                                <MemberCard key={member.id} member={member} />
                            ))}
                        </div>
                        { !loading && members.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-slate-500">No members found. Try adjusting your search.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}