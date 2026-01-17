import Logger from '@config/logger.js';
import { ApiResponse } from '@libs/apiResponse.js';
import type { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import userService from './user.service.js';
import { AuthRequest } from '@modules/auth/auth.types.js';
import { IUpdateUserProfileRequestBody } from './user.validation.js';
import { IUpdateUserProfileParams } from './user.types.js';
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

  async updateUserProfileHandler(
    req: AuthRequest<IUpdateUserProfileRequestBody>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Update user profile route called`);

      const requestBody = {
        userId: req.user!.userId,
        avatarLocalFilePath: req.file?.path,
        bio: req.body.bio,
        socialLinks: req.body.socialLinks,
      } as IUpdateUserProfileParams;

      await userService.updateUserProfileService(requestBody);

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'User profile updated successfully'));
    } catch (error) {
      return next(error);
    }
  }
}

export default new UserController();
