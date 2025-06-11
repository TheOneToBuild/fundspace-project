// maintenance.js
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://bqiamumgqbezdumzquda.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxaWFtdW1ncWJlemR1bXpxdWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI0OTM2OCwiZXhwIjoyMDY0ODI1MzY4fQ.Sk90ZzH4tX6qmDcQX1LdjOhLqqd2omNNG--ZOSDok8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateExpiredGrants() {
  console.log('Starting daily maintenance: Checking for expired grants...');

  const today = new Date().toISOString().slice(0, 10);

  try {
    const { data, error } = await supabase
      .from('grants')
      .update({ status: 'Closed' })
      .lt('due_date', today) // lt means "less than"
      .eq('status', 'Open')  // eq means "equal to"
      .select();

    if (error) {
      console.error('Error updating grant statuses:', error.message);
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`Successfully updated ${data.length} grant(s) to 'Closed'.`);
    } else {
      console.log('No open grants have expired since the last check.');
    }
  } catch (error) {
    console.error('An unexpected error occurred during maintenance.');
  }
}

updateExpiredGrants();
