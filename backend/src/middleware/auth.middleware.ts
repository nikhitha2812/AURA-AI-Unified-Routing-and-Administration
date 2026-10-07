import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/auth.service';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  permissions?: string[];
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  try {
    const payload = AuthService.verifyAccessToken(token);
    req.user = payload;

    // Fetch user permissions for RBAC
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: payload.orgId,
          userId: payload.userId,
        },
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User membership is suspended or inactive.' });
    }

    req.permissions = member.role.permissions.map((p) => p.permission.key);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }
};

export const requirePermission = (permissionKey: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.permissions || !req.permissions.includes(permissionKey)) {
      return res.status(403).json({
        error: `Permission denied. Required privilege: ${permissionKey}`,
      });
    }
    next();
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({
        error: `Access denied. Authorized roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};
