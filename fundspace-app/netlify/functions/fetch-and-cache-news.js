import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const parser = new Parser({ timeout: 10000 });

// Helper functions (no changes)
function extractImage(item) {
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item.enclosure?.url && item.enclosure.type?.includes('image')) return item.enclosure.url;
  const content = item['content:encoded'] || item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

const SPORTS_KEYWORDS = ['sports', 'nba', 'nfl', 'mlb', 'nhl', 'wnba', 'mls', 'olympics', 'world cup', 'super bowl', 'playoffs', 'championship', 'game', 'match', 'player', 'team', 'score', 'inning', 'quarter', 'goal', 'touchdown', 'home run', 'slam dunk', 'athlete', 'warriors', 'giants', '49ers', 'sharks', 'athletics', 'lakers', 'dodgers'];

const CELEBRITY_KEYWORDS = ['celebrity', 'kardashian', 'kanye', 'taylor swift', 'beyoncé', 'movie star', 'red carpet', 'gossip', 'entertainment weekly', 'tmz', 'hollywood', 'actor', 'actress', 'singer'];

// NEW: Real estate keywords to filter out
const REAL_ESTATE_KEYWORDS = ['real estate', 'housing market', 'home sales', 'property', 'mortgage', 'housing prices', 'home prices', 'single-family house', 'condominium', 'condo', 'home sells for', 'house sells for', 'property sells for', 'bedroom home', 'million home', 'million house', 'million property', 'realtor', 'listing', 'home buyer', 'house hunter', 'foreclosure', 'rental market', 'apartment complex', 'residential development'];

const EXCLUDED_KEYWORDS = [...SPORTS_KEYWORDS, ...CELEBRITY_KEYWORDS, ...REAL_ESTATE_KEYWORDS];

function isExcludedTopic(item) {
  const content = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
  const hasExcludedTerm = EXCLUDED_KEYWORDS.some(keyword => new RegExp(`\\b${keyword}\\b`).test(content));
  if (hasExcludedTerm) { console.log(`Excluding: "${item.title}"`); }
  return hasExcludedTerm;
}

