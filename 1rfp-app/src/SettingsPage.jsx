// src/components/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useOutletContext } from 'react-router-dom';

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2-5V3" /></svg>;
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default function SettingsPage() {
  const { profile: initialProfile, session, refreshProfile } = useOutletContext(); 
  
  // --- Profile State ---
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // --- Notification State ---
  const [profile, setProfile] = useState(null); // Used for live updates
  const [newKeyword, setNewKeyword] = useState('');
  
  // --- Privacy State ---
  const [privacySetting, setPrivacySetting] = useState('public');
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState('');
  const [privacyError, setPrivacyError] = useState('');

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setFullName(initialProfile.full_name || '');
      setRole(initialProfile.role || 'Nonprofit');
      setTitle(initialProfile.title || '');
      setOrganizationName(initialProfile.organization_name || '');
      setLocation(initialProfile.location || '');
      setAvatarUrl(initialProfile.avatar_url);
      setPrivacySetting(initialProfile.profile_view_privacy || 'public');
      
      // Clear any previous messages when profile changes
      setPrivacyMessage('');
      setPrivacyError('');
    }
  }, [initialProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage('');
    setProfileError('');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        role: role,
        title: (role === 'Funder' || role === 'Nonprofit') ? title : null,
        organization_name: (role === 'Funder' || role === 'Nonprofit') ? organizationName : null,
        location: location,
        updated_at: new Date(),
      })
      .eq('id', session.user.id);

    if (error) {
      setProfileError(error.message);
    } else {
      setProfileMessage('Profile updated successfully!');
    }
    setLoading(false);
  };
  
  const uploadAvatar = async (event) => {
    try {
        setUploading(true);
        if (!event.target.files || event.target.files.length === 0) {
            throw new Error('You must select an image to upload.');
        }
        const file = event.target.files[0];
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('Image file size must be less than 2MB.');
        }
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl, updated_at: new Date() })
            .eq('id', session.user.id);
        if (updateError) throw updateError;
        setAvatarUrl(publicUrl);
        setProfileMessage("Avatar updated successfully!");
    } catch (error) {
        setProfileError(error.message);
    } finally {
        setUploading(false);
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
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Card 1: Profile Information */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Profile Information</h2>
        <p className="text-slate-500 mt-1 mb-6">Update your personal and professional information.</p>
        
        <div className="flex items-center space-x-4 mb-6">
          <img 
            src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`} 
            alt="Profile Avatar"
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <label htmlFor="avatarUpload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100">
                <UploadIcon />
                {uploading ? 'Uploading...' : 'Upload Picture'}
            </label>
            <input id="avatarUpload" type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
            <p className="text-xs text-slate-500 mt-2">PNG, JPG, GIF up to 2MB.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
                <label htmlFor="fullName" className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
                <input id="fullName" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
                <label htmlFor="role" className="text-sm font-medium text-slate-700 block mb-1">Your Role</label>
                <select id="role" required className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option>Nonprofit</option>
                    <option>Funder</option>
                    <option>Community member</option>
                </select>
            </div>
            {(role === 'Funder' || role === 'Nonprofit') && (
                <>
                    <div>
                        <label htmlFor="title" className="text-sm font-medium text-slate-700 block mb-1">Your Title</label>
                        <input id="title" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Executive Director" />
                    </div>
                    <div>
                        <label htmlFor="organization" className="text-sm font-medium text-slate-700 block mb-1">Organization Name</label>
                        <input id="organization" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g., The Community Foundation" />
                    </div>
                </>
            )}
            <div>
                <label htmlFor="location" className="text-sm font-medium text-slate-700 block mb-1">Location (Optional)</label>
                <input id="location" className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., San Francisco, CA" />
            </div>

            <div className="pt-4">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold shadow-sm">
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
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
              className="flex-grow px-3 py-2 border border-slate-300 rounded-lg"
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g., Environment"
            />
            <button type="submit" className="flex-shrink-0 bg-blue-100 text-blue-700 p-2.5 rounded-lg hover:bg-blue-200">
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
                  <button onClick={() => handleRemoveKeyword(keyword)} className="ml-2 text-slate-500 hover:text-slate-800">
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