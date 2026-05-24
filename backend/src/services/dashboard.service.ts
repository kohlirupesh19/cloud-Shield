import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma';
import { datasetService } from './dataset.service';
import { securityService } from './security.service';

export const dashboardService = {
  async metrics(organizationId: string) {
    // 1. Trigger dynamic baseline hydration if database is empty
    await this.hydrateBaselineIfEmpty(organizationId);

    // 2. Fetch counts
    const [datasetsCount, openAlertsCount, totalAnalysesCount] = await Promise.all([
      prisma.dataset.count({ where: { organizationId, deletedAt: null } }),
      prisma.securityEvent.count({ where: { organizationId, resolvedAt: null } }),
      prisma.analysis.count({ where: { organizationId } }),
    ]);

    // 3. Compute dynamic Quality Score from real datasets
    const datasetsList = await prisma.dataset.findMany({
      where: { organizationId, deletedAt: null },
      select: { metadata: true }
    });
    
    let avgQuality = 0.0;
    if (datasetsList.length > 0) {
      const scores = datasetsList
        .map(d => (d.metadata as any)?.qualityScore)
        .filter(s => s !== undefined && s !== null);
      if (scores.length > 0) {
        avgQuality = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
      }
    }

    // 4. Compute risk summary by severity grouping of open security events
    const openEvents = await prisma.securityEvent.findMany({
      where: { organizationId, resolvedAt: null },
      select: { severity: true }
    });
    
    const riskSummary = {
      low: openEvents.filter(e => e.severity === 'LOW').length,
      medium: openEvents.filter(e => e.severity === 'MEDIUM').length,
      high: openEvents.filter(e => e.severity === 'HIGH').length,
      critical: openEvents.filter(e => e.severity === 'CRITICAL').length,
    };

    const settings = await prisma.organizationSettings.findUnique({ where: { organizationId } });
    const activeFrameworks = settings?.activeFrameworks ? (settings.activeFrameworks as any[]) : [];
    const complianceDocsCount = await prisma.complianceDocument.count({ where: { organizationId } });
    const complianceReports = await prisma.aiReport.findMany({
      where: { organizationId, reportType: 'COMPLIANCE' },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: { jsonPayload: true },
    });

    const complianceReportScores = complianceReports
      .map((report) => {
        const payload = (report.jsonPayload as Record<string, any>) || {};
        const result = payload.result || payload;
        const score = result.compliance_percentage ?? result.complianceScore ?? result.coverage ?? result.score;
        const numeric = Number(score);
        return Number.isFinite(numeric) ? numeric : null;
      })
      .filter((value): value is number => value !== null);
    
    // Purely dynamic compliance calculation: prefer live AI report scores, otherwise derive from DB state.
    let complianceScore = 0.0;
    if (complianceReportScores.length > 0) {
      complianceScore = Number((complianceReportScores.reduce((a, b) => a + b, 0) / complianceReportScores.length).toFixed(1));
    } else if (activeFrameworks.length > 0) {
      complianceScore = Math.max(0, Math.min(100, Number((80.0 + (activeFrameworks.length * 4) + (complianceDocsCount * 5) - (openAlertsCount * 1.5)).toFixed(1))));
    }

    return {
      totalDatasets: datasetsCount,
      openSecurityAlerts: openAlertsCount,
      totalAnalyses: totalAnalysesCount,
      qualityScore: avgQuality,
      complianceScore,
      activeFrameworks,
      riskSummary,
    };
  },

  async trends(organizationId: string) {
    const rows = await prisma.analysis.findMany({
      where: { organizationId },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return rows;
  },

  async hydrateBaselineIfEmpty(organizationId: string) {
    // No-op: Keeping the database completely seed-free as requested.
  },

  writeMockFile(name: string, content: string): string {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filepath = path.join(dir, name);
    fs.writeFileSync(filepath, content);
    return filepath;
  }
};
