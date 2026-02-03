import Logger from '@config/logger.js';
import { Request, Response } from 'express';
import commentsModel, { CommentStatus } from 'models/comments.model.js';
import notificationModel from 'models/notification.model.js';
class AdminCommentController {
  async getCommentsPage(req: Request, res: Response) {
    try {
      Logger.info('Get admin comments page...');

      if (!req.user) {
        Logger.warn('Admin not found');

        req.flash('error', 'Unauthorized access please try again');
        return res.redirect('/admin/dashboard');
      }

      const page = Number(req.query.page) || 1;
      const limit = 8;
      const adminId = req.user._id;

      const options = {
        page,
        limit,
      };

      const comments = await commentsModel.aggregatePaginate(
        commentsModel.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: '$user',
          },
          {
            $sort: { createdAt: -1 },
          },
        ]),
        options,
      );

      // Get notifications
      const notifications = await notificationModel
        .find({ recipientId: adminId })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: adminId,
      });

      // Get total unread notifications
      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: adminId,
        isRead: false,
      });

      return res.render('admin/comments', {
        title: 'Admin | Comments',
        pageTitle: 'Manage Comments',
        currentPath: '/admins/comments',
        admin: req.user,
        comments,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.warn((error as Error).message);

      req.flash('error', 'Something went wrong');
      return res.redirect('/admin/dashboard');
    }
  }

  async moderateComment(req: Request, res: Response) {
    try {
      Logger.info('Moderating comment...');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
      }

      const adminId = req.user._id;
      const { status, reason } = req.body;

      const comment = await commentsModel.findByIdAndUpdate(adminId, {
        status,
        moderation: {
          reason,
          moderatedBy: adminId,
          moderatedAt: new Date(),
        },
        isApproved: status === CommentStatus.ACTIVE,
      });
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }

      return res.json({ success: true });
    } catch (error) {
      Logger.warn(`Moderating comment error: ${(error as Error).message}`);

      return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
  }
}

export default new AdminCommentController();
