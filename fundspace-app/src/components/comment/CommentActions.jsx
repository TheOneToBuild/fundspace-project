// src/components/comment/CommentActions.jsx
import React from 'react';
import { Trash2, Edit3, Reply } from 'lucide-react';

export default function CommentActions({ 
    comment,
    currentUserProfile,
    onEdit,
    onDelete,
    onReply,
    showReply = false 
}) {
    const isAuthor = currentUserProfile?.id === comment.profile_id;

    return (
        <div className="flex items-center space-x-3 mt-1">
            {/* Reply Button - Available for all users */}
            {showReply && (
                <button
                    onClick={() => onReply && onReply(comment)}
                    className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-100"
                >
                    <Reply size={12} />
                    <span>Reply</span>
                </button>
            )}

            {/* Author-only actions */}
            {isAuthor && (
                <>
                    <button
                        onClick={() => onEdit && onEdit(comment)}
                        className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-100"
                        title="Edit comment"
                    >
                        <Edit3 size={12} />
                        <span>Edit</span>
                    </button>

                    <button
                        onClick={() => onDelete && onDelete(comment.id)}
                        className="flex items-center space-x-1 text-xs text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-slate-100"
                        title="Delete comment"
                    >
                        <Trash2 size={12} />
                        <span>Delete</span>
                    </button>
                </>
            )}
        </div>
    );
}