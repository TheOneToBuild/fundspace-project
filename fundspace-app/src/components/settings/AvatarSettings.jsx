import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// Icons
const LoaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;

const EnhancedAvatar = ({ src, fullName, size = "20", className = "" }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(word => word.length > 0).map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getBackgroundColor = (name) => {
    if (!name) return 'bg-slate-500';
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden ${className}`}>
      {src && !imageError ? (
        <img src={src} alt={fullName || 'Avatar'} className="w-full h-full object-cover" onError={() => setImageError(true)} />
      ) : (
        <div className={`w-full h-full ${getBackgroundColor(fullName)} flex items-center justify-center text-white font-semibold text-sm`}>
          {getInitials(fullName)}
        </div>
      )}
    </div>
  );
};

const EnhancedImageUploader = ({ onImageUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const validateAndUploadFile = async (file) => {
    try {
      setError('');
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) throw new Error('Please select a valid image file (JPG, PNG, WebP).');
      if (file.size > 5 * 1024 * 1024) throw new Error('Image file size must be less than 5MB.');

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (!urlData?.publicUrl) throw new Error('Failed to get public URL for uploaded image');

      await onImageUploaded(urlData.publicUrl);
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => e.target.files?.[0] && validateAndUploadFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); e.dataTransfer.files?.[0] && validateAndUploadFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  return (
    <div>
      <label htmlFor="avatarUpload" className={`cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium transition-all ${uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-700 bg-white hover:bg-slate-50'} ${dragOver ? 'border-blue-400 bg-blue-50' : ''}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        {uploading ? <><LoaderIcon /> Uploading...</> : <><UploadIcon /> Upload Picture</>}
      </label>
      <input id="avatarUpload" type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileInput} disabled={uploading} />
      <p className="text-xs text-slate-500 mt-2">PNG, JPG, WebP up to 5MB.</p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default function AvatarSettings({ avatarUrl, fullName, onImageUploaded, onImageRemoved }) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <EnhancedAvatar
        src={avatarUrl}
        fullName={fullName}
        size="20"
        className="flex-shrink-0"
        key={avatarUrl}
      />
      <div className="flex flex-col space-y-2">
        <EnhancedImageUploader
          onImageUploaded={onImageUploaded}
        />
        {avatarUrl && (
          <button
            type="button"
            onClick={onImageRemoved}
            className="text-xs text-slate-500 hover:text-red-600 hover:underline transition-colors"
          >
            Remove Picture
          </button>
        )}
      </div>
    </div>
  );
}