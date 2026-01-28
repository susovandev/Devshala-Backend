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

class AuthorBlogController {
  async getAuthorBlogsPage(req: Request, res: Response) {
    try {
      Logger.info('Getting author blogs page...');

      if (!req.user) {
        Logger.warn('Author not found');

        req.flash('error', 'Author not found please try again');
        return res.redirect('/authors/auth/login');
      }
      const authorId = req.user._id;
      const page = Number(req.query.page) || 1;
      const limit = 10;

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

      const blogs = await blogModel.aggregatePaginate(aggregate, {
        page,
        limit,
      });

      const notifications = await notificationModel.find({
        recipientId: req.user._id,
      });

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });

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
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/authors/auth/login');
    }
  }

  async getAuthorCreateBlogPage(req: Request, res: Response) {
    try {
      Logger.info('Creating blog...');
      if (!req.user) {
        Logger.warn('Author not found');

        req.flash('error', 'Author not found please try again');
        return res.redirect('/authors/auth/login');
      }

      const categories = await categoryModel.find({ isDeleted: false });
      if (!categories) return res.redirect('/authors/blogs/create');

      const notifications = await notificationModel.find({
        recipientId: req.user._id,
      });

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });
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
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/authors/auth/login');
    }
  }

  async createBlogHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating blog...');

      if (!req.user) {
        Logger.warn('Author not found');

        req.flash('error', 'Unauthorized access please try again');
        return res.redirect('/authors/auth/login');
      }

      const authorId = req.user?._id;

      const { title, excerpt, content, categories, tags } = req.body;
      const coverImageLocalFilePath = req.file?.path;

      // 1.Check if local file path is not found
      if (!coverImageLocalFilePath) {
        Logger.warn('User id or cover image local file path not found');

        req.flash('error', 'Please change your cover image and try again');
        return res.redirect('/authors/blogs/create');
      }

      // 2. upload cover image to cloudinary
      const cloudinaryResponse = await uploadOnCloudinary({
        localFilePath: coverImageLocalFilePath,
        resourceType: CloudinaryResourceType.IMAGE,
        uploadFolder: `${CLOUDINARY_FOLDER_NAME}/blog/coverImage`,
      });
      if (!cloudinaryResponse) {
        Logger.warn('Uploading cover image to cloudinary failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/authors/blogs/create');
      }

      const publisher = await userModel.findOne({ role: UserRole.PUBLISHER });
      if (!publisher) {
        Logger.warn('Publisher not found');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/authors/blogs/create');
      }

      // 3. create blog
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
        categories,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
        authorId: authorId,
        publisherId: publisher._id,
      });
      if (!newBlog) {
        Logger.warn('Failed to create blog');

        req.flash('error', 'Failed to create blog, please try again');
        return res.redirect('/authors/blogs/create');
      }

      // GET AUTHOR AND PUBLISHER
      const admin = await userModel.findOne({ role: UserRole.ADMIN });
      if (!admin) {
        Logger.warn('Admin not found');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/authors/blogs/create');
      }

      // Create notifications for the publisher
      const publisherNotification = await notificationModel.create({
        recipientId: publisher._id,
        type: NotificationType.BLOG_CREATED,
        actorId: req.user!._id,
        isRead: false,
        blogId: newBlog?._id,
        message: 'A new blog has been created',
        redirectUrl: `/publishers/blogs/${newBlog._id}/edit`,
      });

      // Create notifications for the admin
      const adminNotification = await notificationModel.create({
        recipientId: admin._id,
        type: NotificationType.BLOG_CREATED,
        actorId: req.user!._id,
        isRead: false,
        blogId: newBlog?._id,
        message: 'A new blog has been created',
        redirectUrl: `/admin/blogs/${newBlog._id}/edit`,
      });

      const io = getSocketIO();

      io.to(`publisher:${publisherNotification.recipientId}`).emit(
        'notification:new',
        publisherNotification,
      );
      io.to(`admin:${adminNotification.recipientId}`).emit('notification:new', adminNotification);

      req.flash('success', 'Blog created successfully');
      return res.redirect('/authors/blogs');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/authors/blogs');
    } finally {
      if (req.file) {
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
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/authors/blogs');
    }
  }
}

export default new AuthorBlogController();
