import { AnalysisStatus, AnalysisType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const analysisRepository = {
  create: (data: {
    organizationId: string;
    projectId: string;
    datasetId?: string;
    requestedById: string;
    type: AnalysisType;
    inputPayload: Prisma.InputJsonValue;
  }) => prisma.analysis.create({ data }),

  updateStatus: (id: string, status: AnalysisStatus, data?: Record<string, unknown>) =>
    prisma.analysis.update({ where: { id }, data: { status, ...data } }),

  list: (organizationId: string) =>
    prisma.analysis.findMany({ where: { organizationId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 100 }),

  findById: (id: string) => prisma.analysis.findUnique({ where: { id } }),
};
