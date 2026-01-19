import { Request, Response, NextFunction } from 'express';

export const flashMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');

  next();
};
