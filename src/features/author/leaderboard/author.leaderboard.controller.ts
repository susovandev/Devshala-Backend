import Logger from '@config/logger.js';
import { redisGet, redisSet } from '@libs/redis.js';
import { Request, Response } from 'express';
import blogModel from 'models/blog.model.js';
import notificationModel from 'models/notification.model.js';
class AuthorLeaderBoardController {
  async getAuthorLeaderboard(req: Request, res: Response) {
    Logger.info('Getting author leaderboard page...');
    
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const currentUserId = req.user?._id?.toString();

    // const cacheKey = `leaderboard:authors:page:${page}:limit:${limit}:currentUserId:${currentUserId}`;

    // if (cacheKey) {
    //   Logger.info('Fetching data from cache...');
    //   const cachedData = await redisGet(cacheKey);
    //   if (cachedData) {
    //     return res.render('authors/leaderboard', cachedData);
    //   }
    // }

    const authorsAgg = await blogModel.aggregate([
      {
        $match: {
          'status.adminIsPublished': true,
          'status.publisherIsPublished': true,
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'blogId',
          as: 'likes',
        },
      },
      {
        $addFields: {
          likeCount: { $size: '$likes' },
        },
      },
      {
        $group: {
          _id: '$authorId',
          totalLikes: { $sum: '$likeCount' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
      {
        $project: {
          _id: 1,
          totalLikes: 1,
          name: '$author.username',
          avatar: '$author.avatarUrl.url',
        },
      },
      { $sort: { totalLikes: -1 } },
    ]);

    const rankedAuthors = authorsAgg.map((author, index) => ({
      ...author,
      rank: index + 1,
      isTopThree: index < 3,
      isCurrentUser: author._id.toString() === currentUserId,
    }));

    /**
     * Get notifications
     * Count total notifications
     * Count total unread notifications
     */
    const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
      notificationModel
        .find({ recipientId: currentUserId })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      notificationModel.countDocuments({ recipientId: currentUserId }),
      notificationModel.countDocuments({ recipientId: currentUserId, isRead: false }),
    ]);

    const paginatedAuthors = rankedAuthors.slice(skip, skip + limit);

    const totalPages = Math.ceil(rankedAuthors.length / limit);

    // await redisSet(
    //   cacheKey,
    //   {
    //     title: 'Author Leaderboard',
    //     pageTitle: 'Author Leaderboard',
    //     currentPath: '/authors/leaderboard',
    //     authors: paginatedAuthors,
    //     pagination: {
    //       page,
    //       totalPages,
    //       totalDocs: rankedAuthors.length,
    //     },
    //     author: req?.user,
    //     notifications,
    //     totalNotifications,
    //     totalUnreadNotifications,
    //   },
    //   300,
    // );

    res.render('authors/leaderboard', {
      title: 'Author Leaderboard',
      pageTitle: 'Author Leaderboard',
      currentPath: '/authors/leaderboard',
      authors: paginatedAuthors,
      pagination: {
        page,
        totalPages,
        totalDocs: rankedAuthors.length,
      },
      author: req?.user,
      notifications,
      totalNotifications,
      totalUnreadNotifications,
    });
  }
}

export default new AuthorLeaderBoardController();
