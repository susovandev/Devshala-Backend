import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';

class AuthorDashboardController {
  async getAuthorDashboard(req: Request, res: Response) {
    try {
      Logger.info('Getting Author dashboard...');

      if (!req.user) {
        Logger.error('Author not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/authors/auth/login');
      }

      // Get notifications
      const notifications = await notificationModel
        .find({
          recipientId: req.user._id,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
      });

      // Get total unread notifications
      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });

      return res.render('authors/dashboard', {
        title: 'Author | Dashboard',
        pageTitle: 'Author Dashboard',
        currentPath: '/authors/dashboard',
        author: req.user,
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
      return res.redirect('/authors/auth/login');
    }
  }
}

export default new AuthorDashboardController();
