import {
  AIProviderInterface,
  AIProviderRequest,
  AIProviderResponse,
  AIProviderResponseChunk,
} from './ai.interface';

export class OpenRouterProvider implements AIProviderInterface {
  name = 'OpenRouter';
  type = 'OPENROUTER';

  private getApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key || key.trim() === '') {
      throw new Error('OpenRouter API key is missing. Please configure OPENROUTER_API_KEY in backend/.env');
    }
    return key;
  }

  async generateResponse(request: AIProviderRequest): Promise<AIProviderResponse> {
    const apiKey = this.getApiKey();
    const startTime = Date.now();
    const model = request.modelId || 'openrouter/auto';

    const url = 'https://openrouter.ai/api/v1/chat/completions';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'AURA AI Gateway',
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          max_tokens: request.maxTokens || 1024,
        }),
      });

      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error('OpenRouter API Key is invalid or expired. Set a valid OPENROUTER_API_KEY in backend/.env');
        }
        throw new Error(errJson.error?.message || `OpenRouter Error (${res.status})`);
      }

      const data: any = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      const latencyMs = Date.now() - startTime;

      return {
        content: text,
        modelId: model,
        inputTokens: data.usage?.prompt_tokens || Math.ceil(JSON.stringify(request.messages).length / 4),
        outputTokens: data.usage?.completion_tokens || Math.ceil(text.length / 4),
        latencyMs,
      };
    } catch (err: any) {
      throw new Error(err.message || 'OpenRouter provider connection failed');
    }
  }

  async generateStream(
    request: AIProviderRequest,
    onChunk: (chunk: AIProviderResponseChunk) => void
  ): Promise<AIProviderResponse> {
    const apiKey = this.getApiKey();
    const startTime = Date.now();
    const model = request.modelId || 'openrouter/auto';

    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'AURA AI Gateway',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const errJson: any = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error('OpenRouter API Key is invalid or expired. Set a valid OPENROUTER_API_KEY in backend/.env');
      }
      throw new Error(`OpenRouter streaming error (${res.status}): ${errJson.error?.message || ''}`);
    }

    let fullContent = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.substring(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              onChunk({
                contentDelta: delta,
                isComplete: false,
                modelId: model,
              });
            }
          } catch (e) {
            // ignore partial SSE parse errors
          }
        }
      }
    }

    onChunk({
      contentDelta: '',
      isComplete: true,
      modelId: model,
    });

    const latencyMs = Date.now() - startTime;

    return {
      content: fullContent,
      modelId: model,
      inputTokens: Math.ceil(JSON.stringify(request.messages).length / 4),
      outputTokens: Math.ceil(fullContent.length / 4),
      latencyMs,
    };
  }
}
