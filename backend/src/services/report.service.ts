import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma';
import ApiError from '../utils/ApiError';

const outputDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

export const reportService = {
  async generateReport(analysisId: string, organizationId: string, createdById: string) {
    const analysis = await prisma.analysis.findFirst({ where: { id: analysisId, organizationId } });
    if (!analysis) throw new ApiError(404, 'Analysis not found');

    const timestamp = Date.now();
    const csvPath = path.join(outputDir, `report-${analysisId}-${timestamp}.csv`);
    const pdfPath = path.join(outputDir, `report-${analysisId}-${timestamp}.pdf`);

    fs.writeFileSync(csvPath, 'metric,value\nconfidence,0.90\nriskScore,0.35\n');
    fs.writeFileSync(pdfPath, `CloudShield report for ${analysis.id}\nGenerated: ${new Date().toISOString()}\n`);

    return prisma.aiReport.create({
      data: {
        organizationId,
        analysisId,
        createdById,
        reportType: analysis.type,
        title: `Analysis ${analysis.id} Report`,
        markdownContent: `# CloudShield Report\n\nAnalysis: ${analysis.id}`,
        jsonPayload: {
          confidence: analysis.confidence,
          riskScore: analysis.riskScore,
          generatedAt: new Date().toISOString(),
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
