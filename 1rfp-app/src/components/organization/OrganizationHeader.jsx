// components/organization/OrganizationHeader.jsx - Complete Fixed Version
import React, { useState, useRef } from 'react';
import { 
    MapPin, Globe, Mail, Edit, LogOut, Trash2, Settings, 
    Crown, Shield, Users, Star, MoreVertical, Upload, Camera, X 
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { 
    hasPermission, 
    PERMISSIONS, 
    ROLES, 
    getRoleDisplayName, 
    getRoleBadgeColor,
    getOrgTypeIcon,
    getOrgTypeLabel
} from '../../utils/organizationPermissions.js';

export default function OrganizationHeader({ 
    organization, 
    userMembership, 
    profile, 
    onUpdate, 
    onLeave, 
    onDelete, 
    setError 
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editingData, setEditingData] = useState({});
    const [saving, setSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const isOmegaAdmin = profile?.is_omega_admin === true;
    const userRole = userMembership?.role;
    
    // Permission checks
    const canEditOrg = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);
    const canDeleteOrg = hasPermission(userRole, PERMISSIONS.DELETE_ORGANIZATION, isOmegaAdmin);
    const canLeave = !isOmegaAdmin && userMembership;

    const startEditing = () => {
        setIsEditing(true);
        setShowDropdown(false);
        setEditingData({
            name: organization.name || '',
            tagline: organization.tagline || '',
            description: organization.description || '',
            website: organization.website || '',
            location: organization.location || '',
            contact_email: organization.contact_email || ''
        });
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditingData({});
        setError('');
    };

    const saveChanges = async () => {
        if (!canEditOrg || !editingData.name?.trim()) return;

        try {
            setSaving(true);
            setError('');

            const updateData = {
                name: editingData.name,
                tagline: editingData.tagline || null,
                description: editingData.description || null,
                website: editingData.website || null,
                location: editingData.location || null,
                contact_email: editingData.contact_email || null,
            };

            const success = await onUpdate(updateData);
            
            if (success) {
                setIsEditing(false);
                setEditingData({});
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file (JPG, PNG, GIF, etc.).');
                return;
            }
            
            // Validate file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setError('Image size must be less than 2MB.');
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!imagePreview || !fileInputRef.current?.files[0]) return;

        try {
            setUploading(true);
            setError('');

            const file = fileInputRef.current.files[0];
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const fileName = `organization-logos/${organization.id}_${timestamp}.${fileExt}`;
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('organization-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
                .from('organization-images')
                .getPublicUrl(fileName);

            if (!urlData?.publicUrl) {
                throw new Error('Failed to get public URL for uploaded image');
            }

            // Update organization with new image URL
            const success = await onUpdate({ 
                image_url: urlData.publicUrl
            });

            if (success) {
                setShowImageUpload(false);
                setImagePreview(null);
                
                // Clear the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (err) {
            console.error('Image upload error:', err);
            setError(err.message || 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = async () => {
        try {
            setUploading(true);
            setError('');
            
            // Extract filename from the current image URL to delete it
            const currentImageUrl = organization.image_url || organization.logo_url;
            if (currentImageUrl && currentImageUrl.includes('organization-images/')) {
                const urlParts = currentImageUrl.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const fullPath = `organization-logos/${fileName}`;
                
                // Delete from storage (optional - you might want to keep old images)
                await supabase.storage
                    .from('organization-images')
                    .remove([fullPath]);
            }
            
            const success = await onUpdate({ 
                image_url: null
            });

            if (success) {
                setShowImageUpload(false);
                setImagePreview(null);
            }
        } catch (err) {
            console.error('Image removal error:', err);
            setError('Failed to remove image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between flex-wrap gap-4">
                {/* Organization Info */}
                <div className="flex items-center space-x-4 flex-1">
                    {/* Logo with upload functionality */}
                    <div className="relative group">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {organization.image_url || organization.logo_url ? (
                                <img 
                                    src={organization.image_url || organization.logo_url} 
                                    alt={organization.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl">{getOrgTypeIcon(organization.type)}</span>
                            )}
                        </div>
                        {canEditOrg && !isEditing && (
                            <button
                                onClick={() => setShowImageUpload(true)}
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Camera className="w-5 h-5 text-white" />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={editingData.name}
                                    onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                                    className="text-2xl font-bold text-slate-800 bg-white border border-slate-300 rounded px-3 py-1 w-full max-w-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Organization Name"
                                    required
                                />
                                <input
                                    type="text"
                                    value={editingData.tagline}
                                    onChange={(e) => setEditingData(prev => ({ ...prev, tagline: e.target.value }))}
                                    className="text-slate-600 bg-white border border-slate-300 rounded px-3 py-1 w-full max-w-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Organization tagline"
                                />
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{organization.name}</h1>
                                {organization.tagline && <p className="text-slate-600 mt-1">{organization.tagline}</p>}
                                <div className="flex items-center mt-2 text-sm text-slate-500 flex-wrap gap-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole, isOmegaAdmin)}`}>
                                        {userRole === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1.5" />}
                                        {userRole === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1.5" />}
                                        {userRole === ROLES.MEMBER && <Users className="w-3 h-3 mr-1.5" />}
                                        {isOmegaAdmin && <Star className="w-3 h-3 mr-1.5" />}
                                        {getRoleDisplayName(userRole, isOmegaAdmin)}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="flex items-center">
                                        <span className="mr-1">{getOrgTypeIcon(organization.type)}</span>
                                        {getOrgTypeLabel(organization.type)}
                                    </span>
                                    {organization.location && (
                                        <>
                                            <span className="text-slate-400">•</span>
                                            <span className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-1.5" />
                                                {organization.location}
                                            </span>
                                        </>
                                    )}
                                    {organization.website && (
                                        <>
                                            <span className="text-slate-400">•</span>
                                            <span className="flex items-center">
                                                <Globe className="w-4 h-4 mr-1.5" />
                                                <a 
                                                    href={organization.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Website
                                                </a>
                                            </span>
                                        </>
                                    )}
                                    {organization.contact_email && (
                                        <>
                                            <span className="text-slate-400">•</span>
                                            <span className="flex items-center">
                                                <Mail className="w-4 h-4 mr-1.5" />
                                                <a 
                                                    href={`mailto:${organization.contact_email}`}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Contact
                                                </a>
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Action Dropdown */}
                <div className="relative flex-shrink-0">
                    {isEditing ? (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={cancelEditing}
                                disabled={saving}
                                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving || !editingData.name?.trim()}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Settings className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                            
                            {showDropdown && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setShowDropdown(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                                        <div className="py-1">
                                            {canEditOrg && (
                                                <button
                                                    onClick={startEditing}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4 mr-3" />
                                                    Edit Organization
                                                </button>
                                            )}
                                            {canLeave && (
                                                <button
                                                    onClick={() => {
                                                        setShowDropdown(false);
                                                        onLeave();
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4 mr-3" />
                                                    Leave Organization
                                                </button>
                                            )}
                                            {canDeleteOrg && (
                                                <>
                                                    <hr className="my-1" />
                                                    <button
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            onDelete();
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-3" />
                                                        Delete Organization
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Description Section */}
            {isEditing ? (
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">About This Organization</label>
                    <textarea
                        value={editingData.description}
                        onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Describe your organization's mission, activities, and goals..."
                    />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            value={editingData.location}
                            onChange={(e) => setEditingData(prev => ({ ...prev, location: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Location"
                        />
                        <input
                            type="url"
                            value={editingData.website}
                            onChange={(e) => setEditingData(prev => ({ ...prev, website: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Website URL"
                        />
                        <input
                            type="email"
                            value={editingData.contact_email}
                            onChange={(e) => setEditingData(prev => ({ ...prev, contact_email: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Contact Email"
                        />
                    </div>

                    {/* Logo Upload Section in Edit Mode */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Organization Logo
                        </label>
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {organization.image_url || organization.logo_url ? (
                                    <img 
                                        src={organization.image_url || organization.logo_url} 
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xl">{getOrgTypeIcon(organization.type)}</span>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowImageUpload(true)}
                                    className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Upload Logo
                                </button>
                                {(organization.image_url || organization.logo_url) && (
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        disabled={uploading}
                                        className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                                    >
                                        {uploading ? 'Removing...' : 'Remove'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                organization.description && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <h3 className="text-sm font-medium text-slate-700 mb-2">About</h3>
                        <p className="text-slate-600 leading-relaxed">{organization.description}</p>
                    </div>
                )
            )}

            {/* Image Upload Modal */}
            {showImageUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">Upload Organization Logo</h3>
                            <button
                                onClick={() => {
                                    setShowImageUpload(false);
                                    setImagePreview(null);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {imagePreview ? (
                                <div className="space-y-4">
                                    <div className="w-32 h-32 mx-auto bg-slate-100 rounded-lg overflow-hidden">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            Choose Different
                                        </button>
                                        <button
                                            onClick={uploadImage}
                                            disabled={uploading}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {uploading ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Uploading...
                                                </div>
                                            ) : (
                                                'Save Logo'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
                                >
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                                    <p className="text-sm font-medium text-slate-900 mb-1">Click to upload logo</p>
                                    <p className="text-xs text-slate-500">PNG, JPG up to 2MB</p>
                                </div>
                            )}
                            
                            {(organization.image_url || organization.logo_url) && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={removeImage}
                                        disabled={uploading}
                                        className="w-full px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {uploading ? 'Removing Current Logo...' : 'Remove Current Logo'}
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}