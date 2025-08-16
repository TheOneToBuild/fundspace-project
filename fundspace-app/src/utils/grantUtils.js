// src/utils/grantUtils.js
import { supabase } from '../supabaseClient';

/**
 * Fetch fresh bookmark counts from the database for given grant IDs
 * @param {Array<number>} grantIds - Array of grant IDs to get counts for
 * @returns {Object} - Object with grant_id as key and count as value
 */
export const refreshGrantBookmarkCounts = async (grantIds) => {
  if (!grantIds || grantIds.length === 0) {
    return {};
  }

  try {
    const { data: bookmarksData, error: bookmarksError } = await supabase
      .from('saved_grants')
      .select('grant_id')
      .in('grant_id', grantIds);

    if (bookmarksError) {
      console.error('Error fetching bookmark counts:', bookmarksError);
      return {};
    }

    // Count bookmarks for each grant
    const bookmarkCounts = {};
    if (bookmarksData) {
      bookmarksData.forEach(bookmark => {
        bookmarkCounts[bookmark.grant_id] = (bookmarkCounts[bookmark.grant_id] || 0) + 1;
      });
    }

    return bookmarkCounts;
  } catch (error) {
    console.error('Error in refreshGrantBookmarkCounts:', error);
    return {};
  }
};