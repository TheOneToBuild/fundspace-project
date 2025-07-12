// 1rfp-app/netlify/functions/rss.cjs
// Enhanced Netlify Function for RSS fetching - Bay Area focus + real images

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

    // Updated RSS feeds focused on Bay Area/California nonprofit and funder news
    const RSS_FEEDS = {
      funder: [
        'https://www.philanthropy.com/rss.php',
        'https://ssir.org/rss.xml', // Stanford Social Innovation Review (Bay Area based)
        'https://www.foundationcenter.org/news/rss.xml',
        'https://www.nonprofitquarterly.org/feed/',
        // Add Bay Area specific feeds
        'https://www.sfgate.com/rss/feed/Business-1078.php',
        'https://www.mercurynews.com/feed/',
      ],
      nonprofit: [
        'https://www.nonprofitquarterly.org/feed/',
        'https://ssir.org/rss.xml',
        'https://www.charitynavigator.org/index.cfm?bay=content.rss',
        'https://www.sfgate.com/rss/feed/Local-1079.php',
        'https://www.mercurynews.com/feed/',
        'https://www.philanthropy.com/rss.php'
      ],
      general: [
        'https://www.sfgate.com/rss/feed/Local-1079.php',
        'https://www.mercurynews.com/feed/',
        'https://ssir.org/rss.xml',
        'https://www.nonprofitquarterly.org/feed/'
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
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
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

    // Filter for Bay Area/California content
    const bayAreaArticles = allArticles.filter(article => isBayAreaRelevant(article));

    // Remove duplicates by title and limit results to 10
    const uniqueArticles = bayAreaArticles
      .filter((article, index, arr) => 
        arr.findIndex(a => a.title === article.title) === index
      )
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)) // Sort by date, newest first
      .slice(0, 10); // Limit to exactly 10 articles

    console.log(`Returning ${uniqueArticles.length} Bay Area relevant articles for ${category}`);

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
        total: uniqueArticles.length,
        filtered: `Bay Area/California ${category} news`
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

// Enhanced function to check if article is Bay Area/California relevant
function isBayAreaRelevant(article) {
  const content = `${article.title} ${article.summary}`.toLowerCase();
  
  // Bay Area specific terms
  const bayAreaTerms = [
    'san francisco', 'sf', 'bay area', 'silicon valley', 'oakland', 'berkeley', 'san jose',
    'palo alto', 'mountain view', 'fremont', 'hayward', 'santa clara', 'sunnyvale',
    'redwood city', 'menlo park', 'cupertino', 'milpitas', 'alameda', 'richmond',
    'san mateo', 'daly city', 'vallejo', 'concord', 'santa rosa', 'petaluma'
  ];
  
  // California general terms
  const californiaTerms = [
    'california', 'calif', 'ca ', 'golden state', 'sacramento', 'los angeles', 'san diego'
  ];
  
  // Nonprofit/Funder specific terms
  const nonprofitFunderTerms = [
    'nonprofit', 'non-profit', 'charity', 'foundation', 'philanthrop', 'grant', 'donation',
    'fundrais', 'volunteer', 'community', 'social impact', 'giving', 'endowment'
  ];
  
  // Check if article contains Bay Area terms OR (California terms AND nonprofit/funder terms)
  const hasBayArea = bayAreaTerms.some(term => content.includes(term));
  const hasCalifornia = californiaTerms.some(term => content.includes(term));
  const hasNonprofitFunder = nonprofitFunderTerms.some(term => content.includes(term));
  
  return hasBayArea || (hasCalifornia && hasNonprofitFunder);
}

// Enhanced function to parse RSS XML to articles with real image extraction
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
    
    items.forEach((item, index) => {
      const itemContent = item[1];
      
      // Extract title (handle CDATA)
      const titleMatch = itemContent.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/is);
      let title = titleMatch?.[1] || '';
      
      // Extract description/summary (handle CDATA)
      const descMatch = itemContent.match(/<(?:description|summary|content:encoded)[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:description|summary|content:encoded)>/is);
      let description = descMatch?.[1] || '';
      
      // Extract link
      const linkMatch = itemContent.match(/<link[^>]*>([^<]*)<\/link>|<link[^>]*href=["']([^"']*)/i);
      const link = linkMatch?.[1] || linkMatch?.[2] || '';
      
      // Extract publication date
      const pubDateMatch = itemContent.match(/<(?:pubDate|published|updated)[^>]*>([^<]*)<\/(?:pubDate|published|updated)>/i);
      const pubDate = pubDateMatch?.[1] || new Date().toISOString();
      
      // Enhanced image extraction
      const imageUrl = extractImageFromContent(itemContent, description, link);
      
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
          image: imageUrl,
          url: link.trim(),
          source: feedUrl,
          pubDate: pubDate
        });
      }
    });
    
  } catch (error) {
    console.error(`Error parsing RSS from ${feedUrl}:`, error);
  }
  
  return articles;
}

// Enhanced image extraction function
function extractImageFromContent(itemContent, description, articleUrl) {
  // Try multiple methods to extract image URL
  
  // Method 1: Media RSS namespace
  let imageMatch = itemContent.match(/<media:content[^>]*url=["']([^"']*\.(?:jpg|jpeg|png|gif|webp))[^"']*["']/i);
  if (imageMatch) return imageMatch[1];
  
  // Method 2: Media thumbnail
  imageMatch = itemContent.match(/<media:thumbnail[^>]*url=["']([^"']*\.(?:jpg|jpeg|png|gif|webp))[^"']*["']/i);
  if (imageMatch) return imageMatch[1];
  
  // Method 3: Enclosure tag
  imageMatch = itemContent.match(/<enclosure[^>]*url=["']([^"']*\.(?:jpg|jpeg|png|gif|webp))[^"']*["']/i);
  if (imageMatch) return imageMatch[1];
  
  // Method 4: Image in description/content
  imageMatch = description.match(/<img[^>]*src=["']([^"']*\.(?:jpg|jpeg|png|gif|webp))[^"']*["']/i);
  if (imageMatch) return imageMatch[1];
  
  // Method 5: Look for any image URL in content
  imageMatch = itemContent.match(/https?:\/\/[^"\s]*\.(?:jpg|jpeg|png|gif|webp)(?:\?[^"\s]*)?/i);
  if (imageMatch) return imageMatch[0];
  
  // Method 6: Extract from common news site patterns
  const siteSpecificImage = extractSiteSpecificImage(articleUrl, itemContent);
  if (siteSpecificImage) return siteSpecificImage;
  
  // Fallback to category-based default image
  return getDefaultImage(categorizeFeed(articleUrl));
}

// Site-specific image extraction patterns
function extractSiteSpecificImage(articleUrl, content) {
  // SF Gate specific patterns
  if (articleUrl.includes('sfgate.com')) {
    const match = content.match(/https:\/\/[^"\s]*sfgate[^"\s]*\.(?:jpg|jpeg|png|gif|webp)/i);
    if (match) return match[0];
  }
  
  // Mercury News specific patterns
  if (articleUrl.includes('mercurynews.com')) {
    const match = content.match(/https:\/\/[^"\s]*mercurynews[^"\s]*\.(?:jpg|jpeg|png|gif|webp)/i);
    if (match) return match[0];
  }
  
  // Philanthropy.com patterns
  if (articleUrl.includes('philanthropy.com')) {
    const match = content.match(/https:\/\/[^"\s]*philanthropy[^"\s]*\.(?:jpg|jpeg|png|gif|webp)/i);
    if (match) return match[0];
  }
  
  return null;
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

// Get default image based on feed category (fallback only)
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