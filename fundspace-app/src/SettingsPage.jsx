import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useOutletContext } from 'react-router-dom';
import AvatarSettings from './components/settings/AvatarSettings';
import ProfileInfoForm from './components/settings/ProfileInfoForm';
import InterestSelector from './components/settings/InterestSelector';
import LocationSelector from './components/settings/LocationSelector';
import OrganizationalRoleSelector from './components/settings/OrganizationalRoleSelector';
import NotificationSettings from './components/settings/NotificationSettings';
import PasswordSettings from './components/settings/PasswordSettings';
import EmailSettings from './components/settings/EmailSettings';
import AccountDeletionSettings from './components/settings/AccountDeletionSettings';
import SocialProfilesSettings from './components/settings/SocialProfilesSettings';

export default function SettingsPage() {
  const { profile: initialProfile, session, refreshProfile } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [interests, setInterests] = useState([]);
  const [location, setLocation] = useState('');
  const [organizationalRole, setOrganizationalRole] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Add collapsible state for notifications and social profiles
  const [showPasswordSettings, setShowPasswordSettings] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSocialSettings, setShowSocialSettings] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      if (initialProfile) {
        setProfile(initialProfile);
        setFullName(initialProfile.full_name || '');
        setTitle(initialProfile.title || '');
        const orgName = await fetchOrganizationName(initialProfile.id);
        setOrganizationName(orgName);
        setLocation(initialProfile.location || '');
        setBio(initialProfile.bio || '');
        setInterests(Array.isArray(initialProfile.interests) ? 
          initialProfile.interests : []);
        setAvatarUrl(initialProfile.avatar_url);
        setOrganizationalRole(initialProfile.organizational_role || '');
      }
    };
    loadProfileData();
  }, [initialProfile]);

  const fetchOrganizationName = async (profileId) => {
    if (!profileId) return '';
    const { data } = await supabase
      .from('organization_memberships')
      .select('organizations!inner(name)')
      .eq('profile_id', profileId)
      .order('joined_at', { ascending: false })
      .limit(1)
      .single();
    return data?.organizations?.name || '';
  };
  
  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setMessage(msg);
    setTimeout(() => { setError(''); setMessage(''); }, 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updateData = { 
      full_name: fullName, 
      title: title, 
      bio: bio, 
      updated_at: new Date() 
    };
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id);
    
    if (error) showMessage(error.message, true);
    else {
      showMessage('Profile updated successfully!');
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
    setLoading(false);
  };
  
  const handleAvatarUploaded = async (imageUrl) => {
    const cacheBustedUrl = `${imageUrl}?v=${Date.now()}`;
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: cacheBustedUrl, updated_at: new Date() })
      .eq('id', session.user.id);
    
    if (error) showMessage(error.message, true);
    else {
      setAvatarUrl(cacheBustedUrl);
      showMessage("Avatar updated successfully!");
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
  };

  const handleImageRemoved = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date() })
      .eq('id', session.user.id);
    
    if (error) showMessage(error.message, true);
    else {
      setAvatarUrl(null);
      showMessage('Avatar removed successfully!');
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
    setLoading(false);
  };

  const handleAutoSave = async (field, value) => {
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value, updated_at: new Date() })
      .eq('id', session.user.id);
    
    if (error) showMessage(`Failed to save ${field}`, true);
    else if (typeof refreshProfile === 'function') await refreshProfile();
  };

  const handleSocialProfilesSave = async (socialProfiles) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        ...socialProfiles, 
        updated_at: new Date() 
      })
      .eq('id', session.user.id);
    
    if (error) {
      showMessage(error.message, true);
      throw error;
    } else {
      showMessage('Social profiles updated successfully!');
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
  };
  
  const updateNotificationProfile = async (updatedFields) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .update(updatedFields)
      .eq('id', session.user.id)
      .select()
      .single();
    
    if (error) showMessage(error.message, true);
    else if (data) {
      setProfile(data);
      showMessage('Notification settings updated!');
    }
    setLoading(false);
  };

  if (!profile) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-24 bg-slate-200 rounded-xl mt-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Profile Information</h2>
              <p className="text-sm text-slate-600">Update your personal and professional information</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <AvatarSettings
              avatarUrl={avatarUrl}
              fullName={fullName}
              onImageUploaded={handleAvatarUploaded}
              onImageRemoved={handleImageRemoved} 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  disabled={loading}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  disabled={loading}
                  placeholder="e.g., Program Director, CEO"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Organization Name</label>
              <input
                type="text"
                value={organizationName}
                readOnly
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 shadow-sm"
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                This is automatically populated from your linked organization
              </p>
            </div>

            <OrganizationalRoleSelector 
              organizationalRole={organizationalRole} 
              onChange={(val) => { 
                setOrganizationalRole(val); 
                handleAutoSave('organizational_role', val); 
              }} 
              loading={loading} 
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all shadow-sm"
                placeholder="Tell others about yourself and your work..."
                disabled={loading}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-500">Share your expertise, interests, and background</p>
                <p className={`text-xs font-medium ${bio.length > 450 ? 'text-red-500' : 'text-slate-500'}`}>
                  {bio.length}/500 characters
                </p>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-6">
              <LocationSelector 
                location={location} 
                onChange={(val) => { 
                  setLocation(val); 
                  handleAutoSave('location', val); 
                }} 
                loading={loading} 
              />
            </div>
            
            <div className="border-t border-slate-200 pt-6">
              <InterestSelector 
                interests={interests} 
                onChange={(val) => { 
                  setInterests(val); 
                  handleAutoSave('interests', val); 
                }} 
                loading={loading} 
              />
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your information is secure and private
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-8 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 font-semibold shadow-sm transition-all transform hover:scale-105 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : 'Save Profile Changes'}
              </button>
            </div>
            
            {/* Success/Error Messages */}
            {message && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700 font-medium">{message}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Collapsible Social Profiles Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div 
          className="flex items-center justify-between cursor-pointer p-6 hover:bg-slate-50 transition-colors"
          onClick={() => setShowSocialSettings(!showSocialSettings)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Social Profiles</h2>
              <p className="text-sm text-slate-500 mt-0.5">Connect your social media and professional profiles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showSocialSettings && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                Expanded
              </span>
            )}
            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <svg 
                className={`w-5 h-5 text-slate-600 transform transition-transform duration-200 ${showSocialSettings ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {showSocialSettings && (
          <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50/50">
            <div className="pt-6">
              <SocialProfilesSettings
                profile={profile}
                onSave={handleSocialProfilesSave}
                loading={loading}
              />
              <div className="mt-4">
                <button 
                  type="button"
                  onClick={() => setShowSocialSettings(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div 
          className="flex items-center justify-between cursor-pointer p-6 hover:bg-slate-50 transition-colors"
          onClick={() => setShowNotificationSettings(!showNotificationSettings)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 4h5l5 5H4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Notifications</h2>
              <p className="text-sm text-slate-500 mt-0.5">Manage how and when you receive notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showNotificationSettings && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                Expanded
              </span>
            )}
            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <svg 
                className={`w-5 h-5 text-slate-600 transform transition-transform duration-200 ${showNotificationSettings ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {showNotificationSettings && (
          <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50/50">
            <div className="pt-6">
              <NotificationSettings
                profile={profile}
                updateNotificationProfile={updateNotificationProfile}
                loading={loading}
              />
              <div className="mt-4">
                <button 
                  type="button"
                  onClick={() => setShowNotificationSettings(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Collapsible Password Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div 
          className="flex items-center justify-between cursor-pointer p-6 hover:bg-slate-50 transition-colors"
          onClick={() => setShowPasswordSettings(!showPasswordSettings)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Change Password</h2>
              <p className="text-sm text-slate-500 mt-0.5">Update your account password for security</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showPasswordSettings && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Expanded
              </span>
            )}
            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <svg 
                className={`w-5 h-5 text-slate-600 transform transition-transform duration-200 ${showPasswordSettings ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {showPasswordSettings && (
          <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50/50">
            <div className="pt-6">
              <PasswordSettings />
              <div className="mt-4">
                <button 
                  type="button"
                  onClick={() => setShowPasswordSettings(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Collapsible Email Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div 
          className="flex items-center justify-between cursor-pointer p-6 hover:bg-slate-50 transition-colors"
          onClick={() => setShowEmailSettings(!showEmailSettings)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Change Email Address</h2>
              <p className="text-sm text-slate-500 mt-0.5">Update your account email address</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showEmailSettings && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                Expanded
              </span>
            )}
            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <svg 
                className={`w-5 h-5 text-slate-600 transform transition-transform duration-200 ${showEmailSettings ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {showEmailSettings && (
          <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50/50">
            <div className="pt-6">
              <EmailSettings />
              <div className="mt-4">
                <button 
                  type="button"
                  onClick={() => setShowEmailSettings(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Account Deletion Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Account Deletion</h2>
              <p className="text-sm text-slate-600">Permanently delete your account and all associated data</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <AccountDeletionSettings session={session} />
        </div>
      </div>
    </div>
  );
}