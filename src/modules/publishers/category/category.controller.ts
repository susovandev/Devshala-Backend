import type { Request, Response } from 'express';
import Logger from '@config/logger.js';

class PublisherCategoryController {
  async renderCategoriesPage(req: Request, res: Response) {
    try {
      Logger.info('Getting categories page...');

      return res.render('publishers/categories', {
        title: 'Publisher | Categories',
        pageTitle: 'Publisher Categories',
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/dashboard');
    }
  }
}

export default new PublisherCategoryController();
