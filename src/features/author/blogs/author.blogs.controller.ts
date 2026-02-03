import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import type { Request, Response } from 'express';
import blogModel from 'models/blog.model.js';
import Logger from '@config/logger.js';
import notificationModel, { NotificationType } from 'models/notification.model.js';
import categoryModel from 'models/category.model.js';
import { CloudinaryResourceType, uploadOnCloudinary } from '@libs/cloudinary.js';
import { CLOUDINARY_FOLDER_NAME } from 'constants/index.js';
import userModel, { UserRole } from 'models/user.model.js';
import { getSocketIO } from 'socket/socket.instance.js';
import emailModel, { EmailSource, EmailStatus, EmailType } from 'models/email.model.js';
import { sendEmailService } from 'mail/index.js';
import { blogUnwantedContentTemplate } from 'mail/templates/blog/unwantedContent.template.js';
import { env } from '@config/env.js';
import { analyzeBlog } from '@libs/blogReviewer.js';
import { redisGet, redisSet } from '@libs/redis.js';

class AuthorBlogController {
  async getAuthorBlogsPage(req: Request, res: Response) {
    Logger.info('Getting author blogs page...');

    const authorId = req?.user?._id;
    const page = Number(req.query.page) || 1;
    const limit = 10;

    const cacheKey = `author:blogs:page:${page}:limit:${limit}:authorId:${authorId}`;

    if (cacheKey) {
      Logger.info('Fetching author blogs from cache...');
      const cachedData = await redisGet(cacheKey);
      if (cachedData) {
        return res.render('authors/blogs', cachedData);
      }
    }

    // Aggregate blogs
    const aggregate = blogModel.aggregate([
      {
        $match: {
          authorId: new mongoose.Types.ObjectId(authorId),
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
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          categories: {
            _id: 1,
            name: 1,
          },
          tags: 1,
          status: 1,
          stats: 1,
          likeCount: 1,
          commentCount: 1,
          bookmarkCount: 1,
          createdAt: 1,
          publishedAt: 1,
        },
      },
    ]);

    // Get blogs and pagination with aggregate
    const blogs = await blogModel.aggregatePaginate(aggregate, {
      page,
      limit,
    });

    // Get notifications, total notifications and total unread notifications
    const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
      notificationModel.find({ recipientId: authorId }).sort({ createdAt: -1 }),
      notificationModel.countDocuments({ recipientId: authorId }),
      notificationModel.countDocuments({ recipientId: authorId, isRead: false }),
    ]);

    await redisSet(
      cacheKey,
      {
        title: 'Author | Blogs',
        pageTitle: 'Author Blogs',
        currentPath: '/authors/blogs',
        blogs,
        author: req.user,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      },
      300,
    );

    return res.render('authors/blogs', {
      title: 'Author | Blogs',
      pageTitle: 'Author Blogs',
      currentPath: '/authors/blogs',
      blogs,
      author: req.user,
      notifications,
      totalUnreadNotifications,
      totalNotifications,
    });
  }

  async getAuthorCreateBlogPage(req: Request, res: Response) {
    Logger.info('Creating blog...');

    const authorId = req?.user?._id;

    const [categories, notifications, totalNotifications, totalUnreadNotifications] =
      await Promise.all([
        categoryModel.find({ isDeleted: false }),
        notificationModel.find({ recipientId: authorId }).sort({ createdAt: -1 }).limit(8).lean(),
        notificationModel.countDocuments({ recipientId: authorId }),
        notificationModel.countDocuments({ recipientId: authorId, isRead: false }),
      ]);

    return res.render('authors/create-blog', {
      title: 'Author | Create Blog',
      pageTitle: 'Create Blog',
      currentPath: '/authors/blogs',
      author: req.user,
      categories,
      notifications,
      totalUnreadNotifications,
      totalNotifications,
    });
  }

  async createBlogHandler(req: Request, res: Response) {
    try {
      Logger.info('Author creating blog...');

      const authorId = req?.user?._id;

      // Get form data from the client side
      const { title, excerpt, content, categories, tags } = req.body;
      const coverImageLocalFilePath = req?.file?.path;

      // Check if local file path is not found
      if (!coverImageLocalFilePath) {
        throw new Error('Please change your cover image and try again');
      }

      // Convert content to text only
      const textOnlyContent = (content || '').replace(/<[^>]*>/g, '').trim();
      if (!textOnlyContent) {
        throw new Error('Blog content cannot be empty');
      }

      // console.log(`Text only content`, textOnlyContent);

      // get admin and publisher
      const [admin, publisher] = await Promise.all([
        userModel.findOne({ role: UserRole.ADMIN, isDeleted: false }),
        userModel.findOne({ role: UserRole.PUBLISHER, isDeleted: false }),
      ]);

      if (!admin || !publisher) {
        Logger.warn('Admin or publisher not found');
        throw new Error('Something went wrong, Please try again later');
      }

      // Analyze is it tech blog or not with AI
      const isTechBlog = await analyzeBlog({
        title,
        excerpt,
        content: textOnlyContent,
      });
      // If blog is not tech related then send mail and notification to author
      if (!isTechBlog || !isTechBlog?.isTechRelated) {
        // TODO : Add notification to author and also send mail
        const mailRecord = await emailModel.create({
          recipient: authorId,
          recipientEmail: req?.user?.email,
          subject: 'Blog is not tech related',
          type: EmailType.BLOG_UNWANTED_CONTENT,
          body: isTechBlog?.reason || 'Blog is not tech related',
          source: EmailSource.SYSTEM,
          status: EmailStatus.PENDING,
        });

        if (!mailRecord) {
          Logger.error('Sending mail to author failed');
          throw new Error('Something went wrong, Please try again later');
        }

        await sendEmailService({
          recipient: mailRecord.recipientEmail,
          subject: mailRecord.subject,
          htmlTemplate: blogUnwantedContentTemplate({
            AUTHOR_NAME: req?.user!.username as string,
            reason: mailRecord.body,
            redirectLink: `${env.CLIENT_URL}/authors/blogs`,
          }),
        });

        // TODO: sent notification to author
        const authorNotification = await notificationModel.create({
          recipientId: authorId,
          actorId: admin._id,
          type: NotificationType.BLOG_UNWANTED_CONTENT,
          message: 'Blog is not tech related',
          reason: mailRecord.body,
          redirectUrl: `${env.CLIENT_URL}/authors/blogs`,
        });

        const io = getSocketIO();
        if (io) {
          io.to(`author:${authorId}`).emit('notification:new', {
            notification: {
              ...authorNotification,
              message: 'Blog is not tech related',
            },
          });
        }

        throw new Error('Blog is not tech related please provide tech related content');
      }

      // Upload cover image to cloudinary
      const cloudinaryResponse = await uploadOnCloudinary({
        localFilePath: coverImageLocalFilePath,
        resourceType: CloudinaryResourceType.IMAGE,
        uploadFolder: `${CLOUDINARY_FOLDER_NAME}/blog/coverImage`,
      });
      if (!cloudinaryResponse) {
        Logger.warn('Failed to upload cover image to cloudinary');
        throw new Error('Something went wrong please try again');
      }

      const normalizedCategories = Array.isArray(categories)
        ? categories
        : categories
          ? [categories]
          : [];
      const normalizedTags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [];

      // Create blog
      const newBlog = await blogModel.create({
        title,
        slug: `${title
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase()}-${Date.now()}`,
        excerpt,
        coverImage: {
          publicId: cloudinaryResponse.public_id,
          url: cloudinaryResponse.secure_url,
        },
        content,
        categories: normalizedCategories,
        tags: normalizedTags,
        authorId: authorId,
        publisherId: publisher._id,
      });

      if (!newBlog) {
        throw new Error('Failed to create blog');
      }

      // Create notifications for the publisher
      const publisherNotification = await notificationModel.create({
        recipientId: publisher?._id,
        actorId: req.user!._id,
        type: NotificationType.BLOG_CREATED,
        isRead: false,
        blogId: newBlog?._id,
        message: 'A new blog has been created',
        redirectUrl: `/publishers/blogs/${newBlog?._id}/edit`,
      });

      // Create notifications for the admin
      const adminNotification = await notificationModel.create({
        recipientId: admin?._id,
        actorId: req.user!._id,
        type: NotificationType.BLOG_CREATED,
        isRead: false,
        blogId: newBlog?._id,
        message: 'A new blog has been created',
        redirectUrl: `/admin/blogs/${newBlog?._id}/edit`,
      });

      const io = getSocketIO();
      if (io) {
        io.to(`publisher:${publisherNotification.recipientId}`).emit(
          'notification:new',
          publisherNotification,
        );
        io.to(`admin:${adminNotification.recipientId}`).emit('notification:new', adminNotification);
      }

      // DELETE CACHED DATA

      req.flash('success', 'Blog created successfully waiting for the published');
      return res.redirect('/authors/blogs');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/authors/blogs/create');
    } finally {
      if (req.file && req.file.path) {
        try {
          fs.unlink(req.file.path);
          Logger.info('Local file path deleted successfully');
        } catch (error) {
          Logger.error(`Local file path deleted failed: ${(error as Error).message}`);
        }
      }
    }
  }

  async updateBlogHandler(req: Request, res: Response) {
    try {
      Logger.info('Update blog handler calling...');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/authors/blogs');
    }
  }
}

export default new AuthorBlogController();
