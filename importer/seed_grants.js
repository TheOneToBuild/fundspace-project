// importer/seed_grants.js
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Configuration options
const CONFIG = {
    BATCH_SIZE: 10,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    RATE_LIMIT_DELAY: 1000,
    MIN_DESCRIPTION_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 2000,
};

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Create custom https agent to ignore certificate validation errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

// --- UTILITY FUNCTIONS ---
function generateSlug(name) {
    if (!name) return null;
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/--+/g, '-')
        .substring(0, 100);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function validateUrl(url) {
    if (!url || !url.startsWith('http')) return false;
    try {
        const response = await axios.head(url, { 
            timeout: 10000, 
            httpsAgent,
            validateStatus: status => status < 400,
            maxRedirects: 5
        });
        return response.status >= 200 && response.status < 400;
    } catch (error) {
        console.log(`     -> URL validation failed for ${url}: ${error.message}`);
        return false;
    }
}

// --- DATABASE HELPERS ---
async function getOrCreateCategory(categoryName) {
    if (!categoryName || typeof categoryName !== 'string') return null;
    
    const normalizedName = categoryName.trim();
    if (!normalizedName) return null;
    
    try {
        const { data: existing } = await supabase
            .from('categories')
            .select('id')
            .eq('name', normalizedName)
            .single();
            
        if (existing) return existing.id;
        
        console.log(`     -> Creating new category: "${normalizedName}"`);
        const { data: newCategory, error } = await supabase
            .from('categories')
            .insert({ name: normalizedName })
            .select('id')
            .single();
            
        if (error) {
            console.error(`     -> Error creating category:`, error.message);
            return null;
        }
        
        return newCategory?.id;
    } catch (error) {
        console.error(`     -> Error in getOrCreateCategory:`, error.message);
        return null;
    }
}

async function getOrCreateLocation(locationName) {
    if (!locationName) return null;
    
    // Normalize location name - add "County" if it's missing for Bay Area counties
    let normalizedName = locationName.trim();
    const bayAreaCountyNames = [
        'Alameda', 'Contra Costa', 'Marin', 'Napa', 
        'San Francisco', 'San Mateo', 'Santa Clara', 
        'Solano', 'Sonoma'
    ];
    
    // Check if it's a county name without "County" suffix
    if (bayAreaCountyNames.includes(normalizedName)) {
        normalizedName = `${normalizedName} County`;
    }
    
    const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', normalizedName)
        .single();
        
    if (existing) return existing.id;
    
    const { data: newLocation } = await supabase
        .from('locations')
        .insert({ name: normalizedName })
        .select('id')
        .single();
        
    return newLocation?.id;
}

async function getFunderByName(funderName) {
    if (!funderName) return null;
    
    const { data: funder } = await supabase
        .from('funders')
        .select('id, name')
        .eq('name', funderName)
        .single();
        
    return funder;
}

async function linkGrantToCategories(grantId, categories) {
    if (!grantId || !categories || !Array.isArray(categories) || categories.length === 0) return;
    
    console.log(`     -> Linking grant to categories: ${categories.join(', ')}`);
    
    for (const categoryName of categories) {
        const categoryId = await getOrCreateCategory(categoryName.trim());
        if (categoryId) {
            await supabase
                .from('grant_categories')
                .insert({ 
                    grant_id: grantId, 
                    category_id: categoryId 
                });
        }
    }
}

async function linkGrantToLocations(grantId, locations) {
    if (!grantId || !locations || !Array.isArray(locations) || locations.length === 0) return;
    
    if (locations.includes('All Bay Area Counties')) {
        locations = [
            'Alameda County', 'Contra Costa County', 'Marin County', 'Napa County', 
            'San Francisco County', 'San Mateo County', 'Santa Clara County', 
            'Solano County', 'Sonoma County'
        ];
    }
    
    console.log(`     -> Linking grant to locations: ${locations.join(', ')}`);
    
    for (const locationName of locations) {
        const locationId = await getOrCreateLocation(locationName.trim());
        if (locationId) {
            await supabase
                .from('grant_locations')
                .insert({ 
                    grant_id: grantId, 
                    location_id: locationId 
                });
        }
    }
}

