import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import redisClient from '../config/redis';
import ApiError from '../utils/ApiError';
import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { tokenService } from './token.service';

const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;

export const authService = {
  async register(input: {
    organizationName: string;
    organizationSlug: string;
    fullName: string;
    email: string;
    password: string;
  }) {
    const existingOrg = await prisma.organization.findUnique({ where: { slug: input.organizationSlug } });
    if (existingOrg) throw new ApiError(409, 'Organization slug already exists');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const verifyToken = tokenService.generateSecureToken();

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: input.organizationName, slug: input.organizationSlug },
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          fullName: input.fullName,
          email: input.email,
          passwordHash,
          role: Role.ORG_ADMIN,
          emailVerifyToken: verifyToken,
        },
      });

      const project = await tx.project.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          name: 'Default Project',
          description: 'Auto-provisioned tenant project',
        },
      });

      return { org, user, project };
    });

    return { ...result, verifyToken };
  },

  async login(input: { organizationSlug?: string; email: string; password: string; ipAddress?: string; userAgent?: string }) {
    const org = input.organizationSlug
      ? await prisma.organization.findUnique({ where: { slug: input.organizationSlug } })
      : await prisma.organization.findFirst({ where: { users: { some: { email: input.email } } } });

    if (!org) throw new ApiError(401, 'Invalid credentials');

    const user = await userRepository.findByEmail(org.id, input.email);
    if (!user || user.deletedAt) throw new ApiError(401, 'Invalid credentials');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiError(423, 'Account is temporarily locked');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      const failed = user.failedLoginCount + 1;
      const lock = failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await userRepository.updateById(user.id, { failedLoginCount: failed, lockedUntil: lock });
      throw new ApiError(401, 'Invalid credentials');
    }

    await userRepository.updateById(user.id, { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() });

    const payload = { sub: user.id, role: user.role, organizationId: org.id };
    const accessToken = tokenService.signAccessToken(payload);
    const refreshToken = tokenService.signRefreshToken(payload);
    const refreshHash = tokenService.hashToken(refreshToken);

    await sessionRepository.create({
      organizationId: org.id,
      userId: user.id,
      refreshTokenHash: refreshHash,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    });

    await redisClient.set(`session:${refreshHash}`, JSON.stringify({ userId: user.id, organizationId: org.id }), 'EX', REFRESH_TTL_SECONDS);

    return {
      user,
      organization: org,
      accessToken,
      refreshToken,
    };
  },

  async refreshToken(refreshToken: string) {
    const payload = tokenService.sanitizePayload(tokenService.verifyRefreshToken(refreshToken));
    const refreshHash = tokenService.hashToken(refreshToken);
    const session = await sessionRepository.findByTokenHash(refreshHash);
    if (!session || session.expiresAt < new Date()) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const accessToken = tokenService.signAccessToken(payload);
    return { accessToken };
  },

  async logout(refreshToken: string) {
    const refreshHash = tokenService.hashToken(refreshToken);
    await sessionRepository.revokeByTokenHash(refreshHash);
    await redisClient.del(`session:${refreshHash}`);
  },
};
