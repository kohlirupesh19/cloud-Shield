import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { datasetService } from '../services/dataset.service';
import { dashboardService } from '../services/dashboard.service';

export const datasetController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    const data = await datasetService.upload({
      organizationId: req.organizationId!,
      projectId: req.body.projectId,
      datasetName: req.body.datasetName,
      department: req.body.department,
      uploadedById: req.user!.id,
      file: req.file!,
    });
    sendSuccess(res, data, 'Dataset uploaded', 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    await dashboardService.hydrateBaselineIfEmpty(req.organizationId!);
    sendSuccess(res, await datasetService.list(req.organizationId!), 'Dataset list');
  }),

  validate: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await datasetService.validate(req.organizationId!, req.params.id), 'Dataset validation');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await datasetService.remove(req.organizationId!, req.params.id), 'Dataset deleted');
  }),
};
