// import_grants.js
// This script now automatically finds and scrapes related grant pages.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chromium } = require('playwright');

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const URLS_TO_SCAN_FILE = path.join(__dirname, 'grant_urls.txt'); 

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- UTILITY FUNCTIONS ---
const sleep = ms => new Promise(r => setTimeout(r, ms));

function generateSlug(name) {
    if (!name) return null;
    return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/--+/g, '-');
}

/**
 * NEW: A smart crawler that gets text from a primary URL and any relevant sub-pages.
 * @param {string} primaryUrl The starting URL for the grant opportunity.
 * @param {object} context The Playwright browser context.
 * @returns {Promise<string>} The combined text from all scraped pages.
 */
async function crawlAndGetRelevantText(primaryUrl, context) {
    const page = await context.newPage();
    let combinedText = '';
    const visited = new Set([primaryUrl]);
    const MAX_SUB_PAGES = 5; // Limit to prevent crawling the whole site

    try {
        // 1. Scrape the primary page
        console.log(`  -> Scraping primary page: ${primaryUrl}`);
        await page.goto(primaryUrl, { waitUntil: 'networkidle', timeout: 60000 });
        
        const primaryText = await page.evaluate(() => {
            document.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
            return document.body.innerText.replace(/\s\s+/g, ' ').trim();
        });
        
        if (primaryText) {
            combinedText += `--- Content from Primary Page: ${primaryUrl} ---\n\n${primaryText}`;
        }

        // 2. Find and filter relevant links on the primary page
        const keywords = ['apply', 'learn more', 'guidelines', 'eligibility', 'process', 'faq', 'criteria'];
        const links = await page.$$eval('a', (anchors, kws) =>
            anchors
                .filter(a => kws.some(kw => a.innerText.toLowerCase().includes(kw)))
                .map(a => a.href),
            keywords
        );
        
        const primaryDomain = new URL(primaryUrl).hostname;
        const relevantLinks = [...new Set(links)] // Get unique links
            .filter(link => {
                try {
                    // Ensure links are on the same domain and are not mailto or tel links
                    const linkDomain = new URL(link).hostname;
                    return linkDomain.includes(primaryDomain) && (link.startsWith('http'));
                } catch (e) {
                    return false; // Invalid URL format
                }
            });

        if (relevantLinks.length > 0) {
            console.log(`  -> Found ${relevantLinks.length} potentially relevant sub-page(s).`);
        } else {
             console.log(`  -> No relevant sub-pages found. Analyzing primary page only.`);
        }

        // 3. Scrape the relevant sub-pages
        for (const link of relevantLinks.slice(0, MAX_SUB_PAGES)) {
            if (!visited.has(link)) {
                visited.add(link);
                console.log(`     -> Scraping sub-page: ${link}`);
                const subPage = await context.newPage();
                try {
                     await subPage.goto(link, { waitUntil: 'networkidle', timeout: 60000 });
                     const subPageText = await subPage.evaluate(() => {
                         document.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
                         return document.body.innerText.replace(/\s\s+/g, ' ').trim();
                     });
                     if (subPageText) {
                         combinedText += `\n\n--- Content from Sub-Page: ${link} ---\n\n${subPageText}`;
                     }
                } catch (error) {
                     console.error(`       -> ❗ Error scraping sub-page ${link}:`, error.message);
                } finally {
                     await subPage.close();
                }
            }
        }

    } catch (error) {
        console.error(`  -> ❗ Error during smart crawl for ${primaryUrl}:`, error.message);
    } finally {
        if (!page.isClosed()) {
            await page.close();
        }
    }
    return combinedText;
}


async function extractGrantInfo(text) {
    if (!text || text.length < 100) return [];
    const prompt = `
    Analyze the following content and extract information about grant opportunities.
    For each distinct grant found, provide the following details in a valid JSON array:
    - title: Grant name (required).
    - description: A clear, concise description of the grant's purpose (required).
    - status: Classify the grant's status. Must be one of: "Open", "Closed", or "Upcoming".
    - eligibility_criteria: Who can apply and key eligibility requirements (if mentioned).
    - funding_amount: Maximum funding amount as a NUMBER (no commas or symbols). If a range like "$5,000 to $10,000", use 10000.
    - funding_amount_text: The funding amount as displayed in the original text (e.g., "$5,000 - $10,000", "Up to $50,000").
    - deadline: Application deadline in YYYY-MM-DD format.
    - application_url: A direct URL to the application or grant details page.
    - grant_type: Type of grant (e.g., "General Operating Support", "Project Grant", "Capacity Building").
    - categories: Array of focus areas or categories (e.g., ["Education", "Arts & Culture", "Healthcare"]).
    - locations: Array of eligible geographic locations (e.g., ["San Francisco", "Bay Area", "California"]).

    IMPORTANT RULES:
    - CRITICAL: Focus ONLY on currently "Open" or "Upcoming" grants. IGNORE grants explicitly described as past, closed, or historical.
    - If a grant's status cannot be determined, assume it is "Closed".
    - Each grant must have at least a "title" and a "description".
    - If a field is not found, its value should be null.
    - Return ONLY a valid JSON array. Do not include markdown formatting or explanations.

    Content to analyze:
    ${text.substring(0, 120000)}`; // Increased context size for multiple pages

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

// --- DATABASE HELPERS ---
async function getFunderByDomain(domain) {
    if (!domain) return null;
    const { data: funder, error } = await supabase
        .from('funders')
        .select('id, name')
        .like('website', `%${domain}%`)
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error(`  -> Error fetching funder for domain ${domain}:`, error);
        return null;
    }
    return funder;
}

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

