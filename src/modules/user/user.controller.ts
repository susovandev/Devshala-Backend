import Logger from '@config/logger.js';
import { ApiResponse } from '@libs/apiResponse.js';
import type { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import userService from './user.service.js';
import { AuthRequest } from '@modules/auth/auth.types.js';
class UserController {
  async getUserProfileHandler(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Get user profile route called with data: ${JSON.stringify(req.body)}`);

      const profile = await userService.getUserProfileService(req.user?.userId!);

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'User profile fetched successfully', profile));
    } catch (error) {
      return next(error);
    }
  }
}

export default new UserController();
