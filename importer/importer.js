// importer/importer.js - UPDATED VERSION
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

// Add missing utility functions that were referenced but not included
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
            await sleep(1000); // Be respectful to servers
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
        
        // Wait for main content to load
        await page.waitForTimeout(2000);
        
        // Extract text content
        const text = await page.evaluate(() => {
            // Remove script and style elements
            const scripts = document.querySelectorAll('script, style');
            scripts.forEach(el => el.remove());
            
            // Get text content
            return document.body.innerText;
        });
        
        await page.close();
        return text;
    } catch (error) {
        console.error(`  -> Error getting text from ${url}:`, error.message);
        return null;
    }
}

// UPDATED: Extract grant info with categories and locations
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
        let jsonText = response.text().trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        }
        return JSON.parse(jsonText) || [];
    } catch (error) {
        console.error('  -> ❗ Failed to extract grant info:', error.message);
        return [];
    }
}

// PRESERVED: Your original extractFunderInfo function
async function extractFunderInfo(text) {
    if (!text || text.length < 100) return null;
    const prompt = `Analyze the following content and extract information about the funding organization. Provide details in valid JSON format:
    - name: Organization name (required)
    - description: Brief description of the organization (required)
    - logo_url: URL to the organization's logo (if found)
    - location: Physical location or headquarters
    - focus_areas: Array of focus areas or priorities
    - grant_types: Array of types of grants offered
    - total_funding_annually: Total funding awarded annually as a string (e.g., "$2.5M", "Over $10 million").
    - average_grant_size: The average or typical grant size as a string (e.g., "$50,000", "$25k - $75k").
    - key_personnel: An array of objects for key people, each with a "name" and "title" (e.g., [{"name": "Jane Doe", "title": "CEO"}]).
    - application_process_summary: Brief summary of how to apply
    - past_grantees: Information about past recipients (if mentioned)
    - notable_grant: Example of a notable grant (if mentioned)
    IMPORTANT:
    - Return ONLY a JSON object. No markdown, no explanations.
    - Must have at least name and description.
    - If a field is not found, its value should be null.
    - Ensure the JSON is valid and properly escaped.
    Content to analyze:
    ${text.substring(0, 80000)}`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        }
        return JSON.parse(jsonText) || null;
    } catch (error) {
        console.error('  -> ❗ Failed to extract funder info:', error.message);
        const responseText = error.response ? error.response.text() : 'No response text available.';
        console.error('  -> ❗ AI Response that caused error:', responseText);
        return null;
    }
}

// UPDATED: Get or create categories and locations
async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .single();
    
    if (existing) return existing.id;
    
    const { data: newCategory } = await supabase
        .from('categories')
        .insert({ name: categoryName })
        .select('id')
        .single();
    
    return newCategory?.id;
}

async function getOrCreateLocation(locationName) {
    if (!locationName) return null;
    
    const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', locationName)
        .single();
    
    if (existing) return existing.id;
    
    const { data: newLocation } = await supabase
        .from('locations')
        .insert({ name: locationName })
        .select('id')
        .single();
    
    return newLocation?.id;
}

