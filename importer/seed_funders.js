// enhanced_seed_funders.js - NOW PRIORITIZES PRIVATE FOUNDATIONS
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
const PRIORITY_FUNDERS_FILE = path.join(__dirname, 'priority_funders.txt');

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// --- UTILITY FUNCTIONS ---
function generateSlug(name) {
    if (!name) return null;
    return name.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/--+/g, '-');
}

async function validateImageUrl(url) {
    if (!url || !url.startsWith('http')) return false;
    try {
        const response = await axios.head(url, { timeout: 5000, httpsAgent });
        const contentType = response.headers['content-type'];
        return response.status >= 200 && response.status < 300 && contentType && contentType.startsWith('image/');
    } catch (error) { return false; }
}

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

function sanitizeFunderData(funderData) {
    Object.keys(funderData).forEach(key => {
        if (funderData[key] === "null" || funderData[key] === null) {
            if (['focus_areas', 'grant_types', 'key_personnel', 'past_grantees', 'geographic_scope'].includes(key)) funderData[key] = [];
            else funderData[key] = null;
        } else if (typeof funderData[key] === 'string' && funderData[key].toLowerCase() === 'null') funderData[key] = null;
        if (['focus_areas', 'grant_types', 'key_personnel', 'past_grantees', 'geographic_scope'].includes(key)) {
            if (!Array.isArray(funderData[key])) funderData[key] = [];
        }
    });
    if (!funderData.description) funderData.description = "This organization provides funding in the Bay Area. More information pending.";
    if (!funderData.average_grant_size) funderData.average_grant_size = "Varies";
    if (!funderData.total_funding_annually) funderData.total_funding_annually = "Varies by fiscal year";
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
        if (categoryId) await supabase.from('funder_categories').insert({ funder_id: funderId, category_id: categoryId });
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

async function getLocationId(locationName) {
    if (!locationName) return null;
    let normalizedName = locationName.trim();
    const bayAreaCountyNames = ['Alameda', 'Contra Costa', 'Marin', 'Napa', 'San Francisco', 'San Mateo', 'Santa Clara', 'Solano', 'Sonoma'];
    if (bayAreaCountyNames.includes(normalizedName)) normalizedName = `${normalizedName} County`;
    const { data: existingLocation } = await supabase.from('locations').select('id').eq('name', normalizedName).single();
    if (!existingLocation) console.warn(`     -> Location "${locationName}" (normalized: "${normalizedName}") not found in the predefined locations table.`);
    return existingLocation?.id;
}

async function linkFunderToLocations(funderId, locationNames) {
    if (!funderId || !locationNames || !Array.isArray(locationNames) || locationNames.length === 0) return;
    if (locationNames.includes('All Bay Area Counties')) {
        locationNames = ['Alameda County', 'Contra Costa County', 'Marin County', 'Napa County', 'San Francisco County', 'San Mateo County', 'Santa Clara County', 'Solano County', 'Sonoma County'];
    }
    console.log(`     -> Linking funder to funding locations: ${locationNames.join(', ')}`);
    for (const locName of locationNames) {
        const locationId = await getLocationId(locName.trim());
        if (locationId) await supabase.from('funder_funding_locations').insert({ funder_id: funderId, location_id: locationId });
    }
}

function validateFunderData(funderData) {
    const errors = [], warnings = [];
    if (!funderData.name || funderData.name.trim().length === 0) errors.push('Missing required field: name');
    const urlPattern = /^https?:\/\/.+\..+/;
    if (funderData.website && !urlPattern.test(funderData.website)) {
        warnings.push(`Invalid website URL format: ${funderData.website}`);
        funderData.website = null;
    }
    if (funderData.logo_url && !urlPattern.test(funderData.logo_url)) {
        warnings.push(`Invalid logo URL format: ${funderData.logo_url}`);
        funderData.logo_url = null;
    }
    if (funderData.description && funderData.description.length < 50) warnings.push(`Description seems too short: ${funderData.description.length} characters`);
    if (funderData.description && funderData.description.length > 2000) {
        warnings.push(`Description seems too long: ${funderData.description.length} characters`);
        funderData.description = funderData.description.substring(0, 2000) + '...';
    }
    return { errors, warnings, cleanedData: funderData };
}

// --- MAIN SCRIPT LOGIC ---
async function seedFunders() {
    console.log('--- Starting Enhanced Funder Seeding Script ---');
    console.log('  -> Checking database for existing funder names...');
    const { data: existingFunders, error: fetchError } = await supabase.from('funders').select('name');
    if (fetchError) {
        console.error("  -> ‼️ Error fetching existing funders:", fetchError);
        return;
    }
    const existingNamesSet = new Set(existingFunders ? existingFunders.map(f => f.name.trim().toLowerCase()) : []);
    console.log(`  -> Found ${existingNamesSet.size} funders in the database.`);

    let funderNamesToSeed = [];
    let isPriorityMode = false;

    if (fs.existsSync(PRIORITY_FUNDERS_FILE)) {
        const priorityContent = fs.readFileSync(PRIORITY_FUNDERS_FILE, 'utf-8');
        const priorityNames = priorityContent.split('\n').map(name => name.trim()).filter(name => name);
        if (priorityNames.length > 0) {
            isPriorityMode = true;
            console.log(`\n--- Operating in PRIORITY mode from ${PRIORITY_FUNDERS_FILE} ---`);
            funderNamesToSeed = priorityNames.filter(name => !existingNamesSet.has(name.trim().toLowerCase()));
            if (funderNamesToSeed.length === 0) {
                 console.log('  -> All funders from the priority list already exist in the database. Nothing to do.');
                 return;
            }
             console.log(`  -> Found ${funderNamesToSeed.length} new funders to process from priority list.`);
        }
    }

    if (!isPriorityMode) {
        console.log('\n--- Operating in AI DISCOVERY mode (Prioritizing Private Foundations) ---');
        try {
            console.log('  -> Asking AI to discover 10 new private foundations...');
            // UPDATED PROMPT TO PRIORITIZE PRIVATE FOUNDATIONS
            const discoveryPrompt = `
                You are a research assistant specializing in Bay Area funding organizations.
                List the names of 10 unique **Private Foundations** that provide grants within the 9-county San Francisco Bay Area.
                
                CRITICAL EXCLUSION RULE: Do NOT include any of the following names:
                - ${Array.from(existingNamesSet).join('\n- ')}

                OUTPUT FORMAT: Return ONLY a valid JSON array of strings.`;
            
            const nameResult = await model.generateContent(discoveryPrompt);
            let nameJsonText = nameResult.response.text().trim().replace(/^```json\s*|```$/g, '');
            funderNamesToSeed = JSON.parse(nameJsonText);
            console.log(`  -> AI discovered the following new private foundations: ${funderNamesToSeed.join(', ')}`);
        } catch (error) {
            console.error("  -> ‼️ Error discovering funder names:", error);
            return;
        }
    }
    
    if (!funderNamesToSeed || funderNamesToSeed.length === 0) {
        console.log("  -> No new funders to process. Exiting.");
        return;
    }

    const enrichmentPrompt = `
    You are a knowledgeable research assistant gathering information about Bay Area funding organizations. 
    For each organization listed below, provide detailed information.
    
    **Organizations to Research:**
    - ${funderNamesToSeed.join('\n- ')}
    
    **Required JSON Structure:**
    Return a JSON array where each object has these fields:
    {
        "name": "Exact official name (required)",
        "funder_type": "One of: Private Foundation, Community Foundation, Corporate Foundation, City Government, County Government, State Government, Federal Government, Other",
        "geographic_scope": ["Array of Bay Area counties - use full county names like 'San Francisco County'"] or ["All Bay Area Counties"],
        "description": "At least 2-3 sentences describing the organization's mission.",
        "website": "Official website URL",
        "logo_url": "Direct logo URL",
        "location": "City, State of headquarters",
        "focus_areas": ["Array of at least 2-3 relevant funding areas"],
        "grant_types": ["Array of grant types like General Operating, Project Grants"],
        "total_funding_annually": "Specific dollar amount for the most recent year (e.g., '$25M in 2023') or 'Varies by fiscal year'",
        "average_grant_size": "Dollar amount, range, or 'Varies'",
        "application_process_summary": "Brief description or 'Contact organization for application details'",
        "key_personnel": [{"name": "Name if known", "title": "Title"}] or [],
        "past_grantees": ["List of 2-3 typical grantee types or organizations"] or [],
        "notable_grant": "Description of a program or typical grant"
    }
    
    Return ONLY the JSON array.`;

    try {
        console.log(`\n  -> Asking AI to gather detailed data for ${funderNamesToSeed.length} funders...`);
        const result = await model.generateContent(enrichmentPrompt);
        const jsonText = result.response.text().trim().replace(/^```json\s*|```$/g, '');
        const fundersToProcess = JSON.parse(jsonText);
        console.log(`  -> AI returned data for ${fundersToProcess.length} organizations.`);

        let insertedCount = 0;
        
        for (const rawFunderData of fundersToProcess) {
            if (!rawFunderData.name) {
                console.log('  -> Skipping a record with no name.');
                continue;
            }
            const sanitizedData = sanitizeFunderData(rawFunderData);
            const { errors, cleanedData } = validateFunderData(sanitizedData);
            if (errors.length > 0) {
                console.error(`  -> ‼️ Validation errors for "${rawFunderData.name}": ${errors.join(', ')}`);
                continue;
            }
            const funderData = cleanedData;
            const { data: existingFunder } = await supabase.from('funders').select('id').eq('name', funderData.name).single();
            if (existingFunder) continue;

            if (funderData.website) {
                if (!await validateWebsiteUrl(funderData.website)) funderData.website = null;
            }
            if (funderData.logo_url) {
                if (!await validateImageUrl(funderData.logo_url)) funderData.logo_url = null;
            }

            const funderTypeId = await getOrCreateFunderType(funderData.funder_type);

            const { data: newFunder, error: insertError } = await supabase
                .from('funders')
                .insert({
                    name: funderData.name, slug: generateSlug(funderData.name), last_updated: new Date().toISOString(),
                    funder_type_id: funderTypeId, description: funderData.description, website: funderData.website,
                    location: funderData.location, grant_types: funderData.grant_types || [],
                    application_process_summary: funderData.application_process_summary, key_personnel: funderData.key_personnel || [],
                    past_grantees: funderData.past_grantees || [], notable_grant: funderData.notable_grant, logo_url: funderData.logo_url,
                    total_funding_annually: funderData.total_funding_annually, average_grant_size: funderData.average_grant_size
                })
                .select('id').single();

            if (insertError) {
                console.error(`  -> ‼️ Error inserting "${funderData.name}":`, insertError.message);
            } else {
                console.log(`  -> ✅ Successfully inserted "${funderData.name}" (ID: ${newFunder.id}).`);
                insertedCount++;
                await linkFunderToCategories(newFunder.id, funderData.focus_areas);
                await linkFunderToLocations(newFunder.id, funderData.geographic_scope);
            }
        }
        
        console.log(`\n--- Seeding complete. Inserted ${insertedCount} new funders. ---`);

    } catch (error) {
        console.error("\n--- ‼️ A critical error occurred during data enrichment ---", error);
    }
}

async function verifyInsertedFunders() {
    console.log('\n--- Running Post-Insert Verification ---');
    const { data: recentFunders, error } = await supabase.from('funders').select('name, website, description').order('last_updated', { ascending: false }).limit(10);
    if (error) {
        console.error('Error fetching recent funders for verification:', error);
        return;
    }
    for (const funder of recentFunders) {
        let score = 0, maxScore = 3;
        if (funder.name && funder.name.length > 5) score++;
        if (funder.website && funder.website.startsWith('http')) score++;
        if (funder.description && funder.description.length > 100) score++;
        const quality = score / maxScore;
        const status = quality >= 0.8 ? '✅ HIGH' : quality >= 0.5 ? '⚠️ MEDIUM' : '❌ LOW';
        console.log(`  -> ${funder.name}: ${status} quality (${score}/${maxScore})`);
    }
}

if (require.main === module) {
    seedFunders().then(() => {
        verifyInsertedFunders();
    });
}
