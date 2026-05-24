import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import ApiError from '../utils/ApiError';

const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map((details) => details.message).join(', ');
      return next(new ApiError(400, errorMessage));
    }
    next(error);
  }
};

export default validate;
