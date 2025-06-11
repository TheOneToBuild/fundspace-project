// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// This is your Project URL. Please double-check it against your Supabase dashboard.
const supabaseUrl = 'https://bqiamumgqbezdumzquda.supabase.co'

// This is your public "anon" key. It must be a direct string.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxaWFtdW1ncWJlemR1bXpxdWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNDkzNjgsImV4cCI6MjA2NDgyNTM2OH0.etPC9qAaxKAJubKdlcgm2jdiSUz3EAogXlmr7KtF3L4'

// This line creates the client that your app uses to talk to the database.
export const supabase = createClient(supabaseUrl, supabaseKey)
