import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
type TLocation = 'body' | 'params' | 'query';

export const validateRequest =
  (schema: z.ZodType, location: TLocation = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[location]);

    if (!result.success) {
      req.flash('error', result.error.issues[0].message);
      return res.redirect(req.get('referer') || '/');
    }

    req[location] = result.data;
    next();
  };
