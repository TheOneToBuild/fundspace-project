// importer/seed_nonprofits.js
const path = require('path');
const axios = require('axios');
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
    IMAGE_VALIDATION_TIMEOUT: 5000,
    RATE_LIMIT_DELAY: 1000, // Delay between AI calls
    MAX_DESCRIPTION_LENGTH: 2000,
    MIN_DESCRIPTION_LENGTH: 100,
};

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        .substring(0, 100); // Limit slug length
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

async function validateImageUrl(url) {
    if (!url) return false;
    
    // Basic URL validation
    try {
        new URL(url);
    } catch {
        return false;
    }
    
    // Check if URL ends with common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    
    try {
        const response = await axios.head(url, { 
            timeout: CONFIG.IMAGE_VALIDATION_TIMEOUT,
            validateStatus: status => status < 400,
            maxRedirects: 5
        });
        const contentType = response.headers['content-type'];
        return (response.status >= 200 && response.status < 300) && 
               (contentType?.startsWith('image/') || hasImageExtension);
    } catch (error) {
        return false;
    }
}

async function findNonprofitImage(nonprofitName, website, focusAreas = []) {
    console.log(`     -> Searching for image for "${nonprofitName}"...`);
    
    // Skip logo search entirely - go straight to thematic images
    return null;
}

async function findThematicImage(nonprofitName, focusAreas, description) {
    console.log(`     -> Getting thematic image for "${nonprofitName}"...`);
    
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    
    // Map focus areas to search queries
    const searchQueryMap = {
        'Education': 'education classroom teaching students',
        'Youth Development': 'youth mentoring children activities',
        'Environmental Conservation': 'nature conservation forest environment',
        'Environmental Protection': 'environmental protection sustainability',
        'Healthcare': 'healthcare medical doctors hospital',
        'Public Health': 'public health community wellness',
        'Housing': 'affordable housing homes community',
        'Homelessness': 'helping homeless shelter support',
        'Social Services': 'community volunteers helping people',
        'LGBTQ Rights': 'diversity inclusion pride community',
        'Senior Services': 'elderly care seniors assistance',
        'Arts': 'arts gallery creative culture',
        'Music Education': 'music education instruments learning',
        'Food Security': 'food bank community meal donation',
        'Poverty Alleviation': 'community support helping hands',
        'Poverty Reduction': 'community assistance volunteers',
        'Legal Aid': 'law justice legal courthouse',
        'Civil Rights': 'civil rights activism justice',
        'Social Justice': 'social justice equality activism',
        'Immigration': 'diverse community multicultural',
        'Immigrant Services': 'immigrant support community services',
        'Air Quality': 'clean air blue sky environment',
        'Environmental Advocacy': 'environmental activism nature',
        'Sustainability': 'sustainable green renewable energy',
        'Urban Forestry': 'urban trees city nature',
        'Community Development': 'community development volunteers',
        'Financial Literacy': 'finance education money learning',
        'Job Training': 'job training workshop learning',
        'Family Services': 'family support together community',
        'Family Support': 'family care support services',
        'Women\'s Services': 'women empowerment support community',
        'Technology': 'technology computers digital education',
        'Digital Equity': 'computer access technology education',
        'Basic Needs': 'community support essential services',
        'Homeownership': 'home ownership housing community',
        'Volunteerism': 'volunteers helping community service',
        'Health Equity': 'healthcare access community health',
        'Preventive Care': 'preventive healthcare wellness',
        'Community Health': 'community health clinic medical'
    };
    
    // Determine search query
    let searchQuery = 'nonprofit community volunteers';
    
    // Try to match focus areas first
    if (focusAreas && focusAreas.length > 0) {
        for (const area of focusAreas) {
            if (searchQueryMap[area]) {
                searchQuery = searchQueryMap[area];
                console.log(`     -> Matched focus area: ${area}`);
                break;
            }
        }
    }
    
    // If no focus area match, analyze nonprofit name
    if (searchQuery === 'nonprofit community volunteers') {
        const nameKeywords = {
            'education': 'education classroom teaching',
            'school': 'school education students',
            'computer': 'technology computers education',
            'technology': 'technology digital innovation',
            'health': 'healthcare medical hospital',
            'medical': 'medical healthcare doctors',
            'law': 'law legal justice',
            'legal': 'legal aid justice',
            'environment': 'environment nature conservation',
            'housing': 'housing homes community',
            'homeless': 'homeless shelter support',
            'food': 'food bank donation community',
            'youth': 'youth children activities',
            'children': 'children kids education',
            'senior': 'senior elderly care',
            'elderly': 'elderly seniors assistance',
            'music': 'music education performance',
            'art': 'art creative culture',
            'family': 'family support community',
            'church': 'community faith gathering',
            'memorial': 'memorial community gathering'
        };
        
        const lowerName = nonprofitName.toLowerCase();
        for (const [keyword, query] of Object.entries(nameKeywords)) {
            if (lowerName.includes(keyword)) {
                searchQuery = query;
                console.log(`     -> Matched keyword in name: ${keyword}`);
                break;
            }
        }
    }
    
    try {
        // Call Pexels API
        const response = await axios.get('https://api.pexels.com/v1/search', {
            headers: {
                'Authorization': PEXELS_API_KEY
            },
            params: {
                query: searchQuery,
                per_page: 10,
                orientation: 'landscape',
                size: 'large'
            },
            timeout: 5000
        });
        
        if (response.data && response.data.photos && response.data.photos.length > 0) {
            // Get a random photo from the first 5 results for variety
            const photoIndex = Math.floor(Math.random() * Math.min(5, response.data.photos.length));
            const photo = response.data.photos[photoIndex];
            
            // Use the large2x size for high quality
            const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;
            
            console.log(`     -> Found Pexels image: "${photo.alt}" by ${photo.photographer}`);
            return imageUrl;
        }
    } catch (error) {
        console.error(`     -> Error fetching from Pexels: ${error.message}`);
    }
    
    // Fallback to Lorem Picsum if Pexels fails
    console.log(`     -> Falling back to Lorem Picsum`);
    const fallbackSeeds = {
        'education': 'education',
        'health': 'healthcare',
        'environment': 'nature',
        'housing': 'architecture',
        'community': 'people'
    };
    
    let seed = 'nonprofit';
    for (const [key, value] of Object.entries(fallbackSeeds)) {
        if (searchQuery.includes(key)) {
            seed = value;
            break;
        }
    }
    
    return `https://picsum.photos/seed/${seed}/1600/900`;
}

