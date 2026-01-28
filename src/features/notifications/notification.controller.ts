import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';

class NotificationController {
  async getAuthorNotificationsPage(req: Request, res: Response) {
    try {
      if (!req.user) {
        req.flash('error', 'Please login again');
        return res.redirect('/authors/auth/login');
      }

      const authorId = req.user._id;

      const page = Number(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const [notifications, totalNotifications] = await Promise.all([
        notificationModel
          .find({ recipientId: authorId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        notificationModel.countDocuments({ recipientId: authorId }),
      ]);

      const totalPages = Math.ceil(totalNotifications / limit);

      return res.render('authors/notifications', {
        title: 'Author | Notifications',
        pageTitle: 'Notifications',
        currentPath: '/authors/notifications',
        notifications,
        pagination: {
          page,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        },
      });
    } catch (error) {
      Logger.warn((error as Error).message);

      req.flash('error', 'Something went wrong');
      return res.redirect('/authors/dashboard');
    }
  }

  async markNotificationAsRead(req: Request, res: Response) {
    Logger.info('Mark notification as read...');

    const { id } = req.params;
    const authorId = req.user!._id;

    await notificationModel.findOneAndUpdate(
      {
        _id: id,
        recipientId: authorId,
      },
      {
        isRead: true,
      },
      { new: true },
    );

    res.json({ success: true });
  }
}
export default new NotificationController();
