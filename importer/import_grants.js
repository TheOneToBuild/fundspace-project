// import_grants.js
// V2.4 - Major upgrade: Per-grant funder creation, PDF context, and location saving.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chromium } = require('playwright');
const axios = require('axios');
const pdf = require('pdf-parse');

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

function parseFundingAmount(text) {
    if (!text) return null;
    const cleaned = String(text).replace(/[$,]/g, '');
    const numberMatch = cleaned.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[0], 10) : null;
}

// --- DATA FETCHING & CRAWLING ---
async function getDiscoveredOpportunities() {
    const { data: opportunities, error } = await supabase
        .from('grant_opportunities')
        .select('*')
        .in('status', ['ai_discovered', 'new', 'validated', 'error']) // Also re-process errors
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❗ Error fetching discovered opportunities:', error);
        return [];
    }
    return opportunities || [];
}

async function crawlAndGetRelevantText(primaryUrl, context) {
    let combinedText = '';
    const visited = new Set([primaryUrl]);
    let sourceMap = new Map(); // To track text source

    const page = await context.newPage();
    try {
        console.log(`  -> Scraping primary page: ${primaryUrl}`);
        await page.goto(primaryUrl, { waitUntil: 'networkidle', timeout: 60000 });
        const primaryText = await page.evaluate(() => document.body.innerText.replace(/\s\s+/g, ' ').trim());
        if (primaryText) {
            combinedText += `--- Content from Primary Page: ${primaryUrl} ---\n\n${primaryText}`;
            sourceMap.set(primaryUrl, primaryText);
        }

        const grantKeywords = ['apply', 'application', 'guidelines', 'eligibility', 'criteria', 'process', 'faq', 'requirements', 'deadline', 'funding', 'grant', 'rfp'];
        const links = await page.$$eval('a', (anchors) => anchors.map(a => ({ href: a.href, text: a.innerText.trim().toLowerCase() })));
        
        const primaryDomain = new URL(primaryUrl).hostname;
        const relevantLinks = links.filter(link => {
            try {
                return link.href && link.href.startsWith('http') && new URL(link.href).hostname.includes(primaryDomain) && !visited.has(link.href);
            } catch (e) { return false; }
        }).filter(link => grantKeywords.some(kw => link.text.includes(kw) || link.href.includes(kw)));
        
        const htmlLinks = relevantLinks.filter(link => !link.href.endsWith('.pdf'));
        const pdfLinks = relevantLinks.filter(link => link.href.endsWith('.pdf'));

        if (htmlLinks.length > 0) console.log(`  -> Found ${htmlLinks.length} relevant HTML sub-pages.`);
        for (const link of htmlLinks.slice(0, 4)) {
            if(visited.has(link.href)) continue;
            visited.add(link.href);
            console.log(`     -> Scraping HTML: ${link.href}`);
            const subPage = await context.newPage();
            try {
                await subPage.goto(link.href, { waitUntil: 'networkidle', timeout: 45000 });
                const subPageText = await subPage.evaluate(() => document.body.innerText.replace(/\s\s+/g, ' ').trim());
                if (subPageText) {
                     combinedText += `\n\n--- Content from HTML Page: ${link.href} ---\n\n${subPageText}`;
                     sourceMap.set(link.href, subPageText);
                }
            } catch (error) { console.error(`       -> ❗ Error scraping ${link.href}:`, error.message.split('\n')[0]); } 
            finally { await subPage.close(); }
            await sleep(500);
        }
        
        if (pdfLinks.length > 0) console.log(`  -> Found ${pdfLinks.length} relevant PDF documents.`);
        for (const link of pdfLinks.slice(0, 2)) {
            if(visited.has(link.href)) continue;
            visited.add(link.href);
            console.log(`     -> Parsing PDF: ${link.href}`);
            try {
                const response = await axios.get(link.href, { responseType: 'arraybuffer' });
                const data = await pdf(response.data);
                if (data.text) {
                    combinedText += `\n\n--- Content from PDF: ${link.href} ---\n\n${data.text}`;
                    sourceMap.set(link.href, data.text);
                }
            } catch (error) { console.error(`       -> ❗ Error processing PDF ${link.href}:`, error.message.split('\n')[0]); }
            await sleep(500);
        }
    } catch (error) { console.error(`  -> ❗ Error during crawl for ${primaryUrl}:`, error.message.split('\n')[0]); } 
    finally { if (!page.isClosed()) await page.close(); }
    
    return combinedText;
}

