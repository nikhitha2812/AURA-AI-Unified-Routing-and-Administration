import {
  AIProviderInterface,
  AIProviderRequest,
  AIProviderResponse,
  AIProviderResponseChunk,
} from './ai.interface';

export class OllamaProvider implements AIProviderInterface {
  name = 'Ollama Local Instance';
  type = 'OLLAMA';

  private getBaseUrl(): string {
    return process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async generateResponse(request: AIProviderRequest): Promise<AIProviderResponse> {
    const baseUrl = this.getBaseUrl();
    const startTime = Date.now();
    const model = request.modelId || 'llama3:latest';

    const url = `${baseUrl}/v1/chat/completions`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: request.messages,
          stream: false,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama instance error (${res.status}): ${errText}`);
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
      throw new Error(
        `Ollama Local Instance is offline or unreachable at ${baseUrl}. Ensure Ollama service is running.`
      );
    }
  }

  async generateStream(
    request: AIProviderRequest,
    onChunk: (chunk: AIProviderResponseChunk) => void
  ): Promise<AIProviderResponse> {
    const baseUrl = this.getBaseUrl();
    const startTime = Date.now();
    const model = request.modelId || 'llama3:latest';

    const url = `${baseUrl}/v1/chat/completions`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: request.messages,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Ollama streaming API error (${res.status}). Ensure Ollama server is running.`);
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
              // ignore SSE parse
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
    } catch (err: any) {
      throw new Error(
        `Ollama Local Instance is offline or unreachable at ${baseUrl}. Ensure Ollama service is running.`
      );
    }
  }
}
