// src/components/CreateOrganizationModal.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';

export default function CreateOrganizationModal({ isOpen, onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [tagline, setTagline] = useState('');
    const [description, setDescription] = useState('');
    const [website, setWebsite] = useState('');
    const [location, setLocation] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) {
            setError('Organization name is required.');
            return;
        }
        setLoading(true);
        setError('');

        const { data, error: rpcError } = await supabase.rpc('create_new_nonprofit', {
            name: name,
            tagline: tagline,
            description: description,
            location: location,
            website: website,
            contact_email: contactEmail
        });

        if (rpcError) {
            setError(rpcError.message);
        } else {
            onSuccess(data); // Pass the newly created org back to the parent
            onClose(); // Close the modal
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Create New Organization Profile</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Modal Body with Form */}
                <div className="p-6 overflow-y-auto">
                    {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">{error}</div>}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="org-name" className="text-sm font-medium text-slate-700 block mb-1">Organization Name *</label>
                            <input id="org-name" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                         <div>
                            <label htmlFor="org-tagline" className="text-sm font-medium text-slate-700 block mb-1">Tagline</label>
                            <input id="org-tagline" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} />
                        </div>
                         <div>
                            <label htmlFor="org-website" className="text-sm font-medium text-slate-700 block mb-1">Website</label>
                            <input id="org-website" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                        </div>
                        <div>
                            <label htmlFor="org-email" className="text-sm font-medium text-slate-700 block mb-1">Public Contact Email</label>
                            <input id="org-email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                        </div>
                         <div>
                            <label htmlFor="org-location" className="text-sm font-medium text-slate-700 block mb-1">Location</label>
                            <input id="org-location" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., San Francisco, CA" />
                        </div>
                        <div>
                            <label htmlFor="org-description" className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                            <textarea id="org-description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows="4" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <button onClick={onClose} type="button" className="px-5 py-2 mr-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading} type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 shadow-sm">
                        {loading ? 'Creating...' : 'Create Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}