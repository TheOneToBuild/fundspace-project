import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// Initialize clients
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const parser = new Parser({ timeout: 10000 });

// Constants
const DB_BATCH_SIZE = 100;
const ARTICLES_PER_FEED = 10; // Increased to find more relevant articles

// --- HELPER FUNCTIONS ---

async function fetchConfiguration() {
  console.log('Fetching configuration from Supabase...');
  const { data: feeds, error: feedsError } = await supabase
    .from('rss_sources')
    .select('url, category')
    .eq('is_enabled', true);
  if (feedsError) throw new Error(`Failed to fetch RSS sources: ${feedsError.message}`);

  const { data: keywords, error: keywordsError } = await supabase
    .from('excluded_keywords')
    .select('keyword, type');
  if (keywordsError) throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);

  const excludedKeywords = new Set(keywords.filter(k => k.type === 'exclude').map(k => k.keyword));
  const allowedKeywords = new Set(keywords.filter(k => k.type === 'allow').map(k => k.keyword));

  console.log(`Loaded ${feeds.length} feeds, ${excludedKeywords.size} excluded keywords, and ${allowedKeywords.size} allowed keywords.`);
  return { feeds, excludedKeywords, allowedKeywords };
}

function extractImage(item) {
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item.enclosure?.url && item.enclosure.type?.includes('image')) return item.enclosure.url;
  const content = item['content:encoded'] || item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

function isExcludedTopic(item, { excludedKeywords, allowedKeywords }) {
  const content = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
  
  // EXCLUDE: Sports content
  const sportsKeywords = [
    'warriors', 'giants', '49ers', 'sharks', 'raiders', 'athletics', 'a\'s',
    'nfl', 'nba', 'mlb', 'nhl', 'football', 'basketball', 'baseball', 'hockey',
    'game', 'score', 'playoff', 'championship', 'coach', 'player', 'team',
    'season', 'draft', 'trade', 'injury report', 'mvp', 'quarterback', 'pitcher'
  ];
  
  // EXCLUDE: Real estate/home sales
  const realEstateKeywords = [
    'home sales', 'real estate', 'property sold', 'million dollar home',
    'most expensive', 'luxury home', 'mansion', 'penthouse', 'listing',
    'market price', 'home prices', 'property values', 'zip code', 'median price',
    'square feet', 'bedroom', 'bathroom', 'sold for', 'asking price'
  ];
  
  // EXCLUDE: Celebrity/Entertainment
  const celebrityKeywords = [
    'celebrity', 'actor', 'actress', 'singer', 'musician', 'hollywood',
    'red carpet', 'premiere', 'oscar', 'grammy', 'emmy', 'golden globe',
    'breakup', 'dating', 'relationship', 'marriage', 'divorce', 'baby',
    'instagram', 'tiktok', 'social media', 'influencer', 'viral'
  ];
  
  // EXCLUDE: Lottery/gambling
  const lotteryKeywords = [
    'winning numbers', 'lottery', 'powerball', 'mega millions', 'jackpot',
    'fantasy 5', 'pick 3', 'pick 4', 'cash pop', 'hit 5', 'gambling'
  ];
  
  // EXCLUDE: Weather routine updates
  const routineWeatherKeywords = [
    'forecast:', 'temperature', 'sunny', 'cloudy', 'chance of rain',
    'high of', 'low of', 'wind speed', 'humidity', 'uv index'
  ];
  
  // EXCLUDE: Crime blotter/minor incidents
  const minorCrimeKeywords = [
    'burglary', 'theft', 'shoplifting', 'arrested for', 'traffic stop',
    'dui', 'vandalism', 'trespassing', 'noise complaint', 'parking violation'
  ];
  
  // Check if content contains excluded topics
  const hasExcludedContent = [
    ...sportsKeywords,
    ...realEstateKeywords,
    ...celebrityKeywords,
    ...lotteryKeywords,
    ...routineWeatherKeywords,
    ...minorCrimeKeywords
  ].some(keyword => content.includes(keyword));
  
  if (hasExcludedContent) {
    console.log(`Excluding (filtered content): "${item.title}"`);
    return true;
  }
  
  // INCLUDE: Important/trending topics we want
  const importantKeywords = [
    // Government/Politics
    'city council', 'mayor', 'governor', 'election', 'vote', 'ballot',
    'policy', 'legislation', 'ordinance', 'budget', 'tax', 'funding',
    
    // Housing/Development (important stories, not sales)
    'housing crisis', 'homeless', 'development', 'zoning', 'rent control',
    'affordable housing', 'displacement', 'gentrification', 'eviction',
    'tenant rights', 'housing shortage', 'construction', 'planning commission',
    
    // Transportation/Infrastructure
    'transit', 'bart', 'muni', 'highway', 'bridge', 'infrastructure',
    'transportation', 'traffic', 'construction project', 'public works',
    
    // Environment/Climate
    'climate', 'environment', 'pollution', 'air quality', 'water',
    'sustainability', 'renewable energy', 'carbon', 'emissions',
    
    // Public Safety (major incidents)
    'fire', 'earthquake', 'emergency', 'evacuation', 'disaster',
    'shooting', 'accident', 'investigation', 'police', 'crime',
    
    // Economics/Business (significant)
    'economy', 'business', 'startup', 'tech company', 'jobs', 'unemployment',
    'recession', 'inflation', 'stock market', 'ipo', 'merger', 'acquisition',
    
    // Education
    'school', 'university', 'education', 'students', 'teachers',
    'graduation', 'enrollment', 'tuition', 'scholarship',
    
    // Health/Social Issues
    'health', 'hospital', 'medical', 'pandemic', 'vaccine', 'outbreak',
    'mental health', 'addiction', 'social services', 'welfare',
    
    // Arts/Culture (significant events)
    'museum', 'art', 'festival', 'concert', 'theater', 'cultural',
    'community event', 'celebration', 'exhibition'
  ];
  
  // Check if content contains important/trending topics
  const hasImportantContent = importantKeywords.some(keyword => 
    content.includes(keyword)
  );
  
  // If it doesn't have important content, exclude it
  if (!hasImportantContent) {
    console.log(`Excluding (not trending/important): "${item.title}"`);
    return true;
  }
  
  // Check Bay Area relevance
  const bayAreaKeywords = [
    'san francisco', 'sf', 'oakland', 'berkeley', 'san jose', 'palo alto',
    'mountain view', 'sunnyvale', 'fremont', 'hayward', 'santa clara',
    'san mateo', 'redwood city', 'marin', 'napa', 'sonoma', 'contra costa',
    'alameda', 'peninsula', 'east bay', 'north bay', 'south bay',
    'bay area', 'silicon valley', 'california', 'ca'
  ];
  
  const hasBayAreaRelevance = bayAreaKeywords.some(keyword => 
    content.includes(keyword)
  );
  
  // For California category, require Bay Area relevance
  if (!hasBayAreaRelevance) {
    console.log(`Excluding (not Bay Area relevant): "${item.title}"`);
    return true;
  }
  
  // Allow through if it passes all filters
  return false;
}

