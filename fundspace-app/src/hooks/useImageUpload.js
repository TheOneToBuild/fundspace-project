// hooks/useImageUpload.js - Universal Image Upload Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

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

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

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

  // Upload all images - USE REF VERSION TO AVOID DEPENDENCY CYCLE
  const uploadImagesRef = useRef(null);
  
  uploadImagesRef.current = async (imagesToUpload = null) => {
    // Use current images from state if not provided
    let targetImages = imagesToUpload;
    if (!targetImages) {
      await new Promise(resolve => {
        setImages(prev => {
          targetImages = prev;
          resolve();
          return prev;
        });
      });
    }
    
    const unuploadedImages = targetImages.filter(img => !img.uploaded);

    if (unuploadedImages.length === 0) {
      return targetImages.filter(img => img.url).map(img => img.url);
    }

    if (!isMountedRef.current) return [];

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const uploadPromises = unuploadedImages.map(async (imageObj, index) => {
        const url = await uploadSingleImage(imageObj);
        
        if (isMountedRef.current) {
          setUploadProgress(Math.round(((index + 1) / unuploadedImages.length) * 100));
        }
        
        return { ...imageObj, url, uploaded: true };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const uploadedUrls = uploadedImages.map(img => img.url);

      if (isMountedRef.current) {
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
      }

      return uploadedUrls;
    } catch (err) {
      const errorMsg = err.message || 'Upload failed';
      if (isMountedRef.current) {
        setError(errorMsg);
      }
      if (onError) onError(err);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Handle file selection - use state updater pattern to access current images
  const handleImageSelect = useCallback(async (event) => {
    try {
      setError('');
      const files = event.target?.files ? Array.from(event.target.files) : 
                    event.dataTransfer?.files ? Array.from(event.dataTransfer.files) :
                    Array.isArray(event) ? event : [event];

      if (files.length === 0) return;

      // Get current images count
      let currentImagesCount = 0;
      setImages(prev => {
        currentImagesCount = prev.length;
        return prev;
      });

      // Check max images limit
      const availableSlots = maxImages - currentImagesCount;
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

      // Store both current and new images for auto-upload
      let allImages = [];
      setImages(prev => {
        allImages = [...prev, ...imageObjects];
        return allImages;
      });

      // Auto-upload if enabled - USE REF TO AVOID DEPENDENCY CYCLE
      if (autoUpload && validFiles.length > 0) {
        // Use setTimeout to ensure state is updated before upload
        setTimeout(() => {
          if (uploadImagesRef.current) {
            uploadImagesRef.current(allImages);
          }
        }, 0);
      }

      // Reset file input if it's an event
      if (event.target?.value) {
        event.target.value = '';
      }
    } catch (err) {
      setError(err.message);
      if (onError) onError(err);
    }
  }, [maxImages, validateFile, autoUpload, onError]); // NO images dependency!

  // Remove an image - use state updater to avoid dependency on images
  const removeImage = useCallback((imageId) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      const removedImage = prev.find(img => img.id === imageId);
      
      if (removedImage?.preview) {
        URL.revokeObjectURL(removedImage.preview);
      }
      
      return updated;
    });
    setError('');
  }, []); // No dependencies!

  // Get all image URLs (uploaded only) - use state updater to avoid dependency
  const getImageUrls = useCallback(() => {
    let urls = [];
    setImages(prev => {
      urls = prev.filter(img => img.uploaded && img.url).map(img => img.url);
      return prev; // Don't modify state
    });
    return urls;
  }, []); // No dependencies!

  // Clear all images - use state updater to avoid dependency on images
  const clearImages = useCallback(() => {
    setImages(prev => {
      prev.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
      return [];
    });
    setError('');
  }, []); // No dependencies!

  // Reset to initial state
  const reset = useCallback(() => {
    clearImages();
    setUploading(false);
    setError('');
    setUploadProgress(0);
  }, [clearImages]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
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
    
    // Methods - wrap uploadImages to use ref
    handleImageSelect,
    removeImage,
    uploadImages: (...args) => uploadImagesRef.current?.(...args),
    getImageUrls,
    clearImages,
    reset,
    
    // Utility
    setError
  };
};

// Preset configurations for common use cases
export const IMAGE_UPLOAD_PRESETS = {
  avatar: {
    bucket: 'avatars',
    folder: '',
    maxImages: 1,
    maxSizeMB: 5,
    autoUpload: false
  },
  comment: {
    bucket: 'avatars',
    folder: 'comments',
    maxImages: 1,
    maxSizeMB: 10,
    autoUpload: false
  },
  post: {
    bucket: 'post-images',
    folder: '',
    maxImages: 6,
    maxSizeMB: 10,
    autoUpload: false
  },
  organizationLogo: {
    bucket: 'avatars',
    folder: 'organizations',
    maxImages: 1,
    maxSizeMB: 5,
    autoUpload: false
  },
  organizationPhotos: {
    bucket: 'avatars',
    folder: 'organizations/photos',
    maxImages: 10,
    maxSizeMB: 5,
    autoUpload: false
  }
};

export default useImageUpload;