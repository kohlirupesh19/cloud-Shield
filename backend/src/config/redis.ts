import Redis from 'ioredis';
import { env } from './env';
import logger from './logger';

// General purpose Redis client (for app use like sessions, caching)
export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  lazyConnect: false,
});

redisClient.on('error', (err) => logger.error({ err }, 'Redis client error'));
redisClient.on('connect', () => logger.info('Redis connected'));

void redisClient.ping().catch((err) => {
  logger.warn({ err }, 'Redis ping failed during startup');
});

// Dedicated connection for BullMQ (requires maxRetriesPerRequest: null)
export const bullmqRedisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

bullmqRedisConnection.on('error', (err) => logger.error({ err }, 'BullMQ Redis connection error'));
bullmqRedisConnection.on('connect', () => logger.info('BullMQ Redis connected'));

export default redisClient;
