import { SessionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export const sessionRepository = {
  create: (data: {
    organizationId: string;
    userId: string;
    refreshTokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) => prisma.session.create({ data }),

  findByTokenHash: (refreshTokenHash: string) =>
    prisma.session.findFirst({ where: { refreshTokenHash, status: SessionStatus.ACTIVE } }),

  revokeByTokenHash: (refreshTokenHash: string) =>
    prisma.session.updateMany({ where: { refreshTokenHash }, data: { status: SessionStatus.REVOKED } }),

  revokeAllForUser: (userId: string) =>
    prisma.session.updateMany({ where: { userId, status: SessionStatus.ACTIVE }, data: { status: SessionStatus.REVOKED } }),
};
