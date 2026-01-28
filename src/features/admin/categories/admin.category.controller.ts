import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import notificationModel from 'models/notification.model.js';
import categoryModel from 'models/category.model.js';

class AdminCategoryController {
  async getCategoryPage(req: Request, res: Response) {
    try {
      Logger.info('Getting category page...');

      const page = Number(req.query.page) || 1;
      const limit = 8;

      if (!req.user) {
        Logger.warn('Request user not found');
        req.flash('error', 'Request user not found please try again');
        return res.redirect('/admin/auth/login');
      }

      const aggregate = categoryModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: 'blogs',
            localField: '_id',
            foreignField: 'categoryId',
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

      const categories = await categoryModel.aggregatePaginate(aggregate, {
        page,
        limit,
      });

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

      return res.render('admin/categories', {
        title: 'Manage Categories',
        pageTitle: 'Manage Categories',
        currentPath: '/admin/categories',
        admin: req.user,
        categories,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/admin/categories');
    }
  }

  async createCategoryHandler(req: Request, res: Response) {
    try {
      Logger.info('Creating category...');

      if (!req.user) {
        Logger.warn('Request user not found');

        req.flash('error', 'Request user not found please try again');
        return res.redirect('/admin/auth/login');
      }

      const { name } = req.body;

      const newCategory = await categoryModel.create({
        name,
        slug: `${name
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase()}-${Date.now()}`,
        createdBy: req.user._id,
      });
      if (!newCategory) {
        Logger.warn('Failed to create a new category');

        req.flash('error', 'Failed to create a new category');
        return res.redirect('/admin/categories');
      }

      req.flash('success', 'Category created successfully');
      return res.redirect('/admin/categories');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/categories');
    }
  }

  async updateCategoryController(req: Request, res: Response) {
    try {
      Logger.info('Updating category...');

      if (!req.user) {
        Logger.warn('Request user not found');

        req.flash('error', 'Request user not found please try again');
        return res.redirect('/admin/auth/login');
      }

      const { id } = req.params;
      if (!id) {
        Logger.warn('Category id not found');

        req.flash('error', 'Category id not found');
        return res.redirect('/admin/categories');
      }

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
        Logger.warn('Failed to update a category');

        req.flash('error', 'Failed to update a category');
        return res.redirect('/admin/categories');
      }

      req.flash('success', 'Category updated successfully');
      return res.redirect('/admin/categories');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/categories');
    }
  }
  async deleteCategoryHandler(req: Request, res: Response) {
    try {
      Logger.info('Deleting category...');

      if (!req.user) {
        Logger.warn('Request user not found');

        req.flash('error', 'Request user not found please try again');
        return res.redirect('/admin/auth/login');
      }

      const { id } = req.params;
      if (!id) {
        Logger.warn('Category id not found');

        req.flash('error', 'Category id not found');
        return res.redirect('/admin/categories');
      }

      const deletedCategory = await categoryModel.findOneAndDelete({
        _id: id,
        isDeleted: false,
      });
      if (!deletedCategory) {
        Logger.warn('Failed to delete a category');

        req.flash('error', 'Failed to delete a category');
        return res.redirect('/admin/categories');
      }

      req.flash('success', 'Category deleted successfully');
      return res.redirect('/admin/categories');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/categories');
    }
  }
}

export default new AdminCategoryController();
