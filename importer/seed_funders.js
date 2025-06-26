// enhanced_seed_funders.js - IMPROVED ACCURACY & HALLUCINATION PREVENTION
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const https = require('https'); // Required for the custom agent
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- ADDED: Create a custom https agent to ignore certificate validation errors ---
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// --- ENHANCED UTILITY FUNCTIONS ---
function generateSlug(name) {
    if (!name) return null;
    return name.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/--+/g, '-');
}

// UPDATED to use the custom httpsAgent
async function validateImageUrl(url) {
    if (!url || !url.startsWith('http')) return false;
    try {
        const response = await axios.head(url, { timeout: 5000, httpsAgent });
        const contentType = response.headers['content-type'];
        return response.status >= 200 && response.status < 300 && contentType && contentType.startsWith('image/');
    } catch (error) {
        return false;
    }
}

// UPDATED to use the custom httpsAgent
async function validateWebsiteUrl(url) {
    if (!url || !url.startsWith('http')) return false;
    try {
        const response = await axios.head(url, { timeout: 10000, httpsAgent });
        return response.status >= 200 && response.status < 400;
    } catch (error) {
        console.log(`     -> Website validation failed for ${url}: ${error.message}`);
        return false;
    }
}

// NEW FUNCTION: Sanitize funder data to handle null values properly
function sanitizeFunderData(funderData) {
    // Convert string "null" to actual null or appropriate defaults
    Object.keys(funderData).forEach(key => {
        if (funderData[key] === "null" || funderData[key] === null) {
            // For array fields, use empty array instead of null
            if (['focus_areas', 'grant_types', 'key_personnel', 'past_grantees', 'geographic_scope'].includes(key)) {
                funderData[key] = [];
            } else {
                funderData[key] = null;
            }
        } else if (typeof funderData[key] === 'string' && funderData[key].toLowerCase() === 'null') {
            // Handle case where "null" is a string
            funderData[key] = null;
        }
        
        // Ensure array fields are actually arrays
        if (['focus_areas', 'grant_types', 'key_personnel', 'past_grantees', 'geographic_scope'].includes(key)) {
            if (!Array.isArray(funderData[key])) {
                funderData[key] = [];
            }
        }
    });
    
    // Set default values for critical fields if they're null
    if (!funderData.description || funderData.description === null) {
        funderData.description = "This organization provides funding in the Bay Area. More information pending.";
    }
    
    if (!funderData.average_grant_size || funderData.average_grant_size === null) {
        funderData.average_grant_size = "Varies";
    }
    
    if (!funderData.total_funding_annually || funderData.total_funding_annually === null) {
        funderData.total_funding_annually = "Varies by fiscal year";
    }
    
    return funderData;
}

async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    const { data: existing } = await supabase.from('categories').select('id').eq('name', categoryName).single();
    if (existing) return existing.id;
    console.log(`     -> Creating new category: "${categoryName}"`);
    const { data: newCategory } = await supabase.from('categories').insert({ name: categoryName }).select('id').single();
    return newCategory?.id;
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

async function getOrCreateFunderType(typeName) {
    if (!typeName) return null;
    const normalizedTypeName = typeName.trim();
    const { data: existingType } = await supabase.from('funder_types').select('id').eq('name', normalizedTypeName).single();
    if (existingType) return existingType.id;
    console.log(`     -> AI discovered a new funder type: "${normalizedTypeName}". Adding to funder_types table.`);
    const { data: newType, error } = await supabase.from('funder_types').insert({ name: normalizedTypeName }).select('id').single();
    if (error) {
        console.error(`     -> Error creating new funder type:`, error);
        return null;
    }
    return newType?.id;
}

// Clean exact matching now that whitespace issues are resolved
async function getLocationId(locationName) {
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
    
    const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('name', normalizedName)
        .single();
    
    if (!existingLocation) {
        console.warn(`     -> Location "${locationName}" (normalized: "${normalizedName}") not found in the predefined locations table.`);
    }
    return existingLocation?.id;
}

