// discover_grant_urls.js
// V4.0 - Clean discovery script (NO pipeline orchestration)

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

// Enhanced configuration
const CONFIG = {
    MAX_CONCURRENT_CHECKS: 3,
    RELEVANCE_THRESHOLD: 0.7,
    PREVIEW_LENGTH: 2000,
    MAX_PROCESSING_TIME: 180000, // 3 minutes max per URL
    BATCH_SIZE: 5
};

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

    return [...new Set(data.map(item => item.funder_name_guess).filter(Boolean))];
}

// Quick relevance check to avoid processing irrelevant pages
async function quickRelevanceCheck(url, context) {
    const page = await context.newPage();
    try {
        console.log(`     -> Quick relevance check for: ${url.substring(0, 60)}...`);
        
        await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 15000 
        });
        
        // Get just a preview of the content
        const preview = await page.evaluate(() => {
            // Remove scripts, styles, nav, footer for cleaner preview
            const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header');
            elementsToRemove.forEach(el => el.remove());
            
            return document.body.innerText.substring(0, 2000);
        });
        
        if (preview.length < 100) {
            console.log(`     -> Too little content (${preview.length} chars)`);
            return false;
        }
        
        // Quick AI relevance check with minimal tokens
        const prompt = `Rate this content's likelihood of containing grant opportunities (0.0-1.0):
Content: ${preview}

Return only a number between 0.0 and 1.0.`;
        
        const result = await model.generateContent(prompt);
        const relevanceScore = parseFloat(result.response.text().trim()) || 0;
        
        console.log(`     -> Relevance score: ${relevanceScore}`);
        return relevanceScore >= CONFIG.RELEVANCE_THRESHOLD;
        
    } catch (error) {
        console.log(`     -> Relevance check failed: ${error.message}`);
        return false; // If we can't check, assume not relevant
    } finally {
        await page.close();
    }
}

// Extract only grant-relevant sections from content
function extractGrantRelevantContent(content) {
    if (!content) return '';
    
    const grantKeywords = [
        'deadline', 'application', 'eligibility', 'funding amount',
        'how to apply', 'requirements', 'criteria', 'rfp', 'proposal',
        'grant program', 'funding opportunity', 'award amount',
        'application process', 'selection criteria', 'due date'
    ];
    
    // Split content into paragraphs
    const paragraphs = content.split(/\n\s*\n/);
    
    // Filter paragraphs that contain grant-related keywords
    const relevantParagraphs = paragraphs.filter(paragraph => {
        const lowerParagraph = paragraph.toLowerCase();
        return grantKeywords.some(keyword => lowerParagraph.includes(keyword));
    });
    
    // If we found relevant paragraphs, use them; otherwise use first part of content
    if (relevantParagraphs.length > 0) {
        return relevantParagraphs.join('\n\n').substring(0, 10000);
    }
    
    // Fallback to first 10000 characters if no specific sections found
    return content.substring(0, 10000);
}

// Batch processing for better performance
class BatchProcessor {
    constructor(batchSize = CONFIG.BATCH_SIZE) {
        this.batchSize = batchSize;
    }
    
    async process(items, processingFunction) {
        const results = [];
        
        for (let i = 0; i < items.length; i += this.batchSize) {
            const batch = items.slice(i, i + this.batchSize);
            console.log(`  -> Processing batch ${Math.floor(i/this.batchSize) + 1}/${Math.ceil(items.length/this.batchSize)}`);
            
            const batchResults = await Promise.allSettled(
                batch.map(item => processingFunction(item))
            );
            
            // Extract successful results
            const successfulResults = batchResults
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);
            
            results.push(...successfulResults);
            
            // Small delay between batches to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
    }
}

