import { Request, Response, NextFunction } from 'express';
import { UserRole } from 'models/user.model.js';
import { redirectPage } from './auth.middleware.js';

export const RoleGuardEJS =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user || !allowedRoles.includes(user.role as UserRole)) {
        req.flash('error', 'Access denied');
        return redirectPage(req, res);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
