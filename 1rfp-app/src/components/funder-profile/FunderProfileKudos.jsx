import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from '../Icons.jsx';
import Avatar from '../Avatar.jsx';
import { formatDate } from '../../utils';

export default function FunderProfileKudos({ funder, kudos: initialKudos, session }) {
    // This component will manage its own state for adding new kudos
    const [kudos, setKudos] = useState(initialKudos || []);
    const [newKudos, setNewKudos] = useState('');

    const handleAddKudos = () => {
        if (newKudos.trim()) {
            const newKudosItem = {
                id: Date.now(),
                text: newKudos,
                author: {
                    name: session?.user?.user_metadata?.full_name || "Anonymous User",
                    organization: "Your Organization", // This could be fetched from the user's profile
                    avatar: session?.user?.user_metadata?.avatar_url || null
                },
                createdAt: new Date().toISOString()
            };
            setKudos(prev => [newKudosItem, ...prev]);
            setNewKudos('');
        }
    };

    const displayKudos = kudos.slice(0, 20);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Star className="text-yellow-500" />
                    Community Kudos
                </h3>
                <span className="text-sm text-slate-500">{kudos.length} kudos</span>
            </div>

            {session ? (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <h4 className="font-semibold text-slate-800 mb-3">Share your experience working with {funder.name}</h4>
                    <div className="space-y-3">
                        <textarea
                            value={newKudos}
                            onChange={(e) => setNewKudos(e.target.value)}
                            placeholder="Write about your experience, partnership, or the impact of their support..."
                            className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                        />
                        <button
                            onClick={handleAddKudos}
                            disabled={!newKudos.trim()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Add Kudos
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
                    <p className="text-slate-600 mb-3">Want to share your experience with {funder.name}?</p>
                    <Link
                        to="/login"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Log in to add kudos
                    </Link>
                </div>
            )}

            {displayKudos.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayKudos.map(kudo => (
                        <div key={kudo.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                            <p className="text-slate-700 leading-relaxed mb-4">{kudo.text}</p>
                            <div className="flex items-start gap-4">
                                <Avatar src={kudo.author.avatar} fullName={kudo.author.name} size="md" />
                                <div className="flex-1">
                                    <h5 className="font-bold text-slate-800">{kudo.author.name}</h5>
                                    <p className="text-sm text-blue-600">{kudo.author.organization}</p>
                                    <p className="text-xs text-slate-500">{formatDate(kudo.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                    <Star className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No kudos yet</h3>
                    <p className="text-slate-600">Be the first to share your experience with {funder.name}!</p>
                </div>
            )}
        </div>
    );
}