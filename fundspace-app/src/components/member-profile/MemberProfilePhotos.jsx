import React, { useState, useMemo, useEffect } from 'react';
import { MessageSquare, Heart } from 'lucide-react';
import PostCard from '../PostCard';

const MemberProfilePhotos = ({ member, posts, loading }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);

    const allPhotos = useMemo(() => {
        if (!posts || posts.length === 0) return [];

        const photos = [];
        
        posts.forEach(post => {
            const uniqueImages = new Set();
            
            if (post.image_urls && Array.isArray(post.image_urls)) {
                post.image_urls.forEach(url => {
                    if (url) uniqueImages.add(url);
                });
            }
            
            if (post.image_url && !uniqueImages.has(post.image_url)) {
                uniqueImages.add(post.image_url);
            }
            
            if (post.content) {
                const div = document.createElement('div');
                div.innerHTML = post.content;
                const imgElements = div.querySelectorAll('img');
                const contentImages = Array.from(imgElements).map(img => img.src).filter(src => src);
                contentImages.forEach(url => {
                    if (url && !uniqueImages.has(url)) {
                        uniqueImages.add(url);
                    }
                });
            }

            Array.from(uniqueImages).forEach((imageUrl, index) => {
                photos.push({
                    id: `${post.id}-${index}-${imageUrl.split('/').pop()}`,
                    url: imageUrl,
                    post: post,
                    postId: post.id,
                    postContent: post.content,
                    createdAt: post.created_at,
                    likesCount: post.likes_count || 0,
                    commentsCount: post.comments_count || 0
                });
            });
        });

        return photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [posts]);

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
        setSelectedPost(photo.post);
    };

    const closeModal = () => {
        setSelectedPhoto(null);
        setSelectedPost(null);
    };

    const navigatePhoto = (direction) => {
        if (!selectedPhoto || allPhotos.length === 0) return;
        
        const currentIndex = allPhotos.findIndex(photo => photo.id === selectedPhoto.id);
        let newIndex;
        
        if (direction === 'next') {
            newIndex = currentIndex === allPhotos.length - 1 ? 0 : currentIndex + 1;
        } else {
            newIndex = currentIndex === 0 ? allPhotos.length - 1 : currentIndex - 1;
        }
        
        const newPhoto = allPhotos[newIndex];
        setSelectedPhoto(newPhoto);
        setSelectedPost(newPhoto.post);
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!selectedPhoto) return;
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navigatePhoto('prev');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navigatePhoto('next');
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeModal();
            }
        };

        if (selectedPhoto) {
            document.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [selectedPhoto, allPhotos]);

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

                    {selectedPhoto && selectedPost && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                            onClick={closeModal}
                        >
                            {allPhotos.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigatePhoto('prev');
                                        }}
                                        className="absolute left-6 z-60 p-3 rounded-full bg-white bg-opacity-30 backdrop-blur text-white hover:bg-opacity-50 transition-all"
                                        aria-label="Previous photo"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigatePhoto('next');
                                        }}
                                        className="absolute right-6 z-60 p-3 rounded-full bg-white bg-opacity-30 backdrop-blur text-white hover:bg-opacity-50 transition-all"
                                        aria-label="Next photo"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            <button 
                                onClick={closeModal}
                                className="absolute top-6 right-6 z-60 p-2 rounded-full bg-white bg-opacity-30 backdrop-blur text-white hover:bg-opacity-50 transition-all"
                                aria-label="Close modal"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {allPhotos.length > 1 && (
                                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-60 bg-white bg-opacity-30 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                                    {allPhotos.findIndex(photo => photo.id === selectedPhoto.id) + 1} of {allPhotos.length}
                                </div>
                            )}

                            <div 
                                className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <PostCard 
                                    post={selectedPost}
                                    focusedImage={selectedPhoto.url}
                                />
                            </div>
                        </div>
                    )}
                </>
            ) : (
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