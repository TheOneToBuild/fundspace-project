import React, { useState } from 'react';

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

export default function NotificationSettings({ profile, updateNotificationProfile, loading }) {
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = (e) => {
    e.preventDefault();
    if (newKeyword && !profile.alert_keywords.includes(newKeyword)) {
      const updatedKeywords = [...profile.alert_keywords, newKeyword];
      updateNotificationProfile({ alert_keywords: updatedKeywords });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    const updatedKeywords = profile.alert_keywords.filter(k => k !== keywordToRemove);
    updateNotificationProfile({ alert_keywords: updatedKeywords });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800">Grant Alert Settings</h2>
      <p className="text-slate-500 mt-1 mb-6">Manage your email alerts for new grant opportunities.</p>
      
      <div className="flex items-center justify-between mb-6">
        <span className="font-medium text-slate-800">Enable Email Alerts</span>
        <button
          onClick={() => updateNotificationProfile({ email_alerts_enabled: !profile.email_alerts_enabled })}
          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${profile.email_alerts_enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
          disabled={loading}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${profile.email_alerts_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      <div>
        <label htmlFor="keywords" className="text-sm font-medium text-slate-700 block mb-1">Alert Keywords</label>
        <p className="text-xs text-slate-500 mb-2">Get notified when new grants match these keywords.</p>
        <form onSubmit={handleAddKeyword} className="flex items-center gap-2">
          <input id="keywords" className="flex-grow px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="e.g., Environment" disabled={loading} />
          <button type="submit" className="flex-shrink-0 bg-blue-100 text-blue-700 p-2.5 rounded-lg hover:bg-blue-200 disabled:opacity-50" disabled={loading || !newKeyword.trim()}>
            <PlusIcon />
          </button>
        </form>
      </div>

      {profile.alert_keywords?.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Your Keywords:</p>
          <div className="flex flex-wrap gap-2">
            {profile.alert_keywords.map((keyword) => (
              <div key={keyword} className="flex items-center bg-slate-100 text-slate-800 text-sm font-medium px-3 py-1 rounded-full">
                <span>{keyword}</span>
                <button onClick={() => handleRemoveKeyword(keyword)} className="ml-2 text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={loading}>
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}