import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import fs from 'fs/promises'; // Use promises for better performance
import createError from 'http-errors';

export default class SensitivityAnalysisService {
  constructor(apiKey, logger) {
    this.logger = logger;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Sensitivity analysis will be mocked.');
      this.model = null;
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);

      // Use systemInstruction for the persona
      this.model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction:
          'You are a strict content safety moderator. Analyze video frames for Nudity, Violence, Gore, Hate Speech, and Dangerous Content.',
        // Force JSON output
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              isSafe: { type: SchemaType.BOOLEAN },
              flags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              confidence: { type: SchemaType.NUMBER },
              summary: { type: SchemaType.STRING }
            },
            required: ['isSafe', 'flags', 'confidence', 'summary']
          }
        },
        // Prevent Gemini from blocking the analysis itself
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      });
    }
  }

  async analyzeFrames(framePaths) {
    if (!this.model) {
      return { isSafe: true, confidence: 0.0, flags: [], summary: 'Analysis mocked' };
    }

    try {
      if (!framePaths?.length) {
        throw createError(400, 'No frames provided');
      }

      // Async file reading
      const imageParts = await Promise.all(
        framePaths.map(async path => ({
          inlineData: {
            data: await fs.readFile(path, { encoding: 'base64' }),
            mimeType: 'image/jpeg'
          }
        }))
      );

      let result;
      let retries = 3;
      while (retries > 0) {
        try {
          // No need for JSON instructions in the prompt anymore because of responseSchema
          result = await this.model.generateContent([
            'Analyze these frames and report any safety violations.',
            ...imageParts
          ]);
          break;
        } catch (error) {
          const isRetryable =
            error.status === 429 || error.status === 503 || error.message.includes('429');
          if (isRetryable && --retries > 0) {
            const waitTime = 10; // Simple backoff
            this.logger.warn(`Gemini Error. Retrying in ${waitTime}s...`);
            await new Promise(r => setTimeout(r, waitTime * 1000));
          } else {
            throw error;
          }
        }
      }

      const response = await result.response;
      const parsed = JSON.parse(response.text());

      return {
        isSafe: !!parsed.isSafe,
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
        summary: `AI analysis failed: ${error.message}`
      };
    }
  }
}
