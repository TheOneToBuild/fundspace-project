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
    
    const cleaned = String(text).toLowerCase().replace(/[\$,]/g, '');
    
    // Handle "million" amounts
    const millionMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:million|m)/);
    if (millionMatch) {
        return Math.floor(parseFloat(millionMatch[1]) * 1000000);
    }
    
    // Handle "thousand" or "k" amounts
    const thousandMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k)/);
    if (thousandMatch) {
        return Math.floor(parseFloat(thousandMatch[1]) * 1000);
    }
    
    // Handle regular dollar amounts
    const numberMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
    return numberMatch ? Math.floor(parseFloat(numberMatch[0])) : null;
}

// Enhanced grant validation with deadline and funding checks
function validateGrant(grant) {
    console.log(`🔍 Validating grant: "${grant.title}"`);
    
    // Check for expired deadlines
    if (grant.deadline) {
        try {
            const deadlineMatch = String(grant.deadline).match(/(\d{4}-\d{2}-\d{2})/);
            if (deadlineMatch) {
                const deadlineDate = new Date(deadlineMatch[0]);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (deadlineDate < today) {
                    console.log(`⚠️ Skipping expired grant "${grant.title}" - deadline: ${grant.deadline}`);
                    return false;
                }
            }
        } catch (e) {
            console.log(`⚠️ Could not parse deadline for "${grant.title}": ${grant.deadline}`);
        }
    }
    
    // Check funding amount - must have actual funding
    const hasValidFunding = grant.funding_amount_text && 
                           grant.funding_amount_text !== '$0' && 
                           grant.funding_amount_text !== '0' &&
                           !grant.funding_amount_text.toLowerCase().includes('contact for') &&
                           !grant.funding_amount_text.toLowerCase().includes('varies') &&
                           !grant.funding_amount_text.toLowerCase().includes('tbd');
    
    const fundingAmount = parseFundingAmount(grant.funding_amount_text);
    const hasNumericFunding = fundingAmount && fundingAmount > 0;
    
    if (!hasValidFunding && !hasNumericFunding) {
        console.log(`⚠️ Skipping grant "${grant.title}" - no valid funding amount: "${grant.funding_amount_text}"`);
        return false;
    }
    
    // Skip invitation-only grants unless they have substantial funding
    if (grant.title && (grant.title.toLowerCase().includes('invitation') || 
                       grant.title.toLowerCase().includes('invite') ||
                       grant.title.toLowerCase().includes('by invitation only'))) {
        if (!fundingAmount || fundingAmount < 5000) {
            console.log(`⚠️ Skipping invitation-only grant "${grant.title}" - insufficient funding amount`);
            return false;
        }
    }
    
    console.log(`✅ Grant validation passed: "${grant.title}" - $${grant.funding_amount_text}`);
    return true;
}

// Enhanced page discovery with PDF support and intelligent stopping
async function discoverGrantPages(baseUrl) {
    console.log(`🔍 Discovering grant-related pages and PDFs from: ${baseUrl}`);
    
    try {
        const response = await fetch(baseUrl);
        const html = await response.text();
        
        // Extract all internal links including PDFs
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
        
        // Filter for grant-related pages and PDFs
        const grantKeywords = ['grant', 'fund', 'apply', 'application', 'program', 'award', 'eligibility', 'guidelines', 'rfp', 'proposal', 'funding'];
        const relevantHtmlPages = links.filter(url => 
            !url.toLowerCase().endsWith('.pdf') &&
            grantKeywords.some(keyword => url.toLowerCase().includes(keyword))
        );
        
        const relevantPdfs = links.filter(url => 
            url.toLowerCase().endsWith('.pdf') &&
            grantKeywords.some(keyword => url.toLowerCase().includes(keyword))
        );
        
        // Start with base URL, then add up to 9 HTML pages, then up to 5 PDFs
        const pagesToScrape = [baseUrl, ...relevantHtmlPages.slice(0, 9), ...relevantPdfs.slice(0, 5)];
        
        console.log(`📄 Found ${pagesToScrape.length} pages to analyze (${relevantHtmlPages.length} HTML, ${relevantPdfs.slice(0, 5).length} PDFs)`);
        
        return pagesToScrape;
        
    } catch (error) {
        console.log(`⚠️ Page discovery failed: ${error.message}`);
        return [baseUrl]; // Fallback to just base URL
    }
}

