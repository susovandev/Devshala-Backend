import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
// import blogModel from 'models/blog.model.js';
// import userModel from 'models/user.model.js';
// import mongoose from 'mongoose';
import notificationModel from 'models/notification.model.js';

class PublisherDashboardController {
  async getPublisherDashboard(req: Request, res: Response) {
    try {
      Logger.info('Getting Admin dashboard...');

      if (!req.user) {
        Logger.error('Admin not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/publishers/auth/login');
      }

      /*
      const publisherId = new mongoose.Types.ObjectId(req.user._id);
      const DAYS = 7; // or 30

      const blogPerformanceAgg = await blogModel.aggregate([
        {
          $match: {
            publisherId,
            createdAt: {
              $gte: new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              day: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
            },
            views: { $sum: '$stats.views' },
            likes: { $sum: '$stats.likes' },
            comments: { $sum: '$stats.comments' },
          },
        },
        {
          $sort: { '_id.day': 1 },
        },
      ]);

      const labels: string[] = [];
      const views: number[] = [];
      const likes: number[] = [];
      const comments: number[] = [];

      blogPerformanceAgg.forEach((item) => {
        labels.push(item._id.day);
        views.push(item.views);
        likes.push(item.likes);
        comments.push(item.comments);
      });

      const blogStatusAgg = await blogModel.aggregate([
        {
          $match: { publisherId: req.user._id },
        },
        {
          $group: {
            _id: '$status.approval',
            count: { $sum: 1 },
          },
        },
      ]);

      const blogStatus = {
        published: 0,
        pending: 0,
        rejected: 0,
      };

      blogStatusAgg.forEach((item) => {
        if (item._id === 'APPROVED') blogStatus.published = item.count;
        if (item._id === 'PENDING') blogStatus.pending = item.count;
        if (item._id === 'REJECTED') blogStatus.rejected = item.count;
      });

      const [totalBlogs, totalAuthors, totalViews] = await Promise.all([
        blogModel.countDocuments({ publisherId: req.user._id }),
        userModel.countDocuments({ role: 'author', createdBy: req.user._id }),
        blogModel.aggregate([
          { $match: { publisherId: req.user._id } },
          { $group: { _id: null, views: { $sum: '$stats.views' } } },
        ]),
      ]);

      return res.render('publishers/dashboard', {
        title: 'Publisher | Dashboard',
        pageTitle: 'Publisher Dashboard',
        currentPath: '/publishers/dashboard',
        publisher: req.user,
        stats: {
          totalBlogs,
          totalAuthors,
          totalViews: totalViews[0]?.views || 0,
        },
        chartData: {
          labels,
          views,
          likes,
          comments,
        },
        blogStatus,
      });
      */
      // ______________________________________________________________________

      // KPI Stats
      const stats = {
        totalBlogs: 42,
        totalAuthors: 8,
        pendingBlogs: 5,
        totalViews: 12890,
      };

      // Pending Blogs
      const pendingBlogs = [
        {
          _id: 'b101',
          title: 'Understanding Node.js Event Loop',
          author: {
            _id: 'a201',
            username: 'JohnAuthor',
          },
        },
        {
          _id: 'b102',
          title: 'MongoDB Indexing Best Practices',
          author: {
            _id: 'a202',
            username: 'JaneWriter',
          },
        },
      ];

      // Pending Authors
      const pendingAuthors = [
        {
          _id: 'a301',
          username: 'NewAuthor1',
          avatarUrl: {
            url: 'https://ui-avatars.com/api/?name=NewAuthor1',
          },
        },
        {
          _id: 'a302',
          username: 'NewAuthor2',
          avatarUrl: null,
        },
      ];

      // Top Blogs
      const topBlogs = [
        {
          _id: 'tb1',
          title: 'Scaling MERN Applications',
          stats: {
            views: 5200,
            likes: 430,
            comments: 89,
          },
        },
        {
          _id: 'tb2',
          title: 'JWT Authentication Deep Dive',
          stats: {
            views: 4100,
            likes: 390,
            comments: 72,
          },
        },
        {
          _id: 'tb3',
          title: 'Advanced MongoDB Aggregations',
          stats: {
            views: 3590,
            likes: 310,
            comments: 55,
          },
        },
      ];

      // Chart Data (Line Chart)
      const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        views: [120, 300, 450, 380, 520, 610, 720],
        likes: [20, 45, 60, 55, 80, 90, 110],
        comments: [5, 12, 18, 15, 22, 28, 35],
      };

      // Blog Status (Doughnut Chart)
      const blogStatus = {
        published: 30,
        pending: 8,
        rejected: 4,
      };

      // Get notifications
      const notifications = await notificationModel
        .find({
          recipientId: req.user._id,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      const totalNotifications = await notificationModel.find({
        recipientId: req.user._id,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });

      // Render
      return res.render('publishers/dashboard', {
        title: 'Publisher | Dashboard',
        pageTitle: 'Publisher Dashboard',
        currentPath: '/publishers/dashboard',
        publisher: req.user,

        stats: {
          totalBlogs: 128,
          totalAuthors: 14,
          pendingBlogs: 6,
          totalViews: 184520,
        },

        chartData: {
          labels: ['Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 20'],
          views: [1200, 2100, 1800, 2600, 3100],
          likes: [120, 180, 160, 210, 260],
          comments: [45, 60, 55, 70, 85],
        },

        blogStatus: {
          published: 92,
          pending: 26,
          rejected: 10,
        },

        pendingBlogs: [],
        pendingAuthors: [],
        topBlogs: [],

        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/auth/login');
    }
  }
}

export default new PublisherDashboardController();
