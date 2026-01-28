import { Router } from 'express';
import publisherAuthRoutes from './auth/publisher.auth.routes.js';
import publisherProfileRoutes from './profile/publisher.profile.routes.js';
import publisherCategoryRoutes from './categories/publisher.category.routes.js';
import publisherDashboardRoutes from './dashboard/publisher.dashboard.routes.js';
import publisherAuthorRoutes from './author/publisher.author.routes.js';
import publisherBlogRoutes from './blogs/publisher.blogs.routes.js';
import publisherNotificationRoutes from './notifications/publisher.notification.routes.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';

const publisherRouter: Router = Router();

publisherRouter.use('/auth', publisherAuthRoutes);

publisherRouter.use(AuthGuardEJS);
publisherRouter.use(RoleGuardEJS(UserRole.PUBLISHER));

publisherRouter.use('/profile', publisherProfileRoutes);
publisherRouter.use('/dashboard', publisherDashboardRoutes);
publisherRouter.use('/categories', publisherCategoryRoutes);
publisherRouter.use('/author/manage', publisherAuthorRoutes);
publisherRouter.use('/blogs', publisherBlogRoutes);
publisherRouter.use('/notifications', publisherNotificationRoutes);

export { publisherRouter };
