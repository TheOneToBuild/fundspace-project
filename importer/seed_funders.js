// seed_funders.js - COMPLETE DISCOVERY & RELATIONAL VERSION
const path = require('path');
const fs = require('fs');
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

async function getOrCreateFunderType(typeName) {
    if (!typeName) return null;
    const { data: existingType } = await supabase.from('funder_types').select('id').eq('name', typeName).single();
    if (existingType) return existingType.id;
    console.log(`     -> AI discovered a new funder type: "${typeName}". Adding to funder_types table.`);
    const { data: newType, error } = await supabase.from('funder_types').insert({ name: typeName }).select('id').single();
    if (error) {
        console.error(`     -> Error creating new funder type:`, error);
        return null;
    }
    return newType?.id;
}

async function getLocationId(locationName) {
    if (!locationName) return null;
    const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('name', locationName)
        .single();
    
    if (!existingLocation) {
        console.warn(`     -> Location "${locationName}" not found in the predefined locations table.`);
    }
    return existingLocation?.id;
}

async function linkFunderToLocations(funderId, locationNames) {
    if (!funderId || !locationNames || !Array.isArray(locationNames) || locationNames.length === 0) return;
    console.log(`     -> Linking funder to funding locations: ${locationNames.join(', ')}`);
    for (const locName of locationNames) {
        const locationId = await getLocationId(locName.trim());
        if (locationId) {
            await supabase
                .from('funder_funding_locations')
                .insert({ funder_id: funderId, location_id: locationId });
        }
    }
}

