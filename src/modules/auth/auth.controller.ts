import Logger from '@config/logger.js';
import type { Request, Response, NextFunction } from 'express';
import authService from './auth.service.js';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@libs/apiResponse.js';
import { env } from '@config/env.js';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from './auth.constants.js';
import { AuthRequest } from './auth.types.js';

class AuthController {
  async signupHandler(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      Logger.info(`Signup route called with data: ${JSON.stringify(req.body)}`);

      const user = await authService.signupService(req.body);

      return res
        .status(StatusCodes.CREATED)
        .json(
          new ApiResponse(
            StatusCodes.CREATED,
            `${user?.username}Your account has been created, email has been sent`,
          ),
        );
    } catch (error) {
      return next(error);
    }
  }

  async verifyEmailHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Verify email route called with data: ${JSON.stringify(req.body)}`);

      await authService.verifyEmailService({
        userId: req.query.userId as string,
        verificationCode: req.body.verificationCode,
      });

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'Email has been verified'));
    } catch (error) {
      return next(error);
    }
  }

  async resendVerificationEmailHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Resend verification email route called with data: ${JSON.stringify(req.body)}`);

      await authService.resendVerificationEmailService(req.body.email);

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'Verification email has been sent'));
    } catch (error) {
      return next(error);
    }
  }

  async loginHandler(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      Logger.info(`Login route called with data: ${JSON.stringify(req.body)}`);

      const ip = req.ip;
      const userAgent = req.headers['user-agent'] || 'unknown';

      const { accessToken, refreshToken } = await authService.loginService({
        ...req.body,
        ip,
        userAgent,
      });

      return res
        .cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: ACCESS_TOKEN_TTL,
        })
        .cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_TTL,
        })
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'Logged in successfully'));
    } catch (error) {
      return next(error);
    }
  }

  async logoutHandler(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Logout route called with data: ${JSON.stringify(req.body)}`);
      await authService.logoutService(req.user!);

      return res
        .clearCookie('accessToken')
        .clearCookie('refreshToken')
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'Logged out successfully'));
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuthController();
