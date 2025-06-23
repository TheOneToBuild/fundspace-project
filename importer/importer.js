// importer/importer.js - COMPLETE RELATIONAL VERSION (Corrected)
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

// --- UTILITY FUNCTIONS ---
const sleep = ms => new Promise(r => setTimeout(r, ms));

function generateSlug(name) {
  if (!name) return null;
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^\\w\\s-]/g, '').trim().replace(/[\\s_]+/g, '-').replace(/--+/g, '-');
}

function readProcessedUrls() {
    try {
        if (fs.existsSync(PROCESSED_URLS_FILE)) {
            return new Map(Object.entries(JSON.parse(fs.readFileSync(PROCESSED_URLS_FILE, 'utf-8'))));
        }
    } catch (error) {
        console.error("Error reading processed URLs, starting fresh:", error);
    }
    return new Map();
}

function writeProcessedUrls(data) {
    fs.writeFileSync(PROCESSED_URLS_FILE, JSON.stringify(Object.fromEntries(data), null, 2));
}

async function getSitemapUrls(domain) {
    try {
        const sitemapUrl = `${domain}/sitemap.xml`;
        const response = await axios.get(sitemapUrl);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        const urls = [];
        if (result.urlset && result.urlset.url) {
            result.urlset.url.forEach(item => {
                if (item.loc && item.loc[0]) {
                    urls.push(item.loc[0]);
                }
            });
        }
        return urls;
    } catch (error) {
        console.log(`  -> No sitemap found at ${domain}/sitemap.xml`);
        return [];
    }
}

async function getUrlsFromRobotsTxt(domain) {
    try {
        const robotsUrl = `${domain}/robots.txt`;
        const response = await axios.get(robotsUrl);
        const lines = response.data.split('\n');
        const sitemapUrls = [];
        lines.forEach(line => {
            if (line.toLowerCase().startsWith('sitemap:')) {
                const url = line.substring(8).trim();
                if (url) sitemapUrls.push(url);
            }
        });
        return sitemapUrls;
    } catch (error) {
        console.log(`  -> No robots.txt found at ${domain}/robots.txt`);
        return [];
    }
}

async function crawlDomainAndGetContent(urls, context) {
    let combinedText = '';
    for (const url of urls) {
        try {
            console.log(`  -> Crawling: ${url}`);
            const text = await getTextFromUrl(url, context);
            if (text) {
                combinedText += `\n\n--- Content from ${url} ---\n\n${text}`;
            }
            await sleep(1000);
        } catch (error) {
            console.error(`  -> Error crawling ${url}:`, error.message);
        }
    }
    return combinedText;
}

async function getTextFromUrl(url, context) {
    try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        const text = await page.evaluate(() => {
            document.querySelectorAll('script, style').forEach(el => el.remove());
            return document.body.innerText;
        });
        await page.close();
        return text;
    } catch (error) {
        console.error(`  -> Error getting text from ${url}:`, error.message);
        return null;
    }
}

