// src/components/CreatePost/hooks/useImageUpload.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

export const useImageUpload = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const addImages = (files) => {
    const imageObjects = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    setSelectedImages(prev => [...prev, ...imageObjects]);
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      const removedImage = prev.find(img => img.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.preview);
      }
      return updated;
    });
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) return [];
    
    setUploading(true);
    try {
      const uploadPromises = selectedImages.map(async (imageObj) => {
        const fileExt = imageObj.file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(fileName, imageObj.file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      });

      return Promise.all(uploadPromises);
    } finally {
      setUploading(false);
    }
  };

  const clearImages = () => {
    selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setSelectedImages([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  return {
    selectedImages,
    uploading,
    addImages,
    removeImage,
    uploadImages,
    clearImages
  };
};