// importer/process_user_submission_worker.js
// This script is the entry point for on-demand processing.
// It will be triggered by an API call from our Supabase Edge Function.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { processUrlAndUpdateSubmission } = require('./grant_processor_core.js');

async function main() {
    console.log("--- Worker: Initializing on-demand grant processing ---");

    // In a real server, you'd get these from an HTTP request body.
    // For command-line execution, we use process.argv.
    const url = process.argv[2];
    const submissionId = process.argv[3];

    if (!url || !submissionId) {
        console.error("Error: URL and Submission ID must be provided.");
        console.error("Usage: node process_user_submission_worker.js <url> <submissionId>");
        process.exit(1);
    }

    // Call the core logic. This will handle everything else.
    await processUrlAndUpdateSubmission(url, submissionId);

    console.log("--- Worker: Processing finished. ---")
}

main().catch(error => {
    console.error("A critical error occurred in the worker:", error);
    process.exit(1);
});