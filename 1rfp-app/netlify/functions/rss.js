// 1rfp-app/netlify/functions/rss.js
// Complete Netlify Function for RSS fetching

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get category from query parameters
    const { category } = event.queryStringParameters || {};
    
    if (!category) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Category parameter is required' })
      };
    }

    const RSS_FEEDS = {
      funder: [
        'https://www.philanthropy.com/rss.php',
        'https://ssir.org/rss.xml',
        'https://www.nonprofitquarterly.org/feed/',
        'https://www.foundationcenter.org/news/rss.xml',
        'https://www.councilofnonprofits.org/feed'
      ],
      nonprofit: [
        'https://www.nonprofitquarterly.org/feed/',
        'https://www.charitynavigator.org/index.cfm?bay=content.rss',
        'https://www.guidestar.org/rss.xml',
        'https://www.boardsource.org/feed/',
        'https://www.independentsector.org/feed/'
      ],
      general: [
        'https://feeds.npr.org/1001/rss.xml',
        'https://feeds.reuters.com/reuters/topNews',
        'https://feeds.bbci.co.uk/news/rss.xml'
      ]
    };

    const feeds = RSS_FEEDS[category] || [];
    
    if (feeds.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid category' })
      };
    }

    console.log(`Fetching RSS feeds for category: ${category}`);
    
    const allArticles = [];

    // Fetch feeds with timeout and error handling
    const fetchPromises = feeds.map(async (feedUrl) => {
      try {
        console.log(`Fetching: ${feedUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot)',
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`Failed to fetch ${feedUrl}: HTTP ${response.status}`);
          return [];
        }

        const xmlText = await response.text();
        const articles = parseRSSToArticles(xmlText, feedUrl);
        
        console.log(`Successfully parsed ${articles.length} articles from ${feedUrl}`);
        return articles;

      } catch (error) {
        console.error(`Error fetching ${feedUrl}:`, error.message);
        return [];
      }
    });

    // Wait for all feeds to complete (with error tolerance)
    const results = await Promise.allSettled(fetchPromises);
    
    // Collect all successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        allArticles.push(...result.value);
      }
    });

    // Remove duplicates by title and limit results
    const uniqueArticles = allArticles
      .filter((article, index, arr) => 
        arr.findIndex(a => a.title === article.title) === index
      )
      .sort(() => Math.random() - 0.5) // Shuffle for variety
      .slice(0, 10);

    console.log(`Returning ${uniqueArticles.length} unique articles for ${category}`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
      body: JSON.stringify({
        success: true,
        articles: uniqueArticles,
        category: category,
        timestamp: new Date().toISOString(),
        total: uniqueArticles.length
      })
    };

  } catch (error) {
    console.error('RSS processing error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch RSS feeds',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Helper function to parse RSS XML to articles
function parseRSSToArticles(xmlText, feedUrl) {
  const articles = [];
  
  try {
    // Clean up the XML text
    const cleanXml = xmlText
      .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove invalid XML characters

    // Extract items using regex (robust approach without external dependencies)
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi; // For Atom feeds
    
    const items = [...cleanXml.matchAll(itemRegex), ...cleanXml.matchAll(entryRegex)];
    
    items.slice(0, 5).forEach((item, index) => {
      const itemContent = item[1];
      
      // Extract title (handle CDATA)
      const titleMatch = itemContent.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/is);
      let title = titleMatch?.[1] || '';
      
      // Extract description/summary (handle CDATA)
      const descMatch = itemContent.match(/<(?:description|summary)[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:description|summary)>/is);
      let description = descMatch?.[1] || '';
      
      // Extract link
      const linkMatch = itemContent.match(/<link[^>]*>([^<]*)<\/link>|<link[^>]*href=["']([^"']*)/i);
      const link = linkMatch?.[1] || linkMatch?.[2] || '';
      
      // Extract publication date
      const pubDateMatch = itemContent.match(/<(?:pubDate|published|updated)[^>]*>([^<]*)<\/(?:pubDate|published|updated)>/i);
      const pubDate = pubDateMatch?.[1] || '';
      
      // Clean HTML tags and entities
      title = cleanTextContent(title);
      description = cleanTextContent(description);
      
      if (title && description && link) {
        articles.push({
          id: `${feedUrl}-${index}-${Date.now()}`,
          title: title.substring(0, 150), // Limit title length
          summary: description.length > 200 ? description.substring(0, 200) + '...' : description,
          category: categorizeFeed(feedUrl),
          timeAgo: formatTimeAgo(pubDate),
          image: getDefaultImage(feedUrl),
          url: link.trim(),
          source: feedUrl
        });
      }
    });
    
  } catch (error) {
    console.error(`Error parsing RSS from ${feedUrl}:`, error);
  }
  
  return articles;
}

// Clean HTML tags and decode common entities
function cleanTextContent(text) {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Categorize based on feed URL
function categorizeFeed(feedUrl) {
  if (feedUrl.includes('philanthrop') || feedUrl.includes('foundation')) return 'Philanthropy';
  if (feedUrl.includes('nonprofit') || feedUrl.includes('charity')) return 'Nonprofit';
  if (feedUrl.includes('tech') || feedUrl.includes('startup')) return 'Technology';
  if (feedUrl.includes('business') || feedUrl.includes('economic')) return 'Business';
  return 'Breaking News';
}

// Format publication date to relative time
function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  
  try {
    const now = new Date();
    const pubDate = new Date(dateString);
    
    if (isNaN(pubDate.getTime())) return 'Recently';
    
    const diffInMs = now - pubDate;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    
  } catch (error) {
    return 'Recently';
  }
}

// Get default image based on feed category
function getDefaultImage(feedUrl) {
  const category = categorizeFeed(feedUrl);
  
  const images = {
    'Philanthropy': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop',
    'Nonprofit': 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=200&fit=crop',
    'Technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
    'Business': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop',
    'Breaking News': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'
  };
  
  return images[category] || images['Breaking News'];
}