async function extractGrantInfo(text) {
    if (!text || text.length < 100) return [];
    const prompt = `Analyze the following content and extract information about grants. For each distinct grant opportunity found, provide the following details in valid JSON format:
    - title: Grant name (required).
    - description: Brief description of the grant (required).
    - eligibility_criteria: Who can apply and eligibility requirements (if mentioned).
    - funding_amount: Maximum funding amount as a NUMBER (no commas or symbols). If a range like "$5,000 to $10,000", use 10000.
    - funding_amount_text: The funding amount as displayed in the original text (e.g., "$5,000 - $10,000", "Up to $50,000").
    - deadline: Application deadline in YYYY-MM-DD format. If year not mentioned, use 2025. If date has passed, use 2026.
    - application_url: Direct URL to application or grant details page.
    - grant_type: Type of grant (e.g., "General Operating Support", "Project Grant", "Capacity Building").
    - categories: Array of focus areas or categories this grant supports (e.g., ["Education", "Arts & Culture", "Healthcare"]).
    - locations: Array of eligible geographic locations (e.g., ["San Francisco", "Bay Area", "California"]).

    IMPORTANT:
    - Return ONLY a valid JSON array. No markdown or explanations.
    - Each grant must have at least "title" and "description".
    - If a field cannot be determined, set to null.
    - If no grants found, return empty array: [].
    - Ensure proper JSON escaping.

    Content to analyze:
    ${text.substring(0, 80000)}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim().replace(/^```json\s*|```$/g, '');
        return JSON.parse(jsonText) || [];
    } catch (error) {
        console.error('  -> ❗ Failed to extract grant info:', error.message);
        return [];
    }
}

async function extractFunderInfo(text) {
    if (!text || text.length < 100) return null;
    const prompt = `
        Analyze the content from a funder's website and extract the following details.
        **Required JSON fields:**
        - "name": The official name of the organization.
        - "funder_type": The type of funder. Choose from: "Private Foundation", "Community Foundation", "Corporate Foundation", "City Government", "State Government", "Federal Government", or "Other".
        - "geographic_scope": An array of strings listing the Bay Area counties this organization typically funds.
        - "description": A detailed summary of the foundation's story, mission, and funding philosophy.
        - "focus_areas": An array of strings for the types of funds they provide (e.g., ["Housing", "Education", "Homelessness"]).
        - "grant_types": An array of common grant types they offer.
        - "total_funding_annually": A string representing approximate total annual giving.
        - "average_grant_size": A string representing their typical grant size as a dollar figure.
        - "application_process_summary": A brief summary of how an organization can apply for funding.
        - "key_personnel": An array of objects for Program Officers or grant-making staff, each with "name" and "title".
        - "past_grantees": A JSON array of up to 6 notable past grantee names as strings.
        - "notable_grant": A summary of any recent news, grants, or work the foundation has done.
        - "logo_url": A direct URL to the organization's logo image.

        **Instructions & Rules:**
        - CRITICAL RULE: For any field, if you cannot find specific, factual data, you MUST return a value of null.
        - Return ONLY a single, valid JSON object.
        
        Content to analyze:
        ${text.substring(0, 80000)}
    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim().replace(/^```json\s*|```$/g, '');
        return JSON.parse(jsonText) || null;
    } catch (error) {
        console.error('  -> ❗ Failed to extract funder info:', error.message);
        return null;
    }
}

// --- DATABASE HELPERS ---
async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    const { data: existing } = await supabase.from('categories').select('id').eq('name', categoryName).single();
    if (existing) return existing.id;
    const { data: newCategory } = await supabase.from('categories').insert({ name: categoryName }).select('id').single();
    return newCategory?.id;
}

async function getOrCreateLocation(locationName) {
    if (!locationName) return null;
    const { data: existing } = await supabase.from('locations').select('id').eq('name', locationName).single();
    if (existing) return existing.id;
    const { data: newLocation } = await supabase.from('locations').insert({ name: locationName }).select('id').single();
    return newLocation?.id;
}

async function getOrCreateFunderType(typeName) {
    if (!typeName) return null;
    const { data: existingType } = await supabase.from('funder_types').select('id').eq('name', typeName).single();
    if (existingType) return existingType.id;
    console.log(`     -> Importer discovered a new funder type: "${typeName}". Adding to database.`);
    const { data: newType, error } = await supabase.from('funder_types').insert({ name: typeName }).select('id').single();
    if (error) {
        console.error(`     -> Error creating new funder type:`, error);
        return null;
    }
    return newType?.id;
}

async function linkFunderToCategories(funderId, focusAreas) {
    if (!funderId || !focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) return;
    console.log(`     -> Linking funder to categories: ${focusAreas.join(', ')}`);
    for (const categoryName of focusAreas) {
        const categoryId = await getOrCreateCategory(categoryName.trim());
        if (categoryId) {
            await supabase.from('funder_categories').insert({ funder_id: funderId, category_id: categoryId });
        }
    }
}

