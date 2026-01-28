import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';
import mongoose from 'mongoose';

class AdminNotificationController {
  async getAdminNotificationsPage(req: Request, res: Response) {
    try {
      if (!req.user) {
        req.flash('error', 'Please login again');
        return res.redirect('/admin/auth/login');
      }

      const adminId = req.user?._id;

      const page = Number(req.query.page) || 1;
      const limit = 8;

      const aggregate = notificationModel.aggregate([
        {
          $match: {
            recipientId: new mongoose.Types.ObjectId(adminId),
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

      res.render('admin/notifications', {
        title: 'Admin | Notifications',
        pageTitle: 'Admin Notification',
        currentPath: '/admin/notifications',
        admin: req.user,
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
      return res.redirect('/admin/dashboard');
    }
  }
  async markNotificationAsRead(req: Request, res: Response) {
    Logger.info('Mark notification as read...');

    const { id } = req.params;
    const adminId = req.user!._id;

    await notificationModel.findOneAndUpdate(
      {
        _id: id,
        recipientId: adminId,
      },
      {
        isRead: true,
      },
      { new: true },
    );

    res.json({ success: true });
  }
}
export default new AdminNotificationController();
