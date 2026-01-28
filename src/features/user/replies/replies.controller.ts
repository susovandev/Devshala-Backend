import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';

class RepliesController {
  async getRepliesPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user profile page...');

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

      return res.render('users/replies', {
        title: 'User | Replies',
        pageTitle: 'User Replies',
        currentPath: '/users/replies',
        user: req.user,
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

export default new RepliesController();
