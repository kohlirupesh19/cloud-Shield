import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { settingsService } from '../services/settings.service';

export const settingsController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const data = await settingsService.getSettings(req.organizationId!);
    sendSuccess(res, data, 'Organization settings retrieved successfully');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await settingsService.updateSettings(req.organizationId!, req.body);
    sendSuccess(res, data, 'Organization settings updated successfully');
  }),

  resetData: asyncHandler(async (req: Request, res: Response) => {
    const data = await settingsService.resetData(req.organizationId!);
    sendSuccess(res, data, 'Organization data reset successfully', 200);
  }),
};
