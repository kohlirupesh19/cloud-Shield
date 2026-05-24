import { app } from './app';
import { env } from './config/env';
import logger from './config/logger';
import { startScheduler } from './jobs/scheduler';

app.listen(env.PORT, () => {
  startScheduler();
  logger.info({ port: env.PORT }, 'CloudShield backend running');
});
