// src/components/ImageUploader.jsx - Fixed Image Upload Component
import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, X, Camera, Loader } from './Icons.jsx';

const ImageUploader = ({ 
  currentImageUrl, 
  onImageUploaded, 
  bucket = 'avatars',
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = '',
  size = 'lg' // 'sm', 'md', 'lg'
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImageUrl || '');
  const fileInputRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-16 h-16', icon: 16, text: 'text-xs' },
    md: { container: 'w-24 h-24', icon: 20, text: 'text-sm' },
    lg: { container: 'w-32 h-32', icon: 24, text: 'text-base' }
  };

  const config = sizeConfig[size];

  const validateFile = (file) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Please select a valid image file (${allowedTypes.join(', ').replace(/image\//g, '')}).`);
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeMB}MB.`);
    }

    return true;
  };

  const generateFileName = (file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    return `${bucket}-${timestamp}-${randomString}.${extension}`;
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      setError('');

      // Validate file
      validateFile(file);

      // Generate unique filename
      const fileName = generateFileName(file);

      console.log('📤 Uploading file:', { fileName, size: file.size, type: file.type });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      const imageUrl = urlData.publicUrl;
      console.log('🔗 Public URL:', imageUrl);

      // Update preview and notify parent
      setPreview(imageUrl);
      onImageUploaded?.(imageUrl);

      return imageUrl;
    } catch (err) {
      console.error('❌ Image upload error:', err);
      setError(err.message || 'Failed to upload image');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload file
      await uploadImage(file);
    } catch (err) {
      // Error already handled in uploadImage
      setPreview(currentImageUrl || '');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageUploaded?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload area */}
      <div
        className={`
          relative ${config.container} rounded-full border-2 border-dashed cursor-pointer
          transition-all duration-200 overflow-hidden
          ${dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={!uploading ? triggerFileInput : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <>
            {/* Image preview */}
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                console.error('❌ Image load error:', e);
                setPreview('');
                setError('Failed to load image');
              }}
            />
            
            {/* Remove button */}
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

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
            <Loader size={config.icon} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      {/* Help text */}
      {!error && size === 'lg' && (
        <p className="mt-2 text-xs text-slate-500 text-center">
          PNG, JPG, GIF up to {maxSizeMB}MB
        </p>
      )}
    </div>
  );
};

export default ImageUploader;