async function batchUpsertArticles(articles) {
  let totalUpserted = 0;
  for (let i = 0; i < articles.length; i += DB_BATCH_SIZE) {
    const batch = articles.slice(i, i + DB_BATCH_SIZE);
    const { error } = await supabase.from('rss_articles').upsert(batch, { onConflict: 'article_id', ignoreDuplicates: true });

    if (error) {
      console.error(`Supabase batch upsert error:`, error);
    } else {
      totalUpserted += batch.length;
    }
  }
  return totalUpserted;
}

// --- MAIN HANDLER ---

export const handler = async () => {
  console.log('Starting scheduled news fetch...');
  let config;

  try {
    config = await fetchConfiguration();
  } catch (error) {
    console.error('Critical error during setup:', error);
    return { statusCode: 500, body: `Configuration error: ${error.message}` };
  }
  
  const fetchPromises = config.feeds.map(feedInfo =>
    parser.parseURL(feedInfo.url)
      .then(feed => ({ ...feed, category: feedInfo.category, status: 'fulfilled' }))
      .catch(err => ({ url: feedInfo.url, reason: err.message, status: 'rejected' }))
  );
  
  const settledResults = await Promise.all(fetchPromises);
  const articlesToUpsert = [];
  const processedTitles = new Set();

  for (const result of settledResults) {
    if (result.status === 'rejected') {
        console.warn(`Failed to fetch ${result.url}:`, result.reason);
        continue;
    }

    const feed = result;
    if (feed?.items) {
      const recentItems = feed.items.slice(0, ARTICLES_PER_FEED);

      for (const item of recentItems) {
        if (!item.title || !item.link) continue;
        if (processedTitles.has(item.title.trim())) continue;
        if (isExcludedTopic(item, config)) continue;
        
        const image = extractImage(item);
        if (image) {
          articlesToUpsert.push({
            article_id: item.guid || item.link,
            title: item.title.trim(),
            summary: item.contentSnippet?.substring(0, 200).trim() || '',
            full_content: item.content || item.contentSnippet || '',
            url: item.link,
            image_url: image,
            pub_date: item.isoDate ? new Date(item.isoDate) : new Date(),
            source_name: feed.title,
            category: feed.category,
          });
          processedTitles.add(item.title.trim());
        }
      }
    }
  }

  if (articlesToUpsert.length > 0) {
    console.log(`Found ${articlesToUpsert.length} valid articles. Starting batch upsert...`);
    const totalUpserted = await batchUpsertArticles(articlesToUpsert);
    console.log(`Successfully upserted ${totalUpserted} articles.`);
  } else {
    console.log('No new articles to upsert.');
  }

  return { statusCode: 200, body: `Process complete. Found ${articlesToUpsert.length} articles to process.` };
};