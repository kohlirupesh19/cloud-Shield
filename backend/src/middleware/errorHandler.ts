import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;
  if (env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    statusCode: statusCode || 500,
    message,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (env.NODE_ENV === 'development') {
    logger.error({ err, requestId: req.requestId }, 'Request failed');
  }

  res.status(statusCode || 500).send(response);
};

export default errorHandler;
