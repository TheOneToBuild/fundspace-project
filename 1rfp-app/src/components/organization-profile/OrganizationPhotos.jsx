// src/components/organization-profile/OrganizationPhotos.jsx
import React, { useState } from 'react';
import { Camera, X, Plus, Upload } from 'lucide-react';

const OrganizationPhotos = ({ organization, photos = [], userMembership, session }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Check if user can upload photos (must be admin/super_admin member)
  const canUploadPhotos = userMembership && 
    ['admin', 'super_admin'].includes(userMembership.role);

  const openPhoto = (photo, index) => {
    setSelectedPhoto({ 
      src: photo.url || photo, 
      index,
      caption: photo.caption,
      alt_text: photo.alt_text 
    });
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  if (photos.length === 0 && !canUploadPhotos) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Camera className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-medium text-slate-900 mb-2">No Photos Yet</h3>
        <p className="text-slate-600">
          Photos from {organization?.name} will appear here when they're shared.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Photo Gallery</h2>
          <p className="text-slate-600">
            A visual journey through {organization?.name}'s work and impact
          </p>
        </div>
        
        {/* Upload Button for Admins */}
        {canUploadPhotos && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Photos
          </button>
        )}
      </div>

      {/* Upload Area for Empty State */}
      {photos.length === 0 && canUploadPhotos && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Your First Photos</h3>
          <p className="text-slate-600 mb-4">
            Share photos of your work, events, and community impact
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Camera className="w-5 h-5" />
            Choose Photos
          </button>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div 
              key={photo.id || index}
              className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              onClick={() => openPhoto(photo, index)}
            >
              <div className="aspect-w-4 aspect-h-3 bg-slate-100">
                <img 
                  src={photo.url || photo} 
                  alt={photo.alt_text || `Gallery image ${index + 1}`}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Caption Overlay */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm font-medium">{photo.caption}</p>
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Featured Badge */}
              {photo.is_featured && (
                <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Featured
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close button */}
            <button
              onClick={closePhoto}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Photo */}
            <img 
              src={selectedPhoto.src}
              alt={selectedPhoto.alt_text || `Gallery image ${selectedPhoto.index + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Caption */}
            {selectedPhoto.caption && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg max-w-md text-center">
                <p className="text-sm">{selectedPhoto.caption}</p>
              </div>
            )}
            
            {/* Photo counter */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
              {selectedPhoto.index + 1} of {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPhotos;