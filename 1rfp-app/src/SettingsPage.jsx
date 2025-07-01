import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useOutletContext } from 'react-router-dom';

// Icons can be defined here or imported
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

// This is the full code for the settings *content* area.
// It's designed to be rendered inside the <Outlet /> of ProfilePage.jsx.
export default function SettingsPage() {
  // Data is passed down from the parent ProfilePage via the Outlet's context
  const { profile: initialProfile, session } = useOutletContext(); 
  
  const [loading, setLoading] = useState(false);
  
  // State for the Profile Information form
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // State for the Notification Settings
  const [profile, setProfile] = useState(null); 
  const [newKeyword, setNewKeyword] = useState('');
  
  // This effect populates the form once the initialProfile data is received from the parent
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setFullName(initialProfile.full_name || '');
      setRole(initialProfile.role || 'Nonprofit');
      setTitle(initialProfile.title || '');
      setOrganizationName(initialProfile.organization_name || '');
    }
  }, [initialProfile]);

  // Handler for updating the main profile information
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
        title: role === 'Funder' ? title : null,
        organization_name: role === 'Funder' ? organizationName : null,
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

  // Handler for updating notification-specific fields
  const updateNotificationProfile = async (updatedFields) => {
    if (!profile || !session) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...updatedFields, updated_at: new Date() })
      .eq('id', session.user.id);
    if (error) console.error('Error updating notification settings:', error);
  };

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword || !profile) return;
    const updatedKeywords = [...(profile.alert_keywords || []), newKeyword.trim()];
    setProfile({ ...profile, alert_keywords: updatedKeywords });
    await updateNotificationProfile({ alert_keywords: updatedKeywords });
    setNewKeyword('');
  };

  const handleRemoveKeyword = async (keywordToRemove) => {
    if (!profile) return;
    const updatedKeywords = profile.alert_keywords.filter(k => k !== keywordToRemove);
    setProfile({ ...profile, alert_keywords: updatedKeywords });
    await updateNotificationProfile({ alert_keywords: updatedKeywords });
  };

  // A simple loading state while waiting for data from the parent
  if (!profile) {
    return <div>Loading settings...</div>;
  }

  // The JSX here only contains the content for the main column.
  return (
    <div className="space-y-8">
      {/* Card 1: Profile Information */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Profile Information</h2>
        <p className="text-slate-500 mt-1 mb-6">Update your personal and professional information.</p>
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
            {role === 'Funder' && (
                <>
                    <div>
                        <label htmlFor="title" className="text-sm font-medium text-slate-700 block mb-1">Your Title</label>
                        <input id="title" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Program Officer" />
                    </div>
                    <div>
                        <label htmlFor="organization" className="text-sm font-medium text-slate-700 block mb-1">Organization Name</label>
                        <input id="organization" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g., The Community Foundation" />
                    </div>
                </>
            )}
            <div className="pt-4">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold shadow-sm">
                    {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
            </div>
        </form>
        {profileMessage && <p className="text-green-600 text-sm mt-4 font-medium">{profileMessage}</p>}
        {profileError && <p className="text-red-600 text-sm mt-4 font-medium">{profileError}</p>}
      </div>

      {/* Card 2: Notification Settings */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Notification Settings</h2>
        <p className="text-slate-500 mt-1">Manage your alert and notification preferences.</p>
        <div className="mt-6 border-t pt-6 flex justify-between items-center">
            <div>
                <h4 className="font-semibold text-slate-700">Email Alerts</h4>
                <p className="text-sm text-slate-500">Master switch for all grant-related emails.</p>
            </div>
            <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={profile.email_alerts_enabled}
                onChange={(e) => {
                    setProfile({...profile, email_alerts_enabled: e.target.checked});
                    updateNotificationProfile({ email_alerts_enabled: e.target.checked });
                }}
            />
        </div>
        <div className="mt-6 border-t pt-6">
            <h4 className="font-semibold text-slate-700">Alert Keywords</h4>
            <p className="text-sm text-slate-500 mb-4">Get notified about grants matching these terms.</p>
            <form onSubmit={handleAddKeyword} className="flex space-x-2">
                <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Add a keyword" className="flex-grow px-3 py-2 border border-slate-300 rounded-lg" />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                    <PlusIcon />
                </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-4">
                {profile.alert_keywords && profile.alert_keywords.map(keyword => (
                    <div key={keyword} className="flex items-center bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                        <span>{keyword}</span>
                        <button onClick={() => handleRemoveKeyword(keyword)} className="ml-2 text-blue-500 hover:text-blue-700"><XIcon /></button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}