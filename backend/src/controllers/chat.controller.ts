import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { SecurityService } from '../services/security.service';
import { RouterService } from '../services/router.service';
import { UsageService } from '../services/usage.service';
import { AuditService } from '../services/audit.service';

export class ChatController {
  /**
   * Main AI Gateway streaming endpoint with Automatic Best Model Router evaluation
   */
  static async handleChatRequest(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { prompt, conversationId, mode = 'AUTOMATIC', modelId, stream = true } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt content is required.' });
    }

    const { userId, orgId, roleName } = req.user;
    const ip = req.ip || req.socket.remoteAddress;

    // 1. Security & DLP Scan
    const scanResult = await SecurityService.scanPrompt(orgId, userId, prompt, ip);

    if (scanResult.action === 'BLOCK') {
      await UsageService.recordUsage({
        organizationId: orgId,
        userId,
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 0,
        latencyMs: 0,
        status: 'BLOCKED',
        errorDetails: scanResult.reason,
      });

      return res.status(400).json({
        error: scanResult.reason || 'Request blocked by organization security policy.',
        action: 'BLOCK',
        detectedDataTypes: scanResult.detectedDataTypes,
      });
    }

    // 2. Load or Create Conversation with strict Tenant & User ownership verification
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          organizationId: orgId,
          userId,
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found or access denied.' });
      }

      // Update mode / preferredModelId if specified
      if (mode || modelId) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            mode: mode || conversation.mode,
            preferredModelId: modelId || conversation.preferredModelId,
          },
        });
      }
    } else {
      const title = prompt.length > 35 ? prompt.substring(0, 35) + '...' : prompt;
      conversation = await prisma.conversation.create({
        data: {
          organizationId: orgId,
          userId,
          title,
          mode: mode || 'AUTOMATIC',
          preferredModelId: mode === 'PREFERRED' ? modelId : null,
        },
      });
    }

    // 3. Save User Message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: prompt,
        mode: mode || 'AUTOMATIC',
        rawPrompt: prompt,
        maskedPrompt: scanResult.maskedPrompt,
      },
    });

    // 4. Per-Message Model Router Selection Engine
    let routingDecision;
    try {
      routingDecision = await RouterService.selectModelAndProvider(
        orgId,
        roleName,
        scanResult.maskedPrompt,
        mode,
        modelId,
        scanResult.action,
        scanResult.detectedDataTypes
      );
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    // Prepare Chat Messages history
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const formattedMessages = history.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.role === 'user' ? (m.maskedPrompt || m.content) : m.content,
    }));

    const aiRequest = {
      modelId: routingDecision.selectedModel.modelId,
      messages: formattedMessages,
    };

    // 5. Handle SSE Streaming Response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send initial metadata chunk
      res.write(
        `data: ${JSON.stringify({
          type: 'metadata',
          conversationId: conversation.id,
          mode: routingDecision.mode,
          modelName: routingDecision.selectedModel.name,
          providerName: routingDecision.selectedModel.provider.name,
          taskType: routingDecision.taskType,
          routingReason: routingDecision.routingReason,
          userExplanation: routingDecision.userExplanation,
          routingScore: routingDecision.routingScore,
          securityAction: scanResult.action,
          masked: scanResult.action === 'MASK',
        })}\n\n`
      );

      let accumulatedContent = '';
      const startTime = Date.now();

      try {
        const responseData = await RouterService.executeWithFallback(
          aiRequest,
          routingDecision,
          (chunk) => {
            if (chunk.contentDelta) {
              accumulatedContent += chunk.contentDelta;
              res.write(
                `data: ${JSON.stringify({
                  type: 'content',
                  delta: chunk.contentDelta,
                })}\n\n`
              );
            }
          }
        );

        const latencyMs = Date.now() - startTime;

        // Save Assistant Message with complete routing breakdown
        const assistantMsg = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: accumulatedContent,
            mode: routingDecision.mode,
            taskType: routingDecision.taskType,
            routingReason: routingDecision.routingReason,
            userExplanation: routingDecision.userExplanation,
            routingScore: routingDecision.routingScore,
            selectedModelId: routingDecision.selectedModel.id,
            policyResult: JSON.stringify({ securityAction: scanResult.action }),
            securityResult: JSON.stringify({ detectedData: scanResult.detectedDataTypes }),
            tokenCountInput: responseData.inputTokens,
            tokenCountOutput: responseData.outputTokens,
            latencyMs,
          },
        });

        // Record Telemetry Usage with mode tracking
        await UsageService.recordUsage({
          organizationId: orgId,
          userId,
          modelId: routingDecision.selectedModel.id,
          promptTokens: responseData.inputTokens,
          completionTokens: responseData.outputTokens,
          latencyMs,
          status: 'SUCCESS',
        });

        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            messageId: assistantMsg.id,
            totalTokens: responseData.inputTokens + responseData.outputTokens,
            latencyMs,
          })}\n\n`
        );
        res.end();
      } catch (streamErr: any) {
        console.error('Streaming error:', streamErr);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'AI provider error occurred during streaming.' })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const startTime = Date.now();
      const responseData = await RouterService.executeWithFallback(aiRequest, routingDecision);
      const latencyMs = Date.now() - startTime;

      const assistantMsg = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: responseData.content,
          mode: routingDecision.mode,
          taskType: routingDecision.taskType,
          routingReason: routingDecision.routingReason,
          userExplanation: routingDecision.userExplanation,
          routingScore: routingDecision.routingScore,
          selectedModelId: routingDecision.selectedModel.id,
          tokenCountInput: responseData.inputTokens,
          tokenCountOutput: responseData.outputTokens,
          latencyMs,
        },
      });

      await UsageService.recordUsage({
        organizationId: orgId,
        userId,
        modelId: routingDecision.selectedModel.id,
        promptTokens: responseData.inputTokens,
        completionTokens: responseData.outputTokens,
        latencyMs,
        status: 'SUCCESS',
      });

      return res.json({
        conversationId: conversation.id,
        message: assistantMsg,
        mode: routingDecision.mode,
        modelName: routingDecision.selectedModel.name,
        routingReason: routingDecision.routingReason,
        userExplanation: routingDecision.userExplanation,
        securityAction: scanResult.action,
      });
    }
  }

  static async listConversations(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const conversations = await prisma.conversation.findMany({
      where: {
        organizationId: req.user.orgId,
        userId: req.user.userId,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        mode: true,
        preferredModelId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return res.json(conversations);
  }

  static async getConversation(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: req.user.orgId,
        userId: req.user.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            selectedModel: { select: { name: true, modelId: true, provider: true } },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied.' });
    }

    return res.json(conversation);
  }

  static async renameConversation(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, organizationId: req.user.orgId, userId: req.user.userId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { title },
    });

    return res.json(updated);
  }

  static async deleteConversation(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, organizationId: req.user.orgId, userId: req.user.userId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    await prisma.conversation.delete({ where: { id } });
    return res.json({ message: 'Conversation deleted successfully.' });
  }

  static async listAvailableModels(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const roleRanks: Record<string, number> = {
      EMPLOYEE: 1,
      MANAGER: 2,
      POLICY_ADMIN: 3,
      SECURITY_ADMIN: 3,
      ORGANIZATION_ADMIN: 4,
      SUPER_ADMIN: 5,
    };
    const userRank = roleRanks[req.user.roleName] || 1;

    const activeModels = await prisma.aIModel.findMany({
      where: {
        isEnabled: true,
        status: { in: ['ACTIVE', 'DEGRADED'] },
      },
      include: { provider: true },
      orderBy: { priority: 'asc' },
    });

    const candidateModels = activeModels.filter((m) => {
      const modelRank = roleRanks[m.minRole] || 1;
      return userRank >= modelRank;
    });

    return res.json(candidateModels);
  }
}
