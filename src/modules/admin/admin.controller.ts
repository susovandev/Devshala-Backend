import type { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/auth.types.js';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@libs/apiResponse.js';
import Logger from '@config/logger.js';
import adminService from './admin.service.js';
import type { TBlockUserRequestBody, TUserIdRequestParam } from './admin.validations.js';

class AdminController {
  async getAdminLoginPage(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      res.render('admin/auth/login', {
        title: 'Admin Login',
        pageTitle: 'Login',
      });
    } catch (error) {
      return next(error);
    }
  }
  async getAdminDashboardHandler(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        pageTitle: 'Dashboard',
        admin: {
          username: 'Susovan',
          email: 'susovan@gmail',
          avatar: {
            url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
          },
          role: 'Admin',
        },
        notificationsCount: 3,
        stats: {
          publishers: 12,
          users: 340,
          blogs: 89,
          pending: 5,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
  async getPublishers(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      res.render('admin/publishers', {
        title: 'Admin Dashboard',
        pageTitle: 'Dashboard',
        admin: {
          username: 'Susovan',
          email: 'susovan@gmail',
          avatar: {
            url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
          },
          role: 'Admin',
        },
        notificationsCount: 3,
        publishers: [
          {
            name: 'Susovan',
            email: 'susovan@gmail',
            avatar: {
              url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
            },
            role: 'Publisher',
            isBlocked: false,
          },
          {
            name: 'Susovan',
            email: 'susovan@gmail',
            avatar: {
              url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
            },
            role: 'Publisher',
            isBlocked: false,
          },
          {
            name: 'Susovan',
            email: 'susovan@gmail',
            avatar: {
              url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
            },
            role: 'Publisher',
            isBlocked: false,
          },
          {
            name: 'Susovan',
            email: 'susovan@gmail',
            avatar: {
              url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
            },
            role: 'Publisher',
            isBlocked: false,
          },
        ],
      });
    } catch (error) {
      return next(error);
    }
  }
  async createPublisherHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Create publisher route called with data: ${JSON.stringify(req.body)}`);

      const requestBody = {
        adminId: req.user!.userId,
        username: req.body.username,
        email: req.body.email,
      };

      const user = await adminService.createPublisherService(requestBody);

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(StatusCodes.OK, 'Publisher created and credentials sent to email', user),
        );
    } catch (error) {
      return next(error);
    }
  }

  async blockUserHandler(
    req: AuthRequest<TBlockUserRequestBody, TUserIdRequestParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Block user route called with data: ${JSON.stringify(req.body)}`);

      const requestBody = {
        adminId: req?.user!.userId,
        userId: req.params.id,
        reason: req.body.reason,
      };

      await adminService.blockUserService(requestBody);

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'User blocked successfully'));
    } catch (error) {
      return next(error);
    }
  }

  async unblockUserHandler(
    req: AuthRequest<object, TUserIdRequestParam>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Unblock user route called with data: ${JSON.stringify(req.body)}`);

      const requestBody = {
        adminId: req?.user!.userId,
        userId: req.params.id,
      };

      await adminService.unblockUserService(requestBody);

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'User unblocked successfully'));
    } catch (error) {
      return next(error);
    }
  }
}

export default new AdminController();
