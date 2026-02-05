import mongoose from 'mongoose';
import { Request, Response } from 'express';
import categoryModel from 'models/category.model.js';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';

class PublisherCategoryController {
  async getCategoryPage(req: Request, res: Response) {
    try {
      Logger.info('Getting category page...');

      // Setup Pagination
      const page = Number(req.query.page) || 1;
      const limit = 8;

      const publisherId = req?.user?._id;

      const aggregate = categoryModel.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(publisherId), isDeleted: false } },
        {
          $lookup: {
            from: 'blogs',
            localField: '_id',
            foreignField: 'categories',
            as: 'blogs',
          },
        },
        {
          $addFields: {
            blogCount: { $size: '$blogs' },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $project: {
            blogs: 0,
            createdBy: 0,
            isDeleted: 0,
            isActive: 0,
            updatedAt: 0,
          },
        },
      ]);

      /**
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [categories, notifications, totalNotifications, totalUnreadNotifications] =
        await Promise.all([
          categoryModel.aggregatePaginate(aggregate, {
            page,
            limit,
          }),
          notificationModel
            .find({ recipientId: publisherId })
            .sort({ createdAt: -1 })
            .limit(8)
            .lean(),
          notificationModel.countDocuments({ recipientId: publisherId }),
          notificationModel.countDocuments({ recipientId: publisherId, isRead: false }),
        ]);

      // console.log(`Categories: ${JSON.stringify(categories, null, 2)}`);

      return res.render('publishers/categories', {
        title: 'Manage Categories',
        pageTitle: 'Manage Categories',
        currentPath: '/publishers/categories',
        publisher: req?.user,
        categories,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/categories');
    }
  }

  async createCategoryHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating category...');

      const publisherId = req?.user?._id;
      const { name } = req.body;

      const newCategory = await categoryModel.create({
        name,
        slug: name.toLowerCase().trim().replace(/\s+/g, '-'),
        createdBy: publisherId,
      });

      req.flash('success', 'Category created successfully');
      return res.redirect('/publishers/categories');
    } catch (error: any) {
      Logger.error(error.message);
      if (error.code === 11000) {
        req.flash('error', 'Category already exists');
        return res.redirect('/publishers/categories');
      }
      req.flash('error', error.message);
      return res.redirect('/publishers/categories');
    }
  }

  async updateCategoryController(req: Request, res: Response) {
    try {
      Logger.info('Updating category...');

      const { id } = req.params;
      const publisherId = req?.user?._id;

      const { name } = req.body;

      const updatedCategory = await categoryModel.findOneAndUpdate(
        {
          _id: id,
          createdBy: publisherId,
          isDeleted: false,
        },
        {
          name,
          slug: name.toLowerCase().trim().replace(/\s+/g, '-'),
        },
        {
          new: true,
        },
      );
      if (!updatedCategory) {
        throw new Error('Failed to update a category');
      }

      req.flash('success', 'Category updated successfully');
      return res.redirect('/publishers/categories');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/categories');
    }
  }

  async deleteCategoryHandler(req: Request, res: Response) {
    try {
      Logger.info('Deleting category...');

      const { id } = req.params;
      const publisherId = req?.user?._id;

      const deletedCategory = await categoryModel.findOneAndDelete({
        _id: id,
        createdBy: publisherId,
        isDeleted: false,
      });
      if (!deletedCategory) {
        throw new Error('Failed to delete a category');
      }

      req.flash('success', 'Category deleted successfully');
      return res.redirect('/publishers/categories');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/categories');
    }
  }
}

export default new PublisherCategoryController();
