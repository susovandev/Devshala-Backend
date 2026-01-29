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
import emailModel from 'models/email.model.js';
import authorRequestEmailTemplate from 'mail/templates/author/author-request.template.js';
import { sendEmailService } from 'mail/index.js';
import { getSocketIO } from 'socket/socket.instance.js';
import notificationModel, { NotificationType } from 'models/notification.model.js';
import subscribeModel from 'models/subscribe.model.js';

class ClientController {
  async getIndexPage(req: Request, res: Response) {
    try {
      Logger.info('Getting index page...');

      const user = req.user || req.session.user || null;
      const userId = user?._id || null;

      // Pagination
      const page = Number(req.query.page) || 1;
      const limit = 3;
      const skip = (page - 1) * limit;

      // Filters
      const filters = {
        search: req.query.search || '',
        category: req.query.category || '',
        tag: req.query.tag || '',
      };

      const match: any = {
        'status.adminApproved': true,
        'status.publisherApproved': true,
        'status.adminApprovalStatus': BlogApprovalStatus.APPROVED,
        'status.publisherApprovalStatus': BlogApprovalStatus.APPROVED,
        'status.adminIsPublished': true,
        'status.publisherIsPublished': true,
      };

      // Search bby title, content or excerpt
      if (filters.search) {
        match.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { content: { $regex: filters.search, $options: 'i' } },
          { excerpt: { $regex: filters.search, $options: 'i' } },
        ];
      }

      //Category
      if (filters.category) {
        const category = await categoryModel.findOne({ name: filters.category });
        if (category) {
          match.categories = category._id;
        }
      }

      // Tag
      if (filters.tag) {
        match.tags = filters.tag;
      }

      // List of categories with blog count
      const categories = await categoryModel.aggregate([
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
      ]);

      const totalBlogs = await blogModel.countDocuments(match);
      const totalPages = Math.ceil(totalBlogs / limit);

      // Find tags from the blogs
      const tags = await blogModel.distinct('tags').lean();

      const blogDocs = await blogModel.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
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

      let notifications: any[] = [];
      let totalNotifications = 0;
      let totalUnreadNotifications = 0;

      if (userId) {
        notifications = await notificationModel
          .find({ recipientId: userId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean();

        totalNotifications = await notificationModel.countDocuments({
          recipientId: userId,
        });

        totalUnreadNotifications = await notificationModel.countDocuments({
          recipientId: userId,
          isRead: false,
        });
      }

      const blogs = {
        docs: blogDocs,
        totalDocs: totalBlogs,
        limit,
        totalPages,
        page,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      };

      const pagination = {
        currentPage: page,
        totalPages,
        totalBlogs,
        limit,
      };

      return res.render('client/index', {
        title: 'DevShala | Blogs',
        pageTitle: 'Blogs',
        currentPath: '/',
        currentUser: user,
        filters,
        categories,
        tags,
        blogs,
        pagination,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }
  async getBlogDetailsPage(req: Request, res: Response) {
    try {
      const user = req.user || req.session.user || null;
      const userId = user?._id || null;

      const blogId = req.params.id;
      if (!blogId) {
        Logger.warn('Blog id not exits on query params');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/');
      }

      const blogObjectId = new mongoose.Types.ObjectId(blogId as string);
      const userObjectId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;

      const isLiked = userObjectId
        ? await likeModel.exists({ blogId: blogObjectId, userId: userObjectId })
        : false;

      const isBookmarked = userObjectId
        ? await bookmarkModel.exists({ blogId: blogObjectId, userId: userObjectId })
        : false;

      // Increment view count
      await blogModel.findByIdAndUpdate(blogObjectId, {
        $inc: { 'stats.views': 1 },
      });

      // Fetch blog, stats, recent blogs, comments in parallel
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

      let notifications: any[] = [];
      let totalNotifications = 0;
      let totalUnreadNotifications = 0;

      if (userId) {
        notifications = await notificationModel
          .find({ recipientId: userId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean();

        totalNotifications = await notificationModel.countDocuments({
          recipientId: userId,
        });

        totalUnreadNotifications = await notificationModel.countDocuments({
          recipientId: userId,
          isRead: false,
        });
      }

      const blog = blogArr[0];
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
        sessionID: req.sessionID || null,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.warn(error);

      return res.redirect('/');
    }
  }

  async toggleLikeController(req: Request, res: Response) {
    try {
      Logger.info('Toggle like controller calling...');

      // Check blog exists
      const { id } = req.params;
      const blog = await blogModel.findById(id);
      if (!blog) {
        req.flash('error', 'Blog not found');
        return res.redirect(`/blogs/${id}`);
      }

      // Check user exists
      if (!req.user) {
        req.flash('error', 'User not found');
        return res.redirect(`/blogs/${id}`);
      }

      const existing = await likeModel.findOne({ blogId: blog?._id, userId: req.user?._id });
      if (existing) {
        await existing.deleteOne();
        req.flash('success', 'Blog unliked');
        return res.redirect(`/blogs/${id}`);
      }

      const like = await likeModel.create({ blogId: blog?._id, userId: req.user?._id });
      if (!like) {
        req.flash('error', 'Something went wrong please try again');
        return res.redirect(`/blogs/${id}`);
      }

      // Create notification
      const authorNotification = await notificationModel.create({
        recipientId: blog?.authorId,
        blogId: blog?._id,
        actorId: req.user?._id,
        type: NotificationType.LIKE,
        isRead: false,
        message: `${req.user?.username} liked your blog`,
        redirectUrl: `/blogs/${id}`,
      });
      if (!authorNotification) {
        req.flash('error', 'Something went wrong please try again');
        return res.redirect(`/blogs/${id}`);
      }

      // Emit notification to author
      const io = getSocketIO();
      io.to(`author:${blog?.authorId}`).emit('notification:new', authorNotification);

      req.flash('success', 'Blog liked');
      return res.redirect(`/blogs/${id}`);
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }

  async toggleBookmarkController(req: Request, res: Response) {
    try {
      Logger.info('Toggle bookmark controller calling...');

      // Check blog exists
      const { id } = req.params;
      const blog = await blogModel.findById(id);
      if (!blog) {
        req.flash('error', 'Blog not found');
        return res.redirect(`/blogs/${req.params.id}`);
      }

      // Check user exists
      if (!req.user) {
        req.flash('error', 'User not found');
        return res.redirect(`/blogs/${req.params.id}`);
      }

      const existing = await bookmarkModel.findOne({ blogId: blog?._id, userId: req.user._id });
      if (existing) {
        await existing.deleteOne();
        req.flash('success', 'Blog removed from bookmarks');
        return res.redirect(`/blogs/${req.params.id}`);
      }

      const bookmark = await bookmarkModel.create({ blogId: blog?._id, userId: req.user._id });
      if (!bookmark) {
        req.flash('error', 'Something went wrong please try again');
        return res.redirect(`/blogs/${req.params.id}`);
      }

      // Create notification for author
      const authorNotification = await notificationModel.create({
        recipientId: blog?.authorId,
        actorId: req.user?._id,
        type: NotificationType.BOOKMARK,
        blogId: blog?._id,
        redirectUrl: `/blogs/${blog?._id}`,
        message: `${req.user?.username} bookmarked your blog`,
        isRead: false,
      });
      if (!authorNotification) {
        req.flash('error', 'Something went wrong please try again');
        return res.redirect(`/blogs/${req.params.id}`);
      }

      // Emit notification
      const io = getSocketIO();
      io.to(`author:${blog.authorId}`).emit('notification:new', authorNotification);

      // Redirect
      req.flash('success', 'Blog added to bookmarks');
      return res.redirect(`/blogs/${req.params.id}`);
    } catch (error) {
      Logger.warn((error as Error).message);

      req.flash('error', 'Something went wrong please try again');
      return res.redirect(`/blogs/${req.params.id}`);
    }
  }

  async postCommentController(req: Request, res: Response) {
    try {
      Logger.info('Post comment controller calling...');
      // Check if blog exists
      const { id } = req.params;
      const blog = await blogModel.findById(id);
      if (!blog) {
        req.flash('error', 'Invalid blog id');

        return res.redirect(`/blogs/${req.params.id}`);
      }

      // Check if user exists
      const user = req.user;
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect(`/blogs/${req.params.id}`);
      }

      const { content } = req.body;

      // Create a new comment
      const newComment = await commentsModel.create({
        blogId: id,
        userId: user._id,
        content,
      });
      if (!newComment) {
        req.flash('error', 'Something went wrong please try again');

        return res.redirect(`/blogs/${req.params.id}`);
      }

      // Create notification
      const authorNotificationRecord = await notificationModel.create({
        recipientId: blog.authorId,
        actorId: user._id,
        type: NotificationType.COMMENT,
        blogId: blog._id,
        isRead: false,
        redirectUrl: `/blogs/${blog._id}`,
        message: `${user.username} commented on your blog`,
      });
      if (!authorNotificationRecord) {
        req.flash('error', 'Something went wrong please try again');
        return res.redirect(`/blogs/${req.params.id}`);
      }

      // Emit notification to the author
      const io = getSocketIO();
      io.to(`author:${blog.authorId}`).emit('notification:new', authorNotificationRecord);

      req.flash('success', 'Comment posted successfully');
      return res.redirect(`/blogs/${req.params.id}`);
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', 'Something went wrong please try again');
      return res.redirect(`/blogs/${req.params.id}`);
    }
  }

  async getAboutPage(req: Request, res: Response) {
    try {
      Logger.info('Getting about page...');

      const user = (req.user || req.session.user) ?? null;
      const userId = req.user?._id;

      let notifications: any[] = [];
      let totalNotifications = 0;
      let totalUnreadNotifications = 0;

      if (userId) {
        notifications = await notificationModel
          .find({ recipientId: userId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean();

        totalNotifications = await notificationModel.countDocuments({
          recipientId: userId,
        });

        totalUnreadNotifications = await notificationModel.countDocuments({
          recipientId: userId,
          isRead: false,
        });
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
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }

  async getAuthorRequestPage(req: Request, res: Response) {
    try {
      Logger.info('Getting author request page...');

      const user = req.user;
      if (!user) {
        throw new Error('You are not logged in');
      }

      const userId = user?._id || null;
      let notifications: any[] = [];
      let totalNotifications = 0;
      let totalUnreadNotifications = 0;

      if (userId) {
        notifications = await notificationModel
          .find({ recipientId: userId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean();

        totalNotifications = await notificationModel.countDocuments({
          recipientId: userId,
        });

        totalUnreadNotifications = await notificationModel.countDocuments({
          recipientId: userId,
          isRead: false,
        });
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
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }

  async createAuthorRequestHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating author request...');

      // 1. Get Email from the frontend
      const email = req.body.email;
      const normalizedEmail = email.trim().toLowerCase();

      // 2. Check if user is already registered or not
      const user = await userModel.findOne({
        email: normalizedEmail,
        isDeleted: false,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
      });
      if (!user) {
        req.flash('error', 'You are not registered please register firs and verify your email');

        return res.redirect('/authors/request');
      }

      // 3. Check if user has already requested or not
      const authorRequest = await authorRequestModel.findOne({
        userId: user._id,
        email: normalizedEmail,
      });
      if (authorRequest) {
        req.flash('error', 'You already have an author request please wait for approval');
        return res.redirect('/authors/request');
      }

      // 4. Create author request
      const newAuthorRequest = await authorRequestModel.create({
        userId: user._id,
        email: normalizedEmail,
      });
      if (!newAuthorRequest) {
        req.flash('error', 'Error occurred while creating author request please try again');

        return res.redirect('/authors/request');
      }

      // 5. Send email to publisher
      const publisher = await userModel.findOne({ role: UserRole.PUBLISHER, isDeleted: false });
      if (!publisher) {
        Logger.warn('No publisher found');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/authors/request');
      }

      const emailBody = authorRequestEmailTemplate({
        PUBLISHER_NAME: publisher?.username || 'Publisher',
        USER_EMAIL: user.email,
        USER_NAME: user.username,
        REVIEW_URL: `http://localhost:5000/authors/requests/${newAuthorRequest._id}`,
      });

      // Store mail in db
      const mailRecord = await emailModel.create({
        recipient: publisher!._id,
        sender: user._id,
        recipientEmail: publisher!.email,
        subject: 'Author Request',
        source: UserRole.USER,
        sendAt: new Date(),
        body: emailBody,
      });
      if (!mailRecord) {
        req.flash('error', 'Error occurred while creating author request please try again');

        return res.redirect('/authors/request');
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
        Logger.warn('Error occurred while creating notification');

        req.flash('error', 'Error occurred while creating author request please try again');
        return res.redirect('/authors/request');
      }

      // TODO Send notification to publisher via socket if he is online

      const io = getSocketIO();

      io.to(`publisher:${publisher._id}`).emit('notification:new', publisherNotification);

      req.flash('success', 'Your request has been sent successfully please wait for approval');
      return res.redirect('/');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

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
        req.flash('error', 'You are already subscribed');
        return res.redirect('/');
      }

      const subscribe = await subscribeModel.create({
        email: normalizedEmail,
      });
      if (!subscribe) {
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/');
      }

      // TODO SEND EMAIL TO PUBLISHER
      // TODO SEND NOTIFICATION TO PUBLISHER
      req.flash('success', 'You have been subscribed successfully');
      return res.redirect('/');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/');
    }
  }
}

export default new ClientController();
