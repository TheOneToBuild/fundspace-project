// components/member-profile/MemberProfilePhotos.jsx
import React, { useState, useMemo } from 'react';
import { Calendar, MessageSquare, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MemberProfilePhotos = ({ member, posts, loading }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Extract all photos from posts with metadata
    const allPhotos = useMemo(() => {
        if (!posts || posts.length === 0) return [];

        const photos = [];
        
        posts.forEach(post => {
            // Get images from different sources
            const images = [];
            
            // From image_urls array
            if (post.image_urls && Array.isArray(post.image_urls)) {
                images.push(...post.image_urls);
            }
            
            // From single image_url
            if (post.image_url) {
                images.push(post.image_url);
            }
            
            // From content HTML (embedded images)
            if (post.content) {
                const div = document.createElement('div');
                div.innerHTML = post.content;
                const imgElements = div.querySelectorAll('img');
                const contentImages = Array.from(imgElements).map(img => img.src).filter(src => src);
                images.push(...contentImages);
            }

            // Add each image with post metadata
            images.forEach(imageUrl => {
                if (imageUrl) {
                    photos.push({
                        id: `${post.id}-${imageUrl}`,
                        url: imageUrl,
                        postId: post.id,
                        postContent: post.content,
                        createdAt: post.created_at,
                        likesCount: post.likes_count || 0,
                        commentsCount: post.comments_count || 0
                    });
                }
            });
        });

        // Sort by most recent first
        return photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [posts]);

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    const closeModal = () => {
        setSelectedPhoto(null);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="animate-pulse">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, index) => (
                            <div key={index} className="aspect-square bg-slate-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-8 py-8">
            {allPhotos.length > 0 ? (
                <>
                    {/* Photos Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {allPhotos.map((photo) => (
                            <div
                                key={photo.id}
                                className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg bg-slate-100"
                                onClick={() => handlePhotoClick(photo)}
                            >
                                <img
                                    src={photo.url}
                                    alt="User photo"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                
                                {/* Hover overlay with post stats */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
                                    <div className="flex items-center space-x-3 text-white text-sm">
                                        <div className="flex items-center space-x-1">
                                            <Heart className="w-4 h-4" />
                                            <span>{photo.likesCount}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{photo.commentsCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Photo Modal */}
                    {selectedPhoto && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                            onClick={closeModal}
                        >
                            <div className="max-w-4xl max-h-full flex flex-col">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between text-white mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">
                                                {formatDistanceToNow(new Date(selectedPhoto.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <div className="flex items-center space-x-1">
                                                <Heart className="w-4 h-4" />
                                                <span>{selectedPhoto.likesCount}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <MessageSquare className="w-4 h-4" />
                                                <span>{selectedPhoto.commentsCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={closeModal}
                                        className="text-white hover:text-gray-300 text-2xl font-light"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Photo */}
                                <div className="flex-1 flex items-center justify-center">
                                    <img
                                        src={selectedPhoto.url}
                                        alt="Selected photo"
                                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                {/* Post content if available */}
                                {selectedPhoto.postContent && (
                                    <div className="mt-4 text-white">
                                        <div 
                                            className="text-sm opacity-80 max-h-20 overflow-y-auto"
                                            dangerouslySetInnerHTML={{ 
                                                __html: selectedPhoto.postContent.replace(/<img[^>]*>/g, '') 
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Empty state */
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">📸</span>
                    </div>
                    <h4 className="text-lg font-medium text-slate-600 mb-2">No Photos Yet</h4>
                    <p className="text-slate-500">
                        {member?.full_name?.split(' ')[0]} hasn't shared any photos yet. Check back later!
                    </p>
                </div>
            )}
        </div>
    );
};

export default MemberProfilePhotos;