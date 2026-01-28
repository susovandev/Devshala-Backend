import type { Request, Response } from 'express';
import Logger from '@config/logger.js';

class PublisherDashboard {
  async renderPublisherDashboard(req: Request, res: Response) {
    try {
      Logger.info('Getting user dashboard...');

      if (!req.user) {
        Logger.error('Publisher not found');
        req.flash('error', 'Publisher not found please try again');
        return res.redirect('/publishers/auth/login');
      }

      return res.render('publishers/dashboard', {
        title: 'Publisher | Dashboard',
        pageTitle: 'Publisher Dashboard',
        user: req.user,
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
      return res.redirect('/publishers/auth/login');
    }
  }
}

export default new PublisherDashboard();
