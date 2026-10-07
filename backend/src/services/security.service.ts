import { prisma } from '../lib/prisma';

export interface SecurityScanResult {
  action: 'ALLOW' | 'MASK' | 'BLOCK';
  originalPrompt: string;
  maskedPrompt: string;
  detectedDataTypes: string[];
  matchedRules: string[];
  reason?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class SecurityService {
  // Production DLP Regular Expressions
  private static PII_PATTERNS: Record<string, { regex: RegExp; placeholder: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = {
    EMAIL: {
      regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      placeholder: '[REDACTED_EMAIL]',
      severity: 'LOW',
    },
    PHONE: {
      regex: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      placeholder: '[REDACTED_PHONE]',
      severity: 'LOW',
    },
    API_KEY: {
      regex: /(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|AIzaSy[a-zA-Z0-9_-]{33}|bearer\s+[a-zA-Z0-9_\-\.]{20,})/gi,
      placeholder: '[REDACTED_API_KEY]',
      severity: 'CRITICAL',
    },
    CARD: {
      regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
      placeholder: '[REDACTED_CARD_NUMBER]',
      severity: 'HIGH',
    },
    SSN: {
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
      placeholder: '[REDACTED_SSN]',
      severity: 'HIGH',
    },
    CONFIDENTIAL: {
      regex: /\b(CONFIDENTIAL|INTERNAL ONLY|PROPRIETARY|TRADE SECRET|DO NOT DISCLOSE)\b/gi,
      placeholder: '[CONFIDENTIAL_CONTENT]',
      severity: 'MEDIUM',
    },
  };

  /**
   * Scan prompt through organization policy rules & DLP patterns
   */
  static async scanPrompt(
    organizationId: string,
    userId: string,
    prompt: string,
    ipAddress?: string
  ): Promise<SecurityScanResult> {
    // 1. Fetch active approved policy rules for organization
    const activeRules = await prisma.policyRule.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
      },
      orderBy: { priority: 'asc' }, // Lower priority number = higher precedence
    });

    let action: 'ALLOW' | 'MASK' | 'BLOCK' = 'ALLOW';
    let maskedPrompt = prompt;
    const detectedTypes = new Set<string>();
    const matchedRules: string[] = [];
    let maxSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let blockReason: string | undefined = undefined;

    // 2. Iterate through DLP patterns
    for (const [dataType, config] of Object.entries(this.PII_PATTERNS)) {
      // Check if regex matches prompt
      const matches = prompt.match(config.regex);
      if (matches && matches.length > 0) {
        detectedTypes.add(dataType);

        // Update highest severity
        if (this.severityWeight(config.severity) > this.severityWeight(maxSeverity)) {
          maxSeverity = config.severity;
        }

        // Find active organization rule for this dataType
        const matchingRule = activeRules.find((r) => r.dataType.toUpperCase() === dataType);

        const ruleAction = matchingRule ? (matchingRule.action as 'ALLOW' | 'MASK' | 'BLOCK') : this.defaultActionForType(dataType);

        if (matchingRule) {
          matchedRules.push(matchingRule.id);
        }

        if (ruleAction === 'BLOCK') {
          action = 'BLOCK';
          blockReason = `Prompt blocked due to security policy enforcement: Detected ${dataType}.`;
          break; // Stop scanner immediately on BLOCK
        } else if (ruleAction === 'MASK') {
          action = 'MASK';
          maskedPrompt = maskedPrompt.replace(config.regex, config.placeholder);
        }
      }
    }

    // 3. Log Security Event if PII was detected or request blocked
    if (detectedTypes.size > 0 || action === 'BLOCK') {
      const detectedArray = Array.from(detectedTypes);
      const snippet = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;

      await prisma.securityEvent.create({
        data: {
          organizationId,
          userId,
          eventType: action === 'BLOCK' ? 'POLICY_VIOLATION' : 'PII_DETECTED',
          severity: maxSeverity,
          promptSnippet: action === 'BLOCK' ? '[BLOCKED PROMPT]' : snippet,
          detectedData: JSON.stringify(detectedArray),
          actionTaken: action,
          policyRuleId: matchedRules[0] || null,
          ipAddress,
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action: action === 'BLOCK' ? 'BLOCKED_AI_REQUEST' : 'PII_DETECTED',
          entityType: 'SECURITY',
          details: JSON.stringify({
            action,
            detectedDataTypes: detectedArray,
            maxSeverity,
            reason: blockReason,
          }),
          ipAddress,
        },
      });
    }

    return {
      action,
      originalPrompt: prompt,
      maskedPrompt: action === 'BLOCK' ? '' : maskedPrompt,
      detectedDataTypes: Array.from(detectedTypes),
      matchedRules,
      reason: blockReason,
      severity: maxSeverity,
    };
  }

  private static defaultActionForType(dataType: string): 'ALLOW' | 'MASK' | 'BLOCK' {
    switch (dataType) {
      case 'API_KEY':
      case 'CARD':
      case 'SSN':
        return 'BLOCK';
      case 'EMAIL':
      case 'PHONE':
      case 'CONFIDENTIAL':
        return 'MASK';
      default:
        return 'ALLOW';
    }
  }

  private static severityWeight(severity: string): number {
    switch (severity) {
      case 'CRITICAL':
        return 4;
      case 'HIGH':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'LOW':
        return 1;
      default:
        return 0;
    }
  }
}