async function linkFunderToLocations(funderId, locationNames) {
    if (!funderId || !locationNames || !Array.isArray(locationNames) || locationNames.length === 0) return;
    
    if (locationNames.includes('All Bay Area Counties')) {
        const allBayAreaCounties = [
            'Alameda County', 'Contra Costa County', 'Marin County', 'Napa County', 
            'San Francisco County', 'San Mateo County', 'Santa Clara County', 
            'Solano County', 'Sonoma County'
        ];
        locationNames = allBayAreaCounties;
    }
    
    console.log(`     -> Linking funder to funding locations: ${locationNames.join(', ')}`);
    for (const locName of locationNames) {
        const locationId = await getLocationId(locName.trim());
        if (locationId) {
            await supabase
                .from('funder_funding_locations')
                .insert({ funder_id: funderId, location_id: locationId });
        }
    }
}

// UPDATED to be more flexible with funding amount formats
function validateFunderData(funderData) {
    const errors = [];
    const warnings = [];
    
    if (!funderData.name || funderData.name.trim().length === 0) {
        errors.push('Missing required field: name');
    }
    
    const urlPattern = /^https?:\/\/.+\..+/;
    if (funderData.website && !urlPattern.test(funderData.website)) {
        warnings.push(`Invalid website URL format: ${funderData.website}`);
        funderData.website = null;
    }
    
    if (funderData.logo_url && !urlPattern.test(funderData.logo_url)) {
        warnings.push(`Invalid logo URL format: ${funderData.logo_url}`);
        funderData.logo_url = null;
    }
    
    const validFundingStrings = ['varies by fiscal year', 'varies', 'information not available'];
    if (funderData.total_funding_annually && 
        !funderData.total_funding_annually.includes('$') && 
        !funderData.total_funding_annually.toLowerCase().includes('million') &&
        !funderData.total_funding_annually.toLowerCase().includes('billion') &&
        !funderData.total_funding_annually.toLowerCase().includes('thousand') &&
        !validFundingStrings.includes(funderData.total_funding_annually.toLowerCase())
    ) {
        warnings.push(`Suspicious funding amount format: ${funderData.total_funding_annually}`);
        funderData.total_funding_annually = "Varies by fiscal year";
    }
    
    if (funderData.average_grant_size && 
        !funderData.average_grant_size.includes('$') && 
        funderData.average_grant_size.toLowerCase() !== 'varies') {
        warnings.push(`Suspicious grant size format: ${funderData.average_grant_size}`);
        funderData.average_grant_size = 'Varies';
    }
    
    if (funderData.description && funderData.description.length < 50) {
        warnings.push(`Description seems too short: ${funderData.description.length} characters`);
    }
    
    if (funderData.description && funderData.description.length > 2000) {
        warnings.push(`Description seems too long: ${funderData.description.length} characters`);
        funderData.description = funderData.description.substring(0, 2000) + '...';
    }
    
    return { errors, warnings, cleanedData: funderData };
}

