// netlify/functions/gemini-client.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.defaultModel = this.genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      generationConfig: { temperature: 0.1 }
    });
  }

  // Just provide the model, let each function handle its own prompts
  getModel() {
    return this.defaultModel;
  }

  // Future: Add common utilities like retry logic, rate limiting
  async generateWithRetry(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.defaultModel.generateContent(prompt);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
}