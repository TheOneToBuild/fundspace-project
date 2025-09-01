import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// Initialize clients
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const parser = new Parser({ timeout: 10000 });

// Constants
const DB_BATCH_SIZE = 100;
const ARTICLES_PER_FEED = 6; // Changed from 2 to 3

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
  let score = 0;

  for (const keyword of excludedKeywords) {
    if (new RegExp(`\\b${keyword}\\b`).test(content)) {
      score++;
    }
  }

  for (const keyword of allowedKeywords) {
    if (new RegExp(`\\b${keyword}\\b`).test(content)) {
      score--;
    }
  }
  
  if (score > 0) {
    console.log(`Excluding (score: ${score}): "${item.title}"`);
    return true;
  }
  
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