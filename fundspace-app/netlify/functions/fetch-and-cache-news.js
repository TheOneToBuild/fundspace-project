import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// Initialize clients
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const parser = new Parser({ timeout: 10000 });

// Constants
const DB_BATCH_SIZE = 100; // Process Supabase upserts in batches of 100

// --- HELPER FUNCTIONS ---

/**
 * Fetches the active RSS feed URLs and the keyword filters from Supabase.
 */
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

  const excludedKeywords = keywords.filter(k => k.type === 'exclude').map(k => k.keyword);
  const allowedKeywords = keywords.filter(k => k.type === 'allow').map(k => k.keyword);

  console.log(`Loaded ${feeds.length} feeds, ${excludedKeywords.length} excluded keywords, and ${allowedKeywords.length} allowed keywords.`);
  return { feeds, excludedKeywords, allowedKeywords };
}

/**
 * Extracts an image from an RSS item.
 */
function extractImage(item) {
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item.enclosure?.url && item.enclosure.type?.includes('image')) return item.enclosure.url;
  const content = item['content:encoded'] || item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

/**
 * Performs a smarter topic check using both "allow" and "exclude" keywords.
 */
function isExcludedTopic(item, { excludedKeywords, allowedKeywords }) {
  const content = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();

  // 1. Check for "allow" keywords first. If a match is found, keep the article.
  const hasAllowedTerm = allowedKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`).test(content));
  if (hasAllowedTerm) {
    return false; // Do NOT exclude
  }

  // 2. If no "allow" keywords, check for "exclude" keywords.
  const hasExcludedTerm = excludedKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`).test(content));
  if (hasExcludedTerm) {
    console.log(`Excluding: "${item.title}"`);
    return true; // Exclude
  }
  
  return false; // No exclusion matched
}

/**
 * Upserts articles to Supabase in batches to avoid payload size limits.
 */
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
  let articlesToUpsert = [];

  for (const result of settledResults) {
    if (result.status === 'rejected') {
        console.warn(`Failed to fetch ${result.url}:`, result.reason);
        continue;
    }

    const feed = result;
    if (feed?.items) {
      for (const item of feed.items) {
        if (!item.title || !item.link) continue;
        if (isExcludedTopic(item, config)) continue;
        
        const image = extractImage(item);
        if (image) {
          articlesToUpsert.push({
            article_id: item.guid || item.link,
            title: item.title,
            summary: item.contentSnippet?.substring(0, 200).trim() || '',
            full_content: item.content || item.contentSnippet || '',
            url: item.link,
            image_url: image,
            pub_date: item.isoDate ? new Date(item.isoDate) : new Date(),
            source_name: feed.title,
            category: feed.category,
          });
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