async function scrapeLogoFromWebsite(website) {
    if (!website) return null;
    
    try {
        console.log(`     -> Attempting to scrape logo from ${website}`);
        
        const response = await axios.get(website, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NonprofitBot/1.0)'
            }
        });
        
        const html = response.data;
        
        // Look for common logo patterns in HTML
        const logoPatterns = [
            /<img[^>]+class="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
            /<img[^>]+id="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
            /<img[^>]+alt="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
            /<link[^>]+rel="icon"[^>]+href="([^"]+)"/i,
            /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i
        ];
        
        for (const pattern of logoPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                const imageUrl = new URL(match[1], website).href;
                if (await validateImageUrl(imageUrl)) {
                    return imageUrl;
                }
            }
        }
    } catch (error) {
        console.log(`     -> Failed to scrape website: ${error.message}`);
    }
    
    return null;
}

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
            .insert({ 
                name: normalizedName
            })
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

async function linkNonprofitToCategories(nonprofitId, focusAreas) {
    if (!nonprofitId || !focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) return;
    
    const validCategories = focusAreas.filter(cat => cat && typeof cat === 'string');
    if (validCategories.length === 0) return;
    
    console.log(`     -> Linking nonprofit to categories: ${validCategories.join(', ')}`);
    
    for (const categoryName of validCategories) {
        try {
            const categoryId = await getOrCreateCategory(categoryName.trim());
            if (categoryId) {
                // Check if link already exists
                const { data: existing } = await supabase
                    .from('nonprofit_categories')
                    .select('id')
                    .eq('nonprofit_id', nonprofitId)
                    .eq('category_id', categoryId)
                    .single();
                
                if (!existing) {
                    await supabase
                        .from('nonprofit_categories')
                        .insert({ 
                            nonprofit_id: nonprofitId, 
                            category_id: categoryId 
                        });
                }
            }
        } catch (error) {
            console.error(`     -> Error linking category "${categoryName}":`, error.message);
        }
    }
}

