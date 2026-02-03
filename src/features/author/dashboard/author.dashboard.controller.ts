import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';
import { redisGet, redisSet } from '@libs/redis.js';

class AuthorDashboardController {
  async getAuthorDashboard(req: Request, res: Response) {
    try {
      Logger.info('Getting Author dashboard...');

      const authorId = req?.user?._id;

      const cacheKey = `author:dashboard:authorId:${authorId}`;

      if (cacheKey) {
        Logger.info('Fetching author dashboard from cache...');
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
          return res.render('authors/dashboard', cachedData);
        }
      }

      /**
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
        notificationModel.find({ recipientId: authorId }).sort({ createdAt: -1 }).limit(8).lean(),
        notificationModel.countDocuments({ recipientId: authorId }),
        notificationModel.countDocuments({ recipientId: authorId, isRead: false }),
      ]);

      await redisSet(
        cacheKey,
        {
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
        },
        300,
      );

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