// Enhanced content extraction with PDF support, smart stopping, and organization info tracking
async function extractContentFromPages(urls) {
    let combinedContent = '';
    let successfulPages = 0;
    const grantInfo = {
        hasTitle: false,
        hasDescription: false,
        hasEligibility: false,
        hasDeadline: false,
        hasFundingAmount: false,
        hasApplicationUrl: false,
        hasEligibleOrgs: false
    };
    const organizationInfo = {
        hasOrgName: false,
        hasOrgType: false,
        hasOrgDescription: false,
        hasOrgWebsite: false,
        hasOrgLocation: false,
        hasFocusAreas: false
    };

    for (const url of urls) {
        try {
            console.log(`📄 Fetching: ${url.substring(0, 80)}...`);
            
            let text = '';
            if (url.toLowerCase().endsWith('.pdf')) {
                console.log(`📋 Processing PDF: ${url}`);
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                text = new TextDecoder('utf-8').decode(uint8Array)
                    .replace(/[^\x20-\x7E\n]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            } else {
                const response = await fetch(url);
                const html = await response.text();
                text = html
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            if (text.length > 200) {
                combinedContent += `\n\n--- Content from ${url} ---\n\n${text}`;
                successfulPages++;

                const lowerText = text.toLowerCase();
                if (!grantInfo.hasTitle && (lowerText.includes('grant') || lowerText.includes('funding'))) grantInfo.hasTitle = true;
                if (!grantInfo.hasDescription && lowerText.length > 500) grantInfo.hasDescription = true;
                if (!grantInfo.hasEligibility && (lowerText.includes('eligible') || lowerText.includes('nonprofit'))) grantInfo.hasEligibility = true;
                if (!grantInfo.hasDeadline && (lowerText.includes('deadline') || lowerText.includes('due'))) grantInfo.hasDeadline = true;
                if (!grantInfo.hasFundingAmount && (lowerText.includes('$') || lowerText.includes('amount'))) grantInfo.hasFundingAmount = true;
                if (!grantInfo.hasApplicationUrl && (lowerText.includes('apply') || lowerText.includes('application'))) grantInfo.hasApplicationUrl = true;
                if (!grantInfo.hasEligibleOrgs && (lowerText.includes('organization') || lowerText.includes('501'))) grantInfo.hasEligibleOrgs = true;

                if (!organizationInfo.hasOrgDescription && (lowerText.includes('mission') || lowerText.includes('about us') || lowerText.includes('our organization'))) {
                    organizationInfo.hasOrgDescription = true;
                    console.log(`📋 Found organization description indicators on page ${successfulPages}`);
                }
                if (!organizationInfo.hasOrgLocation && (lowerText.includes('headquarters') || lowerText.includes('based in') || lowerText.includes('located'))) {
                    organizationInfo.hasOrgLocation = true;
                    console.log(`📍 Found organization location indicators on page ${successfulPages}`);
                }
                if (!organizationInfo.hasFocusAreas && (lowerText.includes('focus area') || lowerText.includes('program area') || lowerText.includes('we fund'))) {
                    organizationInfo.hasFocusAreas = true;
                    console.log(`🎯 Found organization focus areas on page ${successfulPages}`);
                }
                if (!organizationInfo.hasOrgType && (lowerText.includes('foundation') || lowerText.includes('501(c)') || lowerText.includes('nonprofit') || lowerText.includes('government'))) {
                    organizationInfo.hasOrgType = true;
                    console.log(`🏢 Found organization type indicators on page ${successfulPages}`);
                }

                const essentialInfoCount = Object.values(grantInfo).filter(Boolean).length;
                const orgInfoCount = Object.values({
                    hasOrgDescription: organizationInfo.hasOrgDescription,
                    hasOrgLocation: organizationInfo.hasOrgLocation,
                    hasFocusAreas: organizationInfo.hasFocusAreas,
                    hasOrgType: organizationInfo.hasOrgType
                }).filter(Boolean).length;

                if (successfulPages >= 3 && essentialInfoCount >= 5 && orgInfoCount >= 2) {
                    console.log(`✅ Found comprehensive grant (${essentialInfoCount}/7) and organization info (${orgInfoCount}/4), stopping early after ${successfulPages} pages`);
                    break;
                }
                if (successfulPages >= 15) {
                    console.log(`⏹️ Reached maximum page limit (15), stopping`);
                    break;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log(`⚠️ Failed to fetch ${url}: ${error.message}`);
        }
    }

    console.log(`✅ Successfully extracted content from ${successfulPages}/${urls.length} pages`);
    console.log(`📊 Grant completeness: ${Object.values(grantInfo).filter(Boolean).length}/7 categories found`);
    console.log(`🏢 Organization completeness: ${Object.values({
        hasOrgDescription: organizationInfo.hasOrgDescription,
        hasOrgLocation: organizationInfo.hasOrgLocation,
        hasFocusAreas: organizationInfo.hasFocusAreas,
        hasOrgType: organizationInfo.hasOrgType
    }).filter(Boolean).length}/4 categories found`);
    
    return { content: combinedContent, successfulPages, grantInfo, organizationInfo };
}

// Basic organization creation/update
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

// Enhanced organization creation/update with comprehensive data
async function getOrCreateOrganizationEnhanced(orgData, primaryUrl) {
    if (!orgData?.name) {
        console.error(`⚠️ Organization data missing or invalid`);
        return null;
    }
    
    console.log(`🏢 Processing enhanced organization data for: ${orgData.name}`);
    
    // First try to find existing organization
    const { data: existing } = await supabase
        .from('organizations')
        .select('id, name, description, website, location, extended_data')
        .eq('name', orgData.name)
        .single();
    
    if (existing) {
        console.log(`🔍 Found existing organization: ${existing.name} (ID: ${existing.id})`);
        
        // Update existing organization with new comprehensive data
        const updates = {
            updated_at: new Date().toISOString()
        };
        
        // Only update fields that are missing or significantly improved
        if (orgData.description && (!existing.description || orgData.description.length > (existing.description?.length || 0) * 1.5)) {
            updates.description = orgData.description;
            console.log(`📝 Updating description (${existing.description?.length || 0} → ${orgData.description.length} chars)`);
        }
        
        if (orgData.website && !existing.website) {
            updates.website = orgData.website;
            console.log(`🌐 Adding website: ${orgData.website}`);
        }
        
        if (orgData.location && !existing.location) {
            updates.location = orgData.location;
            console.log(`📍 Adding location: ${orgData.location}`);
        }
        
        if (orgData.type && orgData.type !== 'funder') {
            updates.type = orgData.type;
            console.log(`🏷️ Updating type: ${orgData.type}`);
        }
        
        // Update additional fields with sanitization
        if (orgData.taxonomy_code) {
            updates.taxonomy_code = orgData.taxonomy_code;
            console.log(`➕ Adding taxonomy_code: ${orgData.taxonomy_code}`);
        }
        
        if (orgData.annual_budget) {
            // Sanitize annual_budget
            if (typeof orgData.annual_budget === 'string') {
                const budgetMatch = String(orgData.annual_budget).match(/\d+/);
                updates.annual_budget = budgetMatch ? parseInt(budgetMatch[0]) : null;
            } else {
                updates.annual_budget = orgData.annual_budget;
            }
            console.log(`➕ Adding annual_budget: ${updates.annual_budget}`);
        }
        
        if (orgData.year_founded) {
            // CRITICAL FIX: Sanitize year_founded to extract only the numeric year
            const yearMatch = String(orgData.year_founded).match(/\b(19|20)\d{2}\b/);
            updates.year_founded = yearMatch ? parseInt(yearMatch[0]) : null;
            
            if (updates.year_founded) {
                console.log(`📅 Extracted year founded: ${updates.year_founded} from "${orgData.year_founded}"`);
            } else {
                console.log(`⚠️ Could not extract valid year from: "${orgData.year_founded}"`);
            }
        }
        
        if (orgData.staff_count) {
            // Sanitize staff_count
            if (typeof orgData.staff_count === 'string') {
                const staffMatch = String(orgData.staff_count).match(/\d+/);
                updates.staff_count = staffMatch ? parseInt(staffMatch[0]) : null;
            } else {
                updates.staff_count = orgData.staff_count;
            }
            console.log(`➕ Adding staff_count: ${updates.staff_count}`);
        }
        
        // Handle extended data (focus areas, contact info, etc.)
        if (orgData.focus_areas?.length || orgData.geographic_scope?.length || orgData.contact_info) {
            const currentExtended = existing.extended_data || {};
            const newExtended = { ...currentExtended };
            
            if (orgData.focus_areas?.length) {
                newExtended.focus_areas = orgData.focus_areas;
                console.log(`🎯 Adding focus areas: ${orgData.focus_areas.join(', ')}`);
            }
            
            if (orgData.geographic_scope?.length) {
                newExtended.geographic_scope = orgData.geographic_scope;
                console.log(`🗺️ Adding geographic scope: ${orgData.geographic_scope.join(', ')}`);
            }
            
            if (orgData.contact_info) {
                newExtended.contact_info = { ...currentExtended.contact_info, ...orgData.contact_info };
                console.log(`📞 Adding contact information`);
            }
            
            updates.extended_data = newExtended;
        }
        
        // Apply updates if there are any
        if (Object.keys(updates).length > 1) { // More than just updated_at
            const { error: updateError } = await supabase
                .from('organizations')
                .update(updates)
                .eq('id', existing.id);
            
            if (updateError) {
                console.error(`❗ Error updating organization: ${updateError.message}`);
            } else {
                console.log(`✅ Successfully updated organization with ${Object.keys(updates).length - 1} new fields`);
            }
        } else {
            console.log(`ℹ️ No significant updates needed for existing organization`);
        }
        
        return existing.id;
    }
    
    // Create new organization with comprehensive data
    console.log(`🆕 Creating new organization with comprehensive data: ${orgData.name}`);
    
    const newOrgData = {
        name: orgData.name,
        type: orgData.type || 'funder',
        slug: orgData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        description: orgData.description || null,
        website: orgData.website || primaryUrl,
        location: orgData.location || null,
        taxonomy_code: orgData.taxonomy_code || null,
        extended_data: {
            focus_areas: orgData.focus_areas || [],
            geographic_scope: orgData.geographic_scope || [],
            contact_info: orgData.contact_info || {},
            last_comprehensive_update: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    // CRITICAL FIX: Sanitize numeric fields before insertion
    if (orgData.annual_budget) {
        if (typeof orgData.annual_budget === 'string') {
            const budgetMatch = String(orgData.annual_budget).match(/\d+/);
            newOrgData.annual_budget = budgetMatch ? parseInt(budgetMatch[0]) : null;
        } else {
            newOrgData.annual_budget = orgData.annual_budget;
        }
    } else {
        newOrgData.annual_budget = null;
    }
    
    if (orgData.year_founded) {
        // Extract only the first 4-digit year from strings like "2007 (Investing in Artists program)"
        const yearMatch = String(orgData.year_founded).match(/\b(19|20)\d{2}\b/);
        newOrgData.year_founded = yearMatch ? parseInt(yearMatch[0]) : null;
        
        if (newOrgData.year_founded) {
            console.log(`📅 Extracted year founded: ${newOrgData.year_founded} from "${orgData.year_founded}"`);
        } else {
            console.log(`⚠️ Could not extract valid year from: "${orgData.year_founded}"`);
        }
    } else {
        newOrgData.year_founded = null;
    }
    
    if (orgData.staff_count) {
        if (typeof orgData.staff_count === 'string') {
            const staffMatch = String(orgData.staff_count).match(/\d+/);
            newOrgData.staff_count = staffMatch ? parseInt(staffMatch[0]) : null;
        } else {
            newOrgData.staff_count = orgData.staff_count;
        }
    } else {
        newOrgData.staff_count = null;
    }
    
    const { data: newOrg, error: insertError } = await supabase
        .from('organizations')
        .insert(newOrgData)
        .select('id')
        .single();
    
    if (insertError) {
        console.error(`❗ Error creating organization: ${insertError.message}`);
        return null;
    }
    
    console.log(`✅ Created comprehensive organization: ${orgData.name} (ID: ${newOrg.id})`);
    console.log(`📊 Organization data completeness: ${Object.values(newOrgData).filter(v => v !== null && v !== undefined).length}/12 fields populated`);
    
    return newOrg.id;
}

// Location handling functions
async function getOrCreateLocation(locationName) {
    if (!locationName) return null;
    
    // First try to find existing location
    const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', locationName)
        .single();
    
    if (existing) return existing.id;
    
    // Create new location
    const { data, error } = await supabase
        .from('locations')
        .insert({ name: locationName })
        .select('id')
        .single();
    
    if (error) {
        console.error(`Error creating location "${locationName}":`, error.message);
        return null;
    }
    
    return data?.id;
}

async function linkGrantToLocations(grantId, locationNames) {
    if (!grantId || !locationNames?.length) return;

    let processedLocations = locationNames.flatMap(loc => 
        loc.toLowerCase().includes('bay area') || loc.toLowerCase().includes('nine county') || loc.toLowerCase().includes('9 county')
            ? ['Alameda County', 'Contra Costa County', 'Marin County', 'Napa County', 'San Francisco County', 'San Mateo County', 'Santa Clara County', 'Solano County', 'Sonoma County']
            : [loc]
    );
    
    processedLocations = [...new Set(processedLocations)];
    
    console.log(`📍 Linking grant to ${processedLocations.length} locations: ${processedLocations.join(', ')}`);

    for (const locationName of processedLocations) {
        const locationId = await getOrCreateLocation(locationName.trim());
        if (locationId) {
            const { error } = await supabase
                .from('grant_locations')
                .insert({ grant_id: grantId, location_id: locationId });
            
            if (error && !error.message.includes('already exists')) {
                console.error(`Error linking location "${locationName}":`, error.message);
            }
        }
    }
}

async function linkGrantToEligibleTaxonomies(grantId, taxonomyCodes) {
    if (!grantId || !taxonomyCodes?.length) return;
    
    console.log(`🏷️ Linking grant to ${taxonomyCodes.length} taxonomy codes: ${taxonomyCodes.join(', ')}`);
    
    for (const taxonomyCode of taxonomyCodes) {
        const { error } = await supabase
            .from('grant_eligible_taxonomies')
            .insert({ grant_id: grantId, taxonomy_code: taxonomyCode });
        
        if (error && !error.message.includes('already exists')) {
            console.error(`Error linking taxonomy "${taxonomyCode}":`, error.message);
        }
    }
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

// Extract location information from grant content
function extractLocationInfo(description, eligibility_criteria, grantTitle) {
    const text = `${description || ''} ${eligibility_criteria || ''} ${grantTitle || ''}`.toLowerCase();
    
    if (text.includes('bay area') || text.includes('nine county') || text.includes('9 county') || 
        text.includes('san francisco bay') || text.includes('all bay area counties')) {
        return ['San Francisco Bay Area'];
    }

    const locationMappings = {
        'San Francisco County': ['san francisco', 'sf'],
        'Alameda County': ['alameda', 'oakland', 'berkeley', 'fremont'],
        'Santa Clara County': ['santa clara', 'san jose', 'palo alto', 'mountain view'],
        'San Mateo County': ['san mateo', 'redwood city', 'menlo park'],
        'Contra Costa County': ['contra costa', 'richmond', 'concord'],
        'Marin County': ['marin', 'san rafael', 'novato'],
        'Solano County': ['solano', 'vallejo', 'fairfield'],
        'Napa County': ['napa'],
        'Sonoma County': ['sonoma', 'santa rosa', 'petaluma']
    };

    const locations = Object.entries(locationMappings)
        .filter(([_, terms]) => terms.some(term => text.includes(term)))
        .map(([county]) => county);

    return locations.length > 0 ? locations : ['San Francisco Bay Area'];
}

// Enhanced eligibility extraction using proper taxonomy codes
function extractEligibilityTypes(description, eligibility_criteria) {
    const text = `${description || ''} ${eligibility_criteria || ''}`.toLowerCase();
    const mappings = {
        'nonprofit.501c3': ['501(c)(3)', '501c3', 'tax-exempt', 'nonprofit', 'non-profit'],
        'nonprofit.service': ['service organization', 'direct service', 'community service'],
        'nonprofit.advocacy': ['advocacy', 'policy', 'social change'],
        'government.local': ['local government', 'city', 'municipal', 'county'],
        'government.state': ['state government', 'state agency', 'state department'],
        'government.federal': ['federal', 'federal agency', 'federal government'],
        'government.schools': ['schools', 'school district', 'educational institution', 'universities', 'colleges'],
        'foundation.private': ['private foundation', 'family foundation'],
        'foundation.community': ['community foundation'],
        'foundation.corporate': ['corporate foundation'],
        'for_profit.small': ['small business', 'startup', 'entrepreneur'],
        'for_profit.large': ['corporation', 'large business', 'enterprise'],
        'individual': ['individual', 'artists', 'researchers', 'students', 'scholars'],
        'collaborative': ['collaborative', 'partnerships', 'coalitions', 'consortium'],
        'faith_based': ['faith-based', 'religious', 'church', 'synagogue', 'mosque']
    };

    const eligibilityTypes = Object.entries(mappings)
        .filter(([_, terms]) => terms.some(term => text.includes(term)))
        .map(([code]) => code);

    return eligibilityTypes.length > 0 ? eligibilityTypes : ['nonprofit.501c3'];
}

async function saveGrantsToSupabase(grants, primaryUrl, organizationId) {
    if (!grants?.length || !organizationId) {
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
            const fundingAmount = parseFundingAmount(grant.funding_amount_text);
            const eligibilityTypes = extractEligibilityTypes(grant.description, grant.eligibility_criteria);
            const grantLocations = extractLocationInfo(grant.description, grant.eligibility_criteria, grant.title);

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
                    deadline: deadlineMatch ? deadlineMatch[0] : null,
                    eligibility_criteria: grant.eligibility_criteria,
                    grant_type: grant.grant_type,
                    eligible_organization_types: eligibilityTypes,
                    slug: generateSlug(grant.funder_name, grant.title),
                    date_added: new Date().toISOString().split('T')[0],
                    last_updated: new Date().toISOString()
                })
                .select('id')
                .single();
            
            if (error) throw error;
            
            console.log(`✅ Grant saved: "${grant.title}" (ID: ${grantResult.id})`);
            console.log(`📋 Eligibility: ${eligibilityTypes.join(', ')}`);
            savedCount++;

            // Link grant to locations
            await linkGrantToLocations(grantResult.id, grantLocations);
            
            // Link grant to eligible taxonomies
            await linkGrantToEligibleTaxonomies(grantResult.id, eligibilityTypes);

            // Add categories if provided
            if (grant.categories?.length) {
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
        const { content: combinedContent, successfulPages } = await extractContentFromPages(pagesToScrape);
        
        console.log(`✅ Extracted ${combinedContent.length} characters from ${pagesToScrape.length} pages`);
        
        if (combinedContent.length < 300) {
            throw new Error('Insufficient content found across all discovered pages.');
        }

        // Enhanced AI analysis with comprehensive prompt and examples
        console.log(`🤖 Sending to AI for comprehensive grant and organization analysis...`);
        const prompt = `
Analyze the following content for BOTH active grant opportunities AND detailed organization information.

### PART 1: GRANT EXTRACTION
Extract ACTIVE grants with confirmed funding amounts and future deadlines:
- Include grants with specific funding amounts (e.g., "$50,000", "$10K-$25K", "$4.4 million").
- Exclude grants with $0, "varies", "TBD", or past deadlines.
- Exclude invitation-only grants unless funding >$5,000.
- If funding says "over $X million" or "awarded $X million", use the X amount as max funding.

### PART 2: ORGANIZATION EXTRACTION
Extract comprehensive organization details:
{
    "name": "Organization name",
    "type": "foundation/nonprofit/government/corporate",
    "description": "Detailed mission/purpose (200+ characters)",
    "website": "Official website URL",
    "location": "City, State or full address",
    "focus_areas": ["Education", "Health", "Environment"],
    "annual_budget": "Budget information if found",
    "year_founded": "Year established if mentioned",
    "staff_count": "Number of employees if found",
    "geographic_scope": ["Counties/regions served"],
    "contact_info": {
        "email": "Contact email",
        "phone": "Phone number",
        "address": "Physical address"
    }
}

### EXAMPLES
Grant Example:
{
    "funder_name": "ABC Foundation",
    "title": "Community Development Grant",
    "description": "Funding for community projects focused on education and health.",
    "deadline": "2025-12-31",
    "funding_amount_text": "$50,000",
    "eligibility_criteria": "Nonprofits with 501(c)(3) status",
    "application_url": "https://example.com/apply",
    "grant_type": "Project",
    "categories": ["Education", "Health"],
    "eligible_organization_types": ["nonprofit", "501c3"]
}

Organization Example:
{
    "name": "ABC Foundation",
    "type": "foundation",
    "description": "A nonprofit organization focused on community development.",
    "website": "https://abcfoundation.org",
    "location": "San Francisco, CA",
    "focus_areas": ["Education", "Health"],
    "annual_budget": "$10 million",
    "year_founded": "1995",
    "staff_count": "50",
    "geographic_scope": ["California", "Nevada"],
    "contact_info": {
        "email": "info@abcfoundation.org",
        "phone": "123-456-7890",
        "address": "123 Main St, San Francisco, CA"
    }
}

Return JSON with TWO sections:
{
    "grants": [
        {
            "funder_name": "Organization name",
            "title": "Grant name",
            "description": "Detailed description (100+ chars)",
            "deadline": "YYYY-MM-DD or null if rolling",
            "funding_amount_text": "Exact dollar amounts",
            "eligibility_criteria": "Specific requirements",
            "application_url": "Direct application link",
            "grant_type": "Operating/Project/etc",
            "categories": ["Focus areas"],
            "eligible_organization_types": ["nonprofit", "501c3", etc.]
        }
    ],
    "organization": {
        /* Organization details as specified above */
    }
}

CRITICAL: Extract ALL available organization information from across ALL pages.
Look for About Us, Mission, Contact, Staff, History sections in both HTML and PDF content.

Content from ${pagesToScrape.length} pages: ${combinedContent.substring(0, 150000)}
        `;

        const result = await model.generateContent(prompt);
        const response_text = result.response.text();
        console.log(`✅ AI response received: ${response_text.length} characters`);
        
        // Parse JSON from AI response for both grants and organization
        let grants = [];
        let organizationData = null;
        try {
            const jsonMatch = response_text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiResponse = JSON.parse(jsonMatch[0]);
                grants = aiResponse.grants || [];
                organizationData = aiResponse.organization || null;
                console.log(`✅ Parsed ${grants.length} grants and organization data from AI response`);
            } else {
                console.log(`⚠️ No JSON object found in AI response`);
            }
        } catch (e) {
            console.log(`⚠️ Could not parse AI response as JSON: ${e.message}`);
            console.log(`Raw AI response: ${response_text}`);
        }

        // Save grants to database and update organization
        let savedCount = 0;
        if (grants.length > 0 || organizationData) {
            console.log(`💾 Processing ${grants.length} grants and organization data...`);
            
            // Get or create organization with enhanced data
            let organizationId;
            if (organizationData?.name) {
                console.log(`🏢 Processing organization: ${organizationData.name}`);
                organizationId = await getOrCreateOrganizationEnhanced(organizationData, url);
            } else if (grants.length > 0) {
                // Fallback to basic organization creation from grants
                const organization = await getOrCreateOrganization(
                    grants[0].funder_name, 
                    new URL(url).origin
                );
                organizationId = organization.id;
            }
            
            if (organizationId && grants.length > 0) {
                savedCount = await saveGrantsToSupabase(grants, url, organizationId);
            }
            
            console.log(`✅ Database operation complete: ${savedCount} grants saved, organization updated`);
        }

        // Update final status
        const finalMessage = savedCount > 0 
            ? `Enhanced processing complete. Found and saved ${savedCount} qualifying grant(s) from ${pagesToScrape.length} pages.`
            : grants.length > 0 
                ? 'Grants found but did not meet funding/eligibility criteria.' 
                : 'No grant opportunities found after comprehensive analysis.';

        const finalStatus = savedCount > 0 ? 'success' : 'failed';

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
                pagesAnalyzed: successfulPages,
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