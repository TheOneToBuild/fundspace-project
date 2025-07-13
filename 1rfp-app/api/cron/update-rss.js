// api/cron/update-rss.js
// This runs every 10 minutes via Vercel Cron

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for write access
);

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
  timeout: 5000
});

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

async function extractImage(item) {
  // Simplified image extraction (remove the most complex parts for reliability)
  if (item.image) return item.image;

  const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
  for (const enc of enclosures) {
    if (enc?.url && enc.type?.includes('image')) return enc.url;
  }

  if (item['media:content']) {
    const mediaContents = Array.isArray(item['media:content']) ? item['media:content'] : [item['media:content']];
    for (const media of mediaContents) {
      if (media?.$?.url && (media.$.medium === 'image' || media.$.type?.includes('image'))) return media.$.url;
    }
  }

  // Basic image extraction from content
  const content = item.contentEncoded || item['content:encoded'] || item.content || item.description || '';
  const imageMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imageMatch && imageMatch[1]) {
    const imageUrl = imageMatch[1];
    if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) return imageUrl;
  }

  return null; // No image found
}

async function processCategory(category) {
  const feedUrls = RSS_FEEDS[category] || [];
  console.log(`Processing ${category}: ${feedUrls.length} feeds`);
  
  const articles = [];
  
  // Process feeds with timeout protection
  for (const url of feedUrls) {
    try {
      console.log(`Fetching ${url}`);
      const feed = await parser.parseURL(url);
      
      for (const item of feed.items.slice(0, 8)) { // Limit per feed
        const image = await extractImage(item);
        if (!image) continue; // Skip articles without images
        
        const article = {
          article_id: item.guid || item.link || `${Date.now()}-${Math.random()}`,
          title: item.title?.trim() || 'No Title',
          summary: item.contentSnippet?.substring(0, 200)?.trim() + '...' || '',
          full_content: item.content || item.contentSnippet || '',
          url: item.link,
          image_url: image,
          time_ago: formatTimeAgo(item.isoDate),
          category,
          source_name: feed.title || 'News',
          source_url: url,
          pub_date: new Date(item.isoDate || new Date())
        };
        
        articles.push(article);
      }
    } catch (error) {
      console.warn(`Failed to fetch ${url}:`, error.message);
    }
  }
  
  // Apply filtering for funder/nonprofit categories
  const filteredArticles = (category === 'funder' || category === 'nonprofit')
    ? articles.filter(isCommunityRelevant)
    : articles;
  
  // Remove duplicates and sort by date
  const uniqueArticles = Object.values(
    filteredArticles.reduce((acc, article) => {
      if (article.title) acc[article.title] = article;
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date)).slice(0, 6);

  return uniqueArticles;
}

export default async function handler(req, res) {
  // Verify this is a cron request (security)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('Starting RSS update job...');
  
  try {
    const categories = ['general', 'funder', 'nonprofit'];
    let totalUpdated = 0;
    
    for (const category of categories) {
      const articles = await processCategory(category);
      
      if (articles.length > 0) {
        // Delete old articles for this category first
        await supabase
          .from('rss_articles')
          .delete()
          .eq('category', category);
        
        // Insert new articles
        const { error } = await supabase
          .from('rss_articles')
          .insert(articles);
        
        if (error) {
          console.error(`Error inserting ${category} articles:`, error);
        } else {
          console.log(`Updated ${articles.length} articles for ${category}`);
          totalUpdated += articles.length;
        }
      }
    }
    
    console.log(`RSS update completed. Total articles: ${totalUpdated}`);
    res.status(200).json({ 
      success: true, 
      totalUpdated,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('RSS update failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}