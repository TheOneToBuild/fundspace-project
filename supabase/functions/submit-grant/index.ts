// supabase/functions/submit-grant/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove common tracking parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid'].forEach(param => {
      parsed.searchParams.delete(param);
    });
    // Remove trailing slash from pathname and remove fragments
    return parsed.origin + parsed.pathname.replace(/\/$/, '') + parsed.search;
  } catch {
    // Fallback for invalid URLs, though we validate before this
    return url.toLowerCase().trim();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, notes } = await req.json();
    
    // 1. Validate URL
    if (!url) {
      throw new Error("A valid URL is required.");
    }
    try {
      new URL(url);
    } catch (_) {
      throw new Error("The provided URL is not valid.");
    }
    
    // 2. Create a Supabase client with the user's auth context to get user ID
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await userSupabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: You must be logged in to submit a grant.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Use the Service Role Key for admin-level queries
    const serviceSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 3. Check for daily submission limit (rate limiting)
    const { count, error: countError } = await serviceSupabaseClient
      .from('grant_submissions')
      .select('id', { count: 'exact', head: true }) // head: true makes it faster
      .eq('user_id', user.id)
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z'); // Today in UTC

    if (countError) throw countError;

    if (count && count >= 10) {
      return new Response(JSON.stringify({ error: 'Daily submission limit reached (10 per day).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429, // Too Many Requests
      });
    }

    // 4. Normalize URL and check for recent duplicates
    const normalizedUrl = normalizeUrl(url);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingSubmission, error: duplicateCheckError } = await serviceSupabaseClient
      .from('grant_submissions')
      .select('id, status, created_at')
      .eq('normalized_url', normalizedUrl)
      .gte('created_at', thirtyDaysAgo)
      .maybeSingle(); // Use maybeSingle to avoid error if no row is found

    if (duplicateCheckError) throw duplicateCheckError;

    if (existingSubmission) {
      return new Response(JSON.stringify({ error: 'This URL was already submitted recently.', existing: existingSubmission }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // 409 Conflict
      });
    }
    
    // 5. Insert new submission record
    const { data: submission, error: insertError } = await serviceSupabaseClient
      .from('grant_submissions')
      .insert({ url, normalized_url: normalizedUrl, notes, user_id: user.id, status: 'pending_review' })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // IMPORTANT: Trigger the backend worker
    // This URL is a placeholder for where you host your worker script.
    // This could be a Google Cloud Run, AWS Lambda, or a simple server.
    const WORKER_URL = Deno.env.get('GRANT_PROCESSOR_WORKER_URL'); 
    const WORKER_SECRET = Deno.env.get('WORKER_SHARED_SECRET');

    if (!WORKER_URL) {
        console.error("GRANT_PROCESSOR_WORKER_URL is not set. Cannot trigger worker.");
        // The status is already 'pending_review', so it can be manually processed later.
    } else {
         // We use `fetch` but don't wait for the response to keep this function fast.
        fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WORKER_SECRET}` // For security
            },
            body: JSON.stringify({
                url: url,
                submissionId: submission.id
            }),
        });
    }

    // Immediately respond to the user
    return new Response(JSON.stringify({ 
        submissionId: submission.id, 
        message: "Submission received and is pending review. Thank you for supporting the community!" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202, // 202 Accepted
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});