// importer/importer.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chromium } = require('playwright');
const xml2js = require('xml2js');
const pdf = require('pdf-parse');

// --- CONFIGURATION ---
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PROCESSED_URLS_FILE = path.join(__dirname, 'processed_urls.json');
const RESCAN_INTERVAL_HOURS = 24;

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI    = new GoogleGenerativeAI(GEMINI_API_KEY);
const model    = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

function generateSlug(name) {
  if (!name) return null;
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/--+/g, '-');
}

function readProcessedUrls() {
    try {
        if (fs.existsSync(PROCESSED_URLS_FILE)) {
            return new Map(Object.entries(JSON.parse(fs.readFileSync(PROCESSED_URLS_FILE, 'utf8'))));
        }
    } catch (error) { console.error("Error reading processed_urls.json.", error); }
    return new Map();
}

function writeProcessedUrls(processedMap) {
    fs.writeFileSync(PROCESSED_URLS_FILE, JSON.stringify(Object.fromEntries(processedMap), null, 2), 'utf8');
}

function normalizeForDeduplication(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/\b(the|a|an|for|of)\b/g, '').replace(/\b\d{4}\b/g, '').replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
}

async function getTextFromPdf(pdfUrl) {
    try {
        console.log(`  -> Extracting text from PDF: ${pdfUrl}`);
        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer', timeout: 15000 });
        const pdfData = await pdf(response.data);
        return pdfData.text;
    } catch (error) {
        console.error(`  -> ❗ Failed to parse PDF ${pdfUrl}: ${error.message}`);
        return '';
    }
}

