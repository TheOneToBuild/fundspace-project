// src/components/post/PostHeader.jsx - Updated with Clickable Profile and Organization
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import Avatar from '../Avatar';
import { timeAgo } from '../../utils/time';

export default function PostHeader({ author, createdAt, isAuthor, onEdit, onDelete }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

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

    // 🚀 FIXED: Click handlers for profile and organization
    const handleProfileClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (author?.id) {
            // 🚀 FIXED: Use correct profile route
            navigate(`/profile/members/${author.id}`);
        }
    };

    const handleOrganizationClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 🚀 FIXED: All organizations now go to /organizations path
        if (author?.organization_name) {
            // Create a slug from the organization name
            const orgSlug = author.organization_name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .trim();
            
            // 🚀 NEW: All organizations use the unified /organizations path
            navigate(`/organizations/${orgSlug}`);
        }
    };

    if (!author) {
        return null;
    }

    return (
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
                {/* 🚀 CLICKABLE: Profile Avatar */}
                <button
                    onClick={handleProfileClick}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    title={`View ${author.full_name}'s profile`}
                >
                    <Avatar src={author.avatar_url} fullName={author.full_name} size="md" />
                </button>
                
                <div>
                    {/* 🚀 CLICKABLE: Profile Name */}
                    <button
                        onClick={handleProfileClick}
                        className="font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer text-left"
                        title={`View ${author.full_name}'s profile`}
                    >
                        {author.full_name}
                    </button>
                    
                    {/* 🚀 CLICKABLE: Organization Name */}
                    {author.organization_name && (
                        <button
                            onClick={handleOrganizationClick}
                            className="block text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer text-left"
                            title={`Visit ${author.organization_name}`}
                        >
                            {author.organization_name}
                        </button>
                    )}
                    
                    {/* Fallback: Show role if no organization */}
                    {!author.organization_name && author.role && (
                        <p className="text-xs text-slate-500">{author.role}</p>
                    )}
                </div>
            </div>
            
            <div className="flex items-center space-x-2 text-slate-500">
                <span className="text-xs">{timeAgo(createdAt)}</span>
                {isAuthor && (
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsMenuOpen(c => !c)} 
                            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-20">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onEdit?.();
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        if (window.confirm('Are you sure you want to delete this post?')) {
                                            onDelete?.();
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-2">
                                        <Trash2 size={14} />
                                        <span>Delete</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}