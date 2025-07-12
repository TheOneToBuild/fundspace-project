const NETLIFY_FUNCTION_URL = '/.netlify/functions/rss';

async function fetchNews(category) {
  const cached = cache.get(category);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    console.log(`Cached: ${category}`);
    return cached.data;
  }

  try {
    console.log(`Fetching: ${category}`);
    const response = await fetch(`${NETLIFY_FUNCTION_URL}?category=${category}`, {
      method: 'GET',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');

    console.log(`Fetched ${data.articles?.length || 0} articles: ${category}`);
    const articles = data.articles || [];
    cache.set(category, { data: articles, timestamp: Date.now() });
    return articles;
  } catch (error) {
    console.warn(`Error for ${category}: ${error.message}`);
    cache.set(category, { data: [], timestamp: Date.now() });
    return [];
  }
}

const cache = new Map();

export const rssNewsService = {
  async getFunderNews() {
    return fetchNews('funder');
  },

  async getNonprofitNews() {
    return fetchNews('nonprofit');
  },

  async getGlobalBreakingNews() {
    return fetchNews('general');
  },

  clearCache() {
    cache.clear();
    console.log('Cache cleared');
  }
};