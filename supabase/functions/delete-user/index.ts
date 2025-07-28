// 1. First, create the Edge Function file structure in your project:
// supabase/functions/delete-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { userId } = await req.json()
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization token provided' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the user is authenticated and can delete their own account
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    
    if (verifyError || !user || user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete the user from Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'User account deleted successfully' }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/* 
DEPLOYMENT STEPS:

1. Install Supabase CLI (if you haven't already):
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref YOUR_PROJECT_REF

4. Create the function directory structure:
   mkdir -p supabase/functions/delete-user

5. Save this file as:
   supabase/functions/delete-user/index.ts

6. Deploy the function:
   supabase functions deploy delete-user

7. Set environment variables (if not already set):
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

8. Your function will be available at:
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-user

ALTERNATIVE: Manual Upload via Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to Edge Functions in the sidebar
3. Click "Create a new function"
4. Name it "delete-user"
5. Copy and paste this code
6. Click "Save and Deploy"
*/