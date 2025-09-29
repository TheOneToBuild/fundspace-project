import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DAYS_TO_KEEP = 1;

export const handler = async () => {
  console.log(`Starting scheduled cleanup of articles older than ${DAYS_TO_KEEP} days...`);

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - DAYS_TO_KEEP);

  const { data, error } = await supabase
    .from('rss_articles')
    .delete()
    .lt('pub_date', thresholdDate.toISOString())
    .select();

  if (error) {
    console.error('Error cleaning up old news:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error cleaning up old news', error: error.message }),
    };
  }

  const deletedCount = data ? data.length : 0;
  console.log(`Successfully cleaned up old news articles. Deleted ${deletedCount} articles.`);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Cleanup complete. Deleted ${deletedCount} articles.` }),
  };
};