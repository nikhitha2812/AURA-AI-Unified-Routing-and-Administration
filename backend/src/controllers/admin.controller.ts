import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { UsageService } from '../services/usage.service';
import { AuditService } from '../services/audit.service';
import { RouterService } from '../services/router.service';
import bcrypt from 'bcryptjs';

export class AdminController {
  static async getOverview(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const analytics = await UsageService.getOrganizationAnalytics(req.user.orgId);
    return res.json(analytics);
  }

  static async listMembers(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        user: {
          select: { id: true, name: true, email: true, isEmailVerified: true, createdAt: true },
        },
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(members);
  }

  static async inviteMember(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { email, name, roleName, department } = req.body;

    if (!email || !name || !roleName) {
      return res.status(400).json({ error: 'Email, name, and role are required.' });
    }

    const role = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const tempPassword = await bcrypt.hash('AuraInvite@2026', 10);
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: tempPassword,
          defaultOrgId: req.user.orgId,
          isEmailVerified: true,
        },
      });
    }

    const existingMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: req.user.orgId, userId: user.id } },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this organization.' });
    }

    const member = await prisma.organizationMember.create({
      data: {
        organizationId: req.user.orgId,
        userId: user.id,
        roleId: role.id,
        department,
        status: 'ACTIVE',
      },
      include: { user: true, role: true },
    });

    await AuditService.log({
      organizationId: req.user.orgId,
      userId: req.user.userId,
      action: 'INVITE_USER',
      entityType: 'USER',
      entityId: user.id,
      details: { invitedEmail: email, roleAssigned: role.name },
    });

    return res.status(201).json(member);
  }

  static async updateMemberRole(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { memberId } = req.params;
    const { roleName } = req.body;

    const role = await prisma.role.findFirst({ where: { name: roleName } });
    if (!role) return res.status(400).json({ error: 'Invalid role name.' });

    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: req.user.orgId },
    });

    if (!member) return res.status(404).json({ error: 'Organization member not found.' });

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { roleId: role.id },
      include: { user: true, role: true },
    });

    await AuditService.log({
      organizationId: req.user.orgId,
      userId: req.user.userId,
      action: 'ROLE_CHANGE',
      entityType: 'USER',
      entityId: member.userId,
      details: { previousRoleId: member.roleId, newRoleId: role.id },
    });

    return res.json(updated);
  }

  static async listModels(req: AuthenticatedRequest, res: Response) {
    const models = await prisma.aIModel.findMany({
      include: {
        provider: true,
        healthLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { priority: 'asc' },
    });

    return res.json(models);
  }

  static async updateModel(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;
    const { isEnabled, priority, status, minRole } = req.body;

    const model = await prisma.aIModel.update({
      where: { id },
      data: {
        isEnabled: isEnabled !== undefined ? isEnabled : undefined,
        priority: priority !== undefined ? priority : undefined,
        status: status !== undefined ? status : undefined,
        minRole: minRole !== undefined ? minRole : undefined,
      },
    });

    await AuditService.log({
      organizationId: req.user.orgId,
      userId: req.user.userId,
      action: 'MODEL_CHANGE',
      entityType: 'MODEL',
      entityId: model.id,
      details: { modelName: model.name, isEnabled: model.isEnabled, status: model.status },
    });

    return res.json(model);
  }

  static async testModelConnection(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;

    const model = await prisma.aIModel.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!model) {
      return res.status(404).json({ error: 'AI model not found.' });
    }

    const providerInstance = RouterService.getProviderInstance(model.provider.type);
    const startTime = Date.now();
    try {
      const response = await providerInstance.generateResponse({
        modelId: model.modelId,
        messages: [{ role: 'user', content: 'Ping test connection.' }],
        maxTokens: 10,
      });

      const responseTimeMs = Date.now() - startTime;

      await prisma.modelHealthLog.create({
        data: {
          modelId: model.id,
          isAvailable: true,
          responseTimeMs,
          errorRate: 0.0,
        },
      });

      await prisma.aIModel.update({
        where: { id: model.id },
        data: { status: 'ACTIVE' },
      });

      return res.json({
        success: true,
        modelName: model.name,
        status: 'ACTIVE',
        responseTimeMs,
        responseSnippet: response.content ? response.content.substring(0, 50) : '',
      });
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTime;

      await prisma.modelHealthLog.create({
        data: {
          modelId: model.id,
          isAvailable: false,
          responseTimeMs,
          errorRate: 1.0,
          errorMessage: err.message,
        },
      });

      return res.status(502).json({
        success: false,
        modelName: model.name,
        status: 'UNAVAILABLE',
        responseTimeMs,
        error: err.message,
      });
    }
  }

  static async getSecurityEvents(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { severity, actionTaken } = req.query;

    const where: any = { organizationId: req.user.orgId };
    if (severity) where.severity = severity;
    if (actionTaken) where.actionTaken = actionTaken;

    const events = await prisma.securityEvent.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        policyRule: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json(events);
  }

  static async getAuditTrail(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const logs = await AuditService.getAuditLogs(req.user.orgId, req.query as any);
    return res.json(logs);
  }
}
