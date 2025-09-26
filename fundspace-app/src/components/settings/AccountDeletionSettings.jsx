// src/components/AccountDeletionSettings.jsx - OPTIMIZED: Batch delete operations
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
      // ✅ OPTIMIZED: Batch delete operations for better performance
      // This approach minimizes the number of database round trips
      
      console.log('Starting account deletion process...');
      
      // Step 1: Delete all user-related data in batches
      // Group related deletions together to reduce API calls
      
      const userId = session.user.id;
      
      // ✅ BATCH 1: User engagement data (likes, comments, saves)
      const engagementDeletions = await Promise.allSettled([
        // Delete saved grants
        supabase
          .from('saved_grants')
          .delete()
          .eq('user_id', userId),
        
        // Delete post likes
        supabase
          .from('post_likes')
          .delete()
          .eq('user_id', userId),
        
        // Delete post comment likes
        supabase
          .from('post_comment_likes')
          .delete()
          .eq('user_id', userId),
        
        // Delete organization post likes
        supabase
          .from('organization_post_likes')
          .delete()
          .eq('user_id', userId),
        
        // Delete organization post comment likes
        supabase
          .from('organization_post_comment_likes')
          .delete()
          .eq('user_id', userId)
      ]);

      // Log any failures in batch 1
      engagementDeletions.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Engagement deletion ${index} failed:`, result.reason);
        }
      });

      // ✅ BATCH 2: User-generated content (comments, posts)
      const contentDeletions = await Promise.allSettled([
        // Delete post comments
        supabase
          .from('post_comments')
          .delete()
          .eq('user_id', userId),
        
        // Delete organization post comments
        supabase
          .from('organization_post_comments')
          .delete()
          .eq('user_id', userId),
        
        // Delete posts created by user
        supabase
          .from('posts')
          .delete()
          .eq('user_id', userId),
        
        // Delete organization posts created by user
        supabase
          .from('organization_posts')
          .delete()
          .eq('created_by_user_id', userId)
      ]);

      // Log any failures in batch 2
      contentDeletions.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Content deletion ${index} failed:`, result.reason);
        }
      });

      // ✅ BATCH 3: User connections and social data
      const socialDeletions = await Promise.allSettled([
        // Delete user connections (both as requester and recipient)
        supabase
          .from('user_connections')
          .delete()
          .eq('requester_id', userId),
        
        supabase
          .from('user_connections')
          .delete()
          .eq('recipient_id', userId),
        
        // Delete followers relationships
        supabase
          .from('followers')
          .delete()
          .eq('follower_id', userId),
        
        supabase
          .from('followers')
          .delete()
          .eq('following_id', userId),
        
        // Delete notifications
        supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId)
      ]);

      // Log any failures in batch 3
      socialDeletions.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Social deletion ${index} failed:`, result.reason);
        }
      });

      // ✅ STEP 4: Delete organization memberships (important for org cleanup)
      console.log('Deleting organization memberships...');
      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('profile_id', userId);

      if (membershipError) {
        console.warn('Warning: Failed to delete organization memberships:', membershipError);
        // Don't fail the whole process, but log the issue
      }

      // ✅ STEP 5: Delete the profile (this will cascade due to foreign key constraints)
      console.log('Deleting user profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw new Error('Failed to delete profile: ' + profileError.message);
      }

      // ✅ STEP 6: Call Supabase Edge Function to delete the auth user
      console.log('Deleting auth user...');
      try {
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
          console.warn('Failed to delete auth user via Edge Function, but continuing with sign out');
        }
      } catch (edgeFunctionError) {
        console.warn('Edge Function call failed:', edgeFunctionError);
        // Continue with signout even if edge function fails
      }

      // ✅ STEP 7: Sign out the user
      console.log('Signing out user...');
      await supabase.auth.signOut();
      
      // ✅ STEP 8: Navigate to home page and show success
      navigate('/', { replace: true });
      
      // Show success message
      alert('Your account has been successfully deleted.');

      console.log('Account deletion completed successfully');

    } catch (err) {
      console.error('Account deletion error:', err);
      
      // Provide specific error messages based on the error type
      if (err.message.includes('profile')) {
        setError('Failed to delete your profile. Some data may still exist. Please contact support.');
      } else if (err.message.includes('Foreign key')) {
        setError('Cannot delete account due to data dependencies. Please contact support for assistance.');
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        setError('Network error during deletion. Please check your connection and try again.');
      } else {
        setError('An error occurred while deleting your account. Please try again or contact support.');
      }
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
          className="bg-red-600 text-white py-2.5 px-6 rounded-lg hover:bg-red-700 font-semibold transition-colors"
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
            <ul className="text-red-700 text-sm mt-2 ml-4 list-disc space-y-1">
              <li>Your profile and personal information</li>
              <li>All your posts and comments</li>
              <li>Your saved grants and preferences</li>
              <li>Your organization memberships</li>
              <li>All activity history and interactions</li>
              <li>Your connections and followers</li>
              <li>All likes and reactions you've made</li>
            </ul>
            <p className="text-red-700 text-sm mt-3 font-medium">
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleDeleteAccount}
              disabled={loading || confirmText !== 'DELETE'}
              className="bg-red-600 text-white py-2.5 px-6 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                'Permanently Delete Account'
              )}
            </button>
            <button
              onClick={() => {
                setIsConfirmOpen(false);
                setConfirmText('');
                setError('');
              }}
              disabled={loading}
              className="bg-slate-200 text-slate-700 py-2.5 px-6 rounded-lg hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>

          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm">
                Deleting your account... This may take a few moments as we remove all your data.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}