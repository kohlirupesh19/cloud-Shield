import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { analysisService } from '../services/analysis.service';
import { AnalysisType } from '@prisma/client';

export const analysisController = {
  runQuality: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.runAnalysis({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.QUALITY });
    sendSuccess(res, data, 'Quality analysis completed', 201);
  }),
  runSecurity: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.runAnalysis({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.SECURITY });
    sendSuccess(res, data, 'Security analysis completed', 201);
  }),
  runGovernance: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.runAnalysis({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.GOVERNANCE });
    sendSuccess(res, data, 'Governance analysis completed', 201);
  }),
  runCompliance: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.runAnalysis({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.COMPLIANCE });
    sendSuccess(res, data, 'Compliance analysis completed', 201);
  }),
  runCombined: asyncHandler(async (req: Request, res: Response) => {
    const data = await analysisService.runAnalysis({ ...req.body, organizationId: req.organizationId!, requestedById: req.user!.id, type: AnalysisType.COMBINED });
    sendSuccess(res, data, 'Workflow analysis completed', 201);
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
