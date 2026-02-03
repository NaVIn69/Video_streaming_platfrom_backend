import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import createError from 'http-errors';

export default class SensitivityAnalysisService {
  constructor(apiKey, logger) {
    this.logger = logger;
    this.apiKey = apiKey;

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Sensitivity analysis will be mocked.');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash'
      });
    }
  }

  async analyzeFrames(framePaths) {
    // 🔹 Mock behavior if AI is disabled
    if (!this.model) {
      return {
        isSafe: true,
        confidence: 0.0,
        flags: [],
        summary: 'Analysis mocked (AI disabled)'
      };
    }

    try {
      if (!framePaths || framePaths.length === 0) {
        throw createError(400, 'No frames provided for analysis');
      }

      this.logger.info(`Analyzing ${framePaths.length} frames using Gemini`);

      // 🔹 Prepare image inputs
      const imageParts = framePaths.map(path => ({
        inlineData: {
          data: fs.readFileSync(path, { encoding: 'base64' }),
          mimeType: 'image/jpeg'
        }
      }));

      // 🔹 Prompt
      const prompt = `
You are a strict content safety moderator.

Analyze the given video frames and detect unsafe content.

Flag categories:
- Nudity
- Violence
- Gore
- Hate Speech
- Dangerous Content

Return ONLY valid JSON in this exact schema:

{
  "isSafe": boolean,
  "flags": string[],
  "confidence": number,
  "summary": string
}

Rules:
- confidence must be between 0.0 and 1.0
- flags must be empty if isSafe is true
- do NOT include markdown or explanations
`;

      // 🔹 Call Gemini with Retry Logic
      let result;
      let retries = 3;
      while (retries > 0) {
        try {
          result = await this.model.generateContent([prompt, ...imageParts]);
          break; // Success
        } catch (error) {
          if (
            error.message.includes('429') ||
            error.status === 429 ||
            error.message.includes('503') ||
            error.status === 503
          ) {
            retries--;
            // Extract delay from message or default to 10s
            // Message: "Please retry in 54.302s"
            const match = error.message.match(/retry in (\d+)/);
            const waitTime = match ? parseInt(match[1]) + 2 : 10;

            this.logger.warn(
              `Gemini API Error (${error.status || 'Unknown'}). Retrying in ${waitTime}s... (${retries} retries left)`
            );
            if (retries === 0) {
              throw error;
            } // Will be caught by outer catch

            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          } else {
            throw error; // Not a retryable error
          }
        }
      }

      const response = await result.response;
      let text = response.text().trim();

      // 🔹 Cleanup defensive parsing
      text = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      this.logger.debug(`Gemini raw output: ${text}`);

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw createError(500, 'Gemini returned invalid JSON');
      }

      // 🔹 Validate schema
      return {
        isSafe: Boolean(parsed.isSafe),
        flags: Array.isArray(parsed.flags) ? parsed.flags : [],
        confidence: Math.min(Math.max(Number(parsed.confidence) || 0, 0), 1),
        summary: parsed.summary || 'No summary provided'
      };
    } catch (error) {
      this.logger.error('Sensitivity analysis failed', error);

      return {
        isSafe: false,
        confidence: 0.0,
        flags: ['analysis_error'],
        summary: 'AI analysis failed'
      };
    }
  }
}