function validateGrantData(data) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!data.title || data.title.trim().length === 0) {
        errors.push('Missing required field: title');
    }
    
    if (!data.description || data.description.trim().length < CONFIG.MIN_DESCRIPTION_LENGTH) {
        errors.push(`Description too short (min ${CONFIG.MIN_DESCRIPTION_LENGTH} chars)`);
    }
    
    if (data.description && data.description.length > CONFIG.MAX_DESCRIPTION_LENGTH) {
        data.description = data.description.substring(0, CONFIG.MAX_DESCRIPTION_LENGTH) + '...';
        warnings.push('Description truncated');
    }
    
    // Validate deadline - must be in the future
    if (data.deadline) {
        const deadlineDate = new Date(data.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isNaN(deadlineDate.getTime())) {
            errors.push('Invalid deadline format');
            data.deadline = null;
        } else if (deadlineDate < today) {
            errors.push('Deadline is in the past');
            data.deadline = null;
        }
    }
    
    // Validate funding amount
    if (data.funding_amount !== null && data.funding_amount !== undefined) {
        const amount = parseInt(data.funding_amount);
        if (isNaN(amount) || amount < 0) {
            warnings.push('Invalid funding amount');
            data.funding_amount = null;
        } else {
            data.funding_amount = amount;
        }
    }
    
    // Validate URL
    if (data.application_url && !data.application_url.startsWith('http')) {
        warnings.push('Invalid application URL format');
        data.application_url = null;
    }
    
    return { isValid: errors.length === 0, errors, warnings, data };
}

