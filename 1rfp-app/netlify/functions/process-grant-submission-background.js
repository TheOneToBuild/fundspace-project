// netlify/functions/process-grant-submission-background.js

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use service role key to bypass RLS policies
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Database helper functions
function generateSlug(name) {
    if (!name) return null;
    return name.toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/--+/g, '-');
}

function parseFundingAmount(text) {
    if (!text) return null;
    const cleaned = String(text).replace(/[$,]/g, '');
    const numberMatch = cleaned.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[0], 10) : null;
}

async function getOrCreateOrganization(name, website) {
    if (!name) throw new Error("Organization name is required.");
    
    // First try to find existing organization
    const { data: existing } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('name', name)
        .single();
    
    if (existing) {
        console.log(`🔍 Found existing organization: ${existing.name}`);
        return existing;
    }
    
    // Create new organization
    console.log(`🆕 Creating new organization: ${name}`);
    const { data, error } = await supabase
        .from('organizations')
        .insert({ 
            name: name, 
            website: website, 
            slug: generateSlug(name), 
            type: 'funder' 
        })
        .select('id, name')
        .single();
    
    if (error) throw error;
    if (!data) throw new Error(`Could not create organization: ${name}`);
    return data;
}

async function getOrCreateCategory(categoryName) {
    if (!categoryName) return null;
    
    // First try to find existing category
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .single();
    
    if (existing) return existing.id;
    
    // Create new category
    const { data } = await supabase
        .from('categories')
        .insert({ name: categoryName })
        .select('id')
        .single();
    
    return data?.id;
}

async function saveGrantsToSupabase(grants, primaryUrl) {
    if (!grants || grants.length === 0) return 0;
    let savedCount = 0;
    
    for (const grant of grants) {
        try {
            console.log(`💾 Processing grant: "${grant.title}"`);
            
            const organization = await getOrCreateOrganization(grant.funder_name, new URL(primaryUrl).origin);
            console.log(`✅ Organization ready: ${organization.name} (ID: ${organization.id})`);
            
            // Check if grant already exists for this organization
            const { data: existingGrant } = await supabase
                .from('grants')
                .select('id')
                .eq('organization_id', organization.id)
                .eq('title', grant.title)
                .single();
            
            if (existingGrant) {
                console.log(`⚠️ Grant "${grant.title}" already exists, skipping`);
                continue;
            }
            
            const deadlineMatch = grant.deadline ? String(grant.deadline).match(/(\d{4}-\d{2}-\d{2})/) : null;
            const deadlineToInsert = deadlineMatch ? deadlineMatch[0] : null;
            const fundingAmount = parseFundingAmount(grant.funding_amount_text);

            // Insert new grant
            const { data: grantResult, error } = await supabase
                .from('grants')
                .insert({
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
                })
                .select('id')
                .single();
            
            if (error) throw error;
            
            console.log(`✅ Grant saved: "${grant.title}" (ID: ${grantResult.id})`);
            savedCount++;

            // Add categories if provided
            if (grant.categories && Array.isArray(grant.categories)) {
                for (const categoryName of grant.categories) {
                    const categoryId = await getOrCreateCategory(categoryName);
                    if (categoryId) {
                        await supabase
                            .from('grant_categories')
                            .insert({ grant_id: grantResult.id, category_id: categoryId });
                        console.log(`🏷️ Added category: ${categoryName}`);
                    }
                }
            }
            
        } catch (err) {
            console.error(`❗ Error saving "${grant.title}":`, err.message);
        }
    }
    return savedCount;
}

export const handler = async function(event, context) {
    const authHeader = event.headers.authorization || '';
    const token = authHeader.split(' ')[1];

    if (token !== process.env.WORKER_SHARED_SECRET) {
        console.log('❌ Unauthorized access attempt');
        return { statusCode: 401, body: 'Unauthorized' };
    }

    try {
        const payload = JSON.parse(event.body);
        const { url, submissionId } = payload;

        if (!url || !submissionId) {
            throw new Error("Missing url or submissionId in payload.");
        }

        console.log(`🚀 Starting processing for submission ${submissionId}: ${url}`);

        // Update status to processing
        await supabase.from('grant_submissions').update({ status: 'processing' }).eq('id', submissionId);
        console.log(`✅ Updated status to processing`);

        // Fetch the webpage
        console.log(`🌐 Fetching webpage: ${url}`);
        const response = await fetch(url);
        const html = await response.text();
        console.log(`✅ Fetched ${html.length} characters of HTML`);
        
        // Basic text extraction (remove HTML tags)
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`✅ Extracted ${text.length} characters of text`);
        
        if (text.length < 200) {
            throw new Error('Insufficient content found on the page.');
        }

        // Use AI to analyze content
        console.log(`🤖 Sending to AI for analysis...`);
        const prompt = `
        Analyze this webpage content for grant opportunities. Extract any grants mentioned.
        
        For each grant, return JSON with:
        {
            "funder_name": "Organization name",
            "title": "Grant name", 
            "description": "Grant description",
            "deadline": "YYYY-MM-DD if found",
            "funding_amount_text": "Amount text if found",
            "eligibility_criteria": "Who can apply",
            "grant_type": "Type of grant",
            "categories": ["Focus areas if mentioned"]
        }
        
        Return array of grants or empty array if none found.
        
        Content: ${text.substring(0, 50000)}
        `;

        const result = await model.generateContent(prompt);
        const response_text = result.response.text();
        console.log(`✅ AI response received: ${response_text.length} characters`);
        
        // Parse JSON from AI response
        let grants = [];
        try {
            const jsonMatch = response_text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                grants = JSON.parse(jsonMatch[0]);
                console.log(`✅ Parsed ${grants.length} grants from AI response`);
            } else {
                console.log(`⚠️ No JSON array found in AI response`);
            }
        } catch (e) {
            console.log(`⚠️ Could not parse AI response as JSON: ${e.message}`);
            console.log(`Raw AI response: ${response_text}`);
        }

        // Save grants to database
        let savedCount = 0;
        if (grants.length > 0) {
            console.log(`💾 Saving ${grants.length} grants to database...`);
            savedCount = await saveGrantsToSupabase(grants, url);
            console.log(`✅ Database operation complete: ${savedCount} grants saved`);
        }

        // Update final status
        const finalMessage = savedCount > 0 
            ? `Processing complete. Found and saved ${savedCount} grant(s).`
            : grants.length > 0 
                ? 'Grants found but already exist in database.' 
                : 'No grant opportunities found after analysis.';

        const finalStatus = savedCount > 0 ? 'success' : 'failed';

        await supabase
            .from('grant_submissions')
            .update({ 
                status: finalStatus, 
                error_message: finalMessage 
            })
            .eq('id', submissionId);

        console.log(`🎉 Processing complete! Status: ${finalStatus}`);
        console.log(`📊 Final results: Found ${grants.length} grants, saved ${savedCount} to database`);

        return {
            statusCode: 202,
            body: JSON.stringify({ 
                message: "Processing complete",
                grantsFound: grants.length,
                grantsSaved: savedCount,
                status: finalStatus
            }),
        };

    } catch (error) {
        console.error(`💥 Error processing submission:`, error.message);
        
        // Update submission status to failed
        try {
            await supabase
                .from('grant_submissions')
                .update({ status: 'failed', error_message: error.message })
                .eq('id', submissionId);
        } catch (updateError) {
            console.error(`💥 Failed to update submission status:`, updateError.message);
        }
        
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message }),
        };
    }
};