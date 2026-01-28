import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';
import mongoose from 'mongoose';

class NotificationController {
  async getAuthorNotificationsPage(req: Request, res: Response) {
    try {
      if (!req.user) {
        req.flash('error', 'Please login again');
        return res.redirect('/authors/auth/login');
      }

      const page = Number(req.query.page) || 1;
      const limit = 8;

      const aggregate = notificationModel.aggregate([
        {
          $match: {
            recipientId: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      const result = await notificationModel.aggregatePaginate(aggregate, {
        page,
        limit,
      });

      res.render('authors/notifications', {
        title: 'Author | Notifications',
        pageTitle: 'Notifications',
        currentPath: '/authors/notifications',
        author: req.user,
        notifications: result.docs,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          hasNext: result.hasNextPage,
          hasPrev: result.hasPrevPage,
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
