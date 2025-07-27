// import_grants.js
// V3.0 - Enhanced with intelligent content processing and token optimization

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chromium } = require('playwright');
const axios = require('axios');
const pdf = require('pdf-parse');

// --- ENHANCED CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const CONFIG = {
    MAX_CONTENT_LENGTH: 100000, // Conservative token limit
    CHUNK_OVERLAP: 1000,
    MAX_PAGES_PER_SITE: 6,
    MAX_PDFS_PER_SITE: 3,
    CONTENT_RELEVANCE_THRESHOLD: 0.6,
    BATCH_SIZE: 3,
    REQUEST_DELAY: 1500
};

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// =================================================================
// ENHANCED CONTENT PROCESSING CLASSES
// =================================================================

class IntelligentContentProcessor {
    constructor() {
        this.grantKeywords = [
            'deadline', 'application', 'eligibility', 'funding amount',
            'how to apply', 'requirements', 'criteria', 'rfp', 'proposal',
            'grant program', 'funding opportunity', 'award amount',
            'application process', 'selection criteria', 'due date',
            'submit', 'guidelines', 'priority areas', 'focus areas'
        ];
        
        this.strongGrantIndicators = [
            'request for proposal', 'application guidelines', 'application portal',
            'funding opportunity number', 'submit proposal', 'application deadline',
            'apply online', 'application form', 'grant application', 'rfp',
            'call for proposals', 'funding announcement'
        ];
    }

