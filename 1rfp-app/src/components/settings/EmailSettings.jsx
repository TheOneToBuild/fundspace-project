import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function EmailSettings() {
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('A confirmation link has been sent to your new email address. Please click the link to finalize the change.');
      setNewEmail('');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800">Change Email Address</h2>
      <p className="text-slate-500 mt-1 mb-6">
        A confirmation will be sent to your new email address to complete the change.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">New Email Address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div className="pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold">
            {loading ? 'Sending...' : 'Update Email'}
          </button>
        </div>
      </form>
      
      {error && <div className="text-red-600 text-sm mt-4 font-medium">{error}</div>}
      {message && <div className="text-green-600 text-sm mt-4 font-medium">{message}</div>}
    </div>
  );
}