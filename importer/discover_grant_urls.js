// discover_grant_urls.js
// V3.5 - Added logic to avoid searching for existing funders

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chromium } = require('playwright');
const { getJson } = require("serpapi");

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

// =================================================================
// HELPER FUNCTIONS
// =================================================================
async function getExistingFunders() {
    const { data, error } = await supabase
        .from('grant_opportunities')
        .select('funder_name_guess');

    if (error) {
        console.error("Could not fetch existing funder names:", error);
        return [];
    }

    // Return a unique list of non-null funder names
    return [...new Set(data.map(item => item.funder_name_guess).filter(Boolean))];
}


// =================================================================
// STEP 1: USE AI TO GENERATE A LIST OF SMART SEARCH QUERIES
// =================================================================
async function generateSearchQueries() {
    console.log("-> Step 1: Asking AI to generate smart search queries for NEW funders...");
    
    // Get funders we already have in the database
    const existingFunders = await getExistingFunders();
    if (existingFunders.length > 0) {
        console.log(`-> Will try to avoid ${existingFunders.length} known funders.`);
    }

    const prompt = `
    I need to find open grant applications (RFPs) for nonprofits in the San Francisco Bay Area from NEW funders.
    
    CRITICAL: Avoid generating search queries for the following funders as they are already in our database. Focus on discovering grants from foundations NOT on this list.
    EXISTING FUNDERS TO AVOID:
    ${existingFunders.map(f => `- ${f}`).join('\n') || "- None yet"}

    Generate a JSON array of 5-7 creative and effective Google search query strings for OTHER funders.
    Focus on queries that would uncover specific grant program pages.
    Use terms like "RFP", "application guidelines", "funding opportunity", and the year 2025.

    Return ONLY a JSON array of strings in this format:
    [
        "Marin Community Foundation grants RFP 2025",
        "Sobrato Family Foundation application guidelines",
        "East Bay Asian Local Development Corporation funding opportunity",
        "Latino Community Foundation (LCF) application deadline 2025"
    ]
    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text().trim().replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const queries = JSON.parse(responseText);
        console.log(`-> Generated ${queries.length} queries for new funders:`, queries);
        return queries;
    } catch (error) {
        console.error("❗ Error generating search queries:", error);
        return [];
    }
}

// =================================================================
// STEP 2: EXECUTE WEB SEARCH TO GET LIVE URLS
// =================================================================
async function executeWebSearch(queries) {
    console.log("\n-> Step 2: Executing web search for live URLs...");
    const allUrls = new Set();

    for (const query of queries) {
        console.log(`   -> Searching for: "${query}"`);
        try {
            const results = await getJson({
                api_key: SERPAPI_API_KEY,
                q: query,
                location: "San Francisco, California, United States",
                num: 10
            });
            if (results.organic_results) {
                results.organic_results.forEach(res => {
                    if (res.link && !res.link.includes('.gov')) {
                        allUrls.add(res.link);
                    }
                });
            }
        } catch (error) {
            console.error(`   -> Error searching for "${query}":`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log(`-> Found ${allUrls.size} unique URLs.`);
    return Array.from(allUrls);
}

// =================================================================
// STEP 3: VERIFY URLS WITH A POINTS-BASED SYSTEM
// =================================================================
async function verifyUrlIsActiveRFP(url, context) {
    const page = await context.newPage();
    try {
        const path = new URL(url).pathname;
        if (path === '/' || path.toLowerCase() === '/grants/' || path.toLowerCase() === '/apply/') {
            return { isValid: false, reason: "Generic URL" };
        }

        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
        const content = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').toLowerCase());

        const negativeKeywords = ['closed', 'past grantees', 'was due', 'not currently accepting', 'cycle is closed'];
        if (negativeKeywords.some(word => content.includes(word))) {
            return { isValid: false, reason: "Contains negative keyword" };
        }
        
        let score = 0;
        let reasons = [];

        const strongSignalWords = ['request for proposal', 'application guidelines', 'application portal', 'funding opportunity number'];
        if (strongSignalWords.some(phrase => content.includes(phrase))) {
            score += 2;
            reasons.push("Strong signal");
        }

        const mediumSignalWords = ['eligibility requirements', 'how to apply', 'funding cycle', 'grant deadline'];
        if (mediumSignalWords.some(phrase => content.includes(phrase))) {
            score += 1;
            reasons.push("Medium signal");
        }
        
        const deadlineRegex = /(deadline|due|closes on)[\s:]*(\w+\s+\d{1,2},?\s+202[4-9]|\d{1,2}[\/-]\d{1,2}[\/-]202[4-9])/i;
        if (deadlineRegex.test(content)) {
            score += 3;
            reasons.push("Specific deadline found");
        }
        
        if (content.includes('2025') || content.includes('2026')) {
            score += 1;
            reasons.push("Mentions current/next year");
        }

        const isValid = score >= 3;
        return { isValid, reason: `Score: ${score} (${reasons.join(', ')})` };

    } catch (error) {
        return { isValid: false, reason: "Page load error" };
    } finally {
        await page.close();
    }
}

async function findValidGrantPages(urls) {
    console.log(`\n-> Step 3: Verifying ${urls.length} URLs to find active RFPs...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' });
    
    const validRfpUrls = [];
    for (const url of urls) {
        process.stdout.write(`   -> Checking ${url.substring(0, 60)}... `);
        const verification = await verifyUrlIsActiveRFP(url, context);
        if (verification.isValid) {
            process.stdout.write(`✅ Valid! (${verification.reason})\n`);
            validRfpUrls.push(url);
        } else {
            process.stdout.write(`❌ Invalid. (${verification.reason})\n`);
        }
    }

    await browser.close();
    console.log(`-> Found ${validRfpUrls.length} promising RFP pages.`);
    return validRfpUrls;
}


