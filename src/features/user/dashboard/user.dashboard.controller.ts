import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';
import { redisGet, redisSet } from '@libs/redis.js';

class UserDashboardController {
  async getUserDashboard(req: Request, res: Response) {
    Logger.info('Getting User dashboard...');

    const userId = req?.user?._id;

    const cacheKey = `user:${userId}:dashboard`;
    if (cacheKey) {
      Logger.info('Fetching dashboard from cache...');
      const cachedData = await redisGet(cacheKey);
      if (cachedData) {
        return res.render('users/dashboard', cachedData);
      }
    }

    /**
     * Get notifications
     * Count total notifications
     * Count total unread notifications
     */
    const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
      notificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(8).lean(),
      notificationModel.countDocuments({ recipientId: userId }),
      notificationModel.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    if (cacheKey) {
      Logger.info('Saving dashboard to cache...');
      await redisSet(
        cacheKey,
        {
          title: 'User | Dashboard',
          pageTitle: 'User Dashboard',
          currentPath: '/users/dashboard',
          user: req?.user,
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
    }

    return res.render('users/dashboard', {
      title: 'User | Dashboard',
      pageTitle: 'User Dashboard',
      currentPath: '/users/dashboard',
      user: req?.user,
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
  }
}

export default new UserDashboardController();
