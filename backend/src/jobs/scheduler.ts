import cron from 'node-cron';
import logger from '../config/logger';
import { prisma } from '../config/prisma';
import redisClient from '../config/redis';

export function startScheduler() {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running stale session cleanup');
    await prisma.session.updateMany({ where: { expiresAt: { lt: new Date() }, status: 'ACTIVE' }, data: { status: 'EXPIRED' } });
  });

  cron.schedule('*/30 * * * *', async () => {
    logger.info('Running redis cache cleanup marker');
    await redisClient.set('jobs:last-cache-cleanup', new Date().toISOString(), 'EX', 60 * 60 * 24);
  });

  cron.schedule('0 3 * * *', async () => {
    logger.info('Running compliance recheck marker');
    await prisma.scheduledJob.create({
      data: {
        name: 'daily-compliance-recheck',
        cronExpression: '0 3 * * *',
        lastRunAt: new Date(),
        isEnabled: true,
      },
    });
  });
}
