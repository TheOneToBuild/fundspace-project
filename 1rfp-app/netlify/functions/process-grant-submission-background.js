// netlify/functions/process-grant-submission-background.js

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
        
        // Basic text extraction
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`✅ Extracted ${text.length} characters of text`);
        
        if (text.length < 200) {
            throw new Error('Insufficient content found on the page.');
        }

        // Use AI to analyze
        console.log(`🤖 Sending to AI for analysis...`);
        const prompt = `
        Analyze this webpage content for grant opportunities. Extract any grants mentioned.
        
        For each grant, return JSON with:
        {
            "funder_name": "Organization name",
            "title": "Grant name", 
            "description": "Grant description",
            "deadline": "YYYY-MM-DD if found",
            "funding_amount_text": "Amount text if found"
        }
        
        Return array of grants or empty array if none found.
        
        Content: ${text.substring(0, 50000)}
        `;

        const result = await model.generateContent(prompt);
        const response_text = result.response.text();
        console.log(`✅ AI response received: ${response_text.length} characters`);
        
        // Try to parse JSON from response
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
        }

        // Update final status
        const finalMessage = grants.length > 0 
            ? `Found ${grants.length} potential grant(s). Manual review needed.`
            : 'No grant opportunities found after analysis.';

        await supabase
            .from('grant_submissions')
            .update({ 
                status: grants.length > 0 ? 'success' : 'failed', 
                error_message: finalMessage 
            })
            .eq('id', submissionId);

        console.log(`🎉 Processing complete! Status: ${grants.length > 0 ? 'success' : 'failed'}`);

        return {
            statusCode: 202,
            body: JSON.stringify({ message: "Processing complete" }),
        };

    } catch (error) {
        console.error(`💥 Error processing submission:`, error.message);
        await supabase
            .from('grant_submissions')
            .update({ status: 'failed', error_message: error.message })
            .eq('id', submissionId);
        
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message }),
        };
    }
};