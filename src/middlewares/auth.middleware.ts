import type { Response, NextFunction } from 'express';
import { UnauthorizedError } from '@libs/errors.js';
import Logger from '@config/logger.js';
import authHelper from '@modules/auth/auth.helper.js';
import { AuthRequest, IAuthUserShape } from '@modules/auth/auth.types.js';
import userModel from 'models/user.model.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import { env } from '@config/env.js';
import { ACCESS_TOKEN_TTL } from '@modules/auth/auth.constants.js';

export const AuthGuard = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  Logger.debug(`Auth request from IP: ${req.ip}`);

  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return next(new UnauthorizedError('Unauthorized'));
  }

  try {
    const payload = authHelper.verifyAccessToken(accessToken);
    if (!payload) {
      return next(new UnauthorizedError('Unauthorized'));
    }

    const user = await userModel.findById(payload.sub);
    if (!user) {
      return next(new UnauthorizedError('Unauthorized'));
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
    } as IAuthUserShape;

    next();
  } catch (err) {
    next(err);
  }
};

export const AuthGuardEJS = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    Logger.error('No refresh token found');
    req.flash('error', 'Please login first');
    return res.redirect('/auth/login');
  }

  Logger.debug('Refresh token found successfully...');

  // Try access token
  if (accessToken) {
    // Decode access token
    const decoded = authHelper.verifyAccessToken(accessToken);
    if (!decoded) {
      Logger.error('Access token verification failed');
      return res.redirect('/auth/login');
    }

    Logger.debug('Access token verified successfully...');

    if (decoded) {
      const user = await userModel.findById(decoded.sub);

      if (!user) {
        Logger.error('User not found');
        return res.redirect('/auth/login');
      }

      req.user = {
        userId: user._id.toString(),
        role: user.role,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
      } as IAuthUserShape;
      res.locals.currentUser = user;
      return next();
    }
  }

  Logger.debug('Access token not found... Trying refresh token...');
  // Fallback to refresh token
  const decoded = authHelper.verifyRefreshToken(refreshToken);
  if (!decoded) {
    Logger.error('Refresh token verification failed');
    return res.redirect('/auth/login');
  }

  Logger.debug('Refresh token verified successfully...');

  // Check if refresh token is valid
  const isValidRefreshToken = await refreshTokenModel.findOne({
    userId: decoded.sub,
    tokenHash: refreshToken,
  });

  if (!isValidRefreshToken) {
    Logger.error('Invalid refresh token');
    return res.redirect('/auth/login');
  }

  const user = await userModel.findById(isValidRefreshToken.userId);
  if (!user) {
    Logger.error('User not found');
    return res.redirect('/auth/login');
  }

  const newAccessToken = authHelper.signAccessToken(user);
  if (!newAccessToken) {
    Logger.error('Access token signing failed');
    return res.redirect('/auth/login');
  }

  res.cookie('accessToken', newAccessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.NODE_ENV === 'production',
    maxAge: ACCESS_TOKEN_TTL,
  });

  req.user = {
    userId: user._id.toString(),
    role: user.role,
    username: user.username,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    status: user.status,
    avatarUrl: user.avatarUrl,
  } as IAuthUserShape;
  res.locals.currentUser = user;
  next();
};
