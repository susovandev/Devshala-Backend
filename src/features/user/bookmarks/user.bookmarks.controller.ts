import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import bookmarkModel from 'models/bookmark.model.js';
import notificationModel from 'models/notification.model.js';
import mongoose from 'mongoose';

class BookmarksController {
  async getBookmarksPage(req: Request, res: Response) {
    try {
      if (!req.user) {
        req.flash('error', 'Unauthorized access');
        return res.redirect('/users/auth/login');
      }

      const userId = new mongoose.Types.ObjectId(req.user._id);
      const page = Number(req.query.page) || 1;
      const limit = 6;

      const aggregate = bookmarkModel.aggregate([
        { $match: { userId } },

        {
          $lookup: {
            from: 'blogs',
            localField: 'blogId',
            foreignField: '_id',
            as: 'blog',
          },
        },
        { $unwind: '$blog' },
        {
          $lookup: {
            from: 'users',
            localField: 'blog.authorId',
            foreignField: '_id',
            as: 'author',
          },
        },
        { $unwind: '$author' },

        {
          $lookup: {
            from: 'likes',
            localField: 'blog._id',
            foreignField: 'blogId',
            as: 'likes',
          },
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'blog._id',
            foreignField: 'blogId',
            as: 'comments',
          },
        },
        {
          $lookup: {
            from: 'bookmarks',
            localField: 'blog._id',
            foreignField: 'blogId',
            as: 'allBookmarks',
          },
        },

        {
          $addFields: {
            totalLikes: { $size: '$likes' },
            totalComments: { $size: '$comments' },
            totalBookmarks: { $size: '$allBookmarks' },
          },
        },

        {
          $project: {
            _id: 1,
            createdAt: 1,
            blog: {
              _id: '$blog._id',
              title: '$blog.title',
              slug: '$blog.slug',
              excerpt: '$blog.excerpt',
              content: '$blog.content',
              coverImage: '$blog.coverImage',
              createdAt: '$blog.createdAt',
              stats: '$blog.stats',
            },

            totalLikes: 1,
            totalComments: 1,
            totalBookmarks: 1,

            author: {
              username: '$author.username',
              avatarUrl: '$author.avatarUrl',
              role: '$author.role',
            },
          },
        },

        { $sort: { createdAt: -1 } },
      ]);

      const options = {
        page,
        limit,
      };

      const result = await bookmarkModel.aggregatePaginate(aggregate, options);

      // console.log(`bookmarsk ${JSON.stringify(result, null, 2)}`);

      // Notifications
      const notifications = await notificationModel
        .find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      const totalNotifications = await notificationModel.countDocuments({
        recipientId: userId,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: userId,
        isRead: false,
      });

      return res.render('users/bookmarks', {
        title: 'Bookmarks',
        pageTitle: 'Bookmarks',
        currentPath: '/users/bookmarks',
        user: req.user,

        bookmarks: result,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.error((error as Error).message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  }

  async deleteBookmarkHandler(req: Request, res: Response) {
    try {
      Logger.info('Removing bookmark...');
      if (!req.user) {
        req.flash('error', 'Unauthorized access');
        return res.redirect('/users/auth/login');
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: 'Invalid blog id' });
      }

      const bookmark = await bookmarkModel.findByIdAndDelete(id);
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }

      return res.status(200).json({ message: 'Bookmark removed' });
    } catch (error) {
      Logger.error((error as Error).message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  }
}

export default new BookmarksController();
