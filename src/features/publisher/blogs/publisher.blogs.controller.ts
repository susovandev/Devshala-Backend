import { Request, Response } from 'express';
import fs from 'node:fs/promises';
import Logger from '@config/logger.js';
import blogModel, { BlogApprovalStatus } from 'models/blog.model.js';
import notificationModel from 'models/notification.model.js';
import categoryModel from 'models/category.model.js';
import {
  CloudinaryResourceType,
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '@libs/cloudinary.js';
import { CLOUDINARY_FOLDER_NAME } from 'constants/index.js';

class PublisherBlogController {
  async getPublisherBlogsPage(req: Request, res: Response) {
    try {
      Logger.info('Getting publisher blog page...');

      if (!req.user) {
        Logger.warn('User not found');

        req.flash('error', 'Unauthorized access please login');
        return res.redirect('/publishers/auth/login');
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

      return res.render('publishers/blogs', {
        title: 'Publisher | Blogs',
        pageTitle: 'Publisher Blogs',
        currentPath: '/publishers/blogs',
        publisher: req.user,
        blogs,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/blogs');
    }
  }

  async getPublisherBlogUpdatePage(req: Request, res: Response) {
    try {
      Logger.info(`Updating blog with id: ${req.params.id}`);

      if (!req.user) {
        Logger.warn('Publisher not found');

        req.flash('error', 'Unauthorized access please try again');
        return res.redirect('/publishers/auth/login');
      }

      const publisherId = req.user?._id;
      const blogId = req.params.id;

      // Get blog
      const blog = await blogModel.findById(blogId).populate({
        path: 'authorId',
        select: 'username',
      });
      if (!blog) {
        Logger.warn('Blog not found');

        req.flash('error', 'Blog not found');
        return res.redirect('/publisherId/blogs');
      }

      // Get all categories
      const categories = await categoryModel.find({ isDeleted: false });

      const notifications = await notificationModel
        .find({
          recipientId: publisherId,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: publisherId,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: publisherId,
        isRead: false,
      });

      return res.render('publishers/update-blog', {
        title: 'Publisher | Update Blog',
        pageTitle: 'Update Blog',
        currentPath: '/publisher/blogs',
        publisher: req.user,
        blog,
        categories,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/blogs');
    }
  }
  async approveBlogHandlerByPublisher(req: Request, res: Response) {
    try {
      const blogId = req.params.id;
      const approval = req.body.status?.approval;

      Logger.info(`Approving blog: ${blogId} with status: ${approval}`);

      if (!req.user) {
        throw new Error('Unauthorized access');
      }

      const publisherId = req.user._id;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        'status.publisherApprovalStatus': approval,
        'status.publisherApproved': approval === BlogApprovalStatus.APPROVED,
        'status.publisherApprovedAt': approval === BlogApprovalStatus.APPROVED ? new Date() : null,
        'status.publisherIsPublished': approval === BlogApprovalStatus.APPROVED,
        'status.publisherRejectionReason':
          approval === BlogApprovalStatus.REJECTED
            ? req.body.reason || 'Rejected by publisher'
            : null,
        'status.rejectedBy.publisher':
          approval === BlogApprovalStatus.REJECTED ? publisherId : null,
        publishedAt: approval === BlogApprovalStatus.APPROVED ? new Date() : null,
      };

      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(approval)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid approval status',
        });
      }

      const blog = await blogModel.findByIdAndUpdate(blogId, updateData, { new: true });

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found',
        });
      }

      Logger.info(`Blog status updated successfully: ${blog.status.publisherApprovalStatus}`);

      return res.status(200).json({
        success: true,
        message: 'Blog status updated successfully',
        data: {
          id: blog._id,
          approval: blog.status.publisherApprovalStatus,
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
        throw new Error('Unauthorized');
      }

      const publisherId = req.user._id;

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
      if (data.publisherApproved === 'on') {
        blog.status.publisherApproved = true;
        blog.status.publisherApprovedAt = new Date();
        blog.status.publisherApprovalStatus = BlogApprovalStatus.APPROVED;
        blog.status.rejectedBy.publisher = undefined;
        blog.status.publisherRejectionReason = undefined;
      } else {
        blog.status.publisherApproved = false;
      }

      if (data.isPublished === 'on') {
        blog.status.publisherIsPublished = true;

        if (!blog.publishedAt) {
          blog.publishedAt = new Date();
        }
      } else {
        blog.status.publisherIsPublished = false;
      }

      if (data.rejectionReason) {
        blog.status.publisherApprovalStatus = BlogApprovalStatus.REJECTED;
        blog.status.rejectedBy.publisher = publisherId;
        blog.status.publisherRejectionReason = data.rejectionReason;
        blog.status.publisherIsPublished = false;
      }

      blog.updatedAt = new Date();

      await blog.save();

      req.flash('success', 'Blog updated successfully');
      return res.redirect(`/publishers/blogs/${blogId}/edit`);
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect(`/publishers/blogs/${req.params.id}/edit`);
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
}

export default new PublisherBlogController();
