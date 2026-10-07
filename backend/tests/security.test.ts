import { describe, it, expect, beforeAll } from 'vitest';
import { SecurityService } from '../src/services/security.service';
import { prisma } from '../src/lib/prisma';

describe('AURA Security & PII Detection Service', () => {
  let orgId: string;
  let userId: string;

  beforeAll(async () => {
    const org = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    orgId = org?.id || 'aura-corp';
    userId = user?.id || 'dummy';
  });

  it('should detect and MASK user email addresses', async () => {
    const prompt = 'Please send update to john.doe@company.com immediately.';
    const result = await SecurityService.scanPrompt(orgId, userId, prompt);

    expect(result.detectedDataTypes).toContain('EMAIL');
    expect(result.action).toBe('MASK');
    expect(result.maskedPrompt).toBe('Please send update to [REDACTED_EMAIL] immediately.');
  });

  it('should detect and BLOCK prompts containing API keys', async () => {
    const prompt = 'Here is my OpenAI API key: sk-abcdef1234567890abcdef1234567890';
    const result = await SecurityService.scanPrompt(orgId, userId, prompt);

    expect(result.detectedDataTypes).toContain('API_KEY');
    expect(result.action).toBe('BLOCK');
    expect(result.reason).toContain('Detected API_KEY');
  });

  it('should ALLOW clean prompt without PII', async () => {
    const prompt = 'Explain quantum computing in simple terms for beginners.';
    const result = await SecurityService.scanPrompt(orgId, userId, prompt);

    expect(result.detectedDataTypes.length).toBe(0);
    expect(result.action).toBe('ALLOW');
    expect(result.maskedPrompt).toBe(prompt);
  });
});
