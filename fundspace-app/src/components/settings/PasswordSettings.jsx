import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function PasswordSettings() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  // Check authentication status
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (!session) {
        setError('You must be logged in to change your password.');
      }
    };
    
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setError('You must be logged in to change your password.');
      } else {
        setError(''); // Clear error if user logs back in
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Check if user is authenticated
    if (!session) {
      setError('You must be logged in to change your password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage('Your password has been updated successfully!');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't render the form if not authenticated
  if (!session) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Change Password</h2>
        <p className="text-red-600 mt-4">Please log in to change your password.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800">Change Password</h2>
      <p className="text-slate-500 mt-1 mb-6">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading || !session} 
            className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>

      {error && <div className="text-red-600 text-sm mt-4 font-medium">{error}</div>}
      {message && <div className="text-green-600 text-sm mt-4 font-medium">{message}</div>}
    </div>
  );
}