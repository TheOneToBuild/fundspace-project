// src/components/PostCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ThumbsUp, Heart, Lightbulb, PartyPopper, Share2, MoreHorizontal, Trash2, MessageSquare, X, ChevronLeft, ChevronRight, Maximize2, Camera } from 'lucide-react';
import CommentSection from './CommentSection.jsx';
import Avatar from './Avatar.jsx';

const reactions = [
    { type: 'like', Icon: ThumbsUp, color: 'bg-blue-500', label: 'Like' },
    { type: 'love', Icon: Heart, color: 'bg-red-500', label: 'Love' },
    { type: 'celebrate', Icon: PartyPopper, color: 'bg-green-500', label: 'Celebrate' },
    { type: 'insightful', Icon: Lightbulb, color: 'bg-yellow-500', label: 'Insightful' },
];

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

const ReactorsText = ({ likeCount, reactors, onViewReactions }) => {
    const actualCount = reactors?.length || 0;
    const displayCount = Math.max(likeCount, actualCount);

    if (!displayCount || displayCount < 1) return null;

    const firstName = reactors?.[0]?.full_name?.split(' ')?.[0];
    const hasMultiple = displayCount > 1;

    let displayText;
    if (displayCount === 1 && firstName) {
        displayText = firstName;
    } else if (displayCount === 2 && firstName) {
        displayText = `${firstName} + 1 other`;
    } else if (hasMultiple && firstName) {
        displayText = `${firstName} + ${displayCount - 1} others`;
    } else {
        displayText = `${displayCount} ${displayCount === 1 ? 'reaction' : 'reactions'}`;
    }

    return (
        <span
            className="ml-2 font-medium text-slate-600 hover:underline cursor-pointer"
            onClick={onViewReactions}
        >
            {displayText}
        </span>
    );
};

