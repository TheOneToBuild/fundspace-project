import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export const handler = async () => {
  console.log('Starting scheduled cleanup of old news...');

  // Calculate the date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Delete articles from the table that were published more than 30 days ago
    const { data, error } = await supabase
      .from('rss_articles')
      .delete()
      .lt('pub_date', thirtyDaysAgo.toISOString()); // 'lt' means "less than"

    if (error) {
      throw error;
    }

    console.log('Successfully cleaned up old news articles.');

    return {
      statusCode: 200,
      body: 'Successfully cleaned up old news articles.',
    };
  } catch (error) {
    console.error('Error cleaning up old news:', error);
    return {
      statusCode: 500,
      body: `Error cleaning up old news: ${error.message}`,
    };
  }
};