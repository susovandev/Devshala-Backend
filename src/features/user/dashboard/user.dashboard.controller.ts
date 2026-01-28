import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';

class UserDashboardController {
  async getUserDashboard(req: Request, res: Response) {
    try {
      Logger.info('Getting User dashboard...');

      if (!req.user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/users/auth/login');
      }

      const userId = req.user._id;

      // Get notifications
      const notifications = await notificationModel
        .find({
          recipientId: userId,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: userId,
      });

      // Get total unread notifications
      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: userId,
        isRead: false,
      });

      return res.render('users/dashboard', {
        title: 'User | Dashboard',
        pageTitle: 'User Dashboard',
        currentPath: '/users/dashboard',
        user: req.user,
        stats: {
          publishers: 12,
          users: 340,
          blogs: 89,
          pending: 5,
        },
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/login');
    }
  }
}

export default new UserDashboardController();
