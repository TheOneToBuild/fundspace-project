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
function generateSlug(organizationName, grantTitle) {
    if (!organizationName || !grantTitle) return null;
    const combined = `${organizationName} ${grantTitle}`;
    return combined.toLowerCase()
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

// Enhanced page discovery to find more relevant content
async function discoverGrantPages(baseUrl) {
    console.log(`🔍 Discovering grant-related pages from: ${baseUrl}`);
    
    try {
        const response = await fetch(baseUrl);
        const html = await response.text();
        
        // Extract all internal links
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
        const links = [];
        let match;
        
        while ((match = linkRegex.exec(html)) !== null) {
            const href = match[1];
            if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
                try {
                    const fullUrl = new URL(href, baseUrl).href;
                    if (fullUrl.includes(new URL(baseUrl).hostname)) {
                        links.push(fullUrl);
                    }
                } catch (e) {
                    // Skip invalid URLs
                }
            }
        }
        
        // Filter for grant-related pages
        const grantKeywords = ['grant', 'fund', 'apply', 'application', 'program', 'award', 'eligibility', 'guidelines', 'rfp', 'proposal', 'funding'];
        const relevantPages = links.filter(url => 
            grantKeywords.some(keyword => url.toLowerCase().includes(keyword))
        );
        
        // Return base URL plus up to 5 most relevant pages
        const pagesToScrape = [baseUrl, ...relevantPages.slice(0, 5)];
        console.log(`📄 Found ${pagesToScrape.length} pages to analyze: ${pagesToScrape.slice(0, 3).join(', ')}${pagesToScrape.length > 3 ? '...' : ''}`);
        
        return pagesToScrape;
        
    } catch (error) {
        console.log(`⚠️ Page discovery failed: ${error.message}`);
        return [baseUrl]; // Fallback to just base URL
    }
}

