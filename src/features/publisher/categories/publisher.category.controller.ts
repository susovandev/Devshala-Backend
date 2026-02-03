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
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/categories');
    }
  }

  async createCategoryHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating category...');

      if (!req.user) {
        Logger.warn('Request user not found');

        req.flash('error', 'Request user not found please try again');
        return res.redirect('/publishers/auth/login');
      }

      const { name } = req.body;

      const newCategory = await categoryModel.create({
        name,
        slug: name.toLowerCase().trim().replace(/\s+/g, '-'),
        createdBy: req.user._id,
      });
      if (!newCategory) {
        Logger.warn('Failed to create a new category');

        req.flash('error', 'Failed to create a new category');
        return res.redirect('/publishers/categories');
      }

      req.flash('success', 'Category created successfully');
      return res.redirect('/publishers/categories');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/categories');
    }
  }

  async updateCategoryController(req: Request, res: Response) {
    try {
      Logger.info('Updating category...');

      if (!req.user) {
        Logger.warn('Request user not found');

        req.flash('error', 'Request user not found please try again');
        return res.redirect('/publishers/auth/login');
      }

      const { id } = req.params;
      if (!id) {
        Logger.warn('Category id not found');

        req.flash('error', 'Category id not found');
        return res.redirect('/publishers/categories');
      }

      const { name } = req.body;

      const updatedCategory = await categoryModel.findOneAndUpdate(
        {
          _id: id,
          createdBy: req.user._id,
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
        Logger.warn('Failed to update a category');

        req.flash('error', 'Failed to update a category');
        return res.redirect('/publishers/categories');
      }

      req.flash('success', 'Category updated successfully');
      return res.redirect('/publishers/categories');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/categories');
    }
  }
  async deleteCategoryHandler(req: Request, res: Response) {
    try {
      Logger.info('Deleting category...');

      if (!req.user) {
        Logger.warn('Request user not found');

        req.flash('error', 'Request user not found please try again');
        return res.redirect('/publishers/auth/login');
      }

      const { id } = req.params;
      if (!id) {
        Logger.warn('Category id not found');

        req.flash('error', 'Category id not found');
        return res.redirect('/publishers/categories');
      }

      const deletedCategory = await categoryModel.findOneAndDelete({
        _id: id,
        createdBy: req.user._id,
        isDeleted: false,
      });
      if (!deletedCategory) {
        Logger.warn('Failed to delete a category');

        req.flash('error', 'Failed to delete a category');
        return res.redirect('/publishers/categories');
      }

      req.flash('success', 'Category deleted successfully');
      return res.redirect('/publishers/categories');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/categories');
    }
  }
}

export default new PublisherCategoryController();