async function getLocationId(locationName) {
    if (!locationName) return null;
    const { data: existingLocation } = await supabase.from('locations').select('id').eq('name', locationName).single();
    if (!existingLocation) console.warn(`     -> Location "${locationName}" not found in the predefined locations table.`);
    return existingLocation?.id;
}

async function linkFunderToLocations(funderId, locationNames) {
    if (!funderId || !locationNames || !Array.isArray(locationNames) || locationNames.length === 0) return;
    console.log(`     -> Linking funder to funding locations: ${locationNames.join(', ')}`);
    for (const locName of locationNames) {
        const locationId = await getLocationId(locName.trim());
        if (locationId) {
            await supabase.from('funder_funding_locations').insert({ funder_id: funderId, location_id: locationId });
        }
    }
}

async function getOrCreateFunder(funderInfo, primaryUrl) {
    if (!funderInfo || !funderInfo.name) {
        console.error('  -> ‼️ Funder name could not be extracted. Cannot proceed.');
        return null;
    }
    const { name, ...otherFunderDetails } = funderInfo;

    const { data: existingFunder } = await supabase.from('funders').select('id').eq('name', name).single();
    if (existingFunder) {
        console.log(`  -> ✅ Funder "${name}" already exists with ID: ${existingFunder.id}. Skipping creation.`);
        return existingFunder.id;
    }

    console.log(`  -> Creating new funder: "${name}"`);
    
    const funderTypeId = await getOrCreateFunderType(otherFunderDetails.funder_type);

    const funderToInsert = {
        name,
        slug: generateSlug(name),
        website: primaryUrl,
        last_updated: new Date().toISOString(),
        funder_type_id: funderTypeId,
        description: otherFunderDetails.description || null,
        location: otherFunderDetails.location || null,
        grant_types: otherFunderDetails.grant_types || [],
        total_funding_annually: otherFunderDetails.total_funding_annually || null,
        average_grant_size: otherFunderDetails.average_grant_size || null,
        key_personnel: otherFunderDetails.key_personnel || [],
        application_process_summary: otherFunderDetails.application_process_summary || null,
        past_grantees: otherFunderDetails.past_grantees || null,
        notable_grant: otherFunderDetails.notable_grant || null,
        logo_url: otherFunderDetails.logo_url || null
    };

    const { data: newFunder, error: insertError } = await supabase
        .from('funders')
        .insert(funderToInsert)
        .select('id')
        .single();
    
    if (insertError) {
        console.error(`  -> ‼️ Error creating funder "${name}":`, insertError);
        return null;
    }
    
    const funderId = newFunder.id;
    console.log(`  -> ✅ Created new funder: "${name}" (ID: ${funderId})`);
    
    await linkFunderToCategories(funderId, otherFunderDetails.focus_areas);
    await linkFunderToLocations(funderId, otherFunderDetails.geographic_scope);
    
    return funderId;
}

