// src/components/GlobalSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Loader, Building, User, FileText } from 'lucide-react';

const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1 && words[0] && words[1]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const SearchResultItem = ({ item, onClick }) => {
    const navigate = useNavigate();

    const handleClick = (e) => {
        e.preventDefault();
        
        // Navigate based on item type
        if (item.type === 'organization') {
            navigate(`/organizations/${item.slug}`);
        } else if (item.type === 'member' || item.type === 'user') {
            navigate(`/profile/members/${item.id}`);
        } else if (item.type === 'grant') {
            // Navigate to grants with specific grant opened
            navigate(`/profile/grants-portal?open_grant=${item.id}`);
        }
        
        onClick();
    };

    const renderIconOrAvatar = () => {
        // Display logo/avatar image if available
        const imageUrl = item.avatar_url || item.image_url;
        
        if (imageUrl) {
            return (
                <img 
                    src={imageUrl} 
                    alt={`${item.name}`} 
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            );
        }

        // Fallback based on type
        switch (item.type) {
            case 'organization':
                return (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building size={16} className="text-blue-600" />
                    </div>
                );
            case 'member':
            case 'user':
                return (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-700">
                        {getInitials(item.name)}
                    </div>
                );
            case 'grant':
                return (
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText size={16} className="text-purple-600" />
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                        <User size={16} className="text-slate-500" />
                    </div>
                );
        }
    };

    const getSubtitle = () => {
        switch (item.type) {
            case 'organization':
                const orgDetails = [];
                if (item.type_display) orgDetails.push(item.type_display);
                if (item.location) orgDetails.push(item.location);
                return orgDetails.length > 0 ? orgDetails.join(' · ') : null;
            case 'member':
            case 'user':
                const userDetails = [];
                if (item.title) userDetails.push(item.title);
                if (item.organization_name) userDetails.push(item.organization_name);
                return userDetails.length > 0 ? userDetails.join(' · ') : null;
            case 'grant':
                const grantDetails = [];
                if (item.foundation_name) grantDetails.push(item.foundation_name);
                if (item.funding_amount_text) grantDetails.push(item.funding_amount_text);
                return grantDetails.length > 0 ? grantDetails.join(' · ') : 'Grant Opportunity';
            default:
                return null;
        }
    };

    const getTypeLabel = () => {
        switch (item.type) {
            case 'organization':
                return 'Organization';
            case 'member':
            case 'user':
                return 'Member';
            case 'grant':
                return 'Grant';
            default:
                return '';
        }
    };

    return (
        <button
            onClick={handleClick}
            className="w-full flex items-center p-3 hover:bg-slate-50 rounded-lg transition-colors text-left"
        >
            <div className="flex-shrink-0 mr-3 relative">
                {renderIconOrAvatar()}
                {/* Hidden fallback for failed image loads */}
                <div className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center text-xs font-semibold text-slate-600 absolute top-0 left-0" style={{ display: 'none' }}>
                    {getInitials(item.name)}
                </div>
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 truncate">{item.name}</p>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {getTypeLabel()}
                    </span>
                </div>
                {getSubtitle() && (
                    <p className="text-sm text-slate-500 truncate">{getSubtitle()}</p>
                )}
            </div>
        </button>
    );
};

export default function GlobalSearch({ mobile = false }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (query.length > 2) {
                setIsLoading(true);
                try {
                    // Use the existing search_all function if it exists, otherwise do manual search
                    const { data: searchData, error: searchError } = await supabase.rpc('search_all', { 
                        search_term: query 
                    });
                    
                    if (searchError) {
                        console.warn('search_all function not available, falling back to manual search');
                        // Fallback to manual search
                        await performManualSearch(query);
                    } else {
                        setResults(searchData || []);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    // Try manual search as fallback
                    await performManualSearch(query);
                }
                setIsLoading(false);
            } else {
                setResults([]);
            }
        }, 300); // Debounce search

        return () => clearTimeout(handler);
    }, [query]);

    const performManualSearch = async (searchTerm) => {
        try {
            const searchPattern = `%${searchTerm}%`;
            const allResults = [];

            // Search organizations
            const { data: organizations, error: orgError } = await supabase
                .from('organizations')
                .select('id, name, type, tagline, image_url, location, slug')
                .or(`name.ilike.${searchPattern},tagline.ilike.${searchPattern}`)
                .limit(5);

            if (!orgError && organizations) {
                const orgResults = organizations.map(org => ({
                    id: org.id,
                    name: org.name,
                    type: 'organization',
                    image_url: org.image_url,
                    location: org.location,
                    type_display: org.type,
                    slug: org.slug
                }));
                allResults.push(...orgResults);
            }

            // Search users/profiles
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, title, organization_name, avatar_url')
                .or(`full_name.ilike.${searchPattern},title.ilike.${searchPattern},organization_name.ilike.${searchPattern}`)
                .limit(5);

            if (!profileError && profiles) {
                const userResults = profiles.map(profile => ({
                    id: profile.id,
                    name: profile.full_name,
                    type: 'member',
                    avatar_url: profile.avatar_url,
                    title: profile.title,
                    organization_name: profile.organization_name
                }));
                allResults.push(...userResults);
            }

            // Search grants
            const { data: grants, error: grantError } = await supabase
                .from('grant_opportunities')
                .select('id, title, foundation_name, funding_amount_text, description')
                .or(`title.ilike.${searchPattern},foundation_name.ilike.${searchPattern},description.ilike.${searchPattern}`)
                .limit(5);

            if (!grantError && grants) {
                const grantResults = grants.map(grant => ({
                    id: grant.id,
                    name: grant.title,
                    type: 'grant',
                    foundation_name: grant.foundation_name,
                    funding_amount_text: grant.funding_amount_text
                }));
                allResults.push(...grantResults);
            }

            setResults(allResults);
        } catch (error) {
            console.error('Manual search error:', error);
            setResults([]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleResultClick = () => {
        setQuery('');
        setResults([]);
        setIsFocused(false);
    };

    // Updated styling - make it responsive and full width with rounded corners
    const inputClass = mobile
        ? "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors"
        : "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors";

    return (
        <div className="relative w-full" ref={searchRef}>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input
                type="text"
                placeholder="Search grants, organizations, members..."
                className={inputClass}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
            />
            {isLoading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}

            {isFocused && query.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center p-4 text-slate-500">
                            <Loader className="animate-spin mx-auto mb-2" size={20} />
                            Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="p-2">
                            {results.map((item, index) => (
                                <SearchResultItem 
                                    key={`${item.type}-${item.id}-${index}`} 
                                    item={item} 
                                    onClick={handleResultClick} 
                                />
                            ))}
                        </div>
                    ) : (
                        query.length > 2 && (
                            <div className="text-center p-4 text-slate-500">
                                No results found for "{query}"
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}