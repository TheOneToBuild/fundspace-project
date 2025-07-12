const Parser = require('rss-parser');
const https = require('https');
const http = require('http');

const cache = {};
const CACHE_DURATION = 5 * 60 * 1000;

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content', {keepArray: true}],
      ['media:thumbnail', 'media:thumbnail', {keepArray: true}],
      ['enclosure', 'enclosure', {keepArray: true}],
      ['image', 'image'],
      ['og:image', 'ogImage'],
      ['content:encoded', 'contentEncoded'],
      ['description', 'description']
    ]
  },
  timeout: 8000
});

const BAY_AREA_TERMS = [
  'san francisco', 'sf', 'oakland', 'berkeley', 'fremont', 'san jose', 'palo alto',
  'mountain view', 'sunnyvale', 'santa clara', 'cupertino', 'silicon valley', 'menlo park',
  'redwood city', 'san mateo', 'daly city', 'walnut creek', 'richmond', 'bay area',
  'east bay', 'south bay', 'north bay', 'peninsula'
];
const CALIFORNIA_TERMS = ['california', 'ca', 'socal', 'norcal', ...BAY_AREA_TERMS];
const PHILANTHROPY_TERMS = [
  'philanthrop', 'foundation', 'grant', 'donation', 'giving', 'charity', 'charitable',
  'nonprofit', 'non-profit', 'endowment', 'fund', 'funding', 'volunteer',
  'social impact', 'social good', 'fundraising', 'funder'
];

function isCommunityRelevant(article) {
  const content = `${article.title} ${article.fullContent}`.toLowerCase();
  const hasCaliforniaTerm = new RegExp(CALIFORNIA_TERMS.join('|'), 'i').test(content);
  const hasPhilanthropyTerm = new RegExp(PHILANTHROPY_TERMS.join('|'), 'i').test(content);

  if (!hasCaliforniaTerm || !hasPhilanthropyTerm) {
    console.log(`Filtered: "${article.title}" | CA: ${hasCaliforniaTerm}, Philanthropy: ${hasPhilanthropyTerm}`);
  }

  return hasCaliforniaTerm && hasPhilanthropyTerm;
}

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

async function extractImage(item, feedUrl) {
  if (item.image) return item.image;

  const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
  for (const enc of enclosures) {
    if (enc?.url && enc.type?.includes('image')) return enc.url;
  }

  if (item['media:content']) {
    const mediaContents = Array.isArray(item['media:content']) ? item['media:content'] : [item['media:content']];
    for (const media of mediaContents) {
      if (media?.$?.url && (media.$.medium === 'image' || media.$.type?.includes('image'))) return media.$.url;
      if (media?.url && (!media.medium || media.medium === 'image' || media.type?.includes('image'))) return media.url;
    }
  }

  if (item['media:thumbnail']) {
    const thumbnails = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'] : [item['media:thumbnail']];
    for (const thumb of thumbnails) {
      if (thumb?.$?.url) return thumb.$.url;
      if (thumb?.url) return thumb.url;
    }
  }

  const content = item.contentEncoded || item['content:encoded'] || item.content || item.description || '';
  const imagePatterns = [
    /<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+data-src=["']([^"']+)["']/i,
    /<figure[^>]*>.*?<img[^>]+src=["']([^"']+)["']/is,
    /(https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:\?[^\s<>"]*)?)/i,
    /<img[^>]+srcset=["']([^"'\s]+)/i
  ];

  for (const pattern of imagePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const imageUrl = match[1].replace(/&/g, '&').replace(/"/g, '"').replace(/'/g, "'");
      if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)) return imageUrl;
    }
  }

  const ogImageMatch = content.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) return ogImageMatch[1];

  console.log(`No image: "${item.title}" from ${feedUrl}`);
  return null;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };

  const { category } = event.queryStringParameters || {};
  if (!category) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Category parameter is required' }) };

  const RSS_FEEDS = {
    general: [
      'https://feeds.npr.org/1001/rss.xml',
      'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
      'http://www.latimes.com/local/lanow/rss2.0.xml'
    ],
    funder: [
      'https://www.philanthropy.com/feed',
      'https://nonprofitquarterly.org/feed/',
      'https://www.mercurynews.com/feed/',
      'https://www.sfchronicle.com/bayarea/feed/Bay-Area-News-435.php',
      'https://calmatters.org/feed/'
    ],
    nonprofit: [
      'https://www.philanthropy.com/feed',
      'https://nonprofitquarterly.org/feed/',
      'https://www.mercurynews.com/feed/',
      'https://www.sfchronicle.com/bayarea/feed/Bay-Area-News-435.php',
      'https://calmatters.org/feed/'
    ]
  };

  const feedUrls = RSS_FEEDS[category] || [];
  if (feedUrls.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid category' }) };

  const cacheKey = category;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Cached results: ${category}`);
    return {
      statusCode: 200,
      headers: { ...headers, 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ success: true, articles: cached.articles })
    };
  }

  try {
    const fetchPromises = feedUrls.map(url =>
      parser.parseURL(url)
        .then(feed => ({ feed, url }))
        .catch(err => { console.warn(`Failed: ${url}`, err.message); return null; })
    );
    const results = await Promise.all(fetchPromises);
    const articles = [];

    for (const result of results) {
      if (result?.feed?.items) {
        const sourceUrl = result.url;
        for (const item of result.feed.items.slice(0, 10)) {
          const image = await extractImage(item, sourceUrl);
          if (!image) continue;
          articles.push({
            id: item.guid || item.link || `${Date.now()}-${Math.random()}`,
            title: item.title ? item.title.trim() : 'No Title',
            summary: item.contentSnippet ? item.contentSnippet.substring(0, 200).trim() + '...' : '',
            fullContent: item.content || item.contentSnippet || '',
            url: item.link,
            image,
            timeAgo: formatTimeAgo(item.isoDate),
            category: result.feed.title || 'News',
            source: sourceUrl,
            pubDate: new Date(item.isoDate)
          });
        }
      }
    }

    const filteredArticles = (category === 'funder' || category === 'nonprofit')
      ? articles.filter(isCommunityRelevant)
      : articles;
    const uniqueArticles = Object.values(
      filteredArticles.reduce((acc, article) => {
        if (article.title) acc[article.title] = article;
        return acc;
      }, {})
    ).sort((a, b) => b.pubDate - a.pubDate).slice(0, 6);

    cache[cacheKey] = { timestamp: Date.now(), articles: uniqueArticles };

    const imageCount = uniqueArticles.filter(a => a.image).length;
    console.log(`Image rate: ${imageCount}/${uniqueArticles.length} (${Math.round((imageCount / uniqueArticles.length) * 100) || 0}%)`);

    return {
      statusCode: 200,
      headers: { ...headers, 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ success: true, articles: uniqueArticles })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Failed to process feeds' }) };
  }
};