import type { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/auth.types.js';
import type { TCreatePublisherRequestBody } from './admin.validations.js';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@libs/apiResponse.js';
import Logger from '@config/logger.js';
import adminService from './admin.service.js';

class AdminController {
  async createPublisherHandler(
    req: AuthRequest<TCreatePublisherRequestBody>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Create publisher route called with data: ${JSON.stringify(req.body)}`);

      await adminService.createPublisherService(req.user?.userId as string, req.body);

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'Publisher created and credentials sent to email'));
    } catch (error) {
      return next(error);
    }
  }
}

export default new AdminController();
