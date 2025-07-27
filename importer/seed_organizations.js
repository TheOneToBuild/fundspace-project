// seed_organizations.js
// Unified organization seeder with foundation priority and taxonomy support

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
const PRIORITY_ORGANIZATIONS_FILE = path.join(__dirname, 'priority_organizations.txt');

const CONFIG = {
    BATCH_SIZE: 10,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    IMAGE_VALIDATION_TIMEOUT: 5000,
    RATE_LIMIT_DELAY: 1500,
    MAX_DESCRIPTION_LENGTH: 2000,
    MIN_DESCRIPTION_LENGTH: 100,
    
    // Organization type priorities (higher number = higher priority)
    TYPE_PRIORITIES: {
        'funder': 10,
        'foundation': 9,
        'corporate_foundation': 8,
        'government': 7,
        'community_foundation': 6,
        'nonprofit': 5
    }
};

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// =================================================================
// ENHANCED UTILITY FUNCTIONS
// =================================================================
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

async function retryWithBackoff(fn, maxRetries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
            console.log(`     -> Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
            await sleep(delay);
        }
    }
}

// =================================================================
// TAXONOMY AND VALIDATION FUNCTIONS
// =================================================================
async function getAvailableTaxonomies() {
    try {
        const { data: taxonomies, error } = await supabase
            .from('organization_taxonomies')
            .select('code, name, organization_type, level')
            .eq('is_active', true)
            .order('organization_type, level, sort_order');
        
        if (error) throw error;
        
        const taxonomyMap = {};
        taxonomies.forEach(tax => {
            if (!taxonomyMap[tax.organization_type]) {
                taxonomyMap[tax.organization_type] = [];
            }
            taxonomyMap[tax.organization_type].push({
                code: tax.code,
                name: tax.name,
                level: tax.level
            });
        });
        
        console.log(`  -> Loaded ${taxonomies.length} available taxonomies across ${Object.keys(taxonomyMap).length} organization types`);
        return taxonomyMap;
        
    } catch (error) {
        console.error("Error fetching taxonomies:", error);
        return {};
    }
}

function validateTaxonomyCode(taxonomyCode, organizationType, availableTaxonomies) {
    if (!taxonomyCode || !organizationType || !availableTaxonomies[organizationType]) {
        return null;
    }
    
    const validTaxonomy = availableTaxonomies[organizationType].find(
        tax => tax.code === taxonomyCode
    );
    
    return validTaxonomy ? taxonomyCode : null;
}

async function validateImageUrl(url) {
    if (!url) return false;
    
    try {
        new URL(url);
    } catch {
        return false;
    }
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    
    try {
        const response = await axios.head(url, { 
            timeout: CONFIG.IMAGE_VALIDATION_TIMEOUT,
            validateStatus: status => status < 400,
            maxRedirects: 5,
            httpsAgent
        });
        const contentType = response.headers['content-type'];
        return (response.status >= 200 && response.status < 300) && 
               (contentType?.startsWith('image/') || hasImageExtension);
    } catch (error) {
        return false;
    }
}

async function validateWebsiteUrl(url) {
    if (!url || !url.startsWith('http')) return false;
    try {
        const response = await axios.head(url, { 
            timeout: 10000, 
            httpsAgent,
            validateStatus: status => status < 500
        });
        return response.status >= 200 && response.status < 400;
    } catch (error) {
        try {
            const getResponse = await axios.get(url, { 
                timeout: 10000, 
                httpsAgent, 
                maxRedirects: 5,
                validateStatus: status => status < 500
            });
            return getResponse.status >= 200 && getResponse.status < 400;
        } catch (getError) {
            console.log(`     -> Website validation failed for ${url}: ${error.message}`);
            return false;
        }
    }
}

// =================================================================
// DUPLICATE DETECTION (Enhanced from seed_funders.js)
// =================================================================
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
    
    // Common abbreviations
    normalized = normalized.replace(/\bcomm\b/g, 'community');
    normalized = normalized.replace(/\bdev\b/g, 'development');
    normalized = normalized.replace(/\benv\b/g, 'environmental');
    normalized = normalized.replace(/\beduc\b/g, 'education');
    normalized = normalized.replace(/\btech\b/g, 'technology');
    normalized = normalized.replace(/\bsan fran\b/g, 'san francisco');
    normalized = normalized.replace(/\bsf\b/g, 'san francisco');
    normalized = normalized.replace(/&/g, 'and');
    normalized = normalized.replace(/\+/g, 'and');
    
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

function checkForExistingOrganization(newOrgName, existingOrgs) {
    if (!newOrgName || !existingOrgs) return null;
    
    // Exact match first
    const exactMatch = existingOrgs.find(org => 
        org.name.toLowerCase().trim() === newOrgName.toLowerCase().trim()
    );
    if (exactMatch) return exactMatch;
    
    // Similarity check
    for (const existingOrg of existingOrgs) {
        if (areNamesLikelyDuplicates(newOrgName, existingOrg.name)) {
            console.log(`  -> 🔍 Potential duplicate detected:`);
            console.log(`     New: "${newOrgName}"`);
            console.log(`     Existing: "${existingOrg.name}"`);
            return existingOrg;
        }
    }
    
    return null;
}

// =================================================================
// DATA VALIDATION
// =================================================================
function validateOrganizationData(data, availableTaxonomies, expectedType) {
    const errors = [];
    const warnings = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required');
    }
    
    // Validate and set the correct type
    const validTypes = ['foundation', 'nonprofit', 'government', 'corporate', 'individual'];
    
    if (!data.type || !validTypes.includes(data.type)) {
        console.log(`     -> Correcting type from "${data.type}" to "${expectedType}"`);
        data.type = expectedType;
    }
    
    // Validate taxonomy code more strictly
    if (data.taxonomy_code) {
        let validTaxonomy = false;
        
        // Check across all organization types since we use unified 'organization' type
        for (const orgType of Object.keys(availableTaxonomies)) {
            const taxonomyExists = availableTaxonomies[orgType].find(
                tax => tax.code === data.taxonomy_code
            );
            if (taxonomyExists) {
                validTaxonomy = true;
                break;
            }
        }
        
        if (!validTaxonomy) {
            warnings.push(`Invalid taxonomy code "${data.taxonomy_code}" - will be set to null`);
            data.taxonomy_code = null;
        } else {
            console.log(`     -> Valid taxonomy code: ${data.taxonomy_code}`);
        }
    } else {
        warnings.push('No taxonomy code provided - organization will need manual classification');
    }
    
    if (data.description) {
        if (data.description.length < CONFIG.MIN_DESCRIPTION_LENGTH) {
            errors.push(`Description too short (min ${CONFIG.MIN_DESCRIPTION_LENGTH} chars)`);
        }
        if (data.description.length > CONFIG.MAX_DESCRIPTION_LENGTH) {
            data.description = data.description.substring(0, CONFIG.MAX_DESCRIPTION_LENGTH) + '...';
            warnings.push('Description truncated');
        }
    } else {
        errors.push('Description is required');
    }
    
    if (data.website && !isValidUrl(data.website)) {
        warnings.push('Invalid website URL');
        data.website = null;
    }
    
    if (data.contact_email && !isValidEmail(data.contact_email)) {
        warnings.push('Invalid email address');
        data.contact_email = null;
    }
    
    if (data.year_founded) {
        const year = parseInt(data.year_founded);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear) {
            warnings.push('Invalid founding year');
            data.year_founded = null;
        }
    }
    
    if (data.staff_count && (isNaN(parseInt(data.staff_count)) || data.staff_count < 0)) {
        warnings.push('Invalid staff count');
        data.staff_count = null;
    }

    if (data.ein) {
        const einRegex = /^\d{2}-?\d{7}$/;
        if (!einRegex.test(data.ein)) {
            warnings.push('Invalid EIN format');
            data.ein = null;
        }
    }
    
    return { 
        isValid: errors.length === 0, 
        errors, 
        warnings, 
        data 
    };
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// =================================================================
// DATABASE HELPERS
// =================================================================
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
            console.error(`     -> Error creating category "${normalizedName}":`, error.message);
            return null;
        }
        
        return newCategory?.id;
    } catch (error) {
        console.error(`     -> Error in getOrCreateCategory for "${categoryName}":`, error.message);
        return null;
    }
}

async function getOrCreateLocation(locationName) {
    if (!locationName || typeof locationName !== 'string') return null;
    
    const normalizedName = locationName.trim();
    if (!normalizedName) return null;
    
    try {
        const { data: existing } = await supabase
            .from('locations')
            .select('id')
            .eq('name', normalizedName)
            .single();
            
        if (existing) return existing.id;
        
        console.log(`     -> Creating new location: "${normalizedName}"`);
        const { data: newLocation, error } = await supabase
            .from('locations')
            .insert({ name: normalizedName })
            .select('id')
            .single();
            
        if (error) {
            console.error(`     -> Error creating location "${normalizedName}":`, error.message);
            return null;
        }
        
        return newLocation?.id;
    } catch (error) {
        console.error(`     -> Error in getOrCreateLocation for "${locationName}":`, error.message);
        return null;
    }
}

async function linkOrganizationToCategories(organizationId, focusAreas) {
    if (!organizationId || !focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) return;
    
    const validCategories = focusAreas.filter(cat => cat && typeof cat === 'string');
    if (validCategories.length === 0) return;
    
    console.log(`     -> Linking organization to categories: ${validCategories.join(', ')}`);
    
    for (const categoryName of validCategories) {
        try {
            const categoryId = await getOrCreateCategory(categoryName.trim());
            if (categoryId) {
                const { error } = await supabase
                    .from('organization_categories')
                    .upsert({ 
                        organization_id: organizationId, 
                        category_id: categoryId 
                    }, { onConflict: 'organization_id, category_id' });
                
                if (error) {
                    console.error(`     -> Error linking category "${categoryName}":`, error.message);
                }
            }
        } catch (error) {
            console.error(`     -> Error linking category "${categoryName}":`, error.message);
        }
    }
}

async function linkOrganizationToLocations(organizationId, locationNames) {
    if (!organizationId || !locationNames || !Array.isArray(locationNames) || locationNames.length === 0) return;
    
    // Handle "All Bay Area Counties" shorthand
    if (locationNames.includes('All Bay Area Counties')) {
        locationNames = [
            'Alameda County', 'Contra Costa County', 'Marin County', 'Napa County', 
            'San Francisco County', 'San Mateo County', 'Santa Clara County', 
            'Solano County', 'Sonoma County'
        ];
    }
    
    console.log(`     -> Linking organization to funding locations: ${locationNames.join(', ')}`);
    for (const locName of locationNames) {
        try {
            const locationId = await getOrCreateLocation(locName.trim());
            if (locationId) {
                const { error } = await supabase
                    .from('organization_funding_locations')
                    .upsert({ 
                        organization_id: organizationId, 
                        location_id: locationId 
                    }, { onConflict: 'organization_id, location_id' });
                
                if (error) {
                    console.error(`     -> Error linking location "${locName}":`, error.message);
                }
            }
        } catch (error) {
            console.error(`     -> Error linking location "${locName}":`, error.message);
        }
    }
}

// =================================================================
// AI CONTENT GENERATION
// =================================================================
async function generateAIContent(prompt, retries = CONFIG.MAX_RETRIES) {
    return retryWithBackoff(async () => {
        const result = await model.generateContent(prompt);
        let jsonText = result.response.text().trim();
        
        jsonText = jsonText
            .replace(/^```json\s*|```$/g, '')
            .replace(/^```\s*|```$/g, '')
            .trim();
        
        try {
            return JSON.parse(jsonText);
        } catch (error) {
            console.error('     -> Invalid JSON from AI:', jsonText.substring(0, 200) + '...');
            throw new Error('Invalid JSON response from AI');
        }
    }, retries);
}

// =================================================================
// MAIN SEEDING LOGIC
// =================================================================
async function discoverOrganizations(organizationType, batchSize, existingOrgs, availableTaxonomies) {
    console.log(`  -> Asking AI to discover ${batchSize} new ${organizationType} organizations...`);
    
    const exclusionList = existingOrgs.map(org => org.name);
    const taxonomyInfo = availableTaxonomies[organizationType] || [];
    
    let typeSpecificGuidance = '';
    switch (organizationType) {
        case 'funder':
            typeSpecificGuidance = `
            Focus on organizations that provide grants, funding, or financial support to nonprofits.
            Include: Private foundations, community foundations, corporate foundations, family foundations.
            Prioritize: Organizations that actively fund Bay Area nonprofits.`;
            break;
        case 'nonprofit':
            typeSpecificGuidance = `
            Focus on 501(c)(3) nonprofit organizations providing direct services.
            Include: Service organizations, advocacy groups, community organizations.
            Exclude: Foundations, funders, grantmakers.`;
            break;
        case 'government':
            typeSpecificGuidance = `
            Focus on government agencies that provide grants or funding.
            Include: City departments, county agencies, state programs, federal regional offices.`;
            break;
    }
    
    const discoveryPrompt = `
        List the names of ${batchSize} unique ${organizationType} organizations based in the San Francisco Bay Area, California.
        
        ${typeSpecificGuidance}
        
        CRITICAL EXCLUSION RULE: Do NOT include any organization whose name appears in this list:
        ${exclusionList.slice(0, 100).map(name => `- ${name}`).join('\n')}
        
        GEOGRAPHIC REQUIREMENTS:
        - ONLY include organizations physically located in these 9 Bay Area counties:
          San Francisco, Alameda, Contra Costa, Marin, San Mateo, Santa Clara, Solano, Napa, Sonoma
        - Do NOT include organizations from other regions
        
        Available taxonomy codes for ${organizationType}: ${taxonomyInfo.map(t => `${t.code} (${t.name})`).join(', ')}
        
        Return ONLY a valid JSON array of organization names as strings.
        Example: ["Organization Name 1", "Organization Name 2", "Organization Name 3"]
    `;
    
    try {
        await sleep(CONFIG.RATE_LIMIT_DELAY);
        const organizationNames = await generateAIContent(discoveryPrompt);
        
        // Filter for duplicates
        const uniqueNames = organizationNames.filter(name => {
            const existingOrg = checkForExistingOrganization(name, existingOrgs);
            if (existingOrg) {
                console.log(`  -> ⏭️ Skipping "${name}" - duplicate of existing "${existingOrg.name}"`);
                return false;
            }
            return true;
        });
        
        console.log(`  -> AI discovered ${organizationNames.length} organizations, ${uniqueNames.length} unique after deduplication`);
        return uniqueNames;
        
    } catch (error) {
        console.error("  -> ‼️ Error discovering organization names:", error);
        return [];
    }
}

async function enrichOrganizationData(organizationNames, organizationType, availableTaxonomies) {
    if (!organizationNames || organizationNames.length === 0) return [];
    
    console.log(`  -> Asking AI to gather detailed data for ${organizationNames.length} ${organizationType} organizations...`);
    
    const taxonomyInfo = availableTaxonomies[organizationType] || [];
    
    // Map request types to proper organization types and taxonomy codes
    const typeMapping = {
        'funder': {
            type: 'foundation', // Use 'foundation' type for funders
            preferredTaxonomies: ['foundation.private', 'foundation.community', 'foundation.corporate', 'foundation.family']
        },
        'nonprofit': {
            type: 'nonprofit', // Use 'nonprofit' type
            preferredTaxonomies: ['nonprofit.501c3', 'nonprofit.service', 'nonprofit.advocacy']
        },
        'government': {
            type: 'government', // Use 'government' type
            preferredTaxonomies: ['government.local', 'government.county', 'government.state']
        }
    };
    
    const mapping = typeMapping[organizationType] || { type: 'foundation', preferredTaxonomies: [] };
    const preferredTaxonomyCodes = mapping.preferredTaxonomies.filter(code => 
        taxonomyInfo.some(t => t.code === code)
    );
    
    const enrichmentPrompt = `
        Provide detailed, factual information about these San Francisco Bay Area ${organizationType} organizations.
        
        Organizations to research:
        ${organizationNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}
        
        Return a JSON array with one object per organization containing these fields:
        
        REQUIRED FIELDS:
        - "name": Official organization name (string, required)
        - "type": Must be "${mapping.type}" (string, required)
        - "description": REQUIRED - Detailed 2-3 paragraph description (minimum 100 characters) of their work, mission, and programs
        
        TAXONOMY FIELD (IMPORTANT):
        - "taxonomy_code": Choose the MOST APPROPRIATE code from these options based on organization type:
          ${preferredTaxonomyCodes.length > 0 ? preferredTaxonomyCodes.join(', ') : taxonomyInfo.map(t => t.code).slice(0, 10).join(', ')}
          
          Guidelines for taxonomy selection:
          * For foundations/funders: Use "foundation.private", "foundation.community", or "foundation.corporate"
          * For nonprofits: Use "nonprofit.501c3" for general nonprofits, "nonprofit.service" for direct service
          * For government: Use "government.local", "government.county", or "government.state"
        
        OPTIONAL FIELDS:
        - "ein": The 9-digit Employer Identification Number, formatted XX-XXXXXXX (string or null)
        - "tagline": Brief mission statement, max 100 chars (string or null)
        - "website": Official website URL starting with https:// (string or null)
        - "image_url": Direct URL to their official logo (string or null)
        - "location": City and state format like "San Francisco, CA" (string or null)
        - "contact_email": Primary contact email (string or null)
        - "annual_budget": Budget range like "$1M - $5M" (string or null)
        - "staff_count": Number of staff (integer or null)
        - "year_founded": Year established (integer or null)
        - "capabilities": Array of organizational capabilities (array or null)
        - "extended_data": JSON object with additional details like:
          - "focus_areas": Array of focus areas (max 10)
          - "programs": Array of key programs or services
          - "geographic_scope": Array of locations served
          - "key_personnel": Array of key staff with name/title
          - "notable_achievements": Array of achievements or awards
        
        CRITICAL RULES:
        1. Use ONLY factual, verifiable information
        2. ALWAYS set "type" to "${mapping.type}" - this is critical for proper UI display
        3. ONLY include organizations where you can provide a meaningful description (minimum 100 characters)
        4. ONLY include organizations physically located in the 9 Bay Area counties
        5. Choose the most specific and appropriate taxonomy_code from the list provided
        6. Set any unknown field to null - do not guess or fabricate data
        7. Ensure all URLs are real and properly formatted
        8. Return ONLY valid JSON - no other text
        
        Return a JSON array of organization objects.
    `;
    
    try {
        await sleep(CONFIG.RATE_LIMIT_DELAY);
        const organizationsData = await generateAIContent(enrichmentPrompt);
        console.log(`  -> AI returned data for ${organizationsData.length} organizations`);
        return organizationsData;
        
    } catch (error) {
        console.error("  -> ‼️ Error enriching organization data:", error);
        return [];
    }
}

async function seedOrganizations(options = {}) {
    const { 
        batchSize = CONFIG.BATCH_SIZE,
        organizationType = 'funder', // Default to funders (highest priority)
        dryRun = false 
    } = options;
    
    console.log('--- Starting Unified Organization Seeding Script ---');
    console.log(`  -> Configuration: Type: ${organizationType}, Batch size: ${batchSize}, Dry run: ${dryRun}`);
    
    // Load available taxonomies
    const availableTaxonomies = await getAvailableTaxonomies();
    
    // Check for priority list
    let organizationNamesToSeed = [];
    let isPriorityMode = false;
    
    if (fs.existsSync(PRIORITY_ORGANIZATIONS_FILE)) {
        const priorityContent = fs.readFileSync(PRIORITY_ORGANIZATIONS_FILE, 'utf-8');
        const priorityNames = priorityContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
            
        if (priorityNames.length > 0) {
            isPriorityMode = true;
            console.log(`\n--- Operating in PRIORITY mode from ${PRIORITY_ORGANIZATIONS_FILE} ---`);
            organizationNamesToSeed = priorityNames;
        }
    }
    
    // Get existing organizations to avoid duplicates
    console.log('  -> Checking database for existing organizations...');
    const { data: existingOrganizations, error: fetchError } = await supabase
        .from('organizations')
        .select('name, type, ein, slug');
        
    if (fetchError) {
        console.error("  -> ‼️ Error fetching existing organizations:", fetchError);
        return;
    }
    
    const existingNames = new Set(existingOrganizations?.map(org => org.name.toLowerCase()) || []);
    const existingSlugs = new Set(existingOrganizations?.map(org => org.slug) || []);
    const existingEins = new Set(existingOrganizations?.map(org => org.ein).filter(Boolean) || []);
    console.log(`  -> Found ${existingNames.size} organizations in the database to exclude.`);
    
    // Discovery phase
    if (!isPriorityMode) {
        organizationNamesToSeed = await discoverOrganizations(
            organizationType, 
            batchSize, 
            existingOrganizations || [], 
            availableTaxonomies
        );
    } else {
        // Filter priority list for duplicates
        organizationNamesToSeed = organizationNamesToSeed.filter(name => {
            const existingOrg = checkForExistingOrganization(name, existingOrganizations || []);
            if (existingOrg) {
                console.log(`  -> ⏭️ Skipping priority org "${name}" - duplicate of existing "${existingOrg.name}"`);
                return false;
            }
            return true;
        });
        console.log(`  -> ${organizationNamesToSeed.length} priority organizations to process after deduplication`);
    }
    
    if (!organizationNamesToSeed || organizationNamesToSeed.length === 0) {
        console.log("  -> No new organizations to process.");
        return;
    }

    // Enrichment phase
    const organizationsToProcess = await enrichOrganizationData(
        organizationNamesToSeed, 
        organizationType, 
        availableTaxonomies
    );
    
    if (organizationsToProcess.length === 0) {
        console.log("  -> No organizations returned from enrichment phase.");
        return;
    }

    // Get the expected type based on the request
    const typeMapping = {
        'funder': 'foundation',
        'nonprofit': 'nonprofit', 
        'government': 'government'
    };
    const expectedType = typeMapping[organizationType] || 'foundation';

    // Processing phase
    const results = { inserted: 0, skipped: 0, errors: 0 };

    for (const orgData of organizationsToProcess) {
        console.log(`\n  -> Processing "${orgData.name || 'Unknown'}"...`);
        
        const { isValid, errors, warnings, data: validatedData } = validateOrganizationData(
            orgData, 
            availableTaxonomies, 
            expectedType
        );
        
        if (warnings.length > 0) {
            console.log(`     -> Warnings: ${warnings.join(', ')}`);
        }
        
        if (!isValid) {
            console.log(`     -> Validation errors: ${errors.join(', ')}`);
            results.errors++;
            continue;
        }

        // Check for existing organization
        const existingOrg = checkForExistingOrganization(validatedData.name, existingOrganizations || []);
        if (existingOrg) {
            console.log(`     -> Already exists in database`);
            results.skipped++;
            continue;
        }

        // Check EIN
        if (validatedData.ein && existingEins.has(validatedData.ein)) {
            console.log(`     -> Skipping, EIN ${validatedData.ein} already exists.`);
            results.skipped++;
            continue;
        }

        // Validate URLs
        if (validatedData.website) {
            const isValidWebsite = await validateWebsiteUrl(validatedData.website);
            if (!isValidWebsite) {
                console.log(`     -> Website validation failed, but keeping URL: ${validatedData.website}`);
            }
        }

        if (validatedData.image_url) {
            const isValidImage = await validateImageUrl(validatedData.image_url);
            if (!isValidImage) {
                console.log(`     -> Invalid image URL, removing: ${validatedData.image_url}`);
                validatedData.image_url = null;
            }
        }

        if (dryRun) {
            console.log(`     -> [DRY RUN] Would insert:`, JSON.stringify(validatedData, null, 2));
            results.inserted++;
            continue;
        }

        // Insert organization
        const { data: newOrganization, error: insertError } = await supabase
            .from('organizations')
            .insert({
                name: validatedData.name,
                type: validatedData.type,
                taxonomy_code: validatedData.taxonomy_code,
                slug: generateSlug(validatedData.name),
                tagline: validatedData.tagline,
                description: validatedData.description,
                website: validatedData.website,
                location: validatedData.location,
                contact_email: validatedData.contact_email,
                image_url: validatedData.image_url,
                annual_budget: validatedData.annual_budget,
                staff_count: validatedData.staff_count,
                year_founded: validatedData.year_founded,
                ein: validatedData.ein,
                capabilities: validatedData.capabilities || [],
                extended_data: validatedData.extended_data || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (insertError) {
            console.error(`     -> ‼️ Error inserting:`, insertError.message);
            results.errors++;
        } else {
            console.log(`     -> ✅ Successfully inserted (ID: ${newOrganization.id})`);
            results.inserted++;
            
            // Add to existing arrays to prevent duplicates in same run
            existingOrganizations.push({ 
                name: validatedData.name, 
                type: validatedData.type,
                ein: validatedData.ein,
                slug: generateSlug(validatedData.name)
            });
            
            // Link to categories
            if (validatedData.extended_data?.focus_areas) {
                await linkOrganizationToCategories(newOrganization.id, validatedData.extended_data.focus_areas);
            }
            
            // Link to funding locations
            if (validatedData.extended_data?.geographic_scope) {
                await linkOrganizationToLocations(newOrganization.id, validatedData.extended_data.geographic_scope);
            }
        }
        
        // Rate limiting
        await sleep(500);
    }
    
    console.log(`\n--- Organization seeding complete ---`);
    console.log(`  -> Type: ${organizationType}`);
    console.log(`  -> Inserted: ${results.inserted}`);
    console.log(`  -> Skipped: ${results.skipped}`);
    console.log(`  -> Errors: ${results.errors}`);
    console.log(`  -> Success rate: ${Math.round((results.inserted / (results.inserted + results.errors)) * 100)}%`);
}

// =================================================================
// MULTI-TYPE SEEDING WITH PRIORITY
// =================================================================
async function seedMultipleTypes(options = {}) {
    const { 
        batchSizePerType = 8,
        types = ['funder', 'nonprofit'], // Priority order
        dryRun = false 
    } = options;
    
    console.log('--- Starting Multi-Type Organization Seeding ---');
    console.log(`  -> Types to seed: ${types.join(', ')} (${batchSizePerType} each)`);
    
    const overallResults = {};
    
    for (const organizationType of types) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎯 SEEDING ${organizationType.toUpperCase()} ORGANIZATIONS`);
        console.log(`${'='.repeat(60)}`);
        
        try {
            await seedOrganizations({
                batchSize: batchSizePerType,
                organizationType,
                dryRun
            });
            
            overallResults[organizationType] = 'completed';
            
        } catch (error) {
            console.error(`❗ Error seeding ${organizationType}:`, error);
            overallResults[organizationType] = `failed: ${error.message}`;
        }
        
        // Delay between types
        if (types.indexOf(organizationType) < types.length - 1) {
            console.log('\n⏳ Waiting before next type...');
            await sleep(3000);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 MULTI-TYPE SEEDING SUMMARY');
    console.log('='.repeat(60));
    Object.entries(overallResults).forEach(([type, status]) => {
        const statusIcon = status === 'completed' ? '✅' : '❌';
        console.log(`${statusIcon} ${type}: ${status}`);
    });
}

// =================================================================
// CLI INTERFACE
// =================================================================
async function main() {
    const args = process.argv.slice(2);
    const options = { 
        batchSize: 10, 
        organizationType: 'funder', 
        dryRun: false,
        multiType: false
    };
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--batch-size': case '-b':
                options.batchSize = parseInt(args[++i]) || 10;
                break;
            case '--type': case '-t':
                options.organizationType = args[++i];
                break;
            case '--multi-type': case '-m':
                options.multiType = true;
                break;
            case '--dry-run': case '-d':
                options.dryRun = true;
                break;
            case '--help': case '-h':
                console.log(`
Unified Organization Seeder

Usage: node seed_organizations.js [options]

Options:
  -b, --batch-size <number>    Number of organizations to seed per type (default: 10)
  -t, --type <type>           Organization type: funder, nonprofit, government (default: funder)
  -m, --multi-type            Seed multiple types with foundation priority
  -d, --dry-run               Simulate the process without inserting data
  -h, --help                  Show this help message

Examples:
  node seed_organizations.js                           # Seed 10 funders
  node seed_organizations.js --type nonprofit         # Seed 10 nonprofits
  node seed_organizations.js --multi-type             # Seed funders + nonprofits
  node seed_organizations.js --batch-size 15 --type funder  # Seed 15 funders

Priority Mode:
  Create priority_organizations.txt with organization names (one per line)
  The script will automatically use this list instead of AI discovery
                `);
                process.exit(0);
        }
    }
    
    // Validate organization type
    const validTypes = ['funder', 'nonprofit', 'government'];
    if (!validTypes.includes(options.organizationType)) {
        console.error(`❗ Invalid organization type: ${options.organizationType}`);
        console.error(`Valid types for discovery: ${validTypes.join(', ')}`);
        console.error(`Note: All organizations are stored with type="organization" but discovered by category`);
        process.exit(1);
    }
    
    try {
        if (options.multiType) {
            await seedMultipleTypes({
                batchSizePerType: options.batchSize,
                types: ['funder', 'nonprofit'], // Foundation priority
                dryRun: options.dryRun
            });
        } else {
            await seedOrganizations(options);
        }
    } catch (error) {
        console.error('❗ Seeding failed:', error);
        process.exit(1);
    }
}

// Export for testing and module use
module.exports = { 
    seedOrganizations, 
    seedMultipleTypes,
    validateOrganizationData,
    checkForExistingOrganization,
    generateSlug
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❗ Critical error:', error);
        process.exit(1);
    });
}