    extractGrantSections(text) {
        if (!text) return '';
        
        // Split into sections by headers/paragraphs
        const sections = text.split(/\n\s*(?:\n|---|\*\*\*|#{1,3})\s*/);
        
        // Score each section for grant relevance
        const scoredSections = sections.map(section => {
            const lowerSection = section.toLowerCase();
            let score = 0;
            
            // Strong indicators get high scores
            this.strongGrantIndicators.forEach(indicator => {
                if (lowerSection.includes(indicator)) score += 3;
            });
            
            // Regular keywords get medium scores
            this.grantKeywords.forEach(keyword => {
                if (lowerSection.includes(keyword)) score += 1;
            });
            
            // Bonus for sections with dollar amounts
            if (/\$[\d,]+/.test(section)) score += 2;
            
            // Bonus for dates (potential deadlines)
            if (/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b|\b\w+\s+\d{1,2},?\s+\d{4}\b/.test(section)) score += 2;
            
            return { section, score, length: section.length };
        });
        
        // Sort by relevance score
        scoredSections.sort((a, b) => b.score - a.score);
        
        // Take top sections until we hit length limit
        let combinedText = '';
        let totalLength = 0;
        
        for (const scored of scoredSections) {
            if (scored.score > 0 && totalLength + scored.length <= CONFIG.MAX_CONTENT_LENGTH) {
                combinedText += scored.section + '\n\n';
                totalLength += scored.length;
            }
        }
        
        // If no relevant sections found, take beginning of text
        if (combinedText.length < 500) {
            combinedText = text.substring(0, CONFIG.MAX_CONTENT_LENGTH);
        }
        
        return combinedText;
    }

    async assessContentRelevance(content) {
        if (!content || content.length < 200) return 0;
        
        const preview = content.substring(0, 3000);
        
        try {
            const prompt = `Rate the likelihood (0.0-1.0) that this content contains active grant opportunities:
            
Content: ${preview}

Consider:
- Mentions of application deadlines
- Funding amounts
- Application processes
- Eligibility criteria
- Active language like "now accepting" or "apply by"

Return only a number between 0.0 and 1.0.`;
            
            const result = await model.generateContent(prompt);
            const score = parseFloat(result.response.text().trim()) || 0;
            return Math.min(Math.max(score, 0), 1); // Ensure 0-1 range
            
        } catch (error) {
            console.log(`     -> Content relevance check failed: ${error.message}`);
            return 0.5; // Default to neutral if check fails
        }
    }

    createIntelligentChunks(text) {
        if (text.length <= CONFIG.MAX_CONTENT_LENGTH) {
            return [text];
        }
        
        const chunks = [];
        let currentPosition = 0;
        
        while (currentPosition < text.length) {
            let chunkEnd = Math.min(currentPosition + CONFIG.MAX_CONTENT_LENGTH, text.length);
            
            // Try to break at a natural boundary (paragraph, sentence)
            if (chunkEnd < text.length) {
                const lastParagraph = text.lastIndexOf('\n\n', chunkEnd);
                const lastSentence = text.lastIndexOf('.', chunkEnd);
                
                if (lastParagraph > currentPosition + CONFIG.MAX_CONTENT_LENGTH * 0.7) {
                    chunkEnd = lastParagraph;
                } else if (lastSentence > currentPosition + CONFIG.MAX_CONTENT_LENGTH * 0.8) {
                    chunkEnd = lastSentence + 1;
                }
            }
            
            chunks.push(text.substring(currentPosition, chunkEnd));
            currentPosition = chunkEnd - CONFIG.CHUNK_OVERLAP;
            
            if (currentPosition >= text.length) break;
        }
        
        return chunks;
    }

    async processLargeContent(text, sourceUrl) {
        console.log(`     -> Processing content: ${text.length} characters`);
        
        // First, extract only grant-relevant sections
        const relevantContent = this.extractGrantSections(text);
        console.log(`     -> Extracted relevant sections: ${relevantContent.length} characters`);
        
        // Check if content is worth processing
        const relevanceScore = await this.assessContentRelevance(relevantContent);
        console.log(`     -> Content relevance score: ${relevanceScore}`);
        
        if (relevanceScore < CONFIG.CONTENT_RELEVANCE_THRESHOLD) {
            console.log(`     -> Content relevance too low, skipping detailed extraction`);
            return [];
        }
        
        // If still too large after filtering, chunk intelligently
        if (relevantContent.length > CONFIG.MAX_CONTENT_LENGTH) {
            console.log(`     -> Content still large, creating intelligent chunks`);
            const chunks = this.createIntelligentChunks(relevantContent);
            const allGrants = [];
            
            for (let i = 0; i < chunks.length; i++) {
                console.log(`     -> Processing chunk ${i + 1}/${chunks.length}`);
                const chunkGrants = await this.extractFromChunk(chunks[i], sourceUrl);
                allGrants.push(...chunkGrants);
                
                // Small delay between chunks
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Deduplicate across chunks
            return this.deduplicateGrants(allGrants);
        }
        
        // Content is manageable size, process directly
        return await this.extractFromChunk(relevantContent, sourceUrl);
    }

    async extractFromChunk(content, sourceUrl) {
        return await extractGrantInfo(content, sourceUrl);
    }

    deduplicateGrants(grants) {
        const seen = new Set();
        return grants.filter(grant => {
            const key = `${grant.funder_name}-${grant.title}`.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================
const sleep = ms => new Promise(r => setTimeout(r, ms));

function generateSlug(name) {
    if (!name) return null;
    return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/--+/g, '-');
}

function parseFundingAmount(text) {
    if (!text) return null;
    const cleaned = String(text).replace(/[$,]/g, '');
    const numberMatch = cleaned.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[0], 10) : null;
}

// =================================================================
// ENHANCED DATA FETCHING & CRAWLING
// =================================================================
async function getDiscoveredOpportunities() {
    const { data: opportunities, error } = await supabase
        .from('grant_opportunities')
        .select('*')
        .in('status', ['ai_discovered', 'new', 'validated', 'error'])
        .order('created_at', { ascending: false })
        .limit(15); // Increased batch size

    if (error) {
        console.error('❗ Error fetching discovered opportunities:', error);
        return [];
    }
    return opportunities || [];
}

async function crawlAndGetRelevantText(primaryUrl, context) {
    console.log(`  -> Enhanced crawling for: ${primaryUrl}`);
    
    const contentProcessor = new IntelligentContentProcessor();
    const visited = new Set([primaryUrl]);
    let combinedRelevantText = '';
    
    const page = await context.newPage();
    try {
        // Get primary page content
        console.log(`     -> Scraping primary page`);
        await page.goto(primaryUrl, { 
            waitUntil: 'networkidle', 
            timeout: 60000 
        });
        
        const primaryText = await page.evaluate(() => {
            // Remove noise elements for cleaner extraction
            const elementsToRemove = document.querySelectorAll(
                'script, style, nav, footer, header, .cookie-notice, .advertisement, aside'
            );
            elementsToRemove.forEach(el => el.remove());
            
            return document.body.innerText.replace(/\s+/g, ' ').trim();
        });
        
        if (primaryText) {
            // Extract relevant sections from primary page
            const relevantPrimaryContent = contentProcessor.extractGrantSections(primaryText);
            combinedRelevantText += `--- Primary Page: ${primaryUrl} ---\n\n${relevantPrimaryContent}`;
            
            console.log(`     -> Primary page: ${relevantPrimaryContent.length} relevant characters`);
        }

        // Discover high-value links
        const highValueLinks = await discoverHighValueLinks(primaryUrl, page);
        console.log(`     -> Found ${highValueLinks.length} high-value links`);

        // Process additional HTML pages (if primary content is insufficient)
        if (combinedRelevantText.length < 5000 && highValueLinks.html.length > 0) {
            console.log(`     -> Processing additional HTML pages`);
            
            const htmlLinksToProcess = highValueLinks.html.slice(0, CONFIG.MAX_PAGES_PER_SITE);
            for (const link of htmlLinksToProcess) {
                if (visited.has(link)) continue;
                visited.add(link);
                
                console.log(`     -> Scraping HTML: ${link.substring(0, 60)}...`);
                
                try {
                    const subPage = await context.newPage();
                    await subPage.goto(link, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 30000 
                    });
                    
                    const subPageText = await subPage.evaluate(() => {
                        const elementsToRemove = document.querySelectorAll(
                            'script, style, nav, footer, header'
                        );
                        elementsToRemove.forEach(el => el.remove());
                        return document.body.innerText.replace(/\s+/g, ' ').trim();
                    });
                    
                    await subPage.close();
                    
                    if (subPageText) {
                        const relevantSubContent = contentProcessor.extractGrantSections(subPageText);
                        if (relevantSubContent.length > 200) {
                            combinedRelevantText += `\n\n--- HTML Page: ${link} ---\n\n${relevantSubContent}`;
                        }
                    }
                } catch (error) {
                    console.error(`       -> Error scraping ${link}:`, error.message.split('\n')[0]);
                }
                
                await sleep(CONFIG.REQUEST_DELAY);
            }
        }
        
        // Process PDFs
        if (highValueLinks.pdf.length > 0) {
            console.log(`     -> Processing PDF documents`);
            
            const pdfLinksToProcess = highValueLinks.pdf.slice(0, CONFIG.MAX_PDFS_PER_SITE);
            for (const pdfLink of pdfLinksToProcess) {
                if (visited.has(pdfLink)) continue;
                visited.add(pdfLink);
                
                console.log(`     -> Parsing PDF: ${pdfLink.substring(0, 60)}...`);
                
                try {
                    const response = await axios.get(pdfLink, { 
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        maxContentLength: 10 * 1024 * 1024 // 10MB limit
                    });
                    
                    const data = await pdf(response.data);
                    if (data.text) {
                        const relevantPdfContent = contentProcessor.extractGrantSections(data.text);
                        if (relevantPdfContent.length > 200) {
                            combinedRelevantText += `\n\n--- PDF Document: ${pdfLink} ---\n\n${relevantPdfContent}`;
                        }
                    }
                } catch (error) {
                    console.error(`       -> Error processing PDF ${pdfLink}:`, error.message.split('\n')[0]);
                }
                
                await sleep(CONFIG.REQUEST_DELAY);
            }
        }
        
    } catch (error) {
        console.error(`  -> Error during enhanced crawl:`, error.message.split('\n')[0]);
    } finally {
        if (!page.isClosed()) await page.close();
    }
    
    console.log(`  -> Total relevant content extracted: ${combinedRelevantText.length} characters`);
    return combinedRelevantText;
}

async function discoverHighValueLinks(primaryUrl, page) {
    const grantKeywords = [
        'apply', 'application', 'guidelines', 'eligibility', 'criteria', 
        'process', 'faq', 'requirements', 'deadline', 'funding', 'grant', 
        'rfp', 'proposal', 'opportunity', 'program'
    ];
    
    try {
        const links = await page.$eval('a', (anchors) => 
            anchors.map(a => ({
                href: a.href,
                text: a.innerText.trim().toLowerCase(),
                title: a.title ? a.title.toLowerCase() : ''
            }))
        );
        
        const primaryDomain = new URL(primaryUrl).hostname;
        
        // Filter and score links
        const scoredLinks = links
            .filter(link => {
                try {
                    return link.href && 
                           link.href.startsWith('http') && 
                           new URL(link.href).hostname.includes(primaryDomain);
                } catch (e) { 
                    return false; 
                }
            })
            .map(link => {
                let score = 0;
                const combinedText = `${link.text} ${link.title}`;
                
                // Score based on keyword relevance
                grantKeywords.forEach(keyword => {
                    if (combinedText.includes(keyword)) score += 1;
                });
                
                // Bonus for specific grant-related terms
                if (combinedText.includes('application form') || 
                    combinedText.includes('apply now') ||
                    combinedText.includes('guidelines')) {
                    score += 2;
                }
                
                return { ...link, score };
            })
            .filter(link => link.score > 0)
            .sort((a, b) => b.score - a.score);
        
        // Separate by type
        const htmlLinks = scoredLinks
            .filter(link => !link.href.endsWith('.pdf'))
            .map(link => link.href);
            
        const pdfLinks = scoredLinks
            .filter(link => link.href.endsWith('.pdf'))
            .map(link => link.href);
        
        return {
            html: [...new Set(htmlLinks)], // Remove duplicates
            pdf: [...new Set(pdfLinks)]
        };
        
    } catch (error) {
        console.error(`     -> Error discovering links:`, error.message);
        return { html: [], pdf: [] };
    }
}

// =================================================================
// ENHANCED AI EXTRACTION
// =================================================================
async function extractGrantInfo(text, sourceUrl) {
    if (!text || text.length < 100) {
        console.log(`     -> Content too short for extraction: ${text.length} characters`);
        return [];
    }
    
    const isPdfContent = text.includes("--- PDF Document:");
    const contentType = isPdfContent ? "PDF documents" : "web pages";
    
    const prompt = `
    You are analyzing ${contentType} for active grant opportunities. Extract ALL distinct grant programs mentioned.

    **SOURCE:** ${sourceUrl}
    **CONTENT:**
    ${text.substring(0, 120000)} // Slightly increased limit

    For each grant opportunity, return a JSON object with:
    {
        "funder_name": "Organization providing the grant (required)",
        "title": "Specific grant program name (required)", 
        "description": "Grant purpose and focus (required)",
        "status": "Open/Upcoming/Closed - default to Open if deadline is future",
        "deadline": "Application deadline in YYYY-MM-DD format",
        "eligibility_criteria": "Who can apply",
        "funding_amount_text": "Original funding text (e.g. '$10,000-$50,000')",
        "application_url": "Direct application link if found",
        "categories": ["Focus areas like 'Education', 'Health', 'Arts']",
        "locations": ["Geographic areas served"],
        "grant_type": "Type like 'General Operating', 'Project Grant'"
    }

    **CRITICAL REQUIREMENTS:**
    1. Return a JSON array of grant objects
    2. Only include grants with future deadlines or explicitly stated as "Open"
    3. funder_name, title, and description are mandatory
    4. Extract ALL grants mentioned, even if from different funders
    5. Be thorough - multiple grants may exist on one page
    6. Return [] if no valid grants found

    Return ONLY valid JSON array.
    `;

    try {
        console.log(`     -> Extracting grants from ${text.length} characters of content...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        let jsonText = response.text().trim()
            .replace(/^```json\s*/, '')
            .replace(/```$/, '')
            .trim();
        
        // Find JSON array boundaries
        const jsonStart = jsonText.indexOf('[');
        const jsonEnd = jsonText.lastIndexOf(']') + 1;
        
        if (jsonStart === -1) {
            console.log("     -> No JSON array found in AI response");
            return [];
        }
        
        jsonText = jsonText.substring(jsonStart, jsonEnd);
        const grants = JSON.parse(jsonText);
        
        // Enhanced validation
        const validGrants = grants.filter(grant => {
            // Check required fields
            if (!grant || !grant.title || !grant.description || !grant.funder_name) {
                return false;
            }
            
            // Skip explicitly closed grants
            if (grant.status === 'Closed') {
                return false;
            }
            
            // Check deadline validity
            if (grant.deadline) {
                const deadlineMatch = String(grant.deadline).match(/(\d{4}-\d{2}-\d{2})/);
                if (deadlineMatch) {
                    const deadlineDate = new Date(deadlineMatch[0]);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (deadlineDate < today) {
                        console.log(`     -> Filtering expired grant: ${grant.title} (deadline: ${grant.deadline})`);
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        console.log(`     -> Extracted ${grants.length} total grants, ${validGrants.length} valid and active`);
        return validGrants;
        
    } catch (error) {
        console.error('     -> Grant extraction failed:', error.message);
        return [];
    }
}

// =================================================================
// DATABASE HELPERS
// =================================================================
async function getOrCreateFunder(funderName, websiteUrl) {
    if (!funderName) return null;
    
    try {
        // Try to find existing funder first
        const { data: existingFunder, error: findError } = await supabase
            .from('funders')
            .select('id, name')
            .eq('name', funderName)
            .single();
            
        if (existingFunder) {
            return existingFunder;
        }
        
        // Create new funder if not found
        const { data: newFunder, error: createError } = await supabase
            .from('funders')
            .insert({ 
                name: funderName, 
                website: websiteUrl,
                slug: generateSlug(funderName),
                last_updated: new Date().toISOString()
            })
            .select('id, name')
            .single();
            
        if (createError) throw createError;
        
        console.log(`     -> Created new funder: ${funderName}`);
        return newFunder;
        
    } catch (error) {
        console.error(`     -> Error managing funder "${funderName}":`, error.message);
        return null;
    }
}

async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    
    const { data } = await supabase
        .from('categories')
        .upsert({ name: categoryName }, { onConflict: 'name' })
        .select('id')
        .single();
        
    return data?.id;
}

async function getOrCreateLocation(locationName) {
    if (!locationName) return null;
    
    const { data } = await supabase
        .from('locations')
        .upsert({ name: locationName }, { onConflict: 'name' })
        .select('id')
        .single();
        
    return data?.id;
}

async function saveGrantsToSupabase(grants, primaryUrl) {
    if (!grants || grants.length === 0) return 0;
    
    console.log(`  -> Saving ${grants.length} grants to database...`);
    let savedCount = 0;

    for (const grant of grants) {
        try {
            // Get or create organization (updated function name)
            const organization = await getOrCreateOrganization(
                grant.funder_name, 
                new URL(primaryUrl).origin
            );
            
            if (!organization) {
                console.log(`     -> Skipping "${grant.title}" - organization creation failed`);
                continue;
            }

            // Parse deadline
            const deadlineMatch = grant.deadline ? 
                String(grant.deadline).match(/(\d{4}-\d{2}-\d{2})/) : null;
            const deadlineToInsert = deadlineMatch ? deadlineMatch[0] : null;
            
            // Parse funding amount
            const fundingAmount = parseFundingAmount(grant.funding_amount_text);

            // Insert or update grant (updated to use organization_id)
            const { data: grantResult, error } = await supabase
                .from('grants')
                .upsert({
                    organization_id: organization.id, // Updated field name
                    title: grant.title,
                    description: grant.description,
                    status: grant.status || 'Open',
                    application_url: grant.application_url || primaryUrl,
                    max_funding_amount: fundingAmount,
                    funding_amount_text: grant.funding_amount_text,
                    deadline: deadlineToInsert,
                    eligibility_criteria: grant.eligibility_criteria,
                    grant_type: grant.grant_type,
                    slug: generateSlug(grant.title),
                    date_added: new Date().toISOString().split('T')[0],
                    last_updated: new Date().toISOString()
                }, { onConflict: 'organization_id, title' }) // Updated conflict resolution
                .select('id')
                .single();

            if (error) throw new Error(error.message);
            
            console.log(`     -> ✅ Saved: "${grant.title}" from "${organization.name}" (ID: ${grantResult.id})`);
            savedCount++;

            // Link categories
            if (grant.categories && Array.isArray(grant.categories)) {
                for (const categoryName of grant.categories) {
                    const categoryId = await getOrCreateCategory(categoryName);
                    if (categoryId) {
                        await supabase
                            .from('grant_categories')
                            .upsert({ 
                                grant_id: grantResult.id, 
                                category_id: categoryId 
                            }, { onConflict: 'grant_id, category_id' });
                    }
                }
            }
            
            // Link locations
            if (grant.locations && Array.isArray(grant.locations)) {
                for (const locationName of grant.locations) {
                    const locationId = await getOrCreateLocation(locationName);
                    if (locationId) {
                        await supabase
                            .from('grant_locations')
                            .upsert({ 
                                grant_id: grantResult.id, 
                                location_id: locationId 
                            }, { onConflict: 'grant_id, location_id' });
                    }
                }
            }

            // Link eligible organization types if provided
            if (grant.eligible_organization_types && Array.isArray(grant.eligible_organization_types)) {
                for (const taxonomyCode of grant.eligible_organization_types) {
                    await supabase
                        .from('grant_eligible_taxonomies')
                        .upsert({
                            grant_id: grantResult.id,
                            taxonomy_code: taxonomyCode
                        }, { onConflict: 'grant_id, taxonomy_code' });
                }
            }

        } catch (err) {
            console.error(`     -> ❗ Error saving "${grant.title}":`, err.message);
        }
    }
    
    return savedCount;
}

async function markOpportunityAsProcessed(opportunityId, success = true, grantsFound = 0, processingNotes = '') {
    const updateData = {
        status: success ? 'processed' : 'error',
        last_processed_at: new Date().toISOString(),
        error_message: success ? 
            `Enhanced processing v3.0 - found ${grantsFound} grants. ${processingNotes}` : 
            `Processing failed - ${processingNotes}`
    };
    
    await supabase
        .from('grant_opportunities')
        .update(updateData)
        .eq('id', opportunityId);
}

// =================================================================
// ENHANCED MAIN EXECUTION LOGIC
// =================================================================
async function main() {
    console.log('=== Enhanced Grant Importer (v3.0 - Intelligent Processing) ===');
    
    const startTime = Date.now();
    const contentProcessor = new IntelligentContentProcessor();
    
    const opportunities = await getDiscoveredOpportunities();
    if (opportunities.length === 0) {
        console.log('  -> No new opportunities to process.');
        return;
    }
    
    console.log(`  -> Found ${opportunities.length} opportunities to process`);
    console.log(`  -> Configuration: Max content: ${CONFIG.MAX_CONTENT_LENGTH}, Batch size: ${CONFIG.BATCH_SIZE}`);

    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({ 
        userAgent: 'Mozilla/5.0 (compatible; 1RFP-GrantBot/3.0; +https://1rfp.org)'
    });
    
    let totalGrantsFound = 0;
    let successfulProcessing = 0;
    
    for (let i = 0; i < opportunities.length; i++) {
        const opportunity = opportunities[i];
        console.log(`\n--- Processing ${i + 1}/${opportunities.length}: ${opportunity.url} ---`);
        
        try {
            // Enhanced crawling with intelligent content processing
            const relevantContent = await crawlAndGetRelevantText(opportunity.url, context);
            
            if (!relevantContent || relevantContent.length < 300) {
                console.log('  -> Insufficient relevant content found');
                await markOpportunityAsProcessed(
                    opportunity.id, 
                    false, 
                    0, 
                    'Insufficient relevant content'
                );
                continue;
            }

            // Use intelligent content processor for extraction
            const grants = await contentProcessor.processLargeContent(
                relevantContent, 
                opportunity.url
            );
            
            if (!grants || grants.length === 0) {
                console.log('  -> No active grants found after intelligent processing');
                await markOpportunityAsProcessed(
                    opportunity.id, 
                    true, 
                    0, 
                    'No active grants found'
                );
                continue;
            }

            // Save grants to database
            const savedCount = await saveGrantsToSupabase(grants, opportunity.url);
            totalGrantsFound += savedCount;
            successfulProcessing++;
            
            await markOpportunityAsProcessed(
                opportunity.id, 
                true, 
                savedCount, 
                `Enhanced processing completed`
            );

        } catch (error) {
            console.error(`  -> ❗ Error processing opportunity ${opportunity.id}:`, error.message);
            await markOpportunityAsProcessed(
                opportunity.id, 
                false, 
                0, 
                `Processing error: ${error.message}`
            );
        }
        
        // Rate limiting between opportunities
        await sleep(CONFIG.REQUEST_DELAY);
    }

    await browser.close();
    
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n=== Enhanced Import Complete ===');
    console.log(`📊 Processing Summary:`);
    console.log(`   • Opportunities processed: ${opportunities.length}`);
    console.log(`   • Successful extractions: ${successfulProcessing}`);
    console.log(`   • Total grants found: ${totalGrantsFound}`);
    console.log(`   • Success rate: ${Math.round((successfulProcessing / opportunities.length) * 100)}%`);
    console.log(`   • Processing time: ${processingTime} seconds`);
    console.log(`   • Average time per opportunity: ${Math.round(processingTime / opportunities.length)} seconds`);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
    main().catch(console.error);
}