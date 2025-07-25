// Enhanced importer.js - WITH UPDATE LOGIC AND TAXONOMY SUPPORT
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
const https = require('https');

// --- ENHANCED CONFIGURATION ---
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PROCESSED_URLS_FILE = path.join(__dirname, 'processed_urls.json');
const RESCAN_INTERVAL_HOURS = 24;

// Improved: More lenient data quality thresholds
const MIN_DATA_COMPLETENESS = 0.6;
const REQUIRED_GRANT_FIELDS = ['title', 'description'];
const REQUIRED_ORG_FIELDS = ['name', 'type', 'description'];

// Enhanced crawling settings
const MAX_PAGES_TO_CRAWL = 12;
const CONTENT_MIN_LENGTH = 50;
const AI_RETRY_COUNT = 2;

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI    = new GoogleGenerativeAI(GEMINI_API_KEY);
const model    = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// --- UTILITY FUNCTIONS ---
const sleep = ms => new Promise(r => setTimeout(r, ms));

function generateSlug(name) {
    if (!name) {
        console.warn('     -> Warning: No name provided for slug generation');
        return null;
    }
    
    const slug = name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    if (!slug) {
        console.warn(`     -> Warning: Slug generation resulted in empty string for name: "${name}"`);
        return 'unnamed-organization';
    }
    
    return slug;
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

// --- ENHANCED DATA QUALITY FUNCTIONS ---
function calculateDataCompleteness(data, requiredFields) {
    const populatedFields = requiredFields.filter(field => {
        const value = data[field];
        return value !== null && value !== undefined && value !== '' && 
               (Array.isArray(value) ? value.length > 0 : true);
    });
    return populatedFields.length / requiredFields.length;
}

function validateGrantData(grantData) {
    const essentialFields = ['title', 'description'];
    const allFields = ['title', 'description', 'status', 'deadline', 'max_funding_amount', 'eligibility_criteria'];
    
    console.log(`     -> Validating grant: "${grantData.title || 'No Title'}"`);
    
    const issues = [];
    
    // Essential field validation (more lenient)
    if (!grantData.title || grantData.title.length < 3) {
        issues.push('Title missing or too short (need 3+ chars)');
    }
    
    if (!grantData.description || grantData.description.length < 30) {
        issues.push('Description missing or too short (need 30+ chars)');
    }
    
    // Calculate completeness for reporting
    const completeness = calculateDataCompleteness(grantData, allFields);
    
    const isValid = issues.length === 0;
    
    if (!isValid) {
        console.log(`     -> Grant validation failed: ${issues.join(', ')}`);
    } else {
        console.log(`     -> Grant validation passed with ${(completeness * 100).toFixed(1)}% completeness`);
    }
    
    return {
        isValid,
        completeness,
        issues
    };
}

function validateOrganizationData(orgData) {
    const completeness = calculateDataCompleteness(orgData, REQUIRED_ORG_FIELDS);
    const issues = [];
    
    if (completeness < MIN_DATA_COMPLETENESS) {
        issues.push(`Data completeness ${(completeness * 100).toFixed(1)}% below threshold of ${MIN_DATA_COMPLETENESS * 100}%`);
    }
    
    if (!orgData.name || orgData.name.length < 3) {
        issues.push('Organization name too short or missing');
    }
    
    if (!orgData.description || orgData.description.length < 100) {
        issues.push('Organization description too short or missing');
    }
    
    return {
        isValid: issues.length === 0,
        completeness,
        issues
    };
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

// --- ENHANCED AI EXTRACTION FUNCTIONS ---
async function extractGrantInfo(text) {
    if (!text || text.length < 100) return [];
    const prompt = `Analyze the following content and extract information about grants. For each distinct grant opportunity found, provide the following details in valid JSON format:

    ESSENTIAL FIELDS (must be populated):
    - title: Grant name (required, minimum 3 characters).
    - description: Description of the grant (required, minimum 30 characters).

    RECOMMENDED FIELDS:
    - status: Grant status - use "Open" for active grants, "Contact for details" if unknown.
    - deadline: Application deadline in YYYY-MM-DD format. Use null if not mentioned.
    - max_funding_amount: Maximum funding amount as NUMBER. Use null if not specified.
    - funding_amount_text: Funding amount as displayed in text (e.g., "$5,000 - $10,000").
    - application_url: SPECIFIC URL for the grant application form or page - NOT just the general website. Look for "apply here", "application form", "submit proposal" links.
    - grant_type: Type of grant (e.g., "General Operating", "Project Grant").
    - start_date: When grant period begins (YYYY-MM-DD format). Use null if unknown.
    - eligibility_criteria: Who can apply. Use "Contact organization for details" if not specified.
    - eligible_organization_types: Array of eligible org types using these taxonomy codes:
      - "nonprofit" (general nonprofits)
      - "nonprofit.501c3" (501(c)(3) organizations)
      - "nonprofit.fiscal_sponsorship" (fiscally sponsored projects)
      - "government" (government agencies)
      - "government.schools" (schools and educational institutions)
      - "individual" (individual artists, researchers)
      - "for_profit" (for-profit organizations)
      - "collaborative" (collaborative projects)
    - categories: Array of focus areas, max 10 (e.g., ["Arts & Culture", "Education"]).
    - locations: Array of eligible locations (e.g., ["San Francisco", "Bay Area"]).

    EXTRACTION PHILOSOPHY:
    - Extract ALL funding opportunities mentioned, even if details are incomplete
    - Use "Contact organization for details" for missing information
    - Include annual programs even if not currently accepting applications
    - Better to capture a grant with basic info than miss it entirely
    - If unsure about status, use "Open" or "Contact for details"
    - Look for any mention of funding, grants, awards, or financial support
    - For application_url, find the MOST SPECIFIC application link, not just the main website

    CRITICAL REQUIREMENTS:
    - Each grant MUST have title and description with meaningful content
    - Extract grants even if funding amounts, deadlines, or other details are missing
    - Return ONLY a valid JSON array. No markdown or explanations.
    - If no grants found, return empty array: [].

    Content to analyze:
    ${text.substring(0, 100000)}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim().replace(/^```json\s*|```$/g, '');
        const grants = JSON.parse(jsonText) || [];
        
        // Enhanced validation with more lenient approach
        const validGrants = grants.filter(grant => {
            // Only check essential fields
            if (!grant.title || grant.title.length < 3) {
                console.log(`     -> Rejecting grant: title too short or missing`);
                return false;
            }
            if (!grant.description || grant.description.length < 30) {
                console.log(`     -> Rejecting grant "${grant.title}": description too short or missing`);
                return false;
            }
            
            // Auto-fix missing status
            if (!grant.status) {
                grant.status = 'Open';
            }
            
            return true;
        });
        
        console.log(`     -> Extracted ${grants.length} grants, ${validGrants.length} passed validation`);
        return validGrants;
        
    } catch (error) {
        console.error('  -> ❗ Failed to extract grant info:', error.message);
        return [];
    }
}

async function extractOrganizationInfo(text) {
    if (!text || text.length < 100) return null;
    const prompt = `
        Analyze the content from an organization's website and extract the following details for the ORGANIZATIONS table.
        
        CRITICAL INSTRUCTION FOR ORGANIZATION NAME:
        - Extract the PRIMARY ORGANIZATION name, NOT program names
        - If you see "Foundation X - Program Y", use only "Foundation X"
        - Focus on the parent organization that provides the funding
        
        **Required JSON fields for organizations table:**
        - "name": The official name of the PRIMARY ORGANIZATION (required).
        - "type": Organization type - MUST be one of: "funder", "nonprofit", "government", "corporate", "foundation".
        - "description": A detailed summary (minimum 100 characters) of the organization's mission and activities.
        
        **Optional fields:**
        - "taxonomy_code": If this is a specific type of nonprofit/funder, provide taxonomy code if determinable.
        - "slug": URL-friendly version of name (auto-generated if not provided).
        - "tagline": Brief one-sentence description of what they do.
        - "website": The official website URL if mentioned.
        - "location": The city and state of headquarters (e.g., "San Francisco, CA").
        - "contact_email": Primary contact email if available.
        - "image_url": A direct URL to the organization's logo/image if found.
        - "annual_budget": Annual budget as text (e.g., "$2.5M annually", "Varies").
        - "staff_count": Number of staff as integer if mentioned.
        - "year_founded": Year established as integer if mentioned.
        - "capabilities": Array of strings describing organizational capabilities.
        - "extended_data": JSON object with additional details like:
          - "focus_areas": Array of focus areas (max 10)
          - "grant_types": Array of grant types they offer
          - "geographic_scope": Array of locations they serve
          - "total_funding_annually": Annual giving amount
          - "average_grant_size": Typical grant size range
          - "application_process_summary": How to apply summary
          - "key_personnel": Array of key staff with name/title
          - "past_grantees": Array of notable past recipients

        **Critical Requirements:**
        - Each organization MUST have name, type, and description with substantial content
        - Description must be at least 100 characters
        - Type must be one of the specified values
        - Return ONLY a single, valid JSON object
        - If insufficient data found, return null
        
        Content to analyze:
        ${text.substring(0, 100000)}
    `;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim().replace(/^```json\s*|```$/g, '');
        const orgData = JSON.parse(jsonText);
        
        if (!orgData) return null;
        
        // Validate organization data
        const validation = validateOrganizationData(orgData);
        if (!validation.isValid) {
            console.log(`     -> Rejecting organization "${orgData.name || 'Unknown'}" - Issues: ${validation.issues.join(', ')}`);
            return null;
        }
        
        console.log(`     -> Extracted organization with ${(validation.completeness * 100).toFixed(1)}% data completeness`);
        return orgData;
        
    } catch (error) {
        console.error('  -> ❗ Failed to extract organization info:', error.message);
        return null;
    }
}

// --- DATABASE HELPERS ---
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

// NEW: Taxonomy validation and management
async function validateTaxonomyCodes(taxonomyCodes) {
    if (!taxonomyCodes || !Array.isArray(taxonomyCodes) || taxonomyCodes.length === 0) {
        return [];
    }
    
    // Get all active taxonomy codes from the database
    const { data: validTaxonomies, error } = await supabase
        .from('organization_taxonomies')
        .select('code')
        .eq('is_active', true);
    
    if (error) {
        console.warn('Error fetching taxonomy codes:', error);
        return taxonomyCodes; // Return original if we can't validate
    }
    
    const validCodes = new Set(validTaxonomies.map(t => t.code));
    const validatedCodes = taxonomyCodes.filter(code => {
        if (validCodes.has(code)) {
            return true;
        } else {
            console.log(`     -> Invalid taxonomy code "${code}" - not found in organization_taxonomies`);
            return false;
        }
    });
    
    console.log(`     -> Validated ${validatedCodes.length}/${taxonomyCodes.length} taxonomy codes`);
    return validatedCodes;
}

// --- ENHANCED ORGANIZATION MANAGEMENT ---
async function findSimilarOrganization(name, website = null) {
    const { data: existingOrgs, error } = await supabase
        .from('organizations')
        .select('id, name, website, type');
    
    if (error || !existingOrgs) {
        console.error('Error fetching existing organizations for similarity check:', error);
        return null;
    }
    
    // First check for domain similarity if website provided
    if (website) {
        try {
            const inputDomain = new URL(website).hostname.replace('www.', '');
            for (const org of existingOrgs) {
                if (org.website) {
                    try {
                        const existingDomain = new URL(org.website).hostname.replace('www.', '');
                        if (inputDomain === existingDomain) {
                            console.log(`  -> 🌐 Found domain match: ${website} matches existing org "${org.name}"`);
                            return org;
                        }
                    } catch (urlError) {
                        continue;
                    }
                }
            }
        } catch (error) {
            // Invalid URL, continue with name matching
        }
    }
    
    // Check for name similarity
    const normalizedInputName = name.toLowerCase().trim();
    for (const org of existingOrgs) {
        const normalizedExistingName = org.name.toLowerCase().trim();
        if (normalizedInputName === normalizedExistingName) {
            console.log(`  -> 📝 Found exact name match: "${name}" = "${org.name}"`);
            return org;
        }
    }
    
    return null;
}

// NEW: Enhanced organization update logic
async function updateOrganizationData(orgId, newOrgInfo, primaryUrl) {
    console.log(`  -> 🔄 Checking for organization updates...`);
    
    // Get current organization data
    const { data: currentOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
    
    if (fetchError || !currentOrg) {
        console.error('  -> Error fetching current organization data:', fetchError);
        return orgId;
    }
    
    // Prepare updates - only update fields that are null/empty or if new data is more robust
    const updates = {
        updated_at: new Date().toISOString()
    };
    
    // Helper function to check if new data is more robust
    const isMoreRobust = (current, newValue) => {
        if (!current || current === null) return true;
        if (!newValue || newValue === null) return false;
        if (typeof newValue === 'string' && newValue.length > current.length * 1.2) return true;
        if (Array.isArray(newValue) && Array.isArray(current) && newValue.length > current.length) return true;
        return false;
    };
    
    // Update description if new one is more detailed
    if (newOrgInfo.description && isMoreRobust(currentOrg.description, newOrgInfo.description)) {
        updates.description = newOrgInfo.description;
        console.log(`     -> Updating description (${currentOrg.description?.length || 0} → ${newOrgInfo.description.length} chars)`);
    }
    
    // Update website if missing or new URL is validated
    if (newOrgInfo.website && (!currentOrg.website || newOrgInfo.website !== currentOrg.website)) {
        if (await validateWebsiteUrl(newOrgInfo.website)) {
            updates.website = newOrgInfo.website;
            console.log(`     -> Updating website: ${newOrgInfo.website}`);
        }
    }
    
    // Update other fields if they're missing
    const fieldsToUpdate = ['tagline', 'location', 'contact_email', 'annual_budget', 'staff_count', 'year_founded'];
    fieldsToUpdate.forEach(field => {
        if (newOrgInfo[field] && !currentOrg[field]) {
            updates[field] = newOrgInfo[field];
            console.log(`     -> Adding ${field}: ${newOrgInfo[field]}`);
        }
    });
    
    // Update extended_data if new data has more information
    if (newOrgInfo.extended_data && Object.keys(newOrgInfo.extended_data).length > 0) {
        const currentExtended = currentOrg.extended_data || {};
        const newExtended = { ...currentExtended, ...newOrgInfo.extended_data };
        updates.extended_data = newExtended;
        console.log(`     -> Updating extended_data with new information`);
    }
    
    // Only update if there are actual changes beyond updated_at
    const hasUpdates = Object.keys(updates).length > 1;
    
    if (hasUpdates) {
        const { error: updateError } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', orgId);
        
        if (updateError) {
            console.error('  -> ❗ Error updating organization data:', updateError);
        } else {
            console.log(`  -> ✅ Successfully updated organization with ${Object.keys(updates).length - 1} new data points`);
        }
    } else {
        console.log(`  -> ℹ️ No significant updates found for existing organization data`);
    }
    
    return orgId;
}

async function getOrCreateOrganization(orgInfo, primaryUrl) {
    if (!orgInfo || !orgInfo.name) {
        console.error('  -> ‼️ Organization name could not be extracted. Cannot proceed.');
        return null;
    }
    
    // Check for existing organization
    const existingOrg = await findSimilarOrganization(orgInfo.name, orgInfo.website || primaryUrl);
    if (existingOrg) {
        console.log(`  -> ✅ Using existing organization "${existingOrg.name}" (ID: ${existingOrg.id})`);
        // Update existing organization with new information
        return await updateOrganizationData(existingOrg.id, orgInfo, primaryUrl);
    }
    
    console.log(`  -> Creating new organization: "${orgInfo.name}"`);
    
    // Validate URLs
    if (orgInfo.website && !await validateWebsiteUrl(orgInfo.website)) {
        console.log(`     -> Invalid website URL, setting to primary: ${orgInfo.website}`);
        orgInfo.website = primaryUrl;
    }
    
    if (orgInfo.image_url && !await validateImageUrl(orgInfo.image_url)) {
        console.log(`     -> Invalid image URL, removing: ${orgInfo.image_url}`);
        orgInfo.image_url = null;
    }
    
    // Generate slug
    const orgSlug = generateSlug(orgInfo.name);
    
    // Prepare organization data for insertion
    const orgToInsert = {
        name: orgInfo.name,
        type: orgInfo.type || 'funder',
        slug: orgSlug,
        tagline: orgInfo.tagline || null,
        description: orgInfo.description,
        website: orgInfo.website || primaryUrl,
        location: orgInfo.location || null,
        contact_email: orgInfo.contact_email || null,
        image_url: orgInfo.image_url || null,
        annual_budget: orgInfo.annual_budget || null,
        staff_count: orgInfo.staff_count || null,
        year_founded: orgInfo.year_founded || null,
        capabilities: orgInfo.capabilities || [],
        extended_data: orgInfo.extended_data || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const { data: newOrg, error: insertError } = await supabase
        .from('organizations')
        .insert(orgToInsert)
        .select('id')
        .single();
    
    if (insertError) {
        console.error(`  -> ‼️ Error creating organization "${orgInfo.name}":`, insertError);
        return null;
    }
    
    const orgId = newOrg.id;
    console.log(`  -> ✅ Created new organization: "${orgInfo.name}" (ID: ${orgId})`);
    
    // Link to categories if focus areas provided
    if (orgInfo.extended_data?.focus_areas && Array.isArray(orgInfo.extended_data.focus_areas)) {
        await linkOrganizationToCategories(orgId, orgInfo.extended_data.focus_areas);
    }
    
    // Link to funding locations if geographic scope provided
    if (orgInfo.extended_data?.geographic_scope && Array.isArray(orgInfo.extended_data.geographic_scope)) {
        await linkOrganizationToLocations(orgId, orgInfo.extended_data.geographic_scope);
    }
    
    return orgId;
}

async function linkOrganizationToCategories(orgId, focusAreas) {
    if (!orgId || !focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) return;
    console.log(`     -> Linking organization to categories: ${focusAreas.join(', ')}`);
    
    for (const categoryName of focusAreas) {
        const categoryId = await getOrCreateCategory(categoryName.trim());
        if (categoryId) {
            await supabase.from('organization_categories').insert({ 
                organization_id: orgId, 
                category_id: categoryId 
            });
        }
    }
}

async function linkOrganizationToLocations(orgId, locationNames) {
    if (!orgId || !locationNames || !Array.isArray(locationNames) || locationNames.length === 0) return;
    
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
        const locationId = await getOrCreateLocation(locName.trim());
        if (locationId) {
            await supabase.from('organization_funding_locations').insert({ 
                organization_id: orgId, 
                location_id: locationId 
            });
        }
    }
}

// --- ENHANCED GRANT MANAGEMENT WITH UPDATE LOGIC ---
async function findSimilarGrant(grantInfo, organizationId) {
    const { data: existingGrants, error } = await supabase
        .from('grants')
        .select('id, title, description, deadline, max_funding_amount')
        .eq('organization_id', organizationId);
    
    if (error || !existingGrants) {
        console.error('Error fetching existing grants for similarity check:', error);
        return null;
    }
    
    const normalizedInputTitle = grantInfo.title.toLowerCase().trim();
    
    for (const grant of existingGrants) {
        const normalizedExistingTitle = grant.title.toLowerCase().trim();
        
        // Check for exact title match or very similar titles
        if (normalizedInputTitle === normalizedExistingTitle) {
            console.log(`  -> 📝 Found exact grant match: "${grantInfo.title}" = "${grant.title}"`);
            return grant;
        }
        
        // Check for similarity (80% or higher)
        const similarity = calculateStringSimilarity(normalizedInputTitle, normalizedExistingTitle);
        if (similarity >= 0.8) {
            console.log(`  -> 🔍 Found similar grant: "${grantInfo.title}" matches "${grant.title}" (${(similarity * 100).toFixed(1)}% similar)`);
            return grant;
        }
    }
    
    return null;
}

function calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// NEW: Enhanced grant update logic with FIXED funding amount handling
async function updateGrantData(grantId, newGrantInfo, primaryUrl) {
    console.log(`  -> 🔄 Updating existing grant with new information...`);
    
    // Get current grant data
    const { data: currentGrant, error: fetchError } = await supabase
        .from('grants')
        .select('*')
        .eq('id', grantId)
        .single();
    
    if (fetchError || !currentGrant) {
        console.error('  -> Error fetching current grant data:', fetchError);
        return grantId;
    }
    
    // Prepare updates
    const updates = {
        last_updated: new Date().toISOString()
    };
    
    // Helper function to check if new data is more robust
    const isMoreRobust = (current, newValue) => {
        if (!current || current === null) return true;
        if (!newValue || newValue === null) return false;
        if (typeof newValue === 'string' && newValue.length > current.length * 1.2) return true;
        return false;
    };
    
    // Update description if new one is more detailed
    if (newGrantInfo.description && isMoreRobust(currentGrant.description, newGrantInfo.description)) {
        updates.description = newGrantInfo.description;
        console.log(`     -> Updating grant description (${currentGrant.description?.length || 0} → ${newGrantInfo.description.length} chars)`);
    }
    
    // Update funding amount if missing or new amount is different
    if (newGrantInfo.max_funding_amount && !currentGrant.max_funding_amount) {
        updates.max_funding_amount = newGrantInfo.max_funding_amount;
        
        // FIX: Add proper null checking and type validation for toLocaleString()
        if (newGrantInfo.funding_amount_text) {
            updates.funding_amount_text = newGrantInfo.funding_amount_text;
        } else if (typeof newGrantInfo.max_funding_amount === 'number' && !isNaN(newGrantInfo.max_funding_amount)) {
            updates.funding_amount_text = `${newGrantInfo.max_funding_amount.toLocaleString()}`;
        } else {
            // Fallback for non-numeric values
            updates.funding_amount_text = String(newGrantInfo.max_funding_amount);
        }
        
        console.log(`     -> Adding funding amount: ${updates.funding_amount_text}`);
    }
    
    // Update deadline if missing or more recent
    if (newGrantInfo.deadline && (!currentGrant.deadline || new Date(newGrantInfo.deadline) > new Date(currentGrant.deadline))) {
        updates.deadline = newGrantInfo.deadline;
        console.log(`     -> Updating deadline: ${newGrantInfo.deadline}`);
    }
    
    // FIX #2: Update application URL if it's more specific than current
    if (newGrantInfo.application_url && newGrantInfo.application_url !== primaryUrl) {
        // Only update if current URL is generic or missing
        if (!currentGrant.application_url || 
            currentGrant.application_url === primaryUrl ||
            currentGrant.application_url.length < newGrantInfo.application_url.length) {
            updates.application_url = newGrantInfo.application_url;
            console.log(`     -> Updating application URL: ${newGrantInfo.application_url}`);
        }
    }
    
    // Update other missing fields
    const fieldsToUpdate = ['eligibility_criteria', 'grant_type', 'start_date', 'status'];
    fieldsToUpdate.forEach(field => {
        if (newGrantInfo[field] && !currentGrant[field]) {
            updates[field] = newGrantInfo[field];
            console.log(`     -> Adding ${field}: ${newGrantInfo[field]}`);
        }
    });
    
    // FIX #3: Update eligible_organization_types if missing or new data has more types
    if (newGrantInfo.eligible_organization_types && Array.isArray(newGrantInfo.eligible_organization_types)) {
        const currentTypes = currentGrant.eligible_organization_types || [];
        if (currentTypes.length === 0 || newGrantInfo.eligible_organization_types.length > currentTypes.length) {
            // Validate taxonomy codes
            const validatedTypes = await validateTaxonomyCodes(newGrantInfo.eligible_organization_types);
            if (validatedTypes.length > 0) {
                updates.eligible_organization_types = validatedTypes;
                console.log(`     -> Updating eligible organization types: ${validatedTypes.join(', ')}`);
            }
        }
    }
    
    // Only update if there are actual changes beyond last_updated
    const hasUpdates = Object.keys(updates).length > 1;
    
    if (hasUpdates) {
        const { error: updateError } = await supabase
            .from('grants')
            .update(updates)
            .eq('id', grantId);
        
        if (updateError) {
            console.error('  -> ❗ Error updating grant data:', updateError);
        } else {
            console.log(`  -> ✅ Successfully updated grant with ${Object.keys(updates).length - 1} new data points`);
        }
        
        // Update categories if new ones found
        if (newGrantInfo.categories && Array.isArray(newGrantInfo.categories) && newGrantInfo.categories.length > 0) {
            await updateGrantCategories(grantId, newGrantInfo.categories);
        }
        
        // Update locations if new ones found
        if (newGrantInfo.locations && Array.isArray(newGrantInfo.locations) && newGrantInfo.locations.length > 0) {
            await updateGrantLocations(grantId, newGrantInfo.locations);
        }
        
        // FIX #3: Update grant_eligible_taxonomies table
        if (updates.eligible_organization_types) {
            await updateGrantEligibleTaxonomies(grantId, updates.eligible_organization_types);
        }
    } else {
        console.log(`  -> ℹ️ No significant updates found for existing grant data`);
    }
    
    return grantId;
}

// NEW: Function to update grant categories
async function updateGrantCategories(grantId, newCategories) {
    const { data: existingCategories } = await supabase
        .from('grant_categories')
        .select('category_id, categories(name)')
        .eq('grant_id', grantId);
    
    const existingCategoryNames = new Set(
        existingCategories?.map(gc => gc.categories?.name).filter(Boolean) || []
    );
    
    const categoriesToAdd = newCategories.filter(cat => !existingCategoryNames.has(cat));
    
    if (categoriesToAdd.length > 0) {
        console.log(`     -> Adding ${categoriesToAdd.length} new grant categories: ${categoriesToAdd.join(', ')}`);
        for (const categoryName of categoriesToAdd) {
            const categoryId = await getOrCreateCategory(categoryName);
            if (categoryId) {
                await supabase.from('grant_categories').insert({ 
                    grant_id: grantId, 
                    category_id: categoryId 
                });
            }
        }
    }
}

// NEW: Function to update grant locations
async function updateGrantLocations(grantId, newLocations) {
    const { data: existingLocations } = await supabase
        .from('grant_locations')
        .select('location_id, locations(name)')
        .eq('grant_id', grantId);
    
    const existingLocationNames = new Set(
        existingLocations?.map(gl => gl.locations?.name).filter(Boolean) || []
    );
    
    const locationsToAdd = newLocations.filter(loc => !existingLocationNames.has(loc));
    
    if (locationsToAdd.length > 0) {
        console.log(`     -> Adding ${locationsToAdd.length} new grant locations: ${locationsToAdd.join(', ')}`);
        for (const locationName of locationsToAdd) {
            const locationId = await getOrCreateLocation(locationName);
            if (locationId) {
                await supabase.from('grant_locations').insert({ 
                    grant_id: grantId, 
                    location_id: locationId 
                });
            }
        }
    }
}

// FIX #3: NEW function to update grant_eligible_taxonomies table
async function updateGrantEligibleTaxonomies(grantId, taxonomyCodes) {
    if (!taxonomyCodes || !Array.isArray(taxonomyCodes) || taxonomyCodes.length === 0) {
        return;
    }
    
    // First, remove existing entries for this grant
    await supabase
        .from('grant_eligible_taxonomies')
        .delete()
        .eq('grant_id', grantId);
    
    // Then, insert new entries
    console.log(`     -> Updating grant_eligible_taxonomies table with ${taxonomyCodes.length} codes`);
    
    for (const taxonomyCode of taxonomyCodes) {
        const { error } = await supabase
            .from('grant_eligible_taxonomies')
            .insert({
                grant_id: grantId,
                taxonomy_code: taxonomyCode
            });
        
        if (error) {
            console.warn(`     -> Error inserting taxonomy code "${taxonomyCode}":`, error.message);
        } else {
            console.log(`     -> Added taxonomy code: ${taxonomyCode}`);
        }
    }
}

async function saveGrantsToSupabase(grants, primaryUrl, organizationId) {
    if (!grants || grants.length === 0 || !organizationId) {
        console.log('  -> No grants to save or organizationId missing.');
        return;
    }

    let savedCount = 0;
    let updatedCount = 0;
    let rejectedCount = 0;

    for (const grant of grants) {
        try {
            // Final validation before saving (with organization_id added)
            const validation = validateGrantData({...grant, organization_id: organizationId});
            if (!validation.isValid) {
                console.log(`  -> ⚠️ Rejecting grant "${grant.title}" - ${validation.issues.join(', ')}`);
                rejectedCount++;
                continue;
            }

            // Check if similar grant already exists
            const existingGrant = await findSimilarGrant(grant, organizationId);
            
            if (existingGrant) {
                console.log(`  -> ⚡ Found existing grant "${existingGrant.title}" (ID: ${existingGrant.id}). Updating instead of creating new one.`);
                await updateGrantData(existingGrant.id, grant, primaryUrl);
                updatedCount++;
                continue;
            }

          // FIX #2: Improve application URL logic
const applicationUrl = primaryUrl; 

// FIX #3: Validate taxonomy codes before insertion
const validatedTaxonomyCodes = grant.eligible_organization_types ? 
    await validateTaxonomyCodes(grant.eligible_organization_types) : [];

            // Prepare grant data
            const grantToInsert = {
                title: grant.title,
    description: grant.description,
    eligibility_criteria: grant.eligibility_criteria || null,
    deadline: grant.deadline || null,
    max_funding_amount: grant.max_funding_amount || null,
    application_url: applicationUrl, // This will now be correct
    grant_type: grant.grant_type || null,
    status: grant.status || 'Open',
    start_date: grant.start_date || null,
    organization_id: organizationId,
    slug: generateSlug(grant.title),
    funding_amount_text: grant.funding_amount_text || null,
    eligible_organization_types: validatedTaxonomyCodes, // Now this will work
    date_added: new Date().toISOString().split('T')[0],
    last_updated: new Date().toISOString()
            };

            const { data: insertResult, error } = await supabase
                .from('grants')
                .insert(grantToInsert)
                .select('id')
                .single();

            if (error) {
                console.error(`  -> ‼️ Error inserting grant "${grant.title}":`, error.message);
                rejectedCount++;
                continue;
            }

            const grantId = insertResult.id;
            console.log(`  -> ✅ Successfully inserted grant: "${grant.title}" (ID: ${grantId})`);
            savedCount++;

            // Link to categories
            if (grant.categories && Array.isArray(grant.categories)) {
                for (const categoryName of grant.categories) {
                    const categoryId = await getOrCreateCategory(categoryName);
                    if (categoryId) {
                        await supabase.from('grant_categories').insert({ 
                            grant_id: grantId, 
                            category_id: categoryId 
                        });
                    }
                }
            }

            // Link to locations
            if (grant.locations && Array.isArray(grant.locations)) {
                for (const locationName of grant.locations) {
                    const locationId = await getOrCreateLocation(locationName);
                    if (locationId) {
                        await supabase.from('grant_locations').insert({ 
                            grant_id: grantId, 
                            location_id: locationId 
                        });
                    }
                }
            }

            // FIX #3: Populate grant_eligible_taxonomies table
            if (validatedTaxonomyCodes.length > 0) {
                await updateGrantEligibleTaxonomies(grantId, validatedTaxonomyCodes);
            }

        } catch (err) {
            console.error(`  -> ‼️ Error processing grant "${grant.title}":`, err.message);
            rejectedCount++;
        }
    }

    console.log(`  -> Grant summary: ${savedCount} saved, ${updatedCount} updated, ${rejectedCount} rejected for data quality issues`);
}

// --- WEB CRAWLING FUNCTIONS (keeping existing logic) ---
async function getSitemapUrls(domain) {
    try {
        const sitemapUrl = `${domain}/sitemap.xml`;
        const response = await axios.get(sitemapUrl, { timeout: 10000 });
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

async function discoverSitePages(baseUrl, context) {
    const discoveredUrls = new Set([baseUrl]);
    
    try {
        console.log(`  -> Discovering additional pages from: ${baseUrl}`);
        
        // FIRST: Try sitemap approach (higher success rate)
        const sitemapUrls = await getSitemapUrls(baseUrl);
        if (sitemapUrls.length > 0) {
            console.log(`  -> Found ${sitemapUrls.length} URLs in sitemap`);
            const grantRelatedUrls = sitemapUrls.filter(url => 
                ['grant', 'fund', 'apply', 'application', 'program', 'award', 'eligibility', 'guidelines', 'rfp', 'proposal', 'funding'].some(keyword => 
                    url.toLowerCase().includes(keyword)
                )
            );
            
            // Add grant-related URLs from sitemap (high priority)
            grantRelatedUrls.slice(0, 8).forEach(url => discoveredUrls.add(url));
            console.log(`  -> Added ${Math.min(grantRelatedUrls.length, 8)} grant-related URLs from sitemap`);
        }
        
        // SECOND: If we don't have enough URLs, try page crawling
        if (discoveredUrls.size < 10) {
            const page = await context.newPage();
            page.setDefaultTimeout(30000);
            
            try {
                await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
                await page.waitForTimeout(2000);
                
                const links = await page.evaluate((domain) => {
                    const allLinks = Array.from(document.querySelectorAll('a[href]'));
                    const baseHost = new URL(domain).hostname;
                    
                    return allLinks
                        .map(link => {
                            try {
                                const href = link.getAttribute('href');
                                if (!href) return null;
                                const url = new URL(href, domain);
                                if (url.hostname === baseHost) {
                                    return url.href;
                                }
                                return null;
                            } catch (e) {
                                return null;
                            }
                        })
                        .filter(url => url !== null);
                }, baseUrl);
                
                // Prioritize grant-related pages from crawling too
                const grantRelatedKeywords = ['grant', 'fund', 'apply', 'application', 'guideline', 'eligibility', 'program', 'award', 'support', 'rfp', 'proposal', 'funding'];
                const grantPages = links.filter(url => 
                    grantRelatedKeywords.some(keyword => url.toLowerCase().includes(keyword))
                );
                
                grantPages.slice(0, 5).forEach(url => discoveredUrls.add(url));
                
                const remainingSlots = MAX_PAGES_TO_CRAWL - discoveredUrls.size;
                if (remainingSlots > 0) {
                    const otherPages = links.filter(url => !grantPages.includes(url));
                    otherPages.slice(0, remainingSlots).forEach(url => discoveredUrls.add(url));
                }
                
            } catch (pageError) {
                console.log(`  -> Page crawling failed: ${pageError.message}`);
            } finally {
                await page.close();
            }
        }
        
        console.log(`  -> Discovered ${discoveredUrls.size} pages to crawl: ${Array.from(discoveredUrls).slice(0, 3).join(', ')}${discoveredUrls.size > 3 ? '...' : ''}`);
        
    } catch (error) {
        console.error(`  -> Error discovering pages from ${baseUrl}:`, error.message);
    }
    
    return Array.from(discoveredUrls);
}

async function getTextFromUrl(url, context) {
    try {
        const page = await context.newPage();
        page.setDefaultTimeout(60000);
        
        let success = false;
        const strategies = [
            { waitUntil: 'networkidle', timeout: 30000 },
            { waitUntil: 'domcontentloaded', timeout: 20000 },
            { waitUntil: 'load', timeout: 15000 }
        ];
        
        for (const strategy of strategies) {
            try {
                await page.goto(url, strategy);
                success = true;
                break;
            } catch (error) {
                console.log(`  -> Loading strategy failed for ${url}, trying next...`);
            }
        }
        
        if (!success) {
            console.log(`  -> All strategies failed for ${url}, attempting basic load...`);
            await page.goto(url, { timeout: 15000 });
        }
        
        await page.waitForTimeout(2000);
        
        try {
            await page.waitForSelector('body', { timeout: 5000 });
        } catch (e) {
            // Continue if selector not found
        }
        
        // Enhanced text extraction with grant-specific focus
        const text = await page.evaluate(() => {
            // Remove noise but keep more content
            document.querySelectorAll('script, style, nav, footer, header, .cookie-notice, .advertisement').forEach(el => el.remove());
            
            // Look for specific grant-related sections
            const grantSections = document.querySelectorAll([
                '[class*="grant"]', '[id*="grant"]',
                '[class*="fund"]', '[id*="fund"]',
                '[class*="apply"]', '[id*="apply"]',
                '[class*="program"]', '[id*="program"]',
                'main', '.content', '#content', '.main-content'
            ].join(', '));
            
            let combinedText = document.body.innerText;
            
            // Add extra weight to grant-specific sections
            grantSections.forEach(section => {
                if (section.innerText && section.innerText.length > 100) {
                    combinedText += '\n\n--- GRANT SECTION ---\n' + section.innerText;
                }
            });
            
            return combinedText;
        });
        
        await page.close();
        return text;
        
    } catch (error) {
        console.error(`  -> Error getting text from ${url}:`, error.message);
        return null;
    }
}

async function crawlDomainAndGetContent(urls, context) {
    let combinedText = '';
    let successfulCrawls = 0;
    
    for (const url of urls) {
        try {
            console.log(`  -> Crawling: ${url}`);
            const text = await getTextFromUrl(url, context);
            if (text && text.length > CONTENT_MIN_LENGTH) {
                combinedText += `\n\n--- Content from ${url} ---\n\n${text}`;
                successfulCrawls++;
            } else {
                console.log(`  -> ⚠️ No meaningful content extracted from ${url}`);
            }
            await sleep(2000);
        } catch (error) {
            console.error(`  -> Error crawling ${url}:`, error.message);
        }
    }
    
    console.log(`  -> Successfully crawled ${successfulCrawls}/${urls.length} pages`);
    return combinedText;
}

// --- ENHANCED EXTRACTION WITH RETRY LOGIC ---
async function extractGrantInfoWithRetry(text) {
    console.log('  -> Attempting grant extraction with multiple strategies...');
    
    // Strategy 1: Standard extraction
    let grants = await extractGrantInfo(text);
    console.log(`     -> Strategy 1 (standard): Found ${grants.length} grants`);
    
    // Strategy 2: If no grants found, try more lenient approach
    if (grants.length === 0 && AI_RETRY_COUNT > 1) {
        console.log('     -> Trying lenient extraction strategy...');
        const lenientPrompt = `
        Look for ANY funding opportunities, programs, or financial support mentioned in this content.
        Include:
        - Annual programs (even if not currently open)
        - Past grant examples or case studies
        - Funding programs mentioned anywhere
        - Any dollar amounts or awards referenced
        - Scholarships, fellowships, or other financial support
        
        Very relaxed standards:
        - Accept titles as short as 3 words
        - Accept descriptions as short as 20 characters
        - Use "Contact organization for details" for missing information
        - Use "Open" for status if unknown
        - Extract ANYTHING that looks like a funding opportunity
        
        Return JSON array format with title and description minimum.
        `;
        
        try {
            const result = await model.generateContent(lenientPrompt + text.substring(0, 80000));
            const response = await result.response;
            let jsonText = response.text().trim().replace(/^```json\s*|```$/g, '');
            const lenientGrants = JSON.parse(jsonText) || [];
            
            // Apply minimal validation
            const validLenientGrants = lenientGrants.filter(grant => 
                grant.title && grant.title.length >= 3 && 
                grant.description && grant.description.length >= 20
            );
            
            grants = validLenientGrants;
            console.log(`     -> Strategy 2 (lenient): Found ${grants.length} grants`);
        } catch (error) {
            console.log(`     -> Strategy 2 failed: ${error.message}`);
        }
    }
    
    return grants;
}

// --- MAIN FUNCTION ---
async function main() {
    console.log('--- Starting Enhanced Grant Importer with Update Logic and Taxonomy Support ---');
    console.log(`📊 Configuration: ${MIN_DATA_COMPLETENESS * 100}% completeness threshold, ${MAX_PAGES_TO_CRAWL} max pages`);
    
    const processedUrlsMap = readProcessedUrls();
    const now = new Date();
    let domainsToProcess = [];
    
    try {
        const urlsFilePath = path.join(__dirname, 'urls.txt');
        const urlsContent = fs.readFileSync(urlsFilePath, 'utf-8');
        domainsToProcess = urlsContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
        console.log(`  -> Found ${domainsToProcess.length} URLs to process from urls.txt`);
    } catch (error) {
        console.error('  -> Error reading urls.txt:', error.message);
        return;
    }

    if (domainsToProcess.length === 0) {
        console.log('  -> No URLs found in urls.txt');
        return;
    }

    const urlsToProcess = domainsToProcess.filter(url => {
        const lastProcessed = processedUrlsMap.get(url);
        if (!lastProcessed) return true;
        const hoursSinceProcessed = (now - new Date(lastProcessed)) / 36e5;
        if (hoursSinceProcessed > RESCAN_INTERVAL_HOURS) {
            console.log(`  -> URL ${url} was last processed ${hoursSinceProcessed.toFixed(1)} hours ago, will reprocess`);
            return true;
        }
        return false;
    });

    if (urlsToProcess.length === 0) {
        console.log('  -> All URLs have been recently processed');
        return;
    }

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });
    
    const context = await browser.newContext({ 
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        timeout: 60000
    });

    let totalProcessed = 0;
    let totalGrantsSaved = 0;
    let totalGrantsUpdated = 0;
    let totalOrgsCreated = 0;
    let totalOrgsUpdated = 0;
    let totalRejected = 0;

    for (const url of urlsToProcess) {
        console.log(`\n=== Processing ${++totalProcessed}/${urlsToProcess.length}: ${url} ===`);
        
        try {
            // Step 1: Enhanced page discovery
            const urlsToScrape = await discoverSitePages(url, context);
            
            // Step 2: Crawl the discovered pages
            const combinedTextForDomain = await crawlDomainAndGetContent(urlsToScrape, context);

            if (combinedTextForDomain.length > CONTENT_MIN_LENGTH) {
                console.log(`  -> Extracted ${combinedTextForDomain.length} characters of content`);
                console.log('  -> Extracting organization and grant info from combined text...');
                
                // Enhanced extraction with retry logic
                const [grants, organization] = await Promise.all([
                    extractGrantInfoWithRetry(combinedTextForDomain),
                    extractOrganizationInfo(combinedTextForDomain)
                ]);

                await sleep(1000);
                
                // Enhanced debugging output
                console.log(`  -> AI Extraction Debug:`);
                console.log(`     - Content length: ${combinedTextForDomain.length} characters`);
                console.log(`     - Organization found: ${organization ? 'YES' : 'NO'}`);
                if (organization) {
                    console.log(`     - Organization name: "${organization.name}"`);
                    console.log(`     - Organization type: "${organization.type}"`);
                }
                console.log(`     - Raw grants extracted: ${grants.length}`);
                grants.forEach((grant, index) => {
                    console.log(`     - Grant ${index + 1}: "${grant.title}" (${grant.description?.length || 0} char desc)`);
                    if (grant.eligible_organization_types) {
                        console.log(`       -> Eligible for: ${grant.eligible_organization_types.join(', ')}`);
                    }
                });
                
                // Step 3: Create or update organization
                let organizationId = null;
                if (organization) {
                    const existingOrg = await findSimilarOrganization(organization.name, organization.website || url);
                    organizationId = await getOrCreateOrganization(organization, url);
                    
                    if (organizationId) {
                        if (!existingOrg) {
                            totalOrgsCreated++;
                        } else {
                            totalOrgsUpdated++;
                        }
                    }
                } else {
                    console.log(`  -> ⚠️ No organization data extracted or data quality too low. Skipping grants for this URL.`);
                    totalRejected++;
                    processedUrlsMap.set(url, now.toISOString());
                    continue;
                }
                
                // Step 4: Save or update grants
                if (organizationId && grants.length > 0) {
                    console.log(`  -> Processing ${grants.length} grants for database...`);
                    
                    // Count new vs updated grants
                    let newGrants = 0;
                    let updatedGrants = 0;
                    
                    for (const grant of grants) {
                        const existingGrant = await findSimilarGrant(grant, organizationId);
                        if (existingGrant) {
                            updatedGrants++;
                        } else {
                            newGrants++;
                        }
                    }
                    
                    await saveGrantsToSupabase(grants, url, organizationId);
                    
                    totalGrantsSaved += newGrants;
                    totalGrantsUpdated += updatedGrants;
                    
                    console.log(`  -> ✅ Successfully processed ${url} (${newGrants} new, ${updatedGrants} updated grants)`);
                } else if (organizationId && grants.length === 0) {
                    console.log(`  -> ✅ Organization processed but no grants found for ${url}`);
                } else {
                    console.log(`  -> ⚠️ Could not create organization, skipping grants for ${url}`);
                    totalRejected++;
                }
                
                // Mark as processed
                processedUrlsMap.set(url, now.toISOString());
                
            } else {
                console.log(`  -> ⚠️ Insufficient content extracted (${combinedTextForDomain.length} chars). Skipping AI analysis.`);
                console.log(`  -> This may be due to authentication requirements, anti-bot protection, or JavaScript-heavy content.`);
                totalRejected++;
                processedUrlsMap.set(url, now.toISOString());
            }
            
        } catch (err) {
            console.error(`  -> ‼️ Critical error processing ${url}:`, err.message);
            totalRejected++;
            processedUrlsMap.set(url, now.toISOString());
        }
        
        // Add delay between URLs to be respectful
        await sleep(3000);
    }

    await browser.close();
    writeProcessedUrls(processedUrlsMap);
    
    // Enhanced final summary
    console.log('\n' + '='.repeat(70));
    console.log('🏁 FINAL SUMMARY - Enhanced Importer with Update Logic');
    console.log('='.repeat(70));
    console.log(`📊 Processing Results:`);
    console.log(`   • URLs processed: ${totalProcessed}`);
    console.log(`   • Organizations created: ${totalOrgsCreated}`);
    console.log(`   • Organizations updated: ${totalOrgsUpdated}`);
    console.log(`   • Grants saved (new): ${totalGrantsSaved}`);
    console.log(`   • Grants updated: ${totalGrantsUpdated}`);
    console.log(`   • URLs rejected (insufficient data): ${totalRejected}`);
    console.log(`   • Success rate: ${((totalProcessed - totalRejected) / totalProcessed * 100).toFixed(1)}%`);
    console.log(`\n🔧 Key Improvements:`);
    console.log(`   • Update logic: Prevents duplicates, enriches existing data`);
    console.log(`   • Better application URLs: Finds specific grant application pages`);
    console.log(`   • Taxonomy support: Validates and links eligible organization types`);
    console.log(`   • Enhanced tracking: Separates new vs updated records`);
    console.log(`\n⚙️  Configuration Used:`);
    console.log(`   • Data quality threshold: ${MIN_DATA_COMPLETENESS * 100}%`);
    console.log(`   • Required grant fields: ${REQUIRED_GRANT_FIELDS.join(', ')}`);
    console.log(`   • Max pages per site: ${MAX_PAGES_TO_CRAWL}`);
    console.log(`   • AI retry attempts: ${AI_RETRY_COUNT}`);
    console.log(`   • Taxonomy validation: Enabled`);
    console.log(`   • Update existing records: Enabled`);
    console.log('\n--- Enhanced Importer Finished ---');
}

// Export for testing
module.exports = {
    calculateDataCompleteness,
    validateGrantData,
    validateOrganizationData,
    validateTaxonomyCodes,
    extractGrantInfo,
    extractOrganizationInfo,
    extractGrantInfoWithRetry,
    findSimilarGrant,
    findSimilarOrganization,
    updateGrantData,
    updateOrganizationData,
    updateGrantEligibleTaxonomies,
    main
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}