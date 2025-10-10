// importer/grant_processor_core.js
// V3 - Updated to use @sparticuz/chromium for serverless environments

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const axios = require('axios');
const pdf = require('pdf-parse');

// --- CLIENTS & CONFIG ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const CONFIG = {
    MAX_CONTENT_LENGTH: 100000,
    CONTENT_RELEVANCE_THRESHOLD: 0.6,
};

// =================================================================
// INTELLIGENT CONTENT PROCESSOR CLASS (from import_grants.js)
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
        const sections = text.split(/\n\s*(?:\n|---|\*\*\*|#{1,3})\s*/);
        const scoredSections = sections.map(section => {
            const lowerSection = section.toLowerCase();
            let score = 0;
            this.strongGrantIndicators.forEach(indicator => { if (lowerSection.includes(indicator)) score += 3; });
            this.grantKeywords.forEach(keyword => { if (lowerSection.includes(keyword)) score += 1; });
            if (/\$[\d,]+/.test(section)) score += 2;
            if (/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b|\b\w+\s+\d{1,2},?\s+\d{4}\b/.test(section)) score += 2;
            return { section, score, length: section.length };
        });
        scoredSections.sort((a, b) => b.score - a.score);
        let combinedText = '';
        let totalLength = 0;
        for (const scored of scoredSections) {
            if (scored.score > 0 && totalLength + scored.length <= CONFIG.MAX_CONTENT_LENGTH) {
                combinedText += scored.section + '\n\n';
                totalLength += scored.length;
            }
        }
        if (combinedText.length < 500) {
            combinedText = text.substring(0, CONFIG.MAX_CONTENT_LENGTH);
        }
        return combinedText;
    }

    async assessContentRelevance(content) {
        if (!content || content.length < 200) return 0;
        const preview = content.substring(0, 3000);
        try {
            const prompt = `Rate the likelihood (0.0-1.0) that this content contains active grant opportunities. Consider mentions of deadlines, funding amounts, and application processes. Return only a number.`;
            const result = await model.generateContent(prompt);
            const score = parseFloat(result.response.text().trim()) || 0;
            return Math.min(Math.max(score, 0), 1);
        } catch (error) {
            console.log(`     -> Content relevance check failed: ${error.message}`);
            return 0.5;
        }
    }

    async processLargeContent(text, sourceUrl) {
        const relevantContent = this.extractGrantSections(text);
        const relevanceScore = await this.assessContentRelevance(relevantContent);
        if (relevanceScore < CONFIG.CONTENT_RELEVANCE_THRESHOLD) {
            console.log(`     -> Content relevance ${relevanceScore} too low, skipping.`);
            return [];
        }
        return await this.extractFromChunk(relevantContent, sourceUrl);
    }

    async extractFromChunk(content, sourceUrl) {
        return await extractGrantInfo(content, sourceUrl);
    }
}


