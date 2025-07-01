// supabase/functions/grant-alert-sender/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// This is the function that will be executed when the Edge Function is called.
serve(async (req) => {
  try {
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseClient = createClient(
      // Supabase API URL - Automatically available in the Edge Function environment
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase Service Role Key - We use a custom name to avoid conflicts
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get all grants created in the last 24 hours.
    // We assume you have a `created_at` timestamp on your `grants` table.
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: newGrants, error: grantsError } = await supabaseClient
      .from('grants') // ** IMPORTANT: Replace 'grants' with your actual grants table name **
      .select('*')
      .gt('created_at', twentyFourHoursAgo);

    if (grantsError) throw grantsError;
    if (!newGrants || newGrants.length === 0) {
      console.log("No new grants in the last 24 hours. Exiting.");
      return new Response(JSON.stringify({ message: "No new grants" }), { status: 200 });
    }

    console.log(`Found ${newGrants.length} new grants.`);

    // 2. Get all users who want email alerts and have keywords.
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, email_alerts_enabled, alert_keywords, users(email)') // Use the relationship name 'users'
      .eq('email_alerts_enabled', true)
      .not('alert_keywords', 'is', null);

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
        console.log("No users with alerts enabled. Exiting.");
        return new Response(JSON.stringify({ message: "No users with alerts enabled" }), { status: 200 });
    }

    console.log(`Found ${users.length} users with alerts enabled.`);

    // 3. For each user, check if their keywords match any new grants.
    for (const user of users) {
      const matchedGrants = [];
      const userKeywords = user.alert_keywords.map(k => k.toLowerCase());
      const userEmail = user.users?.email; // Get email from the joined users table

      if (!userEmail) continue; // Skip if user email is not available

      for (const grant of newGrants) {
        // Create a searchable text block from grant details
        const grantText = (`${grant.grant_name} ${grant.description}`).toLowerCase(); // ** Adjust fields as needed **

        // Check if any of the user's keywords are in the grant text
        if (userKeywords.some(keyword => grantText.includes(keyword))) {
          matchedGrants.push(grant);
        }
      }

      // 4. If there are matches, send an email.
      if (matchedGrants.length > 0) {
        console.log(`Sending email to ${userEmail} for ${matchedGrants.length} grants.`);
        
        // This uses a custom RPC call to send an email via Supabase Auth.
        // For production, you'd want a more robust email provider like Resend or Postmark.
        const { error: rpcError } = await supabaseClient.rpc('send_custom_email', {
          email: userEmail,
          subject: 'New Grant Alert from 1RFP!',
          html_content: `
            <p>Hello!</p>
            <p>We found ${matchedGrants.length} new grants that match your interests:</p>
            <ul>
              ${matchedGrants.map(g => `<li><a href="https://YOUR_WEBSITE_URL/grants/${g.id}">${g.grant_name}</a></li>`).join('')}
            </ul>
            <p>You can update your alert settings on your <a href="https://YOUR_WEBSITE_URL/profile">1RFP profile</a>.</p>
          `
        });
        
        if (rpcError) {
          console.error(`Failed to send email to ${userEmail}:`, rpcError);
        }
      }
    }

    return new Response(JSON.stringify({ message: "Alerts processed successfully" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// Note: You will also need to create the `send_custom_email` function in your database.
// I will provide the SQL for that in the next step.
