import { prisma } from '../lib/prisma';

export class AuditService {
  static async log(data: {
    organizationId?: string;
    userId?: string;
    action: string;
    entityType: 'USER' | 'POLICY' | 'MODEL' | 'CHAT' | 'SECURITY' | 'ORGANIZATION';
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  static async getAuditLogs(
    organizationId: string,
    filters?: { userId?: string; action?: string; entityType?: string }
  ) {
    const where: any = { organizationId };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;

    return prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
