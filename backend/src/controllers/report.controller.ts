import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { reportService } from '../services/report.service';
import { prisma } from '../config/prisma';

export const reportController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.generateReport(req.body.analysisId, req.organizationId!, req.user!.id);
    sendSuccess(res, report, 'Report generated', 201);
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportService.summary(req.organizationId!);
    sendSuccess(res, data, 'Report summary');
  }),

  download: asyncHandler(async (req: Request, res: Response) => {
    const report = await prisma.aiReport.findFirst({ where: { id: req.params.id, organizationId: req.organizationId! } });
    sendSuccess(res, report, 'Report metadata');
  }),

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const report = await prisma.aiReport.findFirst({ where: { id: req.params.id, organizationId: req.organizationId! } });
    sendSuccess(res, { path: report?.csvPath }, 'CSV export');
  }),
};
