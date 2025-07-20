// src/components/auth/steps/FollowUsersStep.jsx - Clean Version
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export default function FollowUsersStep({ formData, updateFormData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real users from database
  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      // Simplified query without complex filtering to avoid RLS issues
      let query = supabase
        .from('profiles')
        .select('id, full_name, role, title, organization_name, avatar_url, location')
        .not('full_name', 'is', null)
        .limit(20);

      // Add search filter if provided
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery}%`;
        query = query.or(`full_name.ilike.${searchTerm},role.ilike.${searchTerm},title.ilike.${searchTerm},organization_name.ilike.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        setUsers([]);
        return;
      }

      if (!data || data.length === 0) {
        setUsers([]);
        return;
      }

      // Process users and add follower counts
      const usersWithData = await Promise.all(
        data.map(async (user) => {
          // Get follower count
          let followerCount = 0;
          try {
            const { count, error: followerError } = await supabase
              .from('followers')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', user.id);
            
            if (!followerError) {
              followerCount = count || 0;
            }
          } catch (err) {
            // Silent fallback - follower count will remain 0
          }

          return {
            id: user.id,
            full_name: user.full_name,
            role: user.role,
            title: user.title,
            organization_name: user.organization_name,
            avatar_url: user.avatar_url,
            location: user.location,
            followers: followerCount,
            interests: [] // Empty for now, can be populated later
          };
        })
      );

      // Sort by follower count (descending)
      usersWithData.sort((a, b) => b.followers - a.followers);

      setUsers(usersWithData);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleFollowUser = (userId) => {
    const currentFollows = formData.followUsers || [];
    const isFollowing = currentFollows.includes(userId);
    
    let newFollows;
    if (isFollowing) {
      newFollows = currentFollows.filter(id => id !== userId);
    } else {
      newFollows = [...currentFollows, userId];
    }
    
    updateFormData('followUsers', newFollows);
  };

  const getDisplayRole = (user) => {
    // Combine title and organization for display
    if (user.title && user.organization_name) {
      return `${user.title} at ${user.organization_name}`;
    }
    if (user.title) return user.title;
    if (user.organization_name) return user.organization_name;
    return user.role || 'Community Member';
  };

  const getAvatarDisplay = (user) => {
    if (user.avatar_url) {
      return (
        <img 
          src={user.avatar_url} 
          alt={user.full_name} 
          className="w-full h-full object-cover rounded-full"
        />
      );
    }
    
    // Generate initials from full name
    const initials = user.full_name
      ?.split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
    
    return (
      <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
        {initials}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Find people to follow 👥</h1>
        <p className="text-slate-600">Connect with your people in your circle</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, role, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-2">Finding amazing people...</p>
        </div>
      )}
      
      {/* Users List */}
      {!loading && users.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {users.map((user) => {
            const isFollowing = formData.followUsers?.includes(user.id);
            
            return (
              <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {getAvatarDisplay(user)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{user.full_name}</h3>
                    <p className="text-sm text-slate-600">{getDisplayRole(user)}</p>
                    {user.location && (
                      <p className="text-xs text-slate-500">{user.location}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {user.followers.toLocaleString()} follower{user.followers !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleFollowUser(user.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isFollowing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500">
            {searchQuery.trim() 
              ? `No users found matching "${searchQuery}". Try a different search term!`
              : 'No users found. You can discover people to follow after creating your account!'}
          </p>
        </div>
      )}
      
      {/* Following Summary */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Following:</strong> {formData.followUsers?.length || 0} people
        </p>
        <p className="text-xs text-slate-500 mt-1">
          This step is optional. You can discover and follow more people after joining!
        </p>
      </div>
    </div>
  );
}