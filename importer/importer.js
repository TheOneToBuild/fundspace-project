// importer/importer.js

// --- NEW: Load .env file from the parent directory ---
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// --- Existing requires ---
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- NEW: Requires for enhanced crawling ---
const { chromium } = require('playwright');
const { sitemapXmlParser } = require('sitemap-xml-parser');
const pdf = require('pdf-parse');


// --- CONFIGURATION ---
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Tracking Configuration ---
const PROCESSED_URLS_FILE = path.join(__dirname, 'processed_urls.json');
const RESCAN_INTERVAL_HOURS = 24; // How often to re-check a URL (in hours)


// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI    = new GoogleGenerativeAI(GEMINI_API_KEY);
const model    = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- Delay helper ---
const sleep = ms => new Promise(r => setTimeout(r, ms));


// --- HELPER FUNCTION FOR SLUG GENERATION ---
function generateSlug(name) {
  if (!name) return null; // Return null if the name is missing
  return name
    .toLowerCase()
    .replace(/&/g, 'and') // Best practice to replace ampersand
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
    .trim() // Trim leading/trailing spaces
    .replace(/[\s_]+/g, '-')   // Swap whitespace and underscores for a hyphen
    .replace(/--+/g, '-');     // Replace multiple hyphens with a single one
}


// --- HELPER FUNCTIONS FOR URL TRACKING ---
function readProcessedUrls() {
    try {
        if (fs.existsSync(PROCESSED_URLS_FILE)) {
            const fileContent = fs.readFileSync(PROCESSED_URLS_FILE, 'utf8');
            return new Map(Object.entries(JSON.parse(fileContent)));
        }
    } catch (error) {
        console.error("Error reading processed_urls.json, starting fresh.", error);
    }
    return new Map();
}

function writeProcessedUrls(processedMap) {
    fs.writeFileSync(PROCESSED_URLS_FILE, JSON.stringify(Object.fromEntries(processedMap), null, 2), 'utf8');
}

function normalizeForDeduplication(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/\b(the|a|an|for|of)\b/g, '').replace(/\b\d{4}\b/g, '').replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
}


// --- NEW: HELPER FUNCTIONS FOR SITEMAPS AND PDFS ---
async function getUrlsFromSitemap(baseUrl) {
    const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
    console.log(`  -> Checking for sitemap at: ${sitemapUrl}`);
    try {
        const result = await sitemapXmlParser(sitemapUrl, {
            timeout: 7000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
        });
        const urls = result.map(item => item.loc[0]);
        console.log(`  -> Found ${urls.length} URLs in sitemap.`);
        return urls;
    } catch (error) {
        console.log(`  -> No sitemap found or failed to parse.`);
        return [];
    }
}

async function getTextFromPdf(pdfUrl) {
    try {
        console.log(`  -> Extracting text from PDF: ${pdfUrl}`);
        const response = await axios.get(pdfUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
        });
        const pdfData = await pdf(response.data);
        return pdfData.text;
    } catch (error) {
        console.error(`  -> ❗ Failed to parse PDF ${pdfUrl}: ${error.message}`);
        return '';
    }
}


