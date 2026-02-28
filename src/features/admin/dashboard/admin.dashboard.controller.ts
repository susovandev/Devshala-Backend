import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';
import userModel, { UserRole } from 'models/user.model.js';
import blogModel, { BlogApprovalStatus } from 'models/blog.model.js';

class AdminDashboardController {
  async getAdminDashboard(req: Request, res: Response) {
    try {
      Logger.info('Getting Admin dashboard...');

      if (!req.user) {
        Logger.error('Admin not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/admins/auth/login');
      }

      const notifications = await notificationModel.find({
        recipientId: req.user._id,
      });

      const totalNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });

      const totalPublishers = await userModel.countDocuments({
        role: UserRole.PUBLISHER,
      });
      const totalAuthors = await userModel.countDocuments({
        role: UserRole.AUTHOR,
      });
      const totalUsers = await userModel.countDocuments({ role: UserRole.USER });

      const totalBlogs = await blogModel.countDocuments({});
      const totalPendingBlogs = await blogModel.countDocuments({
        status: {
          adminApprovalStatus: BlogApprovalStatus.PENDING,
          publisherApprovalStatus: BlogApprovalStatus.PENDING,
        },
      });

      return res.render('admin/dashboard', {
        title: 'Admin | Dashboard',
        pageTitle: 'Admin Dashboard',
        currentPath: '/admins/dashboard',
        admin: req.user,
        stats: {
          publishers: totalPublishers,
          authors: totalAuthors,
          users: totalUsers,
          blogs: totalBlogs,
          pending: totalPendingBlogs,
        },
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/auth/login');
    }
  }
}

export default new AdminDashboardController();