// --- AI EXTRACTION ---
async function extractGrantInfo(text, sourceUrl) {
    if (!text || text.length < 100) return [];
    
    const isPdfContent = text.includes("--- Content from PDF:");
    const pdfContext = isPdfContent ? "You are analyzing text from one or more PDF documents. The text formatting may be inconsistent. Pay close attention to headings, tables, and lists to find the grant details." : "";
    
    const prompt = `
    You are an expert at analyzing foundation websites and PDFs to extract active grant opportunities.
    Analyze the provided text. Your goal is to return a list of all distinct grant programs mentioned.
    ${pdfContext}

    For each grant you identify, provide a JSON object with the following fields:
    - funder_name: The name of the specific foundation funding this grant (required, string).
    - title: The specific grant program name (required, string).
    - description: A clear, concise description of the grant's purpose (required, string).
    - status: Must be one of: "Open", "Upcoming", or "Closed". Default to "Open" if a future deadline is present.
    - deadline: The application deadline, in YYYY-MM-DD format.
    - eligibility_criteria: A summary of who can apply.
    - funding_amount_text: The original text describing the funding amount (e.g., "$10,000 - $50,000").
    - application_url: The direct URL to the application portal or guidelines page if available in the text.
    - categories: Array of focus areas (e.g., ["Education", "Health", "Arts & Culture"]).
    - locations: Array of geographic areas served (e.g., ["Alameda County", "San Francisco"]).

    CRITICAL RULES:
    1. Return a JSON array of grant objects. If no grants are found, return an empty array [].
    2. Be thorough. A single page might list multiple grants from different funders. Extract all of them.
    3. The 'funder_name' and 'title' for each grant object are mandatory.
    4. Only include grants with a future deadline or those explicitly stated as "Open" or "Accepting Applications".
    
    Return ONLY a valid JSON array. No markdown or explanations.

    Content to analyze:
    ${text.substring(0, 150000)}`;

    try {
        console.log('  -> Extracting grant information from combined text...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim().replace(/^```json\s*|```$/g, '');
        
        const jsonStart = jsonText.indexOf('[');
        const jsonEnd = jsonText.lastIndexOf(']') + 1;
        if (jsonStart === -1) {
            console.log("   -> AI did not return a valid JSON array.");
            return [];
        }
        jsonText = jsonText.substring(jsonStart, jsonEnd);
        
        const grants = JSON.parse(jsonText);
        
        const validGrants = grants.filter(grant => {
            if (!grant || !grant.title || !grant.description || !grant.funder_name) return false;
            if (grant.status === 'Closed') return false;
            if (grant.deadline) {
                const deadlineMatch = String(grant.deadline).match(/(\d{4}-\d{2}-\d{2})/);
                if (deadlineMatch && new Date(deadlineMatch[0]) < new Date()) {
                    console.log(`   -> Filtering out expired grant: ${grant.title}`);
                    return false;
                }
            }
            return true;
        });
        
        console.log(`   -> Found ${validGrants.length} valid, active grants.`);
        return validGrants;
        
    } catch (error) {
        console.error('  -> ❗ Failed to extract info:', error.message);
        return [];
    }
}

// --- DATABASE HELPERS ---
async function getOrCreateFunder(funderName, websiteUrl) {
    if (!funderName) return null;
    try {
        const { data: funder, error } = await supabase
            .from('funders')
            .upsert({ name: funderName, website: websiteUrl }, { onConflict: 'name' }) 
            .select('id, name')
            .single();
        if (error) throw error;
        return funder;
    } catch (error) {
        console.error(`  -> ❗ Error ensuring funder "${funderName}" exists:`, error.message);
        return null;
    }
}

async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    const { data } = await supabase.from('categories').upsert({ name: categoryName }, { onConflict: 'name' }).select('id').single();
    return data?.id;
}

async function getOrCreateLocation(locationName) {
    if (!locationName) return null;
    const { data } = await supabase.from('locations').upsert({ name: locationName }, { onConflict: 'name' }).select('id').single();
    return data?.id;
}

