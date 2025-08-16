// src/components/post/ReactionsModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { X } from 'lucide-react';
import Avatar from '../Avatar';
import { reactions } from './constants';

export default function ReactionsModal({ isOpen, onClose, reactors, likeCount, reactionSummary }) {
    const [activeTab, setActiveTab] = useState('all');
    const [displayCount, setDisplayCount] = useState(6);
    const navigate = useNavigate(); // 2. Initialize the navigate function

    if (!isOpen) return null;

    const getReactorsByType = (type) => {
        if (type === 'all') return reactors;
        return reactors.filter(reactor => reactor.reaction_type === type);
    };

    const activeReactors = getReactorsByType(activeTab);
    const displayedReactors = activeReactors.slice(0, displayCount);
    const hasMore = displayCount < activeReactors.length;

    const loadMore = () => {
        setDisplayCount(prev => Math.min(prev + 6, activeReactors.length));
    };

    // 3. Update the function to use navigate
    const handleProfileClick = (profileId) => {
        if (profileId) {
            onClose(); // Close the modal for a better user experience
            navigate(`/profile/members/${profileId}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Reactions</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex items-center space-x-1 px-4 py-2 border-b bg-gray-50 overflow-x-auto">
                    <button
                        onClick={() => { setActiveTab('all'); setDisplayCount(6); }}
                        className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === 'all' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        All {likeCount}
                    </button>
                    {reactionSummary.map(({ type, count }) => {
                        const reaction = reactions.find(r => r.type === type);
                        if (!reaction) return null;
                        return (
                            <button
                                key={type}
                                onClick={() => { setActiveTab(type); setDisplayCount(6); }}
                                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 whitespace-nowrap ${activeTab === type ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <div className={`p-0.5 rounded-full ${reaction.color}`}><reaction.Icon size={10} className="text-white" /></div>
                                <span>{count}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="overflow-y-auto flex-1">
                    {displayedReactors.map((reactor, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer" onClick={() => handleProfileClick(reactor.profile_id || reactor.user_id)}>
                            <Avatar src={reactor.avatar_url} fullName={reactor.full_name} size="md" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{reactor.full_name}</p>
                                <p className="text-sm text-gray-500 truncate">{reactor.organization_name || reactor.role || 'No organization'}</p>
                            </div>
                            {reactor.reaction_type && (() => {
                                const reaction = reactions.find(r => r.type === reactor.reaction_type);
                                if (!reaction) return null;
                                return (
                                    <div className={`p-1 rounded-full ${reaction.color}`}>
                                        <reaction.Icon size={12} className="text-white" />
                                    </div>
                                );
                            })()}
                        </div>
                    ))}
                    {hasMore && (
                        <div className="p-3 border-t bg-gray-50">
                            <button onClick={loadMore} className="w-full py-2 text-blue-600 font-medium text-sm">
                                Show more reactions ({activeReactors.length - displayCount} remaining)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}