import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useOutletContext } from 'react-router-dom';
import AvatarSettings from './components/settings/AvatarSettings';
import ProfileInfoForm from './components/settings/ProfileInfoForm';
import InterestSelector from './components/settings/InterestSelector';
import LocationSelector from './components/settings/LocationSelector';
import PrivacySettings from './components/settings/PrivacySettings';
import NotificationSettings from './components/settings/NotificationSettings';
import PasswordSettings from './components/settings/PasswordSettings';
import EmailSettings from './components/settings/EmailSettings';
import AccountDeletionSettings from './components/settings/AccountDeletionSettings';

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
  const [privacySetting, setPrivacySetting] = useState('public');
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
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
        setInterests(Array.isArray(initialProfile.interests) ? initialProfile.interests : []);
        setAvatarUrl(initialProfile.avatar_url);
        setPrivacySetting(initialProfile.profile_view_privacy || 'public');
      }
    };
    loadProfileData();
  }, [initialProfile]);

  const fetchOrganizationName = async (profileId) => {
    if (!profileId) return '';
    const { data } = await supabase.from('organization_memberships').select('organizations!inner(name)').eq('profile_id', profileId).order('joined_at', { ascending: false }).limit(1).single();
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
    const updateData = { full_name: fullName, title: title, bio: bio, updated_at: new Date() };
    const { error } = await supabase.from('profiles').update(updateData).eq('id', session.user.id);
    if (error) showMessage(error.message, true);
    else {
      showMessage('Profile updated successfully!');
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
    setLoading(false);
  };
  
  const handleAvatarUploaded = async (imageUrl) => {
    const cacheBustedUrl = `${imageUrl}?v=${Date.now()}`;
    const { error } = await supabase.from('profiles').update({ avatar_url: cacheBustedUrl, updated_at: new Date() }).eq('id', session.user.id);
    if (error) showMessage(error.message, true);
    else {
      setAvatarUrl(cacheBustedUrl);
      showMessage("Avatar updated successfully!");
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
  };

  const handleImageRemoved = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ avatar_url: null, updated_at: new Date() }).eq('id', session.user.id);
    if (error) showMessage(error.message, true);
    else {
      setAvatarUrl(null);
      showMessage('Avatar removed successfully!');
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
    setLoading(false);
  };

  const handleAutoSave = async (field, value) => {
    const { error } = await supabase.from('profiles').update({ [field]: value, updated_at: new Date() }).eq('id', session.user.id);
    if (error) showMessage(`Failed to save ${field}`, true);
    else if (typeof refreshProfile === 'function') await refreshProfile();
  };
  
  const updateNotificationProfile = async (updatedFields) => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').update(updatedFields).eq('id', session.user.id).select().single();
    if (error) showMessage(error.message, true);
    else if (data) {
      setProfile(data);
      showMessage('Notification settings updated!');
    }
    setLoading(false);
  };
  
  const handlePrivacyChange = async (newSetting) => {
    setPrivacyLoading(true);
    const { error } = await supabase.rpc('update_profile_view_privacy', { p_user_id: session.user.id, p_privacy_setting: newSetting });
    if (error) showMessage(error.message, true);
    else {
      setPrivacySetting(newSetting);
      showMessage('Privacy setting updated successfully!');
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
    setPrivacyLoading(false);
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
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Profile Information</h2>
        <p className="text-slate-500 mt-1 mb-6">Update your personal and professional information.</p>
        
        <form onSubmit={handleUpdateProfile} className="space-y-6">
            <AvatarSettings
                avatarUrl={avatarUrl}
                fullName={fullName}
                onImageUploaded={handleAvatarUploaded}
                onImageRemoved={handleImageRemoved} 
            />
            
            <ProfileInfoForm
                fullName={fullName} setFullName={setFullName}
                title={title} setTitle={setTitle}
                organizationName={organizationName}
                bio={bio} setBio={setBio}
                loading={loading}
            />
            
            <div className="border-t pt-6">
                <LocationSelector location={location} onChange={(val) => { setLocation(val); handleAutoSave('location', val); }} loading={loading} />
            </div>
            
            <div className="border-t pt-6">
                <InterestSelector interests={interests} onChange={(val) => { setInterests(val); handleAutoSave('interests', val); }} loading={loading} />
            </div>
            
            <div className="pt-4">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold">
                    {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
            </div>
            {message && <div className="text-green-600 text-sm mt-4 font-medium">{message}</div>}
            {error && <div className="text-red-600 text-sm mt-4 font-medium">{error}</div>}
        </form>
      </div>

      <PrivacySettings
        privacySetting={privacySetting}
        handlePrivacyChange={handlePrivacyChange}
        privacyLoading={privacyLoading}
        privacyMessage={message}
        privacyError={error}
      />

      <NotificationSettings
        profile={profile}
        updateNotificationProfile={updateNotificationProfile}
        loading={loading}
      />
      
      <PasswordSettings />
      
      <EmailSettings />
      
      <AccountDeletionSettings session={session} />
    </div>
  );
}