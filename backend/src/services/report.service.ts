import { prisma } from '../config/prisma';
import ApiError from '../utils/ApiError';
import { reportStorage, generateReportPdf } from './reportStorage';

/** Serialize real analysis metrics to CSV. `null` metrics render as "N/A" (no fabricated values). */
export function buildReportCsv(rows: Array<[string, unknown]>): string {
  const fmt = (v: unknown) => (v === null || v === undefined ? 'N/A' : String(v));
  return ['metric,value', ...rows.map(([k, v]) => `${k},${fmt(v)}`)].join('\n') + '\n';
}

export const reportService = {
  async generateReport(analysisId: string, organizationId: string, createdById: string) {
    const analysis = await prisma.analysis.findFirst({ where: { id: analysisId, organizationId } });
    if (!analysis) throw new ApiError(404, 'Analysis not found');

    // Reuse the latest worker-generated report markdown if available, else a stub.
    const latest = await prisma.aiReport.findFirst({
      where: { analysisId, organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const generatedAt = new Date().toISOString();
    const markdownContent = latest?.markdownContent || `# CloudShield Report\n\nAnalysis: ${analysis.id}`;

    const csvContent = buildReportCsv([
      ['analysisId', analysis.id],
      ['type', analysis.type],
      ['status', analysis.status],
      ['confidence', analysis.confidence],
      ['riskScore', analysis.riskScore],
      ['generatedAt', generatedAt],
    ]);

    // Route disk emission through the storage abstraction (local now, S3-ready).
    const csvPath = await reportStorage.save(analysisId, csvContent, 'csv');

    // Real binary PDF with layout (title + metrics table + body). Text fallback only if string passed.
    const metricsForPdf = {
      analysisId: analysis.id,
      type: analysis.type,
      status: analysis.status,
      confidence: analysis.confidence,
      riskScore: analysis.riskScore,
      generatedAt,
    };
    const pdfBuffer = await generateReportPdf(
      `CloudShield ${analysis.type} Report`,
      metricsForPdf,
      markdownContent
    );
    const pdfPath = await reportStorage.save(analysisId, pdfBuffer, 'pdf');

    return prisma.aiReport.create({
      data: {
        organizationId,
        analysisId,
        createdById,
        reportType: analysis.type,
        title: `Analysis ${analysis.id} Report`,
        markdownContent,
        jsonPayload: {
          confidence: analysis.confidence,
          riskScore: analysis.riskScore,
          generatedAt,
        },
        csvPath,
        pdfPath,
      },
    });
  },

  async summary(organizationId: string) {
    return prisma.aiReport.findMany({ where: { organizationId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 });
  },
};