// --- SMARTER CRAWLER FUNCTION (NOW WITH PLAYWRIGHT) ---
async function crawlAndGetContent(initialUrl, maxPages = 7) {
    console.log(`  -> Starting smart crawl at: ${initialUrl}`);

    // --- Playwright Setup ---
    const browser = await chromium.launch();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    const visited = new Set();
    const queue = [];
    let pagesCrawled = 0;
    let combinedText = '';
    const baseUrl = new URL(initialUrl).origin;

    // --- Seed queue with sitemap URLs first ---
    const sitemapUrls = await getUrlsFromSitemap(baseUrl);
    sitemapUrls.forEach(url => {
        if (!visited.has(url) && url.startsWith(baseUrl)) {
            queue.push({ url, priority: 2 }); // Give sitemap URLs high priority
            visited.add(url);
        }
    });

    // --- Add initial URL if not already in queue ---
    if (!visited.has(initialUrl)) {
        queue.push({ url: initialUrl, priority: 2 });
        visited.add(initialUrl);
    }

    // --- UPDATED: Expanded Keywords ---
    const highPriorityKeywords = ['grant', 'funding', 'apply', 'rfp', 'guidelines', 'opportunities', 'our-work', 'eligibility', 'deadline', 'how-to-apply', 'for-grantees'];
    const lowPriorityKeywords = ['about', 'mission', 'programs', 'priorities', 'nonprofits', 'what-we-fund', 'initiatives', 'news', 'blog', 'history', 'annual-report', 'contact', 'team', 'staff'];

    while (queue.length > 0 && pagesCrawled < maxPages) {
        queue.sort((a, b) => b.priority - a.priority);
        const { url } = queue.shift();

        pagesCrawled++;
        console.log(`  -> Fetching [${pagesCrawled}/${maxPages}]: ${url}`);

        const page = await context.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(1500); // Wait for lazy-loaded elements

            const html = await page.content();
            const $ = cheerio.load(html);

            // --- UPDATED: Expanded Content Selectors ---
            const mainContent = $('main, article, #main, #content, .main, .post-content, [role="main"]').text() || $('body').text();
            combinedText += `\n\n---PAGE BREAK (Source: ${url})---\n\n` + mainContent.replace(/\s+/g, ' ').trim();

            // Smarter Link Discovery
            for (const link of $('a').toArray()) {
                const href = $(link).attr('href');
                if (!href) continue;

                try {
                    const absoluteUrl = new URL(href, baseUrl).href;
                    if (!absoluteUrl.startsWith(baseUrl) || visited.has(absoluteUrl)) {
                        continue;
                    }
                    visited.add(absoluteUrl); // Add to visited immediately

                    // --- NEW: PDF Handling ---
                    if (absoluteUrl.toLowerCase().endsWith('.pdf')) {
                        const pdfText = await getTextFromPdf(absoluteUrl);
                        if (pdfText) {
                            combinedText += `\n\n---PDF CONTENT (Source: ${absoluteUrl})---\n\n` + pdfText.replace(/\s+/g, ' ').trim();
                        }
                        continue; // Don't add PDF to crawl queue
                    }

                    const linkText = $(link).text().toLowerCase();
                    let priority = 0;
                    if (highPriorityKeywords.some(kw => absoluteUrl.toLowerCase().includes(kw) || linkText.includes(kw))) {
                        priority = 2; // High priority
                    } else if (lowPriorityKeywords.some(kw => absoluteUrl.toLowerCase().includes(kw) || linkText.includes(kw))) {
                        priority = 1; // Low priority
                    }

                    if (priority > 0) {
                        queue.push({ url: absoluteUrl, priority });
                    }
                } catch (e) { /* Ignore invalid URLs */ }
            }
        } catch (error) {
            console.error(`  -> Failed to process page ${url}: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log(`  -> Finished crawl. Crawled ${pagesCrawled} pages. Total characters: ${combinedText.length}`);
    return combinedText;
}


// --- EXTRACTION AND SAVING FUNCTIONS ---
async function extractGrantInfo(text) {
  const prompt = `
Based on the following text from a foundation's website, which includes source markers like '---PAGE BREAK (Source: URL)---', extract each grant opportunity as an object with:
- title: The official title of the grant or program.
- foundation_name: The name of the foundation offering the grant.
- grant_type: The specific program name or track, if applicable (e.g., "Arts Program", "General Support").
- description: A detailed summary of the grant’s purpose, goals, and what it funds.
- eligibility: Detailed requirements for applicants, such as organization type, budget size, or past work. **If no specific, actionable eligibility criteria are mentioned, or if the foundation does not accept unsolicited proposals, this field MUST be null.**
- funding_amount_text: Any currency pattern or range, e.g., "$15,000" or "$15,000–$20,000". If no specific amount is mentioned, this should be null.
- due_date: The application deadline in YYYY-MM-DD format. If it's rolling, not mentioned, or has passed, this should be null.
- start_date: The earliest date the project can begin, in YYYY-MM-DD format. If not mentioned, this should be null.
- grant_url: The direct, full URL to the specific grant details page or application page. Use the most relevant URL from the source markers in the text. If no specific URL is found for the grant, this can be null.
- location: The specific geographic area the grant serves. Standardize this to "City, CA" or "County Name County". Do not use vague terms like "Bay Area".
- category: A single, most appropriate category from this list: Arts & Culture, Education, Environment, Health, Human Services, Social Justice.
- keywords: An array of up to 10 relevant tags that describe the grant's focus.

**IMPORTANT**: Respond with *only* the raw JSON array—no markdown fences, comments, or other text.

---
${text}
---
`;
  try {
    const result = await model.generateContent(prompt);
    let raw = await (await result.response).text();
    raw = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    return JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
  } catch (err) {
    console.error('❗ AI grant extraction error:', err); return [];
  }
}

async function extractFunderInfo(text) {
  const prompt = `
Based on the text from a foundation's website, extract a SINGLE object for the foundation with the following fields:
- name: The official name of the foundation.
- logo_url: The absolute URL to the foundation's logo image (e.g., .png, .svg). Look for it in headers or meta tags like 'og:image'. If not found, this field MUST be null.
- description: A one-paragraph summary of the foundation's mission, values, and primary purpose.
- location: The main geographic areas they serve (e.g., "San Francisco, CA", "Bay Area").
- focus_areas: An array of up to 6 of the most prominent funding categories.
- grant_types: An array of strings for the types of grants they provide.
- total_funding_annually: A string representing the total annual giving, if mentioned.
- average_grant_size: A string for the typical or average grant amount, if mentioned.
- grants_offered: An integer for the approximate number of grants given annually, if mentioned.
- key_personnel: An array of objects, where each object has "name" and "title". Extract Program Officers, Program Directors, or other relevant grant-making staff. If no relevant staff are found, this field MUST be an empty array [].
- application_process_summary: A concise, one-paragraph summary of the key steps in the application process. Note if they use an online portal, require a Letter of Intent (LOI), or are 'by invitation only'. If no process is described, this field MUST be null.

**IMPORTANT**: Respond with *only* the raw JSON object—no markdown fences, comments, or other text.

---
${text}
---
`;
  try {
    const result = await model.generateContent(prompt);
    let raw = await (await result.response).text();
    raw = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  } catch (err) { console.error('❗ AI funder extraction error:', err); return null; }
}

async function saveGrantsToSupabase(grants, url) {
    if (!grants || !grants.length) {
        console.log('  -> No grants extracted for', url);
        return;
    }

    // --- THIS LINE HAS BEEN UPDATED ---
    const requiredFields = ['title', 'foundation_name', 'description', 'eligibility', 'funding_amount_text'];
    const uniqueGrantsMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const g of grants) {
        const missingFields = requiredFields.filter(field => !g[field]);
        if (missingFields.length > 0) {
            console.log(`  -> ❗ Skipping grant "${g.title || 'Untitled'}" due to missing required fields: ${missingFields.join(', ')}`);
            continue;
        }

        const negativeEligibilityPhrases = [
            "does not specify eligibility", "does not accept unsolicited", "no specific eligibility criteria",
            "contacts organizations directly", "by invitation only"
        ];
        if (g.eligibility && negativeEligibilityPhrases.some(phrase => g.eligibility.toLowerCase().includes(phrase))) {
            console.log(`  -> ❗ Skipping grant "${g.title}" due to generic or invitation-only eligibility text.`);
            continue;
        }

        if (g.due_date) {
            const dueDate = new Date(g.due_date);
            if (dueDate < today) {
                console.log(`  -> ⏭️  Skipping expired grant: "${g.title}" (Due: ${g.due_date})`);
                continue;
            }
        }

        const uniqueKey = `${normalizeForDeduplication(g.title)}|${normalizeForDeduplication(g.foundation_name)}`;
        if (!uniqueGrantsMap.has(uniqueKey)) {
            uniqueGrantsMap.set(uniqueKey, g);
        } else {
             console.log(`  -> ⏭️  Skipping duplicate grant found in same scrape: "${g.title}"`);
        }
    }

    const dataToUpsert = Array.from(uniqueGrantsMap.values()).map(g => ({
        title: g.title.trim(),
        foundation_name: g.foundation_name.replace(/^The\s/i, '').trim(),
        grant_type: g.grant_type,
        description: g.description,
        eligibility: g.eligibility,
        funding_amount_text: g.funding_amount_text,
        due_date: g.due_date ? new Date(g.due_date).toISOString().slice(0, 10) : null,
        start_date: g.start_date ? new Date(g.start_date).toISOString().slice(0, 10) : null,
        location: g.location,
        category: g.category,
        keywords: g.keywords || [],
        url: g.grant_url || url,
        status: 'Open',
        date_added: new Date().toISOString().slice(0, 10),
    }));

    if (!dataToUpsert.length) {
        console.log('  -> No valid, current grants to save for', url);
        return;
    }

    const { data, error } = await supabase.from('grants').upsert(dataToUpsert, { onConflict: 'title,foundation_name' }).select();
    if (error) console.error('  -> ❗ Supabase grant upsert error:', error.message);
    else console.log(`  -> ✅ Upserted ${data.length} grant(s) from ${url}`);
}

async function saveFunderToSupabase(funder, url) {
    if (!funder) {
        console.log('  -> ❗ No funder object provided. Skipping save.');
        return;
    }

    const requiredFields = ['name', 'description'];
    const missingFields = requiredFields.filter(field => !funder[field]);

    if (missingFields.length > 0) {
        console.log(`  -> ❗ Skipping funder "${funder.name || 'Unknown'}" due to missing required fields: ${missingFields.join(', ')}`);
        return;
    }

    const cleanedName = funder.name.replace(/^The\s/i, '').trim();
    const funderSlug = generateSlug(cleanedName);

    const funderData = {
        name: cleanedName,
        slug: funderSlug,
        logo_url: funder.logo_url,
        description: funder.description,
        website: url,
        location: funder.location,
        focus_areas: funder.focus_areas || [],
        grant_types: funder.grant_types || [],
        total_funding_annually: funder.total_funding_annually,
        average_grant_size: funder.average_grant_size,
        grants_offered: funder.grants_offered,
        key_personnel: funder.key_personnel || [],
        application_process_summary: funder.application_process_summary,
        last_updated: new Date().toISOString().slice(0, 10)
    };

    const { data, error } = await supabase.from('funders').upsert(funderData, { onConflict: 'name' }).select();
    if (error) console.error('  -> ❗ Supabase funder upsert error:', error.message);
    else console.log(`  -> ✅ Upserted funder: ${data[0].name}`);
}

// --- MAIN SCRIPT EXECUTION ---
(async function main() {
  console.log('--- Starting 1RFP Crawler & Importer ---');
  const allUrls = fs.readFileSync(path.join(__dirname, 'urls.txt'), 'utf8').split(/\r?\n/).map(u => u.trim()).filter(u => u && /^https?:\/\//i.test(u));
  if (!allUrls.length) { console.error('No URLs found in urls.txt'); return; }

  const processedUrlsMap = readProcessedUrls();
  const now = new Date();

  const urlsToProcess = allUrls.filter(url => {
      if (!processedUrlsMap.has(url)) {
          console.log(`  -> New URL found: ${url}`);
          return true;
      }
      const lastProcessedTime = new Date(processedUrlsMap.get(url));
      const hoursSinceLastScan = (now - lastProcessedTime) / (1000 * 60 * 60);
      if (hoursSinceLastScan > RESCAN_INTERVAL_HOURS) {
          console.log(`  -> URL due for re-scan (last checked ${Math.round(hoursSinceLastScan)} hours ago): ${url}`);
          return true;
      }
      return false;
  });

  if (!urlsToProcess.length) {
      console.log('\n--- No new or outdated URLs to process. Done! ---');
      return;
  }

  console.log(`\nFound ${urlsToProcess.length} URL(s) to process out of ${allUrls.length} total.`);

  for (const url of urlsToProcess) {
    console.log('\nProcessing URL:', url);
    try {
      const combinedText = await crawlAndGetContent(url);
      if (combinedText.length > 50) { // Increased threshold to avoid processing empty/error pages
        console.log('  -> Extracting grant and funder info...');
        const [grants, funder] = await Promise.all([
            extractGrantInfo(combinedText),
            extractFunderInfo(combinedText)
        ]);

        await sleep(1000); // Pause before DB operations

        await saveGrantsToSupabase(grants, url);
        await saveFunderToSupabase(funder, url);

        processedUrlsMap.set(url, now.toISOString());
      } else {
        console.log(`  -> No significant content found for ${url}, skipping.`);
        processedUrlsMap.set(url, now.toISOString());
      }
    } catch (err) {
        console.error('  -> ‼️  Critical error processing', url, err.message);
    }

    console.log('  -> Pausing for 30 seconds before next URL...');
    await sleep(30000);
  }

  writeProcessedUrls(processedUrlsMap);
  console.log('\n--- All URLs processed. Done! ---');
})();