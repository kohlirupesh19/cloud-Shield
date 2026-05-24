import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { governanceService } from '../services/governance.service';

export const governanceController = {
  policies: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await governanceService.policies(req.organizationId!), 'Policies');
  }),
  violations: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, [{ id: 'v1', framework: 'ISO 27001', severity: 'HIGH' }], 'Violations');
  }),
  lineage: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await governanceService.lineage(req.organizationId!), 'Lineage summary');
  }),
  complianceStatus: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await governanceService.complianceStatus(req.organizationId!), 'Compliance status');
  }),
  createPolicy: asyncHandler(async (req: Request, res: Response) => {
    const { prisma } = await import('../config/prisma');
    const policy = await prisma.governancePolicy.create({
      data: {
        organizationId: req.organizationId!,
        name: req.body.name,
        framework: req.body.framework || 'Custom',
        policyVersion: req.body.version || '1.0',
        rules: req.body.rules || {},
        isActive: true,
      },
    });
    sendSuccess(res, policy, 'Policy created', 201);
  }),
};
