import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import ApiError from '../utils/ApiError';
import { analysisService } from './analysis.service';
import { AnalysisType } from '@prisma/client';
import { parseDatasetRows, normalizeRows } from '../utils/datasetParser';
import { isTransactionOrAccessLog, mapRowsToSecurityLogs } from './securityLogMapper';
import { securityService } from './security.service'; // normal (no dynamic require) after queue decoupling

export const datasetService = {
  async upload(input: {
    organizationId: string;
    projectId?: string;
    datasetName?: string;
    department?: string;
    uploadedById: string;
    file: Express.Multer.File;
  }) {
    // If projectId is missing, fall back to the first project in organization
    let projectId = input.projectId;
    if (!projectId) {
      const defaultProj = await prisma.project.findFirst({ where: { organizationId: input.organizationId } });
      if (!defaultProj) throw new ApiError(404, 'No project found in organization to upload to');
      projectId = defaultProj.id;
    } else {
      const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: input.organizationId } });
      if (!project) throw new ApiError(404, 'Project not found');
    }

    const content = fs.readFileSync(input.file.path);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const contentStr = content.toString('utf-8');

    // Parse rows from the CSV / JSON file
    let rows: any[] = [];
    let totalRowCount = 0;
    const ext = path.extname(input.file.originalname).toLowerCase().slice(1);

    try {
      const parsed = parseDatasetRows(contentStr, input.file.originalname);
      rows = parsed.rows;
      totalRowCount = parsed.totalRowCount;
    } catch (err) {
      if (ext === 'json') {
        throw new ApiError(400, 'Invalid JSON formatting in uploaded file');
      }
      throw err;
    }

    rows = normalizeRows(rows);

    const datasetLabel = input.datasetName?.trim() || path.parse(input.file.originalname).name || input.file.originalname;
    const departmentLabel = input.department?.trim() || null;

    // 1. Create dataset entry
    const dataset = await prisma.dataset.create({
      data: {
        organizationId: input.organizationId,
        projectId,
        uploadedById: input.uploadedById,
        name: datasetLabel,
        fileType: ext || 'txt',
        storagePath: input.file.path,
        sourceHash: hash,
        sizeBytes: BigInt(input.file.size),
        rowCount: totalRowCount,
        metadata: {
          mimetype: input.file.mimetype,
          department: departmentLabel,
          datasetName: datasetLabel,
          rowPreview: rows.slice(0, 5),
          qualityScore: 100.0,
          lastCheckedAt: new Date().toISOString(),
        },
      },
    });

    // 2. Trigger (enqueue) quality check - non blocking
    let qualityScore = 100.0;
    let anomalyScore = 0.0;
    let issues: string[] = [];
    let recommendations: string[] = [];
    let analysisId: string | undefined;

    try {
      const enq = await analysisService.enqueue({
        organizationId: input.organizationId,
        projectId,
        datasetId: dataset.id,
        requestedById: input.uploadedById,
        type: AnalysisType.QUALITY,
        payload: { rows },
      });
      analysisId = enq.analysisId;
      // scores populated async / via cache on re-validate; initial snapshot uses defaults
    } catch (err) {
      console.error('Failed to enqueue quality during upload:', err);
      qualityScore = 85.0;
    }

    // 3. Update dataset with dynamic AI quality parameters
    const updated = await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        metadata: {
          ...((dataset.metadata as Record<string, any>) || {}),
          mimetype: input.file.mimetype,
          department: departmentLabel,
          datasetName: datasetLabel,
          rowPreview: rows.slice(0, 5),
          qualityScore,
          anomalyScore,
          issues,
          recommendations,
          lastCheckedAt: new Date().toISOString(),
        },
      },
    });

    // 3.5 Auto-run security behavioral check if the dataset has transaction or access logs
    if (isTransactionOrAccessLog(rows)) {
      const mappedLogs = mapRowsToSecurityLogs(rows, datasetLabel);
      try {
        await securityService.logAccess({
          organizationId: input.organizationId,
          requestedById: input.uploadedById,
          logs: mappedLogs.slice(0, 100) // Run scan on the first 100 rows
        });
      } catch (err) {
        console.error('Failed to auto-run security analysis on uploaded dataset:', err);
      }
    }

    return {
      ...updated,
      sizeBytes: Number(updated.sizeBytes),
      insights: {
        analysisId,
        // report created async by worker
        qualityScore,
        anomalyScore,
        issues,
        recommendations,
      },
    };
  },

  async list(organizationId: string) {
    const datasets = await prisma.dataset.findMany({ where: { organizationId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
    // Convert BigInt sizeBytes to Number so Express can serialize it as JSON
    return datasets.map(d => ({ ...d, sizeBytes: Number(d.sizeBytes) }));
  },

  async remove(organizationId: string, id: string) {
    const existing = await prisma.dataset.findFirst({ where: { id, organizationId } });
    if (!existing) throw new ApiError(404, 'Dataset not found');
    return prisma.dataset.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async validate(organizationId: string, id: string) {
    const dataset = await prisma.dataset.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!dataset) throw new ApiError(404, 'Dataset not found');

    if (!fs.existsSync(dataset.storagePath)) {
      throw new ApiError(404, 'Dataset file not found on disk');
    }

    const content = fs.readFileSync(dataset.storagePath);
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const contentStr = content.toString('utf-8');
    const parsed = parseDatasetRows(contentStr, dataset.name || dataset.storagePath);
    const rows = normalizeRows(parsed.rows);
    const totalRowCount = parsed.totalRowCount;

    const projectId = dataset.projectId;
    let analysisId: string | undefined;
    let innerResult: any = {};
    let qualityScore = (dataset.metadata as any)?.qualityScore ?? 95.0;
    let anomalyScore = (dataset.metadata as any)?.anomalyScore ?? 0.05;

    const unchanged = contentHash === dataset.sourceHash;
    if (unchanged) {
      // skip re-analysis thanks to sourceHash + ai content cache (phase 3+5)
      analysisId = (dataset.metadata as any)?.lastAnalysisId;
    } else {
      try {
        const enq = await analysisService.enqueue({
          organizationId,
          projectId,
          datasetId: dataset.id,
          requestedById: dataset.uploadedById,
          type: AnalysisType.QUALITY,
          payload: { rows },
        });
        analysisId = enq.analysisId;
        // scores will be available after worker or via re-validate (now cached in ai)
      } catch (err) {
        console.error('Dataset validation analysis enqueue failed, returning cached snapshot:', err);
      }
    }

    const updated = await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        rowCount: rows.length,
        sourceHash: contentHash, // update in case name etc changed but content same? keep
        metadata: {
          ...(dataset.metadata as Record<string, any> || {}),
          qualityScore,
          anomalyScore,
          issues: innerResult.issues || (dataset.metadata as any)?.issues || [],
          recommendations: innerResult.recommendations || (dataset.metadata as any)?.recommendations || [],
          rowPreview: rows.slice(0, 5),
          lastCheckedAt: new Date().toISOString(),
          lastAnalysisId: analysisId,
        },
      },
    });

    return {
      ...updated,
      sizeBytes: Number(updated.sizeBytes),
      insights: {
        analysisId,
        qualityScore,
        anomalyScore,
        issues: innerResult.issues || (dataset.metadata as any)?.issues || [],
        recommendations: innerResult.recommendations || (dataset.metadata as any)?.recommendations || [],
      },
    };
  },
};
