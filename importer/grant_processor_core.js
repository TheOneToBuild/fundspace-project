// importer/grant_processor_core.js
// This is the core "engine" for processing grants. It will be used by both
// your batch pipeline and the new on-demand user submission worker.

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chromium } = require('playwright');
const axios = require('axios');
const pdf = require('pdf-parse');

// --- CLIENTS & CONFIG ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const CONFIG = {
    MAX_CONTENT_LENGTH: 100000,
    MAX_PAGES_PER_SITE: 6,
    MAX_PDFS_PER_SITE: 3,
    CONTENT_RELEVANCE_THRESHOLD: 0.6,
    REQUEST_DELAY: 1500
};

// --- LOGIC (Copied and adapted from import_grants.js) ---

// NOTE: The `IntelligentContentProcessor` class and its methods from import_grants.js
// should be copied here verbatim. For brevity, I'm omitting the full class code.
// Please copy the entire `IntelligentContentProcessor` class here.
class IntelligentContentProcessor {
    // ... PASTE THE FULL CLASS FROM import_grants.js HERE ...
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
    extractGrantSections(text) { /* ... same as in your file ... */ return text.substring(0, CONFIG.MAX_CONTENT_LENGTH); }
    async assessContentRelevance(content) { /* ... same as in your file ... */ return 1.0; }
    createIntelligentChunks(text) { /* ... same as in your file ... */ return [text]; }
    async processLargeContent(text, sourceUrl) { /* ... same as in your file ... */ return await this.extractFromChunk(text, sourceUrl); }
    async extractFromChunk(content, sourceUrl) { /* ... same as in your file ... */ return await extractGrantInfo(content, sourceUrl); }
    deduplicateGrants(grants) { /* ... same as in your file ... */ return grants; }
}


// Copy the helper functions as well
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

// Copy the crawling and data fetching logic
async function discoverHighValueLinks(primaryUrl, page) { /* ... PASTE FROM import_grants.js ... */ return { html: [], pdf: [] }; }
async function crawlAndGetRelevantText(primaryUrl, context) { /* ... PASTE FROM import_grants.js ... */ 
    const page = await context.newPage();
    await page.goto(primaryUrl, { waitUntil: 'networkidle', timeout: 60000 });
    const text = await page.evaluate(() => document.body.innerText);
    await page.close();
    return text;
}
async function extractGrantInfo(text, sourceUrl) { /* ... PASTE FROM import_grants.js ... */ return []; }

// Copy and adapt the database helpers
async function getOrCreateOrganization(name, website) {
    if (!name) return null;
    const { data } = await supabase
        .from('organizations')
        .upsert({ name: name, website: website, slug: generateSlug(name) }, { onConflict: 'name', ignoreDuplicates: false })
        .select('id, name')
        .single();
    if (!data) throw new Error(`Could not create or find organization: ${name}`);
    return data;
}
async function getOrCreateCategory(categoryName) { /* ... PASTE FROM import_grants.js ... */ }
async function getOrCreateLocation(locationName) { /* ... PASTE FROM import_grants.js ... */ }
async function saveGrantsToSupabase(grants, primaryUrl) { /* ... PASTE FROM import_grants.js ... */ 
    // This function needs the getOrCreateOrganization call
    let savedCount = 0;
    for(const grant of grants) {
        const organization = await getOrCreateOrganization(grant.funder_name, new URL(primaryUrl).origin);
        // ... rest of the saving logic
        savedCount++;
    }
    return savedCount;
}

/**
 * This is the main exported function. It processes a single URL and updates
 * the submission record in the database with the result.
 * @param {string} url - The URL of the grant opportunity to process.
 * @param {string} submissionId - The UUID of the record in the `grant_submissions` table.
 */
async function processUrlAndUpdateSubmission(url, submissionId) {
    console.log(`--- CORE: Processing Submission ${submissionId}: ${url} ---`);

    await supabase.from('grant_submissions').update({ status: 'processing' }).eq('id', submissionId);

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (compatible; 1RFP-GrantBot/3.0; +https://1rfp.org)' });

    try {
        const contentProcessor = new IntelligentContentProcessor();
        const relevantContent = await crawlAndGetRelevantText(url, context);
        if (!relevantContent || relevantContent.length < 200) {
            throw new Error('Insufficient relevant content found.');
        }

        const grants = await contentProcessor.processLargeContent(relevantContent, url);
        if (!grants || grants.length === 0) {
            throw new Error('No active grant opportunities were found.');
        }

        const savedCount = await saveGrantsToSupabase(grants, url);
        if (savedCount === 0) {
            throw new Error('Extracted grants could not be saved to the database.');
        }

        await supabase
            .from('grant_submissions')
            .update({ status: 'success', error_message: `Processing complete. Found and saved ${savedCount} grant(s).` })
            .eq('id', submissionId);

        console.log(`--- ✅ CORE: Successfully processed submission ${submissionId}. ---`);

    } catch (error) {
        console.error(`--- ❗ CORE: Error processing submission ${submissionId}:`, error.message);
        await supabase
            .from('grant_submissions')
            .update({ status: 'failed', error_message: error.message })
            .eq('id', submissionId);
    } finally {
        await browser.close();
    }
}

module.exports = { processUrlAndUpdateSubmission };