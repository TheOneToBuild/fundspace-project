import React from 'react';

export default function ProfileInfoForm({
  fullName, setFullName,
  title, setTitle,
  organizationName,
  bio, setBio,
  loading
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="fullName" className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
        <input id="fullName" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} />
      </div>

      {/* "Your Title" field was moved from here */}

      <div>
        <label htmlFor="organization" className="text-sm font-medium text-slate-700 block mb-1">Organization Name</label>
        <input id="organization" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed" type="text" value={organizationName || ''} disabled placeholder={organizationName ? organizationName : "No organization linked"} />
        <p className="text-xs text-slate-500 mt-1">{organizationName ? "This is automatically populated from your linked organization." : "Join an organization to have it displayed here."}</p>
      </div>

      {/* --- MOVED TO HERE --- */}
      {/* The "Your Title" field will only be rendered if organizationName exists */}
      {organizationName && (
        <div>
          <label htmlFor="title" className="text-sm font-medium text-slate-700 block mb-1">Your Title</label>
          <input id="title" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Executive Director" disabled={loading} />
        </div>
      )}
      {/* --- END OF MOVE --- */}

      <div>
        <label htmlFor="bio" className="text-sm font-medium text-slate-700 block mb-1">Bio</label>
        <textarea id="bio" rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-vertical" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." disabled={loading} />
        <p className="text-xs text-slate-500 mt-1">{bio.length}/500 characters</p>
      </div>
    </div>
  );
}