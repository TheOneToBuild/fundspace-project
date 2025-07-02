// src/MemberProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function MemberProfilePage() {
    const { profileId } = useParams(); // Get the ID from the URL
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Effect for checking authentication
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            }
        };
        checkSession();
    }, [navigate]);

    // Effect for fetching the specific profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!profileId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();
            
            if (error) {
                console.error('Error fetching profile:', error);
                setProfile(null);
            } else {
                setProfile(data);
            }
            
            setLoading(false);
        };
        fetchProfile();
    }, [profileId]);

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p>Loading profile...</p></div>;
    }
    
    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <p className="text-xl text-slate-600 mb-4">Profile not found.</p>
                <Link to="/members" className="text-blue-600 hover:underline">
                    &larr; Back to Member Directory
                </Link>
            </div>
        );
    }
    
    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '?';

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="container mx-auto max-w-4xl py-12">
                <div className="mb-8">
                    <Link to="/members" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                        &larr; Back to Member Directory
                    </Link>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-28 h-28 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-5xl mb-4 ring-4 ring-blue-200">
                            {getInitials(profile.full_name)}
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">{profile.full_name}</h1>
                        <p className="text-lg text-slate-500 mt-1">{profile.role}</p>
                        
                        {profile.organization_name && (
                             <p className="text-xl font-semibold text-slate-700 mt-4">{profile.organization_name}</p>
                        )}
                        {profile.title && (
                             <p className="text-md text-slate-500">{profile.title}</p>
                        )}
                    </div>
                    {/* We can add more sections here later, like a bio, associated grants, etc. */}
                </div>
            </div>
        </div>
    );
}