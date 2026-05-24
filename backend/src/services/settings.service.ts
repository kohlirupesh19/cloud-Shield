import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma';
import { aiClient } from '../ai/aiClient';

function removeFileIfExists(filePath?: string | null) {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  } catch (error) {
    console.warn('Failed to remove cleanup file', { filePath, error });
  }
}

export const settingsService = {
  async getSettings(organizationId: string) {
    let settings = await prisma.organizationSettings.findUnique({
      where: { organizationId },
    });

    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: {
          organizationId,
          orgName: 'Government of India — IT Dept.',
          cloudRegion: 'ap-south-1 (Mumbai)',
          auditFrequency: 'Daily',
          emailAlerts: true,
          smsAlerts: false,
          alertThreshold: 'Warning & above',
          activeFrameworks: ['PDPB 2023', 'ISO 27001'],
          retentionPeriod: '365 days',
        },
      });
    }

    return settings;
  },

  async updateSettings(organizationId: string, data: any) {
    const activeFrameworks = Array.isArray(data.activeFrameworks) 
      ? data.activeFrameworks 
      : typeof data.activeFrameworks === 'string'
      ? JSON.parse(data.activeFrameworks)
      : undefined;

    return prisma.organizationSettings.upsert({
      where: { organizationId },
      update: {
        orgName: data.orgName,
        cloudRegion: data.cloudRegion,
        auditFrequency: data.auditFrequency,
        emailAlerts: data.emailAlerts !== undefined ? Boolean(data.emailAlerts) : undefined,
        smsAlerts: data.smsAlerts !== undefined ? Boolean(data.smsAlerts) : undefined,
        alertThreshold: data.alertThreshold,
        activeFrameworks: activeFrameworks,
        retentionPeriod: data.retentionPeriod,
      },
      create: {
        organizationId,
        orgName: data.orgName || 'Government of India — IT Dept.',
        cloudRegion: data.cloudRegion || 'ap-south-1 (Mumbai)',
        auditFrequency: data.auditFrequency || 'Daily',
        emailAlerts: data.emailAlerts !== undefined ? Boolean(data.emailAlerts) : true,
        smsAlerts: data.smsAlerts !== undefined ? Boolean(data.smsAlerts) : false,
        alertThreshold: data.alertThreshold || 'Warning & above',
        activeFrameworks: activeFrameworks || ['PDPB 2023', 'ISO 27001'],
        retentionPeriod: data.retentionPeriod || '365 days',
      },
    });
  },

  async resetData(organizationId: string) {
    const [datasets, reports, documents] = await Promise.all([
      prisma.dataset.findMany({ where: { organizationId }, select: { storagePath: true } }),
      prisma.aiReport.findMany({ where: { organizationId }, select: { pdfPath: true, csvPath: true } }),
      prisma.complianceDocument.findMany({ where: { organizationId }, select: { filePath: true } }),
    ]);

    const filePaths = new Set<string>();
    datasets.forEach((dataset) => dataset.storagePath && filePaths.add(dataset.storagePath));
    reports.forEach((report) => {
      if (report.pdfPath) filePaths.add(report.pdfPath);
      if (report.csvPath) filePaths.add(report.csvPath);
    });
    documents.forEach((document) => document.filePath && filePaths.add(document.filePath));

    const deleted = await prisma.$transaction([
      prisma.vectorMetadata.deleteMany({ where: { organizationId } }),
      prisma.aiReport.deleteMany({ where: { organizationId } }),
      prisma.securityEvent.deleteMany({ where: { organizationId } }),
      prisma.analysis.deleteMany({ where: { organizationId } }),
      prisma.dataset.deleteMany({ where: { organizationId } }),
      prisma.complianceDocument.deleteMany({ where: { organizationId } }),
      prisma.governancePolicy.deleteMany({ where: { organizationId } }),
      prisma.notification.deleteMany({ where: { organizationId } }),
      prisma.scheduledJob.deleteMany({ where: { organizationId } }),
    ]);

    for (const filePath of filePaths) {
      removeFileIfExists(filePath);
    }

    let aiResetError: string | null = null;
    try {
      await aiClient.reset();
    } catch (error: any) {
      aiResetError = error?.message || 'AI engine reset failed';
    }

    return {
      reset: {
        vectors: deleted[0].count,
        reports: deleted[1].count,
        securityEvents: deleted[2].count,
        analyses: deleted[3].count,
        datasets: deleted[4].count,
        complianceDocuments: deleted[5].count,
        governancePolicies: deleted[6].count,
        notifications: deleted[7].count,
        scheduledJobs: deleted[8].count,
        filesRemoved: filePaths.size,
        aiEngineReset: !aiResetError,
        aiResetError,
      },
    };
  },
};
