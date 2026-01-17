import Logger from '@config/logger.js';
import type { Request, Response, NextFunction } from 'express';
import authService from './auth.service.js';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@libs/apiResponse.js';

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
}

export default new AuthController();
