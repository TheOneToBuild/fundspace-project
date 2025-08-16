// src/components/CreatePost/ImageUpload.jsx
import React from 'react';
import { X } from 'lucide-react';

export default function ImageUpload({ 
  selectedImages, 
  onImageSelect, 
  onRemoveImage, 
  fileInputRef,
  uploading 
}) {
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const maxImages = 6;
    
    if (selectedImages.length + files.length > maxImages) {
      alert(`You can only add up to ${maxImages} images per post.`);
      return;
    }

    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );

    if (validFiles.length < files.length) {
      alert('Some images were invalid (must be under 10MB).');
    }

    if (validFiles.length > 0) {
      onImageSelect(validFiles);
    }
    
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  return (
    <>
      {/* Image previews */}
      {selectedImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {selectedImages.map((image) => (
            <div key={image.id} className="relative">
              <img 
                src={image.preview} 
                alt="Selected" 
                className="w-full h-32 object-cover rounded-lg border border-slate-200" 
              />
              <button
                onClick={() => onRemoveImage(image.id)}
                disabled={uploading}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
    </>
  );
}