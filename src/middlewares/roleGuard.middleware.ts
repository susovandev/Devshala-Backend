import { Response, NextFunction } from 'express';
import { ForbiddenError } from '@libs/errors.js';
import { UserRole } from 'models/user.model.js';
import { AuthRequest } from '@modules/auth/auth.types.js';
export const RoleGuard =
  (...allowedRoles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user || !allowedRoles.includes(user.role as UserRole)) {
        throw new ForbiddenError('Access denied');
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export const RoleGuardEJS =
  (...allowedRoles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user || !allowedRoles.includes(user.role as UserRole)) {
        req.flash('error', 'Access denied');
        return res.redirect('/admin/auth/login');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
