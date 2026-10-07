import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import { prisma } from '../lib/prisma';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name, orgName } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and full name are required.' });
      }

      const authData = await AuthService.registerUser({ email, password, name, orgName });
      return res.status(201).json(authData);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const ip = req.ip || req.socket.remoteAddress;
      const authData = await AuthService.loginUser({ email, password }, ip);
      return res.json(authData);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }
  }

  static async refresh(req: AuthenticatedRequest, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required.' });
      }

      const authData = await AuthService.refreshSession(refreshToken);
      return res.json(authData);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await AuthService.revokeSession(refreshToken);
      }
      return res.json({ message: 'Successfully logged out.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Error processing logout request.' });
    }
  }

  static async forgotPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email address is required.' });
      }

      await AuthService.requestPasswordReset(email);
      return res.json({ message: 'If an account exists for this email address, password reset instructions will be sent.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required.' });
      }

      await AuthService.resetPassword(token, newPassword);
      return res.json({ message: 'Password successfully reset. You may now login.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, email: true, name: true, avatar: true, createdAt: true },
      });

      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: req.user.orgId,
            userId: req.user.userId,
          },
        },
        include: {
          organization: true,
          role: true,
        },
      });

      return res.json({
        user,
        organization: member?.organization,
        role: member?.role.name,
        permissions: req.permissions || [],
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
