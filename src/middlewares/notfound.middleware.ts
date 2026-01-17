import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '@libs/errors.js';

export const notFoundHandler = (req: Request, _res: Response, _next: NextFunction) => {
  _next(new NotFoundError(`Route Not Found - ${req.originalUrl}`));
};
