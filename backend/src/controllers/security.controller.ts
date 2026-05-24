import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { securityService } from '../services/security.service';
import { dashboardService } from '../services/dashboard.service';

export const securityController = {
  alerts: asyncHandler(async (req: Request, res: Response) => {
    await dashboardService.hydrateBaselineIfEmpty(req.organizationId!);
    sendSuccess(res, await securityService.alerts(req.organizationId!), 'Security alerts');
  }),
  incidents: asyncHandler(async (req: Request, res: Response) => {
    await dashboardService.hydrateBaselineIfEmpty(req.organizationId!);
    sendSuccess(res, await securityService.incidents(req.organizationId!), 'Security incidents');
  }),
  threatScoring: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await securityService.threatScoring(req.organizationId!), 'Threat scoring');
  }),
  anomalyHistory: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await securityService.anomalyHistory(req.organizationId!), 'Anomaly history');
  }),
  logAccess: asyncHandler(async (req: Request, res: Response) => {
    const data = await securityService.logAccess({
      organizationId: req.organizationId!,
      requestedById: req.user!.id,
      logs: Array.isArray(req.body.logs) ? req.body.logs : [req.body.logs],
    });
    sendSuccess(res, data, 'Access logs uploaded and analyzed', 201);
  }),
  resolve: asyncHandler(async (req: Request, res: Response) => {
    const { prisma } = await import('../config/prisma');
    const event = await prisma.securityEvent.updateMany({
      where: { id: req.params.id, organizationId: req.organizationId! },
      data: { resolvedAt: new Date() },
    });
    sendSuccess(res, event, 'Alert resolved');
  }),
  stats: asyncHandler(async (req: Request, res: Response) => {
    const { prisma } = await import('../config/prisma');
    const orgId = req.organizationId!;
    const [total, critical, high, medium, resolved, accessLogs] = await Promise.all([
      prisma.securityEvent.count({ where: { organizationId: orgId } }),
      prisma.securityEvent.count({ where: { organizationId: orgId, severity: 'CRITICAL', resolvedAt: null } }),
      prisma.securityEvent.count({ where: { organizationId: orgId, severity: 'HIGH', resolvedAt: null } }),
      prisma.securityEvent.count({ where: { organizationId: orgId, severity: 'MEDIUM', resolvedAt: null } }),
      prisma.securityEvent.count({ where: { organizationId: orgId, resolvedAt: { not: null } } }),
      prisma.securityEvent.findMany({
        where: { organizationId: orgId },
        select: { eventPayload: true },
      }),
    ]);

    const activeUsers = new Set(
      accessLogs
        .map((event) => (event.eventPayload as any)?.user)
        .filter((user): user is string => typeof user === 'string' && user.trim().length > 0)
    ).size;

    sendSuccess(res, { total, critical, high, medium, resolved, activeUsers }, 'Security stats');
  }),
};
