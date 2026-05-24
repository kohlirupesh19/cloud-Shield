import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { prisma } from '../config/prisma';
import redisClient from '../config/redis';

export const healthController = {
  health: asyncHandler(async (_req: Request, res: Response) => {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    sendSuccess(res, { status: 'ok', db: 'up', redis: 'up' }, 'Service healthy');
  }),
};
