import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Heart, MessageCircle, Share, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import { getOrganizationPhotosComplete } from '../../utils/rpcClientFunctions.js';

const OrganizationPhotos = ({ 
  organization, 
  userMembership, 
  session,
  currentUserProfile
}) => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;
      
      if (currentUserProfile && currentUserProfile.avatar_url) {
        setUserProfile(currentUserProfile);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();

        let profileData = null;

        if (data && !error) {
          profileData = {
            id: data.id,
            full_name: data.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar_url: data.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            email: session.user.email
          };
        } else {
          profileData = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            email: session.user.email
          };
        }
        
        setUserProfile(profileData);
        
      } catch (err) {
        console.error('Error in profile fetch:', err);
        const fallbackProfile = {
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          email: session.user.email
        };
        setUserProfile(fallbackProfile);
      }
    };

    fetchUserProfile();
  }, [session?.user?.id, currentUserProfile]);

  const fetchPhotos = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    setError('');
    try {
      const result = await getOrganizationPhotosComplete(organization.id, session?.user?.id);
      setPhotos(result.photos || []);

      // The RPC also returns user-specific likes, so we can set them here.
      const likedPhotoIds = new Set();
      (result.photos || []).forEach(photo => {
        if (photo.user_has_liked) {
          likedPhotoIds.add(photo.id);
        }
      });
      setUserLikes(likedPhotoIds);

    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, session?.user?.id]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const openPhotoModal = (photo, index) => {
    setSelectedPhoto({ ...photo, index });
    fetchComments(photo.id);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setComments([]);
    setNewComment('');
  };

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

  const [userLikes, setUserLikes] = useState(new Set());

  const fetchComments = async (photoId) => {
    if (!photoId) return;
    
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('organization_photo_comments')
        .select(`
          *,
          profiles:profile_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUserClick = (profileId) => {
    navigate(`/profile/members/${profileId}`);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user || !selectedPhoto) return;

    try {
      const { data, error } = await supabase
        .from('organization_photo_comments')
        .insert({
          photo_id: selectedPhoto.id,
          user_id: session.user.id,
          profile_id: session.user.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles:profile_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment('');

      setPhotos(prevPhotos => 
        prevPhotos.map(p => 
          p.id === selectedPhoto.id 
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        )
      );
      setSelectedPhoto(prev => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1
      }));

    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

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
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Photos</h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {photos.length > 0 ? (
        <>
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
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Camera className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-900 mb-2">No Photos Yet</h3>
          <p className="text-slate-600">
            No photos have been shared by {organization.name} yet.
          </p>
        </div>
      )}

      {selectedPhoto && (
        <div className="photo-modal-backdrop fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                {organization?.image_url ? (
                  <img 
                    src={organization.image_url} 
                    alt={`${organization?.name} logo`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {organization?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
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

            <div className="flex max-h-[calc(95vh-120px)]">
              <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative min-h-[500px]">
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

              <div className="w-96 flex flex-col bg-white">
                {selectedPhoto.caption && (
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex gap-4">
                      {organization?.image_url ? (
                        <img 
                          src={organization.image_url} 
                          alt={`${organization?.name} logo`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {organization?.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">
                          <span className="font-semibold text-slate-900">{organization?.name}</span>{' '}
                          <span className="text-slate-700">{selectedPhoto.caption}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {loadingComments ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    ) : comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <button
                              onClick={() => handleUserClick(comment.profiles?.id)}
                              className="flex-shrink-0 hover:opacity-80 transition-opacity"
                            >
                              {comment.profiles?.avatar_url ? (
                                <img 
                                  src={comment.profiles.avatar_url} 
                                  alt={comment.profiles.full_name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border border-slate-200">
                                  {comment.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <button
                                  onClick={() => handleUserClick(comment.profiles?.id)}
                                  className="font-medium text-sm text-slate-900 mb-1 hover:text-blue-600 transition-colors"
                                >
                                  {comment.profiles?.full_name || 'Anonymous'}
                                </button>
                                <div className="text-sm text-slate-700 leading-relaxed">
                                  {comment.content}
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 mt-1 ml-3">
                                {formatTimeAgo(comment.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500 font-medium">No comments yet</p>
                        <p className="text-xs text-slate-400 mt-1">Be the first to share your thoughts</p>
                      </div>
                    )}
                  </div>

                  {session?.user && (
                    <div className="border-t border-slate-200 p-4 bg-white">
                      <form onSubmit={handleAddComment} className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleUserClick(userProfile?.id)}
                          className="flex-shrink-0 hover:opacity-80 transition-opacity"
                        >
                          {userProfile?.avatar_url ? (
                            <img 
                              src={userProfile.avatar_url} 
                              alt="Your avatar"
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border border-slate-200">
                              {userProfile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </button>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 p-2 text-slate-400">
                        <Heart className="w-6 h-6" />
                        <span className="font-medium">{selectedPhoto.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 text-slate-600">
                        <MessageCircle className="w-6 h-6" />
                        <span className="font-medium">{selectedPhoto.comments_count || 0}</span>
                      </div>
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