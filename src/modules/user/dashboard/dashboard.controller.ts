import type { Request, Response } from 'express';
import Logger from '@config/logger.js';

class UserDashboard {
  async renderUserDashboard(req: Request, res: Response) {
    try {
      Logger.info('Getting user dashboard...');

      return res.render('users/dashboard', {
        title: 'User | Dashboard',
        pageTitle: 'User Dashboard',
        user: {
          username: 'Susovan',
          email: 'susovan@gmail',
          avatar: {
            url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
          },
          role: 'user',
        },
        stats: {
          publishers: 12,
          users: 340,
          blogs: 89,
          pending: 5,
        },
        notificationsCount: 3,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/login');
    }
  }
}

export default new UserDashboard();
