// 1rfp-app/src/services/rssNewsService.js
// Updated to work with Netlify Functions

const NETLIFY_FUNCTION_URL = '/.netlify/functions/rss';

const fallbackImages = {
  'Philanthropy': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop',
  'Nonprofit': 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=200&fit=crop',
  'Breaking News': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop',
  'Technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
  'Business': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop'
};

// Enhanced fallback data for better user experience
const generateFallbackData = (category) => {
  const timestamp = new Date();
  const baseData = {
    funder: [
      {
        id: `fallback-${category}-1`,
        title: "MacKenzie Scott Announces $2.7B in New Grants",
        summary: "The philanthropist continues her commitment to unrestricted giving, focusing on organizations led by women and people of color across education, healthcare, and community development sectors.",
        category: "Philanthropy",
        timeAgo: "2 hours ago",
        image: fallbackImages.Philanthropy,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-2`,
        title: "Ford Foundation Launches $1B Economic Justice Initiative",
        summary: "New comprehensive program aims to address wealth inequality through innovative funding mechanisms, policy advocacy, and community-led solutions nationwide.",
        category: "Philanthropy",
        timeAgo: "4 hours ago",
        image: fallbackImages.Philanthropy,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-3`,
        title: "Gates Foundation Invests in Climate Technology",
        summary: "Breakthrough Energy announces new $3 billion fund for clean technology startups focusing on solutions for developing countries and carbon capture innovation.",
        category: "Technology",
        timeAgo: "6 hours ago",
        image: fallbackImages.Technology,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-4`,
        title: "Community Foundation Network Reaches $100B Milestone",
        summary: "Local foundations collectively manage record assets as community-led philanthropy experiences unprecedented growth across rural and urban areas.",
        category: "Philanthropy",
        timeAgo: "8 hours ago",
        image: fallbackImages.Philanthropy,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-5`,
        title: "Tech Leaders Pledge $5B for Education Equity",
        summary: "Coalition of technology industry leaders commits unprecedented funding to address educational gaps in underserved communities nationwide.",
        category: "Technology",
        timeAgo: "12 hours ago",
        image: fallbackImages.Technology,
        url: "#",
        source: "fallback"
      }
    ],
    nonprofit: [
      {
        id: `fallback-${category}-1`,
        title: "Bay Area Food Banks Report Record Volunteer Signups",
        summary: "Local nonprofits see unprecedented community support as economic challenges drive increased demand for emergency food services across the region.",
        category: "Nonprofit",
        timeAgo: "1 hour ago",
        image: fallbackImages.Nonprofit,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-2`,
        title: "Nonprofit Collaboration Network Expands Statewide",
        summary: "California organizations join forces to share resources, reduce duplication, and amplify collective impact across diverse communities and cause areas.",
        category: "Nonprofit",
        timeAgo: "3 hours ago",
        image: fallbackImages.Nonprofit,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-3`,
        title: "Mental Health Nonprofits Receive Emergency Funding",
        summary: "Federal grant program provides $500M to organizations addressing post-pandemic mental health crisis, with focus on youth and underserved populations.",
        category: "Nonprofit",
        timeAgo: "5 hours ago",
        image: fallbackImages.Nonprofit,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-4`,
        title: "Environmental Justice Coalition Launches National Campaign",
        summary: "40+ organizations unite to address climate impact on underserved communities, focusing on air quality, water access, and renewable energy transitions.",
        category: "Nonprofit",
        timeAgo: "7 hours ago",
        image: fallbackImages.Nonprofit,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-5`,
        title: "Youth Development Programs Show Record Impact",
        summary: "Comprehensive study reveals significant improvements in educational outcomes and career readiness from community-based mentorship initiatives.",
        category: "Nonprofit",
        timeAgo: "10 hours ago",
        image: fallbackImages.Nonprofit,
        url: "#",
        source: "fallback"
      }
    ],
    general: [
      {
        id: `fallback-${category}-1`,
        title: "Global Education Summit Addresses Learning Gaps",
        summary: "World leaders and education experts convene to discuss innovative solutions for educational inequality in post-pandemic recovery and digital transformation.",
        category: "Breaking News",
        timeAgo: "30 minutes ago",
        image: fallbackImages['Breaking News'],
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-2`,
        title: "Climate Summit Yields New International Commitments",
        summary: "195 countries agree to accelerated carbon reduction targets with $100B annual funding mechanism for developing nations' green transition programs.",
        category: "Breaking News",
        timeAgo: "2 hours ago",
        image: fallbackImages['Breaking News'],
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-3`,
        title: "Tech Industry Announces AI Ethics Standards",
        summary: "Major technology companies establish comprehensive voluntary guidelines for responsible artificial intelligence development and deployment practices.",
        category: "Technology",
        timeAgo: "4 hours ago",
        image: fallbackImages.Technology,
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-4`,
        title: "Global Health Initiative Receives Record Funding",
        summary: "International donors commit $50B over five years to strengthen pandemic preparedness and build resilient healthcare systems worldwide.",
        category: "Breaking News",
        timeAgo: "6 hours ago",
        image: fallbackImages['Breaking News'],
        url: "#",
        source: "fallback"
      },
      {
        id: `fallback-${category}-5`,
        title: "Economic Recovery Programs Show Promise",
        summary: "New research indicates community-based economic initiatives are driving sustainable growth and job creation in rural and post-industrial areas.",
        category: "Business",
        timeAgo: "9 hours ago",
        image: fallbackImages.Business,
        url: "#",
        source: "fallback"
      }
    ]
  };

  return baseData[category] || baseData.general;
};

// Fetch RSS from Netlify Function
const fetchRSSFromNetlify = async (category) => {
  try {
    console.log(`Fetching RSS for category: ${category}`);
    
    const response = await fetch(`${NETLIFY_FUNCTION_URL}?category=${category}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Netlify function error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error from Netlify function');
    }

    console.log(`Successfully fetched ${data.articles?.length || 0} articles for ${category}`);
    return data.articles || [];

  } catch (error) {
    console.error(`Error fetching RSS for ${category}:`, error);
    throw error;
  }
};

// Cache management for better performance
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

const getCachedData = (category) => {
  const cached = cache.get(category);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached data for ${category}`);
    return cached.data;
  }
  return null;
};

const setCachedData = (category, data) => {
  cache.set(category, {
    data,
    timestamp: Date.now()
  });
};

// Main RSS service with enhanced error handling and caching
export const rssNewsService = {
  async getFunderNews() {
    try {
      // Check cache first
      const cached = getCachedData('funder');
      if (cached) return cached;

      const articles = await fetchRSSFromNetlify('funder');
      
      if (articles && articles.length > 0) {
        setCachedData('funder', articles);
        return articles;
      } else {
        console.log('No articles returned, using fallback data for funder');
        const fallback = generateFallbackData('funder');
        setCachedData('funder', fallback);
        return fallback;
      }
    } catch (error) {
      console.warn('Using fallback data for funder news:', error.message);
      const fallback = generateFallbackData('funder');
      setCachedData('funder', fallback);
      return fallback;
    }
  },

  async getNonprofitNews() {
    try {
      // Check cache first
      const cached = getCachedData('nonprofit');
      if (cached) return cached;

      const articles = await fetchRSSFromNetlify('nonprofit');
      
      if (articles && articles.length > 0) {
        setCachedData('nonprofit', articles);
        return articles;
      } else {
        console.log('No articles returned, using fallback data for nonprofit');
        const fallback = generateFallbackData('nonprofit');
        setCachedData('nonprofit', fallback);
        return fallback;
      }
    } catch (error) {
      console.warn('Using fallback data for nonprofit news:', error.message);
      const fallback = generateFallbackData('nonprofit');
      setCachedData('nonprofit', fallback);
      return fallback;
    }
  },

  async getGlobalBreakingNews() {
    try {
      // Check cache first
      const cached = getCachedData('general');
      if (cached) return cached;

      const articles = await fetchRSSFromNetlify('general');
      
      if (articles && articles.length > 0) {
        setCachedData('general', articles);
        return articles;
      } else {
        console.log('No articles returned, using fallback data for general');
        const fallback = generateFallbackData('general');
        setCachedData('general', fallback);
        return fallback;
      }
    } catch (error) {
      console.warn('Using fallback data for general news:', error.message);
      const fallback = generateFallbackData('general');
      setCachedData('general', fallback);
      return fallback;
    }
  },

  // Clear cache method for manual refresh
  clearCache() {
    cache.clear();
    console.log('RSS cache cleared');
  },

  // Legacy fallback methods for compatibility
  getFallbackFunderNews() {
    return generateFallbackData('funder');
  },

  getFallbackNonprofitNews() {
    return generateFallbackData('nonprofit');
  },

  getFallbackGlobalBreakingNews() {
    return generateFallbackData('general');
  }
};