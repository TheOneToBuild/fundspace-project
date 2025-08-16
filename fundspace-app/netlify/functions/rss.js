import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  try {
    const now = new Date();
    const pubDate = new Date(dateString);
    const diffInHours = Math.floor((now - pubDate) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  } catch { return 'Recently'; }
}

export const handler = async (event) => {
  const { category } = event.queryStringParameters;

  if (!category) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Category parameter is required' }) };
  }

  try {
    // --- UPDATED QUERY LOGIC ---
    let query = supabase
      .from('rss_articles')
      .select('title, summary, url, image_url, pub_date, source_name');

    // 'general' for HelloWorld gets national and california news
    // 'funder'/'nonprofit' for HelloCommunity gets only CA-based philanthropy news
    if (category === 'general') {
      query = query.in('category', ['general', 'california']);
    } else {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('pub_date', { ascending: false })
      .limit(6);
    // --- END UPDATED LOGIC ---

    if (error) throw error;

    const articles = data.map(article => ({
      id: article.url,
      title: article.title,
      summary: article.summary,
      url: article.url,
      image: article.image_url,
      timeAgo: formatTimeAgo(article.pub_date),
      category: article.source_name
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, articles })
    };
  } catch (error) {
    console.error('Error fetching articles from Supabase:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Failed to fetch news from database.' })
    };
  }
};