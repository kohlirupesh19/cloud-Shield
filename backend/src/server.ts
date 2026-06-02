import { app } from './app';
import { env } from './config/env';
import logger from './config/logger';
import { startScheduler } from './jobs/scheduler';
import { startAnalysisWorker } from './jobs/analysis.worker';

app.listen(env.PORT, () => {
  startScheduler();
  startAnalysisWorker();
  logger.info({ port: env.PORT }, 'CloudShield backend running');
});
