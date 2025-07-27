// 1rfp-project/1rfp-app/netlify/functions/process-grant-submission-background.js

// UPDATED PATH: The path goes up three levels to get to the project root,
// then down into the importer directory.
const { processUrlAndUpdateSubmission } = require('../../../importer/grant_processor_core.js');

exports.handler = async function(event, context) {
    // --- Security Check ---
    const authHeader = event.headers.authorization || '';
    const token = authHeader.split(' ')[1];

    if (token !== process.env.WORKER_SHARED_SECRET) {
        console.error("Unauthorized attempt to trigger worker.");
        return {
            statusCode: 401,
            body: 'Unauthorized',
        };
    }

    try {
        const payload = JSON.parse(event.body);
        const { url, submissionId } = payload;

        if (!url || !submissionId) {
            throw new Error("Missing url or submissionId in payload.");
        }
        
        // This is a background function, so we call our logic without `await`
        // and return a response immediately.
        processUrlAndUpdateSubmission(url, submissionId);

        return {
            statusCode: 202, // Accepted
            body: JSON.stringify({ message: "Request accepted. Processing will start in the background." }),
        };

    } catch (error) {
        console.error("Error invoking background function:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message }),
        };
    }
};