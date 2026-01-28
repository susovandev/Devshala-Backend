import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';

class AdminDashboardController {
  async getAdminDashboard(req: Request, res: Response) {
    try {
      Logger.info('Getting Admin dashboard...');

      if (!req.user) {
        Logger.error('Admin not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/admin/auth/login');
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

      return res.render('admin/dashboard', {
        title: 'Admin | Dashboard',
        pageTitle: 'Admin Dashboard',
        currentPath: '/admin/dashboard',
        admin: req.user,
        stats: {
          publishers: 12,
          users: 340,
          blogs: 89,
          pending: 5,
        },
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/auth/login');
    }
  }
}

export default new AdminDashboardController();
