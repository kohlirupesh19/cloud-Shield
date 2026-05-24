import pino from 'pino';
import { env } from './env';

const logger = pino({
  name: env.APP_NAME,
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: ['req.headers.authorization', 'password', 'refreshToken'],
  transport: env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: true },
      }
    : undefined,
});

export default logger;
