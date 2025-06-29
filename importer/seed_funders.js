// enhanced_seed_funders.js - COMPLETE FIXED FILE WITH ENHANCED DUPLICATE DETECTION
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

// --- ENHANCED DUPLICATE DETECTION FUNCTIONS ---
function normalizeNameForDeduplication(name) {
    if (!name || typeof name !== 'string') return '';
    
    let normalized = name.toLowerCase().trim();
    
    // Remove leading articles
    normalized = normalized.replace(/^(the\s+|a\s+|an\s+)/i, '');
    
    // Remove trailing organizational suffixes
    const suffixes = [
        'foundation', 'fund', 'inc', 'incorporated', 'llc', 'ltd', 'limited',
        'corp', 'corporation', 'company', 'co', 'trust', 'organization',
        'org', 'institute', 'center', 'centre', 'society', 'association',
        'nonprofit', 'non-profit'
    ];
    
    const suffixPattern = new RegExp(`\\s+(${suffixes.join('|')})(\\.)?$`, 'i');
    normalized = normalized.replace(suffixPattern, '');
    
    // Handle common abbreviations - simpler approach
    normalized = normalized.replace(/\bcomm\b/g, 'community');
    normalized = normalized.replace(/\bdev\b/g, 'development');
    normalized = normalized.replace(/\benv\b/g, 'environmental');
    normalized = normalized.replace(/\beduc\b/g, 'education');
    normalized = normalized.replace(/\btech\b/g, 'technology');
    normalized = normalized.replace(/\bsan fran\b/g, 'san francisco');
    normalized = normalized.replace(/\bsf\b/g, 'san francisco');
    normalized = normalized.replace(/\bsv\b/g, 'silicon valley');
    normalized = normalized.replace(/&/g, 'and');
    normalized = normalized.replace(/\+/g, 'and');
    
    // Handle specific foundation name variations
    normalized = normalized.replace(/\bpackard\s+(foundation\s+)?for\s+children'?s?\s+health\b/g, 'packard');
    normalized = normalized.replace(/\bdavid\s+and\s+lucile\s+packard\b/g, 'packard');
    normalized = normalized.replace(/\blucile\s+packard\b/g, 'packard');
    normalized = normalized.replace(/\bchildren'?s?\s+health\b/g, '');
    normalized = normalized.replace(/\bfor\s+children\b/g, '');
    
    // Remove special characters and extra whitespace
    normalized = normalized
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    return normalized;
}

function calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }
    
    return matrix[str2.length][str1.length];
}

function areNamesLikelyDuplicates(name1, name2) {
    if (!name1 || !name2) return false;
    
    const normalized1 = normalizeNameForDeduplication(name1);
    const normalized2 = normalizeNameForDeduplication(name2);
    
    if (normalized1 === normalized2) return true;
    
    const similarity = calculateStringSimilarity(normalized1, normalized2);
    return similarity > 0.9;
}

function checkForExistingFunder(newFunderName, existingFunders) {
    if (!newFunderName || !existingFunders) return null;
    
    // First check: exact match
    const exactMatch = existingFunders.find(f => 
        f.name.toLowerCase().trim() === newFunderName.toLowerCase().trim()
    );
    if (exactMatch) return exactMatch;
    
    // Second check: normalized duplicate detection
    for (const existingFunder of existingFunders) {
        if (areNamesLikelyDuplicates(newFunderName, existingFunder.name)) {
            console.log(`  -> 🔍 Potential duplicate detected:`);
            console.log(`     New: "${newFunderName}"`);
            console.log(`     Existing: "${existingFunder.name}"`);
            console.log(`     Normalized new: "${normalizeNameForDeduplication(newFunderName)}"`);
            console.log(`     Normalized existing: "${normalizeNameForDeduplication(existingFunder.name)}"`);
            return existingFunder;
        }
    }
    
    return null;
}

