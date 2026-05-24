import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};

export default requestId;
