// supabase/functions/welcome-bot/index.ts - FIXED VERSION
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Your actual bot user ID
const BOT_USER_ID = '5f2c6bd5-c3d0-42f6-9656-64550593c6ab'
const BOT_PROFILE_ID = '5f2c6bd5-c3d0-42f6-9656-64550593c6ab'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { user_id, full_name, organization_name, organization_type } = await req.json()
    
    console.log('📨 Welcome bot triggered for:', { user_id, full_name, organization_name })

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // FIXED: Create proper user mention HTML
    const cleanUserName = full_name?.trim() || 'New Member'
    const userMentionHtml = `<span class="mention" data-id="${user_id}" data-type="user" data-label="${cleanUserName}">@${cleanUserName}</span>`

    // FIXED: Generate welcome messages with proper mention HTML
    const welcomeMessages = [
      `🎉 Welcome to Fundspace, ${userMentionHtml}! We are thrilled to have you join our community of changemakers! 🌟`,
      `🚀 A warm welcome to ${userMentionHtml}! Excited to see the amazing work you will do in our community! ✨`,
      `🎊 ${userMentionHtml} just joined us! Welcome to the Fundspace family! 💫`,
      `🌟 Everyone, please join me in welcoming ${userMentionHtml} to our community! 🎉`,
      `✨ ${userMentionHtml} is now part of the Fundspace community! Welcome aboard! 🚀`
    ]

    // Select random welcome message
    let welcomeContent = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
    
    // FIXED: Create proper mentions array for database storage
    const mentions = [
      {
        displayName: cleanUserName,
        id: user_id,
        type: 'user'
      }
    ]

    // Add organization mention if available
    if (organization_name && organization_name.trim()) {
      welcomeContent += ` Representing ${organization_name.trim()}!`
    }

    // FIXED: Clean the content to remove any potential problematic characters
    welcomeContent = welcomeContent
      .replace(/\u200B/g, '') // Remove zero-width spaces
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
      .replace(/\u2002/g, ' ') // Replace en spaces
      .replace(/\u2003/g, ' ') // Replace em spaces
      .replace(/\s+/g, ' ')    // Normalize multiple spaces
      .trim()                  // Remove leading/trailing whitespace

    // FIXED: Create the welcome post with proper mentions
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: BOT_USER_ID,
        profile_id: BOT_PROFILE_ID,
        content: welcomeContent,
        channel: 'hello-world',
        organization_type: null,
        tags: JSON.stringify(['welcome', 'new-member']),
        mentions: JSON.stringify(mentions), // FIXED: Include mentions array
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (postError) {
      console.error('❌ Error creating welcome post:', postError)
      throw postError
    }

    console.log('✅ Welcome post created successfully:', newPost.id)

    // Optional: Create a mention notification for the new user
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          actor_id: BOT_PROFILE_ID,
          type: 'mention',
          post_id: newPost.id,
          is_read: false
        })

      if (notificationError) {
        console.warn('⚠️ Could not create welcome notification:', notificationError)
      } else {
        console.log('✅ Welcome notification created for user')
      }
    } catch (notifError) {
      console.warn('⚠️ Notification creation failed:', notifError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome post created successfully',
        post_id: newPost.id 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Welcome bot error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create welcome post',
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
DEPLOYMENT STEPS:

1. Replace the content of supabase/functions/welcome-bot/index.ts with this code

2. Deploy the function:
   supabase functions deploy welcome-bot

3. Your function will be available at:
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/welcome-bot

4. Test the function to ensure no more "XX" characters appear
*/