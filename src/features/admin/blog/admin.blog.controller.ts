/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import blogModel, { BlogApprovalStatus } from 'models/blog.model.js';
import Logger from '@config/logger.js';
import notificationModel, { NotificationType } from 'models/notification.model.js';
import categoryModel from 'models/category.model.js';
import {
  CloudinaryResourceType,
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '@libs/cloudinary.js';
import { CLOUDINARY_FOLDER_NAME } from 'constants/index.js';
import { getSocketIO } from 'socket/socket.instance.js';
import { env } from '@config/env.js';
import { analyzeBlog } from '@libs/blogReviewer.js';

class AdminBlogController {
  async getAdminBlogPage(req: Request, res: Response) {
    try {
      Logger.info('Getting admin blog page...');

      const adminId = req?.user?._id;
      // Set up pagination
      const page = Number(req.query.page) || 1;
      const limit = 8;
      const options = {
        page,
        limit,
      };

      /**
       * Get blogs from the db,
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [blogs, notifications, totalNotifications, totalUnreadNotifications] =
        await Promise.all([
          blogModel.aggregatePaginate(
            blogModel.aggregate([
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
                  likes: 0,
                  comments: 0,
                  bookmarks: 0,
                },
              },
              {
                $sort: { createdAt: -1 },
              },
            ]),
            options,
          ),
          notificationModel.find({ recipientId: adminId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({
            recipientId: adminId,
          }),
          notificationModel.countDocuments({
            recipientId: adminId,
            isRead: false,
          }),
        ]);

      Logger.info('Blogs fetched successfully');

      return res.render('admin/blogs', {
        title: 'Admin | Blogs',
        pageTitle: 'Admin Blogs',
        currentPath: '/admins/blogs',
        admin: req?.user,
        blogs,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/blogs');
    }
  }

  async getAdminCreateBlogPage(req: Request, res: Response) {
    try {
      Logger.info('Creating blog...');

      const adminId = req?.user?._id;

      /**
       * Get all existing categories
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [categories, notifications, totalNotifications, totalUnreadNotifications] =
        await Promise.all([
          categoryModel.find({ isDeleted: false }),
          notificationModel.find({ recipientId: adminId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({ recipientId: adminId }),
          notificationModel.countDocuments({ recipientId: adminId, isRead: false }),
        ]);

      return res.render('admin/create-blog', {
        title: 'Admin | Create Blog',
        pageTitle: 'Create Blog',
        currentPath: '/admins/blogs',
        admin: req.user,
        categories,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/auth/login');
    }
  }

  async getAdminBlogUpdatePage(req: Request, res: Response) {
    try {
      Logger.info(`Updating blog with id: ${req.params.id}`);

      /**
       * Get adminId from the request
       * Get blogId from the request
       */
      const adminId = req?.user?._id;
      const blogId = req.params.id;

      /**
       * Get blog details
       * Get all existing categories
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [blog, categories, notifications, totalNotifications, totalUnreadNotifications] =
        await Promise.all([
          blogModel.findById(blogId).populate({
            path: 'authorId',
            select: 'username',
          }),
          categoryModel.find({ isDeleted: false }),
          notificationModel.find({ recipientId: adminId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({ recipientId: adminId }),
          notificationModel.countDocuments({ recipientId: adminId, isRead: false }),
        ]);

      if (!blog) {
        throw new Error('Blog not found with this Id');
      }

      Logger.info('Blog detail fetched successfully');

      return res.render('admin/update-blog', {
        title: 'Admin | Update Blog',
        pageTitle: 'Update Blog',
        currentPath: '/admins/blogs',
        admin: req.user,
        blog,
        categories,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/blogs');
    }
  }

  async createBlogHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating blog...');

      const adminId = req?.user?._id;

      const { title, excerpt, content, categories, tags } = req.body;
      const coverImageLocalFilePath = req?.file?.path;

      // Check if local file path is not found
      if (!coverImageLocalFilePath) {
        throw new Error('Please change your cover image and try again');
      }

      const textOnlyContent = (content || '').replace(/<[^>]*>/g, '').trim();
      if (!textOnlyContent) {
        throw new Error('Blog content cannot be empty');
      }

      const isTechBlog = await analyzeBlog({
        title,
        excerpt,
        content: textOnlyContent,
      });

      if (!isTechBlog || !isTechBlog?.isTechRelated) {
        throw new Error('Blog is not tech related please provide tech related content');
      }

      // Upload cover image to cloudinary
      const cloudinaryResponse = await uploadOnCloudinary({
        localFilePath: coverImageLocalFilePath,
        resourceType: CloudinaryResourceType.IMAGE,
        uploadFolder: `${CLOUDINARY_FOLDER_NAME}/blog/coverImage`,
      });
      if (!cloudinaryResponse) {
        Logger.warn('Uploading cover image to cloudinary failed');
        throw new Error('Something went wrong please try again');
      }

      // Create a blog
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
        authorId: adminId,
        status: {
          adminApprovalStatus: BlogApprovalStatus.APPROVED,
          publisherApprovalStatus: BlogApprovalStatus.APPROVED,
          adminApproved: true,
          publisherIsPublished: true,
          adminApprovedAt: new Date(Date.now()),
          publisherApproved: true,
          adminIsPublished: true,
        },
        publisherId: adminId,
        publishedAt: new Date(Date.now()),
      });
      if (!newBlog) {
        throw new Error('Failed to create blog, please try again');
      }

      req.flash('success', 'Blog created successfully');
      return res.redirect('/admins/blogs');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/blogs');
    } finally {
      if (req?.file && req.file?.path) {
        try {
          fs.unlink(req.file.path);
          Logger.info('Local file path deleted successfully');
        } catch (error) {
          Logger.error(`Local file path deleted failed: ${(error as Error).message}`);
        }
      }
    }
  }

  async approveBlogHandlerByAdmin(req: Request, res: Response) {
    try {
      const blogId = req.params.id;
      const approval = req.body.status?.approval;

      Logger.info(`Approving blog: ${blogId} with status: ${approval}`);

      const adminId = req?.user?._id;

      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(approval)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid approval status',
        });
      }

      const updateData: any = {
        'status.adminApprovalStatus': approval,
        'status.adminApproved': approval === BlogApprovalStatus.APPROVED,
        'status.adminApprovedAt': approval === BlogApprovalStatus.APPROVED ? new Date() : null,
        'status.adminIsPublished': approval === BlogApprovalStatus.APPROVED,
        'status.adminRejectionReason':
          approval === BlogApprovalStatus.REJECTED ? req.body.reason || 'Rejected by Admin' : null,
        'status.rejectedBy.admin': approval === BlogApprovalStatus.REJECTED ? adminId : null,
      };

      const blog = await blogModel.findByIdAndUpdate(blogId, updateData, { new: true });

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found',
        });
      }

      Logger.info(`Blog status updated successfully: ${blog.status.adminApprovalStatus}`);

      return res.status(200).json({
        success: true,
        message: 'Blog status updated successfully',
        data: {
          id: blog._id,
          approval: blog.status.adminApprovalStatus,
        },
      });
    } catch (error) {
      Logger.error((error as Error).message);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async updateBlogHandler(req: Request, res: Response) {
    try {
      Logger.info('Update blog handler calling...');

      const adminId = req?.user?._id;

      // Get blogId, coverImage, data from the frontend
      const blogId = req.params.id;
      const coverImageLocalFilePath = req.file?.path;
      const data = req.body;

      // Check blog is already exits or not
      const blog = await blogModel.findById(blogId);
      if (!blog) {
        throw new Error('Blog not found');
      }

      blog.title = data.title;
      blog.excerpt = data.excerpt;
      blog.content = data.content;
      blog.tags = data.tags ? data.tags.split(',').map((t: string) => t.trim()) : [];

      if (data.categories) {
        blog.categories = Array.isArray(data.categories) ? data.categories : [data.categories];
      }

      // COVER IMAGE
      if (coverImageLocalFilePath) {
        const uploaded = await uploadOnCloudinary({
          localFilePath: coverImageLocalFilePath,
          resourceType: CloudinaryResourceType.IMAGE,
          uploadFolder: `${CLOUDINARY_FOLDER_NAME}/blog/coverImage`,
        });

        // DELETE OLD IMAGE
        if (blog.coverImage.publicId) {
          await deleteFromCloudinary(blog?.coverImage?.publicId);
          Logger.info('Previous cover image deleted from the cloudinary');
        }

        blog.coverImage = {
          publicId: uploaded.public_id,
          url: uploaded.secure_url,
        };
      }

      // ADMIN APPROVAL
      if (data.adminApproved === 'on') {
        blog.status.adminApproved = true;
        blog.status.adminApprovedAt = new Date();
        blog.status.adminApprovalStatus = BlogApprovalStatus.APPROVED;
        blog.status.rejectedBy.admin = undefined;
        blog.status.adminRejectionReason = undefined;
      } else {
        blog.status.adminApproved = false;
      }

      if (data.isPublished === 'on') {
        blog.status.adminIsPublished = true;

        if (!blog.publishedAt) {
          blog.publishedAt = new Date();
        }
      } else {
        blog.status.adminIsPublished = false;
      }

      if (data.rejectionReason) {
        blog.status.adminApprovalStatus = BlogApprovalStatus.REJECTED;
        blog.status.rejectedBy.admin = adminId;
        blog.status.adminRejectionReason = data.rejectionReason || 'admin rejected';
        blog.status.adminIsPublished = false;
      }

      blog.updatedAt = new Date();

      await blog.save();

      req.flash('success', 'Blog updated successfully');
      return res.redirect(`/admins/blogs/${blogId}/edit`);
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect(`/admins/blogs/${req.params.id}/edit`);
    } finally {
      if (req?.file && req?.file?.path) {
        try {
          fs.unlink(req.file.path);
          Logger.info('Local file path deleted successfully');
        } catch (error) {
          Logger.error(`Local file path deleted failed: ${(error as Error).message}`);
        }
      }
    }
  }

  async deleteBlogHandler(req: Request, res: Response) {
    try {
      Logger.info('Delete blog handler calling...');

      const blogId = req.params?.id;

      const blog = await blogModel.findByIdAndDelete(blogId);
      if (!blog) {
        throw new Error('Blog not found');
      }

      // DELETE IMAGES FROM THE CLOUDINARY
      if (blog?.coverImage?.publicId) {
        await deleteFromCloudinary(blog.coverImage.publicId);
        Logger.warn('Cover image deleted from the cloudinary');
      }

      req.flash('success', 'Blog deleted successfully');
      return res.redirect('/admins/blogs');
    } catch (error) {
      Logger.error((error as Error).message);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/blogs');
    }
  }
}

export default new AdminBlogController();