function validateNonprofitData(data) {
    const errors = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required');
    }
    
    if (data.description) {
        if (data.description.length < CONFIG.MIN_DESCRIPTION_LENGTH) {
            errors.push(`Description too short (min ${CONFIG.MIN_DESCRIPTION_LENGTH} chars)`);
        }
        if (data.description.length > CONFIG.MAX_DESCRIPTION_LENGTH) {
            data.description = data.description.substring(0, CONFIG.MAX_DESCRIPTION_LENGTH) + '...';
        }
    }
    
    if (data.notable_programs && Array.isArray(data.notable_programs)) {
        // Validate each program is a string and filter out any invalid entries
        data.notable_programs = data.notable_programs.filter(program => 
            program && typeof program === 'string' && program.trim().length > 0
        );
        // Limit to 10 programs max
        if (data.notable_programs.length > 10) {
            data.notable_programs = data.notable_programs.slice(0, 10);
        }
    }
    
    if (data.website && !isValidUrl(data.website)) {
        errors.push('Invalid website URL');
        data.website = null;
    }
    
    if (data.contact_email && !isValidEmail(data.contact_email)) {
        errors.push('Invalid email address');
        data.contact_email = null;
    }
    
    if (data.year_founded) {
        const year = parseInt(data.year_founded);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear) {
            errors.push('Invalid founding year');
            data.year_founded = null;
        }
    }
    
    if (data.staff_count && (isNaN(parseInt(data.staff_count)) || data.staff_count < 0)) {
        errors.push('Invalid staff count');
        data.staff_count = null;
    }

    if (data.ein) {
        const einRegex = /^\d{2}-?\d{7}$/; // Allows for XX-XXXXXXX or XXXXXXXXX
        if (!einRegex.test(data.ein)) {
            errors.push('Invalid EIN format');
            data.ein = null;
        }
    }
    
    return { isValid: errors.length === 0, errors, data };
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

async function discoverImagesForNonprofits(nonprofits) {
    console.log("\n  -> Running dedicated image discovery for nonprofits...");
    
    const imageDiscoveryPrompt = `
        For each of these nonprofit organizations, find their official logo or a representative image.
        Search their websites, social media, or news articles for images.
        
        Organizations:
        ${nonprofits.map((np, i) => `${i + 1}. ${np.name} ${np.website ? `(${np.website})` : ''}`).join('\n')}
        
        Return a JSON object where keys are organization names and values are direct image URLs.
        Example: {"Organization Name": "https://example.org/logo.png"}
        
        IMPORTANT:
        - Only include entries where you found a valid image URL
        - URLs must be direct links to image files (.jpg, .png, .svg, etc.)
        - Common locations: /logo.png, /images/logo.jpg, /wp-content/uploads/logo.png
        - If you can't find an image, don't include that organization in the response
    `;
    
    try {
        await sleep(CONFIG.RATE_LIMIT_DELAY);
        const imageMap = await generateAIContent(imageDiscoveryPrompt);
        return imageMap;
    } catch (error) {
        console.error("     -> Error in image discovery:", error);
        return {};
    }
}

