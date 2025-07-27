// src/SettingsPage.jsx - Updated for Instant Organization Changes
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { addOrganizationEventListener } from './utils/organizationEvents';

// Icons - keeping your existing ones
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>;
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2-5V3" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LoaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// Enhanced Avatar Component
const EnhancedAvatar = ({ src, fullName, size = "20", className = "" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!src);

  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [src]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log('Avatar image failed to load, falling back to initials');
    setImageError(true);
    setImageLoading(false);
  };

  const shouldShowImage = src && !imageError && src.trim() !== '';

  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden ${className}`}>
      {shouldShowImage ? (
        <img
          src={src}
          alt={fullName || 'Avatar'}
          className={`w-full h-full object-cover ${imageLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div className={`w-full h-full ${getBackgroundColor(fullName)} flex items-center justify-center text-white font-semibold text-sm`}>
          {getInitials(fullName)}
        </div>
      )}
    </div>
  );
};

// Enhanced Image Uploader Component
const EnhancedImageUploader = ({ currentImageUrl, onImageUploaded, uploading, setUploading }) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const validateAndUploadFile = async (file) => {
    try {
      setError('');
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please select a valid image file (JPG, PNG, WebP).');
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image file size must be less than 5MB.');
      }

      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('🔧 Uploading to avatars bucket:', fileName);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      const imageUrl = urlData.publicUrl;
      console.log('🔗 Public URL generated:', imageUrl);

      // Call the parent callback
      await onImageUploaded(imageUrl);

      return imageUrl;
    } catch (err) {
      console.error('❌ Image upload error:', err);
      setError(err.message || 'Failed to upload image');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await validateAndUploadFile(file);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await validateAndUploadFile(file);
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

  return (
    <div>
      <label 
        htmlFor="avatarUpload" 
        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium transition-all
          ${uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-700 bg-white hover:bg-slate-50'}
          ${dragOver ? 'border-blue-400 bg-blue-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <>
            <LoaderIcon />
            Uploading...
          </>
        ) : (
          <>
            <UploadIcon />
            Upload Picture
          </>
        )}
      </label>
      <input 
        id="avatarUpload" 
        type="file" 
        className="hidden" 
        accept="image/jpeg,image/jpg,image/png,image/webp" 
        onChange={handleFileInput} 
        disabled={uploading} 
      />
      <p className="text-xs text-slate-500 mt-2">PNG, JPG, WebP up to 5MB.</p>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

// Interest Selection Component
const InterestSelector = ({ interests, onChange, loading }) => {
  const INTEREST_AREAS = [
    { id: 'housing', name: 'Housing', emoji: '🏠', color: 'bg-blue-100 text-blue-800 border-blue-200', hoverColor: 'hover:bg-blue-200' },
    { id: 'education', name: 'Education', emoji: '📚', color: 'bg-green-100 text-green-800 border-green-200', hoverColor: 'hover:bg-green-200' },
    { id: 'health', name: 'Health', emoji: '🏥', color: 'bg-red-100 text-red-800 border-red-200', hoverColor: 'hover:bg-red-200' },
    { id: 'environment', name: 'Environment', emoji: '🌱', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', hoverColor: 'hover:bg-emerald-200' },
    { id: 'arts', name: 'Arts & Culture', emoji: '🎨', color: 'bg-purple-100 text-purple-800 border-purple-200', hoverColor: 'hover:bg-purple-200' },
    { id: 'technology', name: 'Technology', emoji: '💻', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', hoverColor: 'hover:bg-indigo-200' },
    { id: 'social-services', name: 'Social Services', emoji: '🤝', color: 'bg-orange-100 text-orange-800 border-orange-200', hoverColor: 'hover:bg-orange-200' },
    { id: 'youth', name: 'Youth Programs', emoji: '👶', color: 'bg-pink-100 text-pink-800 border-pink-200', hoverColor: 'hover:bg-pink-200' },
    { id: 'seniors', name: 'Senior Services', emoji: '👴', color: 'bg-teal-100 text-teal-800 border-teal-200', hoverColor: 'hover:bg-teal-200' },
    { id: 'community', name: 'Community Development', emoji: '🏘️', color: 'bg-amber-100 text-amber-800 border-amber-200', hoverColor: 'hover:bg-amber-200' },
    { id: 'research', name: 'Research & Science', emoji: '🔬', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', hoverColor: 'hover:bg-cyan-200' },
    { id: 'advocacy', name: 'Advocacy', emoji: '📢', color: 'bg-rose-100 text-rose-800 border-rose-200', hoverColor: 'hover:bg-rose-200' }
  ];

  const selectedInterests = Array.isArray(interests) ? interests : [];

  const toggleInterest = (interestId) => {
    const isSelected = selectedInterests.includes(interestId);
    let newInterests;
    
    if (isSelected) {
      newInterests = selectedInterests.filter(id => id !== interestId);
    } else {
      newInterests = [...selectedInterests, interestId];
    }
    
    onChange(newInterests);
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-3">Your Interests</label>
      <p className="text-xs text-slate-500 mb-4">Select the areas you're most interested in or work with.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {INTEREST_AREAS.map((interest) => {
          const isSelected = selectedInterests.includes(interest.id);
          
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => !loading && toggleInterest(interest.id)}
              disabled={loading}
              className={`
                p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-left
                ${isSelected 
                  ? `${interest.color} border-current` 
                  : 'bg-white text-slate-600 border-slate-200'
                }
                ${!loading ? `${interest.hoverColor} hover:border-current cursor-pointer` : 'cursor-not-allowed opacity-50'}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{interest.emoji}</span>
                <span>{interest.name}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedInterests.length > 0 && (
        <p className="text-xs text-slate-600 mt-3">
          {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

// Location Selector Component  
const LocationSelector = ({ location, onChange, loading }) => {
  const BAY_AREA_LOCATIONS = [
    'Alameda County', 
    'Contra Costa County', 
    'Marin County', 
    'Napa County',
    'San Francisco County', 
    'San Mateo County', 
    'Santa Clara County', 
    'Solano County', 
    'Sonoma County'
  ];

  const [customLocation, setCustomLocation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Clean location (remove parentheses and normalize)
  const cleanLocation = location ? location.replace(/[()]/g, '').trim() : '';
  
  const isCustomLocation = cleanLocation && !BAY_AREA_LOCATIONS.includes(cleanLocation);

  useEffect(() => {
    if (isCustomLocation) {
      setShowCustomInput(true);
      setCustomLocation(cleanLocation);
    }
  }, [cleanLocation, isCustomLocation]);

  const handleLocationSelect = (selectedLocation) => {
    onChange(selectedLocation);
    setShowCustomInput(false);
    setCustomLocation('');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customLocation.trim()) {
      onChange(customLocation.trim());
      setShowCustomInput(false);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-3">Which community are you part of? 🏡</label>
      <p className="text-xs text-slate-500 mb-4">Select your Bay Area community</p>
      
      {/* Bay Area Counties Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {BAY_AREA_LOCATIONS.map((countyName) => {
          const isSelected = cleanLocation === countyName;
          
          return (
            <button
              key={countyName}
              type="button"
              onClick={() => !loading && handleLocationSelect(countyName)}
              disabled={loading}
              className={`
                p-3 rounded-lg border text-sm font-medium transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }
                ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              {countyName}
            </button>
          );
        })}
        
        {/* Other Location Button */}
        <button
          type="button"
          onClick={() => !loading && setShowCustomInput(true)}
          disabled={loading}
          className={`
            p-3 rounded-lg border text-sm font-medium transition-all duration-200 hover:shadow-md
            ${showCustomInput || isCustomLocation
              ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
            }
            ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          Other Location
        </button>
      </div>

      {/* Custom Location Input */}
      {showCustomInput && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <form onSubmit={handleCustomSubmit}>
            <label className="text-sm font-medium text-slate-700 block mb-2">Custom Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g., Los Angeles County, Portland, OR"
                className="flex-grow px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !customLocation.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomLocation('');
                }}
                disabled={loading}
                className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Current Selection Display */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Selected:</strong> {cleanLocation || 'None'}
        </p>
        {cleanLocation && (
          <p className="text-xs text-slate-500 mt-1">
            You can always update this later in your profile settings
          </p>
        )}
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { profile: initialProfile, session, refreshProfile } = useOutletContext(); 
  
  // --- Profile State ---
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // --- Notification State ---
  const [profile, setProfile] = useState(null);
  const [newKeyword, setNewKeyword] = useState('');
  
  // --- Privacy State ---
  const [privacySetting, setPrivacySetting] = useState('public');
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState('');
  const [privacyError, setPrivacyError] = useState('');

  // 🚀 INSTANT: Listen for organization changes
  useEffect(() => {
    if (!initialProfile?.id) return;

    console.log('⚡ SettingsPage: Setting up instant organization change listener');

    // Listen for instant organization changes
    const cleanup = addOrganizationEventListener('organizationChanged', (event) => {
      const { profileId, organization } = event.detail;
      
      // Only process if this event is for the current user
      if (profileId === initialProfile.id) {
        console.log('⚡ SettingsPage: INSTANT organization change detected!', {
          profileId,
          organization
        });

        // Update organization name immediately
        if (organization) {
          console.log('✅ SettingsPage: Setting new organization name:', organization.name);
          setOrganizationName(organization.name);
        } else {
          console.log('✅ SettingsPage: Clearing organization name (user left org)');
          setOrganizationName(''); // Clear when user leaves organization
        }
      }
    });

    // Also listen for cross-tab changes
    const handleStorageChange = (e) => {
      if (e.key === 'orgChangeEvent' && e.newValue) {
        try {
          const message = JSON.parse(e.newValue);
          if (message.profileId === initialProfile.id) {
            console.log('📡 SettingsPage: Cross-tab organization change detected');
            if (message.organization) {
              setOrganizationName(message.organization.name);
            } else {
              setOrganizationName('');
            }
          }
        } catch (error) {
          console.error('❌ SettingsPage: Failed to parse cross-tab message:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      console.log('🧹 SettingsPage: Cleaning up instant organization listeners');
      cleanup();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialProfile?.id]);

  // Enhanced fetchOrganizationName function - FIXED to return empty when no org
  const fetchOrganizationName = async (profile) => {
    console.log('🔍 SettingsPage: Fetching organization name for profile:', profile?.id);
    
    // First, try to get from organization membership (this is the authoritative source)
    if (profile?.id) {
      try {
        const { data: memberships, error } = await supabase
          .from('organization_memberships')
          .select(`
            organizations!inner(
              id,
              name
            )
          `)
          .eq('profile_id', profile.id)
          .order('joined_at', { ascending: false })
          .limit(1);

        if (!error && memberships && memberships.length > 0) {
          const orgName = memberships[0].organizations.name;
          console.log('✅ SettingsPage: Found organization from membership:', orgName);
          return orgName;
        } else {
          console.log('📝 SettingsPage: No current organization membership found');
          return ''; // Return empty string when no membership exists
        }
      } catch (err) {
        console.error('❌ SettingsPage: Error fetching organization from membership:', err);
        return ''; // Return empty on error
      }
    }

    console.log('📝 SettingsPage: No profile ID available');
    return ''; // Return empty when no profile
  };

  // Enhanced useEffect to properly map all profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (initialProfile) {
        console.log('📋 SettingsPage: Loading profile data:', initialProfile);
        
        setProfile(initialProfile);
        setFullName(initialProfile.full_name || '');
        setTitle(initialProfile.title || '');
        
        // Fetch actual organization name
        const orgName = await fetchOrganizationName(initialProfile);
        setOrganizationName(orgName);
        
        setLocation(initialProfile.location || '');
        setBio(initialProfile.bio || '');
        
        // Handle interests - can be array or null
        const profileInterests = Array.isArray(initialProfile.interests) 
          ? initialProfile.interests 
          : [];
        setInterests(profileInterests);
        
        setAvatarUrl(initialProfile.avatar_url);
        setPrivacySetting(initialProfile.profile_view_privacy || 'public');
        
        // Clear any previous messages
        setPrivacyMessage('');
        setPrivacyError('');
        setProfileMessage('');
        setProfileError('');
        
        console.log('✅ SettingsPage: Profile loaded with interests:', profileInterests);
        console.log('🏢 SettingsPage: Organization name set to:', orgName);
      }
    };

    loadProfileData();
  }, [initialProfile]);

  // Add event listener for global avatar updates
  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      const { newAvatarUrl, userId } = event.detail;
      if (userId === session?.user?.id) {
        console.log('🔄 SettingsPage: Received global avatar update event');
        setAvatarUrl(newAvatarUrl);
      }
    };

    window.addEventListener('avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate);
  }, [session?.user?.id]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage('');
    setProfileError('');

    try {
      // Prepare update data - only include fields that should be updated (excluding location since it auto-saves)
      const updateData = {
        full_name: fullName,
        title: title,
        bio: bio,
        updated_at: new Date(),
      };

      console.log('💾 Updating profile with:', updateData);

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id);

      if (error) {
        setProfileError(error.message);
      } else {
        setProfileMessage('Profile updated successfully!');
        // Refresh the profile in the parent context
        if (typeof refreshProfile === 'function') {
          await refreshProfile();
        }
        // Auto-clear message after 3 seconds
        setTimeout(() => setProfileMessage(''), 3000);
      }
    } catch (err) {
      setProfileError(`Failed to update profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Enhanced avatar upload handler
  const handleAvatarUploaded = async (imageUrl) => {
    try {
      console.log('💾 Updating avatar URL in profile:', imageUrl);
      
      // Add cache busting parameter to ensure fresh image loads
      const cacheBustedUrl = `${imageUrl}?v=${Date.now()}`;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: cacheBustedUrl, 
          updated_at: new Date() 
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local state immediately
      setAvatarUrl(cacheBustedUrl);
      setProfileMessage("Avatar updated successfully!");
      
      // CRITICAL: Refresh the profile in the parent context
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
        console.log('✅ Profile context refreshed with new avatar');
      }

      // Optional: Force a small delay to ensure all components have updated
      setTimeout(() => {
        // Trigger a re-render of all Avatar components by updating a global state
        window.dispatchEvent(new CustomEvent('avatar-updated', { 
          detail: { newAvatarUrl: cacheBustedUrl, userId: session.user.id }
        }));
      }, 100);

      // Auto-clear success message after 3 seconds
      setTimeout(() => setProfileMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ Error updating avatar:', error);
      setProfileError(`Failed to update avatar: ${error.message}`);
    }
  };

  // Handle interests update
  const handleInterestsChange = async (newInterests) => {
    setInterests(newInterests);
    
    // Auto-save interests to database
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          interests: newInterests,
          updated_at: new Date()
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error saving interests:', error);
        setProfileError('Failed to save interests');
      } else {
        console.log('✅ Interests auto-saved');
        // Refresh profile to ensure consistency
        if (typeof refreshProfile === 'function') {
          await refreshProfile();
        }
      }
    } catch (err) {
      console.error('Error auto-saving interests:', err);
      setProfileError('Failed to save interests');
    }
  };

  // Handle location update
  const handleLocationChange = async (newLocation) => {
    setLocation(newLocation);
    
    // Auto-save location to database
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          location: newLocation,
          updated_at: new Date()
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error saving location:', error);
        setProfileError('Failed to save location');
      } else {
        console.log('✅ Location auto-saved');
        // Refresh profile to ensure consistency
        if (typeof refreshProfile === 'function') {
          await refreshProfile();
        }
      }
    } catch (err) {
      console.error('Error auto-saving location:', err);
      setProfileError('Failed to save location');
    }
  };

  // --- NOTIFICATION SETTINGS HANDLERS ---
  const updateNotificationProfile = async (updatedFields) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .update(updatedFields)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      setProfileError(error.message);
    } else if (data) {
      setProfile(data); // Update local state to reflect changes
      setProfileMessage('Notification settings updated!');
      setTimeout(() => setProfileMessage(''), 3000);
    }
    setLoading(false);
  };

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (newKeyword && !profile.alert_keywords.includes(newKeyword)) {
      const updatedKeywords = [...profile.alert_keywords, newKeyword];
      await updateNotificationProfile({ alert_keywords: updatedKeywords });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = async (keywordToRemove) => {
    const updatedKeywords = profile.alert_keywords.filter(k => k !== keywordToRemove);
    await updateNotificationProfile({ alert_keywords: updatedKeywords });
  };

  // --- PRIVACY SETTINGS HANDLERS ---
  const handlePrivacyChange = async (newSetting) => {
    if (!session?.user?.id || privacyLoading) return;

    try {
      setPrivacyLoading(true);
      setPrivacyMessage('');
      setPrivacyError('');

      const { data, error } = await supabase.rpc('update_profile_view_privacy', {
        p_user_id: session.user.id,
        p_privacy_setting: newSetting
      });

      if (error) throw error;

      // Update local state immediately
      setPrivacySetting(newSetting);
      
      // Also update the profile state that other components might be using
      setProfile(prev => ({ ...prev, profile_view_privacy: newSetting }));
      
      // Fetch fresh profile data to ensure consistency
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (!profileError && updatedProfile) {
        setProfile(updatedProfile);
        setPrivacySetting(updatedProfile.profile_view_privacy || 'public');
        
        // IMPORTANT: Notify parent component to refresh profile data
        if (typeof refreshProfile === 'function') {
          await refreshProfile();
        }
      }
      
      setPrivacyMessage('Privacy setting updated successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setPrivacyMessage(''), 3000);
    } catch (err) {
      console.error('Error updating privacy setting:', err);
      setPrivacyError(`Failed to update privacy setting: ${err.message}`);
      // Reset to previous setting on error
      setPrivacySetting(profile?.profile_view_privacy || 'public');
    } finally {
      setPrivacyLoading(false);
    }
  };

  const privacyOptions = [
    {
      value: 'public',
      label: 'Public',
      description: 'Your name and organization are visible when you view profiles',
      icon: UserCheckIcon,
      example: 'Shows as: "Jane Smith from Acme Foundation viewed your profile"'
    },
    {
      value: 'organization',
      label: 'Organization Only', 
      description: 'Only your organization name is visible, not your personal name',
      icon: BuildingIcon,
      example: 'Shows as: "Someone from Acme Foundation viewed your profile"'
    },
    {
      value: 'anonymous',
      label: 'Anonymous',
      description: 'Your profile views are not tracked at all',
      icon: EyeOffIcon,
      example: 'Your views are not recorded or displayed'
    }
  ];

  if (!profile) {
    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Card 1: Profile Information */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Profile Information</h2>
        <p className="text-slate-500 mt-1 mb-6">Update your personal and professional information.</p>
        
        <div className="flex items-center space-x-4 mb-6">
          <EnhancedAvatar 
            src={avatarUrl} 
            fullName={fullName}
            size="20"
            className="flex-shrink-0"
            key={avatarUrl} // Force re-render when URL changes
          />
          <EnhancedImageUploader
            currentImageUrl={avatarUrl}
            onImageUploaded={handleAvatarUploaded}
            uploading={uploading}
            setUploading={setUploading}
          />
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
            <input 
              id="fullName" 
              required 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
            />
          </div>

          <div>
            <label htmlFor="title" className="text-sm font-medium text-slate-700 block mb-1">Your Title</label>
            <input 
              id="title" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Executive Director, Program Manager" 
            />
          </div>

          {/* 🚀 ENHANCED: Organization Name with instant updates */}
          <div>
            <label htmlFor="organization" className="text-sm font-medium text-slate-700 block mb-1">Organization Name</label>
            <input 
              id="organization" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed transition-all duration-300" 
              type="text" 
              value={organizationName || ''} // Handle empty state
              disabled
              placeholder={organizationName ? organizationName : "No organization linked"}
            />
            <p className="text-xs text-slate-500 mt-1">
              {organizationName 
                ? "This is automatically populated from your linked organization. To change this, you'll need to join a different organization."
                : "You're not currently a member of any organization. Join an organization to have it displayed here."
              }
            </p>
          </div>

          {/* Location Section */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPinIcon className="text-green-500" />
              <h3 className="text-lg font-semibold text-slate-800">Your Location</h3>
            </div>
            <LocationSelector
              location={location}
              onChange={handleLocationChange}
              loading={loading}
            />
          </div>

          <div>
            <label htmlFor="bio" className="text-sm font-medium text-slate-700 block mb-1">Bio</label>
            <textarea
              id="bio"
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself and your work..."
            />
            <p className="text-xs text-slate-500 mt-1">{bio.length}/500 characters</p>
          </div>

          {/* Interests Section */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <HeartIcon className="text-pink-500" />
              <h3 className="text-lg font-semibold text-slate-800">Your Interests</h3>
            </div>
            <InterestSelector
              interests={interests}
              onChange={handleInterestsChange}
              loading={loading}
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading || uploading} 
              className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-semibold shadow-sm transition-colors"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
        {profileMessage && <div className="text-green-600 text-sm mt-4 font-medium">{profileMessage}</div>}
        {profileError && <div className="text-red-600 text-sm mt-4 font-medium">{profileError}</div>}
      </div>

      {/* Privacy Settings Card */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <EyeIcon className="text-blue-500" />
          <h2 className="text-2xl font-bold text-slate-800">Profile View Privacy</h2>
        </div>
        <p className="text-slate-500 mt-1 mb-6">Control how you appear when viewing funder profiles.</p>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <InfoIcon className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">How this works</p>
              <p className="text-xs text-blue-700">
                When you visit funder profiles, they can see analytics about their visitors. 
                Choose how you want to appear in their visitor lists.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {privacyOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = privacySetting === option.value;
            
            return (
              <div
                key={option.value}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                } ${privacyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !privacyLoading && handlePrivacyChange(option.value)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    <IconComponent className={isSelected ? 'text-blue-600' : 'text-slate-600'} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-semibold ${
                        isSelected ? 'text-blue-800' : 'text-slate-800'
                      }`}>
                        {option.label}
                      </h4>
                      {isSelected && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-sm mb-2 ${
                      isSelected ? 'text-blue-700' : 'text-slate-600'
                    }`}>
                      {option.description}
                    </p>
                    
                    <p className={`text-xs italic ${
                      isSelected ? 'text-blue-600' : 'text-slate-500'
                    }`}>
                      {option.example}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {privacyLoading && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <LoaderIcon />
              Updating privacy setting...
            </div>
          </div>
        )}

        {privacyMessage && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-700 font-medium">{privacyMessage}</div>
          </div>
        )}

        {privacyError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700 font-medium">{privacyError}</div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">💡 Privacy Notes:</h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Your setting applies to all profile views going forward</li>
            <li>• Past profile views are not affected by privacy changes</li>
            <li>• Anonymous browsing (incognito mode) is always anonymous regardless of this setting</li>
            <li>• Funders only see aggregated view counts, not detailed visitor lists for anonymous users</li>
          </ul>
        </div>
      </div>

      {/* Grant Alert Settings Card */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Grant Alert Settings</h2>
        <p className="text-slate-500 mt-1 mb-6">Manage your email alerts for new grant opportunities.</p>
        
        <div className="flex items-center justify-between mb-6">
          <span className="font-medium text-slate-800">Enable Email Alerts</span>
          <button
            onClick={() => updateNotificationProfile({ email_alerts_enabled: !profile.email_alerts_enabled })}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              profile.email_alerts_enabled ? 'bg-blue-600' : 'bg-slate-200'
            }`}
            disabled={loading}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                profile.email_alerts_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div>
          <label htmlFor="keywords" className="text-sm font-medium text-slate-700 block mb-1">Alert Keywords</label>
          <p className="text-xs text-slate-500 mb-2">Get notified when new grants match these keywords.</p>
          <form onSubmit={handleAddKeyword} className="flex items-center gap-2">
            <input
              id="keywords"
              className="flex-grow px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g., Environment"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="flex-shrink-0 bg-blue-100 text-blue-700 p-2.5 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <PlusIcon />
            </button>
          </form>
        </div>

        {profile.alert_keywords && profile.alert_keywords.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Your Keywords:</p>
            <div className="flex flex-wrap gap-2">
              {profile.alert_keywords.map((keyword) => (
                <div key={keyword} className="flex items-center bg-slate-100 text-slate-800 text-sm font-medium px-3 py-1 rounded-full">
                  <span>{keyword}</span>
                  <button 
                    onClick={() => handleRemoveKeyword(keyword)} 
                    className="ml-2 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}