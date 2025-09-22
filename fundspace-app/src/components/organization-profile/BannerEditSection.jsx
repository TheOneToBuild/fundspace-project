// Enhanced BannerEditSection with drag-to-reposition functionality
import React, { useState, useRef, useCallback } from 'react';
import { Camera, Trash2, LinkIcon, X, Move } from 'lucide-react';

const BannerEditSection = ({ 
  organization, 
  canEdit, 
  onSave, 
  saving, 
  uploading 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [bannerPosition, setBannerPosition] = useState(organization.banner_position || { x: 50, y: 50 }); // Percentage values
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bannerInputRef = useRef(null);
  const bannerRef = useRef(null);

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
    setBannerPosition({ x: 50, y: 50 });
  };

  const handleMouseDown = useCallback((e) => {
    if (!isRepositioning) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [isRepositioning]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !isRepositioning) return;
    
    const container = bannerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Convert pixel movement to percentage
    const percentageChangeX = (deltaX / containerRect.width) * 100;
    const percentageChangeY = (deltaY / containerRect.height) * 100;
    
    const newPosition = {
      x: Math.max(0, Math.min(100, bannerPosition.x - percentageChangeX)),
      y: Math.max(0, Math.min(100, bannerPosition.y - percentageChangeY))
    };
    
    setBannerPosition(newPosition);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, isRepositioning, bannerPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Save the new position with a separate function call
    saveBannerPosition(bannerPosition);
  }, [isDragging, bannerPosition]);

  const saveBannerPosition = async (position) => {
    // Use the existing onSave function that's passed down from the parent component
    // This will use the same update mechanism as other organization data
    if (onSave) {
      try {
        await onSave({ banner_position: position }, 'banner_position', 'update');
      } catch (error) {
        console.error('Error saving banner position:', error);
      }
    }
  };

  // Add event listeners
  React.useEffect(() => {
    if (isRepositioning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isRepositioning, handleMouseMove, handleMouseUp]);

  const toggleRepositioning = () => {
    setIsRepositioning(!isRepositioning);
    if (isRepositioning) {
      // Save final position when exiting reposition mode
      saveBannerPosition(bannerPosition);
    }
  };

  return (
    <>
      <div 
        ref={bannerRef}
        className="relative h-80 bg-slate-200 overflow-hidden"
      >
        {organization.banner_image_url ? (
          <div 
            className={`w-full h-full ${isRepositioning ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <img 
              src={organization.banner_image_url} 
              alt="Organization banner" 
              className="w-full h-full object-cover pointer-events-none"
              style={{
                objectPosition: `${bannerPosition.x}% ${bannerPosition.y}%`,
                transition: isDragging ? 'none' : 'object-position 0.2s ease'
              }}
              draggable={false}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white via-stone-50 to-stone-100 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg">No banner image</p>
            </div>
          </div>
        )}
        
        {/* Repositioning Overlay */}
        {isRepositioning && organization.banner_image_url && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
            <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2">
              <Move className="w-4 h-4" />
              Drag to reposition banner
            </div>
          </div>
        )}

        {/* Edit Controls */}
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-2">
            {organization.banner_image_url && (
              <button
                onClick={toggleRepositioning}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium text-sm shadow-sm transition-colors ${
                  isRepositioning 
                    ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300' 
                    : 'bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700'
                }`}
              >
                <Move className="w-4 h-4" />
                {isRepositioning ? 'Done' : 'Reposition'}
              </button>
            )}
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
        )}
      </div>

      {/* Edit Modal - Simplified */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl transform transition-all overflow-hidden">
            {/* Header */}
            <div className="relative p-6 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-2xl opacity-60 -translate-x-8 -translate-y-8"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-xl opacity-50 translate-x-4 -translate-y-4"></div>
              </div>
              
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
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200"
                  />
                  <button
                    onClick={handleUrlSave}
                    disabled={!urlInput.trim() || saving}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* File Upload Option */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                  Upload from Device
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors group-hover:bg-slate-50">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Choose Image File
                  </button>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                  <p className="text-xs text-slate-400 mt-2">💡 Tip: After uploading, click "Reposition" to drag and adjust the image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BannerEditSection;