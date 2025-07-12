// 1rfp-app/netlify/functions/rss.cjs
// Enhanced Netlify Function for RSS fetching - Fixed feeds + improved filtering

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

    // Updated RSS feeds with WORKING sources
    const RSS_FEEDS = {
      // Global breaking news (no location filtering)
      general: [
        'https://feeds.npr.org/1001/rss.xml', // NPR Top Stories
        'https://rss.cnn.com/rss/edition.rss', // CNN Top Stories
        'https://feeds.bbci.co.uk/news/rss.xml', // BBC News
        'https://www.nonprofitquarterly.org/feed/', // Nonprofit Quarterly
        'https://feeds.feedburner.com/oreilly/radar', // Tech/Innovation
        'https://rss.politico.com/politics-news.xml', // Politics
        'https://feeds.washingtonpost.com/rss/politics', // Washington Post Politics
        'https://feeds.reuters.com/reuters/topNews' // Reuters Top News
      ],
      // Bay Area + California nonprofit/funder news
      funder: [
        'https://www.nonprofitquarterly.org/feed/', // Nonprofit Quarterly
        'https://feeds.feedburner.com/chronicle-of-philanthropy', // Chronicle of Philanthropy
        'https://feeds.feedburner.com/InsidePhilanthropy', // Inside Philanthropy
        'https://feeds.feedburner.com/devex/news', // Devex global development
        'https://www.mercurynews.com/feed/', // Mercury News (Bay Area)
        'https://www.sfexaminer.com/feed/', // SF Examiner
        'https://feeds.feedburner.com/TechCrunch', // TechCrunch (tech funding)
        'https://feeds.feedburner.com/venturebeat/SZYF' // VentureBeat funding
      ],
      // Bay Area + California nonprofit news
      nonprofit: [
        'https://www.nonprofitquarterly.org/feed/', // Nonprofit Quarterly
        'https://feeds.feedburner.com/CharityNavigatorBlog', // Charity Navigator
        'https://www.mercurynews.com/feed/', // Mercury News (Bay Area)
        'https://www.sfexaminer.com/feed/', // SF Examiner
        'https://feeds.feedburner.com/VolunteerHub', // Volunteer/nonprofit news
        'https://feeds.feedburner.com/NetworkForGood', // Network for Good
        'https://feeds.feedburner.com/causevox', // CauseVox nonprofit
        'https://feeds.feedburner.com/NonprofitTechForGood' // Nonprofit tech
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

    // Apply filtering based on category
    let filteredArticles;
    if (category === 'general') {
      // For general/global news, return all articles (no location filtering)
      filteredArticles = allArticles;
    } else {
      // For funder/nonprofit, filter for Bay Area/California content
      filteredArticles = allArticles.filter(article => isBayAreaRelevant(article));
    }

    // Remove duplicates by title and limit results to 10
    const uniqueArticles = filteredArticles
      .filter((article, index, arr) => 
        arr.findIndex(a => a.title === article.title) === index
      )
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)) // Sort by date, newest first
      .slice(0, 10); // Limit to exactly 10 articles

    console.log(`Returning ${uniqueArticles.length} articles for ${category} (from ${allArticles.length} total)`);

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
        filtered: category === 'general' ? 'Global breaking news' : `Bay Area/California ${category} news`
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
  
  // Bay Area specific terms (9 counties)
  const bayAreaTerms = [
    // San Francisco County
    'san francisco', 'sf', 'city by the bay',
    
    // Alameda County
    'oakland', 'berkeley', 'fremont', 'hayward', 'alameda', 'livermore', 'pleasanton', 'union city',
    
    // Santa Clara County (Silicon Valley)
    'san jose', 'palo alto', 'mountain view', 'sunnyvale', 'santa clara', 'cupertino', 'milpitas',
    'los altos', 'menlo park', 'redwood city', 'silicon valley',
    
    // San Mateo County
    'san mateo', 'daly city', 'south san francisco', 'burlingame', 'san carlos', 'foster city',
    
    // Contra Costa County
    'concord', 'walnut creek', 'richmond', 'antioch', 'pittsburg', 'martinez', 'el cerrito',
    
    // Solano County
    'vallejo', 'fairfield', 'vacaville', 'suisun city',
    
    // Napa County
    'napa', 'st helena', 'calistoga', 'american canyon',
    
    // Sonoma County
    'santa rosa', 'petaluma', 'rohnert park', 'sebastopol', 'healdsburg',
    
    // Marin County
    'san rafael', 'novato', 'mill valley', 'sausalito', 'tiburon',
    
    // General Bay Area terms
    'bay area', 'east bay', 'south bay', 'north bay', 'peninsula', 'golden gate'
  ];
  
  // California general terms
  const californiaTerms = [
    'california', 'calif', 'ca ', 'golden state', 'sacramento', 'los angeles', 'san diego',
    'california nonprofit', 'california foundation', 'california grant'
  ];
  
  // Nonprofit/Funder specific terms
  const nonprofitFunderTerms = [
    'nonprofit', 'non-profit', 'charity', 'foundation', 'philanthrop', 'grant', 'donation',
    'fundrais', 'volunteer', 'community', 'social impact', 'giving', 'endowment', 'funding',
    'charitable', 'public benefit', 'social good', 'impact investing', 'venture philanthropy'
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
  // NPR specific patterns
  if (articleUrl.includes('npr.org')) {
    const match = content.match(/https:\/\/[^"\s]*npr[^"\s]*\.(?:jpg|jpeg|png|gif|webp)/i);
    if (match) return match[0];
  }
  
  // CNN specific patterns
  if (articleUrl.includes('cnn.com')) {
    const match = content.match(/https:\/\/[^"\s]*cnn[^"\s]*\.(?:jpg|jpeg|png|gif|webp)/i);
    if (match) return match[0];
  }
  
  // TechCrunch specific patterns
  if (articleUrl.includes('techcrunch.com')) {
    const match = content.match(/https:\/\/[^"\s]*techcrunch[^"\s]*\.(?:jpg|jpeg|png|gif|webp)/i);
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
  if (feedUrl.includes('politics') || feedUrl.includes('politico')) return 'Politics';
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
    'Politics': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=200&fit=crop',
    'Breaking News': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'
  };
  
  return images[category] || images['Breaking News'];
}