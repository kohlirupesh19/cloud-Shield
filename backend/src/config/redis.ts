import Redis from 'ioredis';
import { env } from './env';
import logger from './logger';

const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  lazyConnect: false,
});

redisClient.on('error', (err) => logger.error({ err }, 'Redis client error'));
redisClient.on('connect', () => logger.info('Redis connected'));

void redisClient.ping().catch((err) => {
  logger.warn({ err }, 'Redis ping failed during startup');
});

export default redisClient;
