// src/components/FocusAreaEditor.jsx
import React, { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { X, PlusCircle } from 'lucide-react';

export default function FocusAreaEditor({ allCategories, selectedIds, onChange, onCategoryAdded }) { // MODIFIED: Added onCategoryAdded prop
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const selectedCategories = useMemo(() => {
        return allCategories.filter(cat => selectedIds.includes(cat.id));
    }, [allCategories, selectedIds]);

    const availableCategories = useMemo(() => {
        if (!searchTerm) return [];
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return allCategories.filter(cat => 
            !selectedIds.includes(cat.id) &&
            cat.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [allCategories, selectedIds, searchTerm]);

    const handleSelect = (categoryId) => {
        onChange([...selectedIds, categoryId]);
        setSearchTerm('');
    };

    const handleDeselect = (categoryId) => {
        onChange(selectedIds.filter(id => id !== categoryId));
    };

    const handleAddNewCategory = async () => {
        if (!searchTerm.trim()) return;
        setIsAdding(true);
        
        const { data: newCategory, error } = await supabase.rpc('create_new_category', { new_name: searchTerm.trim() });
        
        if (error) {
            console.error("Failed to create new category:", error);
        } else if (newCategory) {
            // MODIFIED: Call the new prop to update the parent's master list
            onCategoryAdded(newCategory); 
            // Now add the new category to the selection
            onChange([...selectedIds, newCategory.id]);
            setSearchTerm('');
        }
        setIsAdding(false);
    };

    const exactMatchFound = useMemo(() => {
        return allCategories.some(cat => cat.name.toLowerCase() === searchTerm.toLowerCase().trim());
    }, [allCategories, searchTerm]);

    return (
        <div>
            <label htmlFor="focus-areas-search" className="text-sm font-medium text-slate-700 block mb-1">Focus Areas</label>
            <div className="relative">
                <input
                    id="focus-areas-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search or add new focus areas..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    autoComplete="off"
                />
                {searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableCategories.map(cat => (
                            <div key={cat.id} onClick={() => handleSelect(cat.id)} className="px-4 py-2 hover:bg-slate-100 cursor-pointer">
                                {cat.name}
                            </div>
                        ))}
                        {searchTerm.trim() && !exactMatchFound && (
                            <div onClick={handleAddNewCategory} disabled={isAdding} className="px-4 py-2 hover:bg-green-50 cursor-pointer flex items-center text-green-700 font-semibold">
                                <PlusCircle size={16} className="mr-2" />
                                {isAdding ? 'Adding...' : `Add new category: "${searchTerm.trim()}"`}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
                {selectedCategories.map(cat => (
                    <div key={cat.id} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        <span>{cat.name}</span>
                        <button onClick={() => handleDeselect(cat.id)} className="ml-2 text-blue-500 hover:text-blue-800">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}