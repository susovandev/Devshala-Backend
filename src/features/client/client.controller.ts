/* eslint-disable @typescript-eslint/no-explicit-any */
import Logger from '@config/logger.js';
import type { Request, Response } from 'express';
import blogModel, { BlogApprovalStatus } from 'models/blog.model.js';
import bookmarkModel from 'models/bookmark.model.js';
import categoryModel from 'models/category.model.js';
import commentsModel from 'models/comments.model.js';
import likeModel from 'models/like.model.js';
import mongoose from 'mongoose';
import authorRequestModel from 'models/request.model.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import emailModel, { EmailType } from 'models/email.model.js';
import authorRequestEmailTemplate from 'mail/templates/author/author-request.template.js';
import { sendEmailService } from 'mail/index.js';
import { getSocketIO } from 'socket/socket.instance.js';
import notificationModel, { NotificationType } from 'models/notification.model.js';
import subscribeModel from 'models/subscribe.model.js';
import { redis } from '@config/redis.js';
import { env } from '@config/env.js';
import { redisDel, redisDelByPattern, redisGet, redisSet } from '@libs/redis.js';
import { summarizeBlogWithAI } from '@libs/blogSummarizer.js';

class ClientController {
  async getIndexPage(req: Request, res: Response) {
    try {
      Logger.info('Getting index page...');

      const user = req?.user;
      const userId = user?._id;

      // Set up pagination
      const page = Number(req.query.page) || 1;
      const limit = 5;

      const options = {
        page,
        limit,
      };

      // Set up filters
      const filters = {
        search: req.query.search || '',
        category: req.query.category || '',
        tag: req.query.tag || '',
      };

      // Base match conditions
      const match: any = {
        'status.adminApproved': true,
        'status.publisherApproved': true,
        'status.adminApprovalStatus': BlogApprovalStatus.APPROVED,
        'status.publisherApprovalStatus': BlogApprovalStatus.APPROVED,
        'status.adminIsPublished': true,
        'status.publisherIsPublished': true,
      };

      // Set up searching and filtering
      if (filters.search) {
        match.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { content: { $regex: filters.search, $options: 'i' } },
          { excerpt: { $regex: filters.search, $options: 'i' } },
        ];
      }
      if (filters.category) {
        const category = await categoryModel.findOne({ name: filters.category });
        if (category) {
          match.categories = category._id;
        }
      }
      if (filters.tag) {
        match.tags = filters.tag;
      }

      // const cacheKey = `client:blogs:page:${page}:limit:${limit}:search:${filters.search}:category:${filters.category}:tag:${filters.tag}:userId:${userId}`;

      // Retrieve data from the cache
      // if (cacheKey) {
      //   Logger.info('Fetching blogs from cache...');
      //   const cachedData = await redisGet(cacheKey);
      //   if (cachedData) {
      //     return res.render('client/index', cachedData);
      //   }
      // }

      const aggregate = blogModel.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author',
          },
        },
        {
          $unwind: {
            path: '$author',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories',
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
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'blogId',
            as: 'comments',
          },
        },
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'blogId',
            as: 'bookmarks',
          },
        },
        {
          $addFields: {
            likeCount: { $size: '$likes' },
            commentCount: { $size: '$comments' },
            bookmarkCount: { $size: '$bookmarks' },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            tags: 1,
            publishedAt: 1,
            coverImage: 1,
            slug: 1,
            stats: 1,
            status: 1,
            author: {
              username: 1,
              avatarUrl: 1,
            },
            commentCount: 1,
            likeCount: 1,
            bookmarkCount: 1,
          },
        },
      ]);

      /**
       * 1. List all of categories with total blogs
       * 2. Count how many blogs are there
       * 3. List all of tags
       */
      const [categories, tags] = await Promise.all([
        categoryModel.aggregate([
          {
            $lookup: {
              from: 'blogs',
              let: { categoryId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $in: ['$$categoryId', '$categories'] },

                        // blog must be published by admin and publisher
                        { $eq: ['$status.adminIsPublished', true] },
                        { $eq: ['$status.publisherIsPublished', true] },

                        // admin & publisher approval status
                        { $eq: ['$status.adminApprovalStatus', 'APPROVED'] },
                        { $eq: ['$status.publisherApprovalStatus', 'APPROVED'] },

                        // admin & publisher approval
                        { $eq: ['$status.adminApproved', true] },
                        { $eq: ['$status.publisherApproved', true] },
                      ],
                    },
                  },
                },
              ],
              as: 'blogs',
            },
          },
          {
            $addFields: {
              count: { $size: '$blogs' },
            },
          },
          {
            $project: {
              blogs: 0,
            },
          },
          { $sort: { count: -1 } },
        ]),
        blogModel.distinct('tags').lean(),
      ]);

      const blogDocs = await blogModel.aggregatePaginate(aggregate, options);

      let notifications: any[] = [];
      let totalNotifications = 0;
      let totalUnreadNotifications = 0;

      if (userId) {
        /**
         * 1.Get recent 8 notifications
         * 2.Count total notifications
         * 3.Count total unread notifications
         */
        [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
          notificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({
            recipientId: userId,
          }),
          notificationModel.countDocuments({
            recipientId: userId,
            isRead: false,
          }),
        ]);
      }

      const pagination = {
        currentPage: blogDocs.page,
        totalPages: blogDocs.totalPages,
        hasPrevPage: blogDocs.hasPrevPage,
        hasNextPage: blogDocs.hasNextPage,
        prevPage: blogDocs.prevPage,
        nextPage: blogDocs.nextPage,
        totalDocs: blogDocs.totalDocs,
      };

      // TODO: Store data to the Cache
      // if (cacheKey) {
      //   Logger.info('Storing blogs to cache...');
      //   await redisSet(cacheKey, {
      //     title: 'DevShala | Blogs',
      //     pageTitle: 'Blogs',
      //     currentPath: '/',
      //     currentUser: user,
      //     filters,
      //     categories,
      //     tags,
      //     blogs: blogDocs,
      //     pagination,
      //     notifications,
      //     totalNotifications,
      //     totalUnreadNotifications,
      //   });
      //   300;
      // }
      return res.render('client/index', {
        title: 'DevShala | Blogs',
        pageTitle: 'Blogs',
        currentPath: '/',
        currentUser: user,
        filters,
        categories,
        tags,
        blogs: blogDocs,
        pagination,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }
  async getBlogDetailsPage(req: Request, res: Response) {
    try {
      const blogId = req.params.id;
      if (!blogId) {
        throw new Error('Invalid blog id');
      }
      const user = req?.user;
      const userId = user?._id;

      // const cacheKey = `blog:details:blogId:${blogId}:userId:${userId}`;

      // if (cacheKey) {
      //   const cachedData = await redisGet(cacheKey);
      //   if (cachedData) {
      //     Logger.info('Returning cached data for blog details');
      //     return res.render('blog-details', cachedData);
      //   }
      // }

      const blogObjectId = new mongoose.Types.ObjectId(blogId as string);
      const userObjectId = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null;

      let isLiked = false;
      let isBookmarked = false;

      if (userObjectId) {
        const [likedDoc, bookmarkedDoc] = await Promise.all([
          likeModel.exists({ blogId: blogObjectId, userId: userObjectId }),
          bookmarkModel.exists({ blogId: blogObjectId, userId: userObjectId }),
        ]);

        isLiked = !!likedDoc;
        isBookmarked = !!bookmarkedDoc;
      }

      /**
       * 1. Get blog details
       * 2. Count total comments
       * 3. Count total likes
       * 4. Count total bookmarks
       */
      const [blogArr, totalComments, totalLikes, totalBookmarks, recentBlogs, comments] =
        await Promise.all([
          blogModel.aggregate([
            { $match: { _id: blogObjectId } },
            {
              $lookup: { from: 'users', localField: 'authorId', foreignField: '_id', as: 'author' },
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                title: 1,
                slug: 1,
                content: 1,
                coverImage: 1,
                tags: 1,
                status: 1,
                createdAt: 1,
                stats: 1,
                author: {
                  _id: 1,
                  username: 1,
                  avatarUrl: 1,
                  role: 1,
                  email: 1,
                  bio: 1,
                },
              },
            },
          ]),
          commentsModel.countDocuments({ blogId: blogObjectId }),
          likeModel.countDocuments({ blogId: blogObjectId }),
          bookmarkModel.countDocuments({ blogId: blogObjectId }),
          blogModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
          commentsModel.aggregate([
            { $match: { blogId: blogObjectId } },
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $addFields: {
                username: '$user.username',
                avatar: '$user.avatarUrl.url',
                createdAt: { $dateToString: { format: '%d-%m-%Y', date: '$createdAt' } },
                role: '$user.role',
              },
            },
            { $project: { user: 0 } },
          ]),
        ]);

      // Notification
      let notifications: any[] = [];
      let totalNotifications = 0;
      let totalUnreadNotifications = 0;

      if (userId) {
        /**
         * Get notifications
         * Count total notifications
         * Count total unread notifications
         */
        [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
          notificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({ recipientId: userId }),
          notificationModel.countDocuments({ recipientId: userId, isRead: false }),
        ]);
      }

      const blog = blogArr[0];

      // if (cacheKey) {
      //   await redisSet(
      //     cacheKey,
      //     {
      //       title: blog?.title || 'Blog Details',
      //       pageTitle: '',
      //       currentPath: '/users/blog-details',
      //       blog: blog || null,
      //       user: req.user || null,
      //       stats: { totalLikes, totalComments, totalBookmarks },
      //       isLiked,
      //       isBookmarked,
      //       comments,
      //       recentBlogs,
      //       notifications,
      //       totalNotifications,
      //       totalUnreadNotifications,
      //     },
      //     300,
      //   );
      //   Logger.info('Store blog details to cache');
      // }
      return res.render('blog-details', {
        title: blog?.title || 'Blog Details',
        pageTitle: '',
        currentPath: '/users/blog-details',
        blog: blog || null,
        user: req.user || null,
        stats: { totalLikes, totalComments, totalBookmarks },
        isLiked,
        isBookmarked,
        comments,
        recentBlogs,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash(`error`, (error as Error).message);
      return res.redirect('/');
    }
  }

  async getAboutPage(req: Request, res: Response) {
    try {
      Logger.info('Getting about page...');

      const user = req?.user;
      const userId = user ? req.user?._id : null;

      let notifications: any[] = [];
      let totalNotifications = 0;
      let totalUnreadNotifications = 0;

      if (userId) {
        /**
         * Get notifications
         * Count total notifications
         * Count total unread notifications
         */
        [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
          notificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({ recipientId: userId }),
          notificationModel.countDocuments({ recipientId: userId, isRead: false }),
        ]);
      }

      return res.render('client/about', {
        title: 'About',
        currentPath: '/about',
        currentUser: user,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }

  async getAuthorRequestPage(req: Request, res: Response) {
    try {
      Logger.info('Getting author request page...');

      const user = req?.user;
      const userId = user?._id || null;

      let notifications: any[] = [];
      let totalNotifications = 0;
      let totalUnreadNotifications = 0;

      if (userId) {
        /**
         * Get notifications
         * Count total notifications
         * Count total unread notifications
         */
        [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
          notificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({ recipientId: userId }),
          notificationModel.countDocuments({ recipientId: userId, isRead: false }),
        ]);
      }

      return res.render('client/author-request', {
        title: 'Author Request',
        currentPath: '/author-request',
        currentUser: user,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }

  async toggleLikeController(req: Request, res: Response) {
    try {
      Logger.info('Toggle like controller calling...');

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;

      // const cacheKey = `blog:details:blogId:${id}:userId:${req?.user?._id?.toString()}`;

      const blog = await blogModel.findById(id);
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const existing = await likeModel.findOne({
        blogId: blog._id,
        userId: req.user._id,
      });

      let liked: boolean;

      if (existing) {
        await existing.deleteOne();
        liked = false;

        // TODO: Remove cached data
        // if (cacheKey) {
        //   await redisDel(cacheKey);
        //   Logger.info('Delete blog details cached data');
        // }
      } else {
        await likeModel.create({
          blogId: blog._id,
          userId: req.user._id,
        });
        liked = true;
        // if (cacheKey) {
        //   await redisDel(cacheKey);
        //   Logger.info('Delete blog details cached data');
        // }

        // Notification (only on LIKE)
        const authorNotification = await notificationModel.create({
          recipientId: blog.authorId,
          blogId: blog._id,
          actorId: req.user._id,
          type: NotificationType.LIKE,
          isRead: false,
          message: `${req.user.username} liked your blog`,
          redirectUrl: `/blogs/${id}`,
        });

        getSocketIO().to(`author:${blog.authorId}`).emit('notification:new', authorNotification);
      }

      const totalLikes = await likeModel.countDocuments({ blogId: blog._id });

      return res.json({
        liked,
        likes: totalLikes,
      });
    } catch (error) {
      Logger.warn((error as Error).message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  }

  async toggleBookmarkController(req: Request, res: Response) {
    try {
      Logger.info('Toggle bookmark controller calling...');

      const userId = req?.user?._id;
      const cacheKey = `user:bookmarks:*:userId:${userId}`;

      const { id } = req.params;
      const blog = await blogModel.findById(id);
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const existing = await bookmarkModel.findOne({
        blogId: blog._id,
        userId: userId,
      });

      let bookmarked: boolean;

      if (existing) {
        await existing.deleteOne();
        bookmarked = false;
        // TODO: Remove bookmark cached data
        if (cacheKey) {
          await redisDelByPattern(cacheKey);
          Logger.info('Deleted bookmarks from cache...');
        }
      } else {
        await bookmarkModel.create({
          blogId: blog._id,
          userId: userId,
        });
        bookmarked = true;
        // TODO: Remove bookmark cached data
        if (cacheKey) {
          await redisDelByPattern(cacheKey);
          Logger.info('Deleted bookmarks from cache...');
        }

        // Notification (only on bookmark)
        const authorNotification = await notificationModel.create({
          recipientId: blog.authorId,
          actorId: userId,
          type: NotificationType.BOOKMARK,
          blogId: blog._id,
          redirectUrl: `/blogs/${blog._id}`,
          message: `${req?.user?.username} bookmarked your blog`,
          isRead: false,
        });

        getSocketIO().to(`author:${blog.authorId}`).emit('notification:new', authorNotification);
      }

      const totalBookmarks = await bookmarkModel.countDocuments({
        blogId: blog._id,
      });

      return res.json({
        bookmarked,
        totalBookmarks,
      });
    } catch (error) {
      Logger.warn((error as Error).message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  }

  async postCommentController(req: Request, res: Response) {
    try {
      Logger.info('Post comment controller calling...');

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;
      const { content } = req.body;

      const blog = await blogModel.findById(id);
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      const comment = await commentsModel.create({
        blogId: id,
        userId: req.user._id,
        content,
      });

      // Notification
      const authorNotification = await notificationModel.create({
        recipientId: blog.authorId,
        actorId: req.user._id,
        type: NotificationType.COMMENT,
        blogId: blog._id,
        redirectUrl: `/blogs/${blog._id}`,
        message: `${req.user.username} commented on your blog`,
        isRead: false,
      });

      getSocketIO().to(`author:${blog.authorId}`).emit('notification:new', authorNotification);

      return res.json({
        id: comment._id,
        content: comment.content,
        username: req.user.username,
        avatar: req.user.avatarUrl?.url || `https://ui-avatars.com/api/?name=${req.user.username}`,
        role: req.user.role,
        createdAt: comment.createdAt,
      });
    } catch (error) {
      Logger.warn((error as Error).message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  }

  async createAuthorRequestHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating author request...');

      const email = req.body.email;
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user is already registered or not
      const user = await userModel.findOne({
        email: normalizedEmail,
        isDeleted: false,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
      });
      if (!user) {
        throw new Error('You are not registered please register firs and verify your email');
      }

      if (
        user.role === UserRole.AUTHOR ||
        user.role === UserRole.PUBLISHER ||
        user.role === UserRole.ADMIN
      ) {
        throw new Error(`User already registered with role ${user.role}`);
      }

      // Check if user has already requested or not
      const authorRequest = await authorRequestModel.findOne({
        userId: user._id,
        email: normalizedEmail,
      });
      if (authorRequest) {
        throw new Error('You already have an author request please wait for approval');
      }

      // 4. Create author request
      const newAuthorRequest = await authorRequestModel.create({
        userId: user._id,
        email: normalizedEmail,
      });
      if (!newAuthorRequest) {
        Logger.warn('Something went wrong while creating author request');
        throw new Error('Something went wrong please try again');
      }

      // 5. Send email to publisher
      const publisher = await userModel.findOne({ role: UserRole.PUBLISHER, isDeleted: false });
      if (!publisher) {
        Logger.warn('Publisher not found');
        throw new Error('Something went wrong please try again');
      }

      const emailBody = authorRequestEmailTemplate({
        PUBLISHER_NAME: publisher?.username || 'Publisher',
        USER_EMAIL: user.email,
        USER_NAME: user.username,
        REVIEW_URL: `${env.CLIENT_URL}/authors/requests/${newAuthorRequest._id}`,
      });

      // Store mail in db
      const mailRecord = await emailModel.create({
        recipient: publisher!._id,
        sender: user?._id,
        recipientEmail: publisher!.email,
        subject: 'Author Request',
        source: UserRole.USER,
        type: EmailType.AUTHOR_REQUEST,
        sendAt: new Date(),
        body: emailBody,
      });
      if (!mailRecord) {
        Logger.warn('Something went wrong while storing mail in db');
        throw new Error('Something went wrong please try again');
      }

      await sendEmailService({
        htmlTemplate: mailRecord.body,
        sender: user.email,
        recipient: mailRecord.recipientEmail,
        subject: mailRecord.subject,
      });

      Logger.info('Email sent successfully');

      // TODO emit a notification to the publisher

      // TODO Store notification if publisher currently offline
      const publisherNotification = await notificationModel.create({
        recipientId: publisher._id,
        actorId: user._id,
        type: NotificationType.AUTHOR_REQUEST,
        message: 'New author request received',
        redirectUrl: `/authors/requests/${newAuthorRequest._id}`,
      });
      if (!publisherNotification) {
        Logger.warn('Something went wrong while creating notification');
        throw new Error('Something went wrong please try again');
      }

      // TODO Send notification to publisher via socket if he is online

      const io = getSocketIO();

      io?.to(`publisher:${publisher._id}`).emit('notification:new', publisherNotification);

      req.flash('success', 'Your request has been sent successfully please wait for approval');
      return res.redirect('/');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }

  async subscribeHandler(req: Request, res: Response) {
    try {
      Logger.info('Subscribe handler calling...');

      const { email } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      const user = await subscribeModel.findOne({
        email: normalizedEmail,
        isDeleted: false,
      });
      if (user) {
        throw new Error('You are already subscribed');
      }

      const subscribe = await subscribeModel.create({
        email: normalizedEmail,
      });
      if (!subscribe) {
        Logger.warn('Something went wrong while creating subscribe');
        throw new Error('Something went wrong please try again');
      }

      // TODO SEND EMAIL TO PUBLISHER
      // TODO SEND NOTIFICATION TO PUBLISHER
      req.flash('success', 'You have been subscribed successfully');
      return res.redirect('/');
    } catch (error: any) {
      Logger.warn(`${(error as Error).message}`);
      if (error.code === 11000) {
        req.flash('error', 'You are already subscribed');
      }
      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }

  async handleBlogView(req: Request, res: Response) {
    const blogId = req.params.blogId;

    const userId = req.user?._id?.toString();
    
    const userAgent = req.headers['user-agent'];
    const userIp = req.ip;

    const viewerId = userId ? `${userId}:${userIp}:${userAgent}` : `${userIp}:${userAgent}`;

    const viewedKey = `blog:viewed:${blogId}:${viewerId}`;

    const alreadyViewed = await redis.sismember(viewedKey, viewerId);
    console.log(`ALREADY VIEWED`, alreadyViewed);

    if (!alreadyViewed) {
      await redis.sadd(viewedKey, viewerId);
      await redis.expire(viewedKey, 60 * 60 * 24);

      const blog = await blogModel.findByIdAndUpdate(
        blogId,
        { $inc: { 'stats.views': 1 } },
        { new: true },
      );

      // Emit updated value
      const io = getSocketIO();
      io?.to(`blog:${blogId}`).emit('viewsUpdated', {
        views: blog?.stats.views,
      });
    }

    return res.json({ success: true });
  }

  async getSupportPage(req: Request, res: Response) {
    return res.render('support', {
      title: 'Support | DevShala',
      currentUser: req?.user,
    });
  }

  async getAccountSupportPage(req: Request, res: Response) {
    return res.render('account-support', {
      title: 'Account Support | DevShala',
      currentUser: req?.user,
    });
  }

  async getForgotPasswordPage(req: Request, res: Response) {
    return res.render('forgot-password', {
      title: 'Forgot Password | DevShala',
      currentUser: req?.user,
    });
  }

  async getResendVerificationPage(req: Request, res: Response) {
    return res.render('resend-verification', {
      title: 'Resend Verification | DevShala',
      currentUser: req?.user,
    });
  }

  async getEmailChangePage(req: Request, res: Response) {
    return res.render('email-change', {
      title: 'Email Change | DevShala',
      currentUser: req?.user,
    });
  }

  async getAccountLockPage(req: Request, res: Response) {
    return res.render('account-lock', {
      title: 'Account Lock | DevShala',
      currentUser: req?.user,
    });
  }

  async generateBlogSummary(req: Request, res: Response) {
    try {
      const { blogId } = req.params;

      const blog = await blogModel.findById(blogId).select('title content');

      if (!blog) {
        return res.status(404).json({ status: false, statusCode: 404, message: 'Blog not found' });
      }

      const summary = await summarizeBlogWithAI(blog.title, blog.content);

      return res.status(200).json({ summary });
    } catch (error) {
      Logger.error((error as Error).message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  }
}

export default new ClientController();
