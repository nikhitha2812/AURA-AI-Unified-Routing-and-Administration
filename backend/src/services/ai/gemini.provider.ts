import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AIProviderInterface,
  AIProviderRequest,
  AIProviderResponse,
  AIProviderResponseChunk,
} from './ai.interface';

export class GeminiProvider implements AIProviderInterface {
  name = 'Google Gemini';
  type = 'GEMINI';

  private getApiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim() === '' || key.startsWith('AQ.')) {
      throw new Error(
        'Google Gemini API key is missing or invalid. Please configure a valid key (AIzaSy...) in backend/.env'
      );
    }
    return key;
  }

  async generateResponse(request: AIProviderRequest): Promise<AIProviderResponse> {
    const apiKey = this.getApiKey();
    const startTime = Date.now();
    const targetModel = request.modelId || 'gemini-1.5-flash';

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: targetModel });

      const prompt = request.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const latencyMs = Date.now() - startTime;
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(text.length / 4);

      return {
        content: text,
        modelId: targetModel,
        inputTokens,
        outputTokens,
        latencyMs,
      };
    } catch (err: any) {
      if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('400') || err.message?.includes('404')) {
        throw new Error(
          `Google Gemini API Error: Invalid or unconfigured API Key. Set a valid GEMINI_API_KEY in backend/.env`
        );
      }
      throw new Error(`Google Gemini Error: ${err.message}`);
    }
  }

  async generateStream(
    request: AIProviderRequest,
    onChunk: (chunk: AIProviderResponseChunk) => void
  ): Promise<AIProviderResponse> {
    const apiKey = this.getApiKey();
    const startTime = Date.now();
    const targetModel = request.modelId || 'gemini-1.5-flash';

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: targetModel });
      const prompt = request.messages.map((m) => `${m.role}: ${m.content}`).join('\n');

      const result = await model.generateContentStream(prompt);
      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk({
          contentDelta: chunkText,
          isComplete: false,
          modelId: targetModel,
        });
      }

      onChunk({
        contentDelta: '',
        isComplete: true,
        modelId: targetModel,
      });

      const latencyMs = Date.now() - startTime;
      return {
        content: fullText,
        modelId: targetModel,
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(fullText.length / 4),
        latencyMs,
      };
    } catch (err: any) {
      throw new Error(`Google Gemini Stream Error: ${err.message}`);
    }
  }
}