async function seedFunders() {
    console.log('--- Starting Enhanced Funder Discovery Script (All Bay Area Funding Sources) ---');

    console.log('  -> Checking database for existing funders...');
    const { data: existingFunders, error: fetchError } = await supabase.from('funders').select('name');
    if (fetchError) {
        console.error("  -> ‼️ Error fetching existing funders:", fetchError);
        return;
    }
    const existingNames = existingFunders ? existingFunders.map(f => f.name) : [];
    console.log(`  -> Found ${existingNames.length} funders in the database to exclude.`);

    let funderNamesToSeed = [];
    try {
        console.log('  -> Asking AI to discover 10 new funders across all Bay Area counties...');
        const discoveryPrompt = `
            You are a research assistant specializing in Bay Area funding organizations across all government levels and foundation types.
            List the names of 10 unique funding organizations that provide grants within the 9-county San Francisco Bay Area.
            INCLUDE ALL TYPES OF FUNDERS:
            - Private foundations, Community foundations, Corporate foundations
            - City, County, State, and Federal government agencies/departments that offer grants
            CRITICAL EXCLUSION RULE: Do NOT include any of the following names:
            - ${existingNames.join('\n- ')}
            ACCURACY REQUIREMENTS:
            - Only include organizations that you are CERTAIN exist and provide funding in the Bay Area.
            - Government entities should be specific agencies/departments (e.g., "City of Oakland Community Services Department").
            OUTPUT FORMAT: Return ONLY a valid JSON array of strings.
        `;
        
        const nameResult = await model.generateContent(discoveryPrompt);
        let nameJsonText = nameResult.response.text().trim().replace(/^```json\s*|```$/g, '');
        funderNamesToSeed = JSON.parse(nameJsonText);
        console.log(`  -> AI discovered the following new funders across all categories: ${funderNamesToSeed.join(', ')}`);
    } catch (error) {
        console.error("  -> ‼️ Error discovering funder names:", error);
        return;
    }
    
    if (!funderNamesToSeed || funderNamesToSeed.length === 0) {
        console.log("  -> AI did not return any new funders to process. Exiting.");
        return;
    }

    // IMPROVED ENRICHMENT PROMPT
    // IMPROVED ENRICHMENT PROMPT
const enrichmentPrompt = `
    You are a knowledgeable research assistant gathering information about Bay Area funding organizations. 
    For each organization listed below, provide information based on your knowledge, prioritizing recent, specific data.
    
    **Organizations to Research:**
    - ${funderNamesToSeed.join('\n- ')}
    
    **IMPORTANT GUIDELINES:**
    1. Always provide at least: name, funder_type, description, and geographic_scope
    2. **PRIORITIZE SPECIFIC DATA:** For funding amounts, search for specific figures from the most recent fiscal year (e.g., 2024 or 2023). If a verifiable, recent figure is unavailable, ONLY THEN use a placeholder like "Varies by fiscal year".
    3. For truly unknown URLs (website/logo), omit them entirely from the JSON
    4. For array fields (focus_areas, grant_types, etc.), provide reasonable defaults based on the organization type:
       - Government agencies often focus on: public services, infrastructure, community development
       - Foundations often focus on: education, health, arts, environment, social services
    5. Never use the string "null" - either omit the field or provide a reasonable default
    
    **Required JSON Structure:**
    Return a JSON array where each object has these fields:
    {
        "name": "Exact official name (required)",
        "funder_type": "One of: Private Foundation, Community Foundation, Corporate Foundation, City Government, County Government, State Government, Federal Government, Public-Private Partnership, or Other",
        "geographic_scope": ["Array of Bay Area counties - use full county names like 'San Francisco County' or 'Santa Clara County'"] or ["All Bay Area Counties"],
        "description": "At least 2-3 sentences describing the organization's mission and typical funding approach",
        "website": "Official website URL if known (omit if uncertain)",
        "logo_url": "Direct logo URL if known (omit if uncertain)",
        "location": "City, State of headquarters",
        "focus_areas": ["Array of at least 2-3 relevant funding areas"],
        "grant_types": ["Array of grant types like General Operating, Project Grants, Capacity Building"],
        "total_funding_annually": "Specific dollar amount for the most recent year (e.g., '$25M in 2023'). If a specific recent amount cannot be found, use 'Varies by fiscal year'.",
        "average_grant_size": "Dollar amount, range like '$10,000-$50,000', or 'Varies'",
        "application_process_summary": "Brief description or 'Contact organization for application details'",
        "key_personnel": [{"name": "Name if known", "title": "Title"}] or [],
        "past_grantees": ["List of 2-3 typical grantee types or organizations"] or [],
        "notable_grant": "Description of a program or typical grant type this funder might support"
    }
    
    Remember: It's better to provide reasonable, typical information for this type of organization than to leave fields empty.
    Return ONLY the JSON array with no additional text or markdown.
`;

    try {
        console.log("\n  -> Asking AI to gather detailed data for discovered funders...");
        const result = await model.generateContent(enrichmentPrompt);
        let jsonText = result.response.text().trim().replace(/^```json\s*|```$/g, '');
        
        jsonText = jsonText.replace(/^\s*[\[\{]/, match => match.trim());
        jsonText = jsonText.replace(/[\]\}]\s*$/, match => match.trim());
        
        const fundersToProcess = JSON.parse(jsonText);
        console.log(`  -> AI returned data for ${fundersToProcess.length} funding organizations.`);

        let insertedCount = 0;
        let validationErrors = 0;
        
        for (const rawFunderData of fundersToProcess) {
            if (!rawFunderData.name) {
                console.log('  -> Skipping a record with no name.');
                continue;
            }

            // SANITIZE DATA BEFORE VALIDATION
            const sanitizedData = sanitizeFunderData(rawFunderData);
            const { errors, warnings, cleanedData } = validateFunderData(sanitizedData);
            
            if (errors.length > 0) {
                console.error(`  -> ‼️ Validation errors for "${rawFunderData.name}": ${errors.join(', ')}`);
                validationErrors++;
                continue;
            }
            
            if (warnings.length > 0) {
                console.warn(`  -> ⚠️ Validation warnings for "${rawFunderData.name}": ${warnings.join(', ')}`);
            }

            const funderData = cleanedData;

            const { data: existingFunder } = await supabase.from('funders').select('id').eq('name', funderData.name).single();
            if (existingFunder) {
                console.log(`  -> Skipping "${funderData.name}" as it already exists in the database.`);
                continue;
            }

            if (funderData.website) {
                const isValidWebsite = await validateWebsiteUrl(funderData.website);
                if (!isValidWebsite) {
                    console.log(`     -> Invalid website URL for "${funderData.name}". Setting to null.`);
                    funderData.website = null;
                }
            }

            if (funderData.logo_url) {
                const isValidLogo = await validateImageUrl(funderData.logo_url);
                if (!isValidLogo) {
                    console.log(`     -> Invalid logo URL for "${funderData.name}". Setting to null.`);
                    funderData.logo_url = null;
                }
            }

            const funderTypeId = await getOrCreateFunderType(funderData.funder_type);

            // Ensure arrays are properly formatted for database insertion
            const { data: newFunder, error: insertError } = await supabase
                .from('funders')
                .insert({
                    name: funderData.name,
                    slug: generateSlug(funderData.name),
                    last_updated: new Date().toISOString(),
                    funder_type_id: funderTypeId,
                    description: funderData.description,
                    website: funderData.website,
                    location: funderData.location,
                    grant_types: funderData.grant_types || [],
                    application_process_summary: funderData.application_process_summary,
                    key_personnel: funderData.key_personnel || [],
                    past_grantees: funderData.past_grantees || [],
                    notable_grant: funderData.notable_grant,
                    logo_url: funderData.logo_url,
                    total_funding_annually: funderData.total_funding_annually,
                    average_grant_size: funderData.average_grant_size
                })
                .select('id')
                .single();

            if (insertError) {
                console.error(`  -> ‼️ Error inserting "${funderData.name}":`, insertError.message);
            } else {
                console.log(`  -> ✅ Successfully inserted "${funderData.name}" (ID: ${newFunder.id}).`);
                insertedCount++;
                await linkFunderToCategories(newFunder.id, funderData.focus_areas);
                await linkFunderToLocations(newFunder.id, funderData.geographic_scope);
            }
        }
        
        console.log(`\n--- Discovery complete. Inserted ${insertedCount} new funding organizations across all categories. ---`);
        console.log(`--- Validation errors encountered: ${validationErrors} ---`);

    } catch (error) {
        console.error("\n--- ‼️ A critical error occurred during data enrichment ---", error);
    }
}

async function verifyInsertedFunders() {
    console.log('\n--- Running Post-Insert Verification ---');
    
    const { data: recentFunders, error } = await supabase
        .from('funders')
        .select('name, website, description')
        .order('last_updated', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error('Error fetching recent funders for verification:', error);
        return;
    }
    
    for (const funder of recentFunders) {
        let score = 0;
        let maxScore = 3;
        
        if (funder.name && funder.name.length > 5) score++;
        if (funder.website && funder.website.startsWith('http')) score++;
        if (funder.description && funder.description.length > 100) score++;
        
        const quality = score / maxScore;
        const status = quality >= 0.8 ? '✅ HIGH' : quality >= 0.5 ? '⚠️ MEDIUM' : '❌ LOW';
        
        console.log(`  -> ${funder.name}: ${status} quality (${score}/${maxScore})`);
    }
}

module.exports = { seedFunders, verifyInsertedFunders };

if (require.main === module) {
    seedFunders().then(() => {
        verifyInsertedFunders();
    });
}