import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { PolicyService } from '../services/policy.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup file upload storage in uploads/ directory
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadMiddleware = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export class PolicyController {
  static async getDocuments(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const documents = await prisma.policyDocument.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { rules: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(documents);
  }

  static async uploadDocument(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    if (!req.file) {
      return res.status(400).json({ error: 'No policy document file provided.' });
    }

    const documentType = req.body.documentType || 'AI_GOVERNANCE';

    try {
      const result = await PolicyService.processPolicyDocument(
        req.user.orgId,
        req.user.userId,
        req.file,
        documentType
      );

      return res.status(201).json({
        message: 'Policy document uploaded and processed successfully. Extracted rules are pending Admin review.',
        ...result,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async getRules(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const rules = await prisma.policyRule.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        document: { select: { id: true, name: true, version: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json(rules);
  }

  static async reviewRule(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;
    const { status, action, priority, description } = req.body;

    if (!['APPROVED', 'REJECTED', 'DISABLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status for policy rule review.' });
    }

    try {
      const updated = await PolicyService.reviewPolicyRule(
        req.user.orgId,
        id,
        req.user.userId,
        status as any,
        { action, priority, description }
      );

      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async deleteRule(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { id } = req.params;

    const rule = await prisma.policyRule.findFirst({
      where: { id, organizationId: req.user.orgId },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Policy rule not found.' });
    }

    await prisma.policyRule.delete({ where: { id } });
    return res.json({ message: 'Policy rule deleted successfully.' });
  }
}