// =================================================================
// STEP 1: USE AI TO GENERATE A LIST OF SMART SEARCH QUERIES
// =================================================================
async function generateSearchQueries() {
    console.log("-> Step 1: Asking AI to generate smart search queries for NEW funders...");
    
    const existingFunders = await getExistingFunders();
    if (existingFunders.length > 0) {
        console.log(`-> Will try to avoid ${existingFunders.length} known funders.`);
    }

    const prompt = `
    I need to find open grant applications (RFPs) for nonprofits in the San Francisco Bay Area from NEW funders.
    
    CRITICAL: Avoid generating search queries for the following funders as they are already in our database:
    EXISTING FUNDERS TO AVOID:
    ${existingFunders.slice(0, 50).map(f => `- ${f}`).join('\n') || "- None yet"}

    Generate a JSON array of 8-10 creative and effective Google search query strings for OTHER funders.
    Focus on specific grant program pages that would have active applications.
    
    Use varied search strategies:
    1. Foundation name + "grants" + "2025" + "application"
    2. Geographic terms + "foundation" + "funding opportunity"
    3. Sector-specific terms + "Bay Area" + "RFP"
    4. Corporate foundation names + "grant guidelines"
    
    Return ONLY a JSON array of strings in this format:
    [
        "Salesforce Foundation community grants 2025 application",
        "East Bay Community Foundation funding opportunity RFP",
        "Silicon Valley Community Foundation grant guidelines 2025"
    ]
    `;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text().trim().replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const queries = JSON.parse(responseText);
        console.log(`-> Generated ${queries.length} search queries for new funders`);
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
                num: 15, // Increased to get more results
                gl: "us",
                hl: "en"
            });
            
            if (results.organic_results) {
                results.organic_results.forEach(res => {
                    if (res.link && 
                        !res.link.includes('.gov') && 
                        !res.link.includes('wikipedia.org') &&
                        !res.link.includes('linkedin.com') &&
                        !res.link.includes('facebook.com')) {
                        allUrls.add(res.link);
                    }
                });
            }
        } catch (error) {
            console.error(`   -> Error searching for "${query}":`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`-> Found ${allUrls.size} unique URLs from search`);
    return Array.from(allUrls);
}

// =================================================================
// STEP 3: ENHANCED URL VERIFICATION WITH PRE-FILTERING
// =================================================================
async function verifyUrlIsActiveRFP(url, context) {
    const page = await context.newPage();
    try {
        // Skip obviously generic URLs
        const path = new URL(url).pathname;
        if (path === '/' || path.toLowerCase() === '/grants/' || path.toLowerCase() === '/apply/') {
            return { isValid: false, reason: "Generic URL" };
        }

        await page.goto(url, { 
            waitUntil: 'networkidle', 
            timeout: 25000 
        });
        
        // Get content and extract only relevant sections
        const fullContent = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
        const content = extractGrantRelevantContent(fullContent).toLowerCase();

        // Negative keyword filtering
        const negativeKeywords = [
            'closed', 'past grantees', 'was due', 'not currently accepting', 
            'cycle is closed', 'application period has ended', 'no longer accepting',
            'deadline has passed', 'submissions closed'
        ];
        
        if (negativeKeywords.some(word => content.includes(word))) {
            return { isValid: false, reason: "Contains negative keyword" };
        }
        
        let score = 0;
        let reasons = [];

        // Strong signals (high value)
        const strongSignals = [
            'request for proposal', 'application guidelines', 'application portal', 
            'funding opportunity number', 'submit proposal', 'application deadline',
            'apply online', 'application form', 'grant application'
        ];
        if (strongSignals.some(phrase => content.includes(phrase))) {
            score += 3;
            reasons.push("Strong application signal");
        }

        // Medium signals
        const mediumSignals = [
            'eligibility requirements', 'how to apply', 'funding cycle', 
            'grant deadline', 'application process', 'selection criteria'
        ];
        if (mediumSignals.some(phrase => content.includes(phrase))) {
            score += 2;
            reasons.push("Medium application signal");
        }
        
        // Future deadline detection (high value)
        const deadlineRegex = /(deadline|due|closes on|submit by)[\s:]*(\w+\s+\d{1,2},?\s+202[5-6]|\d{1,2}[\/-]\d{1,2}[\/-]202[5-6])/i;
        if (deadlineRegex.test(content)) {
            score += 4;
            reasons.push("Future deadline found");
        }
        
        // Current year mentions
        if (content.includes('2025') || content.includes('2026')) {
            score += 1;
            reasons.push("Current/future year mentioned");
        }

        // Active language indicators
        const activeIndicators = [
            'now accepting', 'currently accepting', 'applications open', 
            'apply now', 'submit your', 'invitation to apply'
        ];
        if (activeIndicators.some(phrase => content.includes(phrase))) {
            score += 2;
            reasons.push("Active application language");
        }

        const isValid = score >= 4; // Raised threshold for better quality
        return { 
            isValid, 
            score,
            reason: `Score: ${score} (${reasons.join(', ')})` 
        };

    } catch (error) {
        return { isValid: false, reason: `Page load error: ${error.message}` };
    } finally {
        await page.close();
    }
}

