import { describe, it, expect, beforeAll } from 'vitest';
import { RouterService } from '../src/services/router.service';
import { prisma } from '../src/lib/prisma';

describe('AURA Automatic Best Model Router Engine', () => {
  let orgId: string;

  beforeAll(async () => {
    const org = await prisma.organization.findFirst();
    orgId = org?.id || 'aura-corp';
  });

  it('should automatically route coding prompts to code-capable models in AUTOMATIC mode', async () => {
    const decision = await RouterService.selectModelAndProvider(
      orgId,
      'EMPLOYEE',
      'Write a Python function to detect duplicate items in a list',
      'AUTOMATIC'
    );

    expect(decision.mode).toBe('AUTOMATIC');
    expect(decision.taskType).toBe('coding');
    expect(decision.selectedModel.capabilities).toContain('code');
    expect(decision.userExplanation).toContain('code');
  });

  it('should automatically route confidential prompts to private infrastructure (Ollama or Local Shield)', async () => {
    const decision = await RouterService.selectModelAndProvider(
      orgId,
      'EMPLOYEE',
      'Analyze this confidential corporate architecture document.',
      'AUTOMATIC',
      undefined,
      'MASK',
      ['CONFIDENTIAL']
    );

    expect(decision.mode).toBe('AUTOMATIC');
    expect(decision.taskType).toBe('sensitive-confidential');
    expect(['LOCAL', 'OLLAMA']).toContain(decision.selectedModel.provider.type);
    expect(decision.userExplanation).toContain('private infrastructure');
  });

  it('should allow PREFERRED mode when user explicitly selects a permitted model', async () => {
    const decision = await RouterService.selectModelAndProvider(
      orgId,
      'EMPLOYEE',
      'Explain quantum computing',
      'PREFERRED',
      'gemini-1.5-pro'
    );

    expect(decision.mode).toBe('PREFERRED');
    expect(decision.selectedModel.modelId).toBe('gemini-1.5-pro');
    expect(decision.provider.type).toBe('GEMINI');
  });

  it('should reject PREFERRED mode if user attempts to select a disabled or unauthorized model', async () => {
    await expect(
      RouterService.selectModelAndProvider(
        orgId,
        'EMPLOYEE',
        'Hello',
        'PREFERRED',
        'invalid-nonexistent-model-id'
      )
    ).rejects.toThrow();
  });
});
