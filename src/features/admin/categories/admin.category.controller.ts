import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';
import categoryModel from 'models/category.model.js';

class AdminCategoryController {
  async getCategoryPage(req: Request, res: Response) {
    try {
      Logger.info('Getting category page...');

      const adminId = req?.user?._id;

      // Setup pagination
      const page = Number(req.query.page) || 1;
      const limit = 8;

      const aggregate = categoryModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: 'blogs',
            localField: '_id',
            foreignField: 'categories',
            as: 'blogs',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
          },
        },
        {
          $unwind: '$createdBy',
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
            _id: 1,
            name: 1,
            slug: 1,
            blogCount: 1,
            createdAt: 1,
            createdBy: {
              _id: 1,
              role: 1,
            },
          },
        },
      ]);

      /**
       * Get categories with blog count
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
          notificationModel.find({ recipientId: adminId }).sort({ createdAt: -1 }).limit(8).lean(),
          notificationModel.countDocuments({ recipientId: adminId }),
          notificationModel.countDocuments({ recipientId: adminId, isRead: false }),
        ]);

      return res.render('admin/categories', {
        title: 'Manage Categories',
        pageTitle: 'Manage Categories',
        currentPath: '/admins/categories',
        admin: req.user,
        categories,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/categories');
    }
  }

  async createCategoryHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating category...');

      const adminId = req?.user?._id;

      const { name } = req.body;

      const newCategory = await categoryModel.create({
        name,
        slug: `${name
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase()}-${Date.now()}`,
        createdBy: adminId,
      });
      if (!newCategory) {
        throw new Error('Failed to create a new category');
      }

      req.flash('success', 'Category created successfully');
      return res.redirect('/admins/categories');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/categories');
    }
  }

  async updateCategoryController(req: Request, res: Response) {
    try {
      Logger.info('Updating category...');

      const { id } = req.params;
      const { name } = req.body;

      const updatedCategory = await categoryModel.findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          name,
          slug: `${name
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()}-${Date.now()}`,
        },
        {
          new: true,
        },
      );
      if (!updatedCategory) {
        throw new Error('Failed to update a category with this ID');
      }

      req.flash('success', 'Category updated successfully');
      return res.redirect('/admins/categories');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/categories');
    }
  }

  async deleteCategoryHandler(req: Request, res: Response) {
    try {
      Logger.info('Deleting category...');

      const { id } = req.params;

      const deletedCategory = await categoryModel.findOneAndDelete({
        _id: id,
        isDeleted: false,
      });
      if (!deletedCategory) {
        throw new Error('Failed to delete a category');
      }

      req.flash('success', 'Category deleted successfully');
      return res.redirect('/admins/categories');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/categories');
    }
  }
}

export default new AdminCategoryController();
