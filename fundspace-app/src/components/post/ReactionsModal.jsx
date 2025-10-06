// src/components/post/ReactionsModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { reactions } from './constants';
import Avatar from '../Avatar';

export default function ReactionsModal({ isOpen, onClose, reactors = [], likeCount = 0, reactionSummary = [] }) {
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);
    const ITEMS_PER_PAGE = 6;

    if (!isOpen) return null;

    const getReactorsByType = (type) => {
        if (type === 'all') return reactors;
        return reactors.filter(reactor => reactor.reaction_type === type);
    };

    const activeReactors = getReactorsByType(activeTab);
    const totalPages = Math.ceil(activeReactors.length / ITEMS_PER_PAGE);
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const displayedReactors = activeReactors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleTabChange = (type) => {
        setActiveTab(type);
        setCurrentPage(0);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Reactions</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 px-4 py-2 border-b overflow-x-auto">
                    <button
                        onClick={() => handleTabChange('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'all' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        All {likeCount}
                    </button>
                    {reactionSummary.map(({ type, count }) => {
                        const reaction = reactions.find(r => r.type === type);
                        if (!reaction) return null;
                        
                        return (
                            <button
                                key={type}
                                onClick={() => handleTabChange(type)}
                                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
                                    activeTab === type 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <div className={`p-1 rounded-full ${reaction.color}`}>
                                    <reaction.Icon size={12} className="text-white" />
                                </div>
                                {count}
                            </button>
                        );
                    })}
                </div>

                {/* Reactors List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {displayedReactors.length > 0 ? (
                        <div className="space-y-3">
                            {displayedReactors.map((reactor, index) => {
                                const reaction = reactions.find(r => r.type === reactor.reaction_type);
                                return (
                                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Avatar 
                                                src={reactor.avatar_url} 
                                                fullName={reactor.full_name} 
                                                size="md" 
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {reactor.full_name || 'Unknown User'}
                                                </p>
                                                {reactor.organization_name && (
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {reactor.organization_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {reaction && (
                                            <div className={`p-1.5 rounded-full ${reaction.color}`}>
                                                <reaction.Icon size={14} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No reactions yet</p>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t p-4 flex items-center justify-between">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage === totalPages - 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}