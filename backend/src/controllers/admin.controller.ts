import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { adminService } from '../services/admin.service';

export const adminController = {
  users: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await adminService.users(req.organizationId!), 'Users');
  }),
  organizations: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminService.organizations(), 'Organizations');
  }),
  auditLogs: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await adminService.auditLogs(req.organizationId!), 'Audit logs');
  }),
  apiUsage: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await adminService.apiUsage(req.organizationId!), 'API usage');
  }),
  systemHealth: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminService.health(), 'System health');
  }),
};
