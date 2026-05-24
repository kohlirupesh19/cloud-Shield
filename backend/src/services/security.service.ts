import { prisma } from '../config/prisma';
import { SeverityLevel, AnalysisType } from '@prisma/client';
import { analysisService } from './analysis.service';
import ApiError from '../utils/ApiError';

export const securityService = {
  alerts: (organizationId: string) =>
    prisma.securityEvent.findMany({ where: { organizationId, resolvedAt: null }, orderBy: { detectedAt: 'desc' }, take: 100 }),

  incidents: (organizationId: string) =>
    prisma.securityEvent.findMany({ where: { organizationId }, orderBy: { detectedAt: 'desc' }, take: 200 }),

  threatScoring: async (organizationId: string) => {
    const rows = await prisma.securityEvent.findMany({ where: { organizationId }, select: { threatScore: true } });
    const avg = rows.length ? rows.reduce((a, b) => a + b.threatScore, 0) / rows.length : 0;
    return { averageThreatScore: Number(avg.toFixed(2)), sampleSize: rows.length };
  },

  anomalyHistory: (organizationId: string) =>
    prisma.securityEvent.groupBy({ by: ['severity'], where: { organizationId }, _count: { severity: true } }),

  async logAccess(input: {
    organizationId: string;
    requestedById: string;
    logs: any[];
  }) {
    const defaultProj = await prisma.project.findFirst({ where: { organizationId: input.organizationId } });
    if (!defaultProj) throw new ApiError(404, 'No project found in organization');

    // Run uvicorn DBSCAN clustering security agent on the full batch
    const analysisResult = await analysisService.runAnalysis({
      organizationId: input.organizationId,
      projectId: defaultProj.id,
      requestedById: input.requestedById,
      type: AnalysisType.SECURITY,
      payload: { events: input.logs },
    });

    const aiResult = (analysisResult.result as any)?.result || {};

    const savedEvents: any[] = [];
    const resolvedEvents: any[] = [];

    for (const log of input.logs) {
      const failedLogins = Number(log.failed_logins) || 0;
      const bytesTransferred = Number(log.bytes) || 0;
      const hour = Number(log.hour) || 12;

      // Evaluate each log individually based on its own features
      const isTorIp = (log.ip || '').startsWith('185.220') || (log.ip || '').startsWith('176.10');
      const isLateNight = hour < 5 || hour >= 23;
      const isMassiveTransfer = bytesTransferred > 5_000_000;
      const isBrute = failedLogins >= 5;

      let eventSeverity: SeverityLevel = SeverityLevel.LOW;
      let isAnomaly = false;

      if (failedLogins >= 8 || (isTorIp && isBrute)) {
        eventSeverity = SeverityLevel.CRITICAL;
        isAnomaly = true;
      } else if (failedLogins >= 4 || (isMassiveTransfer && isLateNight)) {
        eventSeverity = SeverityLevel.HIGH;
        isAnomaly = true;
      } else if (failedLogins >= 2 || isMassiveTransfer || (isLateNight && bytesTransferred > 1_000_000)) {
        eventSeverity = SeverityLevel.MEDIUM;
        isAnomaly = true;
      }

      const riskScore = isAnomaly
        ? Math.min(1.0, (failedLogins * 0.05) + (bytesTransferred / 10_000_000) + (isTorIp ? 0.4 : 0))
        : 0.05;

      const saved = await prisma.securityEvent.create({
        data: {
          organizationId: input.organizationId,
          analysisId: analysisResult.analysis.id,
          eventType: log.action || 'ACCESS',
          severity: eventSeverity,
          threatScore: Number(riskScore.toFixed(3)),
          source: log.ip || '127.0.0.1',
          eventPayload: {
            user: log.user || 'Unknown',
            department: log.department || 'Unknown',
            dataset: log.dataset || 'Unknown',
            action: log.action || 'ACCESS',
            hour,
            bytes: bytesTransferred,
            failed_logins: failedLogins,
          },
          resolvedAt: isAnomaly ? null : new Date(), // Anomalies stay unresolved (show as alerts)
        },
      });

      if (isAnomaly) {
        savedEvents.push(saved);
      } else {
        resolvedEvents.push(saved);
      }
    }

    return {
      analysisId: analysisResult.analysis.id,
      threatLevel: aiResult.threat_level || 'LOW',
      riskScore: aiResult.risk_score || 0,
      events: savedEvents,
      resolved: resolvedEvents,
    };
  },
};
