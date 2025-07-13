// api/rss/[category].js
// Fast endpoint that serves cached articles from Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function formatTimeAgo(dateString) {
  try {
    const now = new Date();
    const pubDate = new Date(dateString);
    const diffInHours = Math.floor((now - pubDate) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { category } = req.query;
  
  if (!category || !['general', 'funder', 'nonprofit'].includes(category)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid category. Must be: general, funder, or nonprofit' 
    });
  }

  try {
    const { data: articles, error } = await supabase
      .from('rss_articles')
      .select(`
        article_id,
        title,
        summary,
        url,
        image_url,
        pub_date,
        source_name
      `)
      .eq('category', category)
      .order('pub_date', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Database query failed' 
      });
    }

    // Transform data to match your existing format
    const formattedArticles = (articles || []).map(article => ({
      id: article.article_id,
      title: article.title,
      summary: article.summary,
      url: article.url,
      image: article.image_url,
      timeAgo: formatTimeAgo(article.pub_date), // Recalculate for accuracy
      category: article.source_name,
      pubDate: new Date(article.pub_date)
    }));

    console.log(`Served ${formattedArticles.length} ${category} articles`);
    
    res.status(200).json({
      success: true,
      articles: formattedArticles,
      lastUpdated: formattedArticles[0]?.pubDate || null,
      cached: true
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}