const ReactionsPreview = ({ reactors, likeCount, onViewAll }) => {
    const previewCount = Math.min(3, reactors.length);
    const previewReactors = reactors.slice(0, previewCount);
    const remainingCount = likeCount - previewCount;

    return (
        <div className="absolute bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg border z-20 p-3">
            <div className="space-y-2">
                {previewReactors.map((reactor, index) => (
                    <div key={index} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                        <Avatar src={reactor.avatar_url} fullName={reactor.full_name} size="sm" />
                        <span className="text-sm font-medium text-slate-700">{reactor.full_name}</span>
                        {reactor.reaction_type && (
                            <div className="ml-auto">
                                {(() => {
                                    const reaction = reactions.find(r => r.type === reactor.reaction_type);
                                    if (!reaction) return null;
                                    return (
                                        <div className={`p-0.5 rounded-full ${reaction.color}`}>
                                            <reaction.Icon size={10} className="text-white" />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div className="pt-2 border-t">
                        <button
                            onClick={onViewAll}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            View all {likeCount} reactions
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ReactionsModal = ({ post, isOpen, onClose, reactors, likeCount, reactionSummary }) => {
    const [activeTab, setActiveTab] = useState('all');
    const [displayCount, setDisplayCount] = useState(6);
    const [isNavigatingToProfile, setIsNavigatingToProfile] = useState(false);

    if (!isOpen) return null;

    const getReactorsByType = (type) => {
        if (type === 'all') return reactors;
        return reactors.filter(reactor => reactor.reaction_type === type);
    };

    const activeReactors = getReactorsByType(activeTab);
    const displayedReactors = activeReactors.slice(0, displayCount);
    const hasMore = displayCount < activeReactors.length;

    const handleProfileClick = (profileId) => {
        setIsNavigatingToProfile(true);
        console.log('Navigate to profile:', profileId);
        setTimeout(() => setIsNavigatingToProfile(false), 1000);
    };

    const loadMore = () => {
        setDisplayCount(prev => Math.min(prev + 6, activeReactors.length));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[70vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Reactions</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex items-center space-x-1 px-4 py-2 border-b bg-gray-50 overflow-x-auto">
                    <button
                        onClick={() => {
                            setActiveTab('all');
                            setDisplayCount(6);
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                            activeTab === 'all'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
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
                                onClick={() => {
                                    setActiveTab(type);
                                    setDisplayCount(6);
                                }}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 whitespace-nowrap ${
                                    activeTab === type
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <div className={`p-0.5 rounded-full ${reaction.color}`}>
                                    <reaction.Icon size={10} className="text-white" />
                                </div>
                                <span>{count}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="overflow-y-auto flex-1" style={{ maxHeight: '400px' }}>
                    {displayedReactors.map((reactor, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleProfileClick(reactor.profile_id || reactor.user_id)}
                        >
                            <Avatar src={reactor.avatar_url} fullName={reactor.full_name} size="md" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{reactor.full_name}</p>
                                <p className="text-sm text-gray-500 truncate">
                                    {reactor.organization_name || reactor.role || 'No organization'}
                                </p>
                            </div>
                            {reactor.reaction_type && (
                                <div className="flex items-center">
                                    {(() => {
                                        const reaction = reactions.find(r => r.type === reactor.reaction_type);
                                        if (!reaction) return null;
                                        return (
                                            <div className={`p-1 rounded-full ${reaction.color}`}>
                                                <reaction.Icon size={12} className="text-white" />
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    ))}
                    {hasMore && (
                        <div className="p-3 border-t bg-gray-50">
                            <button
                                onClick={loadMore}
                                className="w-full py-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                            >
                                Show more reactions ({activeReactors.length - displayCount} remaining)
                            </button>
                        </div>
                    )}
                    {isNavigatingToProfile && (
                        <div className="p-3 text-center">
                            <span className="text-sm text-gray-500">Navigating to profile...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TagDisplay = ({ tags }) => {
    let parsedTags = tags;

    if (typeof tags === 'string') {
        try {
            parsedTags = JSON.parse(tags);
        } catch (error) {
            console.error('Error parsing tags:', error);
            return null;
        }
    }

    if (!parsedTags || !Array.isArray(parsedTags) || parsedTags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-3">
            {parsedTags.map(tag => (
                <div key={tag.id} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tag.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    <span>{tag.label}</span>
                </div>
            ))}
        </div>
    );
};

const EditMode = ({
    post,
    editedContent,
    setEditedContent,
    editedTags,
    setEditedTags,
    editedImages,
    setEditedImages,
    onSave,
    onCancel
}) => {
    const [showTagSelector, setShowTagSelector] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');
    const [newImages, setNewImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const availableTags = [
        { id: 'education', label: 'Education', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { id: 'health', label: 'Health', color: 'bg-green-100 text-green-800 border-green-200' },
        { id: 'environment', label: 'Environment', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { id: 'arts', label: 'Arts & Culture', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        { id: 'social', label: 'Social Services', color: 'bg-pink-100 text-pink-800 border-pink-200' },
        { id: 'community', label: 'Community', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        { id: 'youth', label: 'Youth Development', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        { id: 'housing', label: 'Housing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { id: 'advocacy', label: 'Advocacy', color: 'bg-red-100 text-red-800 border-red-200' },
        { id: 'research', label: 'Research', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    ];

    const getRandomTagColor = () => {
        const colors = [
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-green-100 text-green-800 border-green-200',
            'bg-purple-100 text-purple-800 border-purple-200',
            'bg-pink-100 text-pink-800 border-pink-200',
            'bg-orange-100 text-orange-800 border-orange-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200',
            'bg-yellow-100 text-yellow-800 border-yellow-200',
            'bg-red-100 text-red-800 border-red-200'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleTagToggle = (tagId) => {
        if (editedTags.length >= 6 && !editedTags.some(tag => tag.id === tagId)) {
            return;
        }

        setEditedTags(prev => {
            const existingTag = prev.find(tag => tag.id === tagId);
            if (existingTag) {
                return prev.filter(tag => tag.id !== tagId);
            } else {
                const availableTag = availableTags.find(tag => tag.id === tagId);
                return [...prev, availableTag];
            }
        });
    };

    const addCustomTag = () => {
        if (!customTagInput.trim() || editedTags.length >= 6) return;

        const customTag = {
            id: `custom-${Date.now()}`,
            label: customTagInput.trim(),
            color: getRandomTagColor(),
            isCustom: true
        };

        setEditedTags(prev => [...prev, customTag]);
        setCustomTagInput('');
    };

    const removeTag = (tagId) => {
        setEditedTags(prev => prev.filter(tag => tag.id !== tagId));
    };

    const removeImage = (imageUrl) => {
        setEditedImages(prev => prev.filter(url => url !== imageUrl));
    };

    const removeNewImage = (imageId) => {
        setNewImages(prev => {
            const updated = prev.filter(img => img.id !== imageId);
            const removedImage = prev.find(img => img.id === imageId);
            if (removedImage) {
                URL.revokeObjectURL(removedImage.preview);
            }
            return updated;
        });
    };

    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        const maxImages = 6;

        if (editedImages.length + newImages.length + files.length > maxImages) {
            alert(`You can only have up to ${maxImages} images per post.`);
            return;
        }

        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024;

            if (!isValidType) {
                alert('Please select only image files.');
                return false;
            }
            if (!isValidSize) {
                alert('Images must be less than 10MB.');
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            const imageObjects = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                id: Math.random().toString(36).substr(2, 9)
            }));
            setNewImages(prev => [...prev, ...imageObjects]);
        }
    };

    const uploadNewImages = async () => {
        if (newImages.length === 0) return [];

        setUploading(true);
        const uploadPromises = newImages.map(async (imageObj) => {
            const fileExt = imageObj.file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `post-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, imageObj.file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('post-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        });

        try {
            const uploadedUrls = await Promise.all(uploadPromises);
            setUploading(false);
            return uploadedUrls;
        } catch (error) {
            setUploading(false);
            throw error;
        }
    };

    const handleSave = async () => {
        try {
            const newImageUrls = await uploadNewImages();
            const allImages = [...editedImages, ...newImageUrls];

            newImages.forEach(img => URL.revokeObjectURL(img.preview));

            onSave({
                content: editedContent,
                tags: editedTags,
                images: allImages
            });
        } catch (error) {
            console.error('Error saving post:', error);
            alert('Failed to save changes. Please try again.');
        }
    };

    return (
        <div className="space-y-4">
            <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="What's on your mind?"
            />
            {(editedImages.length > 0 || newImages.length > 0) && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-700">Images</h4>
                    {editedImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {editedImages.map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={imageUrl}
                                        alt={`Image ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => removeImage(imageUrl)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        type="button"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {newImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {newImages.map((image) => (
                                <div key={image.id} className="relative group">
                                    <img
                                        src={image.preview}
                                        alt="New upload"
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => removeNewImage(image.id)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        type="button"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {editedImages.length + newImages.length < 6 && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 cursor-pointer transition-colors py-1"
                        type="button"
                    >
                        <Camera size={20} />
                        <span className="text-sm font-medium">
                            {editedImages.length + newImages.length > 0 ? 'Add More Images' : 'Add Images'}
                        </span>
                    </button>
                </div>
            )}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Tags</h4>
                {editedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {editedTags.map(tag => (
                            <div key={tag.id} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tag.color} group`}>
                                <span>{tag.label}</span>
                                <button
                                    onClick={() => removeTag(tag.id)}
                                    className="ml-2 p-0.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                                    type="button"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <button
                        onClick={() => setShowTagSelector(!showTagSelector)}
                        className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 cursor-pointer transition-colors py-1"
                        type="button"
                    >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">#</span>
                        </div>
                        <span className="text-sm font-medium">Manage Tags</span>
                    </button>
                    {showTagSelector && (
                        <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border p-4 z-50 w-96">
                            <p className="text-sm font-medium text-slate-700 mb-3">Add tags to categorize your post (max 6)</p>
                            <div className="mb-4">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={customTagInput}
                                        onChange={(e) => setCustomTagInput(e.target.value)}
                                        placeholder="Create custom tag..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                                        maxLength={20}
                                        disabled={editedTags.length >= 6}
                                    />
                                    <button
                                        onClick={addCustomTag}
                                        disabled={!customTagInput.trim() || editedTags.length >= 6}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        type="button"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleTagToggle(tag.id)}
                                        disabled={editedTags.length >= 6 && !editedTags.some(t => t.id === tag.id)}
                                        className={`text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                            editedTags.some(t => t.id === tag.id)
                                                ? tag.color + ' ring-2 ring-blue-300'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                        type="button"
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">{editedTags.length}/6 tags selected</span>
                                <button
                                    onClick={() => setShowTagSelector(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    type="button"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                    disabled={uploading}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {uploading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

const ProfileoneImageViewer = ({
    post,
    images,
    initialIndex,
    isOpen,
    onClose,
    onReaction,
    selectedReaction,
    currentUserProfile,
    likeCount,
    reactionSummary,
    commentCount,
    showImageSection = true,
    onCommentAdded,
    onCommentDeleted,
    reactors = [],
    onViewReactions
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showReactionPanel, setShowReactionPanel] = useState(false);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const nextImage = () => {
        if (showImageSection && images.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }
    };

    const prevImage = () => {
        if (showImageSection && images.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleReaction = async (reactionType) => {
        await onReaction(reactionType);
        setShowReactionPanel(false);
    };

    const currentReaction = reactions.find(r => r.type === selectedReaction);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6" onClick={handleBackdropClick}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex" onClick={e => e.stopPropagation()}>
                {showImageSection ? (
                    <>
                        <div className="flex-[2] bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 relative flex items-center justify-center min-h-[600px]">
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-black rounded-full p-2 transition-all z-10 shadow-lg"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-black rounded-full p-2 transition-all z-10 shadow-lg"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-black rounded-full p-2 transition-all z-10 shadow-lg"
                            >
                                <X size={20} />
                            </button>
                            {images.length > 1 && (
                                <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    {currentIndex + 1} / {images.length}
                                </div>
                            )}
                            <img
                                src={images[currentIndex] || '/api/placeholder/800/600'}
                                alt={`Image ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => { e.target.src = '/api/placeholder/800/600'; }}
                            />
                        </div>
                        <div className={`bg-white flex flex-col flex-1 min-w-[420px] max-w-[480px] overflow-y-auto`}>
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-start space-x-3">
                                    <Avatar src={post.profiles.avatar_url} fullName={post.profiles.full_name} size="md" />
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <p className="font-semibold text-gray-900 text-base">{post.profiles.full_name}</p>
                                            <span className="text-gray-500">•</span>
                                            <span className="text-sm text-gray-500">{timeAgo(post.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{post.profiles.organization_name || post.profiles.role}</p>
                                    </div>
                                </div>
                            </div>
                            {post.content && (
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <p className="text-gray-800 leading-relaxed text-base">{post.content}</p>
                                </div>
                            )}
                            {post.tags && post.tags.length > 0 && (
                                <div className="px-6 py-3 border-b border-gray-200">
                                    <TagDisplay tags={post.tags} />
                                </div>
                            )}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {likeCount > 0 && (
                                            <div className="flex items-center cursor-pointer">
                                                <div className="flex items-center -space-x-1">
                                                    {(reactionSummary || []).sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                                                        const reaction = reactions.find(r => r.type === type);
                                                        if (!reaction) return null;
                                                        return (
                                                            <div key={type} className={`p-0.5 rounded-full ${reaction.color} border-2 border-white`}>
                                                                <reaction.Icon size={12} className="text-white" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <ReactorsText 
                                                    likeCount={likeCount} 
                                                    reactors={reactors} 
                                                    onViewReactions={onViewReactions}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-gray-600 text-sm">
                                        {commentCount > 0 && (
                                            <span className="hover:underline cursor-pointer">
                                                {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-3 border-b border-gray-200">
                                <div className="flex items-center space-x-1">
                                    <div className="relative flex-1">
                                        <button
                                            onClick={() => setShowReactionPanel(!showReactionPanel)}
                                            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all hover:bg-gray-100 ${
                                                currentReaction 
                                                    ? `${currentReaction.color.replace('bg-', 'text-')}` 
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            {currentReaction ? (
                                                <currentReaction.Icon size={20} />
                                            ) : (
                                                <ThumbsUp size={20} />
                                            )}
                                            <span className="text-sm font-medium">
                                                {currentReaction ? currentReaction.label : 'Like'}
                                            </span>
                                        </button>
                                        {showReactionPanel && (
                                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 flex space-x-1">
                                                {reactions.map(({ type, Icon, color, label }) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => handleReaction(type)}
                                                        className={`p-2 rounded-full hover:scale-110 transition-transform ${color}`}
                                                        title={label}
                                                    >
                                                        <Icon size={16} className="text-white" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button className="flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100 py-3 px-4 rounded-lg transition-colors">
                                        <MessageSquare size={20} />
                                        <span className="text-sm font-medium">Comment</span>
                                    </button>
                                    <button className="flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100 py-3 px-4 rounded-lg transition-colors">
                                        <Share2 size={20} />
                                        <span className="text-sm font-medium">Share</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 flex-1">
                                <CommentSection 
                                    post={post} 
                                    currentUserProfile={currentUserProfile}
                                    onCommentAdded={onCommentAdded}
                                    onCommentDeleted={onCommentDeleted}
                                    compact={true}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full bg-white relative flex flex-col">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-black rounded-full p-2 transition-all z-10 shadow-sm"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start space-x-3">
                                <Avatar src={post.profiles.avatar_url} fullName={post.profiles.full_name} size="md" />
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <p className="font-semibold text-gray-900 text-base">{post.profiles.full_name}</p>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-sm text-gray-500">{timeAgo(post.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{post.profiles.organization_name || post.profiles.role}</p>
                                </div>
                            </div>
                        </div>
                        {post.content && (
                            <div className="px-6 py-4 border-b border-gray-200">
                                <p className="text-gray-800 leading-relaxed text-base">{post.content}</p>
                            </div>
                        )}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {likeCount > 0 && (
                                        <div className="flex items-center cursor-pointer">
                                            <div className="flex items-center -space-x-1">
                                                {(reactionSummary || []).sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                                                    const reaction = reactions.find(r => r.type === type);
                                                    if (!reaction) return null;
                                                    return (
                                                        <div key={type} className={`p-0.5 rounded-full ${reaction.color} border-2 border-white`}>
                                                            <reaction.Icon size={12} className="text-white" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <ReactorsText 
                                                likeCount={likeCount} 
                                                reactors={reactors} 
                                                onViewReactions={onViewReactions}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="text-gray-600 text-sm">
                                    {commentCount > 0 && (
                                        <span className="hover:underline cursor-pointer">
                                            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex-1">
                            <CommentSection 
                                post={post} 
                                currentUserProfile={currentUserProfile}
                                onCommentAdded={onCommentAdded}
                                onCommentDeleted={onCommentDeleted}
                                compact={true}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ImageMosaic = ({ images, onImageClick }) => {
    if (!images || images.length === 0) return null;

    const getMosaicLayout = (count) => {
        const layouts = {
            1: [{ span: 'col-span-6 row-span-4', aspect: 'aspect-video' }],
            2: [
                { span: 'col-span-3 row-span-4', aspect: 'aspect-[3/4]' },
                { span: 'col-span-3 row-span-4', aspect: 'aspect-[3/4]' }
            ],
            3: [
                { span: 'col-span-4 row-span-4', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }
            ],
            4: [
                { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' },
                { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' },
                { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' },
                { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' }
            ],
            5: [
                { span: 'col-span-3 row-span-3', aspect: 'aspect-square' },
                { span: 'col-span-3 row-span-3', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }
            ],
            6: [
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }
            ]
        };
        return layouts[count] || [];
    };

    const mosaicLayout = getMosaicLayout(images.length);

    return (
        <div className="mb-4 rounded-lg overflow-hidden">
            <div className="grid grid-cols-6 gap-2 auto-rows-fr">
                {images.slice(0, 6).map((imageUrl, index) => {
                    const layout = mosaicLayout[index] || { span: 'col-span-2 row-span-2', aspect: 'aspect-square' };
                    return (
                        <div
                            key={index}
                            className={`relative group cursor-pointer overflow-hidden rounded-lg ${layout.span}`}
                            onClick={() => onImageClick(index)}
                        >
                            <div className={`${layout.aspect} w-full`}>
                                <img
                                    src={imageUrl}
                                    alt={`Post image ${index + 1}`}
                                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                        console.error('Image failed to load:', imageUrl);
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
                            </div>
                            {index === 5 && images.length > 6 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                        +{images.length - 6}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function PostCard({ post, onDelete, disabled = false }) {
    const { profile: currentUserProfile } = useOutletContext();
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [commentCount, setCommentCount] = useState(post.comments_count || 0);
    const [reactionSummary, setReactionSummary] = useState(post.reactions?.summary || []);
    const [reactionSample, setReactionSample] = useState(post.reactions?.sample || []);
    const [showComments, setShowComments] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReactionPanelOpen, setReactionPanelOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content || '');
    const [editedTags, setEditedTags] = useState([]);
    const [editedImages, setEditedImages] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const menuRef = useRef(null);
    const reactionTimeoutRef = useRef(null);
    const [showReactors, setShowReactors] = useState(false);
    const [reactors, setReactors] = useState([]);
    const [showReactionsModal, setShowReactionsModal] = useState(false);
    const reactorsTimeoutRef = useRef(null);

    useEffect(() => {
        if (!post || !post.profiles) return;

        const { image_url, image_urls, tags } = post;
        const displayImages = image_urls && image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);
        setEditedImages(displayImages);
        let parsedTags = [];
        if (tags) {
            if (typeof tags === 'string') {
                try {
                    parsedTags = JSON.parse(tags);
                } catch (error) {
                    console.error('Error parsing tags:', error);
                    parsedTags = [];
                }
            } else if (Array.isArray(tags)) {
                parsedTags = tags;
            }
        }
        setEditedTags(parsedTags);
    }, [post]);

    const refreshPostData = async () => {
        if (!post?.id) return;

        try {
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles!posts_profile_id_fkey(
                        id,
                        full_name,
                        avatar_url,
                        role,
                        title,
                        organization_name
                    )
                `)
                .eq('id', post.id)
                .single();

            if (postError) throw postError;

            const { data: likesData, error: likesError } = await supabase
                .from('post_likes')
                .select('user_id, reaction_type')
                .eq('post_id', post.id)
                .order('created_at', { ascending: false });

            if (likesError) throw likesError;

            const reactionCounts = {};
            const reactionSummaries = {};
            if (likesData) {
                likesData.forEach(like => {
                    const type = like.reaction_type || 'like';
                    reactionCounts[post.id] = (reactionCounts[post.id] || 0) + 1;
                    reactionSummaries[post.id] = reactionSummaries[post.id] || {};
                    reactionSummaries[post.id][type] = (reactionSummaries[post.id][type] || 0) + 1;
                });
            }

            setLikeCount(reactionCounts[post.id] || 0);
            setReactionSummary(Object.entries(reactionSummaries[post.id] || {}).map(([type, count]) => ({ type, count })) || []);
        } catch (error) {
            console.error('Failed to refresh post data:', error);
        }
    };

    useEffect(() => {
        setCommentCount(post.comments_count || 0);
        setLikeCount(post.likes_count || 0);
        setReactionSummary(post.reactions?.summary || []);
        setReactionSample(post.reactions?.sample || []);
    }, [post]);

    useEffect(() => {
        const fetchReactors = async () => {
            if (likeCount <= 0 || !post?.id) {
                setReactors([]);
                return;
            }

            try {
                const { data: likesData, error: likesError } = await supabase
                    .from('post_likes')
                    .select(`
                        user_id,
                        reaction_type,
                        created_at
                    `)
                    .eq('post_id', post.id)
                    .order('created_at', { ascending: false });

                if (likesError) {
                    console.error("Error fetching post_likes:", likesError);
                    setReactors([]);
                    return;
                }

                if (likesData && likesData.length > 0) {
                    const userIds = likesData.map(like => like.user_id);

                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select(`
                            id,
                            full_name,
                            avatar_url,
                            title,
                            organization_name,
                            role
                        `)
                        .in('id', userIds);

                    if (profilesError) {
                        console.error("Error fetching profiles:", profilesError);
                        setReactors([]);
                        return;
                    }

                    const transformedReactors = likesData.map(like => {
                        const profile = profilesData?.find(p => p.id === like.user_id);
                        return {
                            user_id: like.user_id,
                            profile_id: profile?.id,
                            full_name: profile?.full_name,
                            avatar_url: profile?.avatar_url,
                            title: profile?.title,
                            organization_name: profile?.organization_name,
                            role: profile?.role,
                            reaction_type: like.reaction_type,
                            created_at: like.created_at
                        };
                    }).filter(reactor => reactor.full_name);

                    setReactors(transformedReactors);

                    const actualCount = transformedReactors.length;
                    if (actualCount !== likeCount) {
                        setLikeCount(actualCount);
                    }
                } else {
                    setReactors([]);
                }
            } catch (error) {
                console.error('Error in fetchReactors:', error);
                setReactors([]);
            }
        };

        fetchReactors();
    }, [post.id, likeCount]);

    useEffect(() => {
        const checkReactionStatus = async () => {
            if (!currentUserProfile || !post?.id) return;
            const { data } = await supabase.from('post_likes').select('reaction_type').eq('post_id', post.id).eq('user_id', currentUserProfile.id).maybeSingle();
            setSelectedReaction(data?.reaction_type || null);
        };
        checkReactionStatus();
    }, [post.id, currentUserProfile]);

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

    const handleReaction = async (reactionType) => {
        if (!currentUserProfile || !post?.id || disabled) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { data: existingReaction } = await supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingReaction && selectedReaction === reactionType) {
                await supabase.from('post_likes').delete().eq('id', existingReaction.id);
                setSelectedReaction(null);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                const upsertData = {
                    post_id: post.id,
                    user_id: user.id,
                    reaction_type: reactionType
                };
                await supabase.from('post_likes').upsert(upsertData, { onConflict: 'post_id,user_id' });
                setSelectedReaction(reactionType);
                setLikeCount(prev => existingReaction ? prev : prev + 1);
            }
            await refreshPostData();
        } catch (error) {
            console.error('Error updating reaction:', error);
            if (error.code === '409') {
                console.warn('Duplicate reaction attempt ignored.');
            } else {
                alert('Failed to update reaction. Please try again.');
            }
        }
    };

    const handleEditPost = async (editData) => {
        setIsMenuOpen(false);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const updateData = {
            content: editData.content.trim(),
            tags: editData.tags.length > 0 ? JSON.stringify(editData.tags) : null
        };

        if (editData.images.length > 0) {
            if (editData.images.length === 1) {
                updateData.image_url = editData.images[0];
                updateData.image_urls = null;
            } else {
                updateData.image_url = null;
                updateData.image_urls = editData.images;
            }
        } else {
            updateData.image_url = null;
            updateData.image_urls = null;
        }

        const { error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', post.id)
            .eq('user_id', user.id);

        if (error) {
            console.error("Error updating post:", error);
            alert('Failed to update post. Please try again.');
        } else {
            setIsEditing(false);
            post.content = editData.content.trim();
            post.tags = editData.tags;
            post.image_url = updateData.image_url;
            post.image_urls = updateData.image_urls;
            await refreshPostData();
        }
    };

    const handleCancelEdit = () => {
        setEditedContent(post.content || '');
        let parsedTags = [];
        if (post.tags) {
            if (typeof post.tags === 'string') {
                try {
                    parsedTags = JSON.parse(post.tags);
                } catch (error) {
                    console.error('Error parsing tags:', error);
                    parsedTags = [];
                }
            } else if (Array.isArray(post.tags)) {
                parsedTags = tags;
            }
        }
        setEditedTags(parsedTags);
        const { image_url, image_urls } = post;
        const displayImages = image_urls && image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);
        setEditedImages(displayImages);
        setIsEditing(false);
    };

    const handleDeletePost = async () => {
        setIsMenuOpen(false);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id)
            .eq('user_id', user.id);

        if (error) {
            console.error("Error deleting post:", error);
        } else if (onDelete) {
            onDelete(post.id);
        }
    };

    const handleReactionMouseEnter = () => {
        clearTimeout(reactionTimeoutRef.current);
        setReactionPanelOpen(true);
    };

    const handleReactionMouseLeave = () => {
        reactionTimeoutRef.current = setTimeout(() => setReactionPanelOpen(false), 300);
    };

    const handleReactorsEnter = async () => {
        clearTimeout(reactorsTimeoutRef.current);
        setShowReactors(true);
    };

    const handleReactorsLeave = () => {
        reactorsTimeoutRef.current = setTimeout(() => {
            setShowReactors(false);
        }, 300);
    };

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setIsImageModalOpen(true);
    };

    if (!post || !post.profiles) return null;

    const { content, created_at, profiles: author, image_url, image_urls, tags } = post;
    const isAuthor = currentUserProfile?.id === author.id;
    const currentReaction = reactions.find(r => r.type === selectedReaction);
    const DefaultReactionIcon = reactions[0].Icon;

    const MAX_CHARS = 300;
    const shouldTruncate = content && content.length > MAX_CHARS;

    const displayImages = image_urls && image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);

    let parsedTags = [];
    if (tags) {
        if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            } catch (error) {
                console.error('Error parsing tags:', error);
                parsedTags = [];
            }
        } else if (Array.isArray(tags)) {
            parsedTags = tags;
        }
    }

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <Avatar src={author.avatar_url} fullName={author.full_name} size="md" />
                    <div>
                        <p className="font-bold text-slate-800">{author.full_name}</p>
                        <p className="text-xs text-slate-500">{author.organization_name || author.role}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                    <span className="text-xs">{timeAgo(created_at)}</span>
                    {isAuthor && !disabled && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(c => !c)} className="p-1.5 rounded-full hover:bg-slate-100">
                                <MoreHorizontal size={18} />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-20">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setIsEditing(true);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button onClick={handleDeletePost} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {content && !isEditing && (
                <div className="mb-4">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {!content ? '' : (!shouldTruncate || isExpanded) ? content : content.substring(0, MAX_CHARS).replace(/\s+\S*$/, '')}
                        {shouldTruncate && !isExpanded && (
                            <>
                                {'... '}
                                <button
                                    onClick={() => setIsExpanded(true)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium inline"
                                >
                                    View more
                                </button>
                            </>
                        )}
                    </p>
                    {shouldTruncate && isExpanded && (
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 block"
                        >
                            View less
                        </button>
                    )}
                </div>
            )}
            {displayImages.length > 0 && !isEditing && (
                <ImageMosaic
                    images={displayImages}
                    onImageClick={handleImageClick}
                />
            )}
            {parsedTags.length > 0 && !isEditing && (
                <TagDisplay tags={parsedTags} />
            )}
            {isEditing && (
                <div className="mb-4">
                    <EditMode
                        post={post}
                        editedContent={editedContent}
                        setEditedContent={setEditedContent}
                        editedTags={editedTags}
                        setEditedTags={setEditedTags}
                        editedImages={editedImages}
                        setEditedImages={setEditedImages}
                        onSave={handleEditPost}
                        onCancel={handleCancelEdit}
                    />
                </div>
            )}
            <ProfileoneImageViewer
                post={post}
                images={displayImages.length > 0 ? displayImages : ['/api/placeholder/800/600']}
                initialIndex={selectedImageIndex}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onReaction={handleReaction}
                selectedReaction={selectedReaction}
                currentUserProfile={currentUserProfile}
                likeCount={likeCount}
                reactionSummary={reactionSummary}
                commentCount={commentCount}
                showImageSection={displayImages.length > 0}
                onCommentAdded={() => setCommentCount(prev => prev + 1)}
                onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))}
                reactors={reactors}
                onViewReactions={() => setShowReactionsModal(true)}
            />
            <div className="flex items-center justify-between text-sm text-slate-500 mb-2 min-h-[20px]">
                <div className="relative" onMouseEnter={handleReactorsEnter} onMouseLeave={handleReactorsLeave}>
                    {likeCount > 0 && (
                        <div className="flex items-center cursor-pointer">
                            <div className="flex items-center -space-x-1">
                                {(reactionSummary || []).sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                                    const reaction = reactions.find(r => r.type === type);
                                    if (!reaction) return null;
                                    return (
                                        <div key={type} className={`p-0.5 rounded-full ${reaction.color} border-2 border-white`}>
                                            <reaction.Icon size={12} className="text-white" />
                                        </div>
                                    );
                                })}
                            </div>
                            <ReactorsText
                                likeCount={likeCount}
                                reactors={reactors}
                                onViewReactions={() => setShowReactionsModal(true)}
                            />
                        </div>
                    )}
                    {showReactors && likeCount > 0 && (
                        <ReactionsPreview
                            reactors={reactors}
                            likeCount={likeCount}
                            onViewAll={() => {
                                setShowReactors(false);
                                setShowReactionsModal(true);
                            }}
                        />
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    {commentCount > 0 && (
                        <span className="cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>
                            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                        </span>
                    )}
                </div>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
                <div className="relative">
                    <div
                        className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
                        onMouseEnter={handleReactionMouseEnter}
                        onMouseLeave={handleReactionMouseLeave}
                        onClick={() => !disabled && handleReaction('like')}
                    >
                        {currentReaction ? (
                            <currentReaction.Icon size={18} className={`${currentReaction.color.replace('bg-', 'text-')} fill-current`} />
                        ) : (
                            <DefaultReactionIcon size={18} className="text-slate-500" />
                        )}
                        <span className={`text-sm font-medium ${currentReaction ? currentReaction.color.replace('bg-', 'text-') : 'text-slate-600'}`}>
                            {currentReaction ? currentReaction.label : 'Like'}
                        </span>
                    </div>
                    {isReactionPanelOpen && !disabled && (
                        <div
                            className="absolute bottom-full mb-2 bg-white border rounded-lg shadow-lg px-3 py-2 flex space-x-2 z-30"
                            onMouseEnter={handleReactionMouseEnter}
                            onMouseLeave={handleReactionMouseLeave}
                        >
                            {reactions.map(({ type, Icon, color, label }) => (
                                <button
                                    key={type}
                                    onClick={() => handleReaction(type)}
                                    className={`p-2 rounded-full hover:scale-110 transition-transform ${color}`}
                                    title={label}
                                >
                                    <Icon size={16} className="text-white" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => !disabled && setShowComments(!showComments)}
                    className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
                    disabled={disabled}
                >
                    <MessageSquare size={18} />
                    <span className="text-sm font-medium">Comment</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-600 hover:text-green-600 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors">
                    <Share2 size={18} />
                    <span className="text-sm font-medium">Share</span>
                </button>
            </div>
            {showComments && (
                <div className="mt-4 border-t pt-4 max-h-96 overflow-y-auto">
                    <CommentSection
                        post={post}
                        currentUserProfile={currentUserProfile}
                        onCommentAdded={() => setCommentCount(prev => prev + 1)}
                        onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))}
                    />
                </div>
            )}
            <ReactionsModal
                post={post}
                isOpen={showReactionsModal}
                onClose={() => setShowReactionsModal(false)}
                reactors={reactors}
                likeCount={likeCount}
                reactionSummary={reactionSummary}
            />
        </div>
    );
}