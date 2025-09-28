import React, { useState } from 'react';
import { Heart, MessageCircle, Star, X } from 'lucide-react';

const PhotoPreviewSection = ({ 
  photos = [], 
  title = "Community in Action",
  canEdit = false,
  onViewAll,
  onEditPhotos,
  organization
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handlePhotoClick = (photo, index) => {
    setSelectedPhoto({
      ...photo,
      index,
      src: photo.url || photo,
      caption: photo.caption,
      alt_text: photo.alt_text,
      is_featured: photo.is_featured
    });
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  const nextPhoto = () => {
    if (selectedPhoto && selectedPhoto.index < photos.length - 1) {
      handlePhotoClick(photos[selectedPhoto.index + 1], selectedPhoto.index + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto && selectedPhoto.index > 0) {
      handlePhotoClick(photos[selectedPhoto.index - 1], selectedPhoto.index - 1);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {canEdit && (
            <button 
              onClick={onEditPhotos}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Add Photos
            </button>
          )}
        </div>
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-2">📷</div>
          <p>No photos uploaded yet</p>
          {canEdit && (
            <button 
              onClick={onEditPhotos}
              className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Add Photos
            </button>
          )}
        </div>
      </div>
    );
  }

  const visiblePhotos = photos.slice(0, 5);

  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button 
                onClick={onEditPhotos}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Edit Photos
              </button>
            )}
            <button 
              onClick={onViewAll}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 h-80">
          {visiblePhotos[0] && (
            <div 
              className="col-span-2 row-span-2 rounded-lg overflow-hidden cursor-pointer group relative"
              onClick={() => handlePhotoClick(visiblePhotos[0], 0)}
            >
              <img 
                src={visiblePhotos[0].url || visiblePhotos[0]} 
                alt={visiblePhotos[0].alt_text || "Featured photo"}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {visiblePhotos[0].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">{visiblePhotos[0].caption}</p>
                </div>
              )}
            </div>
          )}

          {visiblePhotos[1] && (
            <div 
              className="col-span-2 rounded-lg overflow-hidden cursor-pointer group relative"
              onClick={() => handlePhotoClick(visiblePhotos[1], 1)}
            >
              <img 
                src={visiblePhotos[1].url || visiblePhotos[1]} 
                alt={visiblePhotos[1].alt_text || "Photo 2"}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {visiblePhotos[1].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">{visiblePhotos[1].caption}</p>
                </div>
              )}
            </div>
          )}

          {visiblePhotos[2] && (
            <div 
              className="rounded-lg overflow-hidden cursor-pointer group relative"
              onClick={() => handlePhotoClick(visiblePhotos[2], 2)}
            >
              <img 
                src={visiblePhotos[2].url || visiblePhotos[2]} 
                alt={visiblePhotos[2].alt_text || "Photo 3"}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {visiblePhotos[2].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">{visiblePhotos[2].caption}</p>
                </div>
              )}
            </div>
          )}

          {visiblePhotos[3] && (
            <div 
              className="rounded-lg overflow-hidden cursor-pointer group relative"
              onClick={() => handlePhotoClick(visiblePhotos[3], 3)}
            >
              <img 
                src={visiblePhotos[3].url || visiblePhotos[3]} 
                alt={visiblePhotos[3].alt_text || "Photo 4"}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              
              {photos.length > 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    +{photos.length - 4} more
                  </span>
                </div>
              )}

              {photos.length <= 4 && visiblePhotos[3].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">{visiblePhotos[3].caption}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[500px]">
              {selectedPhoto.index > 0 && (
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  ←
                </button>
              )}
              
              {selectedPhoto.index < photos.length - 1 && (
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  →
                </button>
              )}
              
              <img 
                src={selectedPhoto.src}
                alt={selectedPhoto.alt_text || `Photo ${selectedPhoto.index + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="w-96 flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {organization?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{organization?.name}</h3>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
                <button
                  onClick={closePhoto}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col">
                {selectedPhoto.caption && (
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {organization?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">{organization?.name}</span>{' '}
                          {selectedPhoto.caption}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  <div className="text-xs text-slate-500 text-center">
                    Comments will be available in future updates
                  </div>
                </div>

                <div className="border-t border-slate-200 p-4">
                  <div className="text-xs text-slate-500">
                    {selectedPhoto.index + 1} of {photos.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoPreviewSection;