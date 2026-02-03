import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import notificationModel from 'models/notification.model.js';

class AdminUserController {
  async getUsersPage(req: Request, res: Response) {
    try {
      Logger.info('Getting admin users page...');

      const page = Number(req.query.page) || 1;
      const limit = 8;

      const options = {
        page,
        limit,
      };

      const users = await userModel.paginate(
        {
          role: { $ne: UserRole.ADMIN },
          isDeleted: false,
        },
        options,
      );

      if (!req.user) {
        Logger.error('Admin not found');
        req.flash('error', 'Admin not found please try again');
        return res.redirect('/admin/auth/login');
      }

      // Get notifications
      const notifications = await notificationModel
        .find({
          recipientId: req.user._id,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      const totalNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });
      return res.render('admin/users', {
        title: 'Admin | Users',
        pageTitle: 'Manage Users',
        currentPath: '/admins/users',
        admin: req.user,
        users,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/users');
    }
  }

  async blockUserAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Blocking user account...');

      const userId = req.params.id;
      if (!userId) {
        Logger.error('User id not found');
        req.flash('error', 'User id not found');
        return res.redirect('/admin/users');
      }

      const user = await userModel.findOne({
        _id: userId,
        isDeleted: false,
      });
      if (!user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/admin/users');
      }

      // check if user is already blocked
      if (user.status !== UserStatus.ACTIVE) {
        Logger.error('User is already blocked');
        req.flash('error', 'User is already blocked or disabled');
        return res.redirect('/admin/users');
      }

      await userModel.updateOne(
        { _id: userId },
        {
          $set: {
            status: UserStatus.BLOCKED,
          },
        },
      );

      req.flash('success', 'User blocked successfully');
      return res.redirect('/admin/users');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/users');
    }
  }
  async activeUserAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Activating user account...');

      const userId = req.params.id;
      if (!userId) {
        Logger.error('User id not found');
        req.flash('error', 'User id not found');
        return res.redirect('/admin/users');
      }

      const user = await userModel.findOne({
        _id: userId,
        isDeleted: false,
      });
      if (!user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/admin/users');
      }

      // check if user is already active
      if (user.status === UserStatus.ACTIVE) {
        Logger.error('User is already ACTIVE');
        req.flash('error', 'User is already ACTIVE');
        return res.redirect('/admin/users');
      }

      await userModel.updateOne(
        { _id: userId },
        {
          $set: {
            status: UserStatus.ACTIVE,
          },
        },
      );

      req.flash('success', 'User activated successfully');
      return res.redirect('/admin/users');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/users');
    }
  }
  async disableUserAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Disabling user account...');

      const userId = req.params.id;
      if (!userId) {
        Logger.error('User id not found');
        req.flash('error', 'User id not found');
        return res.redirect('/admin/users');
      }

      const user = await userModel.findOne({
        _id: userId,
        isDeleted: false,
      });
      if (!user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/admin/users');
      }

      // check if user is already disabled or active
      if (user.status === UserStatus.DISABLED || user.status === UserStatus.BLOCKED) {
        Logger.error('User is already ACTIVE');
        req.flash('error', 'User is already DISABLED or BLOCKED');
        return res.redirect('/admin/users');
      }

      await userModel.updateOne(
        { _id: userId },
        {
          $set: {
            status: UserStatus.DISABLED,
          },
        },
      );

      req.flash('success', 'User disabled successfully');
      return res.redirect('/admin/users');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/users');
    }
  }
}

export default new AdminUserController();
