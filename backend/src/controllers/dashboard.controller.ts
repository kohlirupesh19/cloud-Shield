import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { dashboardService } from '../services/dashboard.service';
import { prisma } from '../config/prisma';

export const dashboardController = {
  metrics: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.metrics(req.organizationId!);
    sendSuccess(res, data, 'Dashboard metrics');
  }),

  trends: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.trends(req.organizationId!);
    sendSuccess(res, data, 'Dashboard trends');
  }),

  recentAnalyses: asyncHandler(async (req: Request, res: Response) => {
    const items = await prisma.analysis.findMany({
      where: { organizationId: req.organizationId! },
      orderBy: { createdAt: 'desc' },
      include: { dataset: true },
      take: 10,
    });
    // Serialize BigInt sizeBytes for JSON
    const serialized = items.map(item => ({
      ...item,
      dataset: item.dataset ? { ...item.dataset, sizeBytes: Number(item.dataset.sizeBytes) } : null,
    }));
    sendSuccess(res, serialized, 'Recent analyses');
  }),

  riskSummary: asyncHandler(async (req: Request, res: Response) => {
    const items = await prisma.securityEvent.groupBy({ by: ['severity'], where: { organizationId: req.organizationId! }, _count: { severity: true } });
    sendSuccess(res, items, 'Risk summary');
  }),

  anomalyCounts: asyncHandler(async (req: Request, res: Response) => {
    const count = await prisma.securityEvent.count({ where: { organizationId: req.organizationId!, resolvedAt: null } });
    sendSuccess(res, { count }, 'Anomaly count');
  }),
};
