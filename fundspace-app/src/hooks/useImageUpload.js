// hooks/useImageUpload.js - Universal Image Upload Hook
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Universal image upload hook for all upload scenarios
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.bucket - Storage bucket name (default: 'avatars')
 * @param {string} config.folder - Optional subfolder within bucket (e.g., 'comments/')
 * @param {number} config.maxImages - Maximum number of images (default: 1)
 * @param {number} config.maxSizeMB - Maximum file size in MB (default: 10)
 * @param {Array} config.allowedTypes - Allowed MIME types
 * @param {boolean} config.autoUpload - Upload immediately on selection (default: false)
 * @param {Function} config.onUploadComplete - Callback after successful upload
 * @param {Function} config.onError - Error callback
 * 
 * @returns {Object} Image upload state and methods
 */
export const useImageUpload = ({
  bucket = 'avatars',
  folder = '',
  maxImages = 1,
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  autoUpload = false,
  onUploadComplete = null,
  onError = null
} = {}) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Validate a single file
  const validateFile = useCallback((file) => {
    if (!allowedTypes.includes(file.type)) {
      const typesStr = allowedTypes.map(t => t.replace('image/', '')).join(', ').toUpperCase();
      throw new Error(`Invalid file type. Allowed: ${typesStr}`);
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    return true;
  }, [allowedTypes, maxSizeMB]);

  // Generate unique filename
  const generateFileName = useCallback((file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const prefix = folder ? `${folder.replace(/\/$/, '')}/` : '';
    return `${prefix}${bucket}-${timestamp}-${randomString}.${extension}`;
  }, [bucket, folder]);

  // Handle file selection
  const handleImageSelect = useCallback(async (event) => {
    try {
      setError('');
      const files = event.target?.files ? Array.from(event.target.files) : 
                    event.dataTransfer?.files ? Array.from(event.dataTransfer.files) :
                    Array.isArray(event) ? event : [event];

      if (files.length === 0) return;

      // Check max images limit
      const availableSlots = maxImages - images.length;
      if (availableSlots <= 0) {
        throw new Error(`Maximum ${maxImages} image${maxImages > 1 ? 's' : ''} allowed`);
      }

      // Validate and filter files
      const validFiles = [];
      const errors = [];

      for (const file of files.slice(0, availableSlots)) {
        try {
          validateFile(file);
          validFiles.push(file);
        } catch (err) {
          errors.push(`${file.name}: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        setError(errors.join('\n'));
      }

      if (validFiles.length === 0) return;

      // Create preview objects
      const imageObjects = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uploaded: false,
        url: null
      }));

      setImages(prev => [...prev, ...imageObjects]);

      // Auto-upload if enabled
      if (autoUpload && validFiles.length > 0) {
        await uploadImages([...images, ...imageObjects]);
      }

      // Reset file input if it's an event
      if (event.target?.value) {
        event.target.value = '';
      }
    } catch (err) {
      setError(err.message);
      if (onError) onError(err);
    }
  }, [images, maxImages, validateFile, autoUpload, onError]);

  // Remove an image
  const removeImage = useCallback((imageId) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      const removedImage = prev.find(img => img.id === imageId);
      
      // Cleanup preview URL
      if (removedImage?.preview) {
        URL.revokeObjectURL(removedImage.preview);
      }
      
      return updated;
    });
    setError('');
  }, []);

  // Upload single image to storage
  const uploadSingleImage = useCallback(async (imageObj) => {
    const fileName = generateFileName(imageObj.file);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, imageObj.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  }, [bucket, generateFileName]);

  // Upload all images
  const uploadImages = useCallback(async (imagesToUpload = null) => {
    const targetImages = imagesToUpload || images;
    const unuploadedImages = targetImages.filter(img => !img.uploaded);

    if (unuploadedImages.length === 0) {
      // Return already uploaded URLs
      return targetImages.filter(img => img.url).map(img => img.url);
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const uploadPromises = unuploadedImages.map(async (imageObj, index) => {
        const url = await uploadSingleImage(imageObj);
        
        // Update progress
        setUploadProgress(Math.round(((index + 1) / unuploadedImages.length) * 100));
        
        // Update image object
        return { ...imageObj, url, uploaded: true };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const uploadedUrls = uploadedImages.map(img => img.url);

      // Update state with uploaded images
      setImages(prev => {
        const updated = [...prev];
        uploadedImages.forEach(uploaded => {
          const index = updated.findIndex(img => img.id === uploaded.id);
          if (index !== -1) {
            updated[index] = uploaded;
          }
        });
        return updated;
      });

      if (onUploadComplete) {
        onUploadComplete(uploadedUrls);
      }

      return uploadedUrls;
    } catch (err) {
      const errorMsg = err.message || 'Upload failed';
      setError(errorMsg);
      if (onError) onError(err);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [images, uploadSingleImage, onUploadComplete, onError]);

  // Get all image URLs (uploaded only)
  const getImageUrls = useCallback(() => {
    return images.filter(img => img.uploaded && img.url).map(img => img.url);
  }, [images]);

  // Clear all images
  const clearImages = useCallback(() => {
    images.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setImages([]);
    setError('');
  }, [images]);

  // Reset to initial state
  const reset = useCallback(() => {
    clearImages();
    setUploading(false);
    setError('');
    setUploadProgress(0);
  }, [clearImages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  return {
    // State
    images,
    uploading,
    error,
    uploadProgress,
    hasImages: images.length > 0,
    canAddMore: images.length < maxImages,
    
    // Methods
    handleImageSelect,
    removeImage,
    uploadImages,
    getImageUrls,
    clearImages,
    reset,
    
    // Utility
    setError
  };
};

// Preset configurations for common use cases
export const IMAGE_UPLOAD_PRESETS = {
  // Avatar upload (single, 5MB max)
  avatar: {
    bucket: 'avatars',
    folder: '',
    maxImages: 1,
    maxSizeMB: 5,
    autoUpload: false
  },
  
  // Comment images (1 image, 10MB max, comments subfolder in avatars)
  comment: {
    bucket: 'avatars',
    folder: 'comments',
    maxImages: 1,
    maxSizeMB: 10,
    autoUpload: false
  },
  
  // Post images (up to 6 images, 10MB max each)
  post: {
    bucket: 'post-images',
    folder: '',
    maxImages: 6,
    maxSizeMB: 10,
    autoUpload: false
  },
  
  // Organization logo (single, 5MB max)
  organizationLogo: {
    bucket: 'avatars',
    folder: 'organizations',
    maxImages: 1,
    maxSizeMB: 5,
    autoUpload: false
  },
  
  // Organization photos (multiple, 5MB max each)
  organizationPhotos: {
    bucket: 'avatars',
    folder: 'organizations/photos',
    maxImages: 10,
    maxSizeMB: 5,
    autoUpload: false
  }
};

export default useImageUpload;