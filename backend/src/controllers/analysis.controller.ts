import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { analysisService } from '../services/analysis.service';
import { AnalysisType } from '@prisma/client';

export const analysisController = {
  runQuality: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.enqueue({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.QUALITY });
    sendSuccess(res, data, 'Quality analysis enqueued', 202);
  }),
  runSecurity: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.enqueue({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.SECURITY });
    sendSuccess(res, data, 'Security analysis enqueued', 202);
  }),
  runGovernance: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.enqueue({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.GOVERNANCE });
    sendSuccess(res, data, 'Governance analysis enqueued', 202);
  }),
  runCompliance: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.enqueue({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.COMPLIANCE });
    sendSuccess(res, data, 'Compliance analysis enqueued', 202);
  }),
  runCombined: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.enqueue({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.COMBINED });
    sendSuccess(res, data, 'Workflow analysis enqueued', 202);
  }),
  history: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.history(req.organizationId!);
    sendSuccess(res, data, 'Analysis history');
  }),
  status: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.status(req.params.id, req.organizationId!);
    sendSuccess(res, data, 'Analysis status');
  }),
};
