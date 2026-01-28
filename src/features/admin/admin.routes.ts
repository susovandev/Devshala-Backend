import { Router } from 'express';
import adminAuthRoutes from './auth/admin.auth.routes.js';
import adminDashboardRoutes from './dashboard/admin.dashboard.routes.js';
import adminPublisherRoutes from './publishers/publisher.routes.js';
import adminUserRoutes from './user/admin.user.routes.js';
import adminProfileRoutes from './profile/admin.profile.routes.js';
import adminCategoriesRoutes from './categories/admin.category.routes.js';
import adminBlogRoutes from './blog/admin.blog.routes.js';
import adminCommentsRoutes from './comments/admin.comment.routes.js';
import adminNotificationRoutes from './notifications/admin.notification.routes.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';

const adminRouter: Router = Router();

adminRouter.use('/auth', adminAuthRoutes);

adminRouter.use(AuthGuardEJS);
adminRouter.use(RoleGuardEJS(UserRole.ADMIN));

adminRouter.use('/profile', adminProfileRoutes);
adminRouter.use('/dashboard', adminDashboardRoutes);
adminRouter.use('/publishers', adminPublisherRoutes);
adminRouter.use('/users', adminUserRoutes);
adminRouter.use('/categories', adminCategoriesRoutes);
adminRouter.use('/blogs', adminBlogRoutes);
adminRouter.use('/comments', adminCommentsRoutes);
adminRouter.use('/notifications', adminNotificationRoutes);

export { adminRouter };