// =================================================================
// UTILITY FUNCTIONS
// =================================================================
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
// AI EXTRACTION LOGIC
// =================================================================
async function extractGrantInfo(text, sourceUrl) {
    if (!text || text.length < 100) return [];
    const prompt = `
    Analyze the following content from ${sourceUrl} for active grant opportunities. Extract ALL distinct grant programs mentioned.

    For each grant, return a JSON object with:
    {
        "funder_name": "Organization providing the grant (required)",
        "title": "Specific grant program name (required)", 
        "description": "Grant purpose and focus (required)",
        "status": "Open/Upcoming/Closed",
        "deadline": "Application deadline in YYYY-MM-DD format",
        "eligibility_criteria": "Who can apply",
        "funding_amount_text": "Original funding text (e.g. '$10,000-$50,000')",
        "application_url": "Direct application link if found",
        "categories": ["Focus areas"], "locations": ["Geographic areas served"], "grant_type": "Type of grant"
    }
    CRITICAL: Return a JSON array of grant objects. If no valid grants, return [].
    Content:
    ${text.substring(0, 120000)}
    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim().replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const jsonStart = jsonText.indexOf('[');
        const jsonEnd = jsonText.lastIndexOf(']') + 1;
        if (jsonStart === -1) return [];
        jsonText = jsonText.substring(jsonStart, jsonEnd);
        const grants = JSON.parse(jsonText);
        return grants.filter(g => g && g.title && g.description && g.funder_name);
    } catch (error) {
        console.error('     -> Grant extraction failed:', error.message);
        return [];
    }
}


// =================================================================
// DATABASE HELPERS
// =================================================================
async function getOrCreateOrganization(name, website) {
    if (!name) throw new Error("Organization name is required.");
    const { data, error } = await supabase
        .from('organizations')
        .upsert({ name: name, website: website, slug: generateSlug(name), type: 'funder' }, { onConflict: 'name', ignoreDuplicates: false })
        .select('id, name')
        .single();
    if (error) throw error;
    if (!data) throw new Error(`Could not create or find organization: ${name}`);
    return data;
}

async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    const { data } = await supabase.from('categories').upsert({ name: categoryName }, { onConflict: 'name' }).select('id').single();
    return data?.id;
}

async function saveGrantsToSupabase(grants, primaryUrl) {
    if (!grants || grants.length === 0) return 0;
    let savedCount = 0;
    for (const grant of grants) {
        try {
            const organization = await getOrCreateOrganization(grant.funder_name, new URL(primaryUrl).origin);
            const deadlineMatch = grant.deadline ? String(grant.deadline).match(/(\d{4}-\d{2}-\d{2})/) : null;
            const deadlineToInsert = deadlineMatch ? deadlineMatch[0] : null;
            const fundingAmount = parseFundingAmount(grant.funding_amount_text);

            const { data: grantResult, error } = await supabase
                .from('grants')
                .upsert({
                    organization_id: organization.id,
                    title: grant.title,
                    description: grant.description,
                    status: grant.status || 'Open',
                    application_url: grant.application_url || primaryUrl,
                    max_funding_amount: fundingAmount,
                    funding_amount_text: grant.funding_amount_text,
                    deadline: deadlineToInsert,
                    eligibility_criteria: grant.eligibility_criteria,
                    grant_type: grant.grant_type,
                    slug: generateSlug(`${organization.name} ${grant.title}`),
                    date_added: new Date().toISOString().split('T')[0],
                    last_updated: new Date().toISOString()
                }, { onConflict: 'organization_id, title' })
                .select('id').single();
            if (error) throw error;
            savedCount++;

            if (grant.categories && Array.isArray(grant.categories)) {
                for (const categoryName of grant.categories) {
                    const categoryId = await getOrCreateCategory(categoryName);
                    if (categoryId) await supabase.from('grant_categories').upsert({ grant_id: grantResult.id, category_id: categoryId });
                }
            }
        } catch (err) {
            console.error(`     -> ❗ Error saving "${grant.title}":`, err.message);
        }
    }
    return savedCount;
}


// =================================================================
// MAIN ORCHESTRATOR FUNCTION (UPDATED FOR SERVERLESS)
// =================================================================
async function processUrlAndUpdateSubmission(url, submissionId) {
    console.log(`--- CORE V3: Processing Submission ${submissionId}: ${url} ---`);
    let browser = null;

    try {
        await supabase.from('grant_submissions').update({ status: 'processing' }).eq('id', submissionId);

        console.log("--- CORE V3: Launching browser... ---");
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        console.log("--- CORE V3: Browser launched successfully. ---");

        const page = await browser.newPage();
        
        console.log(`--- CORE V3: Navigating to ${url}... ---`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        console.log("--- CORE V3: Page loaded. Extracting text... ---");

        const relevantContent = await page.evaluate(() => document.body.innerText);
        if (!relevantContent || relevantContent.length < 200) {
            throw new Error('Insufficient relevant content found on the page.');
        }
        console.log(`--- CORE V3: Extracted ${relevantContent.length} characters. Processing with AI... ---`);

        const contentProcessor = new IntelligentContentProcessor();
        const grants = await contentProcessor.processLargeContent(relevantContent, url);
        if (!grants || grants.length === 0) {
            throw new Error('No active grant opportunities were found after analysis.');
        }
        console.log(`--- CORE V3: Found ${grants.length} grants. Saving to database... ---`);

        const savedCount = await saveGrantsToSupabase(grants, url);
        if (savedCount === 0) {
            throw new Error('Extracted grants could not be saved to the database.');
        }
        console.log("--- CORE V3: Grants saved successfully. ---");

        await supabase
            .from('grant_submissions')
            .update({ status: 'success', error_message: `Processing complete. Found and saved ${savedCount} grant(s).` })
            .eq('id', submissionId);

        console.log(`--- ✅ CORE V3: Successfully processed submission ${submissionId}. ---`);

    } catch (error) {
        console.error(`--- ❗ CORE V3: Error processing submission ${submissionId}:`, error.message);
        await supabase
            .from('grant_submissions')
            .update({ status: 'failed', error_message: error.message })
            .eq('id', submissionId);
    } finally {
        if (browser !== null) {
            console.log("--- CORE V3: Closing browser... ---");
            await browser.close();
        }
    }
}

module.exports = { processUrlAndUpdateSubmission };