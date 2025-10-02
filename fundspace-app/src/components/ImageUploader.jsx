import React, { useState, useRef } from 'react';
import { X, Camera, Loader } from './Icons.jsx';
import { useImageUpload, IMAGE_UPLOAD_PRESETS } from '../hooks/useImageUpload';

const ImageUploader = ({
  currentImageUrl,
  onImageUploaded,
  bucket = 'avatars',
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = '',
  size = 'lg',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const { images, uploading, error, handleImageSelect, removeImage, reset } = useImageUpload({
    ...IMAGE_UPLOAD_PRESETS.avatar,
    bucket,
    maxSizeMB,
    allowedTypes,
    autoUpload: true,
    onUploadComplete: (urls) => {
      onImageUploaded?.(urls[0]);
    },
    onError: () => onImageUploaded?.(currentImageUrl || ''),
  });

  const sizeConfig = {
    sm: { container: 'w-16 h-16', icon: 16, text: 'text-xs' },
    md: { container: 'w-24 h-24', icon: 20, text: 'text-sm' },
    lg: { container: 'w-32 h-32', icon: 24, text: 'text-base' },
  };
  const config = sizeConfig[size];

  const preview = images[0]?.uploaded && images[0]?.url ? images[0].url : images[0]?.preview || currentImageUrl || '';

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageSelect(e);
  };

  const handleRemoveImage = () => {
    reset();
    onImageUploaded?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleImageSelect}
        className="hidden"
        disabled={uploading}
      />

      <div
        className={`
          relative ${config.container} rounded-full border-2 border-dashed cursor-pointer
          transition-all duration-200 overflow-hidden
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={!uploading ? () => fileInputRef.current?.click() : undefined}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover rounded-full"
              onError={() => onImageUploaded?.('')}
            />
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                title="Remove image"
              >
                <X size={12} />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            {uploading ? (
              <Loader size={config.icon} className="animate-spin" />
            ) : (
              <>
                <Camera size={config.icon} className="mb-1" />
                <span className={`${config.text} font-medium text-center px-2`}>
                  {size === 'sm' ? 'Add' : 'Upload Photo'}
                </span>
              </>
            )}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
            <Loader size={config.icon} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      {!error && size === 'lg' && (
        <p className="mt-2 text-xs text-slate-500 text-center">
          PNG, JPG, GIF up to {maxSizeMB}MB
        </p>
      )}
    </div>
  );
};

export default ImageUploader;