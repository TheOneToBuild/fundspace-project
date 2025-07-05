// src/components/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useOutletContext } from 'react-router-dom';

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;


export default function SettingsPage() {
  const { profile: initialProfile, session } = useOutletContext(); 
  
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
  
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setFullName(initialProfile.full_name || '');
      setRole(initialProfile.role || 'Nonprofit');
      setTitle(initialProfile.title || '');
      setOrganizationName(initialProfile.organization_name || '');
      setLocation(initialProfile.location || '');
      setAvatarUrl(initialProfile.avatar_url);
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


  // --- NOTIFICATION SETTINGS HANDLERS (RESTORED) ---
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
        {profileMessage && <p className="text-green-600 text-sm mt-4 font-medium">{profileMessage}</p>}
        {profileError && <p className="text-red-600 text-sm mt-4 font-medium">{profileError}</p>}
      </div>

      {/* --- NOTIFICATION SETTINGS CARD (RESTORED) --- */}
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