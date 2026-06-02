import { Queue } from 'bullmq';
import { bullmqRedisConnection } from '../config/redis';
import logger from '../config/logger';

export const ANALYSIS_QUEUE_NAME = 'analysis';

export const analysisQueue = new Queue(ANALYSIS_QUEUE_NAME, {
  connection: bullmqRedisConnection,
  defaultJobOptions: {
    attempts: 1, // we handle retries inside or let bull handle
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

analysisQueue.on('error', (err) => logger.error({ err }, 'Analysis queue error'));

export async function enqueueAnalysis(jobData: {
  analysisId: string;
  organizationId: string;
  projectId: string;
  datasetId?: string;
  requestedById: string;
  type: string;
  payload: any;
}) {
  const job = await analysisQueue.add('run-analysis', jobData, {
    jobId: jobData.analysisId, // dedupe by id
  });
  logger.info({ jobId: job.id, type: jobData.type }, 'Enqueued analysis job');
  return job;
}
