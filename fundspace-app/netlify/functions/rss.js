// netlify/functions/rss.js - Updated to use RPC
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const handler = async (event) => {
  const { category } = event.queryStringParameters;

  if (!category) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ 
        success: false, 
        error: 'Category parameter is required' 
      }) 
    };
  }

  try {
    // ✅ OPTIMIZED: Use RPC function instead of direct query
    const { data, error } = await supabase.rpc('get_rss_articles_by_category', {
      p_category: category,
      p_limit: 9
    });

    if (error) throw error;

    // RPC already returns formatted data
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching articles from Supabase:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch news from database.' 
      })
    };
  }
};