// src/components/organization-profile/BasicInfoEditSection.jsx
import React, { useState } from 'react';
import { 
  Edit3, Save, X, MapPin, ExternalLink, 
  CheckCircle, Sparkles 
} from 'lucide-react';

const BasicInfoEditSection = ({ 
  organization, 
  canEdit, 
  onSave, 
  saving, 
  typeInfo 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: organization?.name || '',
    location: organization?.location || '',
    website: organization?.website || '',
    year_founded: organization?.year_founded || ''
  });

  const handleSave = async () => {
    const updateData = {};
    
    if (editData.name !== organization.name) updateData.name = editData.name;
    if (editData.location !== organization.location) updateData.location = editData.location;
    if (editData.website !== organization.website) updateData.website = editData.website;
    if (editData.year_founded !== organization.year_founded) {
      updateData.year_founded = editData.year_founded ? parseInt(editData.year_founded) : null;
    }

    if (Object.keys(updateData).length === 0) {
      setIsEditing(false);
      return;
    }

    await onSave(updateData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: organization?.name || '',
      location: organization?.location || '',
      website: organization?.website || '',
      year_founded: organization?.year_founded || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="flex-1 py-4">
      {/* Type Badge and Year Founded */}
      <div className="flex items-center gap-3 mb-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${typeInfo.gradient} text-white`}>
          <Sparkles className="w-4 h-4 mr-2" />
          {typeInfo.label}
        </span>
        
        {/* Editable Year Founded */}
        {isEditing ? (
          <input
            type="number"
            value={editData.year_founded}
            onChange={(e) => setEditData({ ...editData, year_founded: e.target.value })}
            placeholder="Year Founded"
            className="text-slate-500 font-medium text-sm border border-slate-300 rounded px-2 py-1 w-24"
            min="1800"
            max={new Date().getFullYear()}
          />
        ) : (
          <>
            {organization.year_founded && (
              <span className="text-slate-500 font-medium text-sm">
                Since {organization.year_founded}
              </span>
            )}
            {canEdit && !organization.year_founded && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                Add year founded
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Organization Name and Verification */}
      <div className="flex items-center gap-3 mb-3">
        {isEditing ? (
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="text-4xl font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent flex-1"
            placeholder="Organization Name"
          />
        ) : (
          <>
            <h1 className="text-4xl font-bold text-slate-900">{organization.name}</h1>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Edit basic info"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </>
        )}
        {organization.isVerified && (
          <CheckCircle className="w-7 h-7 text-blue-500" />
        )}
      </div>
      
      {/* Location and Website */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Location */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-800" />
            <input
              type="text"
              value={editData.location}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              placeholder="Add location"
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <>
            {organization.location ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                <MapPin className="w-4 h-4" />
                {organization.location}
              </span>
            ) : (
              canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                >
                  <MapPin className="w-4 h-4" />
                  Add location
                </button>
              )
            )}
          </>
        )}

        {/* Website */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-purple-800" />
            <input
              type="url"
              value={editData.website}
              onChange={(e) => setEditData({ ...editData, website: e.target.value })}
              placeholder="https://website.com"
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 outline-none focus:border-purple-500"
            />
          </div>
        ) : (
          <>
            {organization.website ? (
              <a 
                href={organization.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            ) : (
              canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Add website
                </button>
              )
            )}
          </>
        )}
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default BasicInfoEditSection;