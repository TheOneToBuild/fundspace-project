// discover_grant_urls.js
// This script uses AI to find new grant opportunities and saves their URLs to the database.

const path = require('path');
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
// Using a more advanced model for better reasoning and web knowledge
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

/**
 * Asks the AI to find grant opportunities and returns them as structured data.
 */
async function findGrantOpportunitiesFromAI() {
    // Provide the AI with a list of funders we already have to avoid duplicates.
    const { data: existingFunders, error } = await supabase
        .from('funders')
        .select('name')
        .limit(200); // Limit to a reasonable number to keep the prompt size manageable

    if (error) {
        console.error("Error fetching existing funders:", error);
    }
    const existingFunderNames = existingFunders ? existingFunders.map(f => f.name) : [];

    const prompt = `
        You are an expert grant researcher. Your task is to find currently open grant opportunities
        from foundations that serve the 9-county San Francisco Bay Area (Alameda, Contra Costa,
        Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, Sonoma).

        Search for 5 to 7 grant opportunities that are likely active now.
        Prioritize private and community foundations.

        CRITICAL: To avoid duplicates, do NOT list grants from the following funders if possible:
        - ${existingFunderNames.slice(0, 50).join('\n- ')} 

        For each opportunity you find, provide the following information in a JSON array format.
        Each object in the array should have these keys:
        - "funder_name": The name of the foundation or organization offering the grant.
        - "grant_name": The specific name of the grant or program.
        - "grant_url": The direct URL to the page with information about this specific grant. This URL is the most important piece of information.

        Example of the required JSON output:
        [
            {
                "funder_name": "Example Community Foundation",
                "grant_name": "Community Impact Grant",
                "grant_url": "https://examplefoundation.org/grants/community-impact/"
            }
        ]

        Return ONLY the valid JSON array. Do not include any other text, explanations, or markdown formatting.
    `;

    try {
        console.log("-> Asking AI to discover new grant opportunities...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonText = response.text().trim().replace(/^```json\s*|```$/g, '');
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("❗ Failed to get or parse grant opportunities from AI:", e);
        console.error("   Raw AI response:", e.response ? e.response.text() : "No response text.");
        return [];
    }
}

/**
 * Saves newly discovered grant URLs to the `grant_opportunities` table.
 */
async function saveOpportunitiesToDB(opportunities) {
    if (!opportunities || opportunities.length === 0) {
        console.log("-> No new opportunities to save.");
        return;
    }

    // Prepare data for insertion
    const opportunitiesToInsert = opportunities
      .filter(opp => opp.grant_url) // Ensure the opportunity has a URL
      .map(opp => ({
        funder_name_guess: opp.funder_name,
        grant_name_guess: opp.grant_name,
        url: opp.grant_url,
        status: 'new' // Initial status
    }));

    if (opportunitiesToInsert.length === 0) {
        console.log("-> No valid opportunities with URLs found to save.");
        return;
    }

    // Use upsert to avoid adding duplicate URLs.
    // It will insert a new row if the URL doesn't exist.
    const { data, error } = await supabase
        .from('grant_opportunities')
        .upsert(opportunitiesToInsert, {
            onConflict: 'url',
            ignoreDuplicates: true // This is deprecated, but useful shorthand. Default behavior is to do nothing on conflict.
        })
        .select();

    if (error) {
        console.error("❗ Error saving opportunities to database:", error);
    } else {
        console.log(`✅ Successfully saved ${data.length} new grant opportunities to the database.`);
        if (data.length < opportunitiesToInsert.length) {
            console.log(`   (Skipped ${opportunitiesToInsert.length - data.length} duplicates that already existed.)`);
        }
    }
}

async function main() {
    console.log("--- Starting Grant Discovery Script ---");
    
    const newOpportunities = await findGrantOpportunitiesFromAI();

    await saveOpportunitiesToDB(newOpportunities);

    console.log("\n--- Grant Discovery Script Finished ---");
    console.log("Next step: Modify the `import_grants.js` script to read from the `grant_opportunities` table.");
}

main().catch(console.error);
