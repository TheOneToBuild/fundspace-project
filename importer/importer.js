// importer/importer.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chromium } = require('playwright');
const { sitemapXmlParser } = require('sitemap-xml-parser');
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

// --- UPDATED: This function now performs an exploratory crawl from a list of starting URLs ---
async function crawlDomainAndGetContent(urlsForDomain, context, maxPages = 7) {
    const baseUrl = new URL(urlsForDomain[0]).origin;
    console.log(`  -> Starting crawl for domain: ${baseUrl}`);
    
    const visited = new Set();
    const queue = urlsForDomain.map(url => ({ url, priority: 2 })); // Start with all provided URLs at high priority
    
    // Add URLs from the sitemap to the queue with a lower priority
    try {
        const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
        const sitemapResults = await sitemapXmlParser(sitemapUrl, { timeout: 7000, headers: { 'User-Agent': 'Mozilla/5.0' } });
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
    console.log(`  -> Crawl finished for ${baseUrl}. ${pagesCrawled} pages processed.`);
    return combinedText;
}


async function extractGrantInfo(text) {
  const prompt = `
Based on the text, extract grant opportunities as a JSON array of objects. Each object must have:
- title: The official grant title.
- foundation_name: The offering foundation.
- description: A comprehensive, multi-sentence summary of the grant’s purpose, goals, and key activities.
- eligibility: A comprehensive summary of all eligibility requirements (e.g., 501c3, geographic restrictions). If none, MUST be null.
- funding_amount_text: Any currency pattern or range (e.g., "$15,000", "$10k-$25k"). If none, null.
- due_date: Deadline in YYYY-MM-DD format. If rolling or none, null.
- grant_url: The most direct URL to the grant guidelines, RFP, or application page. Prioritize this over a generic homepage. If none, null.
- application_status: Determine if the grant application is "Open", "Invitation Only", or "Closed". If a clear application process is described, assume "Open". If it mentions contacting them first or being a past grantee, assume "Invitation Only". If the deadline has passed, assume "Closed".
- locations: An array of strings of the California county names served, from this list: Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, Sonoma. If none, MUST be an empty array [].
- categories: An array of strings for the grant's primary subject areas (e.g., "Housing", "Youth Development"). Identify up to 3. If none, MUST be an empty array [].
- grant_type: The specific program name or track (e.g., "Arts Program").
Respond with *only* a raw JSON array—no markdown fences.
---
${text}
---
`;
  try {
    const result = await model.generateContent(prompt);
    const raw = (await result.response).text().replace(/^```json\s*|```$/g, '').trim();
    return JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
  } catch (err) {
    console.error('❗ AI grant extraction error:', err);
    return [];
  }
}

async function extractFunderInfo(text) {
  const prompt = `
Based on the text from a foundation's website, extract a SINGLE object for the foundation with:
- name: The official name.
- logo_url: Absolute URL to the logo. If none, null.
- description: A one-paragraph summary of the mission.
- location: Main geographic areas served.
- focus_areas: An array of up to 6 funding categories.
- grant_types: An array of strings for types of grants they provide.
- application_process_summary: A concise, one-paragraph summary of application steps. If none, null.
- notable_grant: A single, one-sentence string describing a specific, impressive grant they have made. Find the best example. If none, MUST be null.
- past_grantees: An array of up to 5 objects, where each object represents a past grantee and has a "name" and a "description" of the project funded. If none are mentioned, MUST be null.
Respond with *only* the raw JSON object—no markdown.
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

async function saveGrantsToSupabase(grants, primaryUrl) {
    if (!grants || !grants.length) {
        console.log('  -> No grants extracted from this domain.');
        return;
    }

    const { data: allLocations, error: locError } = await supabase.from('locations').select('id, name');
    if (locError) {
        console.error('  -> ❗ Could not fetch locations.', locError.message);
        return;
    }
    const locationNameToIdMap = new Map(allLocations.map(loc => [loc.name.toLowerCase().trim(), loc.id]));

    const requiredFields = ['title', 'foundation_name', 'description'];
    const uniqueGrantsMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const g of grants) {
        if (g.application_status !== 'Open') {
            console.log(`  -> ⏭️  Skipping grant "${g.title}" because status is: ${g.application_status}`);
            continue;
        }
        const missingFields = requiredFields.filter(field => !g[field]);
        if (missingFields.length > 0) {
            console.log(`  -> ❗ Skipping grant "${g.title || 'Untitled'}" due to missing required fields: ${missingFields.join(', ')}`);
            continue;
        }
        if (g.due_date && new Date(g.due_date) < today) {
            console.log(`  -> ⏭️  Skipping expired grant: "${g.title}"`);
            continue;
        }
        const uniqueKey = `${normalizeForDeduplication(g.title)}|${normalizeForDeduplication(g.foundation_name)}`;
        if (!uniqueGrantsMap.has(uniqueKey)) {
            uniqueGrantsMap.set(uniqueKey, g);
        }
    }

    const validGrants = Array.from(uniqueGrantsMap.values());
    if (!validGrants.length) {
        console.log('  -> No valid grants to save for this domain.');
        return;
    }

    console.log(`  -> Processing ${validGrants.length} valid grants...`);

    for (const grantData of validGrants) {
        const grantPayload = {
            title: grantData.title.trim(),
            foundation_name: grantData.foundation_name.replace(/^The\s/i, '').trim(),
            grant_type: grantData.grant_type,
            description: grantData.description,
            eligibility: grantData.eligibility,
            funding_amount_text: grantData.funding_amount_text,
            due_date: grantData.due_date,
            url: grantData.grant_url || primaryUrl,
            status: 'Open'
        };
        
        const { data: upsertedGrant, error: upsertError } = await supabase
            .from('grants')
            .upsert(grantPayload, { onConflict: 'title,foundation_name' })
            .select('id')
            .single();

        if (upsertError) { console.error(`  -> ❗ Grant upsert error for "${grantPayload.title}":`, upsertError.message); continue; }
        const grantId = upsertedGrant.id;

        await supabase.from('grant_categories').delete().eq('grant_id', grantId);
        const categoryNames = grantData.categories || [];
        if (categoryNames.length > 0) {
            const categoryObjects = categoryNames.map(name => ({ name: name.trim() }));
            const { data: upsertedCategories, error: catUpsertError } = await supabase.from('categories').upsert(categoryObjects, { onConflict: 'name' }).select('id');
            if (catUpsertError) {
                console.error(`  -> ❗ Error upserting categories:`, catUpsertError.message);
            } else if (upsertedCategories) {
                const { error: catLinkError } = await supabase.from('grant_categories').insert(upsertedCategories.map(c => ({ grant_id: grantId, category_id: c.id })));
                if (catLinkError) console.error(`  -> ❗ Error linking categories:`, catLinkError.message);
            }
        }
        
        await supabase.from('grant_locations').delete().eq('grant_id', grantId);
        const locationIdsToLink = new Set();
        if (grantData.locations && grantData.locations.length > 0) {
            grantData.locations.forEach(locName => {
                const locId = locationNameToIdMap.get(locName.toLowerCase().trim());
                if (locId) locationIdsToLink.add(locId);
            });
        }
        if (locationIdsToLink.size > 0) {
            const { error: locLinkError } = await supabase.from('grant_locations').insert(Array.from(locationIdsToLink).map(locId => ({ grant_id: grantId, location_id: locId })));
            if (locLinkError) console.error(`  -> ❗ Error linking locations:`, locLinkError.message);
        }
        
        console.log(`  -> ✅ Processed grant: "${grantPayload.title}"`);
    }
}

async function saveFunderToSupabase(funder, url) {
    if (!funder) {
        console.log('  -> ❗ No funder object provided.');
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