export const handler = async () => {
  console.log('Starting scheduled news fetch...');

  const RSS_FEEDS = [
    // Global & US Breaking News (for Hello World)
    { category: 'general', url: 'http://feeds.reuters.com/reuters/topNews' },
    { category: 'general', url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml' },
    { category: 'general', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml' },
    { category: 'general', url: 'https://www.cbsnews.com/latest/rss/main' },
    { category: 'general', url: 'https://www.npr.org/rss/rss.php?id=1001' },
    { category: 'general', url: 'http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml' },

    // California & SF Bay Area News (for Hello Community) - EXPANDED
    { category: 'california', url: 'https://www.mercurynews.com/feed/' },
    { category: 'california', url: 'https://www.sfchronicle.com/bayarea/feed/Bay-Area-News-435.php' },
    { category: 'california', url: 'https://www.latimes.com/california/rss2.0.xml' },
    { category: 'california', url: 'https://calmatters.org/feed/' },
    { category: 'california', url: 'https://www.kqed.org/news/feed' },
    { category: 'california', url: 'https://abc7news.com/feed/' },
    { category: 'california', url: 'https://www.sfgate.com/bayarea/feed/Bay-Area-News-rss-2.xml' },
    
    // NEW BAY AREA LOCAL NEWS SOURCES
    { category: 'california', url: 'https://www.ktvu.com/feed' },
    { category: 'california', url: 'https://www.kron4.com/feed/' },
    { category: 'california', url: 'https://www.smdailyjournal.com/feed/' }, // San Mateo
    { category: 'california', url: 'https://www.marinij.com/feed/' }, // Marin County
    { category: 'california', url: 'https://www.eastbaytimes.com/feed/' }, // East Bay
    { category: 'california', url: 'https://www.pressdemocrat.com/feed/' }, // Sonoma County
    { category: 'california', url: 'https://www.napavalleyregister.com/feed/' }, // Napa Valley
    { category: 'california', url: 'https://www.timesheraldonline.com/feed/' }, // Vallejo/Solano
    { category: 'california', url: 'https://www.contracostatimes.com/feed/' }, // Contra Costa
    { category: 'california', url: 'https://www.berkeleyside.org/feed' }, // Berkeley local
    { category: 'california', url: 'https://oaklandside.org/feed/' }, // Oakland local
    { category: 'california', url: 'https://www.paloaltoonline.com/feed/' }, // Palo Alto
    { category: 'california', url: 'https://www.sanjoseinside.com/feed/' }, // San Jose
    { category: 'california', url: 'https://www.mv-voice.com/feed/' }, // Mountain View
    { category: 'california', url: 'https://www.almanacnews.com/feed/' }, // Peninsula communities
    { category: 'california', url: 'https://www.marinscope.com/feed/' }, // Additional Marin coverage
    
    // TECH & INNOVATION NEWS (Bay Area focused)
    { category: 'california', url: 'https://techcrunch.com/feed/' },
    { category: 'california', url: 'https://siliconangle.com/feed/' },
    { category: 'california', url: 'https://www.bizjournals.com/sanfrancisco/feeds/news.xml' }, // SF Business Journal
    { category: 'california', url: 'https://www.bizjournals.com/sanjose/feeds/news.xml' }, // Silicon Valley Business Journal

    // Philanthropy & Funder News (for Hello Community)
    { category: 'funder', url: 'https://nonprofitquarterly.org/feed/' },
    { category: 'funder', url: 'https://www.insidephilanthropy.com/home/rss' },
    { category: 'funder', url: 'https://www.philanthropy.com/feed/grants' },
    { category: 'funder', url: 'https://candid.org/feed' },
    { category: 'funder', url: 'https://www.hewlett.org/feed/' },
    { category: 'funder', url: 'https://www.packard.org/feed/' }, // Packard Foundation
    { category: 'funder', url: 'https://www.siliconvalleycf.org/feed/' }, // Silicon Valley Community Foundation
    
    // Nonprofit Sector News (for Hello Community)
    { category: 'nonprofit', url: 'https://www.philanthropy.com/feed' },
    { category: 'nonprofit', url: 'https://ssir.org/rss' },
    { category: 'nonprofit', url: 'https://www.thenonprofittimes.com/feed/' },
    { category: 'nonprofit', url: 'https://blueavocado.org/feed/' },
    { category: 'nonprofit', url: 'https://www.councilofnonprofits.org/feed' }, // Council of Nonprofits
  ];

  const fetchPromises = RSS_FEEDS.map(feedInfo =>
    parser.parseURL(feedInfo.url).then(feed => ({ ...feed, category: feedInfo.category }))
      .catch(err => { console.warn(`Failed to fetch ${feedInfo.url}:`, err.message); return null; })
  );

  const results = await Promise.all(fetchPromises);
  let articlesToUpsert = [];

  for (const feed of results) {
    if (feed?.items) {
      for (const item of feed.items) {
        if (isExcludedTopic(item)) continue;
        const image = extractImage(item);
        if (image) {
          articlesToUpsert.push({
            article_id: item.guid || item.link, title: item.title, summary: item.contentSnippet?.substring(0, 200).trim() || '',
            full_content: item.content || item.contentSnippet || '', url: item.link, image_url: image,
            pub_date: item.isoDate ? new Date(item.isoDate) : new Date(), source_name: feed.title, category: feed.category,
          });
        }
      }
    }
  }

  if (articlesToUpsert.length > 0) {
    const { data, error } = await supabase.from('rss_articles').upsert(articlesToUpsert, { onConflict: 'article_id', ignoreDuplicates: true });
    if (error) { console.error('Supabase upsert error:', error); return { statusCode: 500, body: `Supabase error: ${error.message}` }; }
    console.log(`Successfully upserted ${articlesToUpsert.length} articles.`);
  } else {
    console.log('No new articles to upsert.');
  }

  return { statusCode: 200, body: `Process complete. Found ${articlesToUpsert.length} articles to upsert.` };
};