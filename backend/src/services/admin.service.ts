import { prisma } from '../config/prisma';

export const adminService = {
  users: (organizationId: string) => prisma.user.findMany({ where: { organizationId, deletedAt: null } }),
  organizations: () => prisma.organization.findMany({ where: { deletedAt: null } }),
  auditLogs: (organizationId: string) => prisma.auditLog.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: 200 }),
  apiUsage: (organizationId: string) =>
    prisma.analysis.groupBy({ by: ['type'], where: { organizationId }, _count: { type: true } }),
  health: async () => {
    const [orgs, users, analyses] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.analysis.count(),
    ]);

    return { organizations: orgs, users, analyses, status: 'ok' };
  },
};
