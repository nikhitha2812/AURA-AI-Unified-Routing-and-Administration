import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'aura_super_secret_jwt_access_key_2026_production_change_in_prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'aura_super_secret_jwt_refresh_key_2026_production_change_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  orgId: string;
  roleId: string;
  roleName: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
  }

  static generateRefreshToken(userId: string): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    return jwt.sign({ userId, nonce }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  }

  static async registerUser(data: { email: string; password: string; name: string; orgName?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await this.hashPassword(data.password);

    // Get default org or create new org
    let org = await prisma.organization.findFirst({ where: { slug: 'aura-corp' } });
    if (data.orgName) {
      const slug = data.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
      org = await prisma.organization.create({
        data: {
          name: data.orgName,
          slug,
          plan: 'ENTERPRISE',
        },
      });
    }

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Default Enterprise Org',
          slug: 'default-org',
        },
      });
    }

    // Role assignment: Default to EMPLOYEE unless user created new org (then ORGANIZATION_ADMIN)
    let roleName = data.orgName ? 'ORGANIZATION_ADMIN' : 'EMPLOYEE';
    const role = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error('Default role not initialized in database.');
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        isEmailVerified: true,
        defaultOrgId: org.id,
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        roleId: role.id,
        department: 'General',
      },
    });

    // Log Audit
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        action: 'REGISTER',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({ email: user.email, name: user.name }),
      },
    });

    return this.createAuthTokens(user.id, org.id, role.id, role.name, user.email);
  }

  static async loginUser(data: { email: string; password: string }, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        memberships: {
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      await prisma.auditLog.create({
        data: {
          action: 'FAILED_LOGIN',
          entityType: 'USER',
          details: JSON.stringify({ email: data.email, reason: 'Invalid user or deactivated' }),
          ipAddress,
        },
      });
      throw new Error('Invalid email or password.');
    }

    const validPassword = await this.comparePassword(data.password, user.passwordHash);
    if (!validPassword) {
      await prisma.auditLog.create({
        data: {
          organizationId: user.defaultOrgId || undefined,
          userId: user.id,
          action: 'FAILED_LOGIN',
          entityType: 'USER',
          entityId: user.id,
          details: JSON.stringify({ email: data.email, reason: 'Incorrect password' }),
          ipAddress,
        },
      });
      throw new Error('Invalid email or password.');
    }

    const membership = user.memberships.find((m) => m.organizationId === user.defaultOrgId) || user.memberships[0];

    if (!membership) {
      throw new Error('User does not belong to an active organization.');
    }

    if (membership.organization.isBlocked) {
      throw new Error('Organization account is currently suspended.');
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({ email: user.email }),
        ipAddress,
      },
    });

    return this.createAuthTokens(
      user.id,
      membership.organizationId,
      membership.roleId,
      membership.role.name,
      user.email
    );
  }

  static async createAuthTokens(userId: string, orgId: string, roleId: string, roleName: string, email: string) {
    const payload: TokenPayload = {
      userId,
      email,
      orgId,
      roleId,
      roleName,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(userId);

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatar: true, defaultOrgId: true },
    });

    const member = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
      include: {
        organization: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissions = member?.role.permissions.map((p) => p.permission.key) || [];

    return {
      accessToken,
      refreshToken,
      user: {
        ...user,
        organization: member?.organization,
        role: member?.role.name,
        permissions,
      },
    };
  }

  static async refreshSession(refreshTokenStr: string) {
    let payload;
    try {
      payload = this.verifyRefreshToken(refreshTokenStr);
    } catch (e) {
      throw new Error('Invalid or expired refresh token.');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token is invalid or has been revoked.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        memberships: {
          include: { organization: true, role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new Error('User account is inactive.');
    }

    const membership = user.memberships.find((m) => m.organizationId === user.defaultOrgId) || user.memberships[0];

    // Revoke current refresh token & issue new pair
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.createAuthTokens(
      user.id,
      membership.organizationId,
      membership.roleId,
      membership.role.name,
      user.email
    );
  }

  static async revokeSession(refreshTokenStr: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshTokenStr },
      data: { isRevoked: true },
    });
  }

  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true }; // Prevent email enumeration

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    console.log(`\n🔑 [AURA AUTH SERVICE] Password Reset Token generated for: ${email}`);
    console.log(`🔗 RESET URL: http://localhost:3000/reset-password?token=${resetToken}\n`);

    return { success: true };
  }

  static async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordReset.findUnique({ where: { token } });
    if (!record || record.isUsed || record.expiresAt < new Date()) {
      throw new Error('Invalid or expired password reset token.');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    await prisma.passwordReset.update({
      where: { id: record.id },
      data: { isUsed: true },
    });

    return { success: true };
  }
}
