import type { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (_req: Request, res: Response, _next: NextFunction) => {
  return res.render('404', {
    title: '404 | Page Not Found',
  });
};
