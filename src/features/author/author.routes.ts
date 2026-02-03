import { Router } from 'express';
import authorAuthRoutes from './auth/author.auth.routes.js';
import authorProfileRoutes from './profile/author.profile.routes.js';
import authorBlogsRoutes from './blogs/author.blogs.routes.js';
import authorDashboardRoutes from './dashboard/author.dashboard.routes.js';
import authorNotificationRoutes from './notifications/author.notification.routes.js';
import authorLeaderBoardRoutes from './leaderboard/author.leaderboard.routes.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';

const authorRouter: Router = Router();

authorRouter.use('/auth', authorAuthRoutes);

authorRouter.use(AuthGuardEJS);
authorRouter.use(RoleGuardEJS(UserRole.AUTHOR));

authorRouter.use('/profile', authorProfileRoutes);
authorRouter.use('/dashboard', authorDashboardRoutes);
authorRouter.use('/blogs', authorBlogsRoutes);
authorRouter.use('/notifications', authorNotificationRoutes);
authorRouter.use('/leaderboard', authorLeaderBoardRoutes);

export { authorRouter };
