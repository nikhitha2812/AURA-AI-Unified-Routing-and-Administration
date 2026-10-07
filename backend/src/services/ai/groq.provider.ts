import {
  AIProviderInterface,
  AIProviderRequest,
  AIProviderResponse,
  AIProviderResponseChunk,
} from './ai.interface';

export class GroqProvider implements AIProviderInterface {
  name = 'Groq Cloud LPU';
  type = 'GROQ';

  private getApiKey(): string {
    const key = process.env.GROQ_API_KEY;
    if (!key || key.trim() === '') {
      throw new Error('Groq API Key is not configured. Please set GROQ_API_KEY in backend/.env');
    }
    return key;
  }

  async generateResponse(request: AIProviderRequest): Promise<AIProviderResponse> {
    const apiKey = this.getApiKey();
    const startTime = Date.now();
    const model = request.modelId || 'llama-3.1-70b-versatile';

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          max_tokens: request.maxTokens || 1024,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Groq API Key is invalid or expired. Set a valid GROQ_API_KEY (gsk_...) in backend/.env');
        }
        const errText = await res.text();
        throw new Error(`Groq API Error (${res.status}): ${errText}`);
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
      throw new Error(err.message || 'Groq provider connection failed');
    }
  }

  async generateStream(
    request: AIProviderRequest,
    onChunk: (chunk: AIProviderResponseChunk) => void
  ): Promise<AIProviderResponse> {
    const apiKey = this.getApiKey();
    const startTime = Date.now();
    const model = request.modelId || 'llama-3.1-70b-versatile';

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      if (res.status === 401) {
        throw new Error('Groq API Key is invalid or expired. Set a valid GROQ_API_KEY (gsk_...) in backend/.env');
      }
      throw new Error(`Groq streaming API error (${res.status})`);
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
            // ignore JSON line parse errors
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
