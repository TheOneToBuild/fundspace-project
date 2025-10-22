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

    // 4. Check for existing submissions with improved logic
    const normalizedUrl = normalizeUrl(url);
    const { data: existingSubmissions, error: existingError } = await serviceSupabaseClient
      .from('grant_submissions')
      .select('id, status, created_at, contribution_points')
      .eq('normalized_url', normalizedUrl)
      .order('created_at', { ascending: false })
      .limit(5); // Get recent submissions

    if (existingError) {
      return new Response(JSON.stringify({ error: 'Database error checking submissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingSubmissions && existingSubmissions.length > 0) {
      const mostRecentSubmission = existingSubmissions[0];
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const mostRecentDate = new Date(mostRecentSubmission.created_at);
      
      // Allow resubmission if:
      // 1. Most recent submission was more than 6 months ago, OR
      // 2. Most recent submission failed (status = 'failed'), OR
      // 3. Most recent submission is still processing (in case of stuck processing)
      const canResubmit = 
        mostRecentDate < sixMonthsAgo || 
        mostRecentSubmission.status === 'failed' ||
        mostRecentSubmission.status === 'processing';
      
      if (!canResubmit) {
        // Check if there's a successful submission
        const successfulSubmission = existingSubmissions.find(sub => sub.status === 'completed');
        
        if (successfulSubmission) {
          const successDate = new Date(successfulSubmission.created_at);
          const daysSinceSuccess = Math.floor((Date.now() - successDate.getTime()) / (1000 * 60 * 60 * 24));
          
          return new Response(JSON.stringify({ 
            error: `This URL was successfully processed ${daysSinceSuccess} days ago and earned ${successfulSubmission.contribution_points || 0} points. You can resubmit URLs after 6 months or if they previously failed.`,
            canRetryAfter: new Date(successDate.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)).toISOString() // 6 months from success
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // If we reach here, resubmission is allowed
      console.log(`📝 Allowing resubmission for ${normalizedUrl}. Reason: ${
        mostRecentDate < sixMonthsAgo ? 'More than 6 months old' :
        mostRecentSubmission.status === 'failed' ? 'Previous submission failed' :
        'Previous submission stuck in processing'
      }`);
    }
    
    // 5. Insert new submission record
    console.log('User authenticated:', user.id);
    console.log('About to insert:', { url, normalized_url: normalizedUrl, notes, user_id: user.id, status: 'pending_review' });

    const { data: submission, error: insertError } = await serviceSupabaseClient
      .from('grant_submissions')
      .insert({ url, normalized_url: normalizedUrl, notes, user_id: user.id, status: 'pending_review' })
      .select('id, user_id, normalized_url') // Select user_id to verify it was inserted
      .single();

    console.log('Insertion result:', submission);
    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // IMPORTANT: Trigger the backend worker
    // This URL is a placeholder for where you host your worker script.
    // This could be a Google Cloud Run, AWS Lambda, or a simple server.
    const WORKER_URL = Deno.env.get('GRANT_PROCESSOR_WORKER_URL'); 
    const WORKER_SECRET = Deno.env.get('WORKER_SHARED_SECRET');

    if (!WORKER_URL) {
        console.error("GRANT_PROCESSOR_WORKER_URL is not set. Cannot trigger worker.");
        // The status is already 'pending_review', so it can be manually processed later.
    } else {
        // Small delay to prevent rapid-fire submissions
        setTimeout(() => {
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
            }).catch(err => console.error('Worker trigger failed:', err));
        }, 100);
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