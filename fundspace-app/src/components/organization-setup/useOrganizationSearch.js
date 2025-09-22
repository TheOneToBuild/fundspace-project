// src/components/organization-setup/useOrganizationSearch.js
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function useOrganizationSearch(searchQuery) {
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const debouncedSearch = debounce(async (query) => {
            if (!query || query.length < 2) {
                setSearchResults([]);
                return;
            }
            
            setSearching(true);
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('id, name, type, description, location, website, image_url')
                    .ilike('name', `%${query}%`)
                    .limit(10);

                if (error) {
                    console.error('Search error:', error);
                } else {
                    setSearchResults(data || []);
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setSearching(false);
            }
        }, 300);

        debouncedSearch(searchQuery);
    }, [searchQuery]);

    return { searchResults, searching };
}