function generateEnhancedExclusionList(existingFunders) {
    if (!existingFunders || !Array.isArray(existingFunders)) return [];
    
    const exclusionList = [];
    
    existingFunders.forEach(funder => {
        // Add the exact name
        exclusionList.push(funder.name);
        
        // Add normalized version
        const normalized = normalizeNameForDeduplication(funder.name);
        if (normalized && normalized !== funder.name.toLowerCase()) {
            exclusionList.push(normalized);
        }
        
        // Add common variations
        const name = funder.name;
        
        if (!name.toLowerCase().startsWith('the ')) {
            exclusionList.push(`The ${name}`);
        }
        
        if (name.toLowerCase().startsWith('the ')) {
            exclusionList.push(name.replace(/^the\s+/i, ''));
        }
        
        if (name.toLowerCase().includes('community')) {
            exclusionList.push(name.replace(/community/gi, 'Comm'));
        }
        if (name.toLowerCase().includes('foundation')) {
            exclusionList.push(name.replace(/foundation/gi, 'Fund'));
        }
    });
    
    return [...new Set(exclusionList)];
}

// --- ORIGINAL UTILITY FUNCTIONS ---
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
        // Try GET request if HEAD fails
        try {
            const getResponse = await axios.get(url, { timeout: 10000, httpsAgent, maxRedirects: 5 });
            return getResponse.status >= 200 && getResponse.status < 400;
        } catch (getError) {
            console.log(`     -> Website validation failed for ${url}: ${error.message}`);
            return false;
        }
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