async function saveGrantsToSupabase(grants, primaryUrl) {
    if (!grants || grants.length === 0) return 0;
    let savedCount = 0;

    for (const grant of grants) {
        try {
            const funder = await getOrCreateFunder(grant.funder_name, new URL(primaryUrl).origin);
            if (!funder) {
                console.log(`   -> Skipping grant "${grant.title}" because funder could not be created.`);
                continue;
            }

            const deadlineMatch = grant.deadline ? String(grant.deadline).match(/(\d{4}-\d{2}-\d{2})/) : null;
            const deadlineToInsert = deadlineMatch ? deadlineMatch[0] : null;
            const fundingAmount = parseFundingAmount(grant.funding_amount_text);

            const { data: insertResult, error } = await supabase
                .from('grants')
                .upsert({
                    funder_id: funder.id,
                    title: grant.title,
                    description: grant.description,
                    status: grant.status || 'Open',
                    application_url: grant.application_url || primaryUrl,
                    max_funding_amount: fundingAmount,
                    funding_amount_text: grant.funding_amount_text,
                    deadline: deadlineToInsert,
                    eligibility_criteria: grant.eligibility_criteria,
                    grant_type: grant.grant_type,
                    slug: generateSlug(grant.title)
                }, { onConflict: 'funder_id, title' })
                .select('id')
                .single();

            if (error) throw new Error(error.message);
            
            console.log(`  -> ✅ Saved grant: "${grant.title}" from "${funder.name}" (ID: ${insertResult.id})`);
            savedCount++;

            const grantId = insertResult.id;
            if (grant.categories) for (const name of grant.categories) {
                const categoryId = await getOrCreateCategory(name);
                if (categoryId) await supabase.from('grant_categories').upsert({ grant_id: grantId, category_id: categoryId });
            }
            if (grant.locations) for (const name of grant.locations) { // FIX #1: Added location saving
                const locationId = await getOrCreateLocation(name);
                if (locationId) await supabase.from('grant_locations').upsert({ grant_id: grantId, location_id: locationId });
            }

        } catch (err) {
            console.error(`  -> ❗ Critical error saving grant "${grant.title}":`, err.message);
        }
    }
    return savedCount;
}

async function markOpportunityAsProcessed(opportunityId, success = true, grantsFound = 0) {
    await supabase.from('grant_opportunities').update({
        status: success ? 'processed' : 'error',
        last_processed_at: new Date().toISOString(),
        error_message: success ? `Processed successfully - found ${grantsFound} grants` : 'Processing failed - see logs'
    }).eq('id', opportunityId);
}

// --- MAIN EXECUTION LOGIC ---
async function main() {
    console.log('--- Starting Grant Importer (v2.4 - Aggregator Support) ---');
    const opportunities = await getDiscoveredOpportunities();
    if (opportunities.length === 0) {
        console.log('  -> No new opportunities to process.');
        return;
    }
    console.log(`  -> Found ${opportunities.length} opportunities to process.`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (compatible; GrantBot/1.0; +https://1rfp.org)' });
    
    for (const opportunity of opportunities) {
        console.log(`\n--- Processing Opportunity ID: ${opportunity.id} | ${opportunity.url} ---`);
        try {
            const combinedText = await crawlAndGetRelevantText(opportunity.url, context);
            if (!combinedText) {
                await markOpportunityAsProcessed(opportunity.id, false);
                continue;
            }

            const grants = await extractGrantInfo(combinedText, opportunity.url);
            if (!grants || grants.length === 0) {
                console.log('  -> No active grants found after extraction.');
                await markOpportunityAsProcessed(opportunity.id, true, 0);
                continue;
            }

            const savedCount = await saveGrantsToSupabase(grants, opportunity.url);
            await markOpportunityAsProcessed(opportunity.id, true, savedCount);

        } catch (error) {
            console.error(`  -> ❗ Unhandled error processing opportunity ID ${opportunity.id}:`, error.message);
            await markOpportunityAsProcessed(opportunity.id, false);
        }
        await sleep(2000);
    }

    await browser.close();
    console.log('\n--- Grant Importer Finished ---');
}

main().catch(console.error);