async function findValidGrantPages(urls) {
    console.log(`\n-> Step 3: Enhanced validation of ${urls.length} URLs...`);
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({ 
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    // Step 3a: Quick relevance filtering
    console.log(`   -> Step 3a: Quick relevance filtering...`);
    const processor = new BatchProcessor(CONFIG.MAX_CONCURRENT_CHECKS);
    
    const relevantUrls = await processor.process(urls, async (url) => {
        const isRelevant = await quickRelevanceCheck(url, context);
        return isRelevant ? url : null;
    });
    
    console.log(`   -> ${relevantUrls.length}/${urls.length} URLs passed relevance check`);
    
    if (relevantUrls.length === 0) {
        await browser.close();
        return [];
    }
    
    // Step 3b: Detailed validation of relevant URLs
    console.log(`   -> Step 3b: Detailed validation of relevant URLs...`);
    const validRfpUrls = [];
    
    for (const url of relevantUrls) {
        process.stdout.write(`   -> Validating ${url.substring(0, 60)}... `);
        const verification = await verifyUrlIsActiveRFP(url, context);
        
        if (verification.isValid) {
            process.stdout.write(`✅ Valid! (${verification.reason})\n`);
            validRfpUrls.push({
                url: url,
                score: verification.score,
                reason: verification.reason
            });
        } else {
            process.stdout.write(`❌ Invalid. (${verification.reason})\n`);
        }
    }

    await browser.close();
    
    // Sort by score (highest first) and return URLs
    const sortedUrls = validRfpUrls
        .sort((a, b) => b.score - a.score)
        .map(item => item.url);
    
    console.log(`-> Found ${sortedUrls.length} high-quality RFP pages`);
    return sortedUrls;
}

// =================================================================
// STEP 4: ENHANCED EXTRACTION WITH TOKEN OPTIMIZATION
// =================================================================
async function extractDetailsFromPages(urls) {
    console.log(`\n-> Step 4: Enhanced extraction from ${urls.length} validated pages...`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const allGrants = [];

    for (const url of urls) {
        console.log(`   -> Extracting from: ${url}`);
        try {
            const page = await context.newPage();
            await page.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            
            // Get full page text
            const pageText = await page.evaluate(() => {
                // Remove noise elements
                const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header, .cookie-notice');
                elementsToRemove.forEach(el => el.remove());
                return document.body.innerText;
            });
            
            await page.close();

            // Extract only grant-relevant content to reduce token usage
            const relevantContent = extractGrantRelevantContent(pageText);
            
            if (relevantContent.length < 200) {
                console.log(`     -> Insufficient relevant content (${relevantContent.length} chars)`);
                continue;
            }

            // Enhanced extraction prompt with better structure
            const prompt = `
            Analyze this grant opportunity webpage and extract grant information.
            
            **WEBPAGE URL:** ${url}
            **CONTENT:**
            ${relevantContent}
            
            Extract grant details into a JSON object with these fields:
            {
                "funder_name": "The foundation/organization name (required)",
                "grant_name": "Specific grant program name (required)",
                "grant_url": "${url}",
                "funding_amount": "Dollar amount or range (e.g., '$25,000' or '$10,000-$50,000')",
                "deadline": "Application deadline in YYYY-MM-DD format",
                "eligibility_summary": "Brief eligibility requirements",
                "status": "Open, Upcoming, or Closed",
                "application_url": "Direct application link if different from main URL"
            }
            
            REQUIREMENTS:
            - Only extract if this is clearly an active grant opportunity
            - funder_name and grant_name are mandatory
            - Use null for missing information
            - Return null if no valid grant found
            
            Return ONLY a JSON object or null.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text().trim()
                .replace(/^```json\s*/, '')
                .replace(/```$/, '')
                .trim();
            
            if (responseText.toLowerCase() === 'null') {
                console.log(`     -> No valid grant found`);
                continue;
            }
            
            const grantDetails = JSON.parse(responseText);
            
            // Validate required fields
            if (grantDetails && grantDetails.funder_name && grantDetails.grant_name) {
                allGrants.push(grantDetails);
                console.log(`     -> ✅ Found: "${grantDetails.grant_name}" from "${grantDetails.funder_name}"`);
            } else {
                console.log(`     -> ❌ Missing required fields`);
            }
            
        } catch(error) {
            console.error(`   -> ❗ Failed to extract from ${url}:`, error.message);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await browser.close();
    console.log(`   -> Successfully extracted ${allGrants.length} grants`);
    return allGrants;
}

// =================================================================
// MAIN WORKFLOW
// =================================================================
async function main() {
    console.log("=== AI Grant Discovery Script (v4.0 - Discovery Only) ===");
    console.log(`Configuration: Relevance threshold: ${CONFIG.RELEVANCE_THRESHOLD}, Batch size: ${CONFIG.BATCH_SIZE}`);
    
    const startTime = Date.now();
    
    try {
        // Step 1: Generate search queries
        const queries = await generateSearchQueries();
        if (queries.length === 0) {
            console.log("❗ No search queries generated. Exiting.");
            return;
        }

        // Step 2: Execute web search
        const urls = await executeWebSearch(queries);
        if (urls.length === 0) {
            console.log("❗ No URLs found from search. Exiting.");
            return;
        }

        // Step 3: Enhanced validation with pre-filtering
        const validRfpUrls = await findValidGrantPages(urls);
        if (validRfpUrls.length === 0) {
            console.log("\n❗ No valid RFP pages found after enhanced filtering.");
            return;
        }

        // Step 4: Extract details from validated pages
        const discoveredGrants = await extractDetailsFromPages(validRfpUrls);
        if (discoveredGrants.length === 0) {
            console.log("\n❗ Could not extract grant details from validated pages.");
            return;
        }
        
        // Step 5: Final quality control
        console.log(`\n-> Step 5: Final quality control on ${discoveredGrants.length} grants...`);
        const completeGrants = discoveredGrants.filter(grant => {
            const hasRequiredFields = grant && 
                grant.grant_url && 
                grant.grant_name && 
                grant.grant_name !== 'undefined' &&
                grant.funder_name &&
                grant.funder_name !== 'undefined';
            
            if (!hasRequiredFields) {
                console.log(`   -> Filtering incomplete: ${grant?.grant_name || 'unnamed'}`);
            }
            return hasRequiredFields;
        });
        
        console.log(`-> ${completeGrants.length} grants passed final quality control`);

        if (completeGrants.length === 0) {
            console.log("\n❗ No grants remained after quality control.");
            return;
        }
        
        // Step 6: Save to database
        console.log("\n-> Step 6: Saving to database...");
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
                extraction_method: 'enhanced_v4.0'
            })
        }));

        const { data, error } = await supabase
            .from('grant_opportunities')
            .upsert(opportunitiesToInsert, { onConflict: 'url' })
            .select();
            
        if (error) {
            console.error("❗ Error saving to database:", error);
        } else {
            const processingTime = Math.round((Date.now() - startTime) / 1000);
            console.log(`✅ Successfully saved ${data.length} grants to database`);
            console.log(`🕒 Total processing time: ${processingTime} seconds`);
            
            // Summary statistics
            console.log(`\n📊 Discovery Summary:`);
            console.log(`   • Search queries: ${queries.length}`);
            console.log(`   • URLs found: ${urls.length}`);
            console.log(`   • URLs validated: ${validRfpUrls.length}`);
            console.log(`   • Grants extracted: ${discoveredGrants.length}`);
            console.log(`   • Grants saved: ${data.length}`);
            console.log(`   • Success rate: ${Math.round((data.length / urls.length) * 100)}%`);
        }

    } catch (error) {
        console.error("❗ Critical error in main workflow:", error);
    }
    
    console.log("\n=== Grant Discovery Complete ===");
}

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
    main().catch(console.error);
}