// src/components/organization-profile/MissionEditModal.jsx
import React, { useState } from 'react';
import { Upload, Trash2, Save } from 'lucide-react';
import EditModal from './shared/EditModal.jsx';
import GradientButton from './shared/GradientButton.jsx';
import FormField, { FormTextarea, FormInput } from './shared/FormField.jsx';
import FocusAreasManager from './FocusAreasManager.jsx';

const MissionEditModal = ({
  isOpen,
  onClose,
  organization,
  onSave,
  saving = false,
  uploading = false,
  error = '',
  onImageUpload
}) => {
  const [editData, setEditData] = useState({
    description: organization?.description || '',
    mission_image_url: organization?.mission_image_url || '',
    focusAreas: organization?.focusAreas || []
  });

  const handleSave = async () => {
    await onSave(editData);
  };

  const handleImageUpload = async (file) => {
    const success = await onImageUpload(file);
    if (success) {
      // Update the editData with the new image URL
      // Note: The parent should handle updating the actual URL
    }
  };

  const handleImageUrlChange = (e) => {
    setEditData({ ...editData, mission_image_url: e.target.value });
  };

  const removeImage = () => {
    setEditData({ ...editData, mission_image_url: '' });
  };

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={onClose}
        disabled={saving}
        className="flex-1 px-6 py-3 text-slate-600 font-medium text-sm border-2 border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
      >
        Cancel
      </button>
      <GradientButton
        onClick={handleSave}
        disabled={saving}
        loading={saving}
        className="flex-1"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save All Changes'}
      </GradientButton>
    </div>
  );

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Mission Section"
      subtitle="Update your mission statement, image, and focus areas"
      maxWidth="max-w-4xl"
      footer={footer}
      gradientColors={['purple-300', 'pink-300', 'blue-300']}
    >
      <div className="space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            {/* Mission Description */}
            <FormField label="Mission Statement" labelColor="purple-400">
              <FormTextarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Describe your organization's mission and goals..."
                rows={6}
              />
            </FormField>

            {/* Focus Areas */}
            <FocusAreasManager
              focusAreas={editData.focusAreas}
              onChange={(newFocusAreas) => setEditData({ ...editData, focusAreas: newFocusAreas })}
              editable={true}
            />
          </div>

          {/* Right Column - Image */}
          <div className="space-y-6">
            <FormField label="Mission Image" labelColor="blue-400">
              {/* Current Image Preview */}
              <div className="mb-4 relative">
                <img 
                  src={editData.mission_image_url || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop'} 
                  alt="Mission" 
                  className="w-full h-64 object-cover rounded-xl border-2 border-slate-200" 
                />
                {editData.mission_image_url && editData.mission_image_url !== 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop' && (
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                    className="hidden"
                    id="mission-image-upload"
                  />
                  <label
                    htmlFor="mission-image-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </>
                    )}
                  </label>
                  <span className="text-sm text-slate-500">or paste URL below</span>
                </div>

                <FormInput
                  type="url"
                  value={editData.mission_image_url}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Loading State */}
        {saving && (
          <div className="relative overflow-hidden bg-white border-2 border-purple-100 rounded-xl p-4">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-xl opacity-30"></div>
            </div>
            <div className="relative flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
              <span className="text-sm font-medium text-purple-700">
                Saving your changes...
              </span>
            </div>
          </div>
        )}
      </div>
    </EditModal>
  );
};

export default MissionEditModal;