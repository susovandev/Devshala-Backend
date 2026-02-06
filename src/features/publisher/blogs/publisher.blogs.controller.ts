import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import blogModel, { BlogApprovalStatus } from 'models/blog.model.js';
import notificationModel from 'models/notification.model.js';

class PublisherBlogController {
  async getPublisherBlogsPage(req: Request, res: Response) {
    try {
      Logger.info('Getting publisher blog page...');

      const publisherId = req?.user?._id;

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

      /**
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
        notificationModel
          .find({ recipientId: publisherId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
        notificationModel.countDocuments({ recipientId: publisherId }),
        notificationModel.countDocuments({ recipientId: publisherId, isRead: false }),
      ]);

      return res.render('publishers/blogs', {
        title: 'Publisher | Blogs',
        pageTitle: 'Publisher Blogs',
        currentPath: '/publishers/blogs',
        publisher: req?.user,
        blogs,
        notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/blogs');
    }
  }

  async approveBlogHandlerByPublisher(req: Request, res: Response) {
    try {
      const blogId = req.params.id;
      const approval = req.body.status?.approval;

      Logger.info(`Approving blog: ${blogId} with status: ${approval}`);

      const publisherId = req?.user?._id;

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

      req.flash(
        'success',
        `Blog status updated successfully: ${blog.status.publisherApprovalStatus}`,
      );
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
}

export default new PublisherBlogController();
