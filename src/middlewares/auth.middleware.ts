import type { Response, NextFunction } from 'express';
import { UnauthorizedError } from '@libs/errors.js';
import Logger from '@config/logger.js';
import authHelper from '@modules/auth/auth.helper.js';
import { AuthRequest, IAuthUserShape } from '@modules/auth/auth.types.js';

export const AuthGuard = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  Logger.debug(`Auth request from IP: ${req.ip}`);

  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return next(new UnauthorizedError('Unauthorized'));
  }

  try {
    const payload = authHelper.verifyAccessToken(accessToken);

    req.user = {
      userId: payload.sub as string,
      role: payload.role as string,
    } as IAuthUserShape;

    next();
  } catch (err) {
    next(err);
  }
};
