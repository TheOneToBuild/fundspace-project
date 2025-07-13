// src/components/post/PostHeader.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import Avatar from '../Avatar'; // Make sure the path to Avatar.jsx is correct
import { timeAgo } from '../../utils/time';

export default function PostHeader({ author, createdAt, isAuthor, onEdit, onDelete }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    if (!author) {
        return null; // Don't render if there's no author
    }

    return (
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
                <Avatar src={author.avatar_url} fullName={author.full_name} size="md" />
                <div>
                    <p className="font-bold text-slate-800">{author.full_name}</p>
                    <p className="text-xs text-slate-500">{author.organization_name || author.role}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 text-slate-500">
                <span className="text-xs">{timeAgo(createdAt)}</span>
                {isAuthor && (
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(c => !c)} className="p-1.5 rounded-full hover:bg-slate-100">
                            <MoreHorizontal size={18} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-20">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onEdit();
                                    }}
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                                <button onClick={onDelete} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}