import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

const rbac = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden');
    }
    next();
  };
};

export default rbac;
