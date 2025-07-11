// src/services/newsService.js
// Direct access to environment variables for your setup
const NEWS_API_KEY = import.meta.env?.VITE_NEWS_API_KEY ||
                    import.meta.env?.REACT_APP_NEWS_API_KEY ||
                    '31dcf512483940ecae729cf0904db983'; // Your API key as fallback

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Fallback images for different categories
const fallbackImages = {
  'general': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop',
  'business': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop',
  'technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
  'health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop',
  'environment': 'https://images.unsplash.com/photo-1569163139394-de44cb6296ec?w=400&h=200&fit=crop',
  'philanthropy': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop',
  'nonprofit': 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=200&fit=crop'
};

const formatTimeAgo = (publishedAt) => {
  const now = new Date();
  const published = new Date(publishedAt);
  const diffInHours = Math.floor((now - published) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
};

const categorizeArticle = (article) => {
  const title = article.title?.toLowerCase() || '';
  const description = article.description?.toLowerCase() || '';
  const content = `${title} ${description}`;

  if (content.includes('philanthrop') || content.includes('foundation') || content.includes('grant') || content.includes('donation')) {
    return 'Philanthropy';
  }
  if (content.includes('nonprofit') || content.includes('charity') || content.includes('volunteer') || content.includes('social service')) {
    return 'Nonprofit';
  }
  if (content.includes('tech') || content.includes('startup')) {
    return 'Technology';
  }
  if (content.includes('business') || content.includes('economic') || content.includes('market')) {
    return 'Business';
  }
  if (content.includes('health') || content.includes('medical') || content.includes('hospital')) {
    return 'Health';
  }
  if (content.includes('environment') || content.includes('climate') || content.includes('green')) {
    return 'Environment';
  }

  return 'Breaking News';
};

const transformArticle = (article, index) => {
  const category = categorizeArticle(article);

  return {
    id: article.url + index,
    title: article.title || 'No title available',
    summary: article.description || 'No description available',
    category: category,
    timeAgo: formatTimeAgo(article.publishedAt),
    image: article.urlToImage || fallbackImages[category.toLowerCase()] || fallbackImages.general,
    url: article.url
  };
};

// **OPTIMIZED** This function now makes only ONE API call for all community news queries.
const fetchCommunityNews = async (queries, fallback) => {
  if (!NEWS_API_KEY) {
    console.warn('News API key not configured, using fallback data');
    return fallback();
  }

  try {
    const exclusionFilter = 'NOT (job OR jobs OR hiring OR career OR careers OR event OR events OR webinar OR "4th of July")';
    
    // Combine all queries into a single, large query string using OR
    const combinedQuery = `(${queries.join(') OR (')}) AND ${exclusionFilter}`;

    const response = await fetch(
      `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(combinedQuery)}&language=en&sortBy=publishedAt&pageSize=40&apiKey=${NEWS_API_KEY}`
    );
    
    if (!response.ok) {
        // Throw an error if the request fails, which will be caught by the catch block
        throw new Error(`NewsAPI request failed with status ${response.status}`);
    }

    const data = await response.json();
    const allArticles = data.articles || [];

    const uniqueArticles = allArticles
      .filter((article, index, arr) =>
        arr.findIndex(a => a.title === article.title) === index
      )
      .filter(article =>
        article.title &&
        article.description &&
        !article.title.includes('[Removed]')
      )
      .slice(0, 10);

    return uniqueArticles.map(transformArticle);
  } catch (error) {
    console.error('Error fetching community news:', error);
    // On failure, return the fallback data
    return fallback();
  }
};


export const newsService = {
  // Global breaking news for Hello World
  async getGlobalBreakingNews() {
    if (!NEWS_API_KEY) {
      console.warn('News API key not configured, using fallback data');
      return this.getFallbackGlobalBreakingNews();
    }
    try {
      const response = await fetch(
        `${NEWS_API_BASE_URL}/top-headlines?category=general&language=en&pageSize=15&apiKey=${NEWS_API_KEY}`
      );
       if (!response.ok) {
         throw new Error('Failed to fetch global news');
       }
       const data = await response.json();
       const articles = (data.articles || [])
        .filter(article =>
            article.title &&
            article.description &&
            !article.title.includes('[Removed]'))
        .slice(0,10);

       return articles.map(transformArticle);

    } catch(error) {
       console.error('Error fetching global news:', error);
       return this.getFallbackGlobalBreakingNews();
    }
  },

  // Funder news queries to be combined into one call
  async getFunderNews() {
    const queries = [
      '"Tipping Point Community" OR "Hewlett Foundation" OR "Packard Foundation" OR "Chan Zuckerberg Initiative"',
      '("San Francisco Foundation" OR "Silicon Valley Community Foundation" OR "Marin Community Foundation") AND (grant OR funding OR initiative OR report)',
      '("California State Assembly" OR "SF Board of Supervisors" OR "Oakland City Council") AND (funding OR budget OR bill OR policy)',
      '"California Budget and Policy Center"'
    ];
    return fetchCommunityNews(queries, this.getFallbackFunderNews);
  },

  // Nonprofit news queries to be combined into one call
  async getNonprofitNews() {
    const queries = [
      '"Glide Memorial" OR "SF-Marin Food Bank" OR "Second Harvest of Silicon Valley" OR "SPUR"',
      '("Tenderloin Neighborhood Development Corporation" OR "Bay Area Legal Aid" OR "Hamilton Families")',
      '"Latino Community Foundation" OR "Asian Pacific Fund"',
      '("California nonprofit" OR "Bay Area nonprofit") AND (report OR study OR impact OR program OR serves)'
    ];
    return fetchCommunityNews(queries, this.getFallbackNonprofitNews);
  },

  // Fallback data methods
  getFallbackGlobalBreakingNews() {
    return [];
  },

  getFallbackFunderNews() {
    return [
      {
        id: 1,
        title: "City of Oakland Announces New Grant Program for Arts Nonprofits",
        summary: "The program aims to support cultural institutions affected by the economic downturn, with applications opening next month.",
        category: "Philanthropy",
        timeAgo: "2 hours ago",
        image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop"
      },
    ];
  },

  getFallbackNonprofitNews() {
    return [
      {
        id: 1,
        title: "Bay Area Food Banks Face Record Demand Amidst Inflation",
        summary: "A coalition of nonprofits across the region is calling for increased community support and volunteer efforts to meet the rising need.",
        category: "Nonprofit",
        timeAgo: "1 hour ago",
        image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=200&fit=crop"
      },
    ];
  }
};