async function seedFunders() {
    console.log('--- Starting Funder Discovery Script ---');

    console.log('  -> Checking database for existing funders...');
    const { data: existingFunders, error: fetchError } = await supabase.from('funders').select('name');
    if (fetchError) {
        console.error("  -> ‼️ Error fetching existing funders:", fetchError);
        return;
    }
    const existingNames = existingFunders ? existingFunders.map(f => f.name) : [];
    console.log(`  -> Found ${existingNames.length} funders in the database to exclude.`);

    let funderNamesToSeed = [];
    try {
        console.log('  -> Asking AI to discover 10 new funders in the SF Bay Area...');
        const discoveryPrompt = `
            List the names of 10 unique foundations or grant-making organizations that are based in or heavily fund initiatives in the San Francisco Bay Area, California.
            CRITICAL RULE: Do NOT include any of the following names in your response, as they are already in my database:
            - ${existingNames.join('\n- ')}
            Prioritize a mix of well-known and lesser-known foundations that are not on the exclusion list.
            Return the names as a single, valid JSON array of strings. Do not include any other text, explanations, or markdown.
        `;
        const nameResult = await model.generateContent(discoveryPrompt);
        let nameJsonText = nameResult.response.text().trim().replace(/^```json\s*|```$/g, '');
        funderNamesToSeed = JSON.parse(nameJsonText);
        console.log(`  -> AI discovered the following new funders: ${funderNamesToSeed.join(', ')}`);
    } catch (error) {
        console.error("  -> ‼️ Error discovering funder names:", error);
        return;
    }
    
    if (!funderNamesToSeed || funderNamesToSeed.length === 0) {
        console.log("  -> AI did not return any new funders to process. Exiting.");
        return;
    }

    const enrichmentPrompt = `
        Analyze the following list of foundation names. For each name, use your existing knowledge to provide the specified details. Return the information as a single, valid JSON array where each object represents a funder.
        **Funder Names:**
        - ${funderNamesToSeed.join('\n- ')}
        **Required JSON fields for each funder:**
        - "name": The official name of the organization.
        - "funder_type": The type of funder. Choose from: "Private Foundation", "Community Foundation", "Corporate Foundation", "City Government", "State Government", "Federal Government", or "Other".
        - "geographic_scope": An array of strings listing the Bay Area counties this organization typically funds. Choose from: "Alameda County", "Contra Costa County", "Marin County", "Napa County", "San Francisco County", "San Mateo County", "Santa Clara County", "Solano County", "Sonoma County", or "San Francisco Bay Area" if it covers all/most.
        - "description": A detailed summary of at least two paragraphs, but less than three. It should cover the foundation's story (how it was founded), its mission, and its funding philosophy.
        - "website": The official website URL.
        - "logo_url": A direct URL to the organization's logo image.
        - "location": The city and state of their primary headquarters.
        - "focus_areas": An array of strings for the types of funds they provide (e.g., ["Housing", "Education", "Homelessness"]).
        - "grant_types": An array of common grant types they offer.
        - "total_funding_annually": A string representing approximate total annual giving. If not available, provide the total size of their funds or endowment.
        - "average_grant_size": A string representing their typical grant size as a dollar figure (e.g., "$145,000"). If a precise figure cannot be found, return the string "Varies".
        - "application_process_summary": A brief summary of how an organization can apply for funding.
        - "key_personnel": An array of objects for all findable Program Officers or grant-making staff, each with "name" and "title".
        - "past_grantees": A JSON array of 6 notable past grantee names as strings.
        - "notable_grant": A summary of any recent news, grants, or work the foundation has done that has been featured in the press.
        **Instructions & Rules:**
        - CRITICAL RULE: For any field, if you do not have specific, factual data, you MUST return a value of null. Do NOT write "Not specified", "Information is available on their website", or any other explanatory sentence. Your response for a field must be either the specific data requested or null.
        - Ensure the entire output is a single, valid, machine-readable JSON array.
    `;

    try {
        console.log("\n  -> Asking AI to gather detailed data for discovered funders...");
        const result = await model.generateContent(enrichmentPrompt);
        let jsonText = result.response.text().trim().replace(/^```json\s*|```$/g, '');
        const fundersToProcess = JSON.parse(jsonText);
        console.log(`  -> AI returned data for ${fundersToProcess.length} funders.`);

        let insertedCount = 0;
        for (const funderData of fundersToProcess) {
            if (!funderData.name) {
                console.log('  -> Skipping a record with no name.');
                continue;
            }

            const { data: existingFunder } = await supabase.from('funders').select('id').eq('name', funderData.name).single();
            if (existingFunder) {
                console.log(`  -> Skipping "${funderData.name}" as it already exists in the database.`);
                continue;
            }

            if (funderData.logo_url) {
                const isValidLogo = await validateImageUrl(funderData.logo_url);
                if (!isValidLogo) {
                    console.log(`     -> Invalid logo URL for "${funderData.name}". Setting to null.`);
                    funderData.logo_url = null;
                }
            }

            const funderTypeId = await getOrCreateFunderType(funderData.funder_type);

            const { data: newFunder, error: insertError } = await supabase
                .from('funders')
                .insert({
                    name: funderData.name,
                    slug: generateSlug(funderData.name),
                    last_updated: new Date().toISOString(),
                    funder_type_id: funderTypeId,
                    description: funderData.description,
                    website: funderData.website,
                    location: funderData.location,
                    grant_types: funderData.grant_types,
                    application_process_summary: funderData.application_process_summary,
                    key_personnel: funderData.key_personnel,
                    past_grantees: funderData.past_grantees,
                    notable_grant: funderData.notable_grant,
                    logo_url: funderData.logo_url,
                    total_funding_annually: funderData.total_funding_annually,
                    average_grant_size: funderData.average_grant_size
                })
                .select('id')
                .single();

            if (insertError) {
                console.error(`  -> ‼️ Error inserting "${funderData.name}":`, insertError.message);
            } else {
                console.log(`  -> ✅ Successfully inserted "${funderData.name}" (ID: ${newFunder.id}).`);
                insertedCount++;
                await linkFunderToCategories(newFunder.id, funderData.focus_areas);
                await linkFunderToLocations(newFunder.id, funderData.geographic_scope);
            }
        }
        console.log(`\n--- Discovery complete. Inserted ${insertedCount} new funders. ---`);

    } catch (error) {
        console.error("\n--- ‼️ A critical error occurred during data enrichment ---", error);
    }
}

seedFunders();