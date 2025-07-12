// 1rfp-app/netlify/functions/rss.cjs
// FIXED - Philanthropy focus for Hello Community

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
    
    console.log(`DEBUG: Processing category: ${category}`);
    
    if (!category) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Category parameter is required' })
      };
    }

    // UPDATED: Fast, reliable feeds
    const RSS_FEEDS = {
      // Global breaking news - no filtering
      general: [
        'https://rss.cnn.com/rss/edition.rss', // CNN - reliable
        'https://feeds.reuters.com/reuters/topNews', // Reuters - fast
        'https://feeds.npr.org/1001/rss.xml', // NPR - quality
        'https://feeds.bbci.co.uk/news/rss.xml' // BBC - global
      ],
      // PHILANTHROPY NEWS - for Hello Community
      funder: [
        'https://www.nonprofitquarterly.org/feed/', // Nonprofit Quarterly - always works
        'https://rss.cnn.com/rss/edition.rss', // CNN backup for general content
        'https://feeds.reuters.com/reuters/topNews', // Reuters for business/funding
        'https://feeds.npr.org/1001/rss.xml' // NPR for policy/social issues
      ],
      // Same as funder - both get philanthropy filtering
      nonprofit: [
        'https://www.nonprofitquarterly.org/feed/', // Nonprofit Quarterly
        'https://rss.cnn.com/rss/edition.rss', // CNN backup
        'https://feeds.reuters.com/reuters/topNews', // Reuters
        'https://feeds.npr.org/1001/rss.xml' // NPR
      ]
    };

    const feeds = RSS_FEEDS[category] || [];
    console.log(`DEBUG: Using ${feeds.length} feeds for ${category}`);
    
    if (feeds.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid category' })
      };
    }

    const allArticles = [];
    let successCount = 0;

    // Fetch feeds with shorter timeout
    const fetchPromises = feeds.map(async (feedUrl) => {
      try {
        console.log(`DEBUG: Fetching ${feedUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
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
          console.warn(`DEBUG: Failed to fetch ${feedUrl}: HTTP ${response.status}`);
          return [];
        }

        const xmlText = await response.text();
        console.log(`DEBUG: Got ${xmlText.length} chars from ${feedUrl}`);
        
        const articles = parseRSSToArticles(xmlText, feedUrl);
        console.log(`DEBUG: Parsed ${articles.length} articles from ${feedUrl}`);
        
        successCount++;
        return articles;

      } catch (error) {
        console.error(`DEBUG: Error fetching ${feedUrl}:`, error.message);
        return [];
      }
    });

    // Wait for all feeds
    const results = await Promise.allSettled(fetchPromises);
    
    // Collect successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        allArticles.push(...result.value);
      }
    });

    console.log(`DEBUG: Total articles collected: ${allArticles.length}`);

    // Apply filtering based on category
    let filteredArticles;
    if (category === 'general') {
      // For general, return all articles (global news)
      filteredArticles = allArticles;
      console.log(`DEBUG: General category - no filtering`);
    } else {
      // For funder/nonprofit, filter for PHILANTHROPY content
      filteredArticles = allArticles.filter(article => isPhilanthropyRelevant(article));
      console.log(`DEBUG: Filtered to ${filteredArticles.length} philanthropy articles`);
    }

    // Remove duplicates and limit to 10
    const uniqueArticles = filteredArticles
      .filter((article, index, arr) => 
        arr.findIndex(a => a.title === article.title) === index
      )
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 10);

    console.log(`DEBUG: Returning ${uniqueArticles.length} final articles`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=600' // 10 minute cache
      },
      body: JSON.stringify({
        success: true,
        articles: uniqueArticles,
        category: category,
        timestamp: new Date().toISOString(),
        total: uniqueArticles.length,
        filtered: category === 'general' ? 'Global breaking news' : 'Philanthropy news',
        debug: {
          totalFetched: allArticles.length,
          successfulFeeds: successCount
        }
      })
    };

  } catch (error) {
    console.error('DEBUG: RSS processing error:', error);
    
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

// FOCUSED: Check for philanthropy/nonprofit content
function isPhilanthropyRelevant(article) {
  const content = `${article.title} ${article.summary}`.toLowerCase();
  
  // Philanthropy keywords (broad but focused)
  const philanthropyTerms = [
    // Core philanthropy
    'philanthrop', 'foundation', 'grant', 'donation', 'giving', 'charity', 'charitable',
    'endowment', 'fund', 'funding', 'donor', 'benefactor', 'grantmaking',
    
    // Nonprofit sector
    'nonprofit', 'non-profit', 'ngo', 'charitable organization', 'social impact',
    'social good', 'community development', 'public benefit', 'civic engagement',
    
    // Impact & causes
    'impact investing', 'venture philanthropy', 'social venture', 'education funding',
    'health foundation', 'environmental grant', 'social justice', 'human rights',
    
    // Specific terms that indicate sector relevance
    'volunteer', 'fundrais', 'charitable trust', 'family foundation', 'corporate giving',
    'community foundation', 'private foundation', 'public charity', 'board of directors'
  ];
  
  // Also look for general social/community content
  const socialTerms = [
    'community', 'education', 'health', 'environment', 'poverty', 'inequality',
    'housing', 'homelessness', 'mental health', 'climate', 'sustainability',
    'access to', 'underserved', 'vulnerable', 'social services', 'public policy'
  ];
  
  // Check if article contains philanthropy terms OR relevant social content
  const hasPhilanthropy = philanthropyTerms.some(term => content.includes(term));
  const hasSocialContent = socialTerms.some(term => content.includes(term));
  
  return hasPhilanthropy || hasSocialContent;
}

// Simplified RSS parsing
function parseRSSToArticles(xmlText, feedUrl) {
  const articles = [];
  
  try {
    // Basic XML cleanup
    const cleanXml = xmlText.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');

    // Extract items
    const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
    const items = [...cleanXml.matchAll(itemRegex)];
    
    // Process first 20 items for speed
    items.slice(0, 20).forEach((item, index) => {
      const itemContent = item[1];
      
      // Extract basic info
      const titleMatch = itemContent.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/is);
      const descMatch = itemContent.match(/<(?:description|summary|content:encoded)[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:description|summary|content:encoded)>/is);
      const linkMatch = itemContent.match(/<link[^>]*>([^<]*)<\/link>|<link[^>]*href=["']([^"']*)/i);
      const pubDateMatch = itemContent.match(/<(?:pubDate|published|updated)[^>]*>([^<]*)<\/(?:pubDate|published|updated)>/i);
      
      const title = titleMatch?.[1] || '';
      const description = descMatch?.[1] || '';
      const link = linkMatch?.[1] || linkMatch?.[2] || '';
      const pubDate = pubDateMatch?.[1] || new Date().toISOString();
      
      // Quick image extraction
      const imageUrl = extractImageQuick(itemContent) || getDefaultImage(feedUrl);
      
      if (title && description && link) {
        articles.push({
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          title: cleanText(title).substring(0, 150),
          summary: cleanText(description).substring(0, 200) + (description.length > 200 ? '...' : ''),
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

// Quick image extraction
function extractImageQuick(content) {
  // Look for any image URL
  const imageMatch = content.match(/https?:\/\/[^"\s]*\.(?:jpg|jpeg|png|gif|webp)/i);
  return imageMatch?.[0] || null;
}

// Clean text
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Categorize feed
function categorizeFeed(feedUrl) {
  if (feedUrl.includes('nonprofit')) return 'Nonprofit';
  if (feedUrl.includes('cnn')) return 'CNN';
  if (feedUrl.includes('reuters')) return 'Reuters';
  if (feedUrl.includes('npr')) return 'NPR';
  if (feedUrl.includes('bbc')) return 'BBC';
  return 'News';
}

// Format time
function formatTimeAgo(dateString) {
  try {
    const now = new Date();
    const pubDate = new Date(dateString);
    const diffInHours = Math.floor((now - pubDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  } catch (error) {
    return 'Recently';
  }
}

// Default images
function getDefaultImage(feedUrl) {
  if (feedUrl.includes('nonprofit')) return 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=200&fit=crop';
  if (feedUrl.includes('cnn')) return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop';
  if (feedUrl.includes('npr')) return 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=200&fit=crop';
  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop';
}