async function generateAIContent(prompt, retries = CONFIG.MAX_RETRIES) {
    let lastError = null;
    let lastResponse = null;
    
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            lastResponse = result.response.text();
            let jsonText = lastResponse.trim();
            
            // Clean up common JSON formatting issues
            jsonText = jsonText
                .replace(/^```json\s*|```$/gm, '')
                .replace(/^```\s*|```$/gm, '')
                .replace(/```/g, '')
                .trim();
            
            // Remove any text before the first [ or {
            const firstBracket = jsonText.search(/[\[\{]/);
            if (firstBracket > 0) {
                jsonText = jsonText.substring(firstBracket);
            }
            
            // Remove any text after the last ] or }
            const lastCloseBracket = Math.max(jsonText.lastIndexOf(']'), jsonText.lastIndexOf('}'));
            if (lastCloseBracket > -1 && lastCloseBracket < jsonText.length - 1) {
                jsonText = jsonText.substring(0, lastCloseBracket + 1);
            }
            
            const parsed = JSON.parse(jsonText);
            return parsed;
        } catch (error) {
            lastError = error;
            if (i === retries - 1) {
                console.error('     -> Failed to parse JSON after all retries');
                console.error('     -> Error:', error.message);
                if (lastResponse) {
                    console.error('     -> Raw response (first 1000 chars):', lastResponse.substring(0, 1000));
                }
                throw error;
            }
            console.log(`     -> Retry ${i + 1}/${retries} after error: ${error.message}`);
            await sleep(CONFIG.RETRY_DELAY * Math.pow(2, i));
        }
    }
}

async function seedGrants(options = {}) {
    const { 
        batchSize = CONFIG.BATCH_SIZE,
        categories = null,
        dryRun = false,
        monthsAhead = 6,
        skipEnrichment = false,
        testPrompt = false
    } = options;
    
    // Test prompt mode for debugging
    if (testPrompt) {
        console.log('--- Testing AI Prompt ---');
        const testPrompt = `
            Create a JSON array with 2 sample grants for Bay Area nonprofits.
            Each grant should have these exact fields:
            - title (string)
            - funder_name (string) 
            - description (string, at least 50 characters)
            - eligibility_criteria (string)
            - funding_amount (number)
            - funding_amount_text (string)
            - deadline (string, format: "2025-MM-DD")
            - application_url (string starting with https://)
            - grant_type (string)
            - categories (array of strings)
            - locations (array of strings like "San Francisco County")
            
            Return ONLY the JSON array, no other text.
        `;
        
        try {
            const result = await generateAIContent(testPrompt);
            console.log("Test result:", JSON.stringify(result, null, 2));
        } catch (error) {
            console.error("Test failed:", error.message);
        }
        return;
    }
    
    console.log('--- Starting Grant Discovery Script ---');
    console.log(`  -> Configuration: Batch size: ${batchSize}, Dry run: ${dryRun}, Looking ${monthsAhead} months ahead`);
    
    if (categories) {
        console.log(`  -> Focusing on categories: ${categories.join(', ')}`);
    }

    // Get current date for deadline calculations
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + monthsAhead);

    console.log('  -> Checking database for existing grants...');
    const { data: existingGrants, error: fetchError } = await supabase
        .from('grants')
        .select('title, funder_id, deadline')
        .gte('deadline', today.toISOString().split('T')[0]);
        
    if (fetchError) {
        console.error("  -> ‼️ Error fetching existing grants:", fetchError);
        return;
    }
    
    const existingTitles = new Set(existingGrants?.map(g => g.title.toLowerCase()) || []);
    console.log(`  -> Found ${existingTitles.size} active grants in the database.`);

    // Also get list of funders for reference
    const { data: funders } = await supabase
        .from('funders')
        .select('id, name, funder_type_id');
    
    const funderNames = funders?.map(f => f.name) || [];
    console.log(`  -> Found ${funderNames.length} funders in the database.`);

    let grantsToSeed = [];
    try {
        console.log(`  -> Asking AI to discover ${batchSize} new grants in the SF Bay Area...`);
        
        const categoryClause = categories 
            ? `Focus specifically on grants in these areas: ${categories.join(', ')}.`
            : 'Include a diverse mix across different sectors.';
        
        const currentDate = today.toISOString().split('T')[0];
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        const discoveryPrompt = `
            Find ${batchSize} SPECIFIC open RFPs (Request for Proposals) or grant opportunities that nonprofits can apply for RIGHT NOW in the San Francisco Bay Area.
            
            Current date: ${currentDate}
            
            CRITICAL: These must be ACTUAL OPEN OPPORTUNITIES with:
            - A specific grant program name (not just "General Operating Support")
            - An open application window or upcoming deadline
            - A specific RFP or grant cycle that is currently accepting applications
            - Real application pages where nonprofits can apply
            
            Examples of what we want:
            - "2025 Youth Innovation Grant - Round 1" (not just "Youth Grants")
            - "FY2025 Community Health RFP" (not just "Health Funding")
            - "Spring 2025 Arts Project Grant Cycle" (not just "Arts Grants")
            
            Requirements:
            1. Grants should have deadlines between ${currentDate} and ${futureDateStr}
            2. Available to organizations in Bay Area counties: San Francisco, Alameda, Contra Costa, Marin, San Mateo, Santa Clara, Solano, Napa, Sonoma
            3. ${categoryClause}
            4. Include grants from various sources - foundations, corporations, government
            5. Mix of grant sizes and types
            
            Known Bay Area funders to consider:
            ${funderNames.slice(0, 15).join(', ')}
            
            CRITICAL: For application_url field:
            - Must be a REAL, WORKING URL to the specific grant/RFP page
            - Should link directly to the grant opportunity, not just the funder's homepage
            - Examples of good URLs:
              * https://www.sff.org/grants/community-response-grants/
              * https://www.siliconvalleycf.org/scholarships-grants/nonprofit-grants
              * https://www.grants.ca.gov/grants/safe-neighborhoods-and-schools-fund/
              * https://sf.gov/apply-community-challenge-grant
            - NEVER use placeholder URLs or generic foundation homepages
            
            Return a JSON array where each grant has these fields:
            [
                {
                    "title": "Specific Grant/RFP Name with Year/Cycle",
                    "funder_name": "Organization Name (use exact name from the funders list above if applicable)",
                    "description": "Detailed description of what THIS SPECIFIC grant opportunity funds, application requirements, and any special focus for this cycle (at least 100 characters)",
                    "eligibility_criteria": "Specific eligibility for THIS grant (e.g., '501(c)(3) nonprofits serving youth in Oakland with annual budgets under $2M')",
                    "funding_amount": 50000,
                    "funding_amount_text": "$25,000 - $50,000 per project",
                    "deadline": "2025-04-15",
                    "application_url": "https://actualwebsite.org/specific-grant-page-2025",
                    "grant_type": "Specific type (e.g., 'Capacity Building', 'Program Support', 'Capital Project')",
                    "categories": ["Education", "Youth Development"],
                    "locations": ["San Francisco County", "Alameda County"]
                }
            ]
            
            Create realistic OPEN grant opportunities that nonprofits can actually apply for. Return ONLY the JSON array.
        `;
        
        console.log("  -> Sending prompt to AI...");
        await sleep(CONFIG.RATE_LIMIT_DELAY);
        
        let aiResponse;
        try {
            aiResponse = await generateAIContent(discoveryPrompt);
            console.log("  -> AI response type:", typeof aiResponse);
            console.log("  -> Is array?", Array.isArray(aiResponse));
            
            if (aiResponse && typeof aiResponse === 'object' && !Array.isArray(aiResponse)) {
                // Sometimes AI returns an object with a grants array inside
                if (aiResponse.grants && Array.isArray(aiResponse.grants)) {
                    console.log("  -> Found grants array inside response object");
                    grantsToSeed = aiResponse.grants;
                } else {
                    console.log("  -> Response is object but no grants array found:", Object.keys(aiResponse));
                    grantsToSeed = [];
                }
            } else if (Array.isArray(aiResponse)) {
                grantsToSeed = aiResponse;
            } else {
                console.log("  -> Unexpected response type");
                grantsToSeed = [];
            }
        } catch (error) {
            console.error("  -> Error getting AI response:", error.message);
            grantsToSeed = [];
        }
        
        // Ensure we have an array
        if (!Array.isArray(grantsToSeed)) {
            console.error("  -> AI did not return an array. Attempting to parse...");
            grantsToSeed = [];
        }
        
        console.log(`  -> AI returned ${grantsToSeed.length} grants before filtering`);
        
        // Debug: Show what we got from AI
        if (grantsToSeed.length > 0) {
            console.log("  -> First grant from AI:", JSON.stringify(grantsToSeed[0], null, 2));
        }
        
        // Filter out any grants that already exist
        const validGrants = [];
        for (const grant of grantsToSeed) {
            if (!grant || typeof grant !== 'object') {
                console.log("  -> Skipping non-object entry");
                continue;
            }
            if (!grant.title) {
                console.log("  -> Skipping grant with missing title:", JSON.stringify(grant).substring(0, 100));
                continue;
            }
            if (existingTitles.has(grant.title.toLowerCase())) {
                console.log(`  -> Skipping existing grant: "${grant.title}"`);
                continue;
            }
            validGrants.push(grant);
        }
        
        grantsToSeed = validGrants;
        console.log(`  -> After filtering: ${grantsToSeed.length} new grants to process`);
        
        // Debug: Show first valid grant structure
        if (grantsToSeed.length > 0) {
            console.log("  -> Sample valid grant structure:", JSON.stringify(grantsToSeed[0], null, 2));
        }
    } catch (error) {
        console.error("  -> ‼️ Error discovering grants:", error);
        return;
    }
    
    if (!grantsToSeed || grantsToSeed.length === 0) {
        console.log("  -> No new grants to process.");
        return;
    }

    let enrichedGrants = grantsToSeed; // Default to original data

    if (!skipEnrichment) {
        // Now enrich the grant data with more details
        const enrichmentPrompt = `
            I have these SPECIFIC grant opportunities/RFPs that need enhancement.
            Here is the current data as a JSON array:
            ${JSON.stringify(grantsToSeed, null, 2)}
            
            For each grant, enhance the existing data by:
            1. Making the description more detailed about THIS SPECIFIC grant cycle/opportunity
            2. Adding specific eligibility requirements (budget size, geography, focus area)
            3. Including application tips or special requirements for this RFP
            4. Ensuring descriptions explain what makes this grant unique (at least 100 characters)
            5. Verifying deadlines are realistic and in YYYY-MM-DD format
            6. Making grant_type more specific (e.g., "Two-Year Capacity Building", "Emergency Response Fund")
            
            CRITICAL URL RULES:
            - Keep all working application_urls exactly as they are
            - For any generic or broken URLs, try to find the actual grant page:
              * Add year/cycle to URL path (e.g., /grants/2025-spring-cycle)
              * Use specific program pages (e.g., /youth-innovation-grants)
              * Common patterns:
                - Government: .gov/funding/fy2025/[program-name]
                - Foundations: .org/grants/[specific-program]
                - Corporate: .com/community/grants/[current-cycle]
            - NEVER use just the homepage or generic /grants page
            
            CRITICAL RULES:
            - Return the SAME JSON structure with the SAME field names
            - Keep ALL original fields and values, only enhance them
            - Return ONLY a JSON array, no other text
            - Ensure all grants sound like actual open RFPs, not general funder information
            - Each object must have all original fields: title, funder_name, description, eligibility_criteria, funding_amount, funding_amount_text, deadline, application_url, grant_type, categories, locations
            
            Return the enhanced JSON array now.
        `;

        try {
            console.log("\n  -> Enriching grant data...");
            await sleep(CONFIG.RATE_LIMIT_DELAY);
            enrichedGrants = await generateAIContent(enrichmentPrompt);
            
            // Validate enriched data
            if (!Array.isArray(enrichedGrants)) {
                console.error("  -> Enrichment failed - not an array. Using original data.");
                enrichedGrants = grantsToSeed;
            } else {
                console.log(`  -> Successfully enriched ${enrichedGrants.length} grants`);
            }
        } catch (error) {
            console.error("  -> ‼️ Enrichment failed:", error.message);
            console.log("  -> Using original grant data without enrichment");
            enrichedGrants = grantsToSeed;
        }
    } else {
        console.log("  -> Skipping enrichment phase as requested");
    }

    const results = { inserted: 0, skipped: 0, errors: 0 };

    for (const grantData of enrichedGrants) {
        if (!grantData || typeof grantData !== 'object') {
            console.log(`  -> Skipping invalid grant data`);
            results.errors++;
            continue;
        }
        
        console.log(`\n  -> Processing grant: "${grantData.title || 'Unknown'}"...`);
        
        const { isValid, errors, warnings, data: validatedData } = validateGrantData(grantData);
        
        if (!isValid) {
            console.log(`     -> Validation errors: ${errors.join(', ')}`);
            results.errors++;
            continue;
        }
        
        if (warnings.length > 0) {
            console.log(`     -> Warnings: ${warnings.join(', ')}`);
        }

        // Find or skip if funder doesn't exist
        const funder = await getFunderByName(validatedData.funder_name);
        if (!funder) {
            console.log(`     -> Skipping: Funder "${validatedData.funder_name}" not found in database`);
            results.skipped++;
            continue;
        }

        // Get full funder details including website
        const { data: funderDetails } = await supabase
            .from('funders')
            .select('website')
            .eq('id', funder.id)
            .single();

        // Validate application URL if provided
        if (validatedData.application_url) {
            const isValidUrl = await validateUrl(validatedData.application_url);
            if (!isValidUrl) {
                console.log(`     -> Invalid application URL: ${validatedData.application_url}`);
                
                // Try to use funder's website as fallback
                if (funderDetails?.website) {
                    // Append common grant paths
                    const grantPaths = ['/grants', '/grantmaking', '/funding', '/apply', '/rfp', '/opportunities'];
                    let fallbackUrl = funderDetails.website;
                    
                    // Remove trailing slash
                    if (fallbackUrl.endsWith('/')) {
                        fallbackUrl = fallbackUrl.slice(0, -1);
                    }
                    
                    // Try each common path
                    let foundWorkingUrl = false;
                    for (const path of grantPaths) {
                        const testUrl = fallbackUrl + path;
                        console.log(`     -> Trying fallback URL: ${testUrl}`);
                        if (await validateUrl(testUrl)) {
                            validatedData.application_url = testUrl;
                            console.log(`     -> Using working fallback URL: ${testUrl}`);
                            foundWorkingUrl = true;
                            break;
                        }
                    }
                    
                    // If no specific grant page works, use main website
                    if (!foundWorkingUrl && await validateUrl(funderDetails.website)) {
                        validatedData.application_url = funderDetails.website;
                        console.log(`     -> Using funder's main website: ${funderDetails.website}`);
                    } else if (!foundWorkingUrl) {
                        console.log(`     -> ERROR: No valid URL found for this grant. Skipping.`);
                        results.skipped++;
                        continue;
                    }
                } else {
                    console.log(`     -> ERROR: No application URL and no funder website available. Skipping.`);
                    results.skipped++;
                    continue;
                }
            }
        } else {
            // No application URL provided
            if (funderDetails?.website) {
                validatedData.application_url = funderDetails.website;
                console.log(`     -> No application URL provided, using funder website: ${funderDetails.website}`);
            } else {
                console.log(`     -> ERROR: No application URL and no funder website. Skipping.`);
                results.skipped++;
                continue;
            }
        }

        if (dryRun) {
            console.log(`     -> [DRY RUN] Would insert grant with funder_id: ${funder.id}`);
            console.log(JSON.stringify(validatedData, null, 2));
            results.inserted++;
            continue;
        }

        try {
            // Use the RPC function to insert grant
            const { data: insertResult, error } = await supabase.rpc('insert_grant_directly', {
                p_funder_id: funder.id,
                p_title: validatedData.title,
                p_description: validatedData.description,
                p_status: 'Open',
                p_application_url: validatedData.application_url,
                p_max_funding_amount: validatedData.funding_amount || null,
                p_funding_amount_text: validatedData.funding_amount_text || 
                    (validatedData.funding_amount ? `$${validatedData.funding_amount.toLocaleString()}` : null),
                p_deadline: validatedData.deadline,
                p_eligibility_criteria: validatedData.eligibility_criteria,
                p_grant_type: validatedData.grant_type,
                p_slug: generateSlug(validatedData.title)
            });

            if (error) {
                console.error(`     -> ‼️ Error inserting grant:`, error.message);
                results.errors++;
                continue;
            }

            const insertedGrant = Array.isArray(insertResult) ? insertResult[0] : insertResult;
            const grantId = insertedGrant?.id;
            
            if (!grantId) {
                console.error(`     -> ‼️ Grant inserted but no ID returned`);
                results.errors++;
                continue;
            }

            console.log(`     -> ✅ Successfully inserted grant (ID: ${grantId})`);
            results.inserted++;

            // Link to categories
            if (validatedData.categories && Array.isArray(validatedData.categories)) {
                await linkGrantToCategories(grantId, validatedData.categories);
            }

            // Link to locations
            if (validatedData.locations && Array.isArray(validatedData.locations)) {
                await linkGrantToLocations(grantId, validatedData.locations);
            }

        } catch (err) {
            console.error(`     -> ‼️ Error processing grant:`, err.message);
            results.errors++;
        }
    }
    
    console.log(`\n--- Grant seeding complete ---`);
    console.log(`  -> Inserted: ${results.inserted}`);
    console.log(`  -> Skipped: ${results.skipped}`);
    console.log(`  -> Errors: ${results.errors}`);
}

