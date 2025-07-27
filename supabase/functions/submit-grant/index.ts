// supabase/functions/submit-grant/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, notes } = await req.json();

    if (!url || !new URL(url)) {
      throw new Error("A valid URL is required.");
    }
    
    // Use the Service Role Key to bypass RLS for this internal operation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Insert a new record to track the submission, starting in 'processing' state
    const { data: submission, error: insertError } = await supabaseClient
      .from('grant_submissions')
      .insert({ url, notes, status: 'processing' })
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
        // Optionally, you could leave the status as 'pending_review' here.
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
        message: "Submission received and is now being processed. We'll notify you upon completion." 
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