// NEW FUNCTION: Replace sitemapXmlParser
async function parseSitemap(sitemapUrl, options = {}) {
  const { timeout = 7000, headers = { 'User-Agent': 'Mozilla/5.0' } } = options;
  
  try {
    const response = await axios.get(sitemapUrl, {
      timeout,
      headers,
      validateStatus: (status) => status < 500
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }
    
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true
    });
    
    const result = await parser.parseStringPromise(response.data);
    
    // Handle both sitemap index and regular sitemap formats
    if (result.sitemapindex && result.sitemapindex.sitemap) {
      // This is a sitemap index, we'd need to fetch each sitemap
      // For now, we'll just log this case
      console.log('  -> Found sitemap index, would need to fetch sub-sitemaps');
      return [];
    }
    
    if (result.urlset && result.urlset.url) {
      const urls = Array.isArray(result.urlset.url) 
        ? result.urlset.url 
        : [result.urlset.url];
      
      // Transform to match the expected format of the old library
      return urls.map(url => ({
        loc: [typeof url === 'string' ? url : url.loc],
        lastmod: url.lastmod ? [url.lastmod] : undefined,
        changefreq: url.changefreq ? [url.changefreq] : undefined,
        priority: url.priority ? [url.priority] : undefined
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Failed to parse sitemap ${sitemapUrl}:`, error.message);
    return [];
  }
}

// --- UPDATED: This function now performs an exploratory crawl from a list of starting URLs ---
async function crawlDomainAndGetContent(urlsForDomain, context, maxPages = 7) {
    const baseUrl = new URL(urlsForDomain[0]).origin;
    console.log(`  -> Starting crawl for domain: ${baseUrl}`);
    
    const visited = new Set();
    const queue = urlsForDomain.map(url => ({ url, priority: 2 })); // Start with all provided URLs at high priority
    
    // Add URLs from the sitemap to the queue with a lower priority
    try {
        const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
        // UPDATED: Using new parseSitemap function
        const sitemapResults = await parseSitemap(sitemapUrl, { timeout: 7000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        sitemapResults.forEach(item => {
            const sitemapUrl = item.loc[0];
            if (!visited.has(sitemapUrl)) {
                queue.push({ url: sitemapUrl, priority: 1 });
            }
        });
        console.log(`  -> Found ${sitemapResults.length} URLs in sitemap.`);
    } catch (error) {
        console.log(`  -> No sitemap found or failed to parse for ${baseUrl}.`);
    }

    let pagesCrawled = 0;
    let combinedText = '';
    const highPriorityKeywords = ['grant', 'funding', 'apply', 'rfp', 'guidelines', 'opportunities', 'eligibility', 'deadline'];

    while (queue.length > 0 && pagesCrawled < maxPages) {
        queue.sort((a, b) => b.priority - a.priority || Math.random() - 0.5);
        const { url } = queue.shift();

        if (visited.has(url)) continue;
        visited.add(url);
        
        pagesCrawled++;
        console.log(`    -> Fetching [${pagesCrawled}/${maxPages}]: ${url.substring(0, 80)}...`);
        const page = await context.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            const mainContent = await page.evaluate(() => document.querySelector('main, article, #main, #content, .main, .post-content, [role="main"]')?.innerText || document.body.innerText);
            combinedText += `\n\n---PAGE BREAK (Source: ${url})---\n\n` + mainContent.replace(/\s+/g, ' ').trim();
            
            const links = await page.$$eval('a', anchors => anchors.map(a => a.href));
            for (const href of links) {
                if (!href) continue;
                try {
                    const absoluteUrl = new URL(href, baseUrl).href;
                    if (!absoluteUrl.startsWith(baseUrl) || visited.has(absoluteUrl)) continue;
                    
                    if (absoluteUrl.toLowerCase().endsWith('.pdf')) {
                        if (visited.has(absoluteUrl)) continue;
                        visited.add(absoluteUrl);
                        const pdfText = await getTextFromPdf(absoluteUrl);
                        if (pdfText) combinedText += `\n\n---PDF CONTENT (Source: ${absoluteUrl})---\n\n` + pdfText.replace(/\s+/g, ' ').trim();
                    } else {
                        let priority = 1;
                        if (highPriorityKeywords.some(kw => absoluteUrl.toLowerCase().includes(kw))) {
                            priority = 2;
                        }
                        queue.push({ url: absoluteUrl, priority });
                    }
                } catch (e) {}
            }
        } catch (error) {
            console.error(`    -> Failed to process page ${url}: ${error.message}`);
        } finally {
            await page.close();
        }
    }
    console.log(`  -> Crawl finished for ${baseUrl}. Total characters extracted: ${combinedText.length}`);
    return combinedText;
}

async function extractGrantInfo(text) {
    if (!text || text.length < 100) return [];
    const prompt = `Analyze the following content and extract information about grants. For each distinct grant opportunity found, provide the following details in valid JSON format:
    - title: Grant name (required)
    - description: Brief description of the grant (required)
    - eligibility: Who can apply (if mentioned)
    - fundingAmount: Funding amount or range (if mentioned)
    - deadline: Application deadline (if mentioned)
    - applicationUrl: Application URL (if found)
    - keywords: Array of relevant keywords
    IMPORTANT: 
    - Return ONLY a JSON array. No markdown, no explanations.
    - Each grant must have at least a title and description.
    - If no grants are found, return an empty array: []
    - Ensure the JSON is valid and properly escaped.
    Content to analyze:
    ${text.substring(0, 60000)}`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim();
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        return JSON.parse(jsonText) || [];
    } catch (error) {
        console.error('  -> ❗ Failed to extract grant info:', error.message);
        return [];
    }
}

async function extractFunderInfo(text) {
    if (!text || text.length < 100) return null;
    const prompt = `Analyze the following content and extract information about the funding organization. Provide details in valid JSON format:
    - name: Organization name (required)
    - description: Brief description of the organization (required)
    - logo_url: URL to the organization's logo (if found)
    - location: Physical location or headquarters
    - focus_areas: Array of focus areas or priorities
    - grant_types: Array of types of grants offered
    - application_process_summary: Brief summary of how to apply
    - past_grantees: Information about past recipients (if mentioned)
    - notable_grant: Example of a notable grant (if mentioned)
    IMPORTANT:
    - Return ONLY a JSON object. No markdown, no explanations.
    - Must have at least name and description.
    - If no funder info is found, return null.
    - Ensure the JSON is valid and properly escaped.
    Content to analyze:
    ${text.substring(0, 60000)}`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim();
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('  -> ❗ Failed to extract funder info:', error.message);
        return null;
    }
}

async function saveGrantsToSupabase(grants, url) {
    if (!grants || !Array.isArray(grants) || grants.length === 0) return;
    console.log(`  -> Processing ${grants.length} grant(s)...`);
    const { data: existingGrants } = await supabase.from('grants').select('title');
    const existingTitles = new Set(existingGrants?.map(g => normalizeForDeduplication(g.title)) || []);

    for (const grant of grants) {
        if (!grant.title || !grant.description) continue;
        const normalizedTitle = normalizeForDeduplication(grant.title);
        if (existingTitles.has(normalizedTitle)) {
            console.log(`  -> ⏭️  Skipping duplicate grant: "${grant.title}"`);
            continue;
        }
        const cleanedTitle = grant.title.replace(/^\d{4}\s/, '').trim();
        const grantData = {
            title: cleanedTitle,
            slug: generateSlug(cleanedTitle),
            description: grant.description,
            eligibility_criteria: grant.eligibility || null,
            max_funding_amount: grant.fundingAmount || null,
            deadline: grant.deadline || null,
            application_url: grant.applicationUrl || url,
            keywords: grant.keywords || [],
            source_url: url,
            last_updated: new Date().toISOString().slice(0, 10),
            status: 'Open',
            foundation_name: 'Unknown'
        };
        const { data, error } = await supabase.from('grants').insert([grantData]).select();
        if (error) console.error('  -> ❗ Grant insert error:', error.message);
        else console.log(`  -> ✅ Added grant: ${data[0].title}`);
    }
}

async function saveFunderToSupabase(funder, url) {
    if (!funder || typeof funder !== 'object') {
        console.log('  -> No funder information extracted.');
        return;
    }
    const requiredFields = ['name', 'description'];
    const missingFields = requiredFields.filter(field => !funder[field]);
    if (missingFields.length > 0) {
        console.log(`  -> ❗ Skipping funder "${funder.name || 'Unknown'}" due to missing required fields: ${missingFields.join(', ')}`);
        return;
    }
    const cleanedName = funder.name.replace(/^The\s/i, '').trim();
    const funderData = {
        name: cleanedName,
        slug: generateSlug(cleanedName),
        logo_url: funder.logo_url,
        description: funder.description,
        website: url,
        location: funder.location,
        focus_areas: funder.focus_areas || [],
        grant_types: funder.grant_types || [],
        application_process_summary: funder.application_process_summary,
        past_grantees: funder.past_grantees || null,
        notable_grant: funder.notable_grant || null,
        last_updated: new Date().toISOString().slice(0, 10)
    };
    const { data, error } = await supabase.from('funders').upsert(funderData, { onConflict: 'name' }).select();
    if (error) console.error('  -> ❗ Funder upsert error:', error.message);
    else console.log(`  -> ✅ Upserted funder: ${data[0].name}`);
}

(async function main() {
  console.log('--- Starting 1RFP Crawler & Importer ---');
  const allUrls = fs.readFileSync(path.join(__dirname, 'urls.txt'), 'utf8').split(/\r?\n/).filter(u => u && u.startsWith('http'));
  if (!allUrls.length) { console.error('No URLs found in urls.txt'); return; }

  const processedUrlsMap = readProcessedUrls();
  const now = new Date();
  
  const urlsByDomain = new Map();
  for (const url of allUrls) {
      try {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        if (!urlsByDomain.has(domain)) {
            urlsByDomain.set(domain, []);
        }
        urlsByDomain.get(domain).push(url);
      } catch (e) {
        console.warn(`  -> ⚠️  Skipping invalid URL: ${url}`);
      }
  }

  const domainsToProcess = Array.from(urlsByDomain.keys()).filter(domain => {
      const primaryUrl = urlsByDomain.get(domain)[0];
      if (!processedUrlsMap.has(primaryUrl)) return true;
      const lastProcessedTime = new Date(processedUrlsMap.get(primaryUrl));
      return (now - lastProcessedTime) / (1000 * 60 * 60) > RESCAN_INTERVAL_HOURS;
  });

  if (!domainsToProcess.length) {
      console.log('\n--- No new domains to process. All up to date. ---');
      return;
  }
  console.log(`\nFound ${domainsToProcess.length} domain(s) to process.`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' });

  for (const domain of domainsToProcess) {
    const urlsInDomain = urlsByDomain.get(domain);
    const primaryUrl = urlsInDomain[0];
    
    try {
        const combinedTextForDomain = await crawlDomainAndGetContent(urlsInDomain, context);

        if (combinedTextForDomain.length > 100) {
            console.log('  -> Extracting grant and funder info from combined text...');
            const [grants, funder] = await Promise.all([
                extractGrantInfo(combinedTextForDomain),
                extractFunderInfo(combinedTextForDomain)
            ]);
            
            await sleep(1000); // Small pause to avoid overwhelming any services

            await saveGrantsToSupabase(grants, primaryUrl);
            await saveFunderToSupabase(funder, primaryUrl);
            
            processedUrlsMap.set(primaryUrl, now.toISOString());
        } else {
            console.log(`  -> No significant content found for domain ${domain}.`);
        }
    } catch (err) {
        console.error(`  -> ‼️  Critical error processing domain ${domain}:`, err.message);
    }
    
    console.log(`  -> Pausing before next domain...`);
    await sleep(15000);
  }
  
  await browser.close();
  writeProcessedUrls(processedUrlsMap);
  console.log('\n--- All domains processed. ---');
})();