async function saveGrantsToSupabase(grants, primaryUrl, funderId) {
    if (!grants || grants.length === 0 || !funderId) {
        console.log('  -> No grants to save or funderId missing.');
        return;
    }

    for (const grant of grants) {
        try {
            const { data: insertResult, error } = await supabase.rpc('insert_grant_directly', {
                p_funder_id: funderId,
                p_title: grant.title,
                p_description: grant.description,
                p_status: 'Open',
                p_application_url: grant.application_url || primaryUrl,
                p_max_funding_amount: grant.funding_amount || null,
                p_funding_amount_text: grant.funding_amount_text || (grant.funding_amount ? `${grant.funding_amount.toLocaleString()}` : null),
                p_deadline: grant.deadline || null,
                p_eligibility_criteria: grant.eligibility_criteria || null,
                p_grant_type: grant.grant_type || null,
                p_slug: generateSlug(grant.title)
            });

            if (error) {
                console.error(`  -> ‼️ Error inserting grant "${grant.title}":`, error.message);
                continue;
            }

            const insertedGrant = Array.isArray(insertResult) ? insertResult[0] : insertResult;
            const grantId = insertedGrant?.id || 'ID not returned';
            console.log(`  -> ✅ Successfully inserted grant: "${grant.title}" (ID: ${grantId})`);

            if (grant.categories && Array.isArray(grant.categories) && insertedGrant?.id) {
                for (const categoryName of grant.categories) {
                    const categoryId = await getOrCreateCategory(categoryName);
                    if (categoryId) {
                        await supabase.from('grant_categories').insert({ grant_id: insertedGrant.id, category_id: categoryId });
                    }
                }
            }

            if (grant.locations && Array.isArray(grant.locations) && insertedGrant?.id) {
                for (const locationName of grant.locations) {
                    const locationId = await getOrCreateLocation(locationName);
                    if (locationId) {
                        await supabase.from('grant_locations').insert({ grant_id: insertedGrant.id, location_id: locationId });
                    }
                }
            }

        } catch (err) {
            console.error(`  -> ‼️ Error processing grant "${grant.title}":`, err.message);
        }
    }
}

async function main() {
  console.log('--- Starting Grant Importer ---');
  const processedUrlsMap = readProcessedUrls();
  const now = new Date();
  let domainsToProcess = [];
  try {
    const urlsFilePath = path.join(__dirname, 'urls.txt');
    const urlsContent = fs.readFileSync(urlsFilePath, 'utf-8');
    domainsToProcess = urlsContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
    console.log(`  -> Found ${domainsToProcess.length} URLs to process from urls.txt`);
  } catch (error) {
    console.error('  -> Error reading urls.txt:', error.message);
    return;
  }

  if (domainsToProcess.length === 0) {
    console.log('  -> No URLs found in urls.txt');
    return;
  }

  const urlsToProcess = domainsToProcess.filter(url => {
    const lastProcessed = processedUrlsMap.get(url);
    if (!lastProcessed) return true;
    const hoursSinceProcessed = (now - new Date(lastProcessed)) / 36e5;
    if (hoursSinceProcessed > RESCAN_INTERVAL_HOURS) {
      console.log(`  -> URL ${url} was last processed ${hoursSinceProcessed.toFixed(1)} hours ago, will reprocess`);
      return true;
    }
    return false;
  });

  if (urlsToProcess.length === 0) {
    console.log('  -> All URLs have been recently processed');
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' });

  for (const url of urlsToProcess) {
    console.log(`\n  -> Processing: ${url}`);
    try {
        let urlsToScrape = [url];
        const sitemapUrls = await getSitemapUrls(url);
        if (sitemapUrls.length > 0) {
            const grantRelatedUrls = sitemapUrls.filter(u => u.includes('grant') || u.includes('fund') || u.includes('apply'));
            if (grantRelatedUrls.length > 0) {
              urlsToScrape = [...new Set([...urlsToScrape, ...grantRelatedUrls])];
            }
        }

        const combinedTextForDomain = await crawlDomainAndGetContent(urlsToScrape, context);

        if (combinedTextForDomain.length > 100) {
            console.log('  -> Extracting grant and funder info from combined text...');
            const [grants, funder] = await Promise.all([
                extractGrantInfo(combinedTextForDomain),
                extractFunderInfo(combinedTextForDomain)
            ]);

            await sleep(1000);
            console.log(`  -> Found ${grants.length} grants and funder: ${funder ? funder.name : 'Not found'}`);
            
            const funderId = await getOrCreateFunder(funder, url);
            
            if (funderId) {
              await saveGrantsToSupabase(grants, url, funderId);
            }
            
            processedUrlsMap.set(url, now.toISOString());
        }
    } catch (err) {
        console.error(`  -> ‼️  Critical error processing ${url}:`, err.message);
    }
    await sleep(2000);
  }
  await browser.close();
  writeProcessedUrls(processedUrlsMap);
  console.log('\n--- Importer Finished ---');
}

main().catch(console.error);