// Verification function to check quality of inserted grants
async function verifyInsertedGrants() {
    console.log('\n--- Running Post-Insert Verification ---');
    
    const { data: recentGrants, error } = await supabase
        .from('grants')
        .select(`
            id,
            title,
            description,
            deadline,
            max_funding_amount,
            application_url,
            funder:funders(name)
        `)
        .order('id', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error('Error fetching recent grants:', error);
        return;
    }
    
    console.log(`  -> Found ${recentGrants?.length || 0} recent grants`);
    
    for (const grant of recentGrants || []) {
        let score = 0;
        let maxScore = 5;
        
        if (grant.title && grant.title.length > 5) score++;
        if (grant.description && grant.description.length > 50) score++;
        if (grant.deadline && new Date(grant.deadline) > new Date()) score++;
        if (grant.max_funding_amount && grant.max_funding_amount > 0) score++;
        if (grant.funder?.name) score++;
        
        const quality = score / maxScore;
        const status = quality >= 0.8 ? '✅ HIGH' : quality >= 0.6 ? '⚠️ MEDIUM' : '❌ LOW';
        
        console.log(`  -> ${grant.title}: ${status} quality (${score}/${maxScore})`);
        console.log(`     Funder: ${grant.funder?.name || 'Unknown'}`);
        console.log(`     Deadline: ${grant.deadline || 'Not set'}`);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = { 
        batchSize: 10, 
        categories: null, 
        dryRun: false,
        monthsAhead: 6,
        skipEnrichment: false,
        testPrompt: false
    };
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--batch-size': case '-b':
                options.batchSize = parseInt(args[++i]) || 10;
                break;
            case '--categories': case '-c':
                options.categories = args[++i].split(',').map(c => c.trim());
                break;
            case '--dry-run': case '-d':
                options.dryRun = true;
                break;
            case '--months': case '-m':
                options.monthsAhead = parseInt(args[++i]) || 6;
                break;
            case '--skip-enrichment': case '-s':
                options.skipEnrichment = true;
                break;
            case '--test-prompt': case '-t':
                options.testPrompt = true;
                break;
            case '--verify': case '-v':
                verifyInsertedGrants();
                process.exit(0);
                break;
            case '--help': case '-h':
                console.log(`
Usage: node seed_grants.js [options]

Options:
  -b, --batch-size <number>    Number of grants to seed (default: 10)
  -c, --categories <list>      Comma-separated list of categories to focus on
  -d, --dry-run                Simulate the process without inserting data
  -m, --months <number>        How many months ahead to look for deadlines (default: 6)
  -s, --skip-enrichment        Skip the enrichment phase and use raw discovered data
  -t, --test-prompt            Test AI prompt with simple request
  -v, --verify                 Verify recently inserted grants
  -h, --help                   Show this help message

Examples:
  node seed_grants.js -b 20
  node seed_grants.js -c "Education,Youth Development" -m 3
  node seed_grants.js --dry-run --batch-size 5
  node seed_grants.js --skip-enrichment -b 5
  node seed_grants.js --test-prompt
  node seed_grants.js --verify
                `);
                process.exit(0);
        }
    }
    
    seedGrants(options).then(() => {
        if (!options.dryRun) {
            verifyInsertedGrants();
        }
    });
}

module.exports = { seedGrants, verifyInsertedGrants };