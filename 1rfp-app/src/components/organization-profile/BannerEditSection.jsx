// src/components/organization-profile/BannerEditSection.jsx - Improved Version
import React, { useState, useRef } from 'react';
import { Camera, Trash2, LinkIcon, X } from 'lucide-react';

const BannerEditSection = ({ 
  organization, 
  canEdit, 
  onSave, 
  saving, 
  uploading 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const bannerInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    await onSave(file, 'banner', 'file');
    setIsEditing(false);
  };

  const handleUrlSave = async () => {
    if (!urlInput.trim()) return;
    
    await onSave(urlInput.trim(), 'banner', 'url');
    setIsEditing(false);
    setUrlInput('');
  };

  const handleRemove = async () => {
    await onSave(null, 'banner', 'remove');
    setIsEditing(false);
  };

  return (
    <>
      <div className="relative h-80 bg-slate-200 overflow-hidden">
        {organization.banner_image_url ? (
          <img 
            src={organization.banner_image_url} 
            alt="Organization banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white via-stone-50 to-stone-100 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg">No banner image</p>
            </div>
          </div>
        )}
        
        {/* Edit Controls - Positioned within content area */}
        {canEdit && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <div className="max-w-7xl mx-auto px-8 flex justify-end w-full">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 font-medium text-sm shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  {organization.banner_image_url ? 'Edit Banner' : 'Add Banner'}
                </button>
                {organization.banner_image_url && (
                  <button
                    onClick={handleRemove}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 font-medium text-sm shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal - Modern Organic Gradient Design */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl transform transition-all overflow-hidden">
            {/* Header with Organic Gradient */}
            <div className="relative p-6 overflow-hidden">
              {/* Organic background shapes */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-2xl opacity-60 -translate-x-8 -translate-y-8"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-xl opacity-50 translate-x-4 -translate-y-4"></div>
                <div className="absolute bottom-0 left-1/2 w-28 h-28 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-2xl opacity-40 -translate-x-1/2 translate-y-8"></div>
              </div>
              
              {/* Content over gradient */}
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Update Banner Image</h3>
                  <p className="text-slate-600 text-sm mt-1">Add a beautiful banner to your organization</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setUrlInput('');
                  }}
                  className="text-slate-600 hover:text-slate-800 transition-colors p-1 bg-white bg-opacity-50 rounded-lg backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* URL Input Option */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                  Add from URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/banner-image.jpg"
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white text-sm"
                  />
                  <button
                    onClick={handleUrlSave}
                    disabled={!urlInput.trim() || saving}
                    className="px-4 py-3 relative overflow-hidden text-white rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 group/btn"
                  >
                    {/* Organic gradient background */}
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                      <div className="absolute top-0 left-0 w-6 h-6 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-md opacity-60 group-hover/btn:scale-150 transition-transform duration-500"></div>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Add
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-slate-500 font-medium">or</span>
                </div>
              </div>
              
              {/* File Upload Option */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                  Upload from computer
                </label>
                <div className="relative overflow-hidden border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors bg-white">
                  {/* Subtle background gradient */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-xl"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                      <Camera className="w-6 h-6 text-slate-500" />
                    </div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="text-purple-600 hover:text-purple-700 font-semibold text-sm mb-2 block w-full"
                    >
                      Choose file to upload
                    </button>
                    <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {(saving || uploading) && (
                <div className="relative overflow-hidden bg-white border-2 border-purple-100 rounded-xl p-4">
                  {/* Subtle background gradient */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-xl opacity-30"></div>
                  </div>
                  <div className="relative flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
                    <span className="text-sm font-medium text-purple-700">
                      {uploading ? 'Uploading image...' : 'Saving changes...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setUrlInput('');
                }}
                disabled={saving || uploading}
                className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BannerEditSection;