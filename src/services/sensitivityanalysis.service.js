import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

class SensitivityAnalysisService {
  constructor(Config, logger) {
    this.Config = Config;
    this.logger = logger;
    const apiKey = this.Config.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. AI Analysis will be mocked.');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  async analyzeFrames(framePaths) {
    if (!this.genAI) {
      return {
        isSafe: true,
        confidence: 0,
        flags: [],
        summary: 'Analysis Mocked (Missing API Key)'
      };
    }

    try {
      // 1. Prepare Images
      const imageParts = framePaths.map(path => {
        return {
          inlineData: {
            data: fs.readFileSync(path).toString('base64'),
            mimeType: 'image/jpeg'
          }
        };
      });

      // 2. Prompt
      const prompt = `
        You are a content safety moderator. Analyze these video frames for unsafe content.
        Categories to flag: "Nudity", "Violence", "Gore", "Hate Speech", "Dangerous Content".
        
        Return a valid JSON object strictly matching this schema:
        {
          "isSafe": boolean, // true if content is safe for general audience
          "flags": string[], // list of detected categories, empty if safe
          "confidence": number, // 0.0 to 1.0 (how sure are you of the flags)
          "summary": string // brief description of what is seen
        }
        Do not include markdown formatting like \`\`\`json. Return only the raw JSON string.
      `;

      // 3. Call API
      const result = await this.model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      let text = response.text();

      // Cleanup cleanup
      text = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      this.logger.info(`AI Analysis Result: ${text}`);
      return JSON.parse(text);
    } catch (error) {
      this.logger.error('AI Analysis Failed:', error);
      return {
        isSafe: false,
        confidence: 0,
        flags: ['analysis_error'],
        summary: 'AI Analysis Failed due to error'
      };
    }
  }
}

export default SensitivityAnalysisService;