// PRESERVED: Your original getOrCreateFunder function
async function getOrCreateFunder(funderInfo, primaryUrl) {
    if (!funderInfo || !funderInfo.name) {
        console.error('  -> ‼️ Funder name could not be extracted. Cannot proceed.');
        return null;
    }
    const { name, ...otherFunderDetails } = funderInfo;

    // 1. Check if funder already exists by name
    const { data: existingFunder, error: selectError } = await supabase
        .from('funders')
        .select('id')
        .eq('name', name)
        .single();

    if (selectError && selectError.code !== 'PGRST116') { // 'PGRST116' means no row was found, which is fine.
        console.error(`  -> Error checking for funder "${name}":`, selectError);
        return null;
    }

    if (existingFunder) {
        console.log(`  -> ✅ Funder "${name}" already exists.`);
        return existingFunder.id;
    }

    // 2. If not found, create it with all the details from your prompt
    console.log(`  -> Creating new funder: "${name}"`);
    
    // Only include fields that exist in the funders table
    const funderToInsert = {
        name,
        slug: generateSlug(name),
        website: primaryUrl,
        description: otherFunderDetails.description || null,
        location: otherFunderDetails.location || null,
        focus_areas: otherFunderDetails.focus_areas || [],
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
    console.log(`  -> ✅ Created new funder: "${name}" (ID: ${newFunder.id})`);
    return newFunder.id;
}

// UPDATED: Save grants with proper field mapping and relations
async function saveGrantsToSupabase(grants, primaryUrl, funderId) {
    if (!grants || grants.length === 0 || !funderId) {
        console.log('  -> No grants to save or funderId missing.');
        return;
    }

    for (const grant of grants) {
        try {
            // Use raw SQL to bypass schema cache completely
            const { data: insertResult, error } = await supabase.rpc('insert_grant_directly', {
                p_funder_id: funderId,
                p_title: grant.title,
                p_description: grant.description,
                p_status: 'Open',
                p_application_url: grant.application_url || primaryUrl,
                p_max_funding_amount: grant.funding_amount || null,
                p_funding_amount_text: grant.funding_amount_text || 
                    (grant.funding_amount ? `${grant.funding_amount.toLocaleString()}` : null),
                p_deadline: grant.deadline || null,
                p_eligibility_criteria: grant.eligibility_criteria || null,
                p_grant_type: grant.grant_type || null,
                p_slug: generateSlug(grant.title)
            });
                
            if (error) {
                console.error(`  -> ‼️ Error inserting grant "${grant.title}":`, error.message);
                console.error('Full error details:', error);
                continue;
            }
            
            // Handle the result - it might be an array or single object
            const insertedGrant = Array.isArray(insertResult) ? insertResult[0] : insertResult;
            const grantId = insertedGrant?.id || 'ID not returned';
            console.log(`  -> ✅ Successfully inserted grant: "${grant.title}" (ID: ${grantId})`);
            
            // Debug: Log what categories and locations were extracted
            console.log(`     Categories found: ${grant.categories ? grant.categories.join(', ') : 'None'}`);
            console.log(`     Locations found: ${grant.locations ? grant.locations.join(', ') : 'None'}`);
            
            // Add categories
            if (grant.categories && Array.isArray(grant.categories) && insertedGrant?.id) {
                for (const categoryName of grant.categories) {
                    console.log(`     -> Creating/finding category: "${categoryName}"`);
                    const categoryId = await getOrCreateCategory(categoryName);
                    if (categoryId) {
                        const { error: catError } = await supabase
                            .from('grant_categories')
                            .insert({
                                grant_id: insertedGrant.id,
                                category_id: categoryId
                            });
                        if (catError) {
                            console.error(`     -> Error linking category: ${catError.message}`);
                        } else {
                            console.log(`     -> Linked category "${categoryName}" to grant`);
                        }
                    }
                }
            }
            
            // Add locations
            if (grant.locations && Array.isArray(grant.locations) && insertedGrant?.id) {
                for (const locationName of grant.locations) {
                    console.log(`     -> Creating/finding location: "${locationName}"`);
                    const locationId = await getOrCreateLocation(locationName);
                    if (locationId) {
                        const { error: locError } = await supabase
                            .from('grant_locations')
                            .insert({
                                grant_id: insertedGrant.id,
                                location_id: locationId
                            });
                        if (locError) {
                            console.error(`     -> Error linking location: ${locError.message}`);
                        } else {
                            console.log(`     -> Linked location "${locationName}" to grant`);
                        }
                    }
                }
            }
            
        } catch (err) {
            console.error(`  -> ‼️ Error processing grant "${grant.title}":`, err.message);
        }
    }
}

// UPDATED: Main function with funder name passing
async function main() {
  console.log('--- Starting Grant Importer ---');
  const processedUrlsMap = readProcessedUrls();
  const now = new Date();
  
  // Read URLs from urls.txt file
  let domainsToProcess = [];
  try {
    const urlsFilePath = path.join(__dirname, 'urls.txt');
    const urlsContent = fs.readFileSync(urlsFilePath, 'utf-8');
    // Parse URLs from file, filtering out comments and empty lines
    domainsToProcess = urlsContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//') && !line.startsWith('#'));
    
    console.log(`  -> Found ${domainsToProcess.length} URLs to process`);
  } catch (error) {
    console.error('  -> Error reading urls.txt:', error.message);
    console.log('  -> Please create a urls.txt file with URLs to process');
    return;
  }

  if (domainsToProcess.length === 0) {
    console.log('  -> No URLs found in urls.txt');
    return;
  }
  
  // Check which URLs need processing
  const urlsToProcess = domainsToProcess.filter(url => {
    const lastProcessed = processedUrlsMap.get(url);
    if (!lastProcessed) return true;
    
    const lastProcessedDate = new Date(lastProcessed);
    const hoursSinceProcessed = (now - lastProcessedDate) / (1000 * 60 * 60);
    
    if (hoursSinceProcessed > RESCAN_INTERVAL_HOURS) {
      console.log(`  -> URL ${url} was last processed ${hoursSinceProcessed.toFixed(1)} hours ago, will reprocess`);
      return true;
    }
    
    console.log(`  -> Skipping ${url} - processed ${hoursSinceProcessed.toFixed(1)} hours ago`);
    return false;
  });

  if (urlsToProcess.length === 0) {
    console.log('  -> All URLs have been recently processed');
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ 
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
  });

  for (const url of urlsToProcess) {
    console.log(`\n  -> Processing: ${url}`);
    
    try {
        // For each URL, we might want to discover related pages
        let urlsToScrape = [url];
        
        // Try to find additional pages from sitemap if it's a domain root
        if (url.endsWith('/') || !url.includes('/', 8)) {
          const sitemapUrls = await getSitemapUrls(url);
          if (sitemapUrls.length > 0) {
            console.log(`  -> Found ${sitemapUrls.length} URLs in sitemap`);
            // Filter for grant-related pages
            const grantRelatedUrls = sitemapUrls.filter(u => 
              u.includes('grant') || 
              u.includes('fund') || 
              u.includes('apply') ||
              u.includes('opportunity') ||
              u.includes('program')
            );
            if (grantRelatedUrls.length > 0) {
              urlsToScrape = [...new Set([...urlsToScrape, ...grantRelatedUrls])];
              console.log(`  -> Will scrape ${urlsToScrape.length} grant-related pages`);
            }
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

            console.log(`  -> Found ${grants.length} grants`);
            console.log(`  -> Funder info: ${funder ? funder.name : 'Not found'}`);

            const funderId = await getOrCreateFunder(funder, url);

            if (funderId) {
              await saveGrantsToSupabase(grants, url, funderId);
            } else {
              console.log('  -> Could not create/find funder, skipping grant save');
            }
            
            processedUrlsMap.set(url, now.toISOString());
        } else {
            console.log(`  -> No significant content found for ${url}`);
        }
    } catch (err) {
        console.error(`  -> ‼️  Critical error processing ${url}:`, err.message);
    }
    
    console.log(`  -> Pausing before next URL...`);
    await sleep(2000);
  }

  await browser.close();
  writeProcessedUrls(processedUrlsMap);
  console.log('\n--- Importer Finished ---');
}

main().catch(console.error);