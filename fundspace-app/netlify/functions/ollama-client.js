// fundspace-app/netlify/functions/ollama-client.js
import axios from 'axios';

class OllamaClient {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.textModel = 'llama3:8b-instruct-q4_0';
    this.embeddingModel = 'nomic-embed-text:latest';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000, // 2 minutes timeout for large content
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async extractGrants(content, sourceUrl) {
    const prompt = this.createGrantExtractionPrompt(content, sourceUrl);
    
    try {
      console.log(`🤖 Sending ${content.length} characters to Ollama...`);
      
      const response = await this.client.post('/api/generate', {
        model: this.textModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent extraction
          top_k: 10,
          top_p: 0.3
        }
      });

      const rawResponse = response.data.response;
      console.log(`📝 Ollama response received (${rawResponse.length} chars)`);

      // Extract JSON from response
      const grants = this.parseGrantsFromResponse(rawResponse);
      console.log(`✅ Extracted ${grants.length} grants`);
      
      return this.validateAndCleanGrants(grants);
      
    } catch (error) {
      console.error('❌ Ollama extraction error:', error.message);
      throw new Error(`Grant extraction failed: ${error.message}`);
    }
  }

  createGrantExtractionPrompt(content, sourceUrl) {
    return `Extract grant opportunities from this content and return ONLY a JSON array.

Source: ${sourceUrl}

RULES:
1. Return ONLY valid JSON array format - no explanations
2. Extract ALL distinct grant opportunities mentioned
3. Focus on active/open grants with future deadlines
4. If funding amount is unclear, use null

Required JSON structure:
[
  {
    "title": "Grant program name",
    "funder_name": "Organization providing grant", 
    "description": "What the grant funds",
    "deadline": "YYYY-MM-DD format or null",
    "funding_amount_min": number or null,
    "funding_amount_max": number or null,
    "funding_amount_text": "Original text like '$10K-$50K'",
    "eligibility_criteria": "Who can apply",
    "application_url": "Direct application link or null",
    "grant_type": "Type of grant or null",
    "categories": ["focus area 1", "focus area 2"],
    "status": "Open/Closed/Rolling"
  }
]

Content to analyze:
${content.substring(0, 6000)}

JSON array:`;
  }

  parseGrantsFromResponse(rawResponse) {
    try {
      // First try to find JSON array directly
      let jsonMatch = rawResponse.match(/\[[\s\S]*?\]/);
      
      // If no direct array, look for JSON inside markdown code blocks
      if (!jsonMatch) {
        const codeBlockMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonMatch = [codeBlockMatch[1]];
        }
      }
      
      // If still no match, look for any JSON object/array
      if (!jsonMatch) {
        jsonMatch = rawResponse.match(/[\[\{][\s\S]*?[\]\}]/);
      }
      
      if (!jsonMatch) {
        console.log('❌ No JSON found in response');
        console.log('Raw response:', rawResponse.substring(0, 500));
        return [];
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);
      
      // If it's an object, wrap it in an array
      const grants = Array.isArray(parsed) ? parsed : [parsed];
      
      return grants;
      
    } catch (error) {
      console.error('❌ JSON parsing error:', error.message);
      console.log('Raw response:', rawResponse.substring(0, 500));
      return [];
    }
  }

  validateAndCleanGrants(grants) {
    return grants.filter(grant => {
      // Must have essential fields
      if (!grant.title || !grant.funder_name || !grant.description) {
        console.log(`❌ Grant missing essential fields: ${grant.title || 'No title'}`);
        return false;
      }

      // Clean and validate funding amounts
      if (grant.funding_amount_text) {
        const amounts = this.parseFundingAmounts(grant.funding_amount_text);
        grant.funding_amount_min = amounts.min;
        grant.funding_amount_max = amounts.max;
      }

      // Validate deadline format
      if (grant.deadline && !grant.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log(`⚠️ Invalid deadline format: ${grant.deadline}`);
        grant.deadline = null;
      }

      console.log(`✅ Valid grant: "${grant.title}" from "${grant.funder_name}"`);
      return true;
    });
  }

  parseFundingAmounts(text) {
    if (!text) return { min: null, max: null };
    
    // Extract numbers from text like "$10,000-$50,000" or "$25K"
    const numbers = text.match(/\$?[\d,]+(?:K|k|M|m)?/g);
    if (!numbers) return { min: null, max: null };
    
    const amounts = numbers.map(n => {
      let num = parseInt(n.replace(/[$,]/g, ''));
      if (n.toLowerCase().includes('k')) num *= 1000;
      if (n.toLowerCase().includes('m')) num *= 1000000;
      return num;
    });
    
    if (amounts.length === 1) {
      return { min: amounts[0], max: amounts[0] };
    } else if (amounts.length >= 2) {
      return { min: Math.min(...amounts), max: Math.max(...amounts) };
    }
    
    return { min: null, max: null };
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      
      return {
        status: 'healthy',
        models: models.map(m => m.name),
        textModelAvailable: models.some(m => m.name === this.textModel),
        embeddingModelAvailable: models.some(m => m.name === this.embeddingModel)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export { OllamaClient };