// =================================================================
// STEP 4: EXTRACT DETAILS FROM VALIDATED PAGES USING AI
// =================================================================
async function extractDetailsFromPages(urls) {
    console.log(`\n-> Step 4: Extracting details from ${urls.length} valid pages...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const allGrants = [];

    for (const url of urls) {
        console.log(`   -> Extracting from: ${url}`);
        try {
            const page = await context.newPage();
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const pageText = await page.evaluate(() => document.body.innerText);
            await page.close();

            const prompt = `
            Based on the following text from the webpage at ${url}, extract the grant information into a JSON object.
            Be precise. If a detail is not present, use null.

            **TEXT:**
            ---
            ${pageText.substring(0, 15000)} 
            ---
            **END OF TEXT**

            Extract the following fields into a single JSON object:
            {
                "funder_name": "The foundation or company name",
                "grant_name": "The specific name of the grant program",
                "grant_url": "${url}",
                "funding_amount": "A specific number or range, e.g., '$25,000' or '$10,000 - $50,000'",
                "deadline": "The specific application deadline, e.g., '2025-09-15'",
                "eligibility_summary": "A brief summary of key eligibility requirements."
            }
            Return ONLY the JSON object.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text().trim().replace(/^```json\s*/, '').replace(/```$/, '').trim();
            const grantDetails = JSON.parse(responseText);
            allGrants.push(grantDetails);
            console.log(`     -> Success: Found "${grantDetails.grant_name}"`);
        } catch(error) {
            console.error(`   -> Failed to extract from ${url}:`, error.message);
        }
    }
    
    await browser.close();
    return allGrants;
}


// =================================================================
// MAIN WORKFLOW
// =================================================================
async function main() {
    console.log("=== AI Grant Discovery Script (v3.5 - New Funder Focus) ===");
    
    const queries = await generateSearchQueries();
    if (queries.length === 0) return;

    const urls = await executeWebSearch(queries);
    if (urls.length === 0) return;

    const validRfpUrls = await findValidGrantPages(urls);
    if (validRfpUrls.length === 0) {
        console.log("\n❗ No active and valid RFP pages found from search results.");
        return;
    }

    const discoveredGrants = await extractDetailsFromPages(validRfpUrls);
    if (discoveredGrants.length === 0) {
        console.log("\n❗ Could not extract structured details from the valid pages.");
        return;
    }
    
    // --- FINAL QUALITY CONTROL STEP ---
    console.log(`\n-> Found ${discoveredGrants.length} grants. Performing final quality check...`);
    const completeGrants = discoveredGrants.filter(grant => {
        const hasUrl = grant && grant.grant_url;
        const hasName = grant && grant.grant_name && grant.grant_name !== 'undefined';
        if (!hasUrl || !hasName) {
            console.log(`   -> Filtering out incomplete record: ${JSON.stringify(grant)}`);
        }
        return hasUrl && hasName;
    });
    console.log(`-> ${completeGrants.length} grants passed quality check.`);


    if (completeGrants.length === 0) {
        console.log("\n❗ No grants remained after the final quality control filter.");
        return;
    }
    
    console.log("\n-> Step 5: Saving to Database...");
    const opportunitiesToInsert = completeGrants.map(grant => ({
        funder_name_guess: grant.funder_name,
        grant_name_guess: grant.grant_name,
        url: grant.grant_url,
        status: 'ai_discovered',
        error_message: JSON.stringify({
            discovered_date: new Date().toISOString().split('T')[0],
            funding_amount: grant.funding_amount,
            deadline: grant.deadline,
            eligibility_summary: grant.eligibility_summary,
        })
    }));

    const { data, error } = await supabase.from('grant_opportunities').upsert(opportunitiesToInsert, { onConflict: 'url' }).select();
    if (error) {
        console.error("❗ Error saving grants to database:", error);
    } else {
        console.log(`✅ Successfully saved ${data.length} high-quality grant opportunities to database.`);
    }

    console.log("\n=== Grant Discovery Complete ===");
}

main().catch(console.error);