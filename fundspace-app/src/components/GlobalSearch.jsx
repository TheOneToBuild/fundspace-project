import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader, Building, User, FileText } from 'lucide-react';
import { getGlobalSearchResults } from '../utils/rpcClientFunctions';

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
        
        if (item.type === 'organization') {
            navigate(`/organizations/${item.slug || item.id}`);
        } else if (item.type === 'member' || item.type === 'user') {
            navigate(`/profile/members/${item.id}`);
        } else if (item.type === 'grant') {
            navigate(`/profile/grants-portal?open_grant=${item.id}`);
        }
        
        onClick();
    };

    const renderIconOrAvatar = () => {
        const imageUrl = item.avatar_url || item.image_url;
        
        if (imageUrl) {
            return (
                <img 
                    src={imageUrl} 
                    alt={`${item.name}`} 
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            );
        }

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
    const [results, setResults] = useState({ organizations: [], profiles: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (query.length > 2) {
                setIsLoading(true);
                try {
                    const searchResults = await getGlobalSearchResults(query.trim(), 10);
                    setResults(searchResults);
                } catch (error) {
                    console.error('Search error:', error);
                    setResults({ organizations: [], profiles: [] });
                }
                setIsLoading(false);
            } else {
                setResults({ organizations: [], profiles: [] });
            }
        }, 300);

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
        setResults({ organizations: [], profiles: [] });
        setIsFocused(false);
    };

    const allResults = [...(results.organizations || []), ...(results.profiles || [])];

    const inputClass = mobile
        ? "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors"
        : "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors";

    return (
        <div className="relative w-full" ref={searchRef}>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input
                type="text"
                placeholder="Search"
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
                    ) : allResults.length > 0 ? (
                        <div className="p-2">
                            {results.organizations && results.organizations.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-50">
                                        Organizations ({results.organizations.length})
                                    </h3>
                                    {results.organizations.map((org, index) => (
                                        <SearchResultItem 
                                            key={`org-${org.id}-${index}`} 
                                            item={{...org, type: 'organization'}} 
                                            onClick={handleResultClick} 
                                        />
                                    ))}
                                </div>
                            )}
                            {results.profiles && results.profiles.length > 0 && (
                                <div>
                                    <h3 className="px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-50">
                                        Members ({results.profiles.length})
                                    </h3>
                                    {results.profiles.map((profile, index) => (
                                        <SearchResultItem 
                                            key={`profile-${profile.id}-${index}`} 
                                            item={{...profile, name: profile.full_name, type: 'member'}} 
                                            onClick={handleResultClick} 
                                        />
                                    ))}
                                </div>
                            )}
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