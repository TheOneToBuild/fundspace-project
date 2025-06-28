// importer/importer.js - ENHANCED WITH COMPREHENSIVE FUNDER DATA COLLECTION
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

// --- CONFIGURATION ---
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PROCESSED_URLS_FILE = path.join(__dirname, 'processed_urls.json');
const RESCAN_INTERVAL_HOURS = 24;

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
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .trim()
        .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    if (!slug) {
        console.warn(`     -> Warning: Slug generation resulted in empty string for name: "${name}"`);
        return 'unnamed-funder';
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

async function getSitemapUrls(domain) {
    try {
        const sitemapUrl = `${domain}/sitemap.xml`;
        const response = await axios.get(sitemapUrl);
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

async function getUrlsFromRobotsTxt(domain) {
    try {
        const robotsUrl = `${domain}/robots.txt`;
        const response = await axios.get(robotsUrl);
        const lines = response.data.split('\n');
        const sitemapUrls = [];
        lines.forEach(line => {
            if (line.toLowerCase().startsWith('sitemap:')) {
                const url = line.substring(8).trim();
                if (url) sitemapUrls.push(url);
            }
        });
        return sitemapUrls;
    } catch (error) {
        console.log(`  -> No robots.txt found at ${domain}/robots.txt`);
        return [];
    }
}

async function crawlDomainAndGetContent(urls, context) {
    let combinedText = '';
    let successfulCrawls = 0;
    
    for (const url of urls) {
        try {
            console.log(`  -> Crawling: ${url}`);
            const text = await getTextFromUrl(url, context);
            if (text && text.length > 50) { // Only include meaningful content
                combinedText += `\n\n--- Content from ${url} ---\n\n${text}`;
                successfulCrawls++;
            } else {
                console.log(`  -> ⚠️ No meaningful content extracted from ${url}`);
            }
            await sleep(2000); // Increased delay for slower sites
        } catch (error) {
            console.error(`  -> Error crawling ${url}:`, error.message);
        }
    }
    
    console.log(`  -> Successfully crawled ${successfulCrawls}/${urls.length} pages`);
    return combinedText;
}

async function discoverSitePages(baseUrl, context) {
    const discoveredUrls = new Set([baseUrl]);
    
    try {
        console.log(`  -> Discovering additional pages from: ${baseUrl}`);
        const page = await context.newPage();
        
        // Set longer timeout for slow government sites
        page.setDefaultTimeout(60000);
        
        // Try different wait strategies
        let pageLoaded = false;
        const waitStrategies = [
            { waitUntil: 'networkidle', timeout: 30000 },
            { waitUntil: 'domcontentloaded', timeout: 20000 },
            { waitUntil: 'load', timeout: 15000 }
        ];
        
        for (const strategy of waitStrategies) {
            try {
                await page.goto(baseUrl, strategy);
                pageLoaded = true;
                break;
            } catch (error) {
                console.log(`  -> Wait strategy ${strategy.waitUntil} failed, trying next...`);
            }
        }
        
        if (!pageLoaded) {
            console.log(`  -> All wait strategies failed, attempting basic page load...`);
            await page.goto(baseUrl, { timeout: 10000 });
        }
        
        await page.waitForTimeout(3000); // Give extra time for dynamic content
        
        // Extract all internal links from the page
        const links = await page.evaluate((domain) => {
            const allLinks = Array.from(document.querySelectorAll('a[href]'));
            const baseHost = new URL(domain).hostname;
            
            return allLinks
                .map(link => {
                    try {
                        const href = link.getAttribute('href');
                        if (!href) return null;
                        
                        // Convert relative URLs to absolute
                        const url = new URL(href, domain);
                        
                        // Only include links from the same domain
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
        
        await page.close();
        
        // Prioritize grant-related pages
        const grantRelatedKeywords = ['grant', 'fund', 'apply', 'application', 'guideline', 'eligibility', 'program', 'award', 'support', 'rfp', 'proposal', 'funding'];
        const grantPages = links.filter(url => 
            grantRelatedKeywords.some(keyword => url.toLowerCase().includes(keyword))
        );
        
        // Add grant-related pages first (up to 5)
        grantPages.slice(0, 5).forEach(url => discoveredUrls.add(url));
        
        // Add other pages to reach total of 7 pages
        const remainingSlots = 7 - discoveredUrls.size;
        if (remainingSlots > 0) {
            const otherPages = links.filter(url => !grantPages.includes(url));
            otherPages.slice(0, remainingSlots).forEach(url => discoveredUrls.add(url));
        }
        
        console.log(`  -> Discovered ${discoveredUrls.size} pages to crawl: ${Array.from(discoveredUrls).join(', ')}`);
        
    } catch (error) {
        console.error(`  -> Error discovering pages from ${baseUrl}:`, error.message);
    }
    
    return Array.from(discoveredUrls);
}

async function getTextFromUrl(url, context) {
    try {
        const page = await context.newPage();
        
        // Set longer timeout for slow sites
        page.setDefaultTimeout(60000);
        
        // Try multiple loading strategies
        let success = false;
        const strategies = [
            { waitUntil: 'networkidle', timeout: 45000 },
            { waitUntil: 'domcontentloaded', timeout: 30000 },
            { waitUntil: 'load', timeout: 20000 }
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
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Try to wait for common content indicators
        try {
            await page.waitForSelector('body', { timeout: 5000 });
        } catch (e) {
            // Continue if selector not found
        }
        
        const text = await page.evaluate(() => {
            document.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
            return document.body.innerText;
        });
        
        await page.close();
        return text;
        
    } catch (error) {
        console.error(`  -> Error getting text from ${url}:`, error.message);
        return null;
    }
}

async function extractGrantInfo(text) {
    if (!text || text.length < 100) return [];
    const prompt = `Analyze the following content and extract information about grants. For each distinct grant opportunity found, provide the following details in valid JSON format:
    - title: Grant name (required).
    - description: Brief description of the grant (required).
    - eligibility_criteria: Who can apply and eligibility requirements (if mentioned).
    - funding_amount: Maximum funding amount as a NUMBER (no commas or symbols). If a range like "$5,000 to $10,000", use 10000.
    - funding_amount_text: The funding amount as displayed in the original text (e.g., "$5,000 - $10,000", "Up to $50,000").
    - deadline: Application deadline in YYYY-MM-DD format. If year not mentioned, use 2025. If date has passed, use 2026.
    - application_url: Direct URL to application or grant details page.
    - grant_type: Type of grant (e.g., "General Operating Support", "Project Grant", "Capacity Building").
    - categories: Array of focus areas or categories this grant supports. LIMIT TO MAXIMUM 10 CATEGORIES (e.g., ["Education", "Arts & Culture", "Healthcare"]).
    - locations: Array of eligible geographic locations (e.g., ["San Francisco", "Bay Area", "California"]).

    IMPORTANT:
    - Return ONLY a valid JSON array. No markdown or explanations.
    - Each grant must have at least "title" and "description".
    - LIMIT categories array to maximum 10 items - choose the most relevant ones.
    - If a field cannot be determined, set to null.
    - If no grants found, return empty array: [].
    - Ensure proper JSON escaping.

    Content to analyze:
    ${text.substring(0, 80000)}`;

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

async function extractFunderInfo(text) {
    if (!text || text.length < 100) return null;
    const prompt = `
        Analyze the content from a funder's website and extract the following details.
        
        CRITICAL INSTRUCTION FOR ORGANIZATION NAME:
        - Extract the PRIMARY FOUNDATION/ORGANIZATION name, NOT program names
        - If you see "Foundation X - Program Y" or "Program Y of Foundation X", use only "Foundation X"
        - Examples: "Zellerbach Family Foundation - Community Arts" → use "Zellerbach Family Foundation"
        - Examples: "Community Arts Program of Smith Foundation" → use "Smith Foundation"
        - Focus on the parent organization that provides the funding, not specific program names
        
        **Required JSON fields:**
        - "name": The official name of the PRIMARY FOUNDATION/ORGANIZATION (required) - NOT program names.
        - "funder_type": The type of funder. Choose from: "Private Foundation", "Community Foundation", "Corporate Foundation", "City Government", "County Government", "State Government", "Federal Government", or "Other".
        - "geographic_scope": An array of strings listing the Bay Area counties this organization typically funds. Use full county names like "San Francisco County". If they fund all Bay Area, use ["All Bay Area Counties"].
        - "description": A detailed summary (at least 2-3 sentences) of the foundation's story, mission, and funding philosophy.
        - "website": The official website URL if mentioned.
        - "logo_url": A direct URL to the organization's logo image if found.
        - "location": The city and state of the organization's headquarters (e.g., "San Francisco, CA").
        - "focus_areas": An array of strings for the types of programs/causes they fund. LIMIT TO MAXIMUM 10 FOCUS AREAS (e.g., ["Housing", "Education", "Homelessness"]).
        - "grant_types": An array of common grant types they offer (e.g., ["General Operating Support", "Project Grants", "Capacity Building"]).
        - "total_funding_annually": A string representing approximate total annual giving with specific year if available (e.g., "$25M in 2023") or "Varies by fiscal year".
        - "average_grant_size": A string representing their typical grant size as a dollar figure or range (e.g., "$10,000 - $50,000") or "Varies".
        - "application_process_summary": A brief summary of how an organization can apply for funding or "Contact organization for application details".
        - "key_personnel": An array of objects for Program Officers or grant-making staff, each with "name" and "title" fields. If none found, use empty array.
        - "past_grantees": A JSON array of up to 6 notable past grantee organization names as strings. If none found, use empty array.
        - "notable_grant": A summary of any recent news, grants, or notable work the foundation has done.

        **Instructions & Rules:**
        - CRITICAL RULE: For any field, if you cannot find specific, factual data, you MUST return a value of null.
        - Return ONLY a single, valid JSON object.
        - Ensure all URLs start with http:// or https://
        - For arrays, return empty arrays [] if no data found, not null.
        - LIMIT focus_areas to maximum 10 items - choose the most relevant and specific ones.
        - ALWAYS extract the parent foundation name, never program-specific names.
        
        Content to analyze:
        ${text.substring(0, 80000)}
    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim().replace(/^```json\s*|```$/g, '');
        return JSON.parse(jsonText) || null;
    } catch (error) {
        console.error('  -> ❗ Failed to extract funder info:', error.message);
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

async function getOrCreateFunderType(typeName) {
    if (!typeName) return null;
    const normalizedTypeName = typeName.trim();
    const { data: existingType } = await supabase.from('funder_types').select('id').eq('name', normalizedTypeName).single();
    if (existingType) return existingType.id;
    console.log(`     -> Importer discovered a new funder type: "${normalizedTypeName}". Adding to database.`);
    const { data: newType, error } = await supabase.from('funder_types').insert({ name: normalizedTypeName }).select('id').single();
    if (error) {
        console.error(`     -> Error creating new funder type:`, error);
        return null;
    }
    return newType?.id;
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
    
    // Handle "All Bay Area Counties" shorthand
    if (locationNames.includes('All Bay Area Counties')) {
        locationNames = ['Alameda County', 'Contra Costa County', 'Marin County', 'Napa County', 'San Francisco County', 'San Mateo County', 'Santa Clara County', 'Solano County', 'Sonoma County'];
    }
    
    console.log(`     -> Linking funder to funding locations: ${locationNames.join(', ')}`);
    for (const locName of locationNames) {
        const locationId = await getLocationId(locName.trim());
        if (locationId) {
            await supabase.from('funder_funding_locations').insert({ funder_id: funderId, location_id: locationId });
        }
    }
}

function normalizeFunderName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/^the\s+/i, '') // Remove "The" at the beginning
        .replace(/\s*-\s*.+$/i, '') // Remove everything after " - " (program names)
        .replace(/\s+(community arts program|community arts|arts program|program)$/i, '') // Remove common program suffixes
        .replace(/\s+(foundation|fund|inc|corp|llc|organization|org)$/i, '') // Remove common suffixes
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

function calculateSimilarity(str1, str2) {
    const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
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

async function checkDomainSimilarity(inputUrl, existingFunders) {
    try {
        const inputDomain = new URL(inputUrl).hostname.replace('www.', '');
        
        for (const funder of existingFunders) {
            if (funder.website) {
                try {
                    const existingDomain = new URL(funder.website).hostname.replace('www.', '');
                    
                    // Special handling for government domains (.gov, .edu, .mil)
                    const isGovernmentDomain = (domain) => {
                        return domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil');
                    };
                    
                    // For government domains, require exact domain match or very specific subdomain match
                    if (isGovernmentDomain(inputDomain) || isGovernmentDomain(existingDomain)) {
                        // Only match if domains are exactly the same
                        if (inputDomain === existingDomain) {
                            console.log(`  -> 🌐 Found exact government domain match: ${inputUrl} matches existing funder "${funder.name}" (${funder.website})`);
                            return funder;
                        }
                        
                        // For government domains, also check if one is a direct subdomain of the other
                        // BUT only if they share the same agency subdomain (e.g., arts.ca.gov vs www.arts.ca.gov)
                        const inputParts = inputDomain.split('.');
                        const existingParts = existingDomain.split('.');
                        
                        if (inputParts.length >= 3 && existingParts.length >= 3) {
                            // For ca.gov domains, check if the agency part matches (e.g., "arts" in arts.ca.gov)
                            const inputAgency = inputParts[0]; // e.g., "arts" from "arts.ca.gov"
                            const existingAgency = existingParts[0]; // e.g., "arts" from "arts.ca.gov"
                            
                            if (inputAgency === existingAgency) {
                                console.log(`  -> 🌐 Found government agency match: ${inputUrl} matches existing funder "${funder.name}" (${funder.website})`);
                                return funder;
                            }
                        }
                        
                        // Skip other government domain checks
                        continue;
                    }
                    
                    // For non-government domains, use the original logic
                    // Check if domains match or are subdomains of each other
                    if (inputDomain === existingDomain || 
                        inputDomain.endsWith('.' + existingDomain) || 
                        existingDomain.endsWith('.' + inputDomain)) {
                        console.log(`  -> 🌐 Found domain match: ${inputUrl} relates to existing funder "${funder.name}" (${funder.website})`);
                        return funder;
                    }
                    
                    // Check for similar domain names (e.g., zff.org and communityarts.zff.org)
                    const inputParts = inputDomain.split('.');
                    const existingParts = existingDomain.split('.');
                    
                    // If the main domain parts match (ignoring subdomains)
                    if (inputParts.length >= 2 && existingParts.length >= 2) {
                        const inputMainDomain = inputParts.slice(-2).join('.');
                        const existingMainDomain = existingParts.slice(-2).join('.');
                        
                        if (inputMainDomain === existingMainDomain) {
                            console.log(`  -> 🌐 Found related domain: ${inputUrl} shares domain with existing funder "${funder.name}" (${funder.website})`);
                            return funder;
                        }
                    }
                } catch (urlError) {
                    // Skip invalid URLs
                    continue;
                }
            }
        }
    } catch (error) {
        // Skip if input URL is invalid
    }
    
    return null;
}

async function findSimilarFunder(name, currentUrl = null) {
    const { data: existingFunders, error } = await supabase
        .from('funders')
        .select('id, name, website');
    
    if (error || !existingFunders) {
        console.error('Error fetching existing funders for similarity check:', error);
        return null;
    }
    
    // First, check for domain similarity if URL is provided
    if (currentUrl) {
        const domainMatch = await checkDomainSimilarity(currentUrl, existingFunders);
        if (domainMatch) {
            return domainMatch;
        }
    }
    
    const normalizedInputName = normalizeFunderName(name);
    
    for (const funder of existingFunders) {
        const normalizedExistingName = normalizeFunderName(funder.name);
        const similarity = calculateSimilarity(normalizedInputName, normalizedExistingName);
        
        // If similarity is 85% or higher, consider it a match
        if (similarity >= 0.85) {
            console.log(`  -> 🔍 Found similar funder: "${name}" matches "${funder.name}" (${(similarity * 100).toFixed(1)}% similar)`);
            return funder;
        }
    }
    
    return null;
}

async function updateExistingFunderData(funderId, newFunderInfo, primaryUrl) {
    console.log(`  -> 🔄 Updating existing funder data with new information from website...`);
    
    // Get current funder data
    const { data: currentFunder, error: fetchError } = await supabase
        .from('funders')
        .select('*')
        .eq('id', funderId)
        .single();
    
    if (fetchError || !currentFunder) {
        console.error('  -> Error fetching current funder data:', fetchError);
        return funderId;
    }
    
    // Prepare updates - only update fields that are null/empty or if new data is more robust
    const updates = {
        last_updated: new Date().toISOString()
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
    if (newFunderInfo.description && isMoreRobust(currentFunder.description, newFunderInfo.description)) {
        updates.description = newFunderInfo.description;
        console.log(`     -> Updating description (${currentFunder.description?.length || 0} → ${newFunderInfo.description.length} chars)`);
    }
    
    // Update website if missing or new URL is validated
    if (newFunderInfo.website && (!currentFunder.website || newFunderInfo.website !== currentFunder.website)) {
        if (await validateWebsiteUrl(newFunderInfo.website)) {
            updates.website = newFunderInfo.website;
            console.log(`     -> Updating website: ${newFunderInfo.website}`);
        }
    }
    
    // Update logo_url if missing or new URL is validated
    if (newFunderInfo.logo_url && (!currentFunder.logo_url || newFunderInfo.logo_url !== currentFunder.logo_url)) {
        if (await validateImageUrl(newFunderInfo.logo_url)) {
            updates.logo_url = newFunderInfo.logo_url;
            console.log(`     -> Updating logo URL: ${newFunderInfo.logo_url}`);
        }
    }
    
    // Update location if missing
    if (newFunderInfo.location && !currentFunder.location) {
        updates.location = newFunderInfo.location;
        console.log(`     -> Adding location: ${newFunderInfo.location}`);
    }
    
    // Update funding amounts if missing or more specific
    if (newFunderInfo.total_funding_annually && isMoreRobust(currentFunder.total_funding_annually, newFunderInfo.total_funding_annually)) {
        updates.total_funding_annually = newFunderInfo.total_funding_annually;
        console.log(`     -> Updating annual funding: ${newFunderInfo.total_funding_annually}`);
    }
    
    if (newFunderInfo.average_grant_size && isMoreRobust(currentFunder.average_grant_size, newFunderInfo.average_grant_size)) {
        updates.average_grant_size = newFunderInfo.average_grant_size;
        console.log(`     -> Updating average grant size: ${newFunderInfo.average_grant_size}`);
    }
    
    // Update application process if missing or more detailed
    if (newFunderInfo.application_process_summary && isMoreRobust(currentFunder.application_process_summary, newFunderInfo.application_process_summary)) {
        updates.application_process_summary = newFunderInfo.application_process_summary;
        console.log(`     -> Updating application process summary`);
    }
    
    // Update notable grant if missing or more detailed
    if (newFunderInfo.notable_grant && isMoreRobust(currentFunder.notable_grant, newFunderInfo.notable_grant)) {
        updates.notable_grant = newFunderInfo.notable_grant;
        console.log(`     -> Updating notable grant information`);
    }
    
    // Update arrays (grant_types, key_personnel, past_grantees) if new data has more items
    if (newFunderInfo.grant_types && Array.isArray(newFunderInfo.grant_types) && 
        (!currentFunder.grant_types || newFunderInfo.grant_types.length > currentFunder.grant_types.length)) {
        updates.grant_types = newFunderInfo.grant_types;
        console.log(`     -> Updating grant types (${currentFunder.grant_types?.length || 0} → ${newFunderInfo.grant_types.length} items)`);
    }
    
    if (newFunderInfo.key_personnel && Array.isArray(newFunderInfo.key_personnel) && 
        (!currentFunder.key_personnel || newFunderInfo.key_personnel.length > currentFunder.key_personnel.length)) {
        updates.key_personnel = newFunderInfo.key_personnel;
        console.log(`     -> Updating key personnel (${currentFunder.key_personnel?.length || 0} → ${newFunderInfo.key_personnel.length} items)`);
    }
    
    if (newFunderInfo.past_grantees && Array.isArray(newFunderInfo.past_grantees) && 
        (!currentFunder.past_grantees || newFunderInfo.past_grantees.length > currentFunder.past_grantees.length)) {
        updates.past_grantees = newFunderInfo.past_grantees;
        console.log(`     -> Updating past grantees (${currentFunder.past_grantees?.length || 0} → ${newFunderInfo.past_grantees.length} items)`);
    }
    
    // Only update if there are actual changes beyond last_updated
    const hasUpdates = Object.keys(updates).length > 1;
    
    if (hasUpdates) {
        const { error: updateError } = await supabase
            .from('funders')
            .update(updates)
            .eq('id', funderId);
        
        if (updateError) {
            console.error('  -> ❗ Error updating funder data:', updateError);
        } else {
            console.log(`  -> ✅ Successfully updated funder with ${Object.keys(updates).length - 1} new data points`);
        }
        
        // Update categories if new focus areas found
        if (newFunderInfo.focus_areas && Array.isArray(newFunderInfo.focus_areas) && newFunderInfo.focus_areas.length > 0) {
            const { data: existingCategories } = await supabase
                .from('funder_categories')
                .select('category_id, categories(name)')
                .eq('funder_id', funderId);
            
            const existingCategoryNames = new Set(
                existingCategories?.map(fc => fc.categories?.name).filter(Boolean) || []
            );
            
            const newCategories = newFunderInfo.focus_areas.filter(area => !existingCategoryNames.has(area));
            
            if (newCategories.length > 0) {
                console.log(`     -> Adding ${newCategories.length} new focus areas: ${newCategories.join(', ')}`);
                await linkFunderToCategories(funderId, newCategories);
            }
        }
        
        // Update geographic scope if new locations found
        if (newFunderInfo.geographic_scope && Array.isArray(newFunderInfo.geographic_scope) && newFunderInfo.geographic_scope.length > 0) {
            const { data: existingLocations } = await supabase
                .from('funder_funding_locations')
                .select('location_id, locations(name)')
                .eq('funder_id', funderId);
            
            const existingLocationNames = new Set(
                existingLocations?.map(fl => fl.locations?.name).filter(Boolean) || []
            );
            
            // Handle "All Bay Area Counties" expansion
            let locationsToCheck = newFunderInfo.geographic_scope;
            if (locationsToCheck.includes('All Bay Area Counties')) {
                locationsToCheck = ['Alameda County', 'Contra Costa County', 'Marin County', 'Napa County', 'San Francisco County', 'San Mateo County', 'Santa Clara County', 'Solano County', 'Sonoma County'];
            }
            
            const newLocations = locationsToCheck.filter(loc => !existingLocationNames.has(loc));
            
            if (newLocations.length > 0) {
                console.log(`     -> Adding ${newLocations.length} new funding locations: ${newLocations.join(', ')}`);
                await linkFunderToLocations(funderId, newLocations);
            }
        }
    } else {
        console.log(`  -> ℹ️ No significant updates found for existing funder data`);
    }
    
    return funderId;
}

async function getOrCreateFunder(funderInfo, primaryUrl) {
    if (!funderInfo || !funderInfo.name) {
        console.error('  -> ‼️ Funder name could not be extracted. Cannot proceed.');
        return null;
    }
    
    // Sanitize the funder data using the same function as seed_funders.js
    const sanitizedFunderInfo = sanitizeFunderData(funderInfo);
    const { name, ...otherFunderDetails } = sanitizedFunderInfo;

    // First check for exact match
    const { data: exactMatch } = await supabase.from('funders').select('id').eq('name', name).single();
    if (exactMatch) {
        console.log(`  -> ✅ Funder "${name}" already exists with ID: ${exactMatch.id}. Checking for updates...`);
        return await updateExistingFunderData(exactMatch.id, sanitizedFunderInfo, primaryUrl);
    }
    
    // Check for similar funders to avoid duplicates
    const similarFunder = await findSimilarFunder(name, primaryUrl);
    if (similarFunder) {
        console.log(`  -> ✅ Using existing similar funder "${similarFunder.name}" (ID: ${similarFunder.id}) instead of creating "${name}". Checking for updates...`);
        return await updateExistingFunderData(similarFunder.id, sanitizedFunderInfo, primaryUrl);
    }

    console.log(`  -> Creating new funder: "${name}"`);
    
    // Validate URLs before inserting
    if (otherFunderDetails.website) {
        if (!await validateWebsiteUrl(otherFunderDetails.website)) {
            console.log(`     -> Invalid website URL, setting to null: ${otherFunderDetails.website}`);
            otherFunderDetails.website = null;
        }
    }
    
    if (otherFunderDetails.logo_url) {
        if (!await validateImageUrl(otherFunderDetails.logo_url)) {
            console.log(`     -> Invalid logo URL, setting to null: ${otherFunderDetails.logo_url}`);
            otherFunderDetails.logo_url = null;
        }
    }
    
    const funderTypeId = await getOrCreateFunderType(otherFunderDetails.funder_type);

    // Generate slug for the new funder
    const funderSlug = generateSlug(name);
    console.log(`     -> Generated slug: "${funderSlug}"`);

    const funderToInsert = {
        name,
        slug: funderSlug,
        website: otherFunderDetails.website || primaryUrl,
        last_updated: new Date().toISOString(),
        funder_type_id: funderTypeId,
        description: otherFunderDetails.description || null,
        location: otherFunderDetails.location || null,
        grant_types: otherFunderDetails.grant_types || [],
        total_funding_annually: otherFunderDetails.total_funding_annually || null,
        average_grant_size: otherFunderDetails.average_grant_size || null,
        key_personnel: otherFunderDetails.key_personnel || [],
        application_process_summary: otherFunderDetails.application_process_summary || null,
        past_grantees: otherFunderDetails.past_grantees || [],
        notable_grant: otherFunderDetails.notable_grant || null,
        logo_url: otherFunderDetails.logo_url || null
    };

    const { data: newFunder, error: insertError } = await supabase
        .from('funders')
        .insert(funderToInsert)
        .select('id')
        .single();
    
    if (insertError) {
        console.error(`  -> ‼️ Error creating funder "${name}":`, insertError);
        return null;
    }
    
    const funderId = newFunder.id;
    console.log(`  -> ✅ Created new funder: "${name}" (ID: ${funderId})`);
    
    // Link to categories and locations using the enhanced functions
    await linkFunderToCategories(funderId, otherFunderDetails.focus_areas);
    await linkFunderToLocations(funderId, otherFunderDetails.geographic_scope);
    
    return funderId;
}

function normalizeGrantTitle(title) {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/\s+(grant|program|fund|award|initiative|opportunity)$/i, '') // Remove common grant suffixes
        .replace(/\s+(application|apply|funding)$/i, '') // Remove application-related terms
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

function calculateGrantSimilarity(title1, title2) {
    const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const s1 = normalize(title1);
    const s2 = normalize(title2);
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

async function findSimilarGrant(grantInfo, funderId) {
    const { data: existingGrants, error } = await supabase
        .from('grants')
        .select('id, title, description, max_funding_amount, deadline')
        .eq('funder_id', funderId);
    
    if (error || !existingGrants) {
        console.error('Error fetching existing grants for similarity check:', error);
        return null;
    }
    
    const normalizedInputTitle = normalizeGrantTitle(grantInfo.title);
    
    for (const grant of existingGrants) {
        const normalizedExistingTitle = normalizeGrantTitle(grant.title);
        const titleSimilarity = calculateGrantSimilarity(normalizedInputTitle, normalizedExistingTitle);
        
        // If title similarity is 90% or higher, consider it a potential match
        if (titleSimilarity >= 0.90) {
            console.log(`  -> 🔍 Found similar grant: "${grantInfo.title}" matches "${grant.title}" (${(titleSimilarity * 100).toFixed(1)}% similar)`);
            return grant;
        }
        
        // Also check for exact funding amount matches combined with moderate title similarity
        if (titleSimilarity >= 0.75 && 
            grantInfo.funding_amount && 
            grant.max_funding_amount && 
            grantInfo.funding_amount === grant.max_funding_amount) {
            console.log(`  -> 🔍 Found grant with matching funding amount and similar title: "${grantInfo.title}" matches "${grant.title}"`);
            return grant;
        }
    }
    
    return null;
}

async function updateExistingGrantData(grantId, newGrantInfo, primaryUrl) {
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
    if (newGrantInfo.funding_amount && !currentGrant.max_funding_amount) {
        updates.max_funding_amount = newGrantInfo.funding_amount;
        updates.funding_amount_text = newGrantInfo.funding_amount_text || `${newGrantInfo.funding_amount.toLocaleString()}`;
        console.log(`     -> Adding funding amount: ${newGrantInfo.funding_amount.toLocaleString()}`);
    }
    
    // Update deadline if missing or more recent
    if (newGrantInfo.deadline && (!currentGrant.deadline || new Date(newGrantInfo.deadline) > new Date(currentGrant.deadline))) {
        updates.deadline = newGrantInfo.deadline;
        console.log(`     -> Updating deadline: ${newGrantInfo.deadline}`);
    }
    
    // Update application URL if missing or different
    if (newGrantInfo.application_url && (!currentGrant.application_url || newGrantInfo.application_url !== currentGrant.application_url)) {
        updates.application_url = newGrantInfo.application_url;
        console.log(`     -> Updating application URL: ${newGrantInfo.application_url}`);
    }
    
    // Update eligibility criteria if more detailed
    if (newGrantInfo.eligibility_criteria && isMoreRobust(currentGrant.eligibility_criteria, newGrantInfo.eligibility_criteria)) {
        updates.eligibility_criteria = newGrantInfo.eligibility_criteria;
        console.log(`     -> Updating eligibility criteria`);
    }
    
    // Update grant type if missing
    if (newGrantInfo.grant_type && !currentGrant.grant_type) {
        updates.grant_type = newGrantInfo.grant_type;
        console.log(`     -> Adding grant type: ${newGrantInfo.grant_type}`);
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
            const { data: existingCategories } = await supabase
                .from('grant_categories')
                .select('category_id, categories(name)')
                .eq('grant_id', grantId);
            
            const existingCategoryNames = new Set(
                existingCategories?.map(gc => gc.categories?.name).filter(Boolean) || []
            );
            
            const newCategories = newGrantInfo.categories.filter(cat => !existingCategoryNames.has(cat));
            
            if (newCategories.length > 0) {
                console.log(`     -> Adding ${newCategories.length} new grant categories: ${newCategories.join(', ')}`);
                for (const categoryName of newCategories) {
                    const categoryId = await getOrCreateCategory(categoryName);
                    if (categoryId) {
                        await supabase.from('grant_categories').insert({ grant_id: grantId, category_id: categoryId });
                    }
                }
            }
        }
        
        // Update locations if new ones found
        if (newGrantInfo.locations && Array.isArray(newGrantInfo.locations) && newGrantInfo.locations.length > 0) {
            const { data: existingLocations } = await supabase
                .from('grant_locations')
                .select('location_id, locations(name)')
                .eq('grant_id', grantId);
            
            const existingLocationNames = new Set(
                existingLocations?.map(gl => gl.locations?.name).filter(Boolean) || []
            );
            
            const newLocations = newGrantInfo.locations.filter(loc => !existingLocationNames.has(loc));
            
            if (newLocations.length > 0) {
                console.log(`     -> Adding ${newLocations.length} new grant locations: ${newLocations.join(', ')}`);
                for (const locationName of newLocations) {
                    const locationId = await getOrCreateLocation(locationName);
                    if (locationId) {
                        await supabase.from('grant_locations').insert({ grant_id: grantId, location_id: locationId });
                    }
                }
            }
        }
    } else {
        console.log(`  -> ℹ️ No significant updates found for existing grant data`);
    }
    
    return grantId;
}

async function saveGrantsToSupabase(grants, primaryUrl, funderId) {
    if (!grants || grants.length === 0 || !funderId) {
        console.log('  -> No grants to save or funderId missing.');
        return;
    }

    for (const grant of grants) {
        try {
            // Check if similar grant already exists for this funder
            const existingGrant = await findSimilarGrant(grant, funderId);
            
            if (existingGrant) {
                console.log(`  -> ⚡ Found existing similar grant "${existingGrant.title}" (ID: ${existingGrant.id}). Updating instead of creating new one.`);
                await updateExistingGrantData(existingGrant.id, grant, primaryUrl);
                continue;
            }
            
            // Create new grant if no similar one found
            const { data: insertResult, error } = await supabase.rpc('insert_grant_directly', {
                p_funder_id: funderId,
                p_title: grant.title,
                p_description: grant.description,
                p_status: 'Open',
                p_application_url: grant.application_url || primaryUrl,
                p_max_funding_amount: grant.funding_amount || null,
                p_funding_amount_text: grant.funding_amount_text || (grant.funding_amount ? `${grant.funding_amount.toLocaleString()}` : null),
                p_deadline: grant.deadline || null,
                p_eligibility_criteria: grant.eligibility_criteria || null,
                p_grant_type: grant.grant_type || null,
                p_slug: generateSlug(grant.title)
            });

            if (error) {
                console.error(`  -> ‼️ Error inserting grant "${grant.title}":`, error.message);
                continue;
            }

            const insertedGrant = Array.isArray(insertResult) ? insertResult[0] : insertResult;
            const grantId = insertedGrant?.id || 'ID not returned';
            console.log(`  -> ✅ Successfully inserted grant: "${grant.title}" (ID: ${grantId})`);

            if (grant.categories && Array.isArray(grant.categories) && insertedGrant?.id) {
                for (const categoryName of grant.categories) {
                    const categoryId = await getOrCreateCategory(categoryName);
                    if (categoryId) {
                        await supabase.from('grant_categories').insert({ grant_id: insertedGrant.id, category_id: categoryId });
                    }
                }
            }

            if (grant.locations && Array.isArray(grant.locations) && insertedGrant?.id) {
                for (const locationName of grant.locations) {
                    const locationId = await getOrCreateLocation(locationName);
                    if (locationId) {
                        await supabase.from('grant_locations').insert({ grant_id: insertedGrant.id, location_id: locationId });
                    }
                }
            }

        } catch (err) {
            console.error(`  -> ‼️ Error processing grant "${grant.title}":`, err.message);
        }
    }
}

async function main() {
  console.log('--- Starting Enhanced Grant Importer ---');
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
    // Add extra time for slow government sites
    timeout: 60000
  });

  for (const url of urlsToProcess) {
    console.log(`\n  -> Processing: ${url}`);
    try {
        // Step 1: Discover up to 7 pages from the website
        const urlsToScrape = await discoverSitePages(url, context);
        
        // Step 2: If discovery didn't work, fall back to sitemap approach
        if (urlsToScrape.length === 1) {
            console.log('  -> Page discovery found limited pages, trying sitemap approach...');
            const sitemapUrls = await getSitemapUrls(url);
            if (sitemapUrls.length > 0) {
                const grantRelatedUrls = sitemapUrls.filter(u => u.includes('grant') || u.includes('fund') || u.includes('apply'));
                if (grantRelatedUrls.length > 0) {
                  urlsToScrape.push(...grantRelatedUrls.slice(0, 6)); // Add up to 6 more to reach 7 total
                }
            }
        }

        const combinedTextForDomain = await crawlDomainAndGetContent(urlsToScrape, context);

        if (combinedTextForDomain.length > 100) {
            console.log('  -> Extracting grant and funder info from combined text...');
            const [grants, funder] = await Promise.all([
                extractGrantInfo(combinedTextForDomain),
                extractFunderInfo(combinedTextForDomain)
            ]);

            await sleep(1000);
            console.log(`  -> Found ${grants.length} grants and funder: ${funder ? funder.name : 'Not found'}`);
            
            const funderId = await getOrCreateFunder(funder, url);
            
            if (funderId) {
              await saveGrantsToSupabase(grants, url, funderId);
            }
            
            processedUrlsMap.set(url, now.toISOString());
        } else {
            console.log(`  -> ⚠️ Insufficient content extracted (${combinedTextForDomain.length} chars). Skipping AI analysis.`);
            console.log(`  -> This may be due to the site requiring authentication, having anti-bot protection, or being JavaScript-heavy.`);
            // Still mark as processed to avoid infinite retries
            processedUrlsMap.set(url, now.toISOString());
        }
    } catch (err) {
        console.error(`  -> ‼️  Critical error processing ${url}:`, err.message);
    }
    await sleep(2000);
  }
  await browser.close();
  writeProcessedUrls(processedUrlsMap);
  console.log('\n--- Enhanced Importer Finished ---');
}

main().catch(console.error);