// Enhanced content extraction from multiple pages
async function extractContentFromPages(urls) {
    let combinedContent = '';
    let successfulPages = 0;
    
    for (const url of urls) {
        try {
            console.log(`📄 Fetching: ${url.substring(0, 60)}...`);
            const response = await fetch(url);
            const html = await response.text();
            
            // Basic text extraction (remove HTML tags but keep structure)
            const text = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (text.length > 200) {
                combinedContent += `\n\n--- Content from ${url} ---\n\n${text}`;
                successfulPages++;
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.log(`⚠️ Failed to fetch ${url}: ${error.message}`);
        }
    }
    
    console.log(`✅ Successfully extracted content from ${successfulPages}/${urls.length} pages`);
    return combinedContent;
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
            slug: name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'), 
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

// Enhanced grant validation
function validateGrant(grant) {
    // Skip grants without funding amounts (except rolling/TBD)
    if (!grant.funding_amount_text || grant.funding_amount_text === '$0' || grant.funding_amount_text === '0') {
        // Allow if it's explicitly stated as rolling or variable
        const allowedNoAmount = ['rolling', 'varies', 'tbd', 'to be determined', 'contact for details'];
        const hasAllowedText = allowedNoAmount.some(term => 
            (grant.funding_amount_text || '').toLowerCase().includes(term) ||
            (grant.description || '').toLowerCase().includes(term)
        );
        
        if (!hasAllowedText) {
            console.log(`⚠️ Skipping grant "${grant.title}" - no funding amount specified`);
            return false;
        }
    }
    
    // Skip invitation-only grants unless they have substantial funding
    if (grant.title && grant.title.toLowerCase().includes('invitation') || 
        grant.title && grant.title.toLowerCase().includes('invite')) {
        const fundingAmount = parseFundingAmount(grant.funding_amount_text);
        if (!fundingAmount || fundingAmount < 5000) {
            console.log(`⚠️ Skipping invitation-only grant "${grant.title}" - insufficient funding amount`);
            return false;
        }
    }
    
    return true;
}

// Enhanced eligibility extraction
function extractEligibilityTypes(description, eligibility_criteria) {
    const text = `${description || ''} ${eligibility_criteria || ''}`.toLowerCase();
    const eligibilityTypes = [];
    
    // Map common terms to taxonomy codes
    const mappings = {
        'nonprofit': ['nonprofit', 'non-profit', 'not-for-profit'],
        'nonprofit.501c3': ['501(c)(3)', '501c3', 'tax-exempt'],
        'individual': ['individual', 'artists', 'researchers', 'students'],
        'government.schools': ['schools', 'educational', 'universities', 'colleges'],
        'government': ['government', 'municipal', 'federal', 'state agencies'],
        'for_profit': ['for-profit', 'businesses', 'companies', 'enterprises'],
        'collaborative': ['collaborative', 'partnerships', 'coalitions']
    };
    
    for (const [code, terms] of Object.entries(mappings)) {
        if (terms.some(term => text.includes(term))) {
            eligibilityTypes.push(code);
        }
    }
    
    return eligibilityTypes.length > 0 ? eligibilityTypes : ['nonprofit']; // Default to nonprofit
}

async function saveGrantsToSupabase(grants, primaryUrl, organizationId) {
    if (!grants || grants.length === 0 || !organizationId) {
        console.log('💾 No grants to save or organizationId missing.');
        return 0;
    }

    let savedCount = 0;
    let skippedCount = 0;

    for (const grant of grants) {
        try {
            // Enhanced validation
            if (!validateGrant(grant)) {
                skippedCount++;
                continue;
            }
            
            console.log(`💾 Processing grant: "${grant.title}"`);
            
            // Check if grant already exists for this organization
            const { data: existingGrant } = await supabase
                .from('grants')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('title', grant.title)
                .single();
            
            if (existingGrant) {
                console.log(`⚠️ Grant "${grant.title}" already exists, skipping`);
                continue;
            }
            
            const deadlineMatch = grant.deadline ? String(grant.deadline).match(/(\d{4}-\d{2}-\d{2})/) : null;
            const deadlineToInsert = deadlineMatch ? deadlineMatch[0] : null;
            const fundingAmount = parseFundingAmount(grant.funding_amount_text);
            
            // Extract eligibility types from grant content
            const eligibilityTypes = extractEligibilityTypes(grant.description, grant.eligibility_criteria);

            // Insert new grant with proper organization-based slug
            const { data: grantResult, error } = await supabase
                .from('grants')
                .insert({
                    organization_id: organizationId,
                    title: grant.title,
                    description: grant.description,
                    status: grant.status || 'Open',
                    application_url: grant.application_url || primaryUrl,
                    max_funding_amount: fundingAmount,
                    funding_amount_text: grant.funding_amount_text,
                    deadline: deadlineToInsert,
                    eligibility_criteria: grant.eligibility_criteria,
                    grant_type: grant.grant_type,
                    eligible_organization_types: eligibilityTypes, // Fixed: Now populating this field
                    slug: generateSlug(grant.funder_name, grant.title), // Fixed: Organization-based slug
                    date_added: new Date().toISOString().split('T')[0],
                    last_updated: new Date().toISOString()
                })
                .select('id')
                .single();
            
            if (error) throw error;
            
            console.log(`✅ Grant saved: "${grant.title}" (ID: ${grantResult.id})`);
            console.log(`📋 Eligibility: ${eligibilityTypes.join(', ')}`);
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
            skippedCount++;
        }
    }
    
    console.log(`💾 Grant processing summary: ${savedCount} saved, ${skippedCount} skipped`);
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

        console.log(`🚀 Starting enhanced processing for submission ${submissionId}: ${url}`);

        // Update status to processing
        await supabase.from('grant_submissions').update({ status: 'processing' }).eq('id', submissionId);
        console.log(`✅ Updated status to processing`);

        // Enhanced multi-page content extraction
        console.log(`🔍 Discovering and extracting content from multiple pages...`);
        const pagesToScrape = await discoverGrantPages(url);
        const combinedContent = await extractContentFromPages(pagesToScrape);
        
        console.log(`✅ Extracted ${combinedContent.length} characters from ${pagesToScrape.length} pages`);
        
        if (combinedContent.length < 300) {
            throw new Error('Insufficient content found across all discovered pages.');
        }

        // Enhanced AI analysis with better eligibility extraction
        console.log(`🤖 Sending to AI for comprehensive analysis...`);
        const prompt = `
        Analyze this multi-page content for grant opportunities. Extract ALL grants with substantial funding amounts.

        For each grant, return JSON with:
        {
            "funder_name": "Organization name",
            "title": "Grant name", 
            "description": "Grant description (detailed)",
            "deadline": "YYYY-MM-DD if found",
            "funding_amount_text": "Amount text (e.g., '$10,000-$50,000')",
            "eligibility_criteria": "Who can apply - be specific about organization types",
            "application_url": "Direct application link if found",
            "grant_type": "Type of grant",
            "status": "Open/Rolling/Closed",
            "categories": ["Focus areas"]
        }

        CRITICAL REQUIREMENTS:
        1. ONLY include grants with funding amounts > $1,000 OR rolling/variable funding
        2. EXCLUDE invitation-only grants unless funding > $5,000
        3. Extract detailed eligibility criteria (nonprofits, individuals, schools, etc.)
        4. Be specific about who can apply in eligibility_criteria field
        5. Return empty array [] if no qualifying grants found

        Content (${pagesToScrape.length} pages): ${combinedContent.substring(0, 120000)}
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
            console.log(`💾 Processing ${grants.length} grants for database saving...`);
            
            // Get or create organization
            const organization = await getOrCreateOrganization(
                grants[0].funder_name, 
                new URL(url).origin
            );
            
            savedCount = await saveGrantsToSupabase(grants, url, organization.id);
            console.log(`✅ Database operation complete: ${savedCount} grants saved`);
        }

        // Update final status
        const finalMessage = savedCount > 0 
            ? `Enhanced processing complete. Found and saved ${savedCount} qualifying grant(s) from ${pagesToScrape.length} pages.`
            : grants.length > 0 
                ? 'Grants found but did not meet funding/eligibility criteria.' 
                : 'No grant opportunities found after comprehensive analysis.';

        const finalStatus = savedCount > 0 ? 'success' : 'failed';

        // Update submission status to completed
        await supabase
            .from('grant_submissions')
            .update({ 
                status: finalStatus === 'success' ? 'completed' : 'failed', 
                error_message: finalMessage 
            })
            .eq('id', submissionId);

        console.log(`🎉 Enhanced processing complete! Status: ${finalStatus === 'success' ? 'completed' : 'failed'}`);
        console.log(`📊 Final results: Found ${grants.length} grants, saved ${savedCount} qualifying grants`);

        return {
            statusCode: 202,
            body: JSON.stringify({ 
                message: "Enhanced processing complete",
                grantsFound: grants.length,
                grantsSaved: savedCount,
                pagesAnalyzed: pagesToScrape.length,
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