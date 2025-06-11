const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURATION ---
// Load secrets from environment variables provided by GitHub Actions
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI    = new GoogleGenerativeAI(GEMINI_API_KEY);
const model    = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- Delay helper ---
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Fetch page HTML and strip to plain text.
 */
async function fetchWebsiteContent(url) {
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
  return res.data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Use AI to extract grant info from plain text.
 */
async function extractGrantInfo(text) {
  const prompt = `
Based on the following text from a foundation's website, extract each grant opportunity as an object with:
- title
- foundation_name
- grant_type: the specific program or track name (e.g. "Development Support", "Production Support")
- description: a detailed summary of the grant’s purpose, goals, and scope
- eligibility: the detailed requirements and criteria for applicants
- funding_amount_text: grab *any* currency pattern, e.g. "$15,000" or "$15,000–$20,000"; if none, null
- due_date: application deadline in YYYY-MM-DD format, or null
- location: the geographic area the grant serves
- category
- keywords: an array of up to 10 relevant tags or keywords that summarize the grant

**IMPORTANT**: respond with *only* the raw JSON array—no markdown fences or extra commentary.

---
${text}
---
`;
  try {
    const result = await model.generateContent(prompt);
    let raw = await (await result.response).text();
    raw = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const arrStart = raw.indexOf('[');
    const arrEnd   = raw.lastIndexOf(']');
    return JSON.parse(raw.slice(arrStart, arrEnd + 1));
  } catch (err) {
    console.error('❗ AI extraction error:', err);
    return [];
  }
}

/**
 * Normalize date strings to YYYY-MM-DD or null.
 */
function normalizeDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (!isNaN(dt)) return dt.toISOString().slice(0,10);
  const parsed = chrono.parseDate(d);
  return parsed ? parsed.toISOString().slice(0,10) : null;
}

/**
 * Filter, normalize, dedupe, and insert into Supabase.
 */
async function saveGrantsToSupabase(grants, url) {
  if (!grants.length) {
    console.log('No grants extracted for', url);
    return;
  }

  // Normalize fields
  const today = new Date(); today.setHours(0,0,0,0);
  const processed = grants
    .map(g => ({
      ...g,
      due_date: normalizeDate(g.due_date),
      funding_amount_text: g.funding_amount_text || null,
    }))
    .filter(g => g.funding_amount_text)    // require funding
    .filter(g => {
      if (g.due_date) return new Date(g.due_date) >= today;
      if (/\b(rolling|continuous)\b/i.test(g.description + ' ' + g.eligibility)) {
        g.status = 'Continuous'; return true;
      }
      return false;
    });

  if (!processed.length) {
    console.log('No valid grants for', url);
    return;
  }

  // Dedupe
  const { data: existing, error: fetchErr } = await supabase
    .from('grants')
    .select('title, foundation_name');
  if (fetchErr) {
    console.error('Supabase fetch error:', fetchErr);
    return;
  }
  const seen = new Set(existing.map(e => `${e.title}|${e.foundation_name}`));

  const toInsert = processed
    .filter(g => !seen.has(`${g.title}|${g.foundation_name}`))
    .map(g => ({
      title:               g.title,
      foundation_name:     g.foundation_name,
      grant_type:          g.grant_type,
      description:         g.description,
      eligibility:         g.eligibility,
      funding_amount_text: g.funding_amount_text,
      due_date:            g.due_date,
      location:            g.location,
      category:            g.category,
      keywords:            g.keywords || [],
      url,
      status:              g.due_date ? 'Open' : g.status || 'Continuous',
      date_added:          today.toISOString().slice(0,10),
    }));

  if (!toInsert.length) {
    console.log('No new unique grants for', url);
    return;
  }

  const { data, error: insErr } = await supabase
    .from('grants')
    .insert(toInsert)
    .select();
  if (insErr) {
    console.error('Supabase insert error:', insErr);
  } else {
    console.log(`✅ Saved ${data.length} new grant(s) from ${url}`);
  }
}

/**
 * Main: read urls.txt and process each URL.
 */
(async function main() {
  console.log('--- Starting 1RFP Grants Importer ---');

  const file = path.join(__dirname, 'urls.txt');
  const urls = fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map(u => u.trim())
    .filter(u => u && /^https?:\/\//i.test(u));

  if (!urls.length) {
    console.error('No URLs found in urls.txt');
    return;
  }

  for (const url of urls) {
    console.log('\nProcessing:', url);
    try {
      const text = await fetchWebsiteContent(url);
      const grants = await extractGrantInfo(text);
      await saveGrantsToSupabase(grants, url);
    } catch (err) {
      console.error('Error processing', url, err.message);
    }
    await sleep(2000);
  }

  console.log('\n--- All URLs processed. Done! ---');
})();
