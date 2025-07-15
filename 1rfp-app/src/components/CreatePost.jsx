// Production CreatePost.jsx - With stylized mentions in textarea
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, X, Smile, AtSign } from 'lucide-react';
import Avatar from './Avatar.jsx';
import MentionDropdown from './mentions/MentionDropdown.jsx';

export default function CreatePost({ 
  profile, 
  onNewPost, 
  channel = 'hello-world',
  placeholder = null
}) {
    const [postText, setPostText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Tag states
    const [selectedTags, setSelectedTags] = useState([]);
    const [showTagSelector, setShowTagSelector] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');
    
    // Mention states
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [currentMentionStart, setCurrentMentionStart] = useState(-1);
    
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const overlayRef = useRef(null);

    const emojis = [
        '😊', '😂', '❤️', '👍', '🎉', '🔥', '💡', '🚀',
        '💯', '⭐', '🌟', '💪', '🙌', '👏', '🎯', '💝'
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

    // Tag functions
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
            return;
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

    // Create display text with styled mentions
    const createStyledOverlay = (text) => {
        if (!text) return '';
        
        const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
        let styledText = text;
        
        // Replace mentions with styled spans
        styledText = styledText.replace(mentionRegex, (match, displayName, id, type) => {
            return `<span class="mention-highlight">@${displayName}</span>`;
        });
        
        // Convert line breaks to <br> tags
        styledText = styledText.replace(/\n/g, '<br>');
        
        return styledText;
    };

    // Update overlay content when text changes
    useEffect(() => {
        if (overlayRef.current) {
            const styledContent = createStyledOverlay(postText);
            overlayRef.current.innerHTML = styledContent;
        }
    }, [postText]);

    // Mention handling
    const handleTextChange = (e) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        
        setPostText(value);
        
        // Check for @ mentions
        const textBeforeCursor = value.slice(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf('@');
        
        if (atIndex >= 0) {
            const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
            if (charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) {
                const queryAfterAt = textBeforeCursor.slice(atIndex + 1);
                
                if (!queryAfterAt.includes(' ') && !queryAfterAt.includes('\n')) {
                    setMentionQuery(queryAfterAt);
                    setCurrentMentionStart(atIndex);
                    setShowMentionDropdown(true);
                    
                    const textarea = textareaRef.current;
                    if (textarea) {
                        const rect = textarea.getBoundingClientRect();
                        setMentionPosition({
                            top: rect.bottom + window.scrollY + 5,
                            left: rect.left + window.scrollX
                        });
                    }
                    return;
                }
            }
        }
        
        setShowMentionDropdown(false);
    };

    const handleMentionSelect = (mention) => {
        if (currentMentionStart >= 0) {
            const beforeMention = postText.slice(0, currentMentionStart);
            const afterCursor = postText.slice(textareaRef.current.selectionStart);
            const mentionText = `@[${mention.name}](${mention.id}:${mention.type})`;
            const newText = beforeMention + mentionText + ' ' + afterCursor;
            
            setPostText(newText);
            setShowMentionDropdown(false);
            setCurrentMentionStart(-1);
            
            setTimeout(() => {
                if (textareaRef.current) {
                    const newCursorPos = beforeMention.length + mentionText.length + 1;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    textareaRef.current.focus();
                }
            }, 0);
        }
    };

    const extractMentionsForStorage = (text) => {
        if (!text) return [];
        
        const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            const [fullMatch, displayName, id, type] = match;
            mentions.push({
                displayName,
                id,
                type,
                fullMatch,
                start: match.index,
                end: match.index + fullMatch.length
            });
        }

        return mentions;
    };

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
            const isValidSize = file.size <= 10 * 1024 * 1024;
            
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

            const mentions = extractMentionsForStorage(postText);

            const postData = {
                content: postText.trim() || '',
                user_id: user.id,
                profile_id: profile.id,
                image_urls: imageUrls.length > 0 ? imageUrls : null,
                image_url: imageUrls.length === 1 ? imageUrls[0] : null,
                tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
                channel: channel,
                mentions: mentions.length > 0 ? JSON.stringify(mentions) : null,
            };

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

            if (mentions.length > 0) {
                await createMentionRecords(newPost.id, mentions);
            }

            selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
            
            setPostText('');
            setSelectedImages([]);
            setSelectedTags([]);
            
            if (onNewPost && typeof onNewPost === 'function') {
                onNewPost(newPost);
            }

        } catch (error) {
            console.error('Error creating post:', error);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
            setUploading(false);
        }
    };

    const createMentionRecords = async (postId, mentions) => {
        try {
            const mentionRecords = mentions.map(mention => {
                const record = {
                    post_id: postId,
                    mention_type: mention.type
                };

                if (mention.type === 'user') {
                    record.mentioned_profile_id = mention.id;
                } else if (mention.type === 'organization') {
                    const [orgType, orgId] = mention.id.split('-');
                    record.mentioned_organization_id = parseInt(orgId);
                    record.mentioned_organization_type = orgType;
                }

                return record;
            });

            const { error } = await supabase
                .from('post_mentions')
                .insert(mentionRecords);

            if (error) {
                console.error('Error creating mention records:', error);
            }
        } catch (error) {
            console.error('Error processing mentions:', error);
        }
    };

    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        return `What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`;
    };

    return (
        <>
            <style jsx>{`
                .mention-highlight {
                    background-color: rgb(239 246 255);
                    color: rgb(37 99 235);
                    padding: 2px 4px;
                    border-radius: 4px;
                    font-weight: 500;
                }
                .textarea-container {
                    position: relative;
                }
                .styled-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    padding: 12px;
                    border: 1px solid transparent;
                    background: transparent;
                    color: transparent;
                    pointer-events: none;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow: hidden;
                    font-family: inherit;
                    font-size: inherit;
                    line-height: inherit;
                    z-index: 1;
                }
                .transparent-textarea {
                    position: relative;
                    background: transparent;
                    z-index: 2;
                    color: rgb(51 65 85);
                }
            `}</style>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start space-x-3">
                    <Avatar src={profile?.avatar_url} fullName={profile?.full_name} size="md" />
                    <div className="flex-1">
                        <div className="relative textarea-container">
                            <div 
                                ref={overlayRef}
                                className="styled-overlay"
                                style={{
                                    paddingRight: '96px' // Account for buttons on the right
                                }}
                            />
                            <textarea
                                ref={textareaRef}
                                value={postText}
                                onChange={handleTextChange}
                                placeholder={getPlaceholder()}
                                className="transparent-textarea w-full p-3 pr-24 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="3"
                                disabled={isLoading}
                            />
                            
                            <div className="absolute bottom-3 right-3 flex items-center space-x-3">
                                <button
                                    onClick={() => {
                                        if (textareaRef.current) {
                                            const cursorPos = textareaRef.current.selectionStart;
                                            const newText = postText.slice(0, cursorPos) + '@' + postText.slice(cursorPos);
                                            setPostText(newText);
                                            setTimeout(() => {
                                                if (textareaRef.current) {
                                                    const newCursorPos = cursorPos + 1;
                                                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                                                    textareaRef.current.focus();
                                                    // Trigger the change event to detect mentions
                                                    const event = { target: textareaRef.current };
                                                    handleTextChange(event);
                                                }
                                            }, 0);
                                        }
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                    type="button"
                                    title="Mention someone"
                                >
                                    <AtSign size={20} />
                                </button>
                                
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-1 text-slate-400 hover:text-yellow-500 transition-colors"
                                    type="button"
                                >
                                    <Smile size={20} />
                                </button>
                            </div>

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

                        {showMentionDropdown && (
                            <MentionDropdown
                                query={mentionQuery}
                                onSelect={handleMentionSelect}
                                onClose={() => setShowMentionDropdown(false)}
                                position={mentionPosition}
                            />
                        )}
                        
                        {selectedImages.length > 0 && (
                            <div className="mt-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {selectedImages.map((image, index) => (
                                        <div key={image.id} className="relative group">
                                            <img
                                                src={image.preview}
                                                alt={`Upload preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => removeImage(image.id)}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                disabled={isLoading}
                                                type="button"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
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
                                disabled={isLoading || (!postText.trim() && selectedImages.length === 0)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                type="button"
                            >
                                {uploading ? 'Uploading...' : isLoading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                        
                        <div className="mt-2 text-xs text-slate-500">
                            💡 Type @ to mention users or organizations
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}