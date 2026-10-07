import { prisma } from '../lib/prisma';
import { AIProviderInterface } from './ai/ai.interface';
import { LocalShieldProvider } from './ai/local.provider';
import { GeminiProvider } from './ai/gemini.provider';
import { OpenAIProvider } from './ai/openai.provider';
import { GroqProvider } from './ai/groq.provider';
import { OllamaProvider } from './ai/ollama.provider';
import { OpenRouterProvider } from './ai/openrouter.provider';

export interface RoutingDecision {
  selectedModel: any;
  provider: AIProviderInterface;
  mode: 'AUTOMATIC' | 'PREFERRED';
  taskType: string;
  routingScore: number;
  routingReason: string;
  userExplanation: string;
  fallbackChain: string[];
  isPrivateOnly: boolean;
}

export class RouterService {
  private static localProvider = new LocalShieldProvider();
  private static geminiProvider = new GeminiProvider();
  private static openaiProvider = new OpenAIProvider();
  private static groqProvider = new GroqProvider();
  private static ollamaProvider = new OllamaProvider();
  private static openrouterProvider = new OpenRouterProvider();

  /**
   * Classify prompt task type
   */
  public static classifyTask(prompt: string, securityAction?: string, detectedTypes: string[] = []): string {
    const lower = prompt.toLowerCase();

    // Check if prompt contains confidential keywords or sensitive PII requiring private infrastructure
    if (
      securityAction === 'MASK' ||
      detectedTypes.includes('CONFIDENTIAL') ||
      lower.includes('confidential') ||
      lower.includes('trade secret') ||
      lower.includes('proprietary')
    ) {
      return 'sensitive-confidential';
    }

    // Check for code signals
    const codeKeywords = ['function', 'class', 'const', 'import', 'def', 'return', 'bug', 'error', 'typescript', 'python', 'java', 'sql', 'react', 'fastapi', '```'];
    const hasCodeSignal = codeKeywords.some((kw) => lower.includes(kw));
    if (hasCodeSignal) {
      return 'coding';
    }

    // Check for complex reasoning / long documents
    if (prompt.length > 450 || lower.includes('analyze') || lower.includes('architecture') || lower.includes('compare') || lower.includes('evaluate')) {
      return 'complex-reasoning';
    }

    // Check for fast response / simple greeting
    if (prompt.length < 50 && (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('define'))) {
      return 'fast-response';
    }

    return 'general';
  }

