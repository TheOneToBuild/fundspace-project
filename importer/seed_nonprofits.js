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

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- UTILITY FUNCTIONS ---
function generateSlug(name) {
    if (!name) return null;
    return name.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/--+/g, '-');
}

async function validateImageUrl(url) {
    if (!url) return false;
    try {
        const response = await axios.head(url, { timeout: 5000 });
        const contentType = response.headers['content-type'];
        return response.status >= 200 && response.status < 300 && contentType && contentType.startsWith('image/');
    } catch (error) {
        return false;
    }
}

async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    const { data: existing } = await supabase.from('categories').select('id').eq('name', categoryName).single();
    if (existing) return existing.id;
    console.log(`     -> Creating new category: "${categoryName}"`);
    const { data: newCategory } = await supabase.from('categories').insert({ name: categoryName }).select('id').single();
    return newCategory?.id;
}

async function linkNonprofitToCategories(nonprofitId, focusAreas) {
    if (!nonprofitId || !focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) return;
    console.log(`     -> Linking nonprofit to categories: ${focusAreas.join(', ')}`);
    for (const categoryName of focusAreas) {
        const categoryId = await getOrCreateCategory(categoryName.trim());
        if (categoryId) {
            await supabase.from('nonprofit_categories').insert({ nonprofit_id: nonprofitId, category_id: categoryId });
        }
    }
}

async function seedNonprofits() {
    console.log('--- Starting Nonprofit Discovery Script ---');

    // --- Get all existing nonprofit names from the database ---
    console.log('  -> Checking database for existing nonprofits...');
    const { data: existingNonprofits, error: fetchError } = await supabase.from('nonprofits').select('name');
    if (fetchError) {
        console.error("  -> ‼️ Error fetching existing nonprofits:", fetchError);
        return;
    }
    const existingNames = existingNonprofits ? existingNonprofits.map(f => f.name) : [];
    console.log(`  -> Found ${existingNames.length} nonprofits in the database to exclude.`);


    // --- AI Call 1: Discover Nonprofit Names ---
    let nonprofitNamesToSeed = [];
    try {
        console.log('  -> Asking AI to discover 10 new nonprofits in the SF Bay Area...');
        const discoveryPrompt = `
            List the names of 10 unique nonprofit organizations based in the San Francisco Bay Area, California.
            CRITICAL RULE: Do NOT include any of the following names in your response, as they are already in my database:
            - ${existingNames.join('\n- ')}
            Prioritize a mix of well-known and lesser-known nonprofits across different sectors.
            Return the names as a single, valid JSON array of strings. Do not include any other text.
        `;
        const nameResult = await model.generateContent(discoveryPrompt);
        let nameJsonText = nameResult.response.text().trim().replace(/^```json\s*|```$/g, '');
        nonprofitNamesToSeed = JSON.parse(nameJsonText);
        console.log(`  -> AI discovered the following nonprofits: ${nonprofitNamesToSeed.join(', ')}`);
    } catch (error) {
        console.error("  -> ‼️ Error discovering nonprofit names:", error);
        return;
    }
    
    if (!nonprofitNamesToSeed || nonprofitNamesToSeed.length === 0) {
        console.log("  -> AI did not return any new nonprofits to process. Exiting.");
        return;
    }

    // --- AI Call 2: Enrich the Discovered Names ---
    const enrichmentPrompt = `
        Analyze the following list of nonprofit organization names. For each name, use your existing knowledge to provide the specified details. Return the information as a single, valid JSON array where each object represents a nonprofit.
        **Nonprofit Names:**
        - ${nonprofitNamesToSeed.join('\n- ')}
        **Required JSON fields for each nonprofit:**
        - "name": The official name of the organization.
        - "tagline": A short, one-sentence tagline or mission statement.
        - "description": A detailed summary of at least two paragraphs about the organization's work, history, and mission.
        - "website": The official website URL.
        - "image_url": A URL for a compelling photo representing their work.
        - "location": The city and state of their primary office (e.g., "Oakland, CA").
        - "focus_areas": An array of strings for the nonprofit's main categories of work (e.g., ["Food Security", "Community Health", "Advocacy"]).
        - "budget": A string representing their annual budget or revenue (e.g., "$500,000 - $900,000", "~$1.2M").
        - "staff_count": The approximate number of staff members as an integer.
        - "year_founded": The year the organization was founded as an integer.
        - "impact_metric": A key statistic or metric demonstrating their impact (e.g., "Distributed 1 million pounds of fresh produce last year").
        - "contact_email": The primary contact email address for the organization.

        **Instructions & Rules:**
        - CRITICAL RULE: For any field, if you do not have specific, factual data, you MUST return a value of null.
        - Ensure the entire output is a single, valid, machine-readable JSON array.
    `;

    try {
        console.log("\n  -> Asking AI to gather detailed data for discovered nonprofits...");
        const result = await model.generateContent(enrichmentPrompt);
        let jsonText = result.response.text().trim().replace(/^```json\s*|```$/g, '');
        const nonprofitsToProcess = JSON.parse(jsonText);
        console.log(`  -> AI returned data for ${nonprofitsToProcess.length} nonprofits.`);

        let insertedCount = 0;
        for (const nonprofitData of nonprofitsToProcess) {
            if (!nonprofitData.name) {
                console.log('  -> Skipping a record with no name.');
                continue;
            }

            const { data: existingNonprofit } = await supabase.from('nonprofits').select('id').eq('name', nonprofitData.name).single();
            if (existingNonprofit) {
                console.log(`  -> Skipping "${nonprofitData.name}" as it already exists in the database.`);
                continue;
            }

            if (nonprofitData.image_url) {
                const isValidImage = await validateImageUrl(nonprofitData.image_url);
                if (!isValidImage) {
                    console.log(`     -> Invalid image URL for "${nonprofitData.name}". Setting to null.`);
                    nonprofitData.image_url = null;
                }
            }

            const { data: newNonprofit, error: insertError } = await supabase
                .from('nonprofits')
                .insert({
                    name: nonprofitData.name,
                    slug: generateSlug(nonprofitData.name),
                    tagline: nonprofitData.tagline,
                    description: nonprofitData.description,
                    website: nonprofitData.website,
                    image_url: nonprofitData.image_url,
                    location: nonprofitData.location,
                    budget: nonprofitData.budget,
                    staff_count: nonprofitData.staff_count,
                    year_founded: nonprofitData.year_founded,
                    impact_metric: nonprofitData.impact_metric,
                    contact_email: nonprofitData.contact_email,
                    last_updated: new Date().toISOString()
                })
                .select('id')
                .single();

            if (insertError) {
                console.error(`  -> ‼️ Error inserting "${nonprofitData.name}":`, insertError.message);
            } else {
                console.log(`  -> ✅ Successfully inserted "${nonprofitData.name}" (ID: ${newNonprofit.id}).`);
                insertedCount++;
                await linkNonprofitToCategories(newNonprofit.id, nonprofitData.focus_areas);
            }
        }
        console.log(`\n--- Nonprofit seeding complete. Inserted ${insertedCount} new nonprofits. ---`);

    } catch (error) {
        console.error("\n--- ‼️ A critical error occurred during data enrichment ---", error);
    }
}

seedNonprofits();