import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const parser = new Parser({ timeout: 10000 });

// Helper function to extract an image from an RSS item
function extractImage(item) {
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item.enclosure?.url && item.enclosure.type?.includes('image')) return item.enclosure.url;
  const content = item['content:encoded'] || item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

// Keywords to exclude sports and celebrity news
const EXCLUDED_KEYWORDS = [
  // Sports
  'sports', 'nba', 'nfl', 'mlb', 'nhl', 'olympics', 'game', 'match', 'player', 'team', 
  'soccer', 'football', 'basketball', 'baseball', 'hockey', 'tennis', 'athlete',
  // Celebrities
  'celebrity', 'kardashian', 'taylor swift', 'movie star', 'red carpet', 'gossip', 
  'entertainment news', 'hollywood', 'actor', 'actress', 'singer'
];

// Function to check if an article is about an excluded topic
function isExcludedTopic(item) {
  const content = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => content.includes(keyword));
}

// The main handler for the scheduled function
export const handler = async () => {
  console.log('Starting scheduled news fetch...');

  const RSS_FEEDS = [
    // Bay Area, CA, and US News
    { category: 'general', url: 'https://www.mercurynews.com/feed/' },
    { category: 'general', url: 'https://www.sfchronicle.com/bayarea/feed/Bay-Area-News-435.php' },
    { category: 'general', url: 'https://calmatters.org/feed/' },
    { category: 'general', url: 'https://rss.app/feeds/ap/top-news.xml' }, // AP Top News (US)

    // Philanthropy/Funder/Nonprofit News
    { category: 'funder', url: 'https://nonprofitquarterly.org/feed/' },
    { category: 'nonprofit', url: 'https://www.philanthropy.com/feed' },
  ];

  const fetchPromises = RSS_FEEDS.map(feedInfo =>
    parser.parseURL(feedInfo.url).then(feed => ({ ...feed, category: feedInfo.category }))
      .catch(err => {
        console.warn(`Failed to fetch ${feedInfo.url}:`, err.message);
        return null;
      })
  );

  const results = await Promise.all(fetchPromises);
  let articlesToUpsert = [];

  for (const feed of results) {
    if (feed?.items) {
      for (const item of feed.items) {
        // Check if the article is about sports or celebrities
        if (isExcludedTopic(item)) {
          console.log(`Excluding topic: ${item.title}`);
          continue; // Skip this article
        }

        const image = extractImage(item);
        if (image) { // Only process articles that have an image
          articlesToUpsert.push({
            article_id: item.guid || item.link, // Use a stable ID
            title: item.title,
            summary: item.contentSnippet?.substring(0, 200).trim() || '',
            full_content: item.content || item.contentSnippet || '',
            url: item.link,
            image_url: image,
            pub_date: item.isoDate ? new Date(item.isoDate) : new Date(),
            source_name: feed.title,
            category: feed.category, // Assign the category from our list
          });
        }
      }
    }
  }

  if (articlesToUpsert.length > 0) {
    // Use upsert to insert new articles or update existing ones based on the article_id
    const { data, error } = await supabase
      .from('rss_articles')
      .upsert(articlesToUpsert, { onConflict: 'article_id', ignoreDuplicates: true });

    if (error) {
      console.error('Supabase upsert error:', error);
      return { statusCode: 500, body: `Supabase error: ${error.message}` };
    }
    console.log(`Successfully upserted ${articlesToUpsert.length} articles.`);
  } else {
    console.log('No new articles to upsert.');
  }

  return {
    statusCode: 200,
    body: `Process complete. Found ${articlesToUpsert.length} articles to upsert.`,
  };
};