async function seedNonprofits(options = {}) {
    const { 
        batchSize = CONFIG.BATCH_SIZE, 
        categories = null,
        dryRun = false 
    } = options;
    
    console.log('--- Starting Nonprofit Discovery Script ---');
    console.log(`  -> Configuration: Batch size: ${batchSize}, Dry run: ${dryRun}`);
    
    if (categories) {
        console.log(`  -> Focusing on categories: ${categories.join(', ')}`);
    }

    console.log('  -> Checking database for existing nonprofits...');
    const { data: existingNonprofits, error: fetchError } = await supabase
        .from('nonprofits')
        .select('name, slug, ein');
        
    if (fetchError) {
        console.error("  -> ‼️ Error fetching existing nonprofits:", fetchError);
        return;
    }
    
    const existingNames = new Set(existingNonprofits?.map(f => f.name.toLowerCase()) || []);
    const existingSlugs = new Set(existingNonprofits?.map(f => f.slug) || []);
    const existingEins = new Set(existingNonprofits?.map(f => f.ein).filter(Boolean) || []);
    console.log(`  -> Found ${existingNames.size} nonprofits in the database to exclude.`);

    let nonprofitNamesToSeed = [];
    try {
        console.log(`  -> Asking AI to discover ${batchSize} new nonprofits in the SF Bay Area...`);
        
        const categoryClause = categories 
            ? `Focus specifically on nonprofits working in these areas: ${categories.join(', ')}.`
            : 'Include a diverse mix across different sectors like education, health, environment, arts, social services, etc.';
        
        const discoveryPrompt = `
            List the names of ${batchSize} unique nonprofit organizations based in the San Francisco Bay Area, California.
            ${categoryClause}
            
            CRITICAL RULES:
            1. Do NOT include any organization whose name appears in this list (case-insensitive):
               ${Array.from(existingNames).slice(0, 100).join(', ')}
            2. Include both well-known and lesser-known organizations
            3. ONLY include organizations physically located in these 9 Bay Area counties:
               - San Francisco County
               - Alameda County (Oakland, Berkeley)
               - Contra Costa County
               - Marin County
               - San Mateo County
               - Santa Clara County (San Jose)
               - Solano County
               - Napa County
               - Sonoma County
            4. Do NOT include organizations from other locations like New York, Los Angeles, etc.
            5. DO NOT include foundations, grantmakers, or funders (e.g., no "Foundation", "Fund", "Trust", "Endowment")
            6. Focus on direct service nonprofits that provide programs and services to the community
            7. Return ONLY a valid JSON array of strings (organization names)
        `;
        
        await sleep(CONFIG.RATE_LIMIT_DELAY);
        nonprofitNamesToSeed = await generateAIContent(discoveryPrompt);
        
        nonprofitNamesToSeed = nonprofitNamesToSeed.filter(name => {
            const lowerName = name.toLowerCase();
            // Filter out foundations and funders
            const excludeKeywords = ['foundation', 'fund', 'trust', 'endowment', 'grantmaker', 'philanthrop'];
            const isExcluded = excludeKeywords.some(keyword => lowerName.includes(keyword));
            
            if (isExcluded) {
                console.log(`  -> Excluding "${name}" (appears to be a foundation/funder)`);
                return false;
            }
            
            return !existingNames.has(lowerName) && !existingSlugs.has(generateSlug(name));
        });
        
        console.log(`  -> AI discovered ${nonprofitNamesToSeed.length} new nonprofits: ${nonprofitNamesToSeed.join(', ')}`);
    } catch (error) {
        console.error("  -> ‼️ Error discovering nonprofit names:", error);
        return;
    }
    
    if (!nonprofitNamesToSeed || nonprofitNamesToSeed.length === 0) {
        console.log("  -> No new nonprofits to process.");
        return;
    }

    const enrichmentPrompt = `
        Provide detailed, factual information about these San Francisco Bay Area nonprofit organizations.
        
        Organizations to research:
        ${nonprofitNamesToSeed.map((name, i) => `${i + 1}. ${name}`).join('\n')}
        
        Return a JSON array with one object per organization containing these fields:
        - "name": Official organization name (string, required)
        - "ein": The 9-digit Employer Identification Number, formatted XX-XXXXXXX (string or null)
        - "tagline": Brief mission statement, max 100 chars (string or null)
        - "description": REQUIRED - Detailed 2-3 paragraph description (minimum 100 characters) of their work, programs, and impact. This field is MANDATORY - if you cannot find information about an organization, do not include it in the results.
        - "notable_programs": Array of 3-5 specific programs or services the nonprofit offers. Each should be a brief description (e.g., ["After-school tutoring for K-12 students", "Free weekend coding bootcamps", "College prep workshops"]) (array or null)
        - "website": Official website URL starting with https:// (string or null)
        - "image_url": Try to find ONE of these in order of preference:
            1. Direct URL to their official logo (usually ends in .png, .jpg, .svg)
            2. URL to a photo of their building or team
            3. URL to an image representing their work
            4. Set to null if no image can be found
          The URL must be a direct link to an image file (string or null)
        - "location": REQUIRED - Must be a city within one of these 9 Bay Area counties ONLY:
            San Francisco, Alameda (Oakland, Berkeley, etc.), Contra Costa, Marin, 
            San Mateo, Santa Clara (San Jose, etc.), Solano, Napa, or Sonoma.
            Format: "City, CA" (e.g., "San Francisco, CA", "Oakland, CA", "San Jose, CA")
            DO NOT include organizations from other states or regions.
        - "focus_areas": Array of 2-5 category strings like ["Education", "Youth Development"] (array, required)
        - "budget": Annual budget range, e.g. "$1M - $5M" (string or null)
        - "staff_count": Approximate number of staff (integer or null)
        - "year_founded": Year established (integer or null)
        - "impact_metric": One key impact statistic (string or null)
        - "contact_email": Primary contact email (string or null)
        
        CRITICAL RULES:
        1. Use ONLY factual, verifiable information. Prioritize finding the EIN.
        2. ONLY include organizations where you can provide a meaningful description (minimum 100 characters).
        3. ONLY include organizations physically located in the 9 Bay Area counties listed above.
        4. If an organization is based elsewhere (e.g., New York) but has a Bay Area office, use the Bay Area location.
        5. If you cannot confirm the organization is in the Bay Area, DO NOT include it.
        6. Set any unknown field to null - do not guess or fabricate data.
        7. For image_url, only provide direct links to actual image files (not web pages).
        8. Common logo locations include /logo.png, /images/logo.jpg, /assets/logo.svg
        9. Ensure all URLs are real and properly formatted.
        10. Return ONLY valid JSON - no other text.
    `;

    try {
        console.log("\n  -> Asking AI to gather detailed data for discovered nonprofits...");
        await sleep(CONFIG.RATE_LIMIT_DELAY);
        const nonprofitsToProcess = await generateAIContent(enrichmentPrompt);
        console.log(`  -> AI returned data for ${nonprofitsToProcess.length} nonprofits.`);

        // Optional: Run dedicated image discovery
        const imageMap = await discoverImagesForNonprofits(nonprofitsToProcess);

        const results = { inserted: 0, skipped: 0, errors: 0 };

        for (const nonprofitData of nonprofitsToProcess) {
            console.log(`\n  -> Processing "${nonprofitData.name || 'Unknown'}"...`);
            
            const { isValid, errors, data: validatedData } = validateNonprofitData(nonprofitData);
            if (!isValid) {
                console.log(`     -> Validation errors: ${errors.join(', ')}`);
                if (!validatedData.name) {
                    results.errors++;
                    continue;
                }
            }

            // CRITICAL: Skip nonprofits without descriptions
            if (!validatedData.description || validatedData.description.trim().length < CONFIG.MIN_DESCRIPTION_LENGTH) {
                console.log(`     -> Skipping "${validatedData.name}" - insufficient description`);
                results.skipped++;
                continue;
            }

            // Validate location is in Bay Area
            const bayAreaCities = [
                // San Francisco County
                'san francisco', 'sf',
                // Alameda County
                'oakland', 'berkeley', 'alameda', 'hayward', 'fremont', 'san leandro', 'livermore', 'pleasanton', 'union city', 'dublin', 'newark', 'emeryville', 'albany', 'castro valley', 'san lorenzo',
                // Santa Clara County
                'san jose', 'santa clara', 'sunnyvale', 'mountain view', 'palo alto', 'cupertino', 'milpitas', 'campbell', 'los gatos', 'saratoga', 'los altos', 'gilroy', 'morgan hill', 'stanford',
                // San Mateo County
                'san mateo', 'redwood city', 'daly city', 'south san francisco', 'burlingame', 'menlo park', 'san bruno', 'millbrae', 'foster city', 'belmont', 'san carlos', 'half moon bay', 'pacifica', 'atherton', 'woodside', 'portola valley',
                // Contra Costa County
                'richmond', 'concord', 'walnut creek', 'antioch', 'pittsburg', 'brentwood', 'martinez', 'pleasant hill', 'lafayette', 'orinda', 'moraga', 'san pablo', 'el cerrito', 'hercules', 'pinole', 'clayton', 'danville', 'san ramon',
                // Marin County
                'san rafael', 'novato', 'mill valley', 'sausalito', 'corte madera', 'larkspur', 'tiburon', 'fairfax', 'san anselmo', 'ross', 'kentfield', 'greenbrae', 'belvedere',
                // Solano County
                'vallejo', 'fairfield', 'vacaville', 'suisun city', 'benicia', 'dixon', 'rio vista',
                // Napa County
                'napa', 'american canyon', 'st. helena', 'calistoga', 'yountville',
                // Sonoma County
                'santa rosa', 'petaluma', 'rohnert park', 'windsor', 'healdsburg', 'sonoma', 'sebastopol', 'cotati', 'cloverdale'
            ];
            
            if (validatedData.location) {
                const locationLower = validatedData.location.toLowerCase();
                const isInBayArea = bayAreaCities.some(city => locationLower.includes(city));
                
                if (!isInBayArea && !locationLower.includes(', ca')) {
                    console.log(`     -> Skipping "${validatedData.name}" - location "${validatedData.location}" is not in Bay Area`);
                    results.skipped++;
                    continue;
                }
            } else {
                console.log(`     -> Warning: No location specified for "${validatedData.name}"`);
            }

            // Check if name or EIN already exists
            if (existingEins.has(validatedData.ein)) {
                console.log(`     -> Skipping, EIN ${validatedData.ein} already exists.`);
                results.skipped++;
                continue;
            }
            const { data: existingNonprofit } = await supabase
                .from('nonprofits')
                .select('id')
                .eq('name', validatedData.name)
                .single();
            if (existingNonprofit) {
                console.log(`     -> Already exists in database`);
                results.skipped++;
                continue;
            }

            // Enhanced image handling - ALWAYS provide an image
            let finalImageUrl = null;
            
            // First, check if AI provided a valid image
            if (validatedData.image_url) {
                console.log(`     -> Validating AI-provided image URL...`);
                const isValidImage = await validateImageUrl(validatedData.image_url);
                if (isValidImage) {
                    finalImageUrl = validatedData.image_url;
                } else {
                    console.log(`     -> Invalid image URL from AI`);
                }
            }

            // Check if dedicated image discovery found an image
            if (!finalImageUrl && imageMap[validatedData.name]) {
                console.log(`     -> Trying image from dedicated discovery...`);
                const discoveredImage = imageMap[validatedData.name];
                if (await validateImageUrl(discoveredImage)) {
                    finalImageUrl = discoveredImage;
                }
            }

            // If still no valid image, get a thematic image based on focus areas
            if (!finalImageUrl) {
                console.log(`     -> Getting thematic image for ${validatedData.name}...`);
                finalImageUrl = await findThematicImage(
                    validatedData.name, 
                    validatedData.focus_areas || [], 
                    validatedData.description
                );
            }
            
            // This should always return an image now
            validatedData.image_url = finalImageUrl;
            console.log(`     -> Final image URL: ${validatedData.image_url}`);

            if (dryRun) {
                console.log(`     -> [DRY RUN] Would insert:`, JSON.stringify(validatedData, null, 2));
                results.inserted++;
                continue;
            }

            const { data: newNonprofit, error: insertError } = await supabase
                .from('nonprofits')
                .insert({
                    name: validatedData.name,
                    slug: generateSlug(validatedData.name),
                    ein: validatedData.ein,
                    tagline: validatedData.tagline,
                    description: validatedData.description,
                    notable_programs: validatedData.notable_programs,
                    website: validatedData.website,
                    image_url: validatedData.image_url,
                    location: validatedData.location,
                    budget: validatedData.budget,
                    staff_count: validatedData.staff_count,
                    year_founded: validatedData.year_founded,
                    impact_metric: validatedData.impact_metric,
                    contact_email: validatedData.contact_email,
                    last_updated: new Date().toISOString()
                })
                .select('id')
                .single();

            if (insertError) {
                console.error(`     -> ‼️ Error inserting:`, insertError.message);
                results.errors++;
            } else {
                console.log(`     -> ✅ Successfully inserted (ID: ${newNonprofit.id})`);
                results.inserted++;
                if (validatedData.focus_areas) {
                    await linkNonprofitToCategories(newNonprofit.id, validatedData.focus_areas);
                }
            }
        }
        
        console.log(`\n--- Nonprofit seeding complete ---`);
        console.log(`  -> Inserted: ${results.inserted}`);
        console.log(`  -> Skipped: ${results.skipped}`);
        console.log(`  -> Errors: ${results.errors}`);

    } catch (error) {
        console.error("\n--- ‼️ A critical error occurred during data enrichment ---", error);
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const options = { batchSize: 10, categories: null, dryRun: false };
    
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
            case '--help': case '-h':
                console.log(`
Usage: node seed_nonprofits.js [options]

Options:
  -b, --batch-size <number>    Number of nonprofits to seed (default: 10)
  -c, --categories <list>      Comma-separated list of categories to focus on
  -d, --dry-run                Simulate the process without inserting data
  -h, --help                   Show this help message
                `);
                process.exit(0);
        }
    }
    
    seedNonprofits(options);
}

module.exports = { seedNonprofits };