// --- ENHANCED MAIN SCRIPT LOGIC ---
async function seedFunders() {
    console.log('--- Starting Enhanced Funder Seeding Script with Duplicate Detection ---');
    console.log('  -> Checking database for existing funder names...');
    const { data: existingFunders, error: fetchError } = await supabase.from('funders').select('name, id');
    if (fetchError) {
        console.error("  -> ‼️ Error fetching existing funders:", fetchError);
        return;
    }
    
    console.log(`  -> Found ${existingFunders.length} existing funders in the database.`);

    let funderNamesToSeed = [];
    let isPriorityMode = false;

    if (fs.existsSync(PRIORITY_FUNDERS_FILE)) {
        const priorityContent = fs.readFileSync(PRIORITY_FUNDERS_FILE, 'utf-8');
        const priorityNames = priorityContent.split('\n').map(name => name.trim()).filter(name => name);
        if (priorityNames.length > 0) {
            isPriorityMode = true;
            console.log(`\n--- Operating in PRIORITY mode from ${PRIORITY_FUNDERS_FILE} ---`);
            
            // ENHANCED: Check for duplicates using new logic
            funderNamesToSeed = [];
            for (const priorityName of priorityNames) {
                const existingFunder = checkForExistingFunder(priorityName, existingFunders);
                if (!existingFunder) {
                    funderNamesToSeed.push(priorityName);
                } else {
                    console.log(`  -> ⏭️ Skipping "${priorityName}" - duplicate of existing "${existingFunder.name}"`);
                }
            }
            
            if (funderNamesToSeed.length === 0) {
                 console.log('  -> All funders from the priority list already exist in the database. Nothing to do.');
                 return;
            }
             console.log(`  -> Found ${funderNamesToSeed.length} new funders to process from priority list.`);
        }
    }

    if (!isPriorityMode) {
        console.log('\n--- Operating in AI DISCOVERY mode (All Bay Area Funders) ---');
        try {
            console.log('  -> Asking AI to discover 10 new Bay Area funding organizations...');
            
            // ENHANCED: Generate comprehensive exclusion list
            const exclusionList = generateEnhancedExclusionList(existingFunders);
            console.log(`  -> Generated exclusion list with ${exclusionList.length} variations.`);
            
            const discoveryPrompt = `
                You are a research assistant specializing in Bay Area funding organizations.
                List the names of 10 unique **funding organizations** that provide grants within the 9-county San Francisco Bay Area (Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, and Sonoma counties).
                
                CRITICAL EXCLUSION RULE: Do NOT include ANY variations of the following names:
                ${exclusionList.map(name => `- ${name}`).join('\n')}

                IMPORTANT GUIDELINES:
                - Use the EXACT official name of each organization
                - Do NOT add or remove articles like "The" unless that's the official name
                - Include ALL types of funders: Private Foundations, Community Foundations, Corporate Foundations, Government Agencies, Nonprofits that re-grant, Community Development Financial Institutions (CDFIs), etc.
                - Ensure each organization actually operates in or funds within the 9-county Bay Area
                - Focus on organizations that provide grants, funding, or financial support to nonprofits and community organizations
                - Double-check that none of your suggestions are variations of the excluded names above

                OUTPUT FORMAT: Return ONLY a valid JSON array of strings with exact official organization names.`;
            
            const nameResult = await model.generateContent(discoveryPrompt);
            let nameJsonText = nameResult.response.text().trim().replace(/^```json\s*|```$/g, '');
            const discoveredNames = JSON.parse(nameJsonText);
            
            // ENHANCED: Double-check discovered names against existing funders
            funderNamesToSeed = [];
            for (const discoveredName of discoveredNames) {
                const existingFunder = checkForExistingFunder(discoveredName, existingFunders);
                if (!existingFunder) {
                    funderNamesToSeed.push(discoveredName);
                } else {
                    console.log(`  -> ⏭️ AI suggested "${discoveredName}" but it's a duplicate of "${existingFunder.name}"`);
                }
            }
            
            console.log(`  -> After duplicate checking: ${funderNamesToSeed.length} unique funders to process`);
            if (funderNamesToSeed.length > 0) {
                console.log(`  -> Final list: ${funderNamesToSeed.join(', ')}`);
            }
        } catch (error) {
            console.error("  -> ‼️ Error discovering funder names:", error);
            return;
        }
    }
    
    if (!funderNamesToSeed || funderNamesToSeed.length === 0) {
        console.log("  -> No new unique funders to process. Exiting.");
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
        "funder_type": "One of: Private Foundation, Community Foundation, Corporate Foundation, City Government, County Government, State Government, Federal Government, Nonprofit Re-granter, CDFI, Other",
        "geographic_scope": ["Array of Bay Area counties - use full county names like 'San Francisco County'"] or ["All Bay Area Counties"],
        "description": "At least 2-3 sentences describing the organization's mission and funding focus.",
        "website": "Official website URL",
        "logo_url": "Direct logo URL if available",
        "location": "City, State of headquarters",
        "focus_areas": ["Array of at least 2-3 relevant funding areas like 'Education', 'Housing', 'Arts', 'Environment', etc."],
        "grant_types": ["Array of grant types like 'General Operating', 'Project Grants', 'Capacity Building', 'Emergency Grants', etc."],
        "total_funding_annually": "Specific dollar amount for the most recent year (e.g., '$25M in 2023') or 'Varies by fiscal year'",
        "average_grant_size": "Dollar amount, range, or 'Varies'",
        "application_process_summary": "Brief description or 'Contact organization for application details'",
        "key_personnel": [{"name": "Name if known", "title": "Title"}] or [],
        "past_grantees": ["List of 2-3 typical grantee types or organizations"] or [],
        "notable_grant": "Description of a program or typical grant if known"
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
            
            // ENHANCED: Final duplicate check before insertion
            const existingFunder = checkForExistingFunder(rawFunderData.name, existingFunders);
            if (existingFunder) {
                console.log(`  -> ⏭️ Skipping "${rawFunderData.name}" - final duplicate check found existing "${existingFunder.name}"`);
                continue;
            }
            
            const sanitizedData = sanitizeFunderData(rawFunderData);
            const { errors, cleanedData } = validateFunderData(sanitizedData);
            if (errors.length > 0) {
                console.error(`  -> ‼️ Validation errors for "${rawFunderData.name}": ${errors.join(', ')}`);
                continue;
            }
            const funderData = cleanedData;

            // Always keep the website URL, even if validation fails
            // Validation is just for logging purposes
            if (funderData.website) {
                const isValid = await validateWebsiteUrl(funderData.website);
                if (!isValid) {
                    console.log(`     -> Website validation failed but keeping URL: ${funderData.website}`);
                }
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
                
                // Add to existingFunders array to prevent duplicates in the same run
                existingFunders.push({ name: funderData.name, id: newFunder.id });
                
                await linkFunderToCategories(newFunder.id, funderData.focus_areas);
                await linkFunderToLocations(newFunder.id, funderData.geographic_scope);
            }
        }
        
        console.log(`\n--- Enhanced seeding complete. Inserted ${insertedCount} new unique funders. ---`);

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