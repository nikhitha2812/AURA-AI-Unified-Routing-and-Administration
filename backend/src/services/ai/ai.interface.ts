export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProviderRequest {
  modelId: string;
  messages: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIProviderResponseChunk {
  contentDelta: string;
  isComplete: boolean;
  inputTokens?: number;
  outputTokens?: number;
  modelId: string;
}

export interface AIProviderResponse {
  content: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface AIProviderInterface {
  name: string;
  type: string;
  generateResponse(request: AIProviderRequest): Promise<AIProviderResponse>;
  generateStream(
    request: AIProviderRequest,
    onChunk: (chunk: AIProviderResponseChunk) => void
  ): Promise<AIProviderResponse>;
}
