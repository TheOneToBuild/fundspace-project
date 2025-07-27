// netlify/functions/process-grant-submission-background.js

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const handler = async function(event, context) {
    // Security check
    const authHeader = event.headers.authorization || '';
    const token = authHeader.split(' ')[1];

    if (token !== process.env.WORKER_SHARED_SECRET) {
        return {
            statusCode: 401,
            body: 'Unauthorized',
        };
    }

    try {
        const payload = JSON.parse(event.body);
        const { url, submissionId } = payload;

        if (!url || !submissionId) {
            throw new Error("Missing url or submissionId in payload.");
        }

        console.log(`Processing submission ${submissionId}: ${url}`);

        // Update status to processing
        await supabase.from('grant_submissions').update({ status: 'processing' }).eq('id', submissionId);

        // Simple fetch without browser for now
        const response = await fetch(url);
        const html = await response.text();
        
        // Basic text extraction (remove HTML tags)
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (text.length < 200) {
            throw new Error('Insufficient content found on the page.');
        }

        // Use AI to extract grant info from the text
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
        
        // Try to parse JSON from response
        let grants = [];
        try {
            const jsonMatch = response_text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                grants = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.log('Could not parse AI response as JSON');
        }

        if (grants.length === 0) {
            throw new Error('No grant opportunities found after analysis.');
        }

        // For now, just mark as success - you can add database saving later
        await supabase
            .from('grant_submissions')
            .update({ 
                status: 'success', 
                error_message: `Found ${grants.length} potential grant(s). Manual review needed.` 
            })
            .eq('id', submissionId);

        return {
            statusCode: 202,
            body: JSON.stringify({ message: "Processing complete" }),
        };

    } catch (error) {
        console.error(`Error processing submission:`, error.message);
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