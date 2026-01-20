import Logger from '@config/logger.js';
import { Request, Response } from 'express';
class UserBookmarksController {
  async renderUserBookmarksPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user profile page...');

      return res.render('users/bookmarks', {
        title: 'User | Bookmarks',
        pageTitle: 'User Bookmarks',
        user: req.user,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/users/dashboard');
    }
  }
}

export default new UserBookmarksController();
