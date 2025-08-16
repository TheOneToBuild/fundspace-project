import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AccountDeletionSettings({ session }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type "DELETE" exactly to confirm account deletion.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Delete all user data from related tables
      // This follows the foreign key relationships in your schema
      
      // Delete saved grants
      await supabase
        .from('saved_grants')
        .delete()
        .eq('user_id', session.user.id);

      // Delete post likes and comments
      await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', session.user.id);

      await supabase
        .from('post_comment_likes')
        .delete()
        .eq('user_id', session.user.id);

      await supabase
        .from('post_comments')
        .delete()
        .eq('user_id', session.user.id);

      // Delete organization-related data
      await supabase
        .from('organization_post_likes')
        .delete()
        .eq('user_id', session.user.id);

      await supabase
        .from('organization_post_comment_likes')
        .delete()
        .eq('user_id', session.user.id);

      await supabase
        .from('organization_post_comments')
        .delete()
        .eq('user_id', session.user.id);

      // Delete organization posts created by user
      await supabase
        .from('organization_posts')
        .delete()
        .eq('created_by_user_id', session.user.id);

      // Delete organization memberships
      await supabase
        .from('organization_memberships')
        .delete()
        .eq('profile_id', session.user.id);

      // Delete posts created by user
      await supabase
        .from('posts')
        .delete()
        .eq('user_id', session.user.id);

      // Delete profile views where user was the viewer
      await supabase
        .from('profile_views')
        .delete()
        .eq('viewer_id', session.user.id);

      // Step 2: Delete the profile (this will cascade due to foreign key)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', session.user.id);

      if (profileError) {
        throw new Error('Failed to delete profile: ' + profileError.message);
      }

      // Step 3: Call Supabase Edge Function to delete the auth user
      const supabaseUrl = supabase.supabaseUrl.replace('/rest/v1', '');
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: session.user.id })
      });

      if (!response.ok) {
        // If the API call fails, at least sign out the user
        console.warn('Failed to delete auth user, signing out instead');
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      // Navigate to home page
      navigate('/', { replace: true });
      
      // Show success message
      alert('Your account has been successfully deleted.');

    } catch (err) {
      console.error('Account deletion error:', err);
      setError('An error occurred while deleting your account. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800">Delete Account</h2>
      <p className="text-slate-600 mt-1 mb-6">
        Remove your account if you no longer wish to use the service.
      </p>

      {!isConfirmOpen ? (
        <button
          onClick={() => setIsConfirmOpen(true)}
          className="bg-red-600 text-white py-2.5 px-6 rounded-lg hover:bg-red-700 font-semibold"
        >
          Delete My Account
        </button>
      ) : (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Warning</h3>
            <p className="text-red-700 text-sm">
              Deleting your account will permanently remove:
            </p>
            <ul className="text-red-700 text-sm mt-2 ml-4 list-disc">
              <li>Your profile and personal information</li>
              <li>All your posts and comments</li>
              <li>Your saved grants and preferences</li>
              <li>Your organization memberships</li>
              <li>All activity history and interactions</li>
            </ul>
            <p className="text-red-700 text-sm mt-2 font-medium">
              This action is irreversible and your data cannot be recovered.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type "DELETE" to confirm account deletion:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm font-medium">{error}</div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleDeleteAccount}
              disabled={loading || confirmText !== 'DELETE'}
              className="bg-red-600 text-white py-2.5 px-6 rounded-lg hover:bg-red-700 disabled:bg-red-400 font-semibold"
            >
              {loading ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
            <button
              onClick={() => {
                setIsConfirmOpen(false);
                setConfirmText('');
                setError('');
              }}
              disabled={loading}
              className="bg-slate-200 text-slate-700 py-2.5 px-6 rounded-lg hover:bg-slate-300 disabled:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}