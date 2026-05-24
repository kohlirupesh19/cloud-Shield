import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

export const userRepository = {
  findByEmail: (organizationId: string, email: string) =>
    prisma.user.findFirst({ where: { organizationId, email, deletedAt: null } }),

  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  create: (data: {
    organizationId: string;
    fullName: string;
    email: string;
    passwordHash: string;
    role: Role;
    emailVerifyToken?: string;
  }) => prisma.user.create({ data }),

  updateById: (id: string, data: Record<string, unknown>) =>
    prisma.user.update({ where: { id }, data }),

  listByOrganization: (organizationId: string) =>
    prisma.user.findMany({ where: { organizationId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
};
