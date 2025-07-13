// Updated CreatePost.jsx with support for custom onNewPost handler and placeholder
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, X, Smile, Link2 } from 'lucide-react';
import Avatar from './Avatar.jsx';
import urlDetectionUtils from '../utils/urlDetection.js';

export default function CreatePost({ 
  profile, 
  onNewPost, 
  channel = 'hello-world',
  placeholder = null // NEW: Custom placeholder support
}) {
    const [postText, setPostText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showTagSelector, setShowTagSelector] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');
    const [linkPreview, setLinkPreview] = useState(null);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const dragCounter = useRef(0);

    const emojis = [
        '😊', '😂', '❤️', '👍', '🎉', '🔥', '💡', '🚀',
        '💯', '⭐', '🌟', '💪', '🙌', '👏', '🎯', '💝',
        '🌈', '🎊', '✨', '💫', '🌸', '🌺', '🌻', '🌷',
        '🎈', '🎁', '🍀', '🌙', '☀️', '⚡', '🔮', '🎨'
    ];

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

    // Debounce function
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const fetchLinkPreview = async (url) => {
        if (!url || linkPreview) return;

        setIsFetchingPreview(true);
        try {
            // Replace with your actual API endpoint for fetching link previews
            const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch preview');
            }
            const data = await response.json();
            setLinkPreview({ ...data, url });
        } catch (error) {
            console.error('Error fetching link preview:', error);
            // You might want to clear the preview or show an error state
        } finally {
            setIsFetchingPreview(false);
        }
    };

    const debouncedFetchPreview = debounce(fetchLinkPreview, 500);

    useEffect(() => {
        const urls = urlDetectionUtils.suggestUrlsForPreview(postText);
        if (urls.length > 0) {
            debouncedFetchPreview(urls[0]);
        }
    }, [postText]);

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
        if (selectedTags.length >= 6 && !selectedTags.some(tag => tag.id === tagId)) {
            return; // Don't add more than 6 tags
        }
        
        setSelectedTags(prev => {
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
        if (!customTagInput.trim() || selectedTags.length >= 6) return;
        
        const customTag = {
            id: `custom-${Date.now()}`,
            label: customTagInput.trim(),
            color: getRandomTagColor(),
            isCustom: true
        };
        
        setSelectedTags(prev => [...prev, customTag]);
        setCustomTagInput('');
    };

    const removeTag = (tagId) => {
        setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
    };

    // Global drag handlers for seamless experience
    useEffect(() => {
        const handleGlobalDragEnter = (e) => {
            e.preventDefault();
            dragCounter.current++;
            if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                const hasImages = Array.from(e.dataTransfer.items).some(item => 
                    item.type.startsWith('image/')
                );
                if (hasImages) {
                    setIsDragActive(true);
                }
            }
        };

        const handleGlobalDragLeave = (e) => {
            e.preventDefault();
            dragCounter.current--;
            if (dragCounter.current === 0) {
                setIsDragActive(false);
            }
        };

        const handleGlobalDrop = (e) => {
            e.preventDefault();
            dragCounter.current = 0;
            setIsDragActive(false);
            
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length > 0) {
                processFiles(imageFiles);
            }
        };

        const handleGlobalDragOver = (e) => {
            e.preventDefault();
        };

        document.addEventListener('dragenter', handleGlobalDragEnter);
        document.addEventListener('dragleave', handleGlobalDragLeave);
        document.addEventListener('dragover', handleGlobalDragOver);
        document.addEventListener('drop', handleGlobalDrop);

        return () => {
            document.removeEventListener('dragenter', handleGlobalDragEnter);
            document.removeEventListener('dragleave', handleGlobalDragLeave);
            document.removeEventListener('dragover', handleGlobalDragOver);
            document.removeEventListener('drop', handleGlobalDrop);
        };
    }, []);

    const handleEmojiSelect = (emoji) => {
        setPostText(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const processFiles = (files) => {
        const maxImages = 6;
        
        if (selectedImages.length + files.length > maxImages) {
            setError(`You can only upload up to ${maxImages} images per post.`);
            return;
        }

        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
            
            if (!isValidType) {
                setError('Please select only image files.');
                return false;
            }
            if (!isValidSize) {
                setError('Images must be less than 10MB.');
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setError('');
            const newImages = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                id: Math.random().toString(36).substr(2, 9)
            }));
            setSelectedImages(prev => [...prev, ...newImages]);
        }
    };

    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        processFiles(files);
    };

    const removeImage = (imageId) => {
        setSelectedImages(prev => {
            const updated = prev.filter(img => img.id !== imageId);
            const removedImage = prev.find(img => img.id === imageId);
            if (removedImage) {
                URL.revokeObjectURL(removedImage.preview);
            }
            return updated;
        });
    };

    const uploadImages = async (images) => {
        const uploadPromises = images.map(async (imageObj) => {
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

        return Promise.all(uploadPromises);
    };

    // UPDATED: Handle post submission with support for custom onNewPost handler
    const handlePostSubmit = async () => {
        if ((!postText.trim() && selectedImages.length === 0) || !profile) return;

        setIsLoading(true);
        setUploading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('You must be logged in to post.');
                return;
            }

            let imageUrls = [];
            
            if (selectedImages.length > 0) {
                imageUrls = await uploadImages(selectedImages);
            }

            // Prepare post data
            const postData = {
                content: postText.trim() || '',
                user_id: user.id,
                profile_id: profile.id,
                image_urls: imageUrls.length > 0 ? imageUrls : null,
                image_url: imageUrls.length === 1 ? imageUrls[0] : null,
                tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
                channel: channel,
                link_url: linkPreview ? linkPreview.url : null,
            };

            // NEW: Check if we have a custom onNewPost handler (for organization posts)
            if (onNewPost && typeof onNewPost === 'function' && channel === 'organization') {
                // For organization posts, we need to add organization-specific fields
                // Let the parent component handle the database insertion
                const result = await onNewPost(postData);
                
                if (result) {
                    // Clear form on success
                    selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
                    setPostText('');
                    setSelectedImages([]);
                    setSelectedTags([]);
                    setLinkPreview(null);
                }
            } else {
                // Default behavior for regular posts
                const { data: newPost, error: postError } = await supabase
                    .from('posts')
                    .insert(postData)
                    .select()
                    .single();

                if (postError) {
                    setError('Failed to create post. Please try again.');
                    console.error('Post creation error:', postError);
                    return;
                }

                selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
                
                setPostText('');
                setSelectedImages([]);
                setSelectedTags([]);
                setLinkPreview(null);
                
                // Call the onNewPost callback if provided
                if (onNewPost && typeof onNewPost === 'function') {
                    onNewPost(newPost);
                }
            }

        } catch (error) {
            console.error('Error creating post:', error);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
            setUploading(false);
        }
    };

    // Improved random mosaic layout generator
    const getRandomMosaicLayout = (count) => {
        const layouts = {
            1: [
                { span: 'col-span-6 row-span-4', aspect: 'aspect-video' }
            ],
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
                { span: 'col-span-3 row-span-3', aspect: 'aspect-square' },
                { span: 'col-span-3 row-span-3', aspect: 'aspect-square' },
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

    const mosaicLayout = getRandomMosaicLayout(selectedImages.length);

    // NEW: Dynamic placeholder based on props or default
    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        return `What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`;
    };

    return (
        <div 
            ref={containerRef}
            className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 transition-all duration-200 ${
                isDragActive ? 'ring-2 ring-blue-400 border-blue-300 bg-blue-50' : ''
            }`}
        >
            <div className="flex items-start space-x-3">
                <Avatar src={profile?.avatar_url} fullName={profile?.full_name} size="md" />
                <div className="flex-1">
                    <div className="relative">
                        <textarea
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full p-3 pr-12 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="3"
                            disabled={isLoading}
                        />
                        
                        {/* Emoji button */}
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute bottom-3 right-3 p-1 text-slate-400 hover:text-yellow-500 transition-colors"
                            type="button"
                        >
                            <Smile size={20} />
                        </button>

                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border p-3 z-50 max-w-xs">
                                <div className="grid grid-cols-8 gap-1">
                                    {emojis.map((emoji, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleEmojiSelect(emoji)}
                                            className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                                            type="button"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Link Preview */}
                    {isFetchingPreview && (
                        <div className="mt-3 text-sm text-slate-500">Fetching link preview...</div>
                    )}
                    {linkPreview && (
                        <div className="mt-3 relative border rounded-lg overflow-hidden">
                            <button
                                onClick={() => setLinkPreview(null)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md z-10"
                                type="button"
                            >
                                <X size={14} />
                            </button>
                            {linkPreview.image && (
                                <img src={linkPreview.image} alt="Link preview" className="w-full h-48 object-cover" />
                            )}
                            <div className="p-3 bg-slate-50">
                                <p className="font-semibold text-slate-800 truncate">{linkPreview.title}</p>
                                <p className="text-sm text-slate-600 truncate">{linkPreview.description}</p>
                                <a href={linkPreview.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    {linkPreview.url}
                                </a>
                            </div>
                        </div>
                    )}
                    
                    {/* Enhanced Image Preview Mosaic */}
                    {selectedImages.length > 0 && (
                        <div className="mt-3">
                            <div className="grid grid-cols-6 gap-2 h-80">
                                {selectedImages.map((image, index) => {
                                    const layout = mosaicLayout[index] || { span: 'col-span-2 row-span-2', aspect: 'aspect-square' };
                                    return (
                                        <div 
                                            key={image.id} 
                                            className={`relative group overflow-hidden rounded-lg ${layout.span}`}
                                        >
                                            <img
                                                src={image.preview}
                                                alt={`Upload preview ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeImage(image.id)}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                disabled={isLoading}
                                                type="button"
                                            >
                                                <X size={14} />
                                            </button>
                                            {index === 5 && selectedImages.length > 6 && (
                                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                                    <span className="text-white font-bold text-lg">
                                                        +{selectedImages.length - 6}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selected Tags Display */}
                    {selectedTags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {selectedTags.map(tag => (
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

                    {isDragActive && selectedImages.length === 0 && (
                        <div className="mt-3 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
                            <Camera className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                            <p className="text-blue-600 font-medium">Drop images here to add to your post</p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                            {selectedImages.length < 6 && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        id="imageUpload"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                    <label
                                        htmlFor="imageUpload"
                                        className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 cursor-pointer transition-colors py-1"
                                    >
                                        <Camera size={20} />
                                        <span className="text-sm font-medium">
                                            {selectedImages.length > 0 ? 'Add More' : 'Photos'}
                                        </span>
                                    </label>
                                </>
                            )}
                            
                            {/* Tag Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowTagSelector(!showTagSelector)}
                                    className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 cursor-pointer transition-colors py-1"
                                    type="button"
                                >
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">#</span>
                                    </div>
                                    <span className="text-sm font-medium">Tags</span>
                                </button>

                                {showTagSelector && (
                                    <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border p-4 z-50 w-96">
                                        <p className="text-sm font-medium text-slate-700 mb-3">Add tags to categorize your post (max 6)</p>
                                        
                                        {/* Custom tag input */}
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
                                                    disabled={selectedTags.length >= 6}
                                                />
                                                <button
                                                    onClick={addCustomTag}
                                                    disabled={!customTagInput.trim() || selectedTags.length >= 6}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    type="button"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        {/* Predefined tags */}
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {availableTags.map(tag => (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => handleTagToggle(tag.id)}
                                                    disabled={selectedTags.length >= 6 && !selectedTags.some(t => t.id === tag.id)}
                                                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        selectedTags.some(t => t.id === tag.id)
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
                                            <span className="text-xs text-gray-500">{selectedTags.length}/6 tags selected</span>
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

                            {selectedImages.length > 0 && (
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {selectedImages.length}/6 photos
                                </span>
                            )}
                            {selectedTags.length > 0 && (
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        
                        <button
                            onClick={handlePostSubmit}
                            disabled={isLoading || (!postText.trim() && selectedImages.length === 0 && !linkPreview)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            type="button"
                        >
                            {uploading ? 'Uploading...' : isLoading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}