async function saveGrantsToSupabase(grants, funderId, grantPageUrl) {
    if (!grants || grants.length === 0 || !funderId) {
        console.log('  -> No grants to save or funderId missing.');
        return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const grant of grants) {
        if (grant.status !== 'Open' && grant.status !== 'Upcoming') {
            console.log(`  -> ⏭️ Skipping grant "${grant.title}" because its status is "${grant.status}".`);
            continue;
        }

        try {
            const deadlineToInsert = (grant.deadline && dateRegex.test(grant.deadline)) ? grant.deadline : null;
            if (grant.deadline && !deadlineToInsert) {
                console.log(`  -> ⚠️ Invalid date format "${grant.deadline}" for grant "${grant.title}". Inserting as NULL.`);
            }

            const { data: insertResult, error } = await supabase.rpc('insert_grant_directly', {
                p_funder_id: funderId,
                p_title: grant.title,
                p_description: grant.description,
                p_status: grant.status,
                p_application_url: grant.application_url || grantPageUrl,
                p_max_funding_amount: grant.funding_amount || null,
                p_funding_amount_text: grant.funding_amount_text || null,
                p_deadline: deadlineToInsert,
                p_eligibility_criteria: grant.eligibility_criteria || null,
                p_grant_type: grant.grant_type || null,
                p_slug: generateSlug(grant.title)
            });

            if (error) {
                console.error(`  -> ‼️ Error inserting grant "${grant.title}":`, error.message);
                continue;
            }

            const grantId = insertResult?.[0]?.id;
            console.log(`  -> ✅ Successfully inserted grant: "${grant.title}" (ID: ${grantId})`);

            if (grantId) {
                if (grant.categories && Array.isArray(grant.categories)) {
                    for (const categoryName of grant.categories) {
                        const categoryId = await getOrCreateCategory(categoryName);
                        if (categoryId) await supabase.from('grant_categories').insert({ grant_id: grantId, category_id: categoryId });
                    }
                }
                if (grant.locations && Array.isArray(grant.locations)) {
                    for (const locationName of grant.locations) {
                        const locationId = await getOrCreateLocation(locationName);
                        if (locationId) await supabase.from('grant_locations').insert({ grant_id: grantId, location_id: locationId });
                    }
                }
            }
        } catch (err) {
            console.error(`  -> ‼️ Critical error processing grant "${grant.title}":`, err.message);
        }
    }
}

// --- MAIN EXECUTION LOGIC ---
async function main() {
    console.log('--- Starting Targeted Grant Importer with Smart Crawling ---');

    let urlsToScan = [];
    try {
        const urlsContent = fs.readFileSync(URLS_TO_SCAN_FILE, 'utf-8');
        urlsToScan = urlsContent.split('\n').map(line => line.trim()).filter(line => line && !line.trim().startsWith('//'));
    } catch (error) {
        console.error(`  -> ❗ Error reading ${URLS_TO_SCAN_FILE}. Please ensure it exists.`);
        return;
    }

    if (urlsToScan.length === 0) {
        console.log('  -> No URLs found in grant_urls.txt. Exiting.');
        return;
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' });
    
    for (const primaryUrl of urlsToScan) {
        console.log(`\n--- Processing Primary URL: ${primaryUrl} ---`);
        let domain;
        try {
            domain = new URL(primaryUrl).hostname.replace(/^www\./, '');
        } catch (e) {
            console.warn(`  -> ⚠️ Invalid URL skipped: ${primaryUrl}`);
            continue;
        }

        const funder = await getFunderByDomain(domain);

        if (!funder) {
            console.error(`  -> ❗ Funder not found for domain "${domain}". Please ensure a profile exists. Skipping.`);
            continue;
        }

        console.log(`  -> Found funder: "${funder.name}" (ID: ${funder.id})`);
        
        // Use the new smart crawler to get all relevant text
        const combinedText = await crawlAndGetRelevantText(primaryUrl, context);

        if (combinedText && combinedText.length > 100) {
            console.log('  -> Extracting grant info from combined page content...');
            const grants = await extractGrantInfo(combinedText);
            
            console.log(`  -> Found ${grants.length} potential grants for this opportunity.`);
            await saveGrantsToSupabase(grants, funder.id, primaryUrl);
        } else {
            console.log('  -> No text content extracted.');
        }
        await sleep(1000); // Be polite to the server
    }

    await browser.close();
    console.log('\n--- Targeted Grant Importer Finished ---');
}

main().catch(console.error);
