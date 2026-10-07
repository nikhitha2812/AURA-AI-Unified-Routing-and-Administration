import { prisma } from '../lib/prisma';

export class UsageService {
  /**
   * Record usage log entry in DB
   */
  static async recordUsage(data: {
    organizationId: string;
    userId: string;
    modelId?: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    status: 'SUCCESS' | 'BLOCKED' | 'ERROR';
    errorDetails?: string;
  }) {
    const totalTokens = data.promptTokens + data.completionTokens;

    // Estimate cost based on model pricing if available
    let estimatedCost = 0.0;
    if (data.modelId) {
      const model = await prisma.aIModel.findUnique({ where: { id: data.modelId } });
      if (model) {
        const inputCost = (data.promptTokens / 1000) * model.costPer1kInput;
        const outputCost = (data.completionTokens / 1000) * model.costPer1kOutput;
        estimatedCost = Number((inputCost + outputCost).toFixed(6));
      }
    }

    return prisma.usageLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        modelId: data.modelId,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens,
        estimatedCost,
        latencyMs: data.latencyMs,
        status: data.status,
        errorDetails: data.errorDetails,
      },
    });
  }

  /**
   * Real database-backed organization analytics summary
   */
  static async getOrganizationAnalytics(organizationId: string) {
    const totalRequests = await prisma.usageLog.count({
      where: { organizationId },
    });

    const requestsToday = await prisma.usageLog.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const blockedRequests = await prisma.securityEvent.count({
      where: { organizationId, actionTaken: 'BLOCK' },
    });

    const securityEventsCount = await prisma.securityEvent.count({
      where: { organizationId },
    });

    const activeUsersCount = await prisma.organizationMember.count({
      where: { organizationId, status: 'ACTIVE' },
    });

    const tokenAgg = await prisma.usageLog.aggregate({
      where: { organizationId },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _avg: {
        latencyMs: true,
      },
    });

    // Model usage distribution
    const modelUsageGroup = await prisma.usageLog.groupBy({
      by: ['modelId'],
      where: { organizationId, status: 'SUCCESS' },
      _count: { id: true },
      _sum: { totalTokens: true },
    });

    const models = await prisma.aIModel.findMany();
    const modelMap = new Map(models.map((m) => [m.id, m.name]));

    const modelDistribution = modelUsageGroup.map((item) => ({
      modelId: item.modelId,
      modelName: modelMap.get(item.modelId || '') || 'Unknown Model',
      requestCount: item._count.id,
      totalTokens: item._sum.totalTokens || 0,
    }));

    return {
      totalRequests,
      requestsToday,
      blockedRequests,
      securityEventsCount,
      activeUsersCount,
      totalTokens: tokenAgg._sum.totalTokens || 0,
      totalCost: Number((tokenAgg._sum.estimatedCost || 0).toFixed(4)),
      avgLatencyMs: Math.round(tokenAgg._avg.latencyMs || 0),
      modelDistribution,
    };
  }
}
