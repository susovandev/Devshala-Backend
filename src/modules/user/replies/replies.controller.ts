import Logger from '@config/logger.js';
import { Request, Response } from 'express';
class UserRepliesController {
  async renderUserRepliesPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user profile page...');

      return res.render('users/replies', {
        title: 'User | Replies',
        pageTitle: 'User Replies',
        user: req.user,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/users/dashboard');
    }
  }
}

export default new UserRepliesController();
