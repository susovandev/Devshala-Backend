import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import bookmarkModel from 'models/bookmark.model.js';
import notificationModel from 'models/notification.model.js';
import mongoose from 'mongoose';
import { redisGet, redisSet, redisDelByPattern } from '@libs/redis.js';

class BookmarksController {
  async getBookmarksPage(req: Request, res: Response) {
    try {
      const userId = new mongoose.Types.ObjectId(req?.user?._id);
      const page = Number(req.query.page) || 1;
      const limit = 6;

      const cacheKey = `user:bookmarks:page:${page}:limit:${limit}:userId:${userId}`;
      if (cacheKey) {
        Logger.info('Fetching bookmarks from cache...');
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
          return res.render('users/bookmarks', cachedData);
        }
      }

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

      /**
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [blogs, notifications, totalNotifications, totalUnreadNotifications] =
        await Promise.all([
          bookmarkModel.aggregatePaginate(aggregate, options),
          notificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({ recipientId: userId }),
          notificationModel.countDocuments({ recipientId: userId, isRead: false }),
        ]);

      if (cacheKey) {
        Logger.info('Saving bookmarks to cache...');
        await redisSet(cacheKey, {
          title: 'Bookmarks',
          pageTitle: 'Bookmarks',
          currentPath: '/users/bookmarks',
          user: req?.user,
          bookmarks: blogs,
          notifications,
          totalNotifications,
          totalUnreadNotifications,
        });
      }

      return res.render('users/bookmarks', {
        title: 'Bookmarks',
        pageTitle: 'Bookmarks',
        currentPath: '/users/bookmarks',
        user: req?.user,
        bookmarks: blogs,
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

      const userId = req?.user?._id;
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: 'Invalid blog id' });
      }

      const bookmark = await bookmarkModel.findOneAndDelete({
        _id: id,
        userId,
      });
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }

      const cacheKey = `user:bookmarks:*:userId:${userId}`;
      if (cacheKey) {
        await redisDelByPattern(cacheKey);
        Logger.info('Deleted bookmarks from cache...');
      }

      return res.status(200).json({ message: 'Bookmark removed' });
    } catch (error) {
      Logger.error((error as Error).message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  }
}

export default new BookmarksController();
