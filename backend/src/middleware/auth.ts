import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';

const auth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }

    req.user = user;
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    if (!(error instanceof jwt.TokenExpiredError)) {
      console.error('JWT Verification Error:', error);
    }
    throw new ApiError(401, 'Unauthorized');
  }
});

export default auth;
