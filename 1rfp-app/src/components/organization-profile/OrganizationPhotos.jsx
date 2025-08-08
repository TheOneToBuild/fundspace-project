// src/components/organization-profile/OrganizationPhotos.jsx - Public viewing component (Instagram-style)
import React, { useState, useEffect } from 'react';
import { Camera, Heart, MessageCircle, Share, MoreHorizontal, X } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

const OrganizationPhotos = ({ 
  organization, 
  userMembership, 
  session
}) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [error, setError] = useState('');

  // Fetch photos from organization_photos table
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('organization_photos')
        .select(`
          id,
          image_url,
          caption,
          alt_text,
          created_at,
          uploaded_by_user_id,
          is_featured,
          display_order,
          likes_count,
          comments_count
        `)
        .eq('organization_id', organization.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Transform data to match expected format
      const photosWithCounts = (data || []).map(photo => ({
        ...photo,
        likes_count: photo.likes_count || 0,
        comments_count: photo.comments_count || 0
      }));
      
      setPhotos(photosWithCounts);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      fetchPhotos();
    }
  }, [organization?.id]);

  // Open photo modal
  const openPhotoModal = (photo, index) => {
    setSelectedPhoto({ ...photo, index });
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  // Navigate through photos
  const navigatePhoto = (direction) => {
    if (!selectedPhoto) return;
    
    const currentIndex = selectedPhoto.index;
    let newIndex;
    
    if (direction === 'next' && currentIndex < photos.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      return;
    }
    
    openPhotoModal(photos[newIndex], newIndex);
  };

  // Like/Unlike photo (if user is logged in)
  const toggleLike = async (photoId) => {
    if (!session?.user) return;

    try {
      // Check if user already liked this photo
      const { data: existingLike } = await supabase
        .from('organization_photo_likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', session.user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('organization_photo_likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', session.user.id);
      } else {
        // Like
        await supabase
          .from('organization_photo_likes')
          .insert({
            photo_id: photoId,
            user_id: session.user.id,
            reaction_type: 'like'
          });
      }
      
      // Refresh photos to update counts
      await fetchPhotos();
      
      // Update the selected photo if it's open
      if (selectedPhoto && selectedPhoto.id === photoId) {
        const updatedPhoto = photos.find(p => p.id === photoId);
        if (updatedPhoto) {
          setSelectedPhoto({ ...selectedPhoto, ...updatedPhoto });
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Check if user has liked a photo
  const [userLikes, setUserLikes] = useState(new Set());
  
  const fetchUserLikes = async () => {
    if (!session?.user || photos.length === 0) return;
    
    try {
      const { data } = await supabase
        .from('organization_photo_likes')
        .select('photo_id')
        .eq('user_id', session.user.id)
        .in('photo_id', photos.map(p => p.id));
      
      const likedPhotoIds = new Set(data?.map(like => like.photo_id) || []);
      setUserLikes(likedPhotoIds);
    } catch (err) {
      console.error('Error fetching user likes:', err);
    }
  };

  useEffect(() => {
    fetchUserLikes();
  }, [photos, session?.user?.id]);

  // Handle escape key and click outside to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedPhoto) {
        closePhotoModal();
      }
    };

    const handleClickOutside = (event) => {
      if (event.target.classList.contains('photo-modal-backdrop')) {
        closePhotoModal();
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Simple, no upload buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Photos</h2>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Photo Grid - Instagram Style */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {photos.map((photo, index) => (
            <div 
              key={photo.id}
              className="relative aspect-square bg-slate-100 group cursor-pointer overflow-hidden rounded-xl"
              onClick={() => openPhotoModal(photo, index)}
            >
              <img 
                src={photo.image_url} 
                alt={photo.alt_text || photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              
              {/* Instagram-style hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <Heart className="w-5 h-5" />
                    <span className="font-semibold">{photo.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">{photo.comments_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State - No upload options for public users */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Camera className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-900 mb-2">No Photos Yet</h3>
          <p className="text-slate-600">
            No photos have been shared by {organization.name} yet.
          </p>
        </div>
      )}

      {/* Photo Detail Modal - Larger CreatePost Style */}
      {selectedPhoto && (
        <div className="photo-modal-backdrop fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 ease-in-out">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {organization?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{organization?.name}</h3>
                  <p className="text-sm text-slate-500">{formatTimeAgo(selectedPhoto.created_at)}</p>
                </div>
              </div>
              <button
                onClick={closePhotoModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex max-h-[calc(95vh-120px)]">
              {/* Left side - Photo */}
              <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative min-h-[500px]">
                {/* Navigation arrows */}
                {selectedPhoto.index > 0 && (
                  <button
                    onClick={() => navigatePhoto('prev')}
                    className="absolute left-6 z-10 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    ←
                  </button>
                )}
                
                {selectedPhoto.index < photos.length - 1 && (
                  <button
                    onClick={() => navigatePhoto('next')}
                    className="absolute right-6 z-10 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    →
                  </button>
                )}
                
                <img 
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.alt_text || selectedPhoto.caption || `Photo ${selectedPhoto.index + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Right side - Details and Comments */}
              <div className="w-96 flex flex-col bg-white">
                {/* Caption */}
                {selectedPhoto.caption && (
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {organization?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">
                          <span className="font-semibold text-slate-900">{organization?.name}</span>{' '}
                          <span className="text-slate-700">{selectedPhoto.caption}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments area */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Comments feature coming soon</p>
                    <p className="text-xs text-slate-400 mt-1">Share your thoughts and engage with the community</p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="border-t border-slate-200 p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6">
                      {session?.user ? (
                        <button 
                          onClick={() => toggleLike(selectedPhoto.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                            userLikes.has(selectedPhoto.id)
                              ? 'text-red-500 bg-red-50 hover:bg-red-100'
                              : 'text-slate-600 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart className={`w-6 h-6 ${userLikes.has(selectedPhoto.id) ? 'fill-current' : ''}`} />
                          <span className="font-medium">{selectedPhoto.likes_count || 0}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 p-2 text-slate-400">
                          <Heart className="w-6 h-6" />
                          <span className="font-medium">{selectedPhoto.likes_count || 0}</span>
                        </div>
                      )}
                      <button className="flex items-center gap-2 p-2 text-slate-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <MessageCircle className="w-6 h-6" />
                        <span className="font-medium">{selectedPhoto.comments_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 p-2 text-slate-600 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                        <Share className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm font-semibold text-slate-900 mb-2">
                    {selectedPhoto.likes_count > 0 && (
                      <span>{selectedPhoto.likes_count} {selectedPhoto.likes_count === 1 ? 'like' : 'likes'}</span>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>{selectedPhoto.index + 1} of {photos.length}</span>
                    <span>Press ESC to close</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPhotos;