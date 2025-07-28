// src/components/GlobalSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Building, FileText, User, Loader } from './Icons'; // Assuming you have a Loader icon

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
    if (item.type === 'grant') {
        navigate(`/profile/grants?open_grant=${item.id}`);
    } else if (item.type === 'organization') {
        navigate(`/organizations/${item.slug}`);
    } else {
        // For users, navigate to members profile page
        navigate(`/profile/members/${item.id}`);
    }
    onClick(); // This closes the search dropdown
};

    const renderIconOrAvatar = () => {
        // If an avatar/logo URL exists, display the image
        if (item.avatar_url) {
            return (
                <img 
                    src={item.avatar_url} 
                    alt={`${item.name} logo`} 
                    className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-md"
                />
            );
        }
        // For users/orgs without an image, show initials
        if (item.type === 'user' || item.type === 'organization') {
             return (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center font-semibold text-blue-700 text-xs">
                    {getInitials(item.name)}
                </div>
            );
        }
        // Fallback icon for grants
        return <FileText className="h-6 w-6 text-slate-500" />;
    };
    
    const getSubtitle = () => {
        const details = [item.organization_type, item.location].filter(Boolean);
        switch (item.type) {
            case 'organization':
            case 'user':
                return details.length > 0 ? details.join(' · ') : null;
            case 'grant':
                return 'Grant Opportunity';
            default:
                return null;
        }
    }

    return (
        <a 
            href="#"
            onClick={handleClick}
            className="flex items-center p-3 hover:bg-slate-100 rounded-lg transition-colors w-full"
        >
            <div className="flex-shrink-0 mr-4 w-8 h-8 flex items-center justify-center">{renderIconOrAvatar()}</div>
            <div className='flex-grow min-w-0'>
                <p className="font-medium text-slate-800 truncate">{item.name}</p>
                {getSubtitle() && <p className="text-sm text-slate-500 truncate">{getSubtitle()}</p>}
            </div>
        </a>
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
                const { data, error } = await supabase.rpc('search_all', { search_term: query });
                if (error) {
                    console.error('Error searching:', error);
                } else {
                    setResults(data || []);
                }
                setIsLoading(false);
            } else {
                setResults([]);
            }
        }, 300); // Debounce search

        return () => clearTimeout(handler);
    }, [query]);

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
    }

    const inputClass = mobile
        ? "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors"
        : "pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors";

    return (
        <div className="relative" ref={searchRef}>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input
                type="text"
                placeholder="Search grants, organizations..."
                className={inputClass}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
            />
            {isLoading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}

            {isFocused && query.length > 0 && (
                <div className="absolute top-full mt-2 w-full md:w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-2">
                    {isLoading ? (
                        <div className="text-center p-4 text-slate-500">Searching...</div>
                    ) : results.length > 0 ? (
                        results.map((item, index) => (
                             <SearchResultItem key={`${item.type}-${item.id}-${index}`} item={item} onClick={handleResultClick} />
                        ))
                    ) : (
                       query.length > 2 && <div className="text-center p-4 text-slate-500">No results found for "{query}"</div>
                    )}
                </div>
            )}
        </div>
    );
}