  /**
   * Core Automatic Best Model Router Engine
   */
  static async selectModelAndProvider(
    organizationId: string,
    userRole: string,
    prompt: string,
    mode: 'AUTOMATIC' | 'PREFERRED' = 'AUTOMATIC',
    requestedModelId?: string,
    securityAction?: string,
    detectedDataTypes: string[] = []
  ): Promise<RoutingDecision> {
    const taskType = this.classifyTask(prompt, securityAction, detectedDataTypes);
    const isPrivateOnly = taskType === 'sensitive-confidential';

    // 1. Fetch active models for organization / system
    const activeModels = await prisma.aIModel.findMany({
      where: {
        isEnabled: true,
        status: { in: ['ACTIVE', 'DEGRADED'] },
      },
      include: { provider: true },
      orderBy: { priority: 'asc' },
    });

    if (activeModels.length === 0) {
      throw new Error('No active AI models are available in the system catalog.');
    }

    // 2. Filter models by User Role permissions
    const roleRanks: Record<string, number> = {
      EMPLOYEE: 1,
      MANAGER: 2,
      POLICY_ADMIN: 3,
      SECURITY_ADMIN: 3,
      ORGANIZATION_ADMIN: 4,
      SUPER_ADMIN: 5,
    };
    const userRank = roleRanks[userRole] || 1;

    let candidateModels = activeModels.filter((m) => {
      const modelRank = roleRanks[m.minRole] || 1;
      return userRank >= modelRank;
    });

    if (candidateModels.length === 0) {
      throw new Error('Your user role lacks permission to access any available AI models.');
    }

    // 3. Security Policy Overrides: If confidential data or policy requires private processing
    if (isPrivateOnly) {
      const privateModels = candidateModels.filter((m) => m.provider.type === 'LOCAL' || m.provider.type === 'OLLAMA');

      if (privateModels.length === 0) {
        // Requirement #4: DO NOT send to external cloud models if private service is unavailable
        throw new Error('The request cannot currently be processed because the approved private AI service is unavailable.');
      }
      candidateModels = privateModels;
    }

    // 4. ROUTING MODE LOGIC
    let selectedModel: any;
    let routingReason = '';
    let userExplanation = '';
    let highestScore = 0;

    if (mode === 'PREFERRED' && requestedModelId) {
      const preferred = candidateModels.find((m) => m.modelId === requestedModelId || m.id === requestedModelId);
      if (!preferred) {
        throw new Error('The preferred model is either not permitted by your organization policy or is currently disabled.');
      }
      selectedModel = preferred;
      highestScore = 100;
      routingReason = `User explicitly selected preferred model [${selectedModel.name}]. Passed organization policy & security checks.`;
      userExplanation = `Selected based on your preferred model preference.`;
    } else {
      // MODE 1: AUTOMATIC — BEST MODEL (Scoring Engine)
      const scoredCandidates = candidateModels.map((model) => {
        let score = 50.0;
        const capabilities: string[] = JSON.parse(model.capabilities || '[]');

        // Capability Match Scoring
        if (taskType === 'coding' && capabilities.includes('code')) score += 30;
        if (taskType === 'complex-reasoning' && capabilities.includes('complex-reasoning')) score += 25;
        if (taskType === 'fast-response' && capabilities.includes('fast')) score += 20;
        if (taskType === 'sensitive-confidential' && (capabilities.includes('private') || capabilities.includes('sensitive'))) score += 35;

        // Health & Status Scoring
        if (model.status === 'ACTIVE') score += 10;
        if (model.status === 'DEGRADED') score -= 20;

        // Priority weighting
        score += (10 - model.priority) * 2;

        return { model, score };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);
      selectedModel = scoredCandidates[0].model;
      highestScore = scoredCandidates[0].score;

      routingReason = `AURA Automatic Router evaluated task type [${taskType.toUpperCase()}]. Selected [${selectedModel.name}] (${selectedModel.provider.name}) with routing score ${highestScore.toFixed(1)}.`;

      // Normal user-understandable explanation
      if (taskType === 'coding') {
        userExplanation = `Selected for this request based on code optimization capability, availability, and corporate security rules.`;
      } else if (taskType === 'complex-reasoning') {
        userExplanation = `Selected for this request based on high reasoning capacity and long context capability.`;
      } else if (taskType === 'sensitive-confidential') {
        userExplanation = `Selected for this request based on on-premise private infrastructure policy rules.`;
      } else {
        userExplanation = `Selected for this request based on fast response latency, availability, and organization policy.`;
      }
    }

    // 5. Instantiate Provider instance
    const provider = this.getProviderInstance(selectedModel.provider.type);
    const fallbackChain = candidateModels.filter((m) => m.id !== selectedModel.id).map((m) => m.name);

    return {
      selectedModel,
      provider,
      mode,
      taskType,
      routingScore: highestScore,
      routingReason,
      userExplanation,
      fallbackChain,
      isPrivateOnly,
    };
  }

  /**
   * Instantiate provider implementation based on Provider entity type
   */
  static getProviderInstance(providerType: string): AIProviderInterface {
    switch (providerType) {
      case 'GEMINI':
        return this.geminiProvider;
      case 'OPENAI_COMPATIBLE':
      case 'OPENAI':
        return this.openaiProvider;
      case 'GROQ':
        return this.groqProvider;
      case 'OLLAMA':
        return this.ollamaProvider;
      case 'OPENROUTER':
        return this.openrouterProvider;
      case 'LOCAL':
      default:
        return this.localProvider;
    }
  }

  /**
   * Execute AI Request with fallback handling
   */
  static async executeWithFallback(
    request: any,
    routingDecision: RoutingDecision,
    onChunk?: (chunk: any) => void
  ) {
    try {
      if (onChunk) {
        return await routingDecision.provider.generateStream(request, onChunk);
      } else {
        return await routingDecision.provider.generateResponse(request);
      }
    } catch (primaryErr: any) {
      console.warn(`⚠️ Primary AI Provider (${routingDecision.selectedModel.name}) failed:`, primaryErr.message);

      // If prompt was strictly private, fallback ONLY to local shield engine
      if (routingDecision.isPrivateOnly) {
        console.log(`🔒 Falling back strictly to AURA Local Shield Engine...`);
        const localProvider = this.localProvider;
        const fallbackReq = { ...request, modelId: 'aura-shield-v1' };

        if (onChunk) {
          return await localProvider.generateStream(fallbackReq, onChunk);
        } else {
          return await localProvider.generateResponse(fallbackReq);
        }
      }

      // General fallback to local shield engine
      console.log(`🔄 Triggering automatic fallback to AURA Local Shield Engine...`);
      const localProvider = this.localProvider;
      const fallbackReq = { ...request, modelId: 'aura-shield-v1' };

      if (onChunk) {
        return await localProvider.generateStream(fallbackReq, onChunk);
      } else {
        return await localProvider.generateResponse(fallbackReq);
      }
    }
  }
}
