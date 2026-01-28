/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import blogModel, { BlogApprovalStatus } from 'models/blog.model.js';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';
import categoryModel from 'models/category.model.js';
import {
  CloudinaryResourceType,
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '@libs/cloudinary.js';
import { CLOUDINARY_FOLDER_NAME } from 'constants/index.js';

class AdminBlogController {
  async getAdminBlogPage(req: Request, res: Response) {
    try {
      Logger.info('Getting admin blog page...');

      if (!req.user) {
        Logger.warn('User not found');

        req.flash('error', 'Unauthorized access please login');
        return res.redirect('/admin/auth/login');
      }

      const page = Number(req.query.page) || 1;
      const limit = 8;

      const options = {
        page,
        limit,
      };

      const blogs = await blogModel.aggregatePaginate(
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
      );

      const notifications = await notificationModel
        .find({ recipientId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });

      return res.render('admin/blogs', {
        title: 'Admin | Blogs',
        pageTitle: 'Admin Blogs',
        currentPath: '/admin/blogs',
        admin: req.user,
        blogs,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/blogs');
    }
  }

  async getAdminCreateBlogPage(req: Request, res: Response) {
    try {
      Logger.info('Creating blog...');
      if (!req.user) {
        Logger.warn('Admin not found');

        req.flash('error', 'Unauthorized access please try again');
        return res.redirect('/admin/auth/login');
      }

      const adminId = req.user?._id;

      const categories = await categoryModel.find({ isDeleted: false });
      if (!categories) return res.redirect('/admin/blogs/create');

      const notifications = await notificationModel.find({
        recipientId: adminId,
      });

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: adminId,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: adminId,
        isRead: false,
      });
      return res.render('admin/create-blog', {
        title: 'Admin | Create Blog',
        pageTitle: 'Create Blog',
        currentPath: '/admin/blogs',
        admin: req.user,
        categories,
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

  async getAdminBlogUpdatePage(req: Request, res: Response) {
    try {
      Logger.info(`Updating blog with id: ${req.params.id}`);

      if (!req.user) {
        Logger.warn('Admin not found');

        req.flash('error', 'Unauthorized access please try again');
        return res.redirect('/admin/auth/login');
      }

      const adminId = req.user?._id;
      const blogId = req.params.id;

      // Get blog
      const blog = await blogModel.findById(blogId).populate({
        path: 'authorId',
        select: 'username',
      });
      if (!blog) {
        Logger.warn('Blog not found');

        req.flash('error', 'Blog not found');
        return res.redirect('/admin/blogs');
      }

      // Get all categories
      const categories = await categoryModel.find({ isDeleted: false });

      const notifications = await notificationModel
        .find({
          recipientId: adminId,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: adminId,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: adminId,
        isRead: false,
      });

      return res.render('admin/update-blog', {
        title: 'Admin | Update Blog',
        pageTitle: 'Update Blog',
        currentPath: '/admin/blogs',
        admin: req.user,
        blog,
        categories,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/blogs');
    }
  }

  async createBlogHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating blog...');

      if (!req.user) {
        Logger.warn('Admin not found');

        req.flash('error', 'Unauthorized access please try again');
        return res.redirect('/admin/auth/login');
      }

      const adminId = req.user?._id;

      const { title, excerpt, content, categories, tags } = req.body;
      const coverImageLocalFilePath = req.file?.path;

      // 1.Check if local file path is not found
      if (!coverImageLocalFilePath) {
        Logger.warn('User id or cover image local file path not found');

        req.flash('error', 'Please change your cover image and try again');
        return res.redirect('/admin/blogs/create');
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
        return res.redirect('/admin/blogs/create');
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
      });
      if (!newBlog) {
        Logger.warn('Failed to create blog');

        req.flash('error', 'Failed to create blog, please try again');
        return res.redirect('/admin/blogs/create');
      }

      req.flash('success', 'Blog created successfully');
      return res.redirect('/admin/blogs');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/blogs');
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

  async approveBlogHandlerByAdmin(req: Request, res: Response) {
    try {
      const blogId = req.params.id;
      const approval = req.body.status?.approval;

      Logger.info(`Approving blog: ${blogId} with status: ${approval}`);

      if (!req.user) {
        throw new Error('Unauthorized access');
      }

      const adminId = req.user._id;

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

      if (!req.user) {
        throw new Error('Unauthorized access');
      }

      const adminId = req.user._id;

      // 1. Get blogId, coverImage, data from the frontend
      const blogId = req.params.id;
      const coverImageLocalFilePath = req.file?.path;
      const data = req.body;

      // 2. Check blog is already exits or not
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
          await deleteFromCloudinary(blog.coverImage.publicId);
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
      return res.redirect(`/admin/blogs/${blogId}/edit`);
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect(`/admin/blogs/${req.params.id}/edit`);
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

  async deleteBlogHandler(req: Request, res: Response) {
    try {
      Logger.info('Delete blog handler calling...');

      const blogId = req.params.id;

      const blog = await blogModel.findByIdAndDelete(blogId);
      if (!blog) {
        Logger.warn('Blog not found');

        req.flash('error', 'Blog not found');
        return res.redirect('/admin/blogs');
      }

      // DELETE IMAGES FROM THE CLOUDINARY
      if (blog.coverImage.publicId) {
        await deleteFromCloudinary(blog.coverImage.publicId);
        Logger.warn('Cover image deleted from the cloudinary');
      }

      req.flash('success', 'Blog deleted successfully');
      return res.redirect('/admin/blogs');
    } catch (error) {
      Logger.error((error as Error).message);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/blogs');
    }